import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ArrowLeft, Key, Info, Database, LogOut, User, WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '../utils/supabase';
import SupabaseSetupModal from './SupabaseSetupModal';

// ==================== 설정 화면 ====================
const SettingsScreen: React.FC = () => {
  const { setView, currentUser, handleSignOut } = useApp();
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [apiBase, setApiBase] = useState(
    localStorage.getItem('openai_base_url') || 'https://www.genspark.ai/api/llm_proxy/v1'
  );
  const [saved, setSaved] = useState(false);
  const [showDbSetup, setShowDbSetup] = useState(false);
  const dbConfigured = isSupabaseConfigured();

  // 오프라인 모드 상태 (localStorage로 관리)
  const [offlineMode, setOfflineMode] = useState(
    localStorage.getItem('offline_mode') === 'true'
  );

  const handleSave = () => {
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('openai_base_url', apiBase);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 오프라인 모드 토글
  const handleOfflineModeToggle = () => {
    const next = !offlineMode;
    setOfflineMode(next);
    localStorage.setItem('offline_mode', String(next));

    if (next) {
      // 오프라인 모드 활성화 시 Supabase 설정 제거
      localStorage.removeItem('sb_url');
      localStorage.removeItem('sb_anon_key');
      alert('오프라인 모드가 활성화되었습니다.\n모든 데이터가 이 기기의 브라우저에 저장됩니다.');
      window.location.reload();
    } else {
      // 온라인 모드 전환 시 Supabase 설정 안내
      alert('온라인 모드로 전환합니다.\nSupabase를 설정하면 클라우드 동기화와 이메일 로그인을 사용할 수 있습니다.');
      setShowDbSetup(true);
    }
  };

  return (
    <div className="settings-screen">
      <div className="settings-topbar">
        <button className="back-btn" onClick={() => setView('home')}>
          <ArrowLeft size={20} />
        </button>
        <h2>설정</h2>
      </div>

      <div className="settings-body">
        {/* 계정 정보 */}
        {currentUser && (
          <div className="settings-section">
            <div className="settings-section-title">
              <User size={16} />
              계정
            </div>
            <div className="app-info-row">
              <span>이메일</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{currentUser.email}</span>
            </div>
            <button className="danger-btn" style={{ marginTop: 12 }} onClick={handleSignOut}>
              <LogOut size={14} style={{ marginRight: 6 }} />
              로그아웃
            </button>
          </div>
        )}

        {/* ──────── 서버 / 오프라인 모드 ──────── */}
        <div className="settings-section">
          <div className="settings-section-title">
            {offlineMode ? <WifiOff size={16} /> : <Wifi size={16} />}
            서버 모드 설정
          </div>

          {/* 현재 모드 배지 */}
          <div className={`offline-mode-badge ${offlineMode ? 'offline' : 'online'}`}>
            {offlineMode ? (
              <>
                <WifiOff size={14} />
                <span>오프라인 모드 사용 중</span>
              </>
            ) : (
              <>
                <Wifi size={14} />
                <span>온라인 모드 사용 중</span>
              </>
            )}
          </div>

          <p className="settings-desc" style={{ margin: '8px 0 12px' }}>
            {offlineMode
              ? '모든 데이터가 이 기기의 브라우저에만 저장됩니다. 다른 기기에서는 접근할 수 없습니다.'
              : 'Supabase를 통해 클라우드에 데이터를 저장합니다. 이메일 로그인 후 어디서든 접근 가능합니다.'}
          </p>

          {/* 오프라인 모드 토글 버튼 */}
          <button
            className={`offline-toggle-btn ${offlineMode ? 'active' : ''}`}
            onClick={handleOfflineModeToggle}
          >
            {offlineMode ? (
              <>
                <Wifi size={16} />
                온라인 모드로 전환 (Supabase 연결)
              </>
            ) : (
              <>
                <WifiOff size={16} />
                오프라인 모드 사용하기
              </>
            )}
          </button>

          {/* 오프라인 모드 안내 */}
          {offlineMode && (
            <div className="offline-info-box">
              <AlertTriangle size={14} />
              <div>
                <strong>오프라인 모드 주의사항</strong>
                <ul>
                  <li>브라우저 캐시 삭제 시 데이터가 사라집니다</li>
                  <li>다른 기기에서 데이터를 볼 수 없습니다</li>
                  <li>이메일 로그인 기능을 사용할 수 없습니다</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* DB 연결 (오프라인 모드가 아닐 때만) */}
        {!offlineMode && (
          <div className="settings-section">
            <div className="settings-section-title">
              <Database size={16} />
              데이터베이스 연결
            </div>
            <div className="db-status">
              <div className={`db-dot ${dbConfigured ? 'connected' : 'disconnected'}`} />
              <span>{dbConfigured ? 'Supabase 연결됨' : '로컬 모드 (브라우저 저장)'}</span>
            </div>
            <p className="settings-desc" style={{ marginTop: 8 }}>
              {dbConfigured
                ? 'Supabase DB에 데이터가 저장됩니다. 어떤 기기에서든 접근 가능합니다.'
                : 'Supabase를 연결하면 이메일 로그인과 클라우드 동기화를 사용할 수 있습니다.'}
            </p>
            <button className="btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => setShowDbSetup(true)}>
              {dbConfigured ? 'DB 설정 변경' : 'Supabase 연결하기'}
            </button>
          </div>
        )}

        {/* 이메일 로그인 가이드 */}
        {!offlineMode && (
          <div className="settings-section">
            <div className="settings-section-title">
              <Wifi size={16} />
              이메일 로그인 연결 오류 해결
            </div>
            <div className="firewall-guide">
              <p><strong>⚠️ ERR_CONNECTION_REFUSED 오류 해결 방법</strong></p>
              <p>이메일 링크 클릭 시 "사이트에 연결할 수 없음" 오류가 발생하는 경우:</p>
              <ol>
                <li>
                  <strong>이메일의 링크를 그대로 클릭</strong>하지 마세요.<br />
                  대신, 아래 버튼으로 앱 URL을 복사해 직접 방문하세요.
                </li>
                <li>
                  Supabase 대시보드 →{' '}
                  <strong>Authentication → URL Configuration</strong>에서
                  Site URL을 <code>https://yhkwon2004.github.io/receipt-diary/</code> 로 설정
                </li>
                <li>
                  방화벽/프록시 환경이라면{' '}
                  <strong>모바일 데이터(LTE)로 전환</strong>하거나
                  VPN을 사용하세요.
                </li>
                <li>
                  그래도 안 될 경우 <strong>오프라인 모드</strong>를 사용하세요.
                </li>
              </ol>
              <button
                className="btn-secondary"
                style={{ width: '100%', marginTop: 8 }}
                onClick={() => {
                  navigator.clipboard.writeText('https://yhkwon2004.github.io/receipt-diary/');
                  alert('앱 URL이 복사되었습니다!\n브라우저 주소창에 붙여넣기 하세요.');
                }}
              >
                📋 앱 URL 복사
              </button>
            </div>
          </div>
        )}

        {/* AI API 설정 */}
        <div className="settings-section">
          <div className="settings-section-title">
            <Key size={16} />
            AI 영수증 분석 (선택)
          </div>
          <div className="settings-desc">
            OpenAI 호환 API 키를 입력하면 영수증을 AI로 자동 분석합니다.
          </div>
          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-... 또는 gsk-..."
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Base URL</label>
            <input
              type="text"
              value={apiBase}
              onChange={e => setApiBase(e.target.value)}
              className="form-input"
            />
          </div>
          <button className={`btn-primary ${saved ? 'saved' : ''}`} onClick={handleSave}>
            {saved ? '✓ 저장됨' : '저장'}
          </button>
        </div>

        {/* 앱 정보 */}
        <div className="settings-section">
          <div className="settings-section-title">
            <Info size={16} />
            앱 정보
          </div>
          <div className="app-info">
            <div className="app-info-row"><span>버전</span><span>2.0.0</span></div>
            <div className="app-info-row"><span>지원 파일</span><span>.xlsx, .xls, .csv</span></div>
            <div className="app-info-row">
              <span>데이터 저장</span>
              <span>{offlineMode ? '브라우저 (오프라인)' : dbConfigured ? 'Supabase DB' : '로컬 브라우저'}</span>
            </div>
            <div className="app-info-row">
              <span>앱 URL</span>
              <span style={{ fontSize: 11 }}>yhkwon2004.github.io/receipt-diary</span>
            </div>
          </div>
        </div>

        {/* 데이터 초기화 */}
        <div className="settings-section danger-section">
          <div className="settings-section-title danger-title">데이터 관리</div>
          <button className="danger-btn" onClick={() => {
            if (window.confirm('모든 로컬 설정을 초기화하시겠습니까?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}>
            로컬 데이터 초기화
          </button>
        </div>
      </div>

      {showDbSetup && (
        <SupabaseSetupModal
          onClose={() => setShowDbSetup(false)}
          onConfigured={() => {
            setShowDbSetup(false);
            window.location.reload();
          }}
          onOfflineMode={() => {
            setShowDbSetup(false);
            setOfflineMode(true);
            localStorage.setItem('offline_mode', 'true');
          }}
        />
      )}
    </div>
  );
};

export default SettingsScreen;
