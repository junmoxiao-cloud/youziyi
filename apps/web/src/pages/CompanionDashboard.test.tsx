import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CompanionDashboard from './CompanionDashboard';
import { useStore } from '../store';
import {
  EMPTY_VOICE_DATA,
  MALFORMED_DASHBOARD_VOICE_DATA,
  NORMAL_VOICE_DATA,
} from '../test/voiceTestUtils';

const mockedModules = vi.hoisted(() => ({
  capturedVoices: undefined as unknown,
}));

vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="echarts-stub" />,
}));

vi.mock('../components/WeatherBottle', () => ({
  default: () => <div data-testid="weather-bottle-stub" />,
}));

vi.mock('../components/VoiceTimeline', () => ({
  default: ({ voices }: { voices?: unknown }) => {
    mockedModules.capturedVoices = voices;
    return (
      <div data-testid="voice-timeline-stub">
        {Array.isArray(voices) ? voices.length : 'not-array'}
      </div>
    );
  },
}));

const initialStoreState = useStore.getState();

function primeDashboardState(voices: unknown) {
  useStore.setState(
    {
      ...useStore.getState(),
      warningStatus: {
        lastInteractionTime: Date.now() - 60_000,
        warningLevel: 0,
        isTriggered: false,
      },
      elderWeather: {
        cityCode: 'SHANGHAI',
        cityName: '上海',
        weatherType: 'sunny',
        temperature: 25,
        humidity: 50,
      },
      childWeather: {
        cityCode: 'BEIJING',
        cityName: '北京',
        weatherType: 'cloudy',
        temperature: 22,
        humidity: 60,
      },
      voices: voices as never,
      userId: 'user-001',
      userRole: 'child',
      userProfile: {
        userId: 'user-001',
        name: '小雨',
        role: 'child',
        city: '北京',
        cityCode: 'SHANGHAI',
        trackedMetrics: ['mood', 'steps', 'heartRate'],
        familyId: 'family-001',
        familyInfo: {
          familyId: 'family-001',
          familyName: '游子衣之家',
          inviteCode: 'ABCD1234',
          members: [
            {
              userId: 'user-elder',
              name: '妈妈',
              role: 'elder',
              city: '上海',
              cityCode: 'SHANGHAI',
            },
            {
              userId: 'user-001',
              name: '小雨',
              role: 'child',
              city: '北京',
              cityCode: 'BEIJING',
            },
          ],
        },
      },
      todayCheckInStatus: {
        userId: 'user-elder',
        timezone: 'Asia/Shanghai',
        businessDate: '2026-06-20',
        hasCheckedInToday: true,
        lastCheckInAt: Date.now() - 30 * 60 * 1000,
        trackedMetrics: ['mood', 'steps', 'heartRate'],
        window: {
          timezone: 'Asia/Shanghai',
          businessDate: '2026-06-20',
          currentPeriod: 'daytime',
          opensAt: Date.now() - 2 * 60 * 60 * 1000,
          closesAt: Date.now() + 2 * 60 * 60 * 1000,
          isWithinCheckInWindow: true,
          promptState: 'already_checked_in',
          promptMessage: '今日已完成打卡',
        },
        summary: {
          mood: 'happy',
          steps: 5230,
          heartRate: 72,
        },
        today: {
          date: '2026-06-20',
          startAt: Date.now() - 8 * 60 * 60 * 1000,
          endAt: Date.now() + 16 * 60 * 60 * 1000,
          hasCheckedIn: true,
          recordCount: 1,
          latestCheckInAt: Date.now() - 30 * 60 * 1000,
          summary: {
            mood: 'happy',
            steps: 5230,
            heartRate: 72,
          },
          latestRecord: {
            recordId: 'record-001',
            mood: 'happy',
            steps: 5230,
            heartRate: 72,
            timestamp: Date.now() - 30 * 60 * 1000,
            businessDate: '2026-06-20',
            period: 'daytime',
          },
        },
        latestRecord: {
          recordId: 'record-001',
          mood: 'happy',
          steps: 5230,
          heartRate: 72,
          timestamp: Date.now() - 30 * 60 * 1000,
          businessDate: '2026-06-20',
          period: 'daytime',
        },
        form: {
          editableMetrics: ['mood', 'steps', 'heartRate'],
          initialValues: {
            mood: 'happy',
            steps: 5230,
            heartRate: 72,
          },
        },
      },
      dailyHealthAggregates: {
        userId: 'user-elder',
        timezone: 'Asia/Shanghai',
        anchorDate: '2026-06-20',
        requestedDays: 6,
        today: {
          date: '2026-06-20',
          startAt: Date.now() - 8 * 60 * 60 * 1000,
          endAt: Date.now() + 16 * 60 * 60 * 1000,
          hasCheckedIn: true,
          recordCount: 1,
          latestCheckInAt: Date.now() - 30 * 60 * 1000,
          summary: {
            mood: 'happy',
            steps: 5230,
            heartRate: 72,
          },
          latestRecord: null,
        },
        yesterday: null,
        recentDays: [
          {
            date: '2026-06-15',
            startAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
            endAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
            hasCheckedIn: true,
            recordCount: 1,
            latestCheckInAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
            summary: {
              mood: 'calm',
              steps: 4100,
              heartRate: 70,
            },
            latestRecord: null,
          },
          {
            date: '2026-06-16',
            startAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
            endAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
            hasCheckedIn: true,
            recordCount: 1,
            latestCheckInAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
            summary: {
              mood: 'calm',
              steps: 4300,
              heartRate: 71,
            },
            latestRecord: null,
          },
          {
            date: '2026-06-17',
            startAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
            endAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
            hasCheckedIn: true,
            recordCount: 1,
            latestCheckInAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
            summary: {
              mood: 'happy',
              steps: 4800,
              heartRate: 73,
            },
            latestRecord: null,
          },
          {
            date: '2026-06-18',
            startAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
            endAt: Date.now() - 24 * 60 * 60 * 1000,
            hasCheckedIn: true,
            recordCount: 1,
            latestCheckInAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
            summary: {
              mood: 'happy',
              steps: 5100,
              heartRate: 74,
            },
            latestRecord: null,
          },
          {
            date: '2026-06-19',
            startAt: Date.now() - 24 * 60 * 60 * 1000,
            endAt: Date.now(),
            hasCheckedIn: true,
            recordCount: 1,
            latestCheckInAt: Date.now() - 24 * 60 * 60 * 1000,
            summary: {
              mood: 'calm',
              steps: 5000,
              heartRate: 73,
            },
            latestRecord: null,
          },
          {
            date: '2026-06-20',
            startAt: Date.now() - 8 * 60 * 60 * 1000,
            endAt: Date.now() + 16 * 60 * 60 * 1000,
            hasCheckedIn: true,
            recordCount: 1,
            latestCheckInAt: Date.now() - 30 * 60 * 1000,
            summary: {
              mood: 'happy',
              steps: 5230,
              heartRate: 72,
            },
            latestRecord: null,
          },
        ],
      },
      fetchUserProfile: vi.fn().mockResolvedValue(undefined),
      setViewMode: vi.fn(),
      fetchHealthData: vi.fn().mockResolvedValue(undefined),
      fetchDailyHealthAggregates: vi.fn().mockResolvedValue(undefined),
      fetchWarningStatus: vi.fn().mockResolvedValue(undefined),
      fetchWeathers: vi.fn().mockResolvedValue(undefined),
      fetchVoices: vi.fn().mockResolvedValue(undefined),
      addVoice: vi.fn(),
      createFamily: vi.fn().mockResolvedValue(null),
    },
    false,
  );
}

describe('CompanionDashboard voice data verification', () => {
  beforeEach(() => {
    mockedModules.capturedVoices = undefined;
  });

  afterEach(() => {
    useStore.setState(initialStoreState, true);
    vi.restoreAllMocks();
  });

  it('passes normal voice data to VoiceTimeline', () => {
    primeDashboardState(NORMAL_VOICE_DATA);

    render(
      <MemoryRouter>
        <CompanionDashboard />
      </MemoryRouter>,
    );

    expect(mockedModules.capturedVoices).toEqual(NORMAL_VOICE_DATA);
    expect(screen.getByTestId('voice-timeline-stub').textContent).toBe('2');
  });

  it('falls back to an empty voice list when store data is empty', () => {
    primeDashboardState(EMPTY_VOICE_DATA);

    render(
      <MemoryRouter>
        <CompanionDashboard />
      </MemoryRouter>,
    );

    expect(mockedModules.capturedVoices).toEqual([]);
    expect(screen.getByTestId('voice-timeline-stub').textContent).toBe('0');
  });

  it('falls back to an empty voice list when store data is malformed', () => {
    primeDashboardState(MALFORMED_DASHBOARD_VOICE_DATA);

    render(
      <MemoryRouter>
        <CompanionDashboard />
      </MemoryRouter>,
    );

    expect(mockedModules.capturedVoices).toEqual([]);
    expect(screen.getByTestId('voice-timeline-stub').textContent).toBe('0');
  });

  it('prefers profile cityCode mapping over weather cityName for city titles', () => {
    primeDashboardState(NORMAL_VOICE_DATA);
    useStore.setState((state) => ({
      ...state,
      elderWeather: state.elderWeather
        ? {
            ...state.elderWeather,
            cityCode: 'GUANGZHOU',
            cityName: '广州',
          }
        : null,
    }));

    render(
      <MemoryRouter>
        <CompanionDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText('上海')).toBeInTheDocument();
    expect(screen.queryByText('广州')).not.toBeInTheDocument();
  });

  it('shows conservative weather empty state when weather cityCode mismatches profile cityCode', () => {
    primeDashboardState(NORMAL_VOICE_DATA);
    useStore.setState((state) => ({
      ...state,
      elderWeather: state.elderWeather
        ? {
            ...state.elderWeather,
            cityCode: 'GUANGZHOU',
            cityName: '广州',
          }
        : null,
      childWeather: null,
    }));

    render(
      <MemoryRouter>
        <CompanionDashboard />
      </MemoryRouter>,
    );

    expect(screen.queryByText('晴 · 25°C')).not.toBeInTheDocument();
    expect(screen.getAllByText('天气暂不可用').length).toBeGreaterThan(0);
  });
});
