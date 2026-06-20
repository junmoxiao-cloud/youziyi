import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { resolveAuthenticatedLandingPath } from '../routing';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useStore((state) => state.setAuth);
  const login = useStore((state) => state.login);
  const fetchUserProfile = useStore((state) => state.fetchUserProfile);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();

    if (normalizedUsername && normalizedPassword) {
      const res = await login(normalizedUsername, normalizedPassword);
      if (res.success && res.userId) {
        setAuth(true, res.userId);
        const profile = await fetchUserProfile(res.userId);
        const landingPath = resolveAuthenticatedLandingPath(profile);

        const from = (location.state as any)?.from;
        const fromPathname: string | undefined =
          typeof from?.pathname === 'string' ? from.pathname : (typeof from === 'string' ? from : undefined);

        if (landingPath !== '/role-select') {
          navigate(landingPath, { replace: true });
          return;
        }
        if (fromPathname && fromPathname !== '/login' && fromPathname !== '/register' && fromPathname !== '/') {
          navigate(fromPathname, { replace: true });
          return;
        }
        navigate('/role-select', { replace: true });
      } else {
        alert(res.message);
      }
    } else {
      alert('请输入用户名和密码');
    }
  };

  return (
    <div className="min-h-screen bg-paper-100 flex items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-paper-200 w-full max-w-md">
        <h1 className="text-3xl font-serif font-bold text-ink-900 text-center mb-2">游子衣</h1>
        <h2 className="text-xl text-ink-600 text-center mb-8">欢迎回来，我的朋友</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">您的称呼</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-paper-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jade-500"
              placeholder="请输入您的称呼"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">通行密码</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-paper-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jade-500"
              placeholder="请输入您的密码"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-jade-600 text-white py-2 rounded-xl hover:bg-jade-700 transition-colors"
          >
            进入游子衣
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-ink-500">
          初次见面？ <Link to="/register" className="text-jade-600 hover:underline">建立家庭连接</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
