import { create } from 'zustand';

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

export interface WeatherData {
  cityCode: string;
  weatherType: string;
  temperature: number;
  humidity: number;
  cityName?: string;
}

export interface VoiceData {
  id: string;
  role: 'elder' | 'child';
  timeLabel: string;
  duration: number;
  url: string;
}

interface AppState {
  healthData: HealthData | null;
  warningStatus: WarningStatus | null;
  elderWeather: WeatherData | null;
  childWeather: WeatherData | null;
  voices: VoiceData[];
  
  // Actions
  fetchHealthData: (userId: string) => Promise<void>;
  fetchWarningStatus: (userId: string) => Promise<void>;
  fetchWeathers: (elderCityCode: string, childCityCode: string) => Promise<void>;
  fetchVoices: (userId: string) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  healthData: null,
  warningStatus: null,
  elderWeather: null,
  childWeather: null,
  voices: [],

  fetchHealthData: async (userId: string) => {
    try {
      // 假设有一个获取长辈最新健康数据的接口，如果后端没有，我们可以先 mock
      // 这里请求示例：GET /api/health/status/:userId
      const res = await fetch(`http://localhost:3001/api/health/status/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          set({ healthData: data.data });
        }
      } else {
        // Mock fallback if API not implemented
        set({
          healthData: {
            mood: 'happy',
            steps: 5230,
            heartRate: 72
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      // Mock fallback
      set({
        healthData: {
          mood: 'happy',
          steps: 5230,
          heartRate: 72
        }
      });
    }
  },

  fetchWarningStatus: async (userId: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/warning/status/${userId}`);
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

  fetchWeathers: async (elderCityCode: string, childCityCode: string) => {
    try {
      const [elderRes, childRes] = await Promise.all([
        fetch(`http://localhost:3001/api/weather/current?cityCode=${elderCityCode}`),
        fetch(`http://localhost:3001/api/weather/current?cityCode=${childCityCode}`)
      ]);

      let elderData = null;
      let childData = null;

      if (elderRes.ok) {
        const resJson = await elderRes.json();
        if (resJson.code === 0) {
          elderData = { ...resJson.data, cityName: '上海' };
        }
      }
      
      if (childRes.ok) {
        const resJson = await childRes.json();
        if (resJson.code === 0) {
          childData = { ...resJson.data, cityName: '北京' };
        }
      }

      // Mock fallbacks if API not ready
      if (!elderData) {
        elderData = { cityCode: elderCityCode, cityName: '上海', weatherType: 'cloudy', temperature: 22, humidity: 60 };
      }
      if (!childData) {
        childData = { cityCode: childCityCode, cityName: '北京', weatherType: 'sunny', temperature: 26, humidity: 45 };
      }

      set({ elderWeather: elderData, childWeather: childData });
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      // Mock fallback
      set({
        elderWeather: { cityCode: elderCityCode, cityName: '上海', weatherType: 'cloudy', temperature: 22, humidity: 60 },
        childWeather: { cityCode: childCityCode, cityName: '北京', weatherType: 'sunny', temperature: 26, humidity: 45 }
      });
    }
  },

  fetchVoices: async (userId: string) => {
    try {
      // 模拟请求后端的语音列表
      const res = await fetch(`http://localhost:3001/api/voice/list/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          set({ voices: data.data });
        }
      } else {
        // Mock fallback
        set({
          voices: [
            { id: '1', role: 'elder', timeLabel: '昨天 20:00', duration: 15, url: 'https://www.w3school.com.cn/i/horse.mp3' },
            { id: '2', role: 'child', timeLabel: '昨天 21:30', duration: 22, url: 'https://www.w3school.com.cn/i/horse.mp3' }
          ]
        });
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      // Mock fallback
      set({
        voices: [
          { id: '1', role: 'elder', timeLabel: '昨天 20:00', duration: 15, url: 'https://www.w3school.com.cn/i/horse.mp3' },
          { id: '2', role: 'child', timeLabel: '昨天 21:30', duration: 22, url: 'https://www.w3school.com.cn/i/horse.mp3' }
        ]
      });
    }
  }
}));
