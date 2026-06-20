import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CITY_OPTIONS } from '@youziyi/types';
import { useStore } from '../store';

const DEFAULT_METRICS = [
  { value: 'mood', label: '心情记录', icon: '😊' },
  { value: 'steps', label: '每日步数', icon: '👣' },
  { value: 'heartRate', label: '心率检测', icon: '❤️' },
  { value: 'bloodPressure', label: '血压监测', icon: '🩺' },
  { value: 'bloodSugar', label: '血糖监测', icon: '🩸' },
  { value: 'sleep', label: '睡眠质量', icon: '😴' },
];

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { userId, userProfile, fetchUserProfile, updateUserProfile, userRole } = useStore();
  
  const [cityCode, setCityCode] = useState<string>('');
  const [customCity, setCustomCity] = useState<string>('');
  
  const [trackedMetrics, setTrackedMetrics] = useState<string[]>([]);
  const [customMetric, setCustomMetric] = useState<string>('');
  const [customMetricsList, setCustomMetricsList] = useState<{value: string, label: string, icon: string}[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (userId) {
        await fetchUserProfile(userId);
      }
    };
    loadProfile();
  }, [userId, fetchUserProfile]);

  useEffect(() => {
    if (userProfile) {
      const savedCityCode = userProfile.cityCode?.trim() ?? '';
      if (CITY_OPTIONS.some(c => c.code === savedCityCode)) {
        setCityCode(savedCityCode);
        setCustomCity('');
      } else {
        setCityCode('');
        setCustomCity(savedCityCode);
      }
      
      const savedMetrics = Array.isArray(userProfile.trackedMetrics) ? userProfile.trackedMetrics : [];
      setTrackedMetrics(savedMetrics);
      
      // Reconstruct custom metrics from saved data
      const defaultValues = DEFAULT_METRICS.map(m => m.value);
      const customSaved = savedMetrics.filter(m => !defaultValues.includes(m) && m.startsWith('custom_'));
      if (customSaved.length > 0) {
        // We only add if they don't exist yet to prevent duplicates on re-render
        if (customMetricsList.length === 0) {
           // In a real app, labels would be saved properly. Here we fallback to ID for demo
           setCustomMetricsList(customSaved.map(id => ({ value: id, label: '自定义指标', icon: '📌'})));
        }
      }
    }
  }, [userProfile]);

  const handleToggleMetric = (value: string) => {
    setTrackedMetrics(prev => 
      prev.includes(value) 
        ? prev.filter(m => m !== value)
        : [...prev, value]
    );
  };

  const handleAddCustomMetric = () => {
    if (customMetric.trim()) {
      const newMetricId = `custom_${customMetric.trim()}_${Date.now()}`;
      setCustomMetricsList([...customMetricsList, { value: newMetricId, label: customMetric.trim(), icon: '📌' }]);
      setTrackedMetrics([...trackedMetrics, newMetricId]);
      setCustomMetric('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const currentUserId = userId;

    if (!currentUserId) {
      setMessage({ type: 'error', text: '登录状态已失效，请重新登录后再保存。' });
      setIsSaving(false);
      return;
    }
    
    if (trackedMetrics.length === 0) {
      setMessage({ type: 'error', text: '请至少选择一项需要记录的健康指标哦' });
      setIsSaving(false);
      return;
    }

    const finalCityCode = customCity.trim() ? customCity.trim() : cityCode.trim();

    if (!finalCityCode) {
      setMessage({ type: 'error', text: '请先选择或填写所在城市。' });
      setIsSaving(false);
      return;
    }

    const success = await updateUserProfile(currentUserId, {
      cityCode: finalCityCode,
      trackedMetrics
    });

    if (success) {
      setMessage({ type: 'success', text: '设置保存成功！' });
      setTimeout(() => {
        if (userRole === 'elder') {
          navigate('/care');
        } else if (userRole === 'child') {
          navigate('/companion');
        } else {
          navigate(-1);
        }
      }, 1500);
    } else {
      setMessage({ type: 'error', text: '保存失败，请稍后重试' });
    }
    
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-paper-100 text-ink-800 p-8 font-sans flex flex-col items-center relative pb-32">
      <header className="mb-8 w-full max-w-2xl flex justify-between items-center border-b border-paper-200 pb-4">
        <h1 className="text-3xl font-serif font-bold text-ink-900 tracking-wider">
          个人设置
        </h1>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm text-ink-500 hover:text-ink-800 transition-colors"
        >
          返回上一页
        </button>
      </header>

      <main className="w-full max-w-2xl bg-white p-8 rounded-3xl shadow-sm border border-paper-200">
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* 城市选择 */}
          <div>
            <label className="block text-lg font-serif mb-4 text-ink-700">您所在的城市</label>
            <div className="flex gap-4 mb-4">
              <select 
                value={cityCode}
                onChange={(e) => { setCityCode(e.target.value); setCustomCity(''); }}
                className={`flex-1 text-xl p-4 border rounded-xl focus:outline-none focus:ring-1 appearance-none transition-colors ${
                  !customCity 
                    ? 'border-jade-500 bg-jade-50 ring-jade-500 text-jade-900' 
                    : 'border-paper-300 bg-paper-50 text-ink-600 focus:border-jade-400'
                }`}
              >
                <option value="" disabled>选择预设城市...</option>
                {CITY_OPTIONS.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              
              <input 
                type="text"
                placeholder="或自定义输入城市..."
                value={customCity}
                onChange={(e) => {
                  setCustomCity(e.target.value);
                  if (e.target.value) setCityCode('');
                }}
                className={`flex-1 text-xl p-4 border rounded-xl focus:outline-none transition-colors ${
                  customCity
                    ? 'border-jade-500 bg-jade-50 ring-1 ring-jade-500 text-jade-900'
                    : 'border-paper-300 bg-paper-50 focus:border-jade-400 focus:bg-white'
                }`}
              />
            </div>
            <p className="mt-2 text-ink-400 text-sm">城市信息将用于显示当地天气，让家人了解您的环境。</p>
          </div>

          {/* 健康指标选择 */}
          <div>
            <label className="block text-lg font-serif mb-4 text-ink-700">您希望日常记录哪些健康指标？</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[...DEFAULT_METRICS, ...customMetricsList].map(metric => {
                const isSelected = trackedMetrics.includes(metric.value);
                return (
                  <div 
                    key={metric.value}
                    onClick={() => handleToggleMetric(metric.value)}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                      isSelected 
                        ? 'border-jade-500 bg-jade-50' 
                        : 'border-paper-200 bg-paper-50 hover:bg-paper-100'
                    }`}
                  >
                    <span className="text-3xl mb-2">{metric.icon}</span>
                    <span className="text-md font-serif text-ink-700 text-center">{metric.label}</span>
                    <div className={`mt-3 w-6 h-6 rounded-full border flex items-center justify-center ${
                      isSelected ? 'bg-jade-500 border-jade-500' : 'bg-white border-paper-300'
                    }`}>
                      {isSelected && <span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Custom Metric Input */}
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="添加其他自定义指标 (例如: 每日饮水量)"
                value={customMetric}
                onChange={(e) => setCustomMetric(e.target.value)}
                onKeyPress={(e) => { e.key === 'Enter' && (e.preventDefault(), handleAddCustomMetric()); }}
                className="flex-1 text-lg p-4 border border-paper-300 rounded-xl focus:outline-none focus:border-jade-500 focus:bg-white bg-paper-50 transition-colors"
              />
              <button 
                type="button"
                onClick={handleAddCustomMetric}
                disabled={!customMetric.trim()}
                className="bg-paper-200 text-ink-700 px-6 rounded-xl font-medium hover:bg-jade-100 hover:text-jade-800 disabled:opacity-50 transition-colors"
              >
                添加指标
              </button>
            </div>
          </div>

          {/* 提交按钮 */}
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-jade-600 hover:bg-jade-700 text-white text-2xl font-serif py-4 rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {isSaving ? '正在保存...' : '保存设置'}
          </button>

          {message && (
            <div className={`p-4 rounded-xl text-center text-lg font-serif ${
              message.type === 'success' ? 'bg-jade-100 text-jade-800' : 'bg-cinnabar-100 text-cinnabar-800'
            }`}>
              {message.text}
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default Profile;
