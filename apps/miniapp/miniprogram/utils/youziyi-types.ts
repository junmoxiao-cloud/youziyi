// 本文件为 @youziyi/types 在小程序侧的本地镜像。
// 微信小程序运行时无法直接解析 monorepo 的 npm 包别名，因此将共享类型与工具函数内聚在此，
// 避免依赖 node_modules 中的 @youziyi/types。

// 基础返回结构
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

// 认证 Token 类型
export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export type UserRole = 'elder' | 'child';
export type CheckInMood = 'happy' | 'calm' | 'sad';
export type TrackedMetric =
  | 'mood'
  | 'steps'
  | 'heartRate'
  | 'bloodPressure'
  | 'bloodSugar'
  | 'sleep';
export type CheckInPeriod = 'morning' | 'daytime' | 'evening' | 'closed';
export type CheckInPromptState =
  | 'before_window'
  | 'morning_checkin'
  | 'daytime_checkin'
  | 'evening_checkin'
  | 'already_checked_in'
  | 'missed_window';

export interface CityOption {
  code: string;
  name: string;
}

export const CITY_OPTIONS: CityOption[] = [
  { code: 'SHANGHAI', name: '上海' },
  { code: 'BEIJING', name: '北京' },
  { code: 'GUANGZHOU', name: '广州' },
  { code: 'SHENZHEN', name: '深圳' },
  { code: 'HANGZHOU', name: '杭州' },
  { code: 'CHENGDU', name: '成都' },
];

export const CITY_LABELS: Record<string, string> = CITY_OPTIONS.reduce<Record<string, string>>(
  (labels, city) => {
    labels[city.code] = city.name;
    return labels;
  },
  {},
);

export function resolveCityLabel(cityName?: string | null, cityCode?: string | null): string {
  if (typeof cityCode === 'string' && cityCode.trim()) {
    const normalizedCode = cityCode.trim().toUpperCase();
    if (CITY_LABELS[normalizedCode]) {
      return CITY_LABELS[normalizedCode];
    }
    return normalizedCode;
  }

  if (typeof cityName === 'string' && cityName.trim()) {
    return cityName.trim();
  }

  return '';
}

// 用户类型
export interface User {
  id: string;
  name: string;
  avatar?: string;
  role?: UserRole;
  linkedUserId?: string;
  city?: string;
  trackedMetrics?: TrackedMetric[];
}

// 家庭类型
export interface Family {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  members?: FamilyMember[];
}

// 家庭成员类型
export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  role: UserRole | string;
  createdAt: number;
  updatedAt: number;
  user?: User;
  family?: Family;
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
  cityName?: string;
  weatherType: 'sunny' | 'rainy' | 'cloudy' | 'snowy' | string;
  temperature: number;
  humidity: number;
}

export interface FamilyProfileMember {
  userId: string;
  name: string;
  role: UserRole;
  city?: string | null;
  cityCode?: string | null;
}

export interface FamilyInfo {
  familyId: string;
  familyName: string;
  inviteCode: string;
  members: FamilyProfileMember[];
}

export interface UserProfileResponse {
  userId: string;
  name: string;
  role: UserRole;
  cityCode?: string | null;
  city?: string | null;
  trackedMetrics: TrackedMetric[];
  familyId?: string | null;
  familyInfo?: FamilyInfo | null;
}

// 打卡同步记录实体
export interface CheckInRecord {
  recordId: string;
  userId: string;
  mood: CheckInMood | string;
  steps: number;
  heartRate?: number;
  timestamp: number;
  createdAt: number;
}

export type CheckInMetricValue = string | number | boolean | null;

export interface CheckInMetricsData {
  mood?: string;
  steps?: number;
  heartRate?: number;
  bloodPressure?: string;
  bloodSugar?: number;
  sleep?: string;
  [key: string]: CheckInMetricValue | undefined;
}

// 打卡同步接口请求和返回类型
export interface CheckInRequest {
  userId: string;
  mood: CheckInMood | string;
  steps: number;
  heartRate?: number;
  timestamp: number;
  metricsData?: CheckInMetricsData;
}

export interface CheckInResponse {
  recordId: string;
  healthRecordId?: string;
  createdAt: number;
}

export interface CheckInRecordSummary {
  recordId: string;
  mood: string;
  steps: number;
  heartRate: number | null;
  timestamp: number;
  businessDate: string;
  period: CheckInPeriod;
}

export interface DailyHealthSummary {
  mood: string | null;
  steps: number | null;
  heartRate: number | null;
}

export interface DailyHealthAggregateDay {
  date: string;
  startAt: number;
  endAt: number;
  hasCheckedIn: boolean;
  recordCount: number;
  latestCheckInAt: number | null;
  summary: DailyHealthSummary;
  latestRecord: CheckInRecordSummary | null;
}

export interface TodayCheckInWindowPolicy {
  timezone: string;
  businessDate: string;
  currentPeriod: CheckInPeriod;
  opensAt: number;
  closesAt: number;
  isWithinCheckInWindow: boolean;
  promptState: CheckInPromptState;
  promptMessage: string;
}

export interface CheckInFormInitialValues {
  mood: string | null;
  steps: number | null;
  heartRate: number | null;
}

export interface TodayCheckInStatusResponse {
  userId: string;
  timezone: string;
  businessDate: string;
  hasCheckedInToday: boolean;
  lastCheckInAt: number | null;
  trackedMetrics: TrackedMetric[];
  window: TodayCheckInWindowPolicy;
  summary: DailyHealthSummary;
  today: DailyHealthAggregateDay;
  latestRecord: CheckInRecordSummary | null;
  form: {
    editableMetrics: TrackedMetric[];
    initialValues: CheckInFormInitialValues;
  };
}

export interface DailyHealthAggregatesResponse {
  userId: string;
  timezone: string;
  anchorDate: string;
  requestedDays: number;
  today: DailyHealthAggregateDay;
  yesterday: DailyHealthAggregateDay | null;
  recentDays: DailyHealthAggregateDay[];
}

export interface TodayHealthSnapshot {
  userId: string;
  businessDate: string;
  hasCheckedIn: boolean;
  latestCheckInAt: number | null;
  summary: DailyHealthSummary;
  latestRecord: CheckInRecordSummary | null;
}

// 健康记录实体
export interface HealthRecord {
  id: string;
  userId: string;
  metricsData?: string;
  createdAt: number;
  updatedAt: number;
}

// 语音接龙记录实体
export interface VoiceRecord {
  id: string;
  userId: string;
  storyId: string;
  role: UserRole;
  url: string;
  duration: number;
  createdAt: number;
}

export interface VoiceListItem {
  id: string;
  role: UserRole;
  timeLabel: string;
  duration: number;
  url: string;
}

export interface VoiceListResponse {
  records: VoiceListItem[];
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

export const BUSINESS_TIMEZONE = 'Asia/Shanghai';
export const BUSINESS_TIMEZONE_OFFSET_MINUTES = 8 * 60;
export const DAILY_CHECKIN_WINDOW_RULES = {
  morningStartHour: 5,
  morningEndHour: 12,
  eveningStartHour: 17,
  eveningEndHour: 23,
  checkInWindowStartHour: 5,
  checkInWindowEndHour: 23,
} as const;
export const DEFAULT_TRACKED_METRICS: TrackedMetric[] = ['mood'];

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function padTwo(value: number): string {
  return String(value).padStart(2, '0');
}

function getBusinessDateParts(timestamp: number) {
  const shiftedDate = new Date(timestamp + BUSINESS_TIMEZONE_OFFSET_MINUTES * MS_PER_MINUTE);

  return {
    year: shiftedDate.getUTCFullYear(),
    month: shiftedDate.getUTCMonth() + 1,
    day: shiftedDate.getUTCDate(),
    hour: shiftedDate.getUTCHours(),
  };
}

function parseBusinessDateKey(dateKey: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    throw new Error(`Invalid business date key: ${dateKey}`);
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function createEmptySummary(): DailyHealthSummary {
  return {
    mood: null,
    steps: null,
    heartRate: null,
  };
}

export function formatBusinessDateKey(timestamp: number = Date.now()): string {
  const parts = getBusinessDateParts(timestamp);
  return `${parts.year}-${padTwo(parts.month)}-${padTwo(parts.day)}`;
}

export function shiftBusinessDateKey(dateKey: string, offsetDays: number): string {
  const range = resolveBusinessDayRange(dateKey);
  return formatBusinessDateKey(range.startAt + offsetDays * MS_PER_DAY);
}

export function resolveBusinessDayRange(date: number | string = Date.now()) {
  const dateKey = typeof date === 'string' ? date : formatBusinessDateKey(date);
  const parts = parseBusinessDateKey(dateKey);
  const startAt =
    Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0) -
    BUSINESS_TIMEZONE_OFFSET_MINUTES * MS_PER_MINUTE;
  const endAt = startAt + MS_PER_DAY;

  return {
    date: dateKey,
    startAt,
    endAt,
  };
}

export function resolveCheckInPeriod(timestamp: number): CheckInPeriod {
  const { hour } = getBusinessDateParts(timestamp);
  if (
    hour < DAILY_CHECKIN_WINDOW_RULES.checkInWindowStartHour ||
    hour >= DAILY_CHECKIN_WINDOW_RULES.checkInWindowEndHour
  ) {
    return 'closed';
  }

  if (hour < DAILY_CHECKIN_WINDOW_RULES.morningEndHour) {
    return 'morning';
  }

  if (hour >= DAILY_CHECKIN_WINDOW_RULES.eveningStartHour) {
    return 'evening';
  }

  return 'daytime';
}

export function resolveCheckInPromptMessage(promptState: CheckInPromptState): string {
  switch (promptState) {
    case 'before_window':
      return '今日打卡窗口将于早上 05:00 开启。';
    case 'morning_checkin':
      return '现在处于早间打卡时段，适合记录今日心情与基础健康数据。';
    case 'daytime_checkin':
      return '当前仍在今日打卡窗口内，可以继续完成今日健康打卡。';
    case 'evening_checkin':
      return '现在处于晚间关怀时段，建议尽快完成今日打卡。';
    case 'already_checked_in':
      return '今日已完成打卡，可继续查看今日摘要与最近一次记录。';
    case 'missed_window':
      return '今日打卡窗口已结束，请明天在 05:00 之后继续打卡。';
    default:
      return '今日打卡状态已更新。';
  }
}

export function resolveTodayCheckInWindowPolicy(
  currentTimestamp: number = Date.now(),
  hasCheckedInToday: boolean = false
): TodayCheckInWindowPolicy {
  const businessDate = formatBusinessDateKey(currentTimestamp);
  const dayRange = resolveBusinessDayRange(businessDate);
  const currentPeriod = resolveCheckInPeriod(currentTimestamp);
  const isWithinCheckInWindow =
    currentPeriod === 'morning' || currentPeriod === 'daytime' || currentPeriod === 'evening';

  let promptState: CheckInPromptState;
  if (hasCheckedInToday) {
    promptState = 'already_checked_in';
  } else if (
    currentPeriod === 'closed' &&
    currentTimestamp <
      dayRange.startAt + DAILY_CHECKIN_WINDOW_RULES.checkInWindowStartHour * 60 * MS_PER_MINUTE
  ) {
    promptState = 'before_window';
  } else if (currentPeriod === 'morning') {
    promptState = 'morning_checkin';
  } else if (currentPeriod === 'evening') {
    promptState = 'evening_checkin';
  } else if (currentPeriod === 'daytime') {
    promptState = 'daytime_checkin';
  } else {
    promptState = 'missed_window';
  }

  return {
    timezone: BUSINESS_TIMEZONE,
    businessDate,
    currentPeriod,
    opensAt:
      dayRange.startAt + DAILY_CHECKIN_WINDOW_RULES.checkInWindowStartHour * 60 * MS_PER_MINUTE,
    closesAt:
      dayRange.startAt + DAILY_CHECKIN_WINDOW_RULES.checkInWindowEndHour * 60 * MS_PER_MINUTE,
    isWithinCheckInWindow,
    promptState,
    promptMessage: resolveCheckInPromptMessage(promptState),
  };
}

export function normalizeTrackedMetrics(input?: unknown): TrackedMetric[] {
  let rawMetrics: unknown = input;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      rawMetrics = [];
    } else {
      try {
        rawMetrics = JSON.parse(trimmed);
      } catch {
        rawMetrics = trimmed.split(',').map((item) => item.trim());
      }
    }
  }

  const allowedMetrics: TrackedMetric[] = [
    'mood',
    'steps',
    'heartRate',
    'bloodPressure',
    'bloodSugar',
    'sleep',
  ];

  const resolved = Array.isArray(rawMetrics)
    ? rawMetrics.filter(
        (metric): metric is TrackedMetric =>
          typeof metric === 'string' && allowedMetrics.includes(metric as TrackedMetric)
      )
    : [];

  const uniqueMetrics = [...new Set(resolved)];
  if (uniqueMetrics.length === 0) {
    return [];
  }

  const metricsWithoutMood = uniqueMetrics.filter((metric) => metric !== 'mood');
  return [...DEFAULT_TRACKED_METRICS, ...metricsWithoutMood];
}

export function createCheckInFormInitialValues(
  latestRecord: CheckInRecordSummary | null
): CheckInFormInitialValues {
  if (!latestRecord) {
    return createEmptySummary();
  }

  return {
    mood: latestRecord.mood,
    steps: latestRecord.steps,
    heartRate: latestRecord.heartRate,
  };
}

export function resolveTodayHealthSnapshot(
  todayStatus?: TodayCheckInStatusResponse | null,
  dailyAggregates?: DailyHealthAggregatesResponse | null
): TodayHealthSnapshot | null {
  if (todayStatus) {
    return {
      userId: todayStatus.userId,
      businessDate: todayStatus.businessDate,
      hasCheckedIn: todayStatus.hasCheckedInToday,
      latestCheckInAt:
        todayStatus.lastCheckInAt !== null && todayStatus.lastCheckInAt !== undefined
          ? todayStatus.lastCheckInAt
          : todayStatus.today.latestCheckInAt,
      summary:
        todayStatus.summary !== null && todayStatus.summary !== undefined
          ? todayStatus.summary
          : todayStatus.today.summary !== null && todayStatus.today.summary !== undefined
            ? todayStatus.today.summary
            : createEmptySummary(),
      latestRecord:
        todayStatus.latestRecord !== null && todayStatus.latestRecord !== undefined
          ? todayStatus.latestRecord
          : todayStatus.today.latestRecord,
    };
  }

  if (dailyAggregates && dailyAggregates.today) {
    return {
      userId: dailyAggregates.userId,
      businessDate: dailyAggregates.today.date,
      hasCheckedIn: dailyAggregates.today.hasCheckedIn,
      latestCheckInAt: dailyAggregates.today.latestCheckInAt,
      summary:
        dailyAggregates.today.summary !== null && dailyAggregates.today.summary !== undefined
          ? dailyAggregates.today.summary
          : createEmptySummary(),
      latestRecord: dailyAggregates.today.latestRecord,
    };
  }

  return null;
}

export function summarizeDailyCheckInRecords(
  date: string,
  records: CheckInRecordSummary[]
): DailyHealthAggregateDay {
  const dayRange = resolveBusinessDayRange(date);
  const sortedRecords = [...records].sort((left, right) => right.timestamp - left.timestamp);
  const latestRecord =
    sortedRecords[0] !== null && sortedRecords[0] !== undefined ? sortedRecords[0] : null;

  return {
    date,
    startAt: dayRange.startAt,
    endAt: dayRange.endAt,
    hasCheckedIn: sortedRecords.length > 0,
    recordCount: sortedRecords.length,
    latestCheckInAt:
      latestRecord !== null && latestRecord !== undefined ? latestRecord.timestamp : null,
    summary: latestRecord
      ? {
          mood: latestRecord.mood,
          steps: latestRecord.steps,
          heartRate: latestRecord.heartRate,
        }
      : createEmptySummary(),
    latestRecord,
  };
}

export function buildDailyHealthAggregates(
  records: CheckInRecordSummary[],
  anchorDate: string = formatBusinessDateKey(),
  days: number = 7
): DailyHealthAggregateDay[] {
  const grouped = new Map<string, CheckInRecordSummary[]>();
  for (const record of records) {
    const existingRecords = grouped.get(record.businessDate);
    const existing =
      existingRecords !== null && existingRecords !== undefined ? existingRecords : [];
    existing.push(record);
    grouped.set(record.businessDate, existing);
  }

  const safeDays = Math.max(1, Math.min(days, 30));
  const aggregates: DailyHealthAggregateDay[] = [];

  for (let index = safeDays - 1; index >= 0; index -= 1) {
    const date = shiftBusinessDateKey(anchorDate, -index);
    const dateRecords = grouped.get(date);
    const dayRecords = dateRecords !== null && dateRecords !== undefined ? dateRecords : [];
    aggregates.push(summarizeDailyCheckInRecords(date, dayRecords));
  }

  return aggregates;
}
