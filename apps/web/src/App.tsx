import React, { useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { useStore } from './store';
import WeatherBottle from './components/WeatherBottle';
import VoiceTimeline from './components/VoiceTimeline';

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

function App() {
  const {
    healthData,
    warningStatus,
    elderWeather,
    childWeather,
    voices,
    fetchHealthData,
    fetchWarningStatus,
    fetchWeathers,
    fetchVoices
  } = useStore();

  const [currentTime, setCurrentTime] = React.useState(() => Date.now());

  useEffect(() => {
    // 假设用户ID为 user_001
    const userId = 'user_001';
    fetchHealthData(userId);
    fetchWarningStatus(userId);
    fetchWeathers('SHANGHAI', 'BEIJING');
    fetchVoices(userId);
    
    // 定时刷新数据
    const timer = setInterval(() => {
      fetchHealthData(userId);
      fetchWarningStatus(userId);
      fetchWeathers('SHANGHAI', 'BEIJING');
      fetchVoices(userId);
      setCurrentTime(Date.now());
    }, 60000); // 每分钟刷新一次
    
    return () => {
      clearInterval(timer);
    };
  }, [fetchHealthData, fetchWarningStatus, fetchWeathers, fetchVoices]);

  const timeSinceInteraction = warningStatus 
    ? currentTime - warningStatus.lastInteractionTime 
    : 0;

  return (
    <div className="min-h-screen bg-paper-100 text-ink-800 p-8 font-sans">
      <header className="mb-8 flex justify-between items-center border-b border-paper-200 pb-4">
        <h1 className="text-3xl font-serif font-bold text-ink-900 tracking-wider">游子衣 <span className="text-lg font-sans font-normal text-ink-400 ml-2">亲情记录大屏</span></h1>
        <div className="text-sm text-ink-600 font-serif">
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
        {/* 左侧健康数据区 */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-paper-50 rounded-2xl p-6 shadow-sm border border-paper-200 flex-1 flex flex-col">
            <h2 className="text-xl font-serif font-semibold mb-4 text-jade-600 flex items-center"><span className="w-1.5 h-4 bg-jade-400 mr-2 rounded-full"></span>长辈实时状态</h2>
            <div className="flex justify-between items-center p-4 bg-paper-100 rounded-xl mb-4 border border-paper-200">
              <span className="text-ink-600">今日心情</span>
              <span className="text-2xl">{healthData ? getMoodIcon(healthData.mood) : '...'}</span>
            </div>
            <div className="flex-1 bg-paper-100 border border-paper-200 rounded-xl p-4">
              <ReactECharts 
                option={{
                  tooltip: { trigger: 'axis' },
                  legend: { data: ['步数', '心率'], textStyle: { color: '#4A4D50' } },
                  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                  xAxis: {
                    type: 'category',
                    data: ['前5天', '前4天', '前3天', '前2天', '昨天', '今日'],
                    axisLabel: { color: '#8E9195' },
                    axisLine: { lineStyle: { color: '#D0D2D5' } }
                  },
                  yAxis: [
                    { type: 'value', name: '步数', axisLabel: { color: '#8E9195' }, splitLine: { lineStyle: { color: '#F0EBE1', type: 'dashed' } }, nameTextStyle: { color: '#8E9195' } },
                    { type: 'value', name: '心率', axisLabel: { color: '#8E9195' }, splitLine: { show: false }, nameTextStyle: { color: '#8E9195' } }
                  ],
                  series: [
                    { name: '步数', type: 'bar', data: [3000, 4500, 3200, 5000, 4200, healthData?.steps || 0], itemStyle: { color: '#96C7A7', borderRadius: [4, 4, 0, 0] } },
                    { name: '心率', type: 'line', yAxisIndex: 1, data: [72, 75, 71, 78, 74, healthData?.heartRate || 0], itemStyle: { color: '#D25642' }, smooth: true, symbolSize: 8 }
                  ]
                }}
                style={{ height: '100%', minHeight: '200px' }}
              />
            </div>
          </div>

          <div className="bg-paper-50 rounded-2xl p-6 shadow-sm border border-paper-200 flex-1">
            <h2 className="text-xl font-serif font-semibold mb-4 text-jade-600 flex items-center"><span className="w-1.5 h-4 bg-jade-400 mr-2 rounded-full"></span>互动预警状态</h2>
            <div className="flex flex-col items-center justify-center h-full pb-8">
              <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-4 ${
                warningStatus?.warningLevel === 0 ? 'border-jade-300 bg-jade-100/50' :
                warningStatus?.warningLevel === 1 ? 'border-[#E5C07B] bg-[#E5C07B]/10' :
                'border-cinnabar-500 bg-cinnabar-500/10'
              }`}>
                <span className={`text-lg font-serif font-bold ${
                  warningStatus?.warningLevel === 0 ? 'text-jade-600' :
                  warningStatus?.warningLevel === 1 ? 'text-[#D19A66]' :
                  'text-cinnabar-600'
                }`}>
                  {warningStatus?.warningLevel === 0 ? '平安顺遂' :
                   warningStatus?.warningLevel === 1 ? '需问候' : '亟待联系'}
                </span>
              </div>
              <p className="text-ink-400 text-center text-sm">
                距离上次互动<br />
                <span className="text-ink-800 font-serif font-bold text-lg">{formatDuration(timeSinceInteraction)}</span>
              </p>
            </div>
          </div>
        </section>

        {/* 右侧天气/动效区 */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-paper-50 rounded-2xl p-6 shadow-sm border border-paper-200 flex-1 relative overflow-hidden flex flex-col">
            <h2 className="text-xl font-serif font-semibold mb-4 text-jade-600 z-10 relative flex items-center"><span className="w-1.5 h-4 bg-jade-400 mr-2 rounded-full"></span>城市天气瓶 <span className="text-sm font-sans font-normal text-ink-400 ml-2">双城同天</span></h2>
            
            <div className="flex-1 grid grid-cols-2 gap-4 z-10 relative">
              <div className="bg-paper-100/80 backdrop-blur-md rounded-xl p-6 flex flex-col items-center justify-center border border-paper-200 shadow-sm">
                <h3 className="text-lg font-serif text-ink-600 mb-2">长辈所在城市</h3>
                <p className="text-3xl font-serif font-bold text-ink-900 mb-2 tracking-widest">{elderWeather?.cityName || '加载中...'}</p>
                <div className="text-5xl my-4">{elderWeather ? getWeatherIcon(elderWeather.weatherType) : '...'}</div>
                <p className="text-xl text-ink-800 font-serif">
                  {elderWeather ? `${getWeatherName(elderWeather.weatherType)} ${elderWeather.temperature}°C` : '--'}
                </p>
              </div>
              
              <div className="bg-paper-100/80 backdrop-blur-md rounded-xl p-6 flex flex-col items-center justify-center border border-paper-200 shadow-sm">
                <h3 className="text-lg font-serif text-ink-600 mb-2">子女所在城市</h3>
                <p className="text-3xl font-serif font-bold text-ink-900 mb-2 tracking-widest">{childWeather?.cityName || '加载中...'}</p>
                <div className="text-5xl my-4">{childWeather ? getWeatherIcon(childWeather.weatherType) : '...'}</div>
                <p className="text-xl text-ink-800 font-serif">
                  {childWeather ? `${getWeatherName(childWeather.weatherType)} ${childWeather.temperature}°C` : '--'}
                </p>
              </div>
            </div>

            {/* 天气瓶动效占位 */}
            <WeatherBottle weatherType={elderWeather?.weatherType || 'sunny'} />
          </div>
          
          <VoiceTimeline voices={voices} />
        </section>
      </main>
    </div>
  );
}

export default App;
