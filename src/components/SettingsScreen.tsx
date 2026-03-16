import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ArrowLeft, Key, Info, Database, LogOut, User } from 'lucide-react';
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

  const handleSave = () => {
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('openai_base_url', apiBase);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

        {/* DB 연결 */}
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
              <span>{dbConfigured ? 'Supabase DB' : '로컬 브라우저'}</span>
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
        />
      )}
    </div>
  );
};

export default SettingsScreen;
