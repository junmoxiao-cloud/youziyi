import { create } from 'zustand';
import { resolveCityLabel as resolveSharedCityLabel } from '@youziyi/types';
import type {
  ApiResponse,
  CheckInMetricsData,
  DailyHealthAggregatesResponse,
  FamilyInfo,
  TodayCheckInStatusResponse,
  UserProfileResponse,
  UserRole,
  VoiceListItem,
  VoiceListResponse,
  WeatherData as SharedWeatherData,
} from '@youziyi/types';

// 定义类型
export interface HealthData {
  mood: string;
  steps: number;
  heartRate: number;
}

export interface WarningStatus {
  lastInteractionTime: number;
  warningLevel: number;
  isTriggered: boolean;
}

export type WeatherData = SharedWeatherData;

export type VoiceData = VoiceListItem;

export interface UserProfile {
  cityCode: string;
  trackedMetrics: string[];
  familyId?: string | null;
  familyInfo?: FamilyInfo | null;
}

interface AppState {
  // 认证和角色
  isAuthenticated: boolean;
  userRole: 'elder' | 'child' | null;
  userId: string | null;
  
  userProfile: UserProfile | null;
  healthData: HealthData | null;
  todayCheckInStatus: TodayCheckInStatusResponse | null;
  dailyHealthAggregates: DailyHealthAggregatesResponse | null;
  warningStatus: WarningStatus | null;
  elderWeather: WeatherData | null;
  childWeather: WeatherData | null;
  voices: VoiceData[];
  
  viewMode: 'companion' | 'care';
  
  // Actions
  setAuth: (isAuthenticated: boolean, userId: string | null) => void;
  setRole: (role: 'elder' | 'child' | null) => void;
  setViewMode: (mode: 'companion' | 'care') => void;
  logout: () => void;
  
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
  updateUserProfile: (userId: string, profile: Partial<UserProfile>) => Promise<boolean>;
  fetchHealthData: (userId: string) => Promise<void>;
  fetchDailyHealthAggregates: (userId: string, days?: number) => Promise<void>;
  submitCheckIn: (payload: {
    userId: string;
    timestamp: number;
    mood?: string;
    steps?: number;
    heartRate?: number;
    metricsData: CheckInMetricsData;
  }) => Promise<{ success: boolean; message: string }>;
  fetchWarningStatus: (userId: string) => Promise<void>;
  fetchWeathers: (elderCityCode?: string | null, childCityCode?: string | null) => Promise<void>;
  fetchVoices: (userId: string) => Promise<void>;
  addVoice: (voice: VoiceData) => void;
  createFamily: (userId: string) => Promise<{ inviteCode: string } | null>;
  joinFamily: (userId: string, inviteCode: string) => Promise<{ success: boolean; message?: string }>;
  login: (name: string, password: string) => Promise<{success: boolean, userId?: string, message?: string}>;
  register: (name: string, password: string, role: 'elder' | 'child', cityCode?: string) => Promise<{success: boolean, userId?: string, message?: string}>;
}

const MOCK_VOICES: VoiceData[] = [
  { id: '1', role: 'elder', timeLabel: '昨天 20:00', duration: 15, url: 'https://www.w3school.com.cn/i/horse.mp3' },
  { id: '2', role: 'child', timeLabel: '昨天 21:30', duration: 22, url: 'https://www.w3school.com.cn/i/horse.mp3' }
];

const EMPTY_USER_PROFILE: UserProfile = {
  cityCode: '',
  trackedMetrics: [],
  familyId: null,
  familyInfo: null,
};

function normalizeVoiceRole(role: unknown): UserRole {
  return role === 'elder' ? 'elder' : 'child';
}

function normalizeVoiceItem(item: Partial<VoiceListItem>, index = 0): VoiceData {
  return {
    id: item.id ?? `voice-${index}`,
    role: normalizeVoiceRole(item.role),
    timeLabel: item.timeLabel ?? '刚刚',
    duration: typeof item.duration === 'number' && Number.isFinite(item.duration) ? item.duration : 0,
    url: item.url ?? ''
  };
}

function resolveCityLabel(cityName: unknown, cityCode: unknown): string {
  const label = resolveSharedCityLabel(
    typeof cityName === 'string' ? cityName : undefined,
    typeof cityCode === 'string' ? cityCode : undefined,
  );
  return label || '待完善城市';
}

async function readApiResponse<T>(res: Response): Promise<ApiResponse<T> | null> {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return (await res.json()) as ApiResponse<T>;
  } catch (error) {
    console.error('Failed to parse API response:', error);
    return null;
  }
}

function buildWeatherFallback(cityCode: string): WeatherData {
  return {
    cityCode,
    cityName: resolveCityLabel(undefined, cityCode),
    weatherType: 'sunny',
    temperature: 20,
    humidity: 50,
  };
}

function normalizeHealthSummary(summary: TodayCheckInStatusResponse['summary'] | null | undefined): HealthData | null {
  if (!summary) {
    return null;
  }

  if (summary.mood === null && summary.steps === null && summary.heartRate === null) {
    return null;
  }

  return {
    mood: summary.mood ?? 'calm',
    steps: summary.steps ?? 0,
    heartRate: summary.heartRate ?? 0,
  };
}

function normalizeUserProfile(data: UserProfileResponse | null | undefined): UserProfile {
  const trackedMetrics = Array.isArray(data?.trackedMetrics) ? data.trackedMetrics : [];
  const familyInfo: FamilyInfo | null = data?.familyInfo
    ? {
        ...data.familyInfo,
        members: Array.isArray(data.familyInfo.members)
          ? data.familyInfo.members.map((member) => ({
              ...member,
              role: member.role === 'elder' ? 'elder' : 'child',
              city: member.city ?? null,
              cityCode: typeof member.cityCode === 'string' && member.cityCode.trim()
                ? member.cityCode.trim()
                : null,
            }))
          : [],
      }
    : null;

  return {
    cityCode: typeof data?.cityCode === 'string' ? data.cityCode : '',
    trackedMetrics,
    familyId: data?.familyId ?? null,
    familyInfo,
  };
}

export const useStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  userRole: null,
  userId: null,

  userProfile: null,
  healthData: null,
  todayCheckInStatus: null,
  dailyHealthAggregates: null,
  warningStatus: null,
  elderWeather: null,
  childWeather: null,
  voices: [],
  viewMode: 'companion',

  setAuth: (isAuthenticated, userId) =>
    set((state) => {
      if (!isAuthenticated) {
        return {
          isAuthenticated,
          userId,
          userRole: null,
          userProfile: null,
          healthData: null,
          todayCheckInStatus: null,
          dailyHealthAggregates: null,
          warningStatus: null,
          elderWeather: null,
          childWeather: null,
          voices: []
        };
      }
      if (state.userId !== userId) {
        return {
          isAuthenticated,
          userId,
          userRole: null,
          userProfile: null,
          healthData: null,
          todayCheckInStatus: null,
          dailyHealthAggregates: null,
          warningStatus: null,
          elderWeather: null,
          childWeather: null,
          voices: []
        };
      }
      return { isAuthenticated, userId };
    }),
  setRole: (role) => set({ userRole: role }),
  setViewMode: (mode) => set({ viewMode: mode }),
  logout: () => set({ isAuthenticated: false, userRole: null, userId: null }),

  addVoice: (voice) => set((state) => ({ voices: [...state.voices, normalizeVoiceItem(voice, state.voices.length)] })),

  fetchUserProfile: async (userId: string) => {
    try {
      const res = await fetch(`/api/user/profile/${userId}`);
      if (res.ok) {
        const data: ApiResponse<UserProfileResponse> = await res.json();
        if (data.code === 0) {
          const normalized = normalizeUserProfile(data.data);
          set({ userProfile: normalized });
          return normalized;
        }
      } else {
        const fallback = { ...EMPTY_USER_PROFILE };
        set({ userProfile: fallback });
        return fallback;
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      const fallback = { ...EMPTY_USER_PROFILE };
      set({ userProfile: fallback });
      return fallback;
    }
    return null;
  },

  updateUserProfile: async (userId: string, profile: Partial<UserProfile>) => {
    try {
      const res = await fetch('/api/user/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...profile })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          await get().fetchUserProfile(userId);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Failed to update user profile:', e);
      return false;
    }
  },

  fetchHealthData: async (userId: string) => {
    try {
      const res = await fetch(`/api/health/checkin-status/${userId}`);
      if (res.ok) {
        const data: ApiResponse<TodayCheckInStatusResponse> = await res.json();
        if (data.code === 0) {
          set({
            todayCheckInStatus: data.data,
            healthData: normalizeHealthSummary(data.data?.summary),
          });
          return;
        }
      }

      set({ healthData: null, todayCheckInStatus: null });
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      set({ healthData: null, todayCheckInStatus: null });
    }
  },

  fetchDailyHealthAggregates: async (userId: string, days = 7) => {
    try {
      const res = await fetch(`/api/health/checkins/daily/${userId}?days=${encodeURIComponent(String(days))}`);
      if (res.ok) {
        const data: ApiResponse<DailyHealthAggregatesResponse> = await res.json();
        if (data.code === 0 && data.data) {
          set({ dailyHealthAggregates: data.data });
          return;
        }
      }

      set({ dailyHealthAggregates: null });
    } catch (error) {
      console.error('Failed to fetch daily health aggregates:', error);
      set({ dailyHealthAggregates: null });
    }
  },

  submitCheckIn: async (payload) => {
    try {
      const res = await fetch('/api/health/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await readApiResponse<{ recordId: string }>(res);

      if (res.ok && data?.code === 0) {
        await Promise.all([
          get().fetchHealthData(payload.userId),
          get().fetchDailyHealthAggregates(payload.userId),
        ]);
        return { success: true, message: data.message || '打卡成功' };
      }

      return { success: false, message: data?.message || '打卡失败，请稍后重试' };
    } catch (error) {
      console.error('Failed to submit checkin:', error);
      return { success: false, message: '网络错误' };
    }
  },

  fetchWarningStatus: async (userId: string) => {
    try {
      const res = await fetch(`/api/warning/status/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          set({ warningStatus: data.data });
        }
      } else {
        // Mock fallback
        set({
          warningStatus: {
            lastInteractionTime: Date.now() - 2 * 60 * 60 * 1000 - 15 * 60 * 1000, // 2小时15分钟前
            warningLevel: 0,
            isTriggered: false
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch warning status:', error);
      // Mock fallback
      set({
        warningStatus: {
          lastInteractionTime: Date.now() - 2 * 60 * 60 * 1000 - 15 * 60 * 1000,
          warningLevel: 0,
          isTriggered: false
        }
      });
    }
  },

  fetchWeathers: async (elderCityCode, childCityCode) => {
    const fetchWeatherForCity = async (cityCode?: string | null): Promise<WeatherData | null> => {
      const normalizedCityCode = typeof cityCode === 'string' ? cityCode.trim() : '';

      if (!normalizedCityCode) {
        return null;
      }

      try {
        const res = await fetch(`/api/weather/current?cityCode=${encodeURIComponent(normalizedCityCode)}`);
        if (res.ok) {
          const resJson: ApiResponse<WeatherData> = await res.json();
          if (resJson.code === 0 && resJson.data) {
            return {
              ...resJson.data,
              cityCode: resJson.data.cityCode || normalizedCityCode,
              cityName: resolveCityLabel(resJson.data.cityName, resJson.data.cityCode || normalizedCityCode),
            };
          }
        }
      } catch (error) {
        console.error(`Failed to fetch weather for city ${normalizedCityCode}:`, error);
      }

      return buildWeatherFallback(normalizedCityCode);
    };

    try {
      const [elderRes, childRes] = await Promise.all([
        fetchWeatherForCity(elderCityCode),
        fetchWeatherForCity(childCityCode),
      ]);

      set({ elderWeather: elderRes, childWeather: childRes });
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      // Mock fallback
      set({
        elderWeather: elderCityCode ? buildWeatherFallback(elderCityCode) : null,
        childWeather: childCityCode ? buildWeatherFallback(childCityCode) : null,
      });
    }
  },

  fetchVoices: async (userId: string) => {
    try {
      const res = await fetch(`/api/voice/list/${userId}`);
      if (res.ok) {
        const data: ApiResponse<VoiceListResponse> = await res.json();
        if (data.code === 0) {
          const voices = Array.isArray(data.data?.records)
            ? data.data.records.map((item, index) => normalizeVoiceItem(item, index))
            : [];
          set({ voices });
          return;
        }
      } else {
        set({ voices: MOCK_VOICES });
        return;
      }

      set({ voices: MOCK_VOICES });
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      set({ voices: MOCK_VOICES });
    }
  },

  createFamily: async (userId: string) => {
    try {
      const res = await fetch('/api/family/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          await get().fetchUserProfile(userId);
          return { inviteCode: data.data.inviteCode };
        }
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  joinFamily: async (userId: string, inviteCode: string) => {
    try {
      const res = await fetch('/api/family/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, inviteCode })
      });
      const data = await res.json();
      if (res.ok && data.code === 0) {
        await get().fetchUserProfile(userId);
        return { success: true };
      }
      return { success: false, message: data.message || '加入失败' };
    } catch (e) {
      console.error(e);
      return { success: false, message: '网络错误' };
    }
  },

  login: async (name: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });
      const data = await readApiResponse<{ userId: string }>(res);
      if (res.ok && data?.code === 0 && data.data?.userId) {
        return { success: true, userId: data.data.userId };
      }
      return { success: false, message: data?.message || '登录失败，请检查后端服务和数据库迁移状态' };
    } catch (e) {
      console.error(e);
      return { success: false, message: '网络错误' };
    }
  },

  register: async (name: string, password: string, role: 'elder' | 'child', cityCode?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password, role, cityCode })
      });
      const data = await readApiResponse<{ userId: string }>(res);
      if (res.ok && data?.code === 0 && data.data?.userId) {
        return { success: true, userId: data.data.userId };
      }
      return { success: false, message: data?.message || '注册失败，请检查后端服务和数据库迁移状态' };
    } catch (e) {
      console.error(e);
      return { success: false, message: '网络错误' };
    }
  }
}));
