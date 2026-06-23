import { CITY_OPTIONS, normalizeTrackedMetrics, TrackedMetric } from '../../utils/youziyi-types';
import { request } from '../../utils/request';

const DEFAULT_METRICS: Array<{ id: TrackedMetric; label: string; icon: string; default: boolean }> = [
  { id: 'mood', label: '心情', icon: '😊', default: true },
  { id: 'steps', label: '步数', icon: '👣', default: true },
  { id: 'heartRate', label: '心率', icon: '❤️', default: false },
  { id: 'bloodPressure', label: '血压', icon: '🩺', default: false },
  { id: 'bloodSugar', label: '血糖', icon: '🩸', default: false },
  { id: 'sleep', label: '睡眠', icon: '🌙', default: false },
];

interface OnboardingData {
  cityOptions: typeof CITY_OPTIONS;
  metricOptions: typeof DEFAULT_METRICS;
  cityCode: string;
  customCity: string;
  trackedMetrics: TrackedMetric[];
  canSubmit: boolean;
  isSubmitting: boolean;
}

function computeCanSubmit(cityCode: string, customCity: string, trackedMetrics: TrackedMetric[]): boolean {
  const finalCityCode = customCity.trim() || cityCode.trim();
  return finalCityCode.length > 0 && trackedMetrics.includes('mood');
}

Page<OnboardingData, WechatMiniprogram.IAnyObject>({
  data: {
    cityOptions: CITY_OPTIONS,
    metricOptions: DEFAULT_METRICS,
    cityCode: '',
    customCity: '',
    trackedMetrics: normalizeTrackedMetrics(DEFAULT_METRICS.filter((m) => m.default).map((m) => m.id)),
    canSubmit: false,
    isSubmitting: false,
  },

  onLoad() {
    this.setData({
      canSubmit: computeCanSubmit(this.data.cityCode, this.data.customCity, this.data.trackedMetrics),
    });
  },

  onCityTap(e: WechatMiniprogram.TouchEvent) {
    const code = e.currentTarget.dataset.code as string;
    this.setData({
      cityCode: code,
      customCity: '',
      canSubmit: computeCanSubmit(code, '', this.data.trackedMetrics),
    });
  },

  onCustomCityInput(e: WechatMiniprogram.Input) {
    const value =
      e.detail.value !== null && e.detail.value !== undefined ? e.detail.value : '';
    this.setData({
      customCity: value,
      cityCode: '',
      canSubmit: computeCanSubmit('', value, this.data.trackedMetrics),
    });
  },

  onMetricTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as TrackedMetric;
    if (id === 'mood') {
      return;
    }

    const nextMetrics = this.data.trackedMetrics.includes(id)
      ? this.data.trackedMetrics.filter((m) => m !== id)
      : [...this.data.trackedMetrics, id];
    const normalized = normalizeTrackedMetrics(nextMetrics);

    this.setData({
      trackedMetrics: normalized,
      canSubmit: computeCanSubmit(this.data.cityCode, this.data.customCity, normalized),
    });
  },

  async onSubmit() {
    if (!this.data.canSubmit || this.data.isSubmitting) {
      return;
    }

    const app = getApp<IAppOption>();
    const userId = app.globalData.userId;
    if (!userId) {
      wx.showToast({ title: '登录状态已失效，请重新登录', icon: 'none' });
      return;
    }

    const cityCode = this.data.customCity.trim() || this.data.cityCode.trim();
    const trackedMetrics = normalizeTrackedMetrics(this.data.trackedMetrics);

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '保存中...', mask: true });

    try {
      await request<UserProfileMiniapp>({
        url: '/api/user/profile/update',
        method: 'POST',
        data: { userId, cityCode, trackedMetrics },
      });

      const profileRes = await request<UserProfileMiniapp>({
        url: `/api/user/profile/${userId}`,
        method: 'GET',
      });

      app.setUserProfile(profileRes.data);
      wx.hideLoading();
      wx.reLaunch({ url: '/pages/family-join/family-join' });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '资料保存失败，请稍后重试', icon: 'none' });
      console.error('Onboarding submit failed', error);
      this.setData({ isSubmitting: false });
    }
  },
});
