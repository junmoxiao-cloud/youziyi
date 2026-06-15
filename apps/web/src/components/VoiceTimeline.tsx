import React from 'react';
import { VoiceData } from '../store';

interface VoiceTimelineProps {
  voices: VoiceData[];
}

export default function VoiceTimeline({ voices }: VoiceTimelineProps) {
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handlePlay = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setPlayingId(id);

    audio.onended = () => {
      setPlayingId(null);
    };
  };

  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="bg-paper-50 rounded-2xl p-6 shadow-sm border border-paper-200 h-48">
      <h2 className="text-xl font-serif font-semibold mb-4 text-jade-600 flex items-center"><span className="w-1.5 h-4 bg-jade-400 mr-2 rounded-full"></span>家庭故事语音接龙</h2>
      <div className="flex items-center gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {voices.map((voice) => {
          const isElder = voice.role === 'elder';
          const isPlaying = playingId === voice.id;
          const borderColor = isElder ? 'border-jade-400' : 'border-cinnabar-500';
          const btnColor = isElder ? 'bg-jade-100 text-jade-600 hover:bg-jade-200' : 'bg-paper-200 text-cinnabar-600 hover:bg-paper-300';
          const progressColor = isElder ? 'bg-jade-300' : 'bg-cinnabar-500';
          
          return (
            <div key={voice.id} className={`min-w-[220px] bg-paper-100 p-4 rounded-xl border-l-4 shadow-sm border border-paper-200 ${borderColor}`}>
              <p className="text-sm text-ink-600 mb-2 font-serif">
                <span className="font-bold text-ink-800">{isElder ? '长辈' : '子女'}</span> <span className="text-ink-400 mx-1">|</span> {voice.timeLabel}
              </p>
              <div className="flex items-center gap-3">
                <button 
                  className={`w-10 h-10 rounded-full ${btnColor} flex items-center justify-center focus:outline-none transition-colors shadow-sm`}
                  onClick={() => handlePlay(voice.id, voice.url)}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <div className="flex-1 h-1.5 bg-paper-200 rounded-full overflow-hidden">
                  <div className={`h-full ${progressColor} transition-all duration-300`} style={{ width: isPlaying ? '100%' : '0%' }}></div>
                </div>
                <span className="text-xs text-ink-400 font-mono">{voice.duration}"</span>
              </div>
            </div>
          );
        })}
        <button className="min-w-[140px] h-[92px] bg-paper-100 hover:bg-paper-200 rounded-xl border-2 border-dashed border-jade-300 flex flex-col items-center justify-center text-jade-600 transition-colors">
          <span className="text-2xl mb-1 font-serif">+</span>
          <span className="text-sm font-serif">接龙录音</span>
        </button>
      </div>
    </div>
  );
}