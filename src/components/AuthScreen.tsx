import React, { useState } from 'react';
import { signInWithEmail } from '../utils/database';
import { BookOpen, Mail, Loader, CheckCircle, ArrowRight, Settings, WifiOff } from 'lucide-react';

interface AuthScreenProps {
  onSetupSupabase: () => void;
  magicLinkError?: string;
  onClearError?: () => void;
}

// ==================== 로그인 화면 ====================
const AuthScreen: React.FC<AuthScreenProps> = ({ onSetupSupabase, magicLinkError, onClearError }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(magicLinkError || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('올바른 이메일 주소를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await signInWithEmail(email.trim());
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSent(true);
    }
  };

  const handleOfflineMode = () => {
    if (window.confirm(
      '오프라인 모드를 사용하시겠습니까?\n\n' +
      '• 데이터가 이 기기의 브라우저에만 저장됩니다.\n' +
      '• 이메일 로그인 없이 바로 사용할 수 있습니다.\n' +
      '• 설정에서 언제든지 온라인 모드로 전환할 수 있습니다.'
    )) {
      localStorage.removeItem('sb_url');
      localStorage.removeItem('sb_anon_key');
      localStorage.setItem('offline_mode', 'true');
      window.location.reload();
    }
  };

  return (
    <div className="auth-screen">
      {/* 배경 장식 */}
      <div className="auth-bg-circle auth-bg-circle-1" />
      <div className="auth-bg-circle auth-bg-circle-2" />

      {/* 로고 */}
      <div className="auth-logo">
        <div className="auth-logo-icon">
          <BookOpen size={32} />
        </div>
        <h1 className="auth-logo-title">영수증 다이어리</h1>
        <p className="auth-logo-sub">스마트 지출 관리</p>
      </div>

      {/* 카드 */}
      <div className="auth-card">
        {!sent ? (
          <>
            <h2 className="auth-card-title">로그인 / 회원가입</h2>
            <p className="auth-card-desc">
              이메일 주소를 입력하면<br />
              <strong>매직 링크</strong>를 보내드립니다.<br />
              별도 비밀번호가 필요 없어요 ✨
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-wrap">
                <Mail size={18} className="auth-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (error && onClearError) onClearError();
                  }}
                  placeholder="your@email.com"
                  className="auth-input"
                  autoComplete="email"
                  inputMode="email"
                  disabled={loading}
                />
              </div>

              {(error || magicLinkError) && (
                <div className="auth-error">
                  <strong>⚠️ 연결 오류</strong><br />
                  {error || magicLinkError}
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    <strong>해결 방법:</strong><br />
                    1. Supabase Site URL을 <code>https://yhkwon2004.github.io/receipt-diary/</code> 로 설정하세요<br />
                    2. 방화벽/프록시 차단 시 모바일 데이터로 전환하세요<br />
                    3. 또는 아래의 <strong>오프라인 모드</strong>를 사용하세요
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || !email.trim()}
              >
                {loading ? (
                  <>
                    <Loader size={18} className="spin" />
                    전송 중...
                  </>
                ) : (
                  <>
                    매직 링크 받기
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider" />

            <p className="auth-notice">
              링크를 클릭하면 자동으로 로그인됩니다.<br />
              처음 사용하면 자동으로 계정이 만들어져요.
            </p>

            {/* 오프라인 모드 버튼 */}
            <button className="auth-offline-btn" onClick={handleOfflineMode}>
              <WifiOff size={14} />
              로그인 없이 오프라인 모드로 사용하기
            </button>
          </>
        ) : (
          <div className="auth-sent">
            <div className="auth-sent-icon">
              <CheckCircle size={48} />
            </div>
            <h2>이메일을 확인해주세요!</h2>
            <p>
              <strong>{email}</strong>로<br />
              로그인 링크를 보냈습니다.
            </p>
            <p className="auth-sent-sub">
              링크는 10분 후 만료됩니다.<br />
              스팸 폴더도 확인해보세요.
            </p>
            {/* 앱 직접 URL 안내 */}
            <div className="auth-redirect-notice">
              <strong>⚠️ 이메일 링크가 안 열릴 경우</strong><br />
              이메일의 링크 대신 아래 URL로 직접 접속하세요:
              <br />
              <code
                style={{ cursor: 'pointer', color: '#6366f1' }}
                onClick={() => {
                  navigator.clipboard.writeText('https://yhkwon2004.github.io/receipt-diary/');
                  alert('복사됨!');
                }}
              >
                https://yhkwon2004.github.io/receipt-diary/
              </code>
            </div>
            <button
              className="auth-resend-btn"
              onClick={() => setSent(false)}
            >
              다시 보내기
            </button>
          </div>
        )}
      </div>

      {/* 설정 버튼 (Supabase URL 설정) */}
      <button className="auth-setup-btn" onClick={onSetupSupabase}>
        <Settings size={14} />
        서버 설정
      </button>
    </div>
  );
};

export default AuthScreen;
