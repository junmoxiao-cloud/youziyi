import {
  ApiResponse,
  AuthResult,
  CareProfileDraft,
  FamilyCreateResult,
  FamilyInfo,
  FamilyJoinResult,
  FamilyProfileMember,
  METRIC_OPTIONS,
  MetricOption,
  CheckInPayload,
  CheckInResult,
  CheckInRecordSummary,
  CheckInPeriod,
  CheckInPromptState,
  CheckInFormInitialValues,
  DailyHealthAggregateDay,
  DailyHealthSummary,
  TodayCheckInStatusResponse,
  TodayCheckInWindowPolicy,
  TrackedMetric,
  UserProfileResponse,
  UserProfileUpdatePayload,
  UserRole,
  VerificationResult,
  VoiceListItem,
  VoiceListResponse,
  VoiceUploadResult,
  WarningStatusData,
  WeatherData
} from '../common/ApiModels';
import { APP_CONFIG, isUniversalCodeEnabled } from '../common/AppConfig';

function ok<T>(data: T, message: string): Promise<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    code: 0,
    data: data,
    message: message
  }
  return Promise.resolve(response)
}

interface MockUser {
  userId: string
  name: string
  password: string
  role: UserRole
  cityCode?: string
}

export class MockApi {
  private static users: Array<MockUser> = [
    {
      userId: 'mock-elder-001',
      name: '张阿姨',
      password: '123456',
      role: 'elder',
      cityCode: 'SHANGHAI'
    }
  ]

  private static profiles: Map<string, UserProfileResponse> = new Map<string, UserProfileResponse>([
    ['mock-elder-001', {
      userId: 'mock-elder-001',
      name: '张阿姨',
      role: 'elder',
      cityCode: 'SHANGHAI',
      city: '上海',
      trackedMetrics: ['mood', 'steps', 'heartRate'],
      familyId: null,
      familyInfo: null
    }]
  ])

  private static checkInRecords: Map<string, CheckInPayload[]> = new Map<string, CheckInPayload[]>()
  private static families: Map<string, FamilyInfo> = new Map<string, FamilyInfo>()

  private static formatDateKey(timestamp: number): string {
    const date = new Date(timestamp)
    const year = String(date.getFullYear())
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  private static resolvePeriod(timestamp: number): CheckInPeriod {
    const hour = new Date(timestamp).getHours()
    if (hour < 5 || hour >= 23) {
      return 'closed'
    }
    if (hour < 12) {
      return 'morning'
    }
    if (hour >= 17) {
      return 'evening'
    }
    return 'daytime'
  }

  private static resolvePromptState(hasCheckedInToday: boolean, period: CheckInPeriod): CheckInPromptState {
    if (hasCheckedInToday) {
      return 'already_checked_in'
    }
    if (period === 'closed') {
      const hour = new Date().getHours()
      return hour < 5 ? 'before_window' : 'missed_window'
    }
    if (period === 'morning') {
      return 'morning_checkin'
    }
    if (period === 'evening') {
      return 'evening_checkin'
    }
    return 'daytime_checkin'
  }

  private static resolvePromptMessage(promptState: CheckInPromptState): string {
    switch (promptState) {
      case 'before_window':
        return '今日打卡窗口将于早上 05:00 开启。'
      case 'morning_checkin':
        return '现在处于早间打卡时段，可以记录今天的状态。'
      case 'daytime_checkin':
        return '当前仍在打卡窗口内，可以继续完成今日打卡。'
      case 'evening_checkin':
        return '现在处于晚间关怀时段，建议尽快完成今日打卡。'
      case 'already_checked_in':
        return '今日已完成打卡，可继续查看今日摘要。'
      case 'missed_window':
        return '今日打卡窗口已结束，请明天再来。'
      default:
        return '今日打卡状态已更新。'
    }
  }

  private static buildMember(userId: string): FamilyProfileMember {
    const profile = MockApi.profiles.get(userId)
    if (!profile) {
      const fallbackMember: FamilyProfileMember = {
        userId,
        name: userId,
        role: 'elder',
        city: null,
        cityCode: null
      }
      return fallbackMember
    }

    const member: FamilyProfileMember = {
      userId: profile.userId,
      name: profile.name,
      role: profile.role,
      city: profile.city ?? null,
      cityCode: profile.cityCode ?? null
    }
    return member
  }

  private static attachFamilyToProfile(userId: string, familyInfo: FamilyInfo | null): void {
    const profile = MockApi.profiles.get(userId)
    if (!profile) {
      return
    }
    profile.familyId = familyInfo?.familyId ?? null
    profile.familyInfo = familyInfo
  }

  private static buildTodayStatus(userId: string): TodayCheckInStatusResponse {
    const profile = MockApi.profiles.get(userId)
    const records = MockApi.checkInRecords.get(userId) ?? []
    const todayDate = MockApi.formatDateKey(Date.now())
    const todayRecords = records
      .filter((record) => MockApi.formatDateKey(record.timestamp) === todayDate)
      .sort((left, right) => right.timestamp - left.timestamp)
    const latestPayload = todayRecords[0] ?? null
    const trackedMetrics: TrackedMetric[] = profile?.trackedMetrics?.length ? profile.trackedMetrics : METRIC_OPTIONS.filter((item: MetricOption): boolean => item.defaultSelected).map((item: MetricOption): TrackedMetric => item.id)
    const period: CheckInPeriod = MockApi.resolvePeriod(Date.now())
    const promptState = MockApi.resolvePromptState(todayRecords.length > 0, period)
    const opensAt = new Date(todayDate + 'T05:00:00').getTime()
    const closesAt = new Date(todayDate + 'T23:00:00').getTime()

    const latestRecord: CheckInRecordSummary | null = latestPayload ? {
      recordId: `mock-${latestPayload.userId}-${latestPayload.timestamp}`,
      mood: latestPayload.mood,
      steps: latestPayload.steps,
      heartRate: latestPayload.heartRate ?? null,
      timestamp: latestPayload.timestamp,
      businessDate: todayDate,
      period: period as CheckInPeriod
    } : null

    const summary: DailyHealthSummary = {
      mood: latestPayload?.mood ?? null,
      steps: latestPayload?.steps ?? null,
      heartRate: latestPayload?.heartRate ?? null
    }

    const today: DailyHealthAggregateDay = {
      date: todayDate,
      startAt: new Date(todayDate + 'T00:00:00').getTime(),
      endAt: new Date(todayDate + 'T23:59:59').getTime(),
      hasCheckedIn: todayRecords.length > 0,
      recordCount: todayRecords.length,
      latestCheckInAt: latestPayload?.timestamp ?? null,
      summary,
      latestRecord
    }

    const windowPolicy: TodayCheckInWindowPolicy = {
      timezone: 'Asia/Shanghai',
      businessDate: todayDate,
      currentPeriod: period,
      opensAt,
      closesAt,
      isWithinCheckInWindow: period !== 'closed',
      promptState,
      promptMessage: MockApi.resolvePromptMessage(promptState)
    }

    const initialValues: CheckInFormInitialValues = {
      mood: latestPayload?.mood ?? null,
      steps: latestPayload?.steps ?? null,
      heartRate: latestPayload?.heartRate ?? null
    }

    const response: TodayCheckInStatusResponse = {
      userId,
      timezone: 'Asia/Shanghai',
      businessDate: todayDate,
      hasCheckedInToday: today.hasCheckedIn,
      lastCheckInAt: latestPayload?.timestamp ?? null,
      trackedMetrics,
      window: windowPolicy,
      summary,
      today,
      latestRecord,
      form: {
        editableMetrics: trackedMetrics,
        initialValues: initialValues
      }
    }

    return response
  }

  static requestVerificationCode(phone: string): Promise<ApiResponse<VerificationResult>> {
    const universalCode = APP_CONFIG.verification.universalCode
    const codeHint = isUniversalCodeEnabled()
      ? `当前走 Mock 验证码轨道，演示验证码固定为 ${universalCode}，手机号 ${phone || '未填写'}`
      : `当前走 Mock 验证码轨道，但正式环境已禁用万能验证码，手机号 ${phone || '未填写'}`

    const result: VerificationResult = {
      codeHint: codeHint,
      canBypass: isUniversalCodeEnabled()
    }

    return ok(result, '开发验证码已准备');
  }

  static register(name: string, password: string, role: UserRole, cityCode?: string): Promise<ApiResponse<AuthResult>> {
    const normalizedName = name.trim()
    const existingUser = MockApi.users.find((item) => item.name === normalizedName)
    if (existingUser) {
      const errResponse: ApiResponse<AuthResult> = {
        code: 400,
        data: null,
        message: '用户名已存在'
      }
      return Promise.resolve(errResponse)
    }

    const userId = `mock-user-${Date.now()}`
    MockApi.users.push({
      userId,
      name: normalizedName,
      password,
      role,
      cityCode
    })
    MockApi.profiles.set(userId, {
      userId,
      name: normalizedName,
      role,
      cityCode: cityCode ?? '',
      city: '',
      trackedMetrics: [],
      familyId: null,
      familyInfo: null
    })

    const authResult: AuthResult = {
      userId,
      name: normalizedName,
      role,
      cityCode
    }
    return ok(authResult, '注册成功')
  }

  static login(name: string, password: string): Promise<ApiResponse<AuthResult>> {
    const normalizedName = name.trim()
    const user = MockApi.users.find((item) => item.name === normalizedName && item.password === password)
    if (!user) {
      const errResponse: ApiResponse<AuthResult> = {
        code: 401,
        data: null,
        message: '用户名或密码错误'
      }
      return Promise.resolve(errResponse)
    }

    const authResult: AuthResult = {
      userId: user.userId,
      name: user.name,
      role: user.role,
      cityCode: user.cityCode
    }
    return ok(authResult, '登录成功')
  }

  static getUserProfile(userId: string): Promise<ApiResponse<UserProfileResponse>> {
    const profile = MockApi.profiles.get(userId)
    if (!profile) {
      const errResponse: ApiResponse<UserProfileResponse> = {
        code: 404,
        data: null,
        message: '用户不存在'
      }
      return Promise.resolve(errResponse)
    }
    return ok(profile, 'success')
  }

  static updateUserProfile(payload: UserProfileUpdatePayload): Promise<ApiResponse<UserProfileResponse>> {
    const profile = MockApi.profiles.get(payload.userId)
    if (!profile) {
      const errResponse: ApiResponse<UserProfileResponse> = {
        code: 404,
        data: null,
        message: '用户不存在'
      }
      return Promise.resolve(errResponse)
    }

    profile.cityCode = payload.cityCode ?? profile.cityCode
    profile.city = payload.city ?? profile.city
    profile.trackedMetrics = payload.trackedMetrics?.length ? payload.trackedMetrics : profile.trackedMetrics
    return ok(profile, '个人信息更新成功')
  }

  static createFamily(userId: string, familyName?: string): Promise<ApiResponse<FamilyCreateResult>> {
    const profile = MockApi.profiles.get(userId)
    if (!profile) {
      const errResponse: ApiResponse<FamilyCreateResult> = {
        code: 404,
        data: null,
        message: '用户不存在'
      }
      return Promise.resolve(errResponse)
    }

    if (profile.familyInfo) {
      const result: FamilyCreateResult = {
        familyId: profile.familyInfo.familyId,
        inviteCode: profile.familyInfo.inviteCode,
        name: profile.familyInfo.familyName
      }
      return ok(result, '用户已在家庭中，返回现有牵挂码')
    }

    const familyId = `mock-family-${Date.now()}`
    const inviteCode = String(Date.now()).slice(-6).toUpperCase()
    const familyInfo: FamilyInfo = {
      familyId,
      familyName: familyName && familyName.trim().length > 0 ? familyName.trim() : `${profile.name}的家庭`,
      inviteCode,
      members: [MockApi.buildMember(userId)]
    }
    MockApi.families.set(familyId, familyInfo)
    MockApi.attachFamilyToProfile(userId, familyInfo)

    const createResult: FamilyCreateResult = {
      familyId,
      inviteCode,
      name: familyInfo.familyName
    }
    return ok(createResult, '家庭创建成功，牵挂码已生成')
  }

  static joinFamily(userId: string, inviteCode: string): Promise<ApiResponse<FamilyJoinResult>> {
    const profile = MockApi.profiles.get(userId)
    if (!profile) {
      const errResponse: ApiResponse<FamilyJoinResult> = {
        code: 404,
        data: null,
        message: '用户不存在'
      }
      return Promise.resolve(errResponse)
    }

    let targetFamily: FamilyInfo | undefined = undefined
    const familyList: FamilyInfo[] = []
    MockApi.families.forEach((value: FamilyInfo) => {
      familyList.push(value)
    })
    for (let i = 0; i < familyList.length; i++) {
      const family = familyList[i]
      if (family.inviteCode === inviteCode.toUpperCase()) {
        targetFamily = family
        break
      }
    }
    if (!targetFamily) {
      const errResponse: ApiResponse<FamilyJoinResult> = {
        code: 404,
        data: null,
        message: '牵挂码无效'
      }
      return Promise.resolve(errResponse)
    }

    if (!targetFamily.members.some((member) => member.userId === userId)) {
      targetFamily.members = targetFamily.members.concat(MockApi.buildMember(userId))
    }

    for (let index = 0; index < targetFamily.members.length; index += 1) {
      MockApi.attachFamilyToProfile(targetFamily.members[index].userId, targetFamily)
    }

    const joinResult: FamilyJoinResult = {
      familyId: targetFamily.familyId,
      name: targetFamily.familyName
    }
    return ok(joinResult, '成功加入家庭')
  }

  static submitCheckIn(payload: CheckInPayload): Promise<ApiResponse<CheckInResult>> {
    const existingRecords = MockApi.checkInRecords.get(payload.userId) ?? []
    MockApi.checkInRecords.set(payload.userId, [payload].concat(existingRecords))
    const result: CheckInResult = {
      recordId: `mock-${payload.userId}-${payload.timestamp}`,
      createdAt: payload.timestamp
    }

    return ok(result, '打卡成功');
  }

  static getTodayCheckInStatus(userId: string): Promise<ApiResponse<TodayCheckInStatusResponse>> {
    const profile = MockApi.profiles.get(userId)
    if (!profile) {
      const errResponse: ApiResponse<TodayCheckInStatusResponse> = {
        code: 404,
        data: null,
        message: '用户不存在'
      }
      return Promise.resolve(errResponse)
    }

    return ok(MockApi.buildTodayStatus(userId), 'success')
  }

  static getWarningStatus(userId: string): Promise<ApiResponse<WarningStatusData>> {
    const result: WarningStatusData = {
      lastInteractionTime: Date.now() - 2 * 60 * 60 * 1000,
      warningLevel: 0,
      isTriggered: false
    }

    return ok(result, `${userId} 的预警状态已加载`);
  }

  static getWeather(cityCode: string): Promise<ApiResponse<WeatherData>> {
    const result: WeatherData = {
      cityCode: cityCode,
      weatherType: 'sunny',
      temperature: 27,
      humidity: 58
    }

    return ok(result, '天气数据已加载');
  }

  static getVoiceList(userId: string): Promise<ApiResponse<VoiceListResponse>> {
    const now = Date.now()
    const records: VoiceListItem[] = [
      {
        id: 'mock-voice-001',
        senderId: 'mock-elder-001',
        senderName: '张阿姨',
        senderRole: 'elder',
        audioUrl: 'https://api.youziyi.com/mock/audio/001.mp3',
        duration: 12,
        createdAt: now - 3600_000
      },
      {
        id: 'mock-voice-002',
        senderId: 'mock-child-001',
        senderName: '小李',
        senderRole: 'child',
        audioUrl: 'https://api.youziyi.com/mock/audio/002.mp3',
        duration: 8,
        createdAt: now - 7200_000
      }
    ]

    const voiceListResult: VoiceListResponse = { records, total: records.length }
    return ok(voiceListResult, `${userId} 的语音列表已加载`)
  }

  static uploadVoice(userId: string, filePath: string): Promise<ApiResponse<VoiceUploadResult>> {
    const result: VoiceUploadResult = {
      recordId: `mock-voice-${Date.now()}`,
      audioUrl: filePath,
      duration: 5
    }

    return ok(result, '语音上传成功')
  }

  static saveCareProfile(profile: CareProfileDraft): Promise<ApiResponse<CareProfileDraft>> {
    return ok(profile, '关怀资料已暂存');
  }
}
