import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import HomeScreen from './components/HomeScreen';
import ProjectScreen from './components/ProjectScreen';
import SettingsScreen from './components/SettingsScreen';
import AuthScreen from './components/AuthScreen';
import SupabaseSetupModal from './components/SupabaseSetupModal';
import { isSupabaseConfigured } from './utils/supabase';
import { getSession } from './utils/database';
import './App.css';

// ==================== 앱 라우터 ====================
const AppRouter: React.FC = () => {
  const { state, currentUser, isLoading } = useApp();
  const [showSetup, setShowSetup] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(isSupabaseConfigured());

  // URL 해시에서 magic link 세션 처리
  useEffect(() => {
    // Supabase는 URL 해시를 자동 처리하므로 별도 처리 불필요
    // 하지만 설정 여부 체크
    setSupabaseReady(isSupabaseConfigured());
  }, []);

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>불러오는 중...</p>
      </div>
    );
  }

  // Supabase 미설정 → 인증 화면 (로컬 모드로도 사용 가능)
  if (supabaseReady && !currentUser) {
    return (
      <>
        <AuthScreen onSetupSupabase={() => setShowSetup(true)} />
        {showSetup && (
          <SupabaseSetupModal
            onClose={() => setShowSetup(false)}
            onConfigured={() => {
              setSupabaseReady(true);
              setShowSetup(false);
              window.location.reload();
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      {state.activeView === 'home' && <HomeScreen />}
      {state.activeView === 'project' && <ProjectScreen />}
      {state.activeView === 'settings' && <SettingsScreen />}

      {showSetup && (
        <SupabaseSetupModal
          onClose={() => setShowSetup(false)}
          onConfigured={() => {
            setSupabaseReady(true);
            setShowSetup(false);
            window.location.reload();
          }}
        />
      )}
    </>
  );
};

// ==================== 메인 앱 ====================
const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="app-container">
        <div className="app-frame">
          <AppRouter />
        </div>
      </div>
    </AppProvider>
  );
};

export default App;
