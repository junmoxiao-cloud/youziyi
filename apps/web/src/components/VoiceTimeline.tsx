import { useState, useRef, useEffect } from 'react';
import type { MouseEvent } from 'react';
import type { VoiceData } from '../store';
import { useStore } from '../store';

interface VoiceTimelineProps {
  voices?: VoiceData[] | null;
  onVoiceUpload?: (voice: VoiceData) => void;
}

export default function VoiceTimeline({ voices, onVoiceUpload }: VoiceTimelineProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userRole = useStore((state) => state.userRole);

  // 录音相关状态
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const safeVoices = Array.isArray(voices)
    ? voices.filter((voice): voice is VoiceData => Boolean(voice && typeof voice.id === 'string'))
    : [];

  const handlePlay = (id: string, url: string) => {
    if (!url) {
      setPlayingId(null);
      return;
    }

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
    void audio.play().catch((error) => {
      console.error('音频播放失败:', error);
      setPlayingId(null);
    });
    setPlayingId(id);

    audio.onended = () => {
      setPlayingId(null);
    };
  };

  const startRecording = async (startedAt: number) => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      alert('当前浏览器暂不支持录音功能');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const duration = Math.round((performance.now() - startTimeRef.current) / 1000);
        
        // 停止所有的媒体轨道，释放麦克风
        stream.getTracks().forEach(track => track.stop());
        
        await uploadAudio(audioBlob, duration);
      };

      startTimeRef.current = startedAt;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('获取麦克风权限失败:', error);
      alert('无法获取麦克风权限，请检查浏览器设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async (blob: Blob, duration: number) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'record.webm');
      // 模拟传递 userId 和 storyId
      formData.append('userId', 'mock-user-id');
      formData.append('storyId', 'mock-story-id');

      const res = await fetch('/api/voice/upload', {
        method: 'POST',
        body: formData,
      });

      let data;
      if (res.ok) {
        data = await res.json();
      } else {
        // Mock fallback when API is not available
        data = {
          code: 0,
          data: {
            voiceId: String(Date.now()),
            url: URL.createObjectURL(blob), // 使用本地 Blob URL 用于预览
            duration: duration
          }
        };
      }

      if (data.code === 0 && onVoiceUpload) {
        // 通知外部更新录音列表
        const newVoice: VoiceData = {
          id: data.data.voiceId || String(Date.now()),
          role: userRole === 'elder' ? 'elder' : 'child',
          timeLabel: '刚刚',
          duration: duration || data.data.duration || 1,
          url: data.data.url,
        };
        onVoiceUpload(newVoice);
      } else {
        throw new Error(data.message || '上传失败');
      }
    } catch (error) {
      console.error('录音上传失败:', error);
      alert('录音上传失败，请稍后重试');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // 组件卸载时清理录音资源
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleRecordToggle = (event: MouseEvent<HTMLButtonElement>) => {
    if (isRecording) {
      stopRecording();
      return;
    }

    void startRecording(event.timeStamp);
  };

  return (
    <div className="bg-paper-50 rounded-2xl p-6 shadow-sm border border-paper-200 h-48">
      <h2 className="text-xl font-serif font-semibold mb-4 text-jade-600 flex items-center"><span className="w-1.5 h-4 bg-jade-400 mr-2 rounded-full"></span>听听家里的声音</h2>
      <div className="flex items-center gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {safeVoices.length === 0 && (
          <div className="min-w-[220px] h-[92px] bg-paper-100 p-4 rounded-xl border border-paper-200 text-sm text-ink-500 flex items-center">
            暂时还没有家庭语音，先说一句问候吧。
          </div>
        )}
        {safeVoices.map((voice) => {
          const isElder = voice.role === 'elder';
          const isPlaying = playingId === voice.id;
          const borderColor = isElder ? 'border-jade-400' : 'border-cinnabar-500';
          const btnColor = isElder ? 'bg-jade-100 text-jade-600 hover:bg-jade-200' : 'bg-paper-200 text-cinnabar-600 hover:bg-paper-300';
          const progressColor = isElder ? 'bg-jade-300' : 'bg-cinnabar-500';
          
          return (
            <div key={voice.id} className={`min-w-[220px] bg-paper-100 p-4 rounded-xl border-l-4 shadow-sm border border-paper-200 ${borderColor}`}>
              <p className="text-sm text-ink-600 mb-2 font-serif">
                <span className="font-bold text-ink-800">{isElder ? '长辈' : '子女'}</span> <span className="text-ink-400 mx-1">|</span> {voice.timeLabel || '刚刚'}
              </p>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  className={`w-10 h-10 rounded-full ${btnColor} flex items-center justify-center focus:outline-none transition-colors shadow-sm`}
                  onClick={() => handlePlay(voice.id, voice.url)}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <div className="flex-1 h-1.5 bg-paper-200 rounded-full overflow-hidden">
                  <div className={`h-full ${progressColor} transition-all duration-300`} style={{ width: isPlaying ? '100%' : '0%' }}></div>
                </div>
                <span className="text-xs text-ink-400 font-mono">{Math.max(0, voice.duration || 0)}"</span>
              </div>
            </div>
          );
        })}
        <button 
          type="button"
          onClick={handleRecordToggle}
          disabled={isUploading}
          className={`min-w-[140px] h-[92px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
            isRecording 
              ? 'bg-cinnabar-100 border-cinnabar-400 text-cinnabar-600 hover:bg-cinnabar-200' 
              : 'bg-paper-100 hover:bg-paper-200 border-jade-300 text-jade-600'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <span className="text-sm font-serif">正在传递声音...</span>
          ) : isRecording ? (
            <>
              <span className="text-2xl mb-1 animate-pulse">⏹</span>
              <span className="text-sm font-serif">记录完成</span>
            </>
          ) : (
            <>
              <span className="text-2xl mb-1 font-serif">+</span>
              <span className="text-sm font-serif">说点什么吧</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
