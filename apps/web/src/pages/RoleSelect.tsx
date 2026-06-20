import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

const RoleSelect: React.FC = () => {
  const navigate = useNavigate();
  const setRole = useStore((state) => state.setRole);

  const handleSelectRole = (role: 'elder' | 'child') => {
    setRole(role);
    if (role === 'elder') {
      navigate('/care');
    } else {
      navigate('/companion');
    }
  };

  return (
    <div className="min-h-screen bg-paper-100 flex flex-col items-center justify-center font-sans">
      <h1 className="text-3xl font-serif font-bold text-ink-900 mb-8">欢迎回家，请告诉我您的身份</h1>
      <div className="flex gap-6">
        <button 
          onClick={() => handleSelectRole('elder')}
          className="w-48 h-48 bg-white rounded-2xl shadow-sm border border-paper-200 hover:border-jade-500 hover:shadow-md transition-all flex flex-col items-center justify-center gap-4 group"
        >
          <span className="text-5xl group-hover:scale-110 transition-transform">👴</span>
          <span className="text-xl font-serif text-ink-800">我是长辈</span>
        </button>
        <button 
          onClick={() => handleSelectRole('child')}
          className="w-48 h-48 bg-white rounded-2xl shadow-sm border border-paper-200 hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center justify-center gap-4 group"
        >
          <span className="text-5xl group-hover:scale-110 transition-transform">👩</span>
          <span className="text-xl font-serif text-ink-800">我是子女</span>
        </button>
      </div>
    </div>
  );
};

export default RoleSelect;
