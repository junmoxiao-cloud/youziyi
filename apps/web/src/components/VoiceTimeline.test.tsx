import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VoiceTimeline from './VoiceTimeline';
import { useStore } from '../store';
import {
  EMPTY_VOICE_DATA,
  MALFORMED_TIMELINE_VOICE_DATA,
  NORMAL_VOICE_DATA,
  expectEmptyVoiceState,
  expectVoiceCardVisible,
} from '../test/voiceTestUtils';

const initialStoreState = useStore.getState();

describe('VoiceTimeline voice data verification', () => {
  beforeEach(() => {
    useStore.setState(
      {
        ...useStore.getState(),
        userRole: 'child',
      },
      false,
    );
  });

  afterEach(() => {
    useStore.setState(initialStoreState, true);
    vi.restoreAllMocks();
  });

  it('renders normal voice data', () => {
    render(<VoiceTimeline voices={NORMAL_VOICE_DATA} />);

    expectVoiceCardVisible(NORMAL_VOICE_DATA[0]);
    expectVoiceCardVisible(NORMAL_VOICE_DATA[1]);
    expect(screen.queryByText('暂时还没有家庭语音，先说一句问候吧。')).toBeNull();
  });

  it('shows the empty state for empty voice data', () => {
    render(<VoiceTimeline voices={EMPTY_VOICE_DATA} />);

    expectEmptyVoiceState();
  });

  it('filters malformed voice data and keeps safe fallbacks for partial entries', () => {
    render(<VoiceTimeline voices={MALFORMED_TIMELINE_VOICE_DATA} />);

    expectVoiceCardVisible({
      role: 'child',
      timeLabel: '刚刚',
      duration: 0,
    });
    expect(screen.queryByText('不应展示')).toBeNull();
  });
});
