# API 接口规范

本文档定义了《游子衣》项目后端与前端（Web端/小程序端）交互的 API 接口规范。

## 1. 通用响应格式

所有接口必须遵循统一的 JSON 返回结构，采用 RESTful 规范。

```json
{
  "code": 0,
  "data": {},
  "message": "success"
}
```

- `code`: 状态码。`0` 表示成功，非 `0` 表示失败（例如：`400` 参数错误，`401` 未授权，`500` 服务器内部错误）。
- `data`: 核心业务数据对象或数组。若无数据返回，可为 `null` 或 `{}`。
- `message`: 针对状态码的文本描述，供前端提示用户使用。

## 2. 核心业务接口

### 2.1 打卡同步 (Check-in Sync)
用于同步老人每日的心情、步数等健康和状态数据。

- **接口地址**: `POST /api/health/checkin`
- **请求参数**:
  ```json
  {
    "userId": "string",
    "mood": "string",      // 情绪枚举，如 "happy", "calm", "sad"
    "steps": "number",     // 步数
    "heartRate": "number", // 选填，心率
    "timestamp": "number"  // 打卡时间戳
  }
  ```
- **返回示例**:
  ```json
  {
    "code": 0,
    "data": {
      "recordId": "string",
      "createdAt": "number"
    },
    "message": "打卡成功"
  }
  ```

### 2.2 状态预警 (Status Warning)
用于查询用户的互动状态及预警信息。

- **接口地址**: `GET /api/warning/status/:userId`
- **请求参数**: 路径参数 `userId`
- **返回示例**:
  ```json
  {
    "code": 0,
    "data": {
      "lastInteractionTime": "number",
      "warningLevel": "number", // 0: 正常, 1: 24小时未互动, 2: 36小时未互动, 3: 48小时未互动
      "isTriggered": "boolean"
    },
    "message": "success"
  }
  ```

### 2.3 天气查询 (Weather Query)
用于城市天气瓶动效，获取双方所在城市的天气信息。

- **接口地址**: `GET /api/weather/current`
- **请求参数** (Query):
  - `cityCode`: 城市编码 (string)
- **返回示例**:
  ```json
  {
    "code": 0,
    "data": {
      "cityCode": "string",
      "weatherType": "string", // "sunny", "rainy", "cloudy", "snowy"
      "temperature": "number",
      "humidity": "number"
    },
    "message": "success"
  }
  ```

### 2.4 语音上传 (Voice Upload)
用于家庭故事语音接龙的音频片段上传。

- **接口地址**: `POST /api/voice/upload`
- **请求头部**: `Content-Type: multipart/form-data`
- **请求参数**:
  - `file`: 音频文件 (Blob/File)
  - `userId`: 用户ID (string)
  - `storyId`: 故事线ID (string)
- **返回示例**:
  ```json
  {
    "code": 0,
    "data": {
      "voiceId": "string",
      "url": "string",      // OSS/COS 中的存储链接
      "duration": "number"  // 语音时长（秒）
    },
    "message": "上传成功"
  }
  ```
