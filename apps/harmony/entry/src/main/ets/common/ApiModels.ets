export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export interface VerificationResult {
  codeHint: string
  canBypass: boolean
}

export interface CheckInPayload {
  userId: string
  mood: string
  steps: number
  heartRate?: number
  timestamp: number
}

export interface CheckInResult {
  recordId: string
  createdAt: number
}

export enum CheckInMood {
  HAPPY = 'happy',
  CALM = 'calm',
  SAD = 'sad'
}

export interface HomeCheckInState {
  selectedMood: string
  stepsInput: string
  heartRateInput: string
  isSubmitting: boolean
  submitMessage: string
  lastRecordId: string
}

export interface FieldBoundary {
  field: string
  type: string
  required: boolean
  description: string
}

export interface MigratedPageDefinition {
  pageKey: string
  sourcePage: string
  targetPage: string
  entryPoint: string
  uiStateFields: FieldBoundary[]
  requestFields: FieldBoundary[]
  responseFields: FieldBoundary[]
}

export const HOME_CHECKIN_PAGE_DEFINITION: MigratedPageDefinition = {
  pageKey: 'daily-check-in',
  sourcePage: 'apps/miniapp/miniprogram/pages/index',
  targetPage: 'apps/harmony/entry/src/main/ets/pages/tabs/HomeTab.ets',
  entryPoint: 'pages/Main -> Tab[0] HomeTab',
  uiStateFields: [
    {
      field: 'selectedMood',
      type: 'string',
      required: true,
      description: '当前选中的心情值，候选项为 happy/calm/sad。'
    },
    {
      field: 'stepsInput',
      type: 'string',
      required: true,
      description: '步数字符串输入态，提交前转换为 number。'
    },
    {
      field: 'heartRateInput',
      type: 'string',
      required: false,
      description: '心率预留输入态，空值时不写入请求体。'
    },
    {
      field: 'isSubmitting',
      type: 'boolean',
      required: true,
      description: '提交中的互斥状态，避免重复点击。'
    },
    {
      field: 'submitMessage',
      type: 'string',
      required: true,
      description: '页面级反馈文案，承接校验态、成功态和失败态。'
    },
    {
      field: 'lastRecordId',
      type: 'string',
      required: false,
      description: '最近一次成功提交后返回的记录编号，用于前端回显。'
    }
  ],
  requestFields: [
    {
      field: 'userId',
      type: 'string',
      required: true,
      description: '当前打卡用户标识。'
    },
    {
      field: 'mood',
      type: 'string',
      required: true,
      description: '打卡心情，直接映射选中态。'
    },
    {
      field: 'steps',
      type: 'number',
      required: true,
      description: '步数，提交前从字符串解析为 number。'
    },
    {
      field: 'heartRate',
      type: 'number',
      required: false,
      description: '可选心率字段，仅在用户填写后提交。'
    },
    {
      field: 'timestamp',
      type: 'number',
      required: true,
      description: '客户端发起提交时的毫秒时间戳。'
    }
  ],
  responseFields: [
    {
      field: 'code',
      type: 'number',
      required: true,
      description: '统一状态码，0 表示成功。'
    },
    {
      field: 'data.recordId',
      type: 'string',
      required: true,
      description: '服务端返回的打卡记录 ID。'
    },
    {
      field: 'data.createdAt',
      type: 'number',
      required: true,
      description: '记录创建时间戳。'
    },
    {
      field: 'message',
      type: 'string',
      required: true,
      description: '页面提示文案来源，直接用于 toast 或状态说明。'
    }
  ]
}

export interface WarningStatusData {
  lastInteractionTime: number
  warningLevel: number
  isTriggered: boolean
}

export interface WeatherData {
  cityCode: string
  weatherType: string
  temperature: number
  humidity: number
}

export interface CareProfileDraft {
  role: string
  displayName: string
  ageRange: string
  reminderPreference: string
  dailyPreference: string
  emergencyContact: string
  emergencyPhone: string
  careNotes: string
  healthNotes: string
}
