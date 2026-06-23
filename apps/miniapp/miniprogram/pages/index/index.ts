import {
  normalizeTrackedMetrics,
  resolveCityLabel,
  type CheckInMetricsData,
  type CheckInPeriod,
  type DailyHealthAggregatesResponse,
  type TodayCheckInStatusResponse,
  type TrackedMetric,
} from '../../utils/youziyi-types';
import { request } from '../../utils/request';

function formatDateLabel(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) {
    return dateKey;
  }
  return `${Number(parts[1])} 月 ${Number(parts[2])} 日`;
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

function formatWindowLabel(startAt: number | null | undefined, endAt: number | null | undefined): string {
  if (!startAt || !endAt) {
    return '暂无';
  }
  return `${formatTimeLabel(startAt)} - ${formatTimeLabel(endAt)}`;
}

function getPeriodLabel(period: CheckInPeriod | undefined): string {
  switch (period) {
    case 'morning':
      return '早间';
    case 'daytime':
      return '日间';
    case 'evening':
      return '晚间';
    case 'closed':
      return '关闭';
    default:
      return '未知';
  }
}

function getMetricCardLabel(metric: TrackedMetric): string {
  switch (metric) {
    case 'mood':
      return '心情';
    case 'steps':
      return '步数';
    case 'heartRate':
      return '心率';
    case 'bloodPressure':
      return '血压';
    case 'bloodSugar':
      return '血糖';
    case 'sleep':
      return '睡眠';
    default:
      return metric;
  }
}

function getMoodLabel(mood: string | null | undefined): string {
  switch (mood) {
    case 'happy':
      return '开心';
    case 'calm':
      return '平静';
    case 'sad':
      return '有点低落';
    default:
      return '暂无';
  }
}

function formatTrackedSummary(
  metric: TrackedMetric,
  summary: { mood: string | null; steps: number | null; heartRate: number | null },
): string | null {
  switch (metric) {
    case 'mood':
      return `心情 ${getMoodLabel(summary.mood)}`;
    case 'steps':
      return `步数 ${summary.steps !== null && summary.steps !== undefined ? summary.steps : '--'}`;
    case 'heartRate':
      return `心率 ${summary.heartRate !== null && summary.heartRate !== undefined ? summary.heartRate : '--'}`;
    default:
      return null;
  }
}

function buildCheckInReminderKey(status: TodayCheckInStatusResponse | null | undefined): string | null {
  if (!(status && status.userId) || !status.businessDate) {
    return null;
  }
  return `${status.userId}:${status.businessDate}`;
}

function canPromptCheckIn(status: TodayCheckInStatusResponse | null | undefined): boolean {
  return Boolean(
    status &&
      !status.hasCheckedInToday &&
      status.window &&
      status.window.isWithinCheckInWindow
  );
}

interface CheckInPayload {
  userId: string;
  timestamp: number;
  mood?: string;
  steps?: number;
  heartRate?: number;
  metricsData: CheckInMetricsData;
}

interface RecentDayDisplay {
  date: string;
  dateLabel: string;
  hasCheckedIn: boolean;
  recordCount: number;
  latestCheckInLabel: string;
  moodLabel: string;
  stepsLabel: string;
  heartRateLabel: string;
}

interface IndexData {
  isLoading: boolean;
  userId: string | null;
  userProfile: UserProfileMiniapp | null;
  todayCheckInStatus: TodayCheckInStatusResponse | null;
  dailyHealthAggregates: DailyHealthAggregatesResponse | null;
  trackedMetrics: TrackedMetric[];
  editableMetrics: TrackedMetric[];
  summaryMetrics: TrackedMetric[];
  cityLabel: string;
  todaySummaryText: string;
  windowLabel: string;
  businessDateLabel: string;
  lastCheckInLabel: string;
  currentPeriodLabel: string;
  editableMetricLabels: string[];
  recentDaysDisplay: RecentDayDisplay[];
  mood: string;
  steps: number;
  heartRate: number;
  bloodPressure: string;
  bloodSugar: number;
  sleep: string;
  moods: Array<{ value: string; icon: string; label: string }>;
  sleepOptions: Array<{ value: string; icon: string; label: string }>;
  hasMood: boolean;
  hasSteps: boolean;
  hasHeartRate: boolean;
  hasBloodPressure: boolean;
  hasBloodSugar: boolean;
  hasSleep: boolean;
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  inviteCode: string | null;
  showCheckInReminder: boolean;
  hydratedKey: string;
}

Page<IndexData, WechatMiniprogram.IAnyObject>({
  data: {
    isLoading: true,
    userId: null,
    userProfile: null,
    todayCheckInStatus: null,
    dailyHealthAggregates: null,
    trackedMetrics: [],
    editableMetrics: [],
    summaryMetrics: [],
    cityLabel: '待完善城市',
    todaySummaryText: '等待今日状态',
    windowLabel: '暂无',
    businessDateLabel: '暂无',
    lastCheckInLabel: '暂无',
    currentPeriodLabel: '未知',
    editableMetricLabels: [],
    recentDaysDisplay: [],
    mood: 'happy',
    steps: 0,
    heartRate: 75,
    bloodPressure: '120/80',
    bloodSugar: 5.5,
    sleep: 'good',
    moods: [
      { value: 'happy', icon: '😊', label: '开心' },
      { value: 'calm', icon: '😐', label: '平静' },
      { value: 'sad', icon: '😔', label: '伤心' },
    ],
    sleepOptions: [
      { value: 'good', icon: '😄', label: '很好' },
      { value: 'normal', icon: '🙂', label: '一般' },
      { value: 'bad', icon: '😫', label: '不好' },
    ],
    hasMood: false,
    hasSteps: false,
    hasHeartRate: false,
    hasBloodPressure: false,
    hasBloodSugar: false,
    hasSleep: false,
    isSubmitting: false,
    isSubmitDisabled: true,
    message: null,
    inviteCode: null,
    showCheckInReminder: false,
    hydratedKey: '',
  },

  onLoad() {
    const app = getApp<IAppOption>();
    const userId = app.globalData.userId;

    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.reLaunch({ url: '/pages/welcome/welcome' });
      return;
    }

    this.setData({ userId });
    void this.loadData(userId);
  },

  onPullDownRefresh() {
    const userId = this.data.userId;
    if (!userId) {
      wx.stopPullDownRefresh();
      return;
    }
    void this.loadData(userId).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadData(userId: string) {
    this.setData({ isLoading: true });

    try {
      const [profileRes, statusRes, dailyRes] = await Promise.all([
        request<UserProfileMiniapp>({
          url: `/api/user/profile/${userId}`,
          method: 'GET',
        }),
        request<TodayCheckInStatusResponse>({
          url: `/api/health/checkin-status/${userId}`,
          method: 'GET',
        }),
        request<DailyHealthAggregatesResponse>({
          url: `/api/health/checkins/daily/${userId}?days=7`,
          method: 'GET',
        }),
      ]);

      const userProfile = profileRes.data;
      const todayCheckInStatus = statusRes.data;
      const dailyHealthAggregates = dailyRes.data;

      const app = getApp<IAppOption>();
      app.setUserProfile(userProfile);

      const trackedMetrics = normalizeTrackedMetrics(userProfile && userProfile.trackedMetrics);
      const editableMetrics = Array.isArray(
        todayCheckInStatus && todayCheckInStatus.form && todayCheckInStatus.form.editableMetrics,
      )
        ? normalizeTrackedMetrics(todayCheckInStatus.form.editableMetrics)
        : trackedMetrics;
      const summaryMetrics = editableMetrics.filter(
        (metric) => metric === 'mood' || metric === 'steps' || metric === 'heartRate',
      );
      const cityArg =
        userProfile && userProfile.city !== null && userProfile.city !== undefined
          ? userProfile.city
          : undefined;
      const cityCodeArg =
        userProfile && userProfile.cityCode !== null && userProfile.cityCode !== undefined
          ? userProfile.cityCode
          : undefined;
      const cityLabel = resolveCityLabel(cityArg, cityCodeArg) || '待完善城市';

      const windowPolicy =
        todayCheckInStatus &&
        todayCheckInStatus.window !== null &&
        todayCheckInStatus.window !== undefined
          ? todayCheckInStatus.window
          : null;
      const todaySummary =
        todayCheckInStatus &&
        todayCheckInStatus.summary !== null &&
        todayCheckInStatus.summary !== undefined
          ? todayCheckInStatus.summary
          : null;
      const todaySummaryText = summaryMetrics
        .map((metric) =>
          formatTrackedSummary(
            metric,
            todaySummary !== null && todaySummary !== undefined
              ? todaySummary
              : { mood: null, steps: null, heartRate: null },
          ),
        )
        .filter((item): item is string => Boolean(item))
        .join(' / ') || '等待今日状态';
      const windowLabel = formatWindowLabel(
        windowPolicy && windowPolicy.opensAt !== null && windowPolicy.opensAt !== undefined
          ? windowPolicy.opensAt
          : undefined,
        windowPolicy && windowPolicy.closesAt !== null && windowPolicy.closesAt !== undefined
          ? windowPolicy.closesAt
          : undefined,
      );
      const businessDateLabel =
        todayCheckInStatus && todayCheckInStatus.businessDate
          ? formatDateLabel(todayCheckInStatus.businessDate)
          : '暂无';
      const lastCheckInLabel = formatTimeLabel(
        todayCheckInStatus &&
          todayCheckInStatus.lastCheckInAt !== null &&
          todayCheckInStatus.lastCheckInAt !== undefined
          ? todayCheckInStatus.lastCheckInAt
          : undefined,
      );
      const currentPeriodLabel = getPeriodLabel(
        windowPolicy &&
          windowPolicy.currentPeriod !== null &&
          windowPolicy.currentPeriod !== undefined
          ? windowPolicy.currentPeriod
          : undefined,
      );
      const editableMetricLabels = editableMetrics.map((metric) => getMetricCardLabel(metric));
      const hasMood = editableMetrics.includes('mood');
      const hasSteps = editableMetrics.includes('steps');
      const hasHeartRate = editableMetrics.includes('heartRate');
      const hasBloodPressure = editableMetrics.includes('bloodPressure');
      const hasBloodSugar = editableMetrics.includes('bloodSugar');
      const hasSleep = editableMetrics.includes('sleep');

      const recentDays =
        dailyHealthAggregates &&
        dailyHealthAggregates.recentDays !== null &&
        dailyHealthAggregates.recentDays !== undefined
          ? dailyHealthAggregates.recentDays
          : [];
      const recentDaysDisplay: RecentDayDisplay[] = recentDays.map((day) => ({
        date: day.date,
        dateLabel: formatDateLabel(day.date),
        hasCheckedIn: day.hasCheckedIn,
        recordCount: day.recordCount,
        latestCheckInLabel: formatTimeLabel(day.latestCheckInAt),
        moodLabel:
          day.summary.mood !== null && day.summary.mood !== undefined ? day.summary.mood : '暂无',
        stepsLabel:
          day.summary.steps !== null && day.summary.steps !== undefined
            ? String(day.summary.steps)
            : '--',
        heartRateLabel:
          day.summary.heartRate !== null && day.summary.heartRate !== undefined
            ? String(day.summary.heartRate)
            : '--',
      }));

      const isSubmitDisabled =
        editableMetrics.length === 0 ||
        !(windowPolicy && windowPolicy.isWithinCheckInWindow) ||
        Boolean(todayCheckInStatus && todayCheckInStatus.hasCheckedInToday);

      this.setData(
        {
          isLoading: false,
          userProfile,
          todayCheckInStatus,
          dailyHealthAggregates,
          trackedMetrics,
          editableMetrics,
          summaryMetrics,
          cityLabel,
          todaySummaryText,
          windowLabel,
          businessDateLabel,
          lastCheckInLabel,
          currentPeriodLabel,
          editableMetricLabels,
          hasMood,
          hasSteps,
          hasHeartRate,
          hasBloodPressure,
          hasBloodSugar,
          hasSleep,
          recentDaysDisplay,
          isSubmitDisabled,
        },
        () => {
          this.hydrateFormValues();
          this.maybeShowCheckInReminder();
        },
      );
    } catch (error) {
      console.error('加载关怀面板失败', error);
      wx.showToast({ title: '加载失败，请下拉重试', icon: 'none' });
      this.setData({ isLoading: false });
    }
  },

  hydrateFormValues() {
    const { todayCheckInStatus, hydratedKey } = this.data;
    if (!todayCheckInStatus) {
      return;
    }

    const nextKey = `${
      todayCheckInStatus.businessDate !== null && todayCheckInStatus.businessDate !== undefined
        ? todayCheckInStatus.businessDate
        : 'none'
    }:${
      todayCheckInStatus.lastCheckInAt !== null && todayCheckInStatus.lastCheckInAt !== undefined
        ? todayCheckInStatus.lastCheckInAt
        : 'none'
    }`;
    if (nextKey === hydratedKey) {
      return;
    }

    const initialValues = todayCheckInStatus.form && todayCheckInStatus.form.initialValues;
    this.setData({
      mood:
        initialValues &&
        initialValues.mood !== null &&
        initialValues.mood !== undefined
          ? initialValues.mood
          : 'happy',
      steps:
        initialValues &&
        initialValues.steps !== null &&
        initialValues.steps !== undefined
          ? initialValues.steps
          : 0,
      heartRate:
        initialValues &&
        initialValues.heartRate !== null &&
        initialValues.heartRate !== undefined
          ? initialValues.heartRate
          : 75,
      hydratedKey: nextKey,
    });
  },

  maybeShowCheckInReminder() {
    const { todayCheckInStatus } = this.data;
    const app = getApp<IAppOption>();
    const reminderKey = buildCheckInReminderKey(todayCheckInStatus);

    if (!canPromptCheckIn(todayCheckInStatus) || !reminderKey) {
      this.setData({ showCheckInReminder: false });
      return;
    }

    if (app.globalData.shownCheckInReminderKeys.includes(reminderKey)) {
      return;
    }

    app.markCheckInReminderShown(reminderKey);
    this.setData({ showCheckInReminder: true });
  },

  dismissReminder() {
    this.setData({ showCheckInReminder: false });
  },

  focusCheckInForm() {
    this.setData({ showCheckInReminder: false });
    wx.pageScrollTo({ selector: '#checkin-form', duration: 300 });
  },

  navigateToProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  switchToCompanion() {
    const app = getApp<IAppOption>();
    app.setViewMode('companion');
    wx.reLaunch({ url: '/pages/companion/companion' });
  },

  async generateInviteCode() {
    const userId = this.data.userId;
    if (!userId) {
      wx.showToast({ title: '登录状态已失效', icon: 'none' });
      return;
    }

    this.setData({ message: null });
    wx.showLoading({ title: '生成中...', mask: true });

    try {
      const res = await request<{ inviteCode: string }>({
        url: '/api/family/create',
        method: 'POST',
        data: { userId },
      });

      this.setData({ inviteCode: res.data.inviteCode });
      wx.showToast({ title: `牵挂码：${res.data.inviteCode}`, icon: 'none' });

      await this.loadData(userId);
    } catch (error) {
      console.error('生成牵挂码失败', error);
      this.setData({ message: { type: 'error', text: '牵挂码生成失败，请稍后重试。' } });
    } finally {
      wx.hideLoading();
    }
  },

  selectMood(e: WechatMiniprogram.TouchEvent) {
    const mood = e.currentTarget.dataset.value as string;
    this.setData({ mood });
    wx.vibrateShort({ type: 'light' });
  },

  onStepsInput(e: WechatMiniprogram.Input) {
    const value =
      e.detail.value !== null && e.detail.value !== undefined ? e.detail.value : '';
    const steps = value === '' ? 0 : parseInt(value, 10);
    this.setData({ steps: Number.isNaN(steps) ? 0 : steps });
  },

  onHeartRateInput(e: WechatMiniprogram.Input) {
    const value =
      e.detail.value !== null && e.detail.value !== undefined ? e.detail.value : '';
    const heartRate = value === '' ? 0 : parseInt(value, 10);
    this.setData({ heartRate: Number.isNaN(heartRate) ? 0 : heartRate });
  },

  onBloodPressureInput(e: WechatMiniprogram.Input) {
    this.setData({
      bloodPressure:
        e.detail.value !== null && e.detail.value !== undefined ? e.detail.value : '',
    });
  },

  onBloodSugarInput(e: WechatMiniprogram.Input) {
    const value =
      e.detail.value !== null && e.detail.value !== undefined ? e.detail.value : '';
    const bloodSugar = value === '' ? 0 : parseFloat(value);
    this.setData({ bloodSugar: Number.isNaN(bloodSugar) ? 0 : bloodSugar });
  },

  selectSleep(e: WechatMiniprogram.TouchEvent) {
    const sleep = e.currentTarget.dataset.value as string;
    this.setData({ sleep });
    wx.vibrateShort({ type: 'light' });
  },

  async submitCheckIn() {
    const { userId, editableMetrics, todayCheckInStatus } = this.data;

    if (!userId) {
      this.setData({ message: { type: 'error', text: '登录状态已失效，请重新登录后再打卡。' } });
      return;
    }

    if (!editableMetrics.length) {
      this.setData({
        message: {
          type: 'error',
          text: '当前没有可打卡的指标，请先前往个人设置选择健康指标。',
        },
      });
      return;
    }

    if (!(todayCheckInStatus && todayCheckInStatus.window && todayCheckInStatus.window.isWithinCheckInWindow)) {
      this.setData({
        message: {
          type: 'error',
          text:
            todayCheckInStatus &&
            todayCheckInStatus.window &&
            todayCheckInStatus.window.promptMessage !== null &&
            todayCheckInStatus.window.promptMessage !== undefined
              ? todayCheckInStatus.window.promptMessage
              : '当前不在今日打卡窗口内。',
        },
      });
      return;
    }

    if (todayCheckInStatus && todayCheckInStatus.hasCheckedInToday) {
      this.setData({ message: { type: 'error', text: '今天已经完成打卡了，明天再来记录吧。' } });
      return;
    }

    this.setData({ isSubmitting: true, isSubmitDisabled: true, message: null });

    const metricsData: CheckInMetricsData = {};
    const checkinData: CheckInPayload = {
      userId,
      timestamp: Date.now(),
      metricsData,
    };

    if (editableMetrics.includes('mood')) {
      checkinData.mood = this.data.mood;
      metricsData.mood = this.data.mood;
    }
    if (editableMetrics.includes('steps')) {
      checkinData.steps = this.data.steps;
      metricsData.steps = this.data.steps;
    }
    if (editableMetrics.includes('heartRate')) {
      checkinData.heartRate = this.data.heartRate;
      metricsData.heartRate = this.data.heartRate;
    }
    if (editableMetrics.includes('bloodPressure')) {
      metricsData.bloodPressure = this.data.bloodPressure;
    }
    if (editableMetrics.includes('bloodSugar')) {
      metricsData.bloodSugar = this.data.bloodSugar;
    }
    if (editableMetrics.includes('sleep')) {
      metricsData.sleep = this.data.sleep;
    }

    try {
      await request<{ recordId: string }>({
        url: '/api/health/checkin',
        method: 'POST',
        data: checkinData,
      });

      this.setData({ message: { type: 'success', text: '记录成功，今日状态已经同步给家人。' } });
      wx.showToast({ title: '打卡成功', icon: 'success' });
      wx.vibrateShort({ type: 'heavy' });

      await this.loadData(userId);
    } catch (error) {
      console.error('打卡失败', error);
      this.setData({ message: { type: 'error', text: '哎呀，记录小纸条没传过去，再试一次吧。' } });
    } finally {
      const { editableMetrics: currentEditableMetrics, todayCheckInStatus: currentStatus } = this.data;
      const disabled =
        currentEditableMetrics.length === 0 ||
        !(currentStatus && currentStatus.window && currentStatus.window.isWithinCheckInWindow) ||
        Boolean(currentStatus && currentStatus.hasCheckedInToday);
      this.setData({ isSubmitting: false, isSubmitDisabled: disabled });
    }
  },
});
