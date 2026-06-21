import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CITY_OPTIONS, type TrackedMetric, normalizeTrackedMetrics } from '@youziyi/types';
import { useStore } from '../store';

const DEFAULT_METRICS: Array<{ id: TrackedMetric; label: string; icon: string; default: boolean }> = [
  { id: 'mood', label: '心情', icon: '😊', default: true },
  { id: 'steps', label: '步数', icon: '👣', default: true },
  { id: 'heartRate', label: '心率', icon: '❤️', default: false },
  { id: 'bloodPressure', label: '血压', icon: '🩺', default: false },
  { id: 'bloodSugar', label: '血糖', icon: '🩸', default: false },
  { id: 'sleep', label: '睡眠', icon: '🌙', default: false },
];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { updateUserProfile, fetchUserProfile, userId } = useStore();

  const [cityCode, setCityCode] = useState<string>('');
  const [customCity, setCustomCity] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  
  const [trackedMetrics, setTrackedMetrics] = useState<TrackedMetric[]>(
    normalizeTrackedMetrics(DEFAULT_METRICS.filter(m => m.default).map(m => m.id))
  );

  const toggleMetric = (id: TrackedMetric) => {
    // Mood is required
    if (id === 'mood') return;
    
    setTrackedMetrics(prev =>
      normalizeTrackedMetrics(prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
    );
  };

  const handleComplete = async () => {
    try {
      setMessage('');
      const finalCityCode = customCity.trim() ? customCity.trim() : cityCode.trim();

      if (!userId) {
        setMessage('登录状态已失效，请重新登录后继续完善资料。');
        return;
      }

      if (!finalCityCode) {
        setMessage('请先选择或填写常住城市。');
        return;
      }

      const success = await updateUserProfile(userId, {
        cityCode: finalCityCode,
        trackedMetrics: normalizeTrackedMetrics(trackedMetrics),
      });
      if (success) {
        const profile = await fetchUserProfile(userId);
        if (!profile?.familyId) {
          navigate('/family/join');
        } else {
          navigate('/role-select');
        }
      } else {
        setMessage('资料保存失败，请稍后重试。');
      }
    } catch (err) {
      console.error('Error during handleComplete:', err);
      setMessage('资料保存失败，请稍后重试。');
    }
  };

  return (
    <div className="min-h-screen bg-paper-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-jade-100 rounded-full blur-[100px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FDF6E3] rounded-full blur-[100px] opacity-60"></div>

      <div className="w-full max-w-lg bg-paper-50/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-paper-200 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-jade-600 mb-4 tracking-wide">欢迎回家</h1>
          <p className="text-lg text-ink-600 font-sans leading-relaxed">
            我是您的贴心管家。<br />
            能告诉我您常住的城市吗？这能帮助我们为您提供更准确的天气和关怀建议。
          </p>
        </div>
        
        <div className="space-y-8">
          {/* City Selection */}
          <div>
            <label className="block text-xl font-serif text-ink-800 mb-4">
              您目前常住在哪个城市？
            </label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {CITY_OPTIONS.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { setCityCode(c.code); setCustomCity(''); }}
                  className={`py-4 rounded-2xl text-lg font-sans transition-all duration-300 ${
                    cityCode === c.code && !customCity
                      ? 'bg-jade-600 text-white shadow-md transform scale-[1.02]'
                      : 'bg-paper-100 text-ink-600 border border-paper-200 hover:bg-paper-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {/* Custom City Input */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="或输入其他城市名称..."
                value={customCity}
                onChange={(e) => {
                  setCustomCity(e.target.value);
                  if (e.target.value) setCityCode('');
                }}
                className={`w-full py-4 px-6 rounded-2xl text-lg font-sans transition-all duration-300 outline-none ${
                  customCity 
                    ? 'bg-jade-50 border-2 border-jade-400 text-jade-800' 
                    : 'bg-paper-100 border-2 border-transparent text-ink-600 focus:bg-white focus:border-paper-300'
                }`}
              />
            </div>
          </div>

          {/* Metrics Selection */}
          <div>
            <label className="block text-xl font-serif text-ink-800 mb-2">
              您希望每天记录哪些健康指标？
            </label>
            <p className="text-sm text-ink-400 font-sans mb-4">
              我们将为您量身定制极简打卡面板，不被打扰。
            </p>
            <p className="mb-4 rounded-2xl border border-paper-200 bg-paper-100 px-4 py-3 text-sm text-ink-500">
              当前阶段仅支持心情、步数、心率、血压、血糖、睡眠 6 项标准指标。`心情` 为必选项，自定义指标暂不开放打卡。
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {DEFAULT_METRICS.map(m => {
                const isSelected = trackedMetrics.includes(m.id);
                const isRequired = m.id === 'mood';
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleMetric(m.id)}
                    disabled={isRequired}
                    className={`flex flex-col items-center justify-center py-4 rounded-2xl transition-all duration-300 ${
                      isSelected
                        ? 'bg-jade-50 border-2 border-jade-300 text-jade-700 shadow-sm'
                        : 'bg-paper-100 border-2 border-transparent text-ink-600 hover:bg-paper-200'
                    } ${isRequired ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="text-2xl mb-1">{m.icon}</span>
                    <span className="text-sm font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            onClick={handleComplete}
            disabled={!trackedMetrics.length || (!cityCode.trim() && !customCity.trim())}
            className="w-full bg-ink-900 text-paper-50 py-4 rounded-full text-xl font-serif tracking-widest shadow-lg hover:bg-ink-800 active:transform active:scale-[0.98] transition-all duration-300 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            开启温暖陪伴
          </button>
          {message && (
            <div className="rounded-2xl border border-cinnabar-200 bg-cinnabar-50 px-5 py-4 text-base text-cinnabar-700">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
