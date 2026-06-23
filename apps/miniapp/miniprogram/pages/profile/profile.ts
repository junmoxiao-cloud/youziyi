import { CITY_OPTIONS, normalizeTrackedMetrics, TrackedMetric } from '../../utils/youziyi-types';
import { request } from '../../utils/request';

const DEFAULT_METRICS: Array<{ id: TrackedMetric; label: string; icon: string }> = [
  { id: 'mood', label: '心情', icon: '😊' },
  { id: 'steps', label: '步数', icon: '👣' },
  { id: 'heartRate', label: '心率', icon: '❤️' },
  { id: 'bloodPressure', label: '血压', icon: '🩺' },
  { id: 'bloodSugar', label: '血糖', icon: '🩸' },
  { id: 'sleep', label: '睡眠', icon: '🌙' },
];

interface ProfileData {
  cityOptions: typeof CITY_OPTIONS;
  metricOptions: typeof DEFAULT_METRICS;
  cityCode: string;
  customCity: string;
  trackedMetrics: TrackedMetric[];
  isLoading: boolean;
  isSaving: boolean;
}

Page<ProfileData, WechatMiniprogram.IAnyObject>({
  data: {
    cityOptions: CITY_OPTIONS,
    metricOptions: DEFAULT_METRICS,
    cityCode: '',
    customCity: '',
    trackedMetrics: ['mood'],
    isLoading: true,
    isSaving: false,
  },

  async onLoad() {
    const app = getApp<IAppOption>();
    const userId = app.globalData.userId;
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }

    try {
      const res = await request<UserProfileMiniapp>({
        url: `/api/user/profile/${userId}`,
        method: 'GET',
      });
      const profile = res.data;
      const savedCityCode =
        profile.cityCode !== null && profile.cityCode !== undefined
          ? profile.cityCode.trim()
          : '';
      const isPresetCity = CITY_OPTIONS.some((city) => city.code === savedCityCode);

      this.setData({
        cityCode: isPresetCity ? savedCityCode : '',
        customCity: isPresetCity ? '' : savedCityCode,
        trackedMetrics: normalizeTrackedMetrics(profile.trackedMetrics),
        isLoading: false,
      });
    } catch (error) {
      console.error('获取个人资料失败', error);
      wx.showToast({ title: '获取资料失败', icon: 'none' });
      this.setData({ isLoading: false });
    }
  },

  onCityTap(event: WechatMiniprogram.TouchEvent) {
    const code = event.currentTarget.dataset.code as string;
    this.setData({
      cityCode: code,
      customCity: '',
    });
  },

  onCustomCityInput(event: WechatMiniprogram.Input) {
    const value =
      event.detail.value !== null && event.detail.value !== undefined
        ? event.detail.value
        : '';
    this.setData({
      customCity: value,
      cityCode: '',
    });
  },

  onMetricTap(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as TrackedMetric;
    if (id === 'mood') {
      return;
    }

    const nextMetrics = this.data.trackedMetrics.includes(id)
      ? this.data.trackedMetrics.filter((metric) => metric !== id)
      : [...this.data.trackedMetrics, id];
    const normalized = normalizeTrackedMetrics(nextMetrics);

    this.setData({ trackedMetrics: normalized });
  },

  async onSave() {
    if (this.data.isSaving) {
      return;
    }

    const app = getApp<IAppOption>();
    const userId = app.globalData.userId;
    if (!userId) {
      wx.showToast({ title: '登录状态已失效', icon: 'none' });
      return;
    }

    const cityCode = this.data.customCity.trim() || this.data.cityCode.trim();
    if (!cityCode) {
      wx.showToast({ title: '请选择或填写所在城市', icon: 'none' });
      return;
    }

    const trackedMetrics = normalizeTrackedMetrics(this.data.trackedMetrics);
    if (trackedMetrics.length === 0) {
      wx.showToast({ title: '请至少选择一项健康指标', icon: 'none' });
      return;
    }

    this.setData({ isSaving: true });
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
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1200);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' });
      console.error('保存个人资料失败', error);
      this.setData({ isSaving: false });
    }
  },

  onLogout() {
    const app = getApp<IAppOption>();
    app.logout();
    wx.reLaunch({ url: '/pages/login/login' });
  },

  onNavigateBack() {
    wx.navigateBack();
  },
});
