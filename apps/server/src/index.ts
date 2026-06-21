import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  ApiResponse,
  buildDailyHealthAggregates,
  BUSINESS_TIMEZONE,
  CheckInMetricsData,
  CheckInRecordSummary,
  CheckInResponse,
  createCheckInFormInitialValues,
  DailyHealthAggregatesResponse,
  formatBusinessDateKey,
  normalizeTrackedMetrics,
  resolveBusinessDayRange,
  resolveCheckInPeriod,
  resolveCityLabel,
  resolveTodayCheckInWindowPolicy,
  shiftBusinessDateKey,
  summarizeDailyCheckInRecords,
  TodayCheckInStatusResponse,
  VoiceListItem,
  VoiceListResponse,
  UserRole,
} from '@youziyi/types';
import { PrismaClient } from './generated/prisma';
import redisClient from './utils/redis';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient({ errorFormat: 'pretty' });

function formatVoiceTimeLabel(createdAt: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const hours = String(createdAt.getHours()).padStart(2, '0');
  const minutes = String(createdAt.getMinutes()).padStart(2, '0');

  if (diffDays <= 0) {
    return `今天 ${hours}:${minutes}`;
  }

  if (diffDays === 1) {
    return `昨天 ${hours}:${minutes}`;
  }

  return `${createdAt.getMonth() + 1}/${createdAt.getDate()} ${hours}:${minutes}`;
}

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

function toCheckInRecordSummary(record: {
  id: string;
  mood: string;
  steps: number;
  heartRate: number | null;
  timestamp: Date;
}): CheckInRecordSummary {
  const timestamp = record.timestamp.getTime();

  return {
    recordId: record.id,
    mood: record.mood,
    steps: record.steps,
    heartRate: record.heartRate,
    timestamp,
    businessDate: formatBusinessDateKey(timestamp),
    period: resolveCheckInPeriod(timestamp),
  };
}

function parseRequestedDays(rawDays: unknown, fallbackDays: number = 7): number {
  const parsedDays = Number(rawDays);
  if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
    return fallbackDays;
  }

  return Math.min(Math.floor(parsedDays), 30);
}

function sendNotFound(res: Response, message: string) {
  return res.status(404).json({
    code: 404,
    data: null,
    message,
  });
}

async function getLastInteractionCache(userId: string): Promise<number | null> {
  try {
    return await redisClient.get<number>(`lastInteraction:${userId}`);
  } catch (error) {
    console.warn('Redis read skipped:', error);
    return null;
  }
}

async function setLastInteractionCache(userId: string, timestamp: number): Promise<void> {
  try {
    await redisClient.set(`lastInteraction:${userId}`, timestamp);
  } catch (error) {
    console.warn('Redis write skipped:', error);
  }
}

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
    const { userId, mood, steps, heartRate, timestamp, metricsData } = req.body;

    if (!userId) {
      return res.status(400).json({ code: 400, data: null, message: '缺少 userId 参数' });
    }

    const submittedAt = timestamp ? new Date(Number(timestamp)) : new Date();
    const normalizedMetricsData: CheckInMetricsData = {
      ...(typeof metricsData === 'object' && metricsData !== null ? metricsData : {}),
    };

    if (mood !== undefined) normalizedMetricsData.mood = String(mood);
    if (steps !== undefined) normalizedMetricsData.steps = Number(steps) || 0;
    if (heartRate !== undefined && heartRate !== null && heartRate !== '') {
      normalizedMetricsData.heartRate = Number(heartRate) || 0;
    }

    for (const field of ['bloodPressure', 'bloodSugar', 'sleep'] as const) {
      if (req.body[field] !== undefined) {
        normalizedMetricsData[field] = req.body[field];
      }
    }

    const resolvedMood =
      typeof normalizedMetricsData.mood === 'string' && normalizedMetricsData.mood.trim()
        ? normalizedMetricsData.mood.trim()
        : 'calm';
    const resolvedSteps =
      typeof normalizedMetricsData.steps === 'number' && Number.isFinite(normalizedMetricsData.steps)
        ? normalizedMetricsData.steps
        : 0;
    const resolvedHeartRate =
      typeof normalizedMetricsData.heartRate === 'number' &&
      Number.isFinite(normalizedMetricsData.heartRate)
        ? normalizedMetricsData.heartRate
        : null;
    
    // 确保用户存在 (方便测试环境)
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: `test-user-${userId}`,
          role: 'elder',
        }
      });
    }

    // 存入 Prisma
    const checkIn = await prisma.checkIn.create({
      data: {
        userId,
        mood: resolvedMood,
        steps: resolvedSteps,
        heartRate: resolvedHeartRate,
        timestamp: submittedAt,
      }
    });

    let healthRecord = null;
    if (Object.keys(normalizedMetricsData).length > 0) {
      healthRecord = await prisma.healthRecord.create({
        data: {
          userId,
          metricsData: JSON.stringify(normalizedMetricsData),
          createdAt: submittedAt,
        }
      });
    }

    // 更新用户的最后交互时间
    await prisma.user.update({
      where: { id: userId },
      data: { lastInteractionTime: new Date() }
    });

    // Redis 仅作为缓存使用，不阻断主流程
    await setLastInteractionCache(userId, Date.now());

    const response: ApiResponse<CheckInResponse> = {
      code: 0,
      data: {
        recordId: checkIn.id,
        healthRecordId: healthRecord?.id,
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
// 3. 今日打卡状态接口
// =======================
app.get('/api/health/checkin-status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const todayRange = resolveBusinessDayRange();

    const [user, healthConfig, todayRecords, latestRecord] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.healthConfig.findUnique({ where: { userId } }),
      prisma.checkIn.findMany({
        where: {
          userId,
          timestamp: {
            gte: new Date(todayRange.startAt),
            lt: new Date(todayRange.endAt),
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.checkIn.findFirst({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    if (!user) {
      return sendNotFound(res, '用户不存在');
    }

    const todayAggregate = summarizeDailyCheckInRecords(
      todayRange.date,
      todayRecords.map(toCheckInRecordSummary)
    );
    const latestSummaryRecord =
      todayAggregate.latestRecord ?? (latestRecord ? toCheckInRecordSummary(latestRecord) : null);
    const trackedMetrics = normalizeTrackedMetrics(healthConfig?.metrics ?? user.trackedMetrics);
    const windowPolicy = resolveTodayCheckInWindowPolicy(Date.now(), todayAggregate.hasCheckedIn);

    const response: ApiResponse<TodayCheckInStatusResponse> = {
      code: 0,
      data: {
        userId,
        timezone: BUSINESS_TIMEZONE,
        businessDate: todayRange.date,
        hasCheckedInToday: todayAggregate.hasCheckedIn,
        lastCheckInAt: latestSummaryRecord?.timestamp ?? null,
        trackedMetrics,
        window: windowPolicy,
        summary: todayAggregate.summary,
        today: todayAggregate,
        latestRecord: latestSummaryRecord,
        form: {
          editableMetrics: trackedMetrics,
          initialValues: createCheckInFormInitialValues(latestSummaryRecord),
        },
      },
      message: 'success',
    };

    res.json(response);
  } catch (error) {
    console.error('Checkin Status Error:', error);
    res.status(500).json({ code: 500, data: null, message: '内部服务器错误' });
  }
});

// =======================
// 4. 健康记录按天聚合接口
// =======================
app.get('/api/health/checkins/daily/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestedDays = parseRequestedDays(req.query.days, 7);
    const anchorDate =
      typeof req.query.date === 'string' && req.query.date.trim().length > 0
        ? req.query.date.trim()
        : formatBusinessDateKey();
    const anchorRange = resolveBusinessDayRange(anchorDate);
    const oldestDate = shiftBusinessDateKey(anchorDate, -(requestedDays - 1));
    const oldestRange = resolveBusinessDayRange(oldestDate);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return sendNotFound(res, '用户不存在');
    }

    const records = await prisma.checkIn.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(oldestRange.startAt),
          lt: new Date(anchorRange.endAt),
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    const recentDays = buildDailyHealthAggregates(
      records.map(toCheckInRecordSummary),
      anchorDate,
      requestedDays
    );
    const today = recentDays[recentDays.length - 1];
    const yesterday = recentDays.length > 1 ? recentDays[recentDays.length - 2] : null;

    const response: ApiResponse<DailyHealthAggregatesResponse> = {
      code: 0,
      data: {
        userId,
        timezone: BUSINESS_TIMEZONE,
        anchorDate,
        requestedDays,
        today,
        yesterday,
        recentDays,
      },
      message: 'success',
    };

    res.json(response);
  } catch (error) {
    console.error('Daily Health Aggregates Error:', error);
    res.status(500).json({ code: 500, data: null, message: '内部服务器错误' });
  }
});

// =======================
// 5. 状态预警接口
// =======================
app.get('/api/warning/status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // 从 Redis 读取
    let lastTime = await getLastInteractionCache(userId);
    
    if (!lastTime) {
      // 降级：从数据库读取
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        lastTime = user.lastInteractionTime.getTime();
        await setLastInteractionCache(userId, lastTime);
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
// 6. 天气查询接口
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
    const cityName =
      resolveCityLabel(
        data.nearest_area?.[0]?.areaName?.[0]?.value ||
          data.nearest_area?.[0]?.region?.[0]?.value,
        cityCode,
      ) || '待完善城市';
    
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
        cityName,
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
        cityName: resolveCityLabel(undefined, req.query.cityCode as string || 'default') || '待完善城市',
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
          name: `test-user-${userId}`
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
    await setLastInteractionCache(userId, Date.now());
    
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
      include: {
        user: {
          select: {
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const voiceList: VoiceListResponse = {
      records: records.map((record): VoiceListItem => ({
        id: record.id,
        role: record.user.role === 'child' ? 'child' : ('elder' as UserRole),
        timeLabel: formatVoiceTimeLabel(record.createdAt),
        duration: record.duration,
        url: record.url
      }))
    };
    
    const response: ApiResponse<VoiceListResponse> = {
      code: 0,
      data: voiceList,
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
    
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    if (!normalizedName || !password || !role) {
      return res.status(400).json({ code: 400, data: null, message: '缺少必填参数' });
    }

    if (role !== 'elder' && role !== 'child') {
      return res.status(400).json({ code: 400, data: null, message: 'role 仅支持 elder 或 child' });
    }
    
    const existingUsers = await prisma.user.findMany({
      select: { id: true, name: true },
    });
    if (existingUsers.some((user) => user.name.trim().toLowerCase() === normalizedName.toLowerCase())) {
      return res.status(400).json({ code: 400, data: null, message: '用户名已存在' });
    }

    const user = await prisma.user.create({
      data: {
        name: normalizedName,
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
    
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    if (!normalizedName || !password) {
      return res.status(400).json({ code: 400, data: null, message: '缺少必填参数' });
    }
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        password: true,
        role: true,
        cityCode: true,
      },
    });
    const user =
      users.find((candidate) => candidate.name.trim().toLowerCase() === normalizedName.toLowerCase()) ?? null;
    
    if (!user || user.password !== password) {
      return res.status(401).json({ code: 401, data: null, message: '用户名或密码错误' });
    }
    
    const response: ApiResponse = {
      code: 0,
      data: {
        userId: user.id,
        name: user.name,
        cityCode: user.cityCode,
        role: user.role
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
// User Profile API
// =======================
app.get('/api/user/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        familyMembers: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            family: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        city: true,
                        cityCode: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }
    
    // 提取第一个家庭的信息（MVP假设一个用户只在一个家庭）
    const primaryFamilyMember = user.familyMembers[0];
    const familyInfo = primaryFamilyMember ? {
      familyId: primaryFamilyMember.familyId,
      familyName: primaryFamilyMember.family.name,
      inviteCode: primaryFamilyMember.family.connectionCode,
      members: primaryFamilyMember.family.members.map(m => ({
        userId: m.user.id,
        name: m.user.name,
        role: m.role,
        city: m.user.city,
        cityCode: m.user.cityCode
      }))
    } : null;

    const trackedMetrics = normalizeTrackedMetrics(user.trackedMetrics);

    const response: ApiResponse = {
      code: 0,
      data: {
        userId: user.id,
        name: user.name,
        role: user.role,
        cityCode: user.cityCode,
        city: user.city,
        trackedMetrics,
        familyId: familyInfo?.familyId || null,
        familyInfo: familyInfo
      },
      message: 'success'
    };
    res.json(response);
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ code: 500, data: null, message: '内部服务器错误' });
  }
});

app.post('/api/user/profile/update', async (req: Request, res: Response) => {
  try {
    const { userId, cityCode, city, trackedMetrics } = req.body;

    if (!userId) {
      return res.status(400).json({ code: 400, data: null, message: '缺少 userId 参数' });
    }

    const dataToUpdate: any = {};
    if (cityCode !== undefined) dataToUpdate.cityCode = cityCode;
    if (city !== undefined) dataToUpdate.city = city;
    if (trackedMetrics !== undefined) {
      const normalizedTrackedMetrics = normalizeTrackedMetrics(trackedMetrics);
      if (normalizedTrackedMetrics.length === 0) {
        return res.status(400).json({
          code: 400,
          data: null,
          message: '当前阶段仅支持标准健康指标，请至少保留心情后再保存。',
        });
      }

      dataToUpdate.trackedMetrics = JSON.stringify(normalizedTrackedMetrics);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    });

    const response: ApiResponse = {
      code: 0,
      data: {
        userId: user.id,
        name: user.name,
        role: user.role,
        cityCode: user.cityCode,
        city: user.city,
        trackedMetrics: normalizeTrackedMetrics(user.trackedMetrics)
      },
      message: '个人信息更新成功'
    };
    res.json(response);
  } catch (error) {
    console.error('Update Profile Error:', error);
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
    await setLastInteractionCache(userId, Date.now());
    
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

// =======================
// Family Connection APIs
// =======================
app.post('/api/family/create', async (req: Request, res: Response) => {
  try {
    const { userId, familyName } = req.body;
    
    if (!userId) {
      return res.status(400).json({ code: 400, data: null, message: '缺少 userId 参数' });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }

    const existingMembership = await prisma.familyMember.findFirst({
      where: { userId: user.id },
      include: { family: true },
      orderBy: { createdAt: 'desc' }
    });

    if (existingMembership) {
      const response: ApiResponse = {
        code: 0,
        data: {
          familyId: existingMembership.familyId,
          inviteCode: existingMembership.family.connectionCode,
          name: existingMembership.family.name
        },
        message: '用户已在家庭中，返回现有牵挂码'
      };
      res.json(response);
      return;
    }
    
    // 生成6位随机牵挂码
    let inviteCode = '';
    let isUnique = false;
    while (!isUnique) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingFamily = await prisma.family.findUnique({ where: { connectionCode: inviteCode } });
      if (!existingFamily) {
        isUnique = true;
      }
    }
    
    // 创建家庭并关联当前用户
    const normalizedRole = user.role === 'elder' ? 'elder' : 'child';
    const family = await prisma.family.create({
      data: {
        name: familyName || `${user.name}的家庭`,
        connectionCode: inviteCode,
        members: {
          create: {
            userId: user.id,
            role: normalizedRole
          }
        }
      }
    });
    
    const response: ApiResponse = {
      code: 0,
      data: {
        familyId: family.id,
        inviteCode: family.connectionCode,
        name: family.name
      },
      message: '家庭创建成功，牵挂码已生成'
    };
    res.json(response);
  } catch (error) {
    console.error('Family Create Error:', error);
    res.status(500).json({ code: 500, data: null, message: '内部服务器错误' });
  }
});

app.post('/api/family/join', async (req: Request, res: Response) => {
  try {
    const { userId, inviteCode } = req.body;
    
    if (!userId || !inviteCode) {
      return res.status(400).json({ code: 400, data: null, message: '缺少必填参数' });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }
    
    const family = await prisma.family.findUnique({
      where: { connectionCode: inviteCode.toUpperCase() }
    });
    
    if (!family) {
      return res.status(404).json({ code: 404, data: null, message: '牵挂码无效' });
    }
    
    const existingMembership = await prisma.familyMember.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    if (existingMembership && existingMembership.familyId !== family.id) {
      return res.status(400).json({ code: 400, data: null, message: '该账号已加入其他家庭，请使用同一账号的牵挂码或更换账号' });
    }

    const existingMember = await prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: family.id,
          userId: user.id
        }
      }
    });

    if (!existingMember) {
      const normalizedRole = user.role === 'elder' ? 'elder' : 'child';
      await prisma.familyMember.create({
        data: {
          familyId: family.id,
          userId: user.id,
          role: normalizedRole
        }
      });
    }
    
    const response: ApiResponse = {
      code: 0,
      data: {
        familyId: family.id,
        name: family.name
      },
      message: '成功加入家庭'
    };
    res.json(response);
  } catch (error) {
    console.error('Family Join Error:', error);
    res.status(500).json({ code: 500, data: null, message: '内部服务器错误' });
  }
});

// 启动服务
app.listen(port, () => {
  console.log(`[Server]: API server is running at http://localhost:${port}`);
});
