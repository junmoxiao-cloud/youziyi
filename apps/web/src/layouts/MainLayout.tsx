import React from 'react';
import NavigationBar from '../components/NavigationBar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 预留底部 NavigationBar 的高度 (h-20 + padding = pb-24) */}
      {children}
      <NavigationBar />
    </div>
  );
};

export default MainLayout;
