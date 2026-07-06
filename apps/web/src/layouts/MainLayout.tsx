import React from 'react';
import NavigationBar from '../components/NavigationBar';
import Footer from '../components/Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* 预留底部 Footer + NavigationBar 的高度 */}
      {children}
      <Footer />
      <NavigationBar />
    </div>
  );
};

export default MainLayout;
