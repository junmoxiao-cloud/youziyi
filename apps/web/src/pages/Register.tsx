import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const register = useStore((state) => state.register);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'elder' | 'child'>('elder');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();

    if (normalizedUsername && normalizedPassword) {
      const res = await register(normalizedUsername, normalizedPassword, role);
      if (res.success) {
        alert('连接已建立，欢迎您的加入');
        navigate('/login');
      } else {
        alert(res.message);
      }
    } else {
      alert('为了更好地了解您，请填写完整信息');
    }
  };

  return (
    <div className="min-h-screen bg-paper-100 flex items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-paper-200 w-full max-w-md">
        <h1 className="text-3xl font-serif font-bold text-ink-900 text-center mb-2">游子衣</h1>
        <h2 className="text-xl text-ink-600 text-center mb-8">开启陪伴之旅</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">您的称呼</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-paper-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jade-500"
              placeholder="您希望我们怎么称呼您"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">通行密码</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-paper-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jade-500"
              placeholder="设置您的专属密码"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-ink-700 mb-2">您的身份</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('elder')}
                className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                  role === 'elder'
                    ? 'border-jade-500 bg-jade-50 text-jade-700'
                    : 'border-paper-300 bg-white text-ink-700 hover:border-jade-300'
                }`}
              >
                我是长辈
              </button>
              <button
                type="button"
                onClick={() => setRole('child')}
                className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                  role === 'child'
                    ? 'border-jade-500 bg-jade-50 text-jade-700'
                    : 'border-paper-300 bg-white text-ink-700 hover:border-jade-300'
                }`}
              >
                我是子女
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full bg-jade-600 text-white py-2 rounded-xl hover:bg-jade-700 transition-colors"
          >
            开始连接
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-ink-500">
          已经有连接了？ <Link to="/login" className="text-jade-600 hover:underline">立即回家</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
