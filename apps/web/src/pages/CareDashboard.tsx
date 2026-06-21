import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type CheckInMetricsData,
  type CheckInPeriod,
  type TodayCheckInStatusResponse,
  type TrackedMetric,
  normalizeTrackedMetrics,
  resolveCityLabel,
  resolveTodayHealthSnapshot,
} from '@youziyi/types';
import { useStore } from '../store';

const MOODS = [
  { value: 'happy', icon: '😊', label: '开心' },
  { value: 'calm', icon: '😐', label: '平静' },
  { value: 'sad', icon: '😔', label: '伤心' },
];

function formatDateLabel(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) {
    return dateKey;
  }

  return `${Number(parts[1])} 月 ${Number(parts[2])} 日`;
}

function formatTimeLabel(timestamp: number | null | undefined): string {
  if (!timestamp) {
    return '暂无';
  }

  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatWindowLabel(startAt: number | null | undefined, endAt: number | null | undefined): string {
  if (!startAt || !endAt) {
    return '暂无';
  }

  return `${formatTimeLabel(startAt)} - ${formatTimeLabel(endAt)}`;
}

function getPeriodLabel(period: CheckInPeriod | undefined): string {
  switch (period) {
    case 'morning':
      return '早间';
    case 'daytime':
      return '日间';
    case 'evening':
      return '晚间';
    case 'closed':
      return '关闭';
    default:
      return '未知';
  }
}

function getMetricCardLabel(metric: TrackedMetric): string {
  switch (metric) {
    case 'mood':
      return '心情';
    case 'steps':
      return '步数';
    case 'heartRate':
      return '心率';
    case 'bloodPressure':
      return '血压';
    case 'bloodSugar':
      return '血糖';
    case 'sleep':
      return '睡眠';
    default:
      return metric;
  }
}

function getMoodLabel(mood: string | null | undefined): string {
  switch (mood) {
    case 'happy':
      return '开心';
    case 'calm':
      return '平静';
    case 'sad':
      return '有点低落';
    default:
      return '暂无';
  }
}

function formatTrackedSummary(metric: TrackedMetric, summary: { mood: string | null; steps: number | null; heartRate: number | null }): string | null {
  switch (metric) {
    case 'mood':
      return `心情 ${getMoodLabel(summary.mood)}`;
    case 'steps':
      return `步数 ${summary.steps ?? '--'}`;
    case 'heartRate':
      return `心率 ${summary.heartRate ?? '--'}`;
    default:
      return null;
  }
}

function buildCheckInReminderKey(status: TodayCheckInStatusResponse | null | undefined): string | null {
  if (!status?.userId || !status.businessDate) {
    return null;
  }

  return `${status.userId}:${status.businessDate}`;
}

function canPromptCheckIn(status: TodayCheckInStatusResponse | null | undefined): boolean {
  return Boolean(status && !status.hasCheckedInToday && status.window?.isWithinCheckInWindow);
}

const CareDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    userId,
    setViewMode,
    userProfile,
    todayCheckInStatus,
    dailyHealthAggregates,
    fetchUserProfile,
    fetchHealthData,
    fetchDailyHealthAggregates,
    submitCheckIn,
    shownCheckInReminderKeys,
    markCheckInReminderShown,
  } = useStore();
  
  const [steps, setSteps] = useState<number>(0);
  const [heartRate, setHeartRate] = useState<number>(75);
  const [bloodPressure, setBloodPressure] = useState<string>('120/80');
  const [bloodSugar, setBloodSugar] = useState<number>(5.5);
  const [sleep, setSleep] = useState<string>('good');
  
  const [mood, setMood] = useState<string>('happy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [hydratedSnapshot, setHydratedSnapshot] = useState<string>('');
  const [showCheckInReminder, setShowCheckInReminder] = useState(false);
  const formSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (userId) {
      void Promise.all([
        fetchUserProfile(userId),
        fetchHealthData(userId),
        fetchDailyHealthAggregates(userId),
      ]);
    }
  }, [fetchDailyHealthAggregates, fetchHealthData, fetchUserProfile, userId]);

  const trackedMetrics = useMemo<TrackedMetric[]>(() => {
    if (Array.isArray(todayCheckInStatus?.form.editableMetrics)) {
      return normalizeTrackedMetrics(todayCheckInStatus.form.editableMetrics);
    }

    return Array.isArray(userProfile?.trackedMetrics)
      ? normalizeTrackedMetrics(userProfile.trackedMetrics)
      : [];
  }, [todayCheckInStatus, userProfile?.trackedMetrics]);
  const summaryMetrics = useMemo(
    () => trackedMetrics.filter((metric) => metric === 'mood' || metric === 'steps' || metric === 'heartRate'),
    [trackedMetrics]
  );
  const currentCityLabel = resolveCityLabel(undefined, userProfile?.cityCode) || '待完善城市';
  const windowPolicy = todayCheckInStatus?.window ?? null;
  const hydrateKey = `${todayCheckInStatus?.businessDate ?? 'none'}:${todayCheckInStatus?.lastCheckInAt ?? 'none'}`;
  const todayHealthSnapshot = resolveTodayHealthSnapshot(todayCheckInStatus, dailyHealthAggregates);
  const todaySummaryText = useMemo(() => {
    if (!todayHealthSnapshot) {
      return '等待今日状态';
    }

    const parts = summaryMetrics
      .map((metric) => formatTrackedSummary(metric, todayHealthSnapshot.summary))
      .filter((item): item is string => Boolean(item));

    return parts.length > 0 ? parts.join(' / ') : '等待今日状态';
  }, [summaryMetrics, todayHealthSnapshot]);
  const reminderKey = buildCheckInReminderKey(todayCheckInStatus);
  const shouldEncourageCheckIn = canPromptCheckIn(todayCheckInStatus);
  const isSubmitDisabled =
    isSubmitting ||
    !todayCheckInStatus ||
    !trackedMetrics.length ||
    !windowPolicy?.isWithinCheckInWindow ||
    Boolean(todayCheckInStatus.hasCheckedInToday);

  useEffect(() => {
    if (!todayCheckInStatus || hydrateKey === hydratedSnapshot) {
      return;
    }

    const initialValues = todayCheckInStatus.form.initialValues;
    setMood(initialValues.mood ?? 'happy');
    setSteps(initialValues.steps ?? 0);
    setHeartRate(initialValues.heartRate ?? 75);
    setHydratedSnapshot(hydrateKey);
  }, [hydrateKey, hydratedSnapshot, todayCheckInStatus]);

  useEffect(() => {
    if (!shouldEncourageCheckIn || !reminderKey) {
      setShowCheckInReminder(false);
      return;
    }

    if (shownCheckInReminderKeys.includes(reminderKey)) {
      return;
    }

    setShowCheckInReminder(true);
    markCheckInReminderShown(reminderKey);
  }, [markCheckInReminderShown, reminderKey, shouldEncourageCheckIn, shownCheckInReminderKeys]);

  const focusCheckInForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setShowCheckInReminder(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const currentUserId = userId;

    if (!currentUserId) {
      setMessage({ type: 'error', text: '登录状态已失效，请重新登录后再打卡。' });
      setIsSubmitting(false);
      return;
    }

    if (!trackedMetrics.length) {
      setMessage({
        type: 'error',
        text: '当前阶段仅支持标准健康指标打卡，请先前往个人设置或 Onboarding 重新选择后再继续。',
      });
      setIsSubmitting(false);
      return;
    }

    if (!windowPolicy?.isWithinCheckInWindow) {
      setMessage({ type: 'error', text: windowPolicy?.promptMessage || '当前不在今日打卡窗口内。' });
      setIsSubmitting(false);
      return;
    }

    if (todayCheckInStatus?.hasCheckedInToday) {
      setMessage({ type: 'error', text: '今天已经完成打卡了，明天再来记录吧。' });
      setIsSubmitting(false);
      return;
    }

    const metricsData: CheckInMetricsData = {};
    const checkinData: {
      userId: string;
      timestamp: number;
      mood?: string;
      steps?: number;
      heartRate?: number;
      metricsData: CheckInMetricsData;
    } = {
      userId: currentUserId,
      timestamp: Date.now(),
      metricsData,
    };
    
    if (trackedMetrics.includes('mood')) {
      checkinData.mood = mood;
      metricsData.mood = mood;
    }
    if (trackedMetrics.includes('steps')) {
      checkinData.steps = steps;
      metricsData.steps = steps;
    }
    if (trackedMetrics.includes('heartRate')) {
      checkinData.heartRate = heartRate;
      metricsData.heartRate = heartRate;
    }
    if (trackedMetrics.includes('bloodPressure')) metricsData.bloodPressure = bloodPressure;
    if (trackedMetrics.includes('bloodSugar')) metricsData.bloodSugar = bloodSugar;
    if (trackedMetrics.includes('sleep')) metricsData.sleep = sleep;

    const result = await submitCheckIn(checkinData);
    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.success ? '记录成功，今日状态已经同步给家人。' : result.message || '哎呀，记录小纸条没传过去，再试一次吧',
    });
    setIsSubmitting(false);
  };

  const handleSwitchMode = () => {
    setViewMode('companion');
    navigate('/companion');
  };

  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const handleGenerateCode = async () => {
    if (!userId) {
      setMessage({ type: 'error', text: '登录状态已失效，请重新登录后再生成牵挂码。' });
      return;
    }

    const codeData = await useStore.getState().createFamily(userId);
    if (codeData) {
      setInviteCode(codeData.inviteCode);
    } else {
      setMessage({ type: 'error', text: '牵挂码生成失败，请稍后重试。' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-ink-800 p-8 font-sans flex flex-col items-center relative overflow-hidden">
      {/* Immersive Ambient Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#FDF6E3] rounded-full blur-[120px] pointer-events-none opacity-80"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-jade-100/50 rounded-full blur-[120px] pointer-events-none opacity-60"></div>

      {showCheckInReminder && (
        <div className="fixed left-1/2 top-6 z-50 w-[min(92vw,40rem)] -translate-x-1/2 rounded-[2rem] border border-cinnabar-200 bg-white/95 px-6 py-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cinnabar-600">今日提醒</p>
              <h3 className="mt-2 text-2xl font-serif text-ink-900">今天还没报平安，先来打个卡吧</h3>
              <p className="mt-2 text-sm text-ink-600">
                趁现在还在打卡时间里，记下今天的状态，家人会更安心。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCheckInReminder(false)}
              className="rounded-full border border-paper-200 px-3 py-1 text-sm text-ink-500 hover:bg-paper-50"
            >
              稍后再看
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={focusCheckInForm}
              className="rounded-full bg-cinnabar-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-cinnabar-600"
            >
              立即去打卡
            </button>
            <span className="rounded-full bg-paper-100 px-4 py-2 text-sm text-ink-600">
              打卡时间：{formatWindowLabel(windowPolicy?.opensAt, windowPolicy?.closesAt)}
            </span>
          </div>
        </div>
      )}

      <header className="relative z-10 mb-8 w-full max-w-3xl flex justify-between items-center bg-white/40 backdrop-blur-md border border-white/60 px-8 py-4 rounded-3xl shadow-sm">
        <h1 className="text-3xl font-serif font-bold text-ink-900 tracking-wider drop-shadow-sm flex items-center gap-3">
          游子衣 
          <span className="text-xl font-sans font-medium text-ink-500 bg-white/50 px-3 py-1 rounded-full border border-white/60">长辈极简关怀</span>
        </h1>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/profile')}
            className="px-6 py-2.5 text-lg font-medium bg-white/80 text-ink-700 rounded-full hover:bg-white transition-all shadow-sm border border-white"
          >
            个人设置
          </button>
          <button 
            onClick={handleSwitchMode}
            className="px-6 py-2.5 text-lg font-medium bg-jade-100/80 text-jade-800 rounded-full hover:bg-jade-200 transition-all shadow-sm border border-jade-200/50"
          >
            切换陪伴视图
          </button>
          <button 
            onClick={handleGenerateCode}
            className="px-6 py-2.5 text-lg font-medium bg-blue-100/80 text-blue-800 rounded-full hover:bg-blue-200 transition-all shadow-sm border border-blue-200/50"
          >
            {inviteCode ? `牵挂码: ${inviteCode}` : '生成牵挂码'}
          </button>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-3xl bg-white/70 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-white/80">
        <h2 className="text-3xl font-serif mb-8 text-jade-700 text-center tracking-wide font-semibold">分享您的今天</h2>
        {!trackedMetrics.length && (
          <div className="mb-8 rounded-3xl border border-[#E5C07B] bg-[#FDF6E3] px-6 py-5 text-center text-lg text-[#8B6B3F]">
            当前阶段仅支持标准健康指标打卡。请先前往个人设置或 Onboarding 重新选择至少一项标准指标后再继续。
          </div>
        )}
        {todayCheckInStatus && (
          <div className="mb-8 space-y-4">
            <div className="rounded-3xl border border-jade-100 bg-jade-50/80 px-6 py-5 text-center">
              <p className="text-sm text-jade-700">今日打卡提醒</p>
              <p className="mt-2 text-2xl font-serif text-jade-900">
                {windowPolicy?.promptMessage || '今日打卡状态已更新'}
              </p>
              <p className="mt-3 text-sm text-jade-700">
                打卡日期：{formatDateLabel(todayCheckInStatus.businessDate)}，窗口：{formatWindowLabel(windowPolicy?.opensAt, windowPolicy?.closesAt)}
              </p>
            </div>

            {shouldEncourageCheckIn && (
              <div className="rounded-3xl border border-cinnabar-200 bg-[#FFF7F2] px-6 py-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-cinnabar-600">去打卡入口</p>
                    <h3 className="mt-2 text-2xl font-serif text-ink-900">现在正好在打卡时间，记得报个平安</h3>
                    <p className="mt-2 text-sm text-ink-600">
                      记录完成后，家人会同步看到您今天的心情和状态。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={focusCheckInForm}
                    className="rounded-full bg-cinnabar-500 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-cinnabar-600"
                  >
                    立即去打卡
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-3xl border border-white/70 bg-white/80 px-5 py-4 shadow-sm">
                <p className="text-sm text-ink-500">今日状态</p>
                <p className="mt-2 text-2xl font-serif text-ink-900">
                  {todayCheckInStatus.hasCheckedInToday ? '已完成' : '待打卡'}
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/80 px-5 py-4 shadow-sm">
                <p className="text-sm text-ink-500">当前时段</p>
                <p className="mt-2 text-2xl font-serif text-ink-900">
                  {getPeriodLabel(windowPolicy?.currentPeriod)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/80 px-5 py-4 shadow-sm">
                <p className="text-sm text-ink-500">最近打卡</p>
                <p className="mt-2 text-2xl font-serif text-ink-900">
                  {formatTimeLabel(todayCheckInStatus.lastCheckInAt)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/80 px-5 py-4 shadow-sm">
                <p className="text-sm text-ink-500">今日摘要</p>
                <p className="mt-2 text-base font-medium text-ink-900">
                  {todaySummaryText}
                </p>
                <p className="mt-2 text-xs text-ink-500">
                  完成后，家人会同步看到您今天的状态
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/80 px-6 py-5 shadow-sm">
              <div className="flex flex-wrap gap-3">
                {trackedMetrics.map((metric) => (
                  <span
                    key={metric}
                    className="rounded-full border border-jade-200 bg-jade-50 px-4 py-2 text-sm text-jade-800"
                  >
                    {getMetricCardLabel(metric)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div ref={formSectionRef}>
          <form onSubmit={handleSubmit} className="space-y-10">
          {/* 心情选择 */}
          {trackedMetrics.includes('mood') && (
            <div className="bg-white/50 p-8 rounded-3xl border border-white/60 shadow-sm">
              <label className="block text-2xl font-serif mb-6 text-ink-800 text-center">今天感觉怎么样？</label>
              <div className="flex gap-6 justify-center">
                {MOODS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={`flex flex-col items-center justify-center p-6 w-32 h-32 rounded-[2rem] border-2 transition-all transform duration-300 ${
                      mood === m.value 
                        ? 'border-jade-400 bg-jade-50 shadow-md scale-105' 
                        : 'border-transparent bg-white/60 hover:bg-white shadow-sm'
                    }`}
                  >
                    <span className="text-5xl mb-3 drop-shadow-sm">{m.icon}</span>
                    <span className="text-xl font-serif font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 步数与心率 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trackedMetrics.includes('steps') && (
              <div className="bg-white/50 p-6 rounded-3xl border border-white/60 shadow-sm">
                <label className="block text-xl font-serif mb-4 text-ink-800">今天走了多少步呀？</label>
                <input 
                  type="number" 
                  value={steps}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  className="w-full text-3xl font-bold p-4 bg-white/80 border-2 border-paper-200 rounded-2xl focus:outline-none focus:border-jade-400 focus:ring-4 focus:ring-jade-100 text-center transition-all"
                  min="0"
                />
              </div>
            )}
            {trackedMetrics.includes('heartRate') && (
              <div className="bg-white/50 p-6 rounded-3xl border border-white/60 shadow-sm">
                <label className="block text-xl font-serif mb-4 text-ink-800">您的心跳情况 (次/分)</label>
                <input 
                  type="number" 
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  className="w-full text-3xl font-bold p-4 bg-white/80 border-2 border-paper-200 rounded-2xl focus:outline-none focus:border-jade-400 focus:ring-4 focus:ring-jade-100 text-center transition-all"
                  min="0"
                />
              </div>
            )}
            {trackedMetrics.includes('bloodPressure') && (
              <div className="bg-white/50 p-6 rounded-3xl border border-white/60 shadow-sm">
                <label className="block text-xl font-serif mb-4 text-ink-800">血压情况 (如 120/80)</label>
                <input 
                  type="text" 
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className="w-full text-3xl font-bold p-4 bg-white/80 border-2 border-paper-200 rounded-2xl focus:outline-none focus:border-jade-400 focus:ring-4 focus:ring-jade-100 text-center transition-all"
                />
              </div>
            )}
            {trackedMetrics.includes('bloodSugar') && (
              <div className="bg-white/50 p-6 rounded-3xl border border-white/60 shadow-sm">
                <label className="block text-xl font-serif mb-4 text-ink-800">血糖情况 (mmol/L)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(Number(e.target.value))}
                  className="w-full text-3xl font-bold p-4 bg-white/80 border-2 border-paper-200 rounded-2xl focus:outline-none focus:border-jade-400 focus:ring-4 focus:ring-jade-100 text-center transition-all"
                />
              </div>
            )}
          </div>

          {trackedMetrics.includes('sleep') && (
            <div className="bg-white/50 p-8 rounded-3xl border border-white/60 shadow-sm">
              <label className="block text-2xl font-serif mb-6 text-ink-800 text-center">昨晚睡得好吗？</label>
              <div className="flex gap-6 justify-center">
                {[
                  { value: 'good', icon: '😄', label: '很好' },
                  { value: 'normal', icon: '🙂', label: '一般' },
                  { value: 'bad', icon: '😫', label: '不好' }
                ].map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSleep(s.value)}
                    className={`flex flex-col items-center justify-center p-6 w-32 h-32 rounded-[2rem] border-2 transition-all transform duration-300 ${
                      sleep === s.value 
                        ? 'border-jade-400 bg-jade-50 shadow-md scale-105' 
                        : 'border-transparent bg-white/60 hover:bg-white shadow-sm'
                    }`}
                  >
                    <span className="text-5xl mb-3 drop-shadow-sm">{s.icon}</span>
                    <span className="text-xl font-serif font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 城市信息 */}
          <div className="bg-white/50 p-6 rounded-3xl border border-white/60 shadow-sm">
            <label className="block text-xl font-serif mb-4 text-ink-800">您现在在哪里呢？</label>
            <div className="rounded-2xl border-2 border-paper-200 bg-white/80 px-5 py-4 text-2xl font-medium text-ink-900">
              {currentCityLabel}
            </div>
            <p className="mt-3 text-sm text-ink-500">
              城市信息来自您的个人资料。如需修改，请前往个人设置更新。
            </p>
          </div>

          {/* 提交按钮 */}
            <button 
              type="submit" 
              disabled={isSubmitDisabled}
              className="w-full bg-jade-600 hover:bg-jade-700 text-white text-3xl font-serif py-6 rounded-[2rem] shadow-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-4 tracking-widest"
            >
              {isSubmitting
                ? '正在传递您的挂念...'
                : todayCheckInStatus?.hasCheckedInToday
                  ? '今天已经报过平安了'
                  : windowPolicy?.isWithinCheckInWindow
                    ? '立即报个平安'
                    : '当前不在打卡时间'}
            </button>

            {message && (
              <div className={`p-6 rounded-2xl text-center text-xl font-serif shadow-sm animate-in fade-in slide-in-from-bottom-4 ${
                message.type === 'success' ? 'bg-jade-100/90 text-jade-800 border border-jade-200' : 'bg-cinnabar-100/90 text-cinnabar-800 border border-cinnabar-200'
              }`}>
                {message.text}
              </div>
            )}
          </form>
        </div>

        {dailyHealthAggregates && (
          <section className="mt-10 rounded-[2rem] border border-white/80 bg-white/60 p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-serif text-ink-900">最近几天的打卡记录</h3>
                <p className="mt-2 text-sm text-ink-500">
                  展示最近 {dailyHealthAggregates.requestedDays} 天的记录变化，方便回看这几天的状态。
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {dailyHealthAggregates.recentDays.map((day) => (
                <div
                  key={day.date}
                  className="flex flex-col gap-3 rounded-3xl border border-paper-200 bg-white/80 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-lg font-serif text-ink-900">{formatDateLabel(day.date)}</p>
                    <p className="mt-1 text-sm text-ink-500">
                      {day.hasCheckedIn ? `已打卡 ${day.recordCount} 次` : '未打卡'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-ink-700">
                    {summaryMetrics.includes('mood') && (
                      <span className="rounded-full bg-paper-100 px-3 py-2">
                        心情：{day.summary.mood ?? '暂无'}
                      </span>
                    )}
                    {summaryMetrics.includes('steps') && (
                      <span className="rounded-full bg-paper-100 px-3 py-2">
                        步数：{day.summary.steps ?? '--'}
                      </span>
                    )}
                    {summaryMetrics.includes('heartRate') && (
                      <span className="rounded-full bg-paper-100 px-3 py-2">
                        心率：{day.summary.heartRate ?? '--'}
                      </span>
                    )}
                    <span className="rounded-full bg-paper-100 px-3 py-2">
                      最新：{formatTimeLabel(day.latestCheckInAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default CareDashboard;
