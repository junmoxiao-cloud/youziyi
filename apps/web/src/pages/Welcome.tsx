import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper-100 flex flex-col items-center justify-center font-sans p-6 relative overflow-hidden">
      {/* 装饰元素 */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-jade-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-sand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-cinnabar-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="z-10 text-center max-w-lg w-full bg-white/60 backdrop-blur-lg p-10 rounded-3xl shadow-xl border border-white/50">
        <h1 className="text-5xl font-serif font-bold text-jade-800 mb-6 tracking-widest">游子衣</h1>
        <p className="text-xl text-ink-600 font-serif mb-12 leading-relaxed">
          无论走多远<br/>
          总有一根线，牵着家的方向
        </p>

        <div className="space-y-4">
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-jade-600 text-white text-lg py-4 rounded-2xl hover:bg-jade-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
          >
            开启陪伴之旅
          </button>
          
          <button 
            onClick={() => navigate('/family/join')}
            className="w-full bg-white text-jade-700 text-lg py-4 rounded-2xl hover:bg-jade-50 transition-all shadow-sm border-2 border-jade-100 font-medium"
          >
            我有牵挂码，加入家人
          </button>
        </div>

        <div className="mt-8 text-sm text-ink-400">
          《游子衣》 - 亲情的记录和见证之所
        </div>
      </div>
    </div>
  );
};

export default Welcome;
