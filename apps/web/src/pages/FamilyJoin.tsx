import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveCityLabel, resolveTodayHealthSnapshot } from '@youziyi/types';
import { useStore } from '../store';

function formatTimeLabel(timestamp: number | null | undefined): string {
  if (!timestamp) {
    return '暂无';
  }

  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
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

const FamilyJoin: React.FC = () => {
  const navigate = useNavigate();
  const userId = useStore((state) => state.userId);
  const userProfile = useStore((state) => state.userProfile);
  const fetchUserProfile = useStore((state) => state.fetchUserProfile);
  const fetchHealthData = useStore((state) => state.fetchHealthData);
  const fetchDailyHealthAggregates = useStore((state) => state.fetchDailyHealthAggregates);
  const todayCheckInStatus = useStore((state) => state.todayCheckInStatus);
  const dailyHealthAggregates = useStore((state) => state.dailyHealthAggregates);
  const createFamily = useStore((state) => state.createFamily);
  const joinFamily = useStore((state) => state.joinFamily);
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [mode, setMode] = useState<'join' | 'create'>('create');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [successProfileOverride, setSuccessProfileOverride] = useState<typeof userProfile | null>(null);

  const displayedProfile = successProfileOverride ?? userProfile;
  const displayedFamilyInfo = displayedProfile?.familyInfo ?? null;
  const hasJoinedFamily = Boolean(displayedProfile?.familyId && displayedFamilyInfo);
  const companionMember = useMemo(() => {
    if (!displayedFamilyInfo || !userId) {
      return null;
    }

    return (
      displayedFamilyInfo.members.find((member) => member.userId !== userId) ??
      displayedFamilyInfo.members[0] ??
      null
    );
  }, [displayedFamilyInfo, userId]);
  const sharedHealthTargetUserId = companionMember?.userId ?? userId;
  const todayHealthSnapshot = useMemo(
    () => resolveTodayHealthSnapshot(todayCheckInStatus, dailyHealthAggregates),
    [dailyHealthAggregates, todayCheckInStatus],
  );

  useEffect(() => {
    if (!userId) {
      return;
    }

    void fetchUserProfile(userId);
  }, [fetchUserProfile, userId]);

  useEffect(() => {
    if (!hasJoinedFamily || !sharedHealthTargetUserId) {
      return;
    }

    void Promise.all([
      fetchHealthData(sharedHealthTargetUserId),
      fetchDailyHealthAggregates(sharedHealthTargetUserId),
    ]);
  }, [fetchDailyHealthAggregates, fetchHealthData, hasJoinedFamily, sharedHealthTargetUserId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('请输入牵挂码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (!userId) {
        setError('用户未登录');
        setIsLoading(false);
        return;
      }

      const res = await joinFamily(userId, inviteCode.trim());
      if (res.success) {
        setSuccessProfileOverride(res.profile ?? null);
        setJoinSuccess(true);
        setSuccessMessage('家庭信息已刷新，您现在可以确认家人资料和共享状态。');
        setIsLoading(false);
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
      if (!userId) {
        setError('用户未登录');
        setIsLoading(false);
        return;
      }

      const data = await createFamily(userId);
      if (data?.inviteCode) {
        setSuccessProfileOverride(data.profile ?? null);
        setCreatedCode(data.inviteCode);
        setJoinSuccess(true);
        setSuccessMessage('家庭已创建成功，牵挂码已生成，您可以先确认家庭状态再进入主页。');
        setIsLoading(false);
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

        {hasJoinedFamily && displayedFamilyInfo ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">{joinSuccess ? '🎉' : '🏠'}</div>
            <h3 className="text-2xl font-bold text-jade-600 mb-2">{joinSuccess ? '连接成功' : '已连接家庭'}</h3>
            <p className="text-ink-600 mb-2">您已加入 {displayedFamilyInfo.familyName}</p>
            <p className="text-sm text-ink-500 mb-6">
              {successMessage ||
                (displayedFamilyInfo.members.length > 1
                  ? '家庭成员信息已同步完成。'
                  : '家庭已创建成功，等待家人输入牵挂码加入。')}
            </p>

            <div className="bg-paper-50 rounded-xl p-4 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h4 className="font-bold text-ink-800">{displayedFamilyInfo.familyName} 的成员：</h4>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  牵挂码 {createdCode || displayedFamilyInfo.inviteCode}
                </span>
              </div>
              <ul className="space-y-2">
                {displayedFamilyInfo.members.map((member) => (
                  <li
                    key={member.userId}
                    className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg shadow-sm border border-paper-200"
                  >
                    <div>
                      <span className="font-medium text-ink-700">{member.name}</span>
                      <p className="mt-1 text-xs text-ink-500">
                        城市：{resolveCityLabel(member.city, member.cityCode) || '待完善'}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-jade-100 text-jade-700 rounded-full">
                      {member.role === 'elder' ? '长辈' : '晚辈'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-paper-200 bg-white p-4 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-ink-800">家庭状态</h4>
                  <p className="mt-1 text-sm text-ink-500">
                    {displayedFamilyInfo.members.length > 1
                      ? `已连接 ${displayedFamilyInfo.members.length} 位家庭成员`
                      : '已创建家庭，等待家人输入牵挂码完成连接'}
                  </p>
                </div>
                {companionMember && (
                  <span className="rounded-full bg-paper-100 px-3 py-2 text-sm text-ink-700">
                    当前共享对象：{companionMember.name}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-paper-200 bg-white p-4 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-ink-800">今日共享状态</h4>
                  <p className="mt-1 text-sm text-ink-500">
                    这里会同步展示家人今天最新的报平安内容。
                  </p>
                </div>
                <span className="rounded-full bg-jade-50 px-3 py-2 text-xs text-jade-700">
                  与主页关怀卡片同步更新
                </span>
              </div>
              {todayHealthSnapshot ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-paper-50 px-4 py-3">
                    <p className="text-xs text-ink-500">日期</p>
                    <p className="mt-1 text-base font-medium text-ink-900">{todayHealthSnapshot.businessDate}</p>
                  </div>
                  <div className="rounded-xl bg-paper-50 px-4 py-3">
                    <p className="text-xs text-ink-500">心情</p>
                    <p className="mt-1 text-base font-medium text-ink-900">
                      {getMoodLabel(todayHealthSnapshot.summary.mood)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-paper-50 px-4 py-3">
                    <p className="text-xs text-ink-500">步数</p>
                    <p className="mt-1 text-base font-medium text-ink-900">
                      {todayHealthSnapshot.summary.steps ?? '--'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-paper-50 px-4 py-3">
                    <p className="text-xs text-ink-500">最近更新</p>
                    <p className="mt-1 text-base font-medium text-ink-900">
                      {formatTimeLabel(todayHealthSnapshot.latestCheckInAt)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-paper-50 px-4 py-3 text-sm text-ink-500">
                  还没有读取到今日共享状态，请先完成打卡或稍后刷新查看。
                </p>
              )}
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
            <p className="text-ink-600 mb-3">家庭资料正在同步，请稍后进入主页查看。</p>
            <p className="text-sm text-ink-500 mb-6">如果长时间未更新，可返回后重新进入家庭页。</p>
            <button
              onClick={() => navigate('/role-select')}
              className="w-full bg-jade-600 text-white text-lg py-4 rounded-2xl hover:bg-jade-700 transition-colors shadow-md"
            >
              进入主页
            </button>
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
                  {error && (
                    <p className="text-cinnabar-600 text-sm mt-2 flex items-center">
                      <span>⚠️</span> <span className="ml-1">{error}</span>
                    </p>
                  )}
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

        {!joinSuccess && !hasJoinedFamily && (
          <div className="mt-8 text-center bg-paper-50 p-4 rounded-xl border border-paper-100">
            <p className="text-sm text-ink-500">
              不知道牵挂码？请让已经注册的家人在
              <br />
              <span className="font-medium text-jade-700">「设置」-「邀请家人」</span>中获取
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyJoin;
