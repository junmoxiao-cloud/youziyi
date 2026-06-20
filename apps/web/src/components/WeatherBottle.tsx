interface WeatherBottleProps {
  weatherType: string;
}

export default function WeatherBottle({ weatherType }: WeatherBottleProps) {
  const normalizedType = weatherType || 'sunny';

  const getMeta = (type: string) => {
    switch (type) {
      case 'sunny':
        return {
          icon: '☀️',
          name: '晴朗',
          desc: '阳光正好',
          gradient: 'from-orange-100 via-paper-50 to-paper-100',
          border: 'border-orange-200/60',
          glow: 'bg-orange-300/20',
        };
      case 'cloudy':
        return {
          icon: '⛅',
          name: '多云',
          desc: '云层轻覆',
          gradient: 'from-slate-100 via-paper-50 to-blue-50',
          border: 'border-slate-200/70',
          glow: 'bg-slate-300/20',
        };
      case 'rainy':
        return {
          icon: '🌧️',
          name: '下雨',
          desc: '雨声入梦',
          gradient: 'from-blue-100 via-paper-50 to-slate-100',
          border: 'border-blue-200/70',
          glow: 'bg-blue-300/20',
        };
      case 'snowy':
        return {
          icon: '❄️',
          name: '下雪',
          desc: '雪意温柔',
          gradient: 'from-blue-50 via-paper-50 to-white',
          border: 'border-blue-100/80',
          glow: 'bg-blue-200/20',
        };
      default:
        return {
          icon: '🌤️',
          name: '天气',
          desc: '云光交织',
          gradient: 'from-paper-50 via-paper-100 to-blue-50',
          border: 'border-paper-200/70',
          glow: 'bg-paper-200/30',
        };
    }
  };

  const meta = getMeta(normalizedType);

  return (
    <div className="absolute inset-0 z-0 pointer-events-auto">
      <div
        className={[
          'w-full h-full rounded-2xl border shadow-inner overflow-hidden relative',
          'bg-gradient-to-br',
          meta.gradient,
          meta.border,
        ].join(' ')}
      >
        <div className="absolute inset-0 bg-white/25 backdrop-blur-[2px] pointer-events-none" />
        <div className={['absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl', meta.glow].join(' ')} />
        <div className={['absolute -bottom-28 -left-28 w-80 h-80 rounded-full blur-3xl', meta.glow].join(' ')} />

        <div className="relative z-10 h-full w-full flex flex-col items-center justify-center gap-4 px-6">
          <div className="text-7xl drop-shadow-lg">{meta.icon}</div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-xl font-serif font-semibold tracking-widest text-ink-900">
              {meta.name}
            </div>
            <div className="text-sm text-ink-600 bg-white/60 border border-white/70 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm">
              {meta.desc}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
