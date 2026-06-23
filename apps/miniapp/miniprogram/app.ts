import { resolveAuthenticatedLandingPath } from './utils/routing';

const AUTH_STORAGE_KEY = 'youziyi_auth';
const PROFILE_STORAGE_KEY = 'youziyi_profile';
const VIEW_MODE_STORAGE_KEY = 'youziyi_view_mode';
const REMINDER_KEYS_STORAGE_KEY = 'youziyi_checkin_reminder_keys';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  userRole: 'elder' | 'child' | null;
  name: string | null;
}

App<IAppOption>({
  globalData: {
    isAuthenticated: false,
    userId: null,
    userRole: null,
    userProfile: null,
    viewMode: 'companion',
    shownCheckInReminderKeys: [],
  },

  onLaunch() {
    this.restoreSession();
  },

  restoreSession() {
    try {
      const auth = wx.getStorageSync<AuthState>(AUTH_STORAGE_KEY);
      const profile = wx.getStorageSync<IAppOption['globalData']['userProfile']>(PROFILE_STORAGE_KEY);
      const viewMode = wx.getStorageSync<ViewMode>(VIEW_MODE_STORAGE_KEY);
      const reminderKeys = wx.getStorageSync<string[]>(REMINDER_KEYS_STORAGE_KEY);

      if (auth && auth.isAuthenticated && auth.userId) {
        this.globalData.isAuthenticated = true;
        this.globalData.userId = auth.userId;
        this.globalData.userRole = auth.userRole;
      }

      if (profile) {
        this.globalData.userProfile = profile;
      }

      if (viewMode === 'companion' || viewMode === 'care') {
        this.globalData.viewMode = viewMode;
      }

      if (Array.isArray(reminderKeys)) {
        this.globalData.shownCheckInReminderKeys = reminderKeys;
      }
    } catch (error) {
      console.error('恢复会话失败', error);
    }
  },

  setAuth(isAuthenticated, userId, role, name) {
    this.globalData.isAuthenticated = isAuthenticated;
    this.globalData.userId = userId;
    this.globalData.userRole = role;

    if (isAuthenticated) {
      const authState: AuthState = {
        isAuthenticated: true,
        userId,
        userRole: role,
        name,
      };
      wx.setStorageSync(AUTH_STORAGE_KEY, authState);
    } else {
      wx.removeStorageSync(AUTH_STORAGE_KEY);
    }
  },

  setUserProfile(profile) {
    this.globalData.userProfile = profile;

    if (profile) {
      wx.setStorageSync(PROFILE_STORAGE_KEY, profile);
    } else {
      wx.removeStorageSync(PROFILE_STORAGE_KEY);
    }
  },

  setViewMode(mode) {
    this.globalData.viewMode = mode;
    wx.setStorageSync(VIEW_MODE_STORAGE_KEY, mode);
  },

  markCheckInReminderShown(key) {
    const keys = this.globalData.shownCheckInReminderKeys;
    if (!keys.includes(key)) {
      const nextKeys = [...keys, key];
      this.globalData.shownCheckInReminderKeys = nextKeys;
      wx.setStorageSync(REMINDER_KEYS_STORAGE_KEY, nextKeys);
    }
  },

  logout() {
    this.globalData.isAuthenticated = false;
    this.globalData.userId = null;
    this.globalData.userRole = null;
    this.globalData.userProfile = null;
    this.globalData.shownCheckInReminderKeys = [];

    wx.removeStorageSync(AUTH_STORAGE_KEY);
    wx.removeStorageSync(PROFILE_STORAGE_KEY);
    wx.removeStorageSync(REMINDER_KEYS_STORAGE_KEY);
  },

  resolveLandingPath() {
    return resolveAuthenticatedLandingPath(this.globalData.userProfile);
  },

  navigateToLanding() {
    const path = this.resolveLandingPath();
    wx.reLaunch({ url: path });
  },
});
