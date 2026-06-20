export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export type UserRole = 'elder' | 'child'
export type TrackedMetric =
  | 'mood'
  | 'steps'
  | 'heartRate'
  | 'bloodPressure'
  | 'bloodSugar'
  | 'sleep'
export type CheckInPeriod = 'morning' | 'daytime' | 'evening' | 'closed'
export type CheckInPromptState =
  | 'before_window'
  | 'morning_checkin'
  | 'daytime_checkin'
  | 'evening_checkin'
  | 'already_checked_in'
  | 'missed_window'

export interface VerificationResult {
  codeHint: string
  canBypass: boolean
}

export interface AuthResult {
  userId: string
  name: string
  role: UserRole
  cityCode?: string
}

export interface CityOption {
  code: string
  name: string
}

export interface MetricOption {
  id: TrackedMetric
  label: string
  defaultSelected: boolean
}

export const CITY_OPTIONS: CityOption[] = [
  { code: 'SHANGHAI', name: '上海' },
  { code: 'BEIJING', name: '北京' },
  { code: 'GUANGZHOU', name: '广州' },
  { code: 'SHENZHEN', name: '深圳' },
  { code: 'HANGZHOU', name: '杭州' },
  { code: 'CHENGDU', name: '成都' }
]

export const DEFAULT_TRACKED_METRICS: TrackedMetric[] = ['mood', 'steps']

export const METRIC_OPTIONS: MetricOption[] = [
  { id: 'mood', label: '心情', defaultSelected: true },
  { id: 'steps', label: '步数', defaultSelected: true },
  { id: 'heartRate', label: '心率', defaultSelected: false },
  { id: 'bloodPressure', label: '血压', defaultSelected: false },
  { id: 'bloodSugar', label: '血糖', defaultSelected: false },
  { id: 'sleep', label: '睡眠', defaultSelected: false }
]

export interface CheckInPayload {
  userId: string
  mood: string
  steps: number
  heartRate?: number
  bloodPressure?: string
  bloodSugar?: number
  sleep?: string
  metricsData?: CheckInMetricsData
  timestamp: number
}

export interface CheckInResult {
  recordId: string
  createdAt: number
}

export type CheckInMood = 'happy' | 'calm' | 'sad'

export interface CheckInMetricsData {
  mood?: string
  steps?: number
  heartRate?: number
  bloodPressure?: string
  bloodSugar?: number
  sleep?: string
  [key: string]: string | number | boolean | undefined
}

export interface HomeCheckInState {
  selectedMood: string
  stepsInput: string
  heartRateInput: string
  bloodPressureInput: string
  bloodSugarInput: string
  sleepInput: string
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
      field: 'bloodPressureInput',
      type: 'string',
      required: false,
      description: '血压预留输入态，按服务端 metricsData 口径透传。'
    },
    {
      field: 'bloodSugarInput',
      type: 'string',
      required: false,
      description: '血糖预留输入态，提交前解析为 number。'
    },
    {
      field: 'sleepInput',
      type: 'string',
      required: false,
      description: '睡眠状态预留输入态，按字符串透传。'
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
      field: 'metricsData.bloodPressure',
      type: 'string',
      required: false,
      description: '当用户配置血压指标时传入。'
    },
    {
      field: 'metricsData.bloodSugar',
      type: 'number',
      required: false,
      description: '当用户配置血糖指标时传入。'
    },
    {
      field: 'metricsData.sleep',
      type: 'string',
      required: false,
      description: '当用户配置睡眠指标时传入。'
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

export interface FamilyProfileMember {
  userId: string
  name: string
  role: UserRole
  city?: string | null
  cityCode?: string | null
}

export interface FamilyInfo {
  familyId: string
  familyName: string
  inviteCode: string
  members: FamilyProfileMember[]
}

export interface UserProfileResponse {
  userId: string
  name: string
  role: UserRole
  cityCode?: string | null
  city?: string | null
  trackedMetrics: TrackedMetric[]
  familyId?: string | null
  familyInfo?: FamilyInfo | null
}

export interface UserProfileUpdatePayload {
  userId: string
  cityCode?: string
  city?: string
  trackedMetrics?: TrackedMetric[]
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

export interface FamilyCreateResult {
  familyId: string
  inviteCode: string
  name: string
}

export interface FamilyJoinResult {
  familyId: string
  name: string
}

export interface DailyHealthSummary {
  mood: string | null
  steps: number | null
  heartRate: number | null
}

export interface CheckInRecordSummary {
  recordId: string
  mood: string
  steps: number
  heartRate: number | null
  timestamp: number
  businessDate: string
  period: CheckInPeriod
}

export interface DailyHealthAggregateDay {
  date: string
  startAt: number
  endAt: number
  hasCheckedIn: boolean
  recordCount: number
  latestCheckInAt: number | null
  summary: DailyHealthSummary
  latestRecord: CheckInRecordSummary | null
}

export interface TodayCheckInWindowPolicy {
  timezone: string
  businessDate: string
  currentPeriod: CheckInPeriod
  opensAt: number
  closesAt: number
  isWithinCheckInWindow: boolean
  promptState: CheckInPromptState
  promptMessage: string
}

export interface CheckInFormInitialValues {
  mood: string | null
  steps: number | null
  heartRate: number | null
}

export interface TodayCheckInStatusResponse {
  userId: string
  timezone: string
  businessDate: string
  hasCheckedInToday: boolean
  lastCheckInAt: number | null
  trackedMetrics: TrackedMetric[]
  window: TodayCheckInWindowPolicy
  summary: DailyHealthSummary
  today: DailyHealthAggregateDay
  latestRecord: CheckInRecordSummary | null
  form: {
    editableMetrics: TrackedMetric[]
    initialValues: CheckInFormInitialValues
  }
}

export function resolveCityLabel(city?: string | null, cityCode?: string | null): string {
  if (city && city.trim().length > 0) {
    return city.trim()
  }

  if (!cityCode || cityCode.trim().length === 0) {
    return ''
  }

  const normalizedCode = cityCode.trim().toUpperCase()
  for (let index = 0; index < CITY_OPTIONS.length; index += 1) {
    if (CITY_OPTIONS[index].code === normalizedCode) {
      return CITY_OPTIONS[index].name
    }
  }

  return cityCode.trim()
}

export function getTrackedMetricLabel(metric: TrackedMetric): string {
  switch (metric) {
    case 'mood':
      return '心情'
    case 'steps':
      return '步数'
    case 'heartRate':
      return '心率'
    case 'bloodPressure':
      return '血压'
    case 'bloodSugar':
      return '血糖'
    case 'sleep':
      return '睡眠'
    default:
      return metric
  }
}
