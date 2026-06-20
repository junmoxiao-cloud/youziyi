import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

const FamilyJoin: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useStore((state) => state.setAuth);
  const userProfile = useStore((state) => state.userProfile);
  const createFamily = useStore((state) => state.createFamily);
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [mode, setMode] = useState<'join' | 'create'>('create');
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('请输入牵挂码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const currentUserId = useStore.getState().userId;
      if (!currentUserId) {
        setError('用户未登录');
        setIsLoading(false);
        return;
      }
      
      const res = await useStore.getState().joinFamily(currentUserId, inviteCode);
      if (res.success) {
        setJoinSuccess(true);
        setTimeout(() => {
          setAuth(true, currentUserId);
          navigate('/role-select');
        }, 3000);
      } else {
        setError(res.message || '牵挂码无效，请检查后重试');
        setIsLoading(false);
      }
    } catch (err) {
      setError('网络连接出现问题，请稍后再试');
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsLoading(true);
    setError('');

    try {
      const currentUserId = useStore.getState().userId;
      if (!currentUserId) {
        setError('用户未登录');
        setIsLoading(false);
        return;
      }

      const data = await createFamily(currentUserId);
      if (data?.inviteCode) {
        setCreatedCode(data.inviteCode);
        setJoinSuccess(true);
        setTimeout(() => {
          setAuth(true, currentUserId);
          navigate('/role-select');
        }, 3000);
        return;
      }

      setError('创建家庭失败，请稍后再试');
      setIsLoading(false);
    } catch (err) {
      setError('网络连接出现问题，请稍后再试');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-100 flex items-center justify-center font-sans p-6">
      <div className="bg-white p-10 rounded-3xl shadow-md border border-paper-200 w-full max-w-md relative overflow-hidden">
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-jade-400 to-jade-600"></div>
        
        <button 
          onClick={() => navigate('/')}
          className="text-ink-400 hover:text-ink-600 mb-6 flex items-center text-sm transition-colors"
        >
          ← 返回
        </button>

        <h2 className="text-3xl font-serif font-bold text-ink-900 mb-2">连接家人</h2>
        <p className="text-ink-500 mb-8 font-serif">输入家人分享的牵挂码，建立你们的专属羁绊</p>

        {userProfile?.familyId && userProfile.familyInfo ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-2xl font-bold text-jade-600 mb-2">已连接家庭</h3>
            <p className="text-ink-600 mb-6">您已加入 {userProfile.familyInfo.familyName}</p>

            <div className="bg-paper-50 rounded-xl p-4 text-left">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-ink-800">{userProfile.familyInfo.familyName} 的成员：</h4>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  牵挂码 {userProfile.familyInfo.inviteCode}
                </span>
              </div>
              <ul className="space-y-2">
                {userProfile.familyInfo.members.map((m) => (
                  <li key={m.userId} className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm border border-paper-200">
                    <span className="font-medium text-ink-700">{m.name}</span>
                    <span className="text-xs px-2 py-1 bg-jade-100 text-jade-700 rounded-full">
                      {m.role === 'elder' ? '长辈' : '晚辈'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => navigate('/role-select')}
              className="mt-6 w-full bg-jade-600 text-white text-lg py-4 rounded-2xl hover:bg-jade-700 transition-colors shadow-md"
            >
              进入主页
            </button>
          </div>
        ) : joinSuccess ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-jade-600 mb-2">连接成功</h3>
            <p className="text-ink-600 mb-6">您已成功加入家庭</p>
            {userProfile?.familyInfo && (
              <div className="bg-paper-50 rounded-xl p-4 text-left">
                <h4 className="font-bold text-ink-800 mb-3">{userProfile.familyInfo.familyName} 的成员：</h4>
                <ul className="space-y-2">
                  {userProfile.familyInfo.members.map(m => (
                    <li key={m.userId} className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm border border-paper-200">
                      <span className="font-medium text-ink-700">{m.name}</span>
                      <span className="text-xs px-2 py-1 bg-jade-100 text-jade-700 rounded-full">
                        {m.role === 'elder' ? '长辈' : '晚辈'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-ink-400 mt-6">即将为您跳转...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('create');
                  setError('');
                }}
                className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                  mode === 'create'
                    ? 'border-jade-500 bg-jade-50 text-jade-700'
                    : 'border-paper-300 bg-white text-ink-700 hover:border-jade-300'
                }`}
              >
                我来创建
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('join');
                  setError('');
                }}
                className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                  mode === 'join'
                    ? 'border-jade-500 bg-jade-50 text-jade-700'
                    : 'border-paper-300 bg-white text-ink-700 hover:border-jade-300'
                }`}
              >
                我有牵挂码
              </button>
            </div>

            {mode === 'create' ? (
              <div className="space-y-4">
                <div className="bg-paper-50 border border-paper-200 rounded-2xl p-5 text-ink-600">
                  <p className="font-medium text-ink-800 mb-2">创建一个新的家庭</p>
                  <p className="text-sm leading-relaxed">
                    创建后会生成牵挂码，您可以把牵挂码分享给家人，让他们加入。
                  </p>
                  {createdCode && (
                    <div className="mt-4 text-center">
                      <div className="text-xs text-ink-400 mb-1">牵挂码</div>
                      <div className="text-3xl font-mono tracking-[0.35em] text-ink-900">
                        {createdCode}
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <p className="text-cinnabar-600 text-sm flex items-center">
                    <span>⚠️</span> <span className="ml-1">{error}</span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isLoading}
                  className="w-full bg-jade-600 text-white text-lg py-4 rounded-2xl hover:bg-jade-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isLoading ? '正在生成...' : '生成牵挂码'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">牵挂码</label>
                  <input 
                    type="text" 
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value);
                      setError('');
                    }}
                    className={`w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono border rounded-2xl focus:outline-none transition-all ${
                      error 
                        ? 'border-cinnabar-300 focus:border-cinnabar-500 focus:ring-2 focus:ring-cinnabar-200 bg-cinnabar-50/30' 
                        : 'border-paper-300 focus:border-jade-500 focus:ring-2 focus:ring-jade-200 bg-paper-50'
                    }`}
                    placeholder="输入代码"
                    maxLength={8}
                  />
                  {error && <p className="text-cinnabar-600 text-sm mt-2 flex items-center"><span>⚠️</span> <span className="ml-1">{error}</span></p>}
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading || !inviteCode.trim()}
                  className="w-full bg-jade-600 text-white text-lg py-4 rounded-2xl hover:bg-jade-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isLoading ? '正在连接...' : '确认加入'}
                </button>
              </form>
            )}
          </div>
        )}

        {!joinSuccess && (
          <div className="mt-8 text-center bg-paper-50 p-4 rounded-xl border border-paper-100">
            <p className="text-sm text-ink-500">
              不知道牵挂码？请让已经注册的家人在<br/>
              <span className="font-medium text-jade-700">「设置」-「邀请家人」</span>中获取
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyJoin;
