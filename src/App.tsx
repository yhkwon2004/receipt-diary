import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import HomeScreen from './components/HomeScreen';
import ProjectScreen from './components/ProjectScreen';
import SettingsScreen from './components/SettingsScreen';
import AuthScreen from './components/AuthScreen';
import SupabaseSetupModal from './components/SupabaseSetupModal';
import { isSupabaseConfigured, getSupabase } from './utils/supabase';
import './App.css';

// ==================== 앱 배포 URL ====================
const APP_URL = 'https://yhkwon2004.github.io/receipt-diary/';

// ==================== Magic Link 해시 처리 ====================
// 이메일 링크 클릭 시 URL에 #access_token=... 또는 ?code=... 형태로 들어옴
// Supabase SDK가 detectSessionInUrl:true 로 자동 처리하지만
// GitHub Pages 환경에서 추가 보장 처리
const handleMagicLinkHash = async (): Promise<boolean> => {
  const hash = window.location.hash;
  const search = window.location.search;

  // access_token 또는 error 파라미터가 있으면 매직링크 콜백
  const hasToken =
    hash.includes('access_token') ||
    search.includes('access_token') ||
    hash.includes('code=') ||
    search.includes('code=');

  if (!hasToken) return false;

  const sb = getSupabase();
  if (!sb) return false;

  // 최대 4초 대기하며 세션 확인 (SDK가 자동 처리)
  for (let i = 0; i < 8; i++) {
    await new Promise(r => setTimeout(r, 500));
    const { data } = await sb.auth.getSession();
    if (data.session) {
      // 세션 확인 → 해시/쿼리 제거 (깔끔한 URL)
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
  }

  // 세션을 못 받은 경우 URL만 정리
  window.history.replaceState({}, document.title, window.location.pathname);
  return false;
};

// ==================== 앱 라우터 ====================
const AppRouter: React.FC = () => {
  const { state, currentUser, isLoading } = useApp();
  const [showSetup, setShowSetup] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(isSupabaseConfigured());
  const [magicLinkProcessing, setMagicLinkProcessing] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState('');

  // 오프라인 모드 상태
  const [isOfflineMode, setIsOfflineMode] = useState(
    localStorage.getItem('offline_mode') === 'true'
  );

  // 앱 진입 시 매직링크 해시 처리
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const hasCallback =
      hash.includes('access_token') ||
      hash.includes('error_description') ||
      search.includes('access_token') ||
      search.includes('code=') ||
      search.includes('error_description');

    if (hasCallback) {
      setMagicLinkProcessing(true);

      // 에러 케이스
      const params = new URLSearchParams(
        hash.includes('error') ? hash.replace('#', '') : search
      );
      const errDesc = params.get('error_description');
      if (errDesc) {
        const decoded = decodeURIComponent(errDesc).replace(/\+/g, ' ');
        setMagicLinkError(decoded);
        window.history.replaceState({}, document.title, window.location.pathname);
        setMagicLinkProcessing(false);
        return;
      }

      handleMagicLinkHash().then(success => {
        if (!success) {
          setMagicLinkError(
            '로그인 링크가 만료되었거나 이미 사용되었습니다. 새 링크를 요청해주세요.\n\n' +
            '방화벽/프록시 문제라면 오프라인 모드를 사용하거나, ' +
            '모바일 데이터로 전환 후 다시 시도해주세요.'
          );
        }
      }).finally(() => {
        setMagicLinkProcessing(false);
      });
    }

    setSupabaseReady(isSupabaseConfigured());
    setIsOfflineMode(localStorage.getItem('offline_mode') === 'true');
  }, []);

  // 매직링크 처리 중 로딩
  if (magicLinkProcessing) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>로그인 처리 중...</p>
        <p className="loading-sub">잠시만 기다려주세요</p>
      </div>
    );
  }

  // 앱 데이터 로딩
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>불러오는 중...</p>
      </div>
    );
  }

  // ── 오프라인 모드: 바로 앱 진입 ──
  if (isOfflineMode) {
    return (
      <>
        {state.activeView === 'home' && <HomeScreen />}
        {state.activeView === 'project' && <ProjectScreen />}
        {state.activeView === 'settings' && <SettingsScreen />}
      </>
    );
  }

  // ── Supabase 설정됐는데 로그인 안 된 상태 ──
  if (supabaseReady && !currentUser) {
    return (
      <>
        <AuthScreen
          onSetupSupabase={() => setShowSetup(true)}
          magicLinkError={magicLinkError}
          onClearError={() => setMagicLinkError('')}
        />
        {showSetup && (
          <SupabaseSetupModal
            onClose={() => setShowSetup(false)}
            onConfigured={() => {
              setSupabaseReady(true);
              setShowSetup(false);
              window.location.reload();
            }}
            onOfflineMode={() => {
              setShowSetup(false);
              setIsOfflineMode(true);
              setSupabaseReady(false);
              window.location.reload();
            }}
          />
        )}
      </>
    );
  }

  // ── Supabase 미설정 또는 로그인된 상태: 앱 진입 ──
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
          onOfflineMode={() => {
            setShowSetup(false);
            setIsOfflineMode(true);
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
