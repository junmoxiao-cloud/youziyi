import React, { useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { resolveCityLabel, resolveTodayHealthSnapshot } from '@youziyi/types';
import { useStore } from '../store';
import WeatherBottle from '../components/WeatherBottle';
import VoiceTimeline from '../components/VoiceTimeline';

function formatDuration(ms: number) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟`;
  }
  return `${minutes} 分钟`;
}

function getWeatherIcon(type: string) {
  switch (type) {
    case 'sunny': return '☀️';
    case 'cloudy': return '⛅';
    case 'rainy': return '🌧️';
    case 'snowy': return '❄️';
    default: return '🌤️';
  }
}

function getWeatherName(type: string) {
  switch (type) {
    case 'sunny': return '晴';
    case 'cloudy': return '多云';
    case 'rainy': return '雨';
    case 'snowy': return '雪';
    default: return '未知';
  }
}

function getMoodIcon(mood: string) {
  switch (mood) {
    case 'happy': return '😊 开心';
    case 'calm': return '😐 平静';
    case 'sad': return '😔 伤心';
    default: return '😊 开心';
  }
}

function formatDateShort(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) {
    return dateKey;
  }

  return `${Number(parts[1])}/${Number(parts[2])}`;
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

function normalizeCityCode(cityCode?: string | null): string {
  return typeof cityCode === 'string' ? cityCode.trim().toUpperCase() : '';
}

function weatherMatchesCityCode(
  weather: { cityCode?: string | null } | null | undefined,
  cityCode?: string | null,
): boolean {
  const expectedCityCode = normalizeCityCode(cityCode);
  if (!expectedCityCode) {
    return false;
  }

  return normalizeCityCode(weather?.cityCode) === expectedCityCode;
}

function resolveFamilyWeatherCityCodes(
  profile: {
    role?: string | null;
    cityCode?: string | null;
    familyInfo?: {
      members?: Array<{
        userId: string;
        role: string;
        cityCode?: string | null;
      }>;
    } | null;
  } | null,
  userId: string,
  fallbackRole?: string | null,
) {
  const familyMembers = profile?.familyInfo?.members ?? [];
  const currentProfileRole = profile?.role ?? fallbackRole ?? null;
  const currentMember =
    familyMembers.find((member) => member.userId === userId) ??
    familyMembers.find((member) => member.role === currentProfileRole) ??
    null;
  const counterpartMember =
    familyMembers.find((member) => member.userId !== userId) ??
    familyMembers.find((member) => member.role !== currentProfileRole) ??
    null;
  const elderMember =
    familyMembers.find((member) => member.role === 'elder') ??
    (currentProfileRole === 'elder' ? currentMember : counterpartMember);
  const childMember =
    familyMembers.find((member) => member.role === 'child') ??
    (currentProfileRole === 'child' ? currentMember : counterpartMember);

  return {
    elderCityCode: elderMember?.cityCode ?? (currentProfileRole === 'elder' ? profile?.cityCode : null),
    childCityCode: childMember?.cityCode ?? (currentProfileRole === 'child' ? profile?.cityCode : null),
  };
}

const CompanionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    warningStatus,
    elderWeather,
    childWeather,
    voices,
    setViewMode,
    fetchUserProfile,
    fetchHealthData,
    fetchDailyHealthAggregates,
    fetchWarningStatus,
    fetchWeathers,
    fetchVoices,
    addVoice,
    userId,
    userProfile,
    userRole,
    todayCheckInStatus,
    dailyHealthAggregates,
    shownCheckInReminderKeys,
    markCheckInReminderShown,
  } = useStore();

  const [currentTime, setCurrentTime] = React.useState(() => Date.now());
  const [inviteCode, setInviteCode] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);
  const [showCheckInReminder, setShowCheckInReminder] = React.useState(false);
  const safeVoices = Array.isArray(voices) ? voices : [];
  const currentProfileRole = userProfile?.role ?? userRole;
  const familyMembers = userProfile?.familyInfo?.members ?? [];
  const currentMember = useMemo(
    () =>
      familyMembers.find((member) => member.userId === userId) ??
      familyMembers.find((member) => member.role === currentProfileRole) ??
      null,
    [currentProfileRole, familyMembers, userId],
  );
  const counterpartMember = useMemo(
    () =>
      familyMembers.find((member) => member.userId !== userId) ??
      familyMembers.find((member) => member.role !== currentProfileRole) ??
      null,
    [currentProfileRole, familyMembers, userId],
  );
  const elderMember = useMemo(
    () =>
      familyMembers.find((member) => member.role === 'elder') ??
      (currentProfileRole === 'elder' ? currentMember : counterpartMember),
    [counterpartMember, currentMember, currentProfileRole, familyMembers],
  );
  const childMember = useMemo(
    () =>
      familyMembers.find((member) => member.role === 'child') ??
      (currentProfileRole === 'child' ? currentMember : counterpartMember),
    [counterpartMember, currentMember, currentProfileRole, familyMembers],
  );
  const sharedHealthTargetMember = currentProfileRole === 'child'
    ? counterpartMember ?? elderMember ?? currentMember
    : currentMember ?? elderMember ?? counterpartMember;
  const sharedHealthTargetUserId = sharedHealthTargetMember?.userId ?? userId;
  const elderCityCode = elderMember?.cityCode ?? (currentProfileRole === 'elder' ? userProfile?.cityCode : null);
  const childCityCode = childMember?.cityCode ?? (currentProfileRole === 'child' ? userProfile?.cityCode : null);
  const elderWeatherReady = weatherMatchesCityCode(elderWeather, elderCityCode);
  const childWeatherReady = weatherMatchesCityCode(childWeather, childCityCode);
  const elderWeatherDisplay = elderWeatherReady ? elderWeather : null;
  const childWeatherDisplay = childWeatherReady ? childWeather : null;
  const elderCityLabel = resolveCityLabel(elderMember?.city, elderCityCode) || '待完善城市';
  const childCityLabel = resolveCityLabel(childMember?.city, childCityCode) || '待连接家人';
  const todayHealthSnapshot = useMemo(
    () => resolveTodayHealthSnapshot(todayCheckInStatus, dailyHealthAggregates),
    [dailyHealthAggregates, todayCheckInStatus],
  );
  const chartDays = dailyHealthAggregates?.recentDays ?? [];
  const chartLabels = chartDays.map((day) => formatDateShort(day.date));
  const chartSteps = chartDays.map((day) => day.summary.steps ?? 0);
  const chartHeartRates = chartDays.map((day) => day.summary.heartRate ?? 0);
  const counterpartProfileLabel = currentProfileRole === 'child' ? '对方基础资料' : '家庭成员资料';
  const reminderKey = todayCheckInStatus?.userId && todayCheckInStatus.businessDate
    ? `${todayCheckInStatus.userId}:${todayCheckInStatus.businessDate}`
    : null;
  const shouldEncourageCheckIn = Boolean(
    todayCheckInStatus &&
    !todayCheckInStatus.hasCheckedInToday &&
    todayCheckInStatus.window?.isWithinCheckInWindow
  );
  const reminderTitle = currentProfileRole === 'child'
    ? `${sharedHealthTargetMember?.name ?? '家人'}今天还没报平安`
    : '今天还没报平安';
  const reminderDescription = currentProfileRole === 'child'
    ? '现在还在打卡时间里，去关怀页看看今日记录，也提醒家人别错过今天的打卡。'
    : '现在还在打卡时间里，去关怀页完成今天的记录吧。';
  const reminderActionLabel = currentProfileRole === 'child' ? '去打卡入口' : '立即去打卡';

  useEffect(() => {
    if (!userId) {
      return;
    }

    const syncDashboard = async () => {
      const latestProfile = await fetchUserProfile(userId);
      const latestWeatherCityCodes = resolveFamilyWeatherCityCodes(latestProfile, userId, userRole);

      await Promise.all([
        fetchWarningStatus(userId),
        fetchWeathers(latestWeatherCityCodes.elderCityCode, latestWeatherCityCodes.childCityCode),
        fetchVoices(userId),
        ...(sharedHealthTargetUserId
          ? [
              fetchHealthData(sharedHealthTargetUserId),
              fetchDailyHealthAggregates(sharedHealthTargetUserId, 6),
            ]
          : []),
      ]);
      setCurrentTime(Date.now());
    };

    void syncDashboard();
    const timer = setInterval(() => {
      void syncDashboard();
    }, 60000);

    return () => {
      clearInterval(timer);
    };
  }, [
    fetchDailyHealthAggregates,
    fetchHealthData,
    fetchUserProfile,
    fetchVoices,
    fetchWarningStatus,
    fetchWeathers,
    sharedHealthTargetUserId,
    userId,
    userRole,
  ]);

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

  const timeSinceInteraction = warningStatus && Number.isFinite(warningStatus.lastInteractionTime)
    ? Math.max(0, currentTime - warningStatus.lastInteractionTime)
    : 0;

  const handleSwitchMode = () => {
    setViewMode('care');
    navigate('/care');
  };

  const handleOpenCheckInEntry = () => {
    setShowCheckInReminder(false);
    setViewMode('care');
    navigate('/care');
  };

  const handleGenerateCode = async () => {
    setActionMessage(null);
    if (!userId) {
      setActionMessage('登录状态已失效，请重新登录后再生成亲情牵挂码。');
      return;
    }

    const codeData = await useStore.getState().createFamily(userId);
    if (codeData) {
      setInviteCode(codeData.inviteCode);
    } else {
      setActionMessage('亲情牵挂码生成失败，请稍后重试。');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-ink-800 p-6 font-sans relative overflow-hidden flex flex-col">
      {/* Immersive Ambient Backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-jade-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-[#FDF6E3]/60 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Warning Toast */}
      {warningStatus && warningStatus.warningLevel > 0 && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-8 py-5 rounded-3xl shadow-2xl border backdrop-blur-xl flex items-center gap-5 transition-all animate-in fade-in slide-in-from-top-4 ${
          warningStatus.warningLevel === 1 
            ? 'bg-[#FDF6E3]/90 border-[#E5C07B]/50 text-[#D19A66]' 
            : 'bg-cinnabar-50/90 border-cinnabar-400/50 text-cinnabar-700'
        }`}>
          <div className="text-4xl drop-shadow-md">
            {warningStatus.warningLevel === 1 ? '⚠️' : '🚨'}
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl mb-1 tracking-wide">
              {warningStatus.warningLevel === 1 ? '管家温馨提示' : '管家紧急提醒'}
            </h3>
            <p className="text-base font-medium opacity-90">
              长辈已经 {formatDuration(timeSinceInteraction)} 没和您说话啦，打个电话关心一下吧。
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 mb-6 flex justify-between items-center bg-white/40 backdrop-blur-md border border-white/60 px-8 py-4 rounded-3xl shadow-sm">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-serif font-bold text-ink-900 tracking-widest drop-shadow-sm">
            游子衣 <span className="text-lg font-sans font-normal text-ink-500 ml-3 tracking-normal">全景陪伴</span>
          </h1>
          <div className="h-6 w-px bg-ink-200"></div>
          <button 
            onClick={() => navigate('/profile')}
            className="px-5 py-2 text-sm font-medium bg-white/60 text-ink-700 rounded-full hover:bg-white/80 transition-all shadow-sm border border-white/50"
          >
            个人设置
          </button>
          <button 
            onClick={handleSwitchMode}
            className="px-5 py-2 text-sm font-medium bg-jade-100/60 text-jade-700 rounded-full hover:bg-jade-200/60 transition-all shadow-sm border border-jade-200/50"
          >
            切换长辈关怀视图
          </button>
          <button 
            onClick={handleGenerateCode}
            className="px-5 py-2 text-sm font-medium bg-blue-100/60 text-blue-700 rounded-full hover:bg-blue-200/60 transition-all shadow-sm border border-blue-200/50"
          >
            {inviteCode ? `亲情牵挂码: ${inviteCode}` : '生成亲情牵挂码'}
          </button>
        </div>
        <div className="text-base text-ink-600 font-serif tracking-wide bg-white/40 px-4 py-2 rounded-2xl border border-white/50">
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </div>
      </header>
      {showCheckInReminder && (
        <div className="relative z-10 mb-4 rounded-[2rem] border border-cinnabar-200 bg-white/90 px-6 py-5 shadow-lg backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cinnabar-600">今日提醒</p>
              <h3 className="mt-2 text-2xl font-serif text-ink-900">{reminderTitle}</h3>
              <p className="mt-2 text-sm text-ink-600">{reminderDescription}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleOpenCheckInEntry}
                className="rounded-full bg-cinnabar-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-cinnabar-600"
              >
                {reminderActionLabel}
              </button>
              <button
                type="button"
                onClick={() => setShowCheckInReminder(false)}
                className="rounded-full border border-paper-200 px-5 py-2.5 text-sm text-ink-500 transition-colors hover:bg-paper-50"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
      {actionMessage && (
        <div className="relative z-10 mb-4 rounded-3xl border border-cinnabar-200 bg-cinnabar-50/90 px-6 py-4 text-base text-cinnabar-700 shadow-sm">
          {actionMessage}
        </div>
      )}

      {/* Main Grid: 3 Columns */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)] pb-6">
        
        {/* Left Column: Emotion & Connection */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          {/* Mood Card */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80">
            <h2 className="text-xl font-serif font-semibold mb-6 text-ink-800 flex items-center">
              <span className="w-2 h-2 bg-jade-400 rounded-full mr-3 shadow-[0_0_8px_rgba(107,168,126,0.8)]"></span>
              今日共享状态
            </h2>
            <div className="rounded-2xl border border-white/50 bg-gradient-to-b from-white/80 to-white/40 p-5 shadow-inner">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-ink-500">
                    {sharedHealthTargetMember ? `共享对象：${sharedHealthTargetMember.name}` : '共享对象待连接'}
                  </p>
                  <p className="mt-2 text-2xl font-serif text-ink-900">
                    {todayHealthSnapshot?.hasCheckedIn ? '今日已更新' : '今日待打卡'}
                  </p>
                </div>
                <span className="text-5xl drop-shadow-md">
                  {todayHealthSnapshot ? getMoodIcon(todayHealthSnapshot.summary.mood ?? '').split(' ')[0] : '...'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-white/70 px-3 py-3">
                  <p className="text-ink-500">心情</p>
                  <p className="mt-1 font-medium text-ink-900">
                    {todayHealthSnapshot ? getMoodIcon(todayHealthSnapshot.summary.mood ?? '').split(' ')[1] : '获取中'}
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 px-3 py-3">
                  <p className="text-ink-500">步数</p>
                  <p className="mt-1 font-medium text-ink-900">{todayHealthSnapshot?.summary.steps ?? '--'}</p>
                </div>
                <div className="rounded-xl bg-white/70 px-3 py-3">
                  <p className="text-ink-500">心率</p>
                  <p className="mt-1 font-medium text-ink-900">{todayHealthSnapshot?.summary.heartRate ?? '--'}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-ink-500">最近更新：{formatTimeLabel(todayHealthSnapshot?.latestCheckInAt)}</p>
            </div>
          </div>

          {/* Connection Thermometer */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 flex-1 flex flex-col">
            <h2 className="text-xl font-serif font-semibold mb-6 text-ink-800 flex items-center">
              <span className="w-2 h-2 bg-cinnabar-400 rounded-full mr-3 shadow-[0_0_8px_rgba(210,86,66,0.8)]"></span>
              亲情温度计
            </h2>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className={`relative w-40 h-40 rounded-full flex items-center justify-center mb-8 shadow-xl transition-all duration-700 ${
                warningStatus?.warningLevel === 0 ? 'bg-gradient-to-br from-jade-100 to-jade-50 shadow-jade-200/50' :
                warningStatus?.warningLevel === 1 ? 'bg-gradient-to-br from-[#FDF6E3] to-[#F9E8C0] shadow-[#E5C07B]/40' :
                'bg-gradient-to-br from-cinnabar-50 to-cinnabar-100 shadow-cinnabar-200/50'
              }`}>
                {/* Decorative pulsing rings */}
                <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                  warningStatus?.warningLevel === 0 ? 'bg-jade-400' :
                  warningStatus?.warningLevel === 1 ? 'bg-[#E5C07B]' :
                  'bg-cinnabar-500'
                }`}></div>
                
                <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 ${
                  warningStatus?.warningLevel === 0 ? 'border-jade-300' :
                  warningStatus?.warningLevel === 1 ? 'border-[#E5C07B]' :
                  'border-cinnabar-400'
                }`}>
                  <span className={`text-xl font-serif font-bold tracking-wide ${
                    warningStatus?.warningLevel === 0 ? 'text-jade-600' :
                    warningStatus?.warningLevel === 1 ? 'text-[#D19A66]' :
                    'text-cinnabar-600'
                  }`}>
                    {warningStatus?.warningLevel === 0 ? '温度正好' :
                     warningStatus?.warningLevel === 1 ? '需要添柴啦' : '快去暖暖场'}
                  </span>
                </div>
              </div>
              
              <div className="text-center bg-white/40 px-6 py-4 rounded-2xl border border-white/50 w-full">
                <p className="text-ink-500 text-sm mb-1 font-serif">距离上次互动</p>
                <p className="text-ink-900 font-sans font-bold text-2xl tracking-tight">
                  {formatDuration(timeSinceInteraction)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Center Column: Weather & Bottle */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 flex-1 relative overflow-hidden flex flex-col">
            <h2 className="text-2xl font-serif font-semibold mb-6 text-ink-800 z-10 relative flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
              同一片天空
            </h2>
            
            <div className="grid grid-cols-2 gap-6 z-10 relative mb-6">
              <div className="bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center border border-white/60 shadow-sm transition-transform hover:-translate-y-1">
                <h3 className="text-sm font-sans tracking-widest text-ink-400 mb-2 uppercase">家乡</h3>
                <p className="text-2xl font-serif font-bold text-ink-900 mb-3">{elderCityLabel}</p>
                <div className="text-6xl my-2 drop-shadow-md filter">{elderWeatherDisplay ? getWeatherIcon(elderWeatherDisplay.weatherType) : '...'}</div>
                <p className="text-lg text-ink-700 font-medium mt-2">
                  {elderWeatherDisplay ? `${getWeatherName(elderWeatherDisplay.weatherType)} · ${elderWeatherDisplay.temperature}°C` : '天气暂不可用'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center border border-white/60 shadow-sm transition-transform hover:-translate-y-1">
                <h3 className="text-sm font-sans tracking-widest text-ink-400 mb-2 uppercase">远方</h3>
                <p className="text-2xl font-serif font-bold text-ink-900 mb-3">{childCityLabel}</p>
                <div className="text-6xl my-2 drop-shadow-md filter">{childWeatherDisplay ? getWeatherIcon(childWeatherDisplay.weatherType) : '...'}</div>
                <p className="text-lg text-ink-700 font-medium mt-2">
                  {childWeatherDisplay ? `${getWeatherName(childWeatherDisplay.weatherType)} · ${childWeatherDisplay.temperature}°C` : '天气暂不可用'}
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-white/50 bg-white/55 px-5 py-4 text-sm text-ink-600">
              <p className="font-medium text-ink-800">天气更新说明</p>
              <p className="mt-2">
                天气会先按家人最新资料中的城市刷新；当资料城市与天气结果暂时不一致时，这里会保守显示为暂不可用。
              </p>
            </div>

            <div className="flex-1 w-full relative rounded-2xl overflow-hidden bg-gradient-to-b from-paper-100/50 to-transparent border border-white/40 shadow-inner">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <span className="font-serif text-6xl tracking-widest">城市天气瓶</span>
              </div>
              {/* Weather Bottle Component */}
              <div className="absolute inset-0">
                <WeatherBottle weatherType={elderWeatherDisplay?.weatherType ?? 'unknown'} />
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Health Charts & Voice */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          {/* Health Chart */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 h-1/2 flex flex-col min-h-[320px]">
            <h2 className="text-xl font-serif font-semibold mb-4 text-ink-800 flex items-center">
              <span className="w-2 h-2 bg-jade-400 rounded-full mr-3 shadow-[0_0_8px_rgba(107,168,126,0.8)]"></span>
              {counterpartProfileLabel}
            </h2>
            <div className="mb-1 grid grid-cols-1 gap-1 shrink-0">
              <div className="rounded-2xl border border-white/60 bg-white/50 px-3 py-1.5">
                <p className="text-[10px] text-ink-500">称呼与身份</p>
                <p className="mt-0.5 text-base font-serif text-ink-900">
                  {counterpartMember ? `${counterpartMember.name} · ${counterpartMember.role === 'elder' ? '长辈' : '晚辈'}` : '等待家人加入'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-white/60 bg-white/50 px-3 py-1.5">
                  <p className="text-[10px] text-ink-500">所在城市</p>
                  <p className="mt-0.5 text-sm font-medium text-ink-900">
                    {counterpartMember
                      ? resolveCityLabel(counterpartMember.city, counterpartMember.cityCode) || '待完善'
                      : '待连接'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/50 px-3 py-1.5">
                  <p className="text-[10px] text-ink-500">家庭状态</p>
                  <p className="mt-0.5 text-sm font-medium text-ink-900">
                    {familyMembers.length > 1 ? `已连接 ${familyMembers.length} 人` : '等待家人加入'}
                  </p>
                </div>
              </div>
              <div className="relative group rounded-2xl border border-white/60 bg-white/50 px-3 py-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-ink-800">今日状态说明</span>
                <span className="w-4 h-4 rounded-full bg-ink-200 text-white text-[10px] flex items-center justify-center cursor-help select-none">?</span>
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-3 rounded-xl bg-white/90 backdrop-blur border border-white/60 shadow-lg text-xs text-ink-600 leading-snug">
                  当前页展示的是家庭共享对象今天最新的报平安内容，打卡后会自动刷新。
                </div>
              </div>
            </div>
            <div className="flex-1 w-full bg-white/40 rounded-2xl border border-white/50 p-2">
              <ReactECharts
                option={{
                  tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#E6DFD3', textStyle: { color: '#2B2D2F' } },
                  legend: { data: ['步数', '心率'], textStyle: { color: '#4A4D50' }, top: 0 },
                  grid: { left: '2%', right: '2%', bottom: '5%', top: '15%', containLabel: true },
                  xAxis: {
                    type: 'category',
                    data: chartLabels,
                    axisLabel: { color: '#8E9195' },
                    axisLine: { lineStyle: { color: '#D0D2D5' } },
                    axisTick: { show: false }
                  },
                  yAxis: [
                    { type: 'value', name: '', axisLabel: { show: false }, splitLine: { lineStyle: { color: '#F0EBE1', type: 'dashed' } } },
                    { type: 'value', name: '', axisLabel: { show: false }, splitLine: { show: false } }
                  ],
                  series: [
                    { name: '步数', type: 'bar', data: chartSteps, barWidth: '40%', itemStyle: { color: '#96C7A7', borderRadius: [6, 6, 0, 0] } },
                    { name: '心率', type: 'line', yAxisIndex: 1, data: chartHeartRates, itemStyle: { color: '#D25642' }, smooth: true, symbolSize: 8, lineStyle: { width: 3, shadowColor: 'rgba(210,86,66,0.3)', shadowBlur: 10 } }
                  ]
                }}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </div>

          {/* Voice Timeline */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 h-1/2 flex flex-col overflow-hidden">
             <h2 className="text-xl font-serif font-semibold mb-4 text-ink-800 flex items-center">
              <span className="w-2 h-2 bg-[#E5C07B] rounded-full mr-3 shadow-[0_0_8px_rgba(229,192,123,0.8)]"></span>
              家庭故事接龙
            </h2>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/40 rounded-2xl border border-white/50 p-4">
              <VoiceTimeline voices={safeVoices} onVoiceUpload={addVoice} />
            </div>
          </div>
        </section>
        
      </main>
    </div>
  );
};

export default CompanionDashboard;
