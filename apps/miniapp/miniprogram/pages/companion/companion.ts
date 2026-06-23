import {
  resolveCityLabel,
  resolveTodayHealthSnapshot,
  type DailyHealthAggregatesResponse,
  type FamilyInfo,
  type FamilyProfileMember,
  type TodayCheckInStatusResponse,
  type TodayHealthSnapshot,
  type VoiceListItem,
  type VoiceListResponse,
  type WarningStatusResponse,
  type WeatherData,
} from '../../utils/youziyi-types';
import { request } from '../../utils/request';

interface WeatherDisplay {
  cityText: string;
  icon: string;
  name: string;
  temperatureText: string;
  available: boolean;
}

interface DisplayMember {
  userId: string;
  name: string;
  role: string;
  city?: string | null;
  cityCode?: string | null;
  roleText: string;
  cityText: string;
}

interface SharedStatusDisplay {
  targetName: string;
  statusTitle: string;
  moodIcon: string;
  moodLabel: string;
  stepsText: string;
  heartRateText: string;
  updateTimeText: string;
}

interface CompanionData {
  isLoading: boolean;
  currentDate: string;
  userId: string | null;
  userRole: 'elder' | 'child' | null;
  profile: UserProfileMiniapp | null;
  warningStatus: WarningStatusResponse | null;
  elderWeatherDisplay: WeatherDisplay;
  childWeatherDisplay: WeatherDisplay;
  voices: VoiceListItem[];
  todayHealthSnapshot: TodayHealthSnapshot | null;
  sharedStatusDisplay: SharedStatusDisplay;
  sharedHealthTargetMember: DisplayMember | null;
  counterpartMember: DisplayMember | null;
  elderMember: DisplayMember | null;
  childMember: DisplayMember | null;
  inviteCode: string | null;
  actionMessage: string | null;
  warningToast: {
    visible: boolean;
    icon: string;
    title: string;
    message: string;
    levelClass: string;
  };
  thermometer: {
    statusText: string;
    levelClass: string;
    durationText: string;
  };
  counterpartProfileTitle: string;
  familyStatusText: string;
}

interface CompanionCustom {
  timer: number | null;
  initialize(): void;
  refreshIfAuthenticated(): Promise<void>;
  syncDashboard(): Promise<void>;
  onProfileTap(): void;
  onSwitchModeTap(): void;
  onGenerateCodeTap(): void;
  onNavigateToVoiceTap(): void;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟`;
  }
  return `${minutes} 分钟`;
}

function getWeatherIcon(type: string): string {
  switch (type) {
    case 'sunny':
      return '☀️';
    case 'cloudy':
      return '⛅';
    case 'rainy':
      return '🌧️';
    case 'snowy':
      return '❄️';
    default:
      return '🌤️';
  }
}

function getWeatherName(type: string): string {
  switch (type) {
    case 'sunny':
      return '晴';
    case 'cloudy':
      return '多云';
    case 'rainy':
      return '雨';
    case 'snowy':
      return '雪';
    default:
      return '未知';
  }
}

function getMoodLabel(mood: string): string {
  switch (mood) {
    case 'happy':
      return '开心';
    case 'calm':
      return '平静';
    case 'sad':
      return '伤心';
    default:
      return '开心';
  }
}

function getMoodIcon(mood: string): string {
  switch (mood) {
    case 'happy':
      return '😊';
    case 'calm':
      return '😐';
    case 'sad':
      return '😔';
    default:
      return '😊';
  }
}

function formatTimeLabel(timestamp: number | null | undefined): string {
  if (!timestamp) {
    return '暂无';
  }
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeCityCode(cityCode?: string | null): string {
  return typeof cityCode === 'string' ? cityCode.trim().toUpperCase() : '';
}

function weatherMatchesCityCode(
  weather: { cityCode?: string | null } | null | undefined,
  cityCode?: string | null,
): boolean {
  const expectedCityCode = normalizeCityCode(cityCode);
  if (!expectedCityCode) {
    return false;
  }
  return normalizeCityCode(weather ? weather.cityCode : null) === expectedCityCode;
}

function resolveFamilyWeatherCityCodes(
  profile: {
    role?: string | null;
    cityCode?: string | null;
    familyInfo?: {
      members?: Array<{
        userId: string;
        role: string;
        cityCode?: string | null;
      }>;
    } | null;
  } | null,
  userId: string,
  fallbackRole?: string | null,
) {
  const familyMembers = profile && profile.familyInfo && profile.familyInfo.members ? profile.familyInfo.members : [];
  const currentProfileRole = profile && profile.role ? profile.role : fallbackRole || null;
  const currentMember =
    familyMembers.find((member) => member.userId === userId) ||
    familyMembers.find((member) => member.role === currentProfileRole) ||
    null;
  const counterpartMember =
    familyMembers.find((member) => member.userId !== userId) ||
    familyMembers.find((member) => member.role !== currentProfileRole) ||
    null;
  const elderMember =
    familyMembers.find((member) => member.role === 'elder') ||
    (currentProfileRole === 'elder' ? currentMember : counterpartMember);
  const childMember =
    familyMembers.find((member) => member.role === 'child') ||
    (currentProfileRole === 'child' ? currentMember : counterpartMember);

  return {
    elderCityCode:
      (elderMember && elderMember.cityCode) || (currentProfileRole === 'elder' ? (profile && profile.cityCode) : null),
    childCityCode:
      (childMember && childMember.cityCode) || (currentProfileRole === 'child' ? (profile && profile.cityCode) : null),
  };
}

function buildDisplayMember(member: FamilyProfileMember | null | undefined): DisplayMember | null {
  if (!member) {
    return null;
  }
  return {
    userId: member.userId,
    name: member.name,
    role: member.role,
    city: member.city,
    cityCode: member.cityCode,
    roleText: member.role === 'elder' ? '长辈' : '子女',
    cityText: resolveCityLabel(member.city, member.cityCode) || '待完善',
  };
}

function formatCurrentDate(): string {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function createEmptyWeatherDisplay(): WeatherDisplay {
  return {
    cityText: '待连接家人',
    icon: '...',
    name: '',
    temperatureText: '天气暂不可用',
    available: false,
  };
}

function createEmptySharedStatusDisplay(): SharedStatusDisplay {
  return {
    targetName: '待连接',
    statusTitle: '今日待打卡',
    moodIcon: '...',
    moodLabel: '获取中',
    stepsText: '--',
    heartRateText: '--',
    updateTimeText: '暂无',
  };
}

function formatWeatherDisplay(
  member: DisplayMember | null,
  weather: WeatherData | null,
  expectedCityCode: string | null,
): WeatherDisplay {
  const cityText = (member && member.cityText) || '待连接家人';
  if (!weather || !weatherMatchesCityCode(weather, expectedCityCode)) {
    return {
      cityText,
      icon: '...',
      name: '',
      temperatureText: '天气暂不可用',
      available: false,
    };
  }
  return {
    cityText,
    icon: getWeatherIcon(weather.weatherType),
    name: getWeatherName(weather.weatherType),
    temperatureText: `${getWeatherName(weather.weatherType)} · ${weather.temperature}°C`,
    available: true,
  };
}

function formatSharedStatusDisplay(
  member: DisplayMember | null,
  snapshot: TodayHealthSnapshot | null,
): SharedStatusDisplay {
  const targetName = (member && member.name) || '待连接';
  const statusTitle = snapshot && snapshot.hasCheckedIn ? '今日已更新' : '今日待打卡';
  const summary = snapshot ? snapshot.summary : null;
  const mood = (summary && summary.mood) || '';
  return {
    targetName,
    statusTitle,
    moodIcon: getMoodIcon(mood),
    moodLabel: getMoodLabel(mood),
    stepsText:
      summary && summary.steps !== null && summary.steps !== undefined
        ? String(summary.steps)
        : '--',
    heartRateText:
      summary && summary.heartRate !== null && summary.heartRate !== undefined
        ? String(summary.heartRate)
        : '--',
    updateTimeText: formatTimeLabel(snapshot && snapshot.latestCheckInAt ? snapshot.latestCheckInAt : null),
  };
}

function formatFamilyStatusText(profile: UserProfileMiniapp | null): string {
  const members = profile && profile.familyInfo && (profile.familyInfo as FamilyInfo).members
    ? (profile.familyInfo as FamilyInfo).members
    : [];
  return members.length > 1 ? `已连接 ${members.length} 人` : '等待家人加入';
}

function fetchWeatherIfNeeded(cityCode: string | null | undefined): Promise<WeatherData | null> {
  if (!cityCode) {
    return Promise.resolve(null);
  }
  return request<WeatherData>({
    url: `/api/weather/current?cityCode=${encodeURIComponent(cityCode)}`,
    method: 'GET',
  })
    .then((res) => res.data)
    .catch(() => null);
}

Page<CompanionData, CompanionCustom>({
  data: {
    isLoading: false,
    currentDate: formatCurrentDate(),
    userId: null,
    userRole: null,
    profile: null,
    warningStatus: null,
    elderWeatherDisplay: createEmptyWeatherDisplay(),
    childWeatherDisplay: createEmptyWeatherDisplay(),
    voices: [],
    todayHealthSnapshot: null,
    sharedStatusDisplay: createEmptySharedStatusDisplay(),
    sharedHealthTargetMember: null,
    counterpartMember: null,
    elderMember: null,
    childMember: null,
    inviteCode: null,
    actionMessage: null,
    warningToast: {
      visible: false,
      icon: '',
      title: '',
      message: '',
      levelClass: '',
    },
    thermometer: {
      statusText: '加载中',
      levelClass: '',
      durationText: '--',
    },
    counterpartProfileTitle: '家庭成员资料',
    familyStatusText: '等待家人加入',
  },

  timer: null,

  onLoad() {
    this.initialize();
  },

  onShow() {
    this.refreshIfAuthenticated();
  },

  onUnload() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  onPullDownRefresh() {
    this.refreshIfAuthenticated().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  initialize() {
    const app = getApp<IAppOption>();
    const userId = app.globalData.userId;
    const userRole = app.globalData.userRole;

    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.reLaunch({ url: '/pages/welcome/welcome' });
      return;
    }

    this.setData({ userId, userRole, currentDate: formatCurrentDate() });
    void this.syncDashboard();

    this.timer = setInterval(() => {
      void this.syncDashboard();
    }, 60000);
  },

  refreshIfAuthenticated() {
    const app = getApp<IAppOption>();
    if (!app.globalData.userId) {
      return Promise.resolve();
    }
    this.setData({ currentDate: formatCurrentDate() });
    return this.syncDashboard();
  },

  async syncDashboard() {
    const app = getApp<IAppOption>();
    const userId = app.globalData.userId;

    if (!userId) {
      return;
    }

    this.setData({ isLoading: true });

    try {
      const profileRes = await request<UserProfileMiniapp>({
        url: `/api/user/profile/${userId}`,
        method: 'GET',
      });

      const profile = profileRes.data;
      app.setUserProfile(profile);

      const familyInfo = (profile.familyInfo as FamilyInfo | null | undefined) || null;
      const familyMembers = familyInfo && familyInfo.members ? familyInfo.members : [];
      const currentProfileRole = profile.role || app.globalData.userRole;

      const currentMember =
        buildDisplayMember(
          familyMembers.find((member) => member.userId === userId) ||
            familyMembers.find((member) => member.role === currentProfileRole),
        ) ||
        ({
          userId,
          name: profile.name || '我',
          role: currentProfileRole || 'child',
          city: profile.city,
          cityCode: profile.cityCode,
          roleText: currentProfileRole === 'elder' ? '长辈' : '子女',
          cityText: resolveCityLabel(profile.city, profile.cityCode) || '待完善',
        } as DisplayMember);

      const counterpartMember = buildDisplayMember(
        familyMembers.find((member) => member.userId !== userId) ||
          familyMembers.find((member) => member.role !== currentProfileRole),
      );

      const elderMember =
        buildDisplayMember(familyMembers.find((member) => member.role === 'elder')) ||
        (currentProfileRole === 'elder' ? currentMember : counterpartMember);

      const childMember =
        buildDisplayMember(familyMembers.find((member) => member.role === 'child')) ||
        (currentProfileRole === 'child' ? currentMember : counterpartMember);

      const sharedHealthTargetMember =
        currentProfileRole === 'child'
          ? (counterpartMember || elderMember || currentMember)
          : (currentMember || elderMember || counterpartMember);

      const sharedHealthTargetUserId = (sharedHealthTargetMember && sharedHealthTargetMember.userId) || userId;

      const weatherCityCodes = resolveFamilyWeatherCityCodes(profile, userId, app.globalData.userRole);

      const [warningRes, voiceRes, checkInStatusRes, dailyAggregatesRes, elderWeatherRes, childWeatherRes] =
        await Promise.all([
          request<WarningStatusResponse>({
            url: `/api/warning/status/${userId}`,
            method: 'GET',
          }),
          request<VoiceListResponse>({
            url: `/api/voice/list/${userId}`,
            method: 'GET',
          }),
          request<TodayCheckInStatusResponse>({
            url: `/api/health/checkin-status/${sharedHealthTargetUserId}`,
            method: 'GET',
          }),
          request<DailyHealthAggregatesResponse>({
            url: `/api/health/checkins/daily/${sharedHealthTargetUserId}?days=7`,
            method: 'GET',
          }),
          fetchWeatherIfNeeded(weatherCityCodes.elderCityCode),
          fetchWeatherIfNeeded(weatherCityCodes.childCityCode),
        ]);

      const warningStatus = warningRes.data;
      const voices = voiceRes.data && voiceRes.data.records ? voiceRes.data.records : [];
      const todayCheckInStatus = checkInStatusRes.data;
      const dailyHealthAggregates = dailyAggregatesRes.data;
      const elderWeather = elderWeatherRes || null;
      const childWeather = childWeatherRes || null;

      const todayHealthSnapshot = resolveTodayHealthSnapshot(todayCheckInStatus, dailyHealthAggregates);
      const currentTime = Date.now();

      const timeSinceInteraction =
        warningStatus && Number.isFinite(warningStatus.lastInteractionTime)
          ? Math.max(0, currentTime - warningStatus.lastInteractionTime)
          : 0;

      const warningLevel = warningStatus && warningStatus.warningLevel ? warningStatus.warningLevel : 0;
      const warningToast =
        warningLevel > 0
          ? {
              visible: true,
              icon: warningLevel === 1 ? '⚠️' : '🚨',
              title: warningLevel === 1 ? '管家温馨提示' : '管家紧急提醒',
              message: `长辈已经 ${formatDuration(timeSinceInteraction)} 没和您说话啦，打个电话关心一下吧。`,
              levelClass: warningLevel === 1 ? 'warning-toast-level1' : 'warning-toast-level2',
            }
          : {
              visible: false,
              icon: '',
              title: '',
              message: '',
              levelClass: '',
            };

      const thermometer = {
        statusText:
          warningLevel === 0
            ? '温度正好'
            : warningLevel === 1
              ? '需要添柴啦'
              : warningLevel > 1
                ? '快去暖暖场'
                : '加载中',
        levelClass:
          warningLevel === 0
            ? 'thermometer-warm'
            : warningLevel === 1
              ? 'thermometer-mild'
              : warningLevel > 1
                ? 'thermometer-cold'
                : '',
        durationText: warningStatus ? formatDuration(timeSinceInteraction) : '--',
      };

      this.setData({
        profile,
        warningStatus,
        voices,
        todayHealthSnapshot,
        elderWeatherDisplay: formatWeatherDisplay(
          elderMember || null,
          elderWeather,
          weatherCityCodes.elderCityCode || null,
        ),
        childWeatherDisplay: formatWeatherDisplay(
          childMember || null,
          childWeather,
          weatherCityCodes.childCityCode || null,
        ),
        sharedStatusDisplay: formatSharedStatusDisplay(sharedHealthTargetMember || null, todayHealthSnapshot),
        sharedHealthTargetMember,
        counterpartMember,
        elderMember,
        childMember,
        warningToast,
        thermometer,
        counterpartProfileTitle: currentProfileRole === 'child' ? '对方基础资料' : '家庭成员资料',
        familyStatusText: formatFamilyStatusText(profile),
      });
    } catch (error) {
      console.error('同步陪伴大屏失败', error);
      wx.showToast({ title: '同步失败，请下拉重试', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  onProfileTap() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  onSwitchModeTap() {
    const app = getApp<IAppOption>();
    app.setViewMode('care');
    wx.reLaunch({ url: '/pages/index/index' });
  },

  async onGenerateCodeTap() {
    const app = getApp<IAppOption>();
    const userId = app.globalData.userId;

    if (!userId) {
      this.setData({ actionMessage: '登录状态已失效，请重新登录后再生成亲情牵挂码。' });
      return;
    }

    this.setData({ actionMessage: null, isLoading: true });
    wx.showLoading({ title: '生成中...', mask: true });

    try {
      const res = await request<{ inviteCode: string }>({
        url: '/api/family/create',
        method: 'POST',
        data: { userId },
      });

      this.setData({
        inviteCode: res.data.inviteCode,
        actionMessage: '亲情牵挂码已生成，请分享给家人。',
      });

      await this.syncDashboard();
    } catch (error) {
      console.error('生成亲情牵挂码失败', error);
      this.setData({ actionMessage: '亲情牵挂码生成失败，请稍后重试。' });
    } finally {
      wx.hideLoading();
      this.setData({ isLoading: false });
    }
  },

  onNavigateToVoiceTap() {
    wx.navigateTo({ url: '/pages/voice/voice' });
  },
});
