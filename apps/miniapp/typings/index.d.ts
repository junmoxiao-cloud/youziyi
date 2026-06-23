/// <reference path="./types/index.d.ts" />

type UserRole = 'elder' | 'child';
type ViewMode = 'companion' | 'care';
type LandingPath = '/pages/onboarding/onboarding' | '/pages/family-join/family-join' | '/pages/role-select/role-select';

interface UserProfileMiniapp {
  userId?: string;
  name?: string;
  role?: UserRole | null;
  city?: string | null;
  cityCode?: string;
  trackedMetrics?: string[];
  familyId?: string | null;
  familyInfo?: any;
}

interface IAppOption {
  globalData: {
    isAuthenticated: boolean;
    userId: string | null;
    userRole: UserRole | null;
    userProfile: UserProfileMiniapp | null;
    viewMode: ViewMode;
    shownCheckInReminderKeys: string[];
  };

  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback;

  onLaunch?(): void;

  restoreSession(): void;
  setAuth(isAuthenticated: boolean, userId: string | null, role: UserRole | null, name: string | null): void;
  setUserProfile(profile: UserProfileMiniapp | null): void;
  setViewMode(mode: ViewMode): void;
  markCheckInReminderShown(key: string): void;
  logout(): void;
  resolveLandingPath(): LandingPath;
  navigateToLanding(): void;
}
