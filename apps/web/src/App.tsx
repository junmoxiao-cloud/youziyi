import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import RoleSelect from './pages/RoleSelect';
import CareDashboard from './pages/CareDashboard';
import CompanionDashboard from './pages/CompanionDashboard';
import Profile from './pages/Profile';
import Welcome from './pages/Welcome';
import FamilyJoin from './pages/FamilyJoin';
import Onboarding from './pages/Onboarding';
import MainLayout from './layouts/MainLayout';
import { useStore } from './store';
import { hasCompletedOnboarding, hasJoinedFamily } from './routing';

const PrivateRoute: React.FC<{ children: React.ReactNode; requireOnboarding?: boolean; requireFamily?: boolean }> = ({
  children, 
  requireOnboarding = true,
  requireFamily = false
}) => {
  const { isAuthenticated, userProfile } = useStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireOnboarding && !hasCompletedOnboarding(userProfile)) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requireFamily && !hasJoinedFamily(userProfile)) {
    return <Navigate to="/family/join" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 公开路由 */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 引导流程路由 (无需家庭) */}
        <Route 
          path="/onboarding" 
          element={
            <PrivateRoute requireOnboarding={false}>
              <Onboarding />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/family/join" 
          element={
            <PrivateRoute>
              <FamilyJoin />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/role-select" 
          element={
            <PrivateRoute requireFamily>
              <RoleSelect />
            </PrivateRoute>
          } 
        />

        {/* 核心业务路由 (需要家庭和 Onboarding，带导航栏) */}
        <Route 
          path="/care" 
          element={
            <PrivateRoute requireFamily>
              <MainLayout>
                <CareDashboard />
              </MainLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/companion" 
          element={
            <PrivateRoute requireFamily>
              <MainLayout>
                <CompanionDashboard />
              </MainLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <PrivateRoute requireFamily>
              <MainLayout>
                <Profile />
              </MainLayout>
            </PrivateRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
