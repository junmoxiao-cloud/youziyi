import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { useStore } from '../store';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const userId = useStore((state) => state.userId);
  const joinFamily = useStore((state) => state.joinFamily);

  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinResult, setJoinResult] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('请输入牵挂码');
      return;
    }
    if (!userId) return;

    setIsLoading(true);
    setError('');
    setJoinResult(null);

    const res = await joinFamily(userId, inviteCode.trim());
    if (res.success) {
      setJoinResult('家庭连接成功！正在跳转...');
      setTimeout(() => {
        navigate('/role-select');
      }, 1500);
    } else {
      setError(res.message || '牵挂码无效，请检查后重试');
    }
    setIsLoading(false);
  };

  const handleNavigateWithCode = (path: string) => {
    const trimmed = inviteCode.trim();
    if (!trimmed) {
      setError('请先输入牵挂码');
      return;
    }
    navigate(`${path}?inviteCode=${encodeURIComponent(trimmed)}`);
  };

  const handleBack = () => {
    setShowInviteInput(false);
    setInviteCode('');
    setError('');
    setJoinResult(null);
  };

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

        {!showInviteInput ? (
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-jade-600 text-white text-lg py-4 rounded-2xl hover:bg-jade-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
            >
              开启陪伴之旅
            </button>
            
            <button 
              onClick={() => setShowInviteInput(true)}
              className="w-full bg-white text-jade-700 text-lg py-4 rounded-2xl hover:bg-jade-50 transition-all shadow-sm border-2 border-jade-100 font-medium"
            >
              我有牵挂码，加入家人
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <button 
              onClick={handleBack}
              className="text-ink-400 hover:text-ink-600 flex items-center text-sm transition-colors"
            >
              ← 返回
            </button>

            <h3 className="text-xl font-serif font-bold text-ink-800">输入牵挂码</h3>
            <p className="text-sm text-ink-500">请输入家人分享的牵挂码，建立你们的专属羁绊</p>

            <div>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value);
                  setError('');
                  setJoinResult(null);
                }}
                className={`w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono border rounded-2xl focus:outline-none transition-all ${
                  error
                    ? 'border-cinnabar-300 focus:border-cinnabar-500 focus:ring-2 focus:ring-cinnabar-200 bg-cinnabar-50/30'
                    : 'border-paper-300 focus:border-jade-500 focus:ring-2 focus:ring-jade-200 bg-paper-50'
                }`}
                placeholder="输入代码"
                maxLength={8}
              />
              {error && (
                <p className="text-cinnabar-600 text-sm mt-2 flex items-center">
                  <span>⚠️</span> <span className="ml-1">{error}</span>
                </p>
              )}
              {joinResult && (
                <p className="text-jade-600 text-sm mt-2 flex items-center">
                  <span>🎉</span> <span className="ml-1">{joinResult}</span>
                </p>
              )}
            </div>

            {isAuthenticated ? (
              <button
                onClick={handleJoin}
                disabled={isLoading || !inviteCode.trim()}
                className="w-full bg-jade-600 text-white text-lg py-4 rounded-2xl hover:bg-jade-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? '正在连接...' : '确认加入'}
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => handleNavigateWithCode('/login')}
                  className="w-full bg-jade-600 text-white text-lg py-4 rounded-2xl hover:bg-jade-700 transition-colors shadow-md"
                >
                  登录已有账号
                </button>
                <button
                  onClick={() => handleNavigateWithCode('/register')}
                  className="w-full bg-white text-jade-700 text-lg py-4 rounded-2xl hover:bg-jade-50 transition-all shadow-sm border-2 border-jade-100"
                >
                  注册新账号
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-sm text-ink-400">
          《游子衣》 - 亲情的记录和见证之所
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Welcome;
