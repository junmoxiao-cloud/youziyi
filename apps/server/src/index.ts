import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApiResponse } from '@youziyi/types';
import { PrismaClient } from './generated/prisma';
import redisClient from './utils/redis';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient({ errorFormat: 'pretty' });

// 配置文件上传
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 基础中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// =======================
// 1. 健康检查接口
// =======================
app.get('/api/health', (req: Request, res: Response) => {
  const response: ApiResponse = {
    code: 0,
    data: {
      status: 'ok',
      timestamp: Date.now()
    },
    message: 'success'
  };
  res.json(response);
});

// =======================
// 2. 打卡同步接口
// =======================
app.post('/api/health/checkin', async (req: Request, res: Response) => {
  try {
    const { userId, mood, steps, heartRate, timestamp } = req.body;
    
    // 确保用户存在 (方便测试环境)
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: '默认测试用户',
          role: 'elder'
        }
      });
    }

    // 存入 Prisma
    const checkIn = await prisma.checkIn.create({
      data: {
        userId,
        mood: mood || 'calm',
        steps: Number(steps) || 0,
        heartRate: heartRate ? Number(heartRate) : null,
        timestamp: timestamp ? new Date(Number(timestamp)) : new Date(),
      }
    });

    // 更新用户的最后交互时间
    await prisma.user.update({
      where: { id: userId },
      data: { lastInteractionTime: new Date() }
    });

    // 更新 Redis (预警时间戳)
    await redisClient.set(`lastInteraction:${userId}`, Date.now());

    const response: ApiResponse = {
      code: 0,
      data: {
        recordId: checkIn.id,
        createdAt: checkIn.timestamp.getTime()
      },
      message: '打卡成功'
    };
    res.json(response);
  } catch (error) {
    console.error('Checkin Error:', error);
    res.status(500).json({ code: 500, data: null, message: '内部服务器错误' });
  }
});

// =======================
// 3. 状态预警接口
// =======================
app.get('/api/warning/status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // 从 Redis 读取
    let lastTime = await redisClient.get<number>(`lastInteraction:${userId}`);
    
    if (!lastTime) {
      // 降级：从数据库读取
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        lastTime = user.lastInteractionTime.getTime();
        await redisClient.set(`lastInteraction:${userId}`, lastTime);
      } else {
        lastTime = Date.now(); // 默认当前时间
      }
    }
    
    const now = Date.now();
    const hoursSinceLastInteraction = (now - lastTime) / (1000 * 60 * 60);
    
    let warningLevel = 0;
    if (hoursSinceLastInteraction >= 48) {
      warningLevel = 3;
    } else if (hoursSinceLastInteraction >= 36) {
      warningLevel = 2;
    } else if (hoursSinceLastInteraction >= 24) {
      warningLevel = 1;
    }
    
    const response: ApiResponse = {
      code: 0,
      data: {
        lastInteractionTime: lastTime,
        warningLevel,
        isTriggered: warningLevel > 0
      },
      message: 'success'
    };
    res.json(response);
  } catch (error) {
    console.error('Warning Status Error:', error);
    res.status(500).json({ code: 500, data: null, message: '内部服务器错误' });
  }
});

// =======================
// 4. 天气查询接口
// =======================
app.get('/api/weather/current', async (req: Request, res: Response) => {
  try {
    const cityCode = req.query.cityCode as string || 'beijing';
    
    // 调用 wttr.in 真实接口
    const fetchRes = await fetch(`https://wttr.in/${encodeURIComponent(cityCode)}?format=j1`);
    if (!fetchRes.ok) {
      throw new Error(`Weather API Error: ${fetchRes.status}`);
    }
    const data = await fetchRes.json();
    const current = data.current_condition[0];
    
    const temp = parseInt(current.temp_C, 10);
    const humidity = parseInt(current.humidity, 10);
    const desc = (current.weatherDesc[0]?.value || '').toLowerCase();
    
    let weatherType = 'sunny';
    if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) {
      weatherType = 'rainy';
    } else if (desc.includes('cloud') || desc.includes('overcast')) {
      weatherType = 'cloudy';
    } else if (desc.includes('snow') || desc.includes('ice') || desc.includes('blizzard')) {
      weatherType = 'snowy';
    }
    
    const response: ApiResponse = {
      code: 0,
      data: {
        cityCode,
        weatherType,
        temperature: temp,
        humidity: humidity
      },
      message: 'success'
    };
    res.json(response);
  } catch (error) {
    console.error('Weather API Error:', error);
    // 降级处理
    const response: ApiResponse = {
      code: 0,
      data: {
        cityCode: req.query.cityCode as string || 'default',
        weatherType: 'sunny',
        temperature: 20,
        humidity: 50
      },
      message: '降级为默认天气数据'
    };
    res.json(response);
  }
});

// =======================
// 5. 语音上传接口
// =======================
app.post('/api/voice/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { userId, storyId } = req.body;
    const file = req.file;
    
    if (!file) {
      // @ts-ignore
      return res.status(400).json({ code: 400, data: null, message: '未找到文件' });
    }
    
    // 构造访问 URL
    const url = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    
    // 确保用户存在
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: '默认测试用户',
          role: 'elder'
        }
      });
    }

    const voiceRecord = await prisma.voiceRecord.create({
      data: {
        url,
        duration: 10, // 演示默认 10 秒
        storyId: storyId || 'default-story',
        userId
      }
    });

    // 更新最后交互时间
    await prisma.user.update({
      where: { id: userId },
      data: { lastInteractionTime: new Date() }
    });
    await redisClient.set(`lastInteraction:${userId}`, Date.now());
    
    const response: ApiResponse = {
      code: 0,
      data: {
        voiceId: voiceRecord.id,
        url,
        duration: voiceRecord.duration
      },
      message: '上传成功'
    };
    res.json(response);
  } catch (error) {
    console.error('Voice Upload Error:', error);
    res.status(500).json({ code: 500, data: null, message: '内部服务器错误' });
  }
});

app.get('/api/voice/list/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const records = await prisma.voiceRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    const response: ApiResponse = {
      code: 0,
      data: {
        records: records.map(r => ({
          id: r.id,
          url: r.url,
          duration: r.duration,
          storyId: r.storyId,
          createdAt: r.createdAt.getTime()
        }))
      },
      message: 'success'
    };
    res.json(response);
  } catch (error) {
    console.error('Voice List Error:', error);
    res.status(500).json({ code: 500, data: null, message: '内部服务器错误' });
  }
});

// =======================
// Auth APIs
// =======================
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, password, role, cityCode } = req.body;
    
    if (!name || !password || !role) {
      return res.status(400).json({ code: 400, data: null, message: '缺少必填参数' });
    }
    
    const user = await prisma.user.create({
      data: {
        name,
        password,
        role,
        cityCode
      }
    });
    
    const response: ApiResponse = {
      code: 0,
      data: {
        userId: user.id,
        name: user.name,
        role: user.role
      },
      message: '注册成功'
    };
    res.json(response);
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ code: 500, data: null, message: '内部服务器错误' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ code: 400, data: null, message: '缺少必填参数' });
    }
    
    const users = await prisma.user.findMany({
      where: { name }
    });
    
    const user = users.find(u => u.password === password);
    
    if (!user) {
      return res.status(401).json({ code: 401, data: null, message: '用户名或密码错误' });
    }
    
    const response: ApiResponse = {
      code: 0,
      data: {
        userId: user.id,
        name: user.name,
        role: user.role,
        cityCode: user.cityCode
      },
      message: '登录成功'
    };
    res.json(response);
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ code: 500, data: null, message: '内部服务器错误' });
  }
});

// =======================
// Health Config & Confirm APIs
// =======================
app.post('/api/health/config', async (req: Request, res: Response) => {
  try {
    const { userId, metrics } = req.body;
    if (!userId || !metrics) {
      return res.status(400).json({ code: 400, data: null, message: '缺少必填参数' });
    }
    
    const config = await prisma.healthConfig.upsert({
      where: { userId },
      update: { metrics: JSON.stringify(metrics) },
      create: { userId, metrics: JSON.stringify(metrics) }
    });
    
    const response: ApiResponse = {
      code: 0,
      data: { configId: config.id, metrics: JSON.parse(config.metrics) },
      message: '配置保存成功'
    };
    res.json(response);
  } catch (error) {
    console.error('Config Error:', error);
    res.status(500).json({ code: 500, data: null, message: '内部服务器错误' });
  }
});

app.post('/api/health/confirm', async (req: Request, res: Response) => {
  try {
    const { userId, metricsData } = req.body;
    if (!userId || !metricsData) {
      return res.status(400).json({ code: 400, data: null, message: '缺少必填参数' });
    }
    
    const confirm = await prisma.dailyConfirm.create({
      data: {
        userId,
        metricsData: JSON.stringify(metricsData)
      }
    });
    
    // 更新最后交互时间
    await prisma.user.update({
      where: { id: userId },
      data: { lastInteractionTime: new Date() }
    });
    await redisClient.set(`lastInteraction:${userId}`, Date.now());
    
    const response: ApiResponse = {
      code: 0,
      data: { confirmId: confirm.id, createdAt: confirm.createdAt.getTime() },
      message: '打卡确认成功'
    };
    res.json(response);
  } catch (error) {
    console.error('Confirm Error:', error);
    res.status(500).json({ code: 500, data: null, message: '内部服务器错误' });
  }
});

// 启动服务
app.listen(port, () => {
  console.log(`[Server]: API server is running at http://localhost:${port}`);
});
