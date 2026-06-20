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
      healthData: {
        mood: 'happy',
        steps: 5230,
        heartRate: 72,
      },
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
      userProfile: {
        cityCode: 'SHANGHAI',
        trackedMetrics: ['mood', 'steps', 'heartRate'],
      },
      setViewMode: vi.fn(),
      fetchHealthData: vi.fn().mockResolvedValue(undefined),
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
});
