// 基础返回结构
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

// 用户类型
export interface User {
  id: string;
  name: string;
  avatar?: string;
  role: 'elder' | 'youth';
  linkedUserId?: string;
}

// 打卡同步接口请求和返回类型
export interface CheckInRequest {
  userId: string;
  mood: string;
  steps: number;
  heartRate?: number;
  timestamp: number;
}

export interface CheckInResponse {
  recordId: string;
  createdAt: number;
}

// 状态预警接口返回类型
export interface WarningStatusResponse {
  lastInteractionTime: number;
  warningLevel: number; // 0: 正常, 1: 24小时未互动, 2: 36小时未互动, 3: 48小时未互动
  isTriggered: boolean;
}

// 天气查询接口请求和返回类型
export interface WeatherQuery {
  cityCode: string;
}

export interface WeatherData {
  cityCode: string;
  weatherType: 'sunny' | 'rainy' | 'cloudy' | 'snowy' | string;
  temperature: number;
  humidity: number;
}

// 语音上传接口请求和返回类型
export interface VoiceUploadRequest {
  file: any; // Blob/File 等，在后端通常由 multer 等处理，前端为 File 对象
  userId: string;
  storyId: string;
}

export interface VoiceUploadResponse {
  voiceId: string;
  url: string;
  duration: number;
}
