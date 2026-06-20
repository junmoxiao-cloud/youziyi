import { screen } from '@testing-library/react';
import type { VoiceData } from '../store';

export const NORMAL_VOICE_DATA: VoiceData[] = [
  {
    id: 'voice-elder-1',
    role: 'elder',
    timeLabel: '今天 08:30',
    duration: 12,
    url: 'https://example.com/elder-1.webm',
  },
  {
    id: 'voice-child-1',
    role: 'child',
    timeLabel: '今天 09:00',
    duration: 18,
    url: 'https://example.com/child-1.webm',
  },
];

export const EMPTY_VOICE_DATA = null;

export const MALFORMED_TIMELINE_VOICE_DATA = [
  null,
  {
    id: 42,
    role: 'elder',
    timeLabel: '不应展示',
    duration: 99,
    url: 'https://example.com/invalid.webm',
  },
  {
    id: 'voice-partial',
  },
] as unknown as VoiceData[];

export const MALFORMED_DASHBOARD_VOICE_DATA = {
  broken: true,
} as unknown as VoiceData[];

export function expectVoiceCardVisible(voice: Partial<VoiceData>) {
  const roleLabel = voice.role === 'elder' ? '长辈' : '子女';
  screen.getByText(roleLabel);
  screen.getByText(voice.timeLabel || '刚刚');
  screen.getByText(`${Math.max(0, voice.duration || 0)}"`);
}

export function expectEmptyVoiceState() {
  screen.getByText('暂时还没有家庭语音，先说一句问候吧。');
}
