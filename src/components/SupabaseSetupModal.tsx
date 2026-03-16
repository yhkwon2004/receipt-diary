import React, { useState } from 'react';
import { X, Database, CheckCircle, ExternalLink } from 'lucide-react';
import { resetSupabaseClient, isSupabaseConfigured } from '../utils/supabase';

interface SupabaseSetupModalProps {
  onClose: () => void;
  onConfigured: () => void;
}

// ==================== Supabase 설정 모달 ====================
const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ onClose, onConfigured }) => {
  const [url, setUrl] = useState(localStorage.getItem('sb_url') || '');
  const [anonKey, setAnonKey] = useState(localStorage.getItem('sb_anon_key') || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!url.trim().startsWith('https://')) {
      setError('Supabase URL은 https://로 시작해야 합니다.');
      return;
    }
    if (!anonKey.trim() || anonKey.trim().length < 20) {
      setError('올바른 anon key를 입력해주세요.');
      return;
    }
    localStorage.setItem('sb_url', url.trim());
    localStorage.setItem('sb_anon_key', anonKey.trim());
    resetSupabaseClient();
    setSaved(true);
    setTimeout(() => {
      onConfigured();
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content supabase-setup-modal">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={20} style={{ color: '#3ecf8e' }} />
            <h2>Supabase 설정</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="step-content">
          {/* 안내 */}
          <div className="setup-guide">
            <p>아래 단계를 따라 Supabase 프로젝트를 연결하세요:</p>
            <ol className="setup-steps">
              <li>
                <a href="https://supabase.com" target="_blank" rel="noreferrer">
                  supabase.com <ExternalLink size={12} />
                </a>
                에서 무료 프로젝트 생성
              </li>
              <li>Project Settings → API → Project URL 복사</li>
              <li>Project Settings → API → anon/public 키 복사</li>
              <li>
                SQL Editor에서 아래 스키마 실행:
                <button
                  className="copy-sql-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(SQL_SCHEMA);
                    alert('SQL이 클립보드에 복사되었습니다!');
                  }}
                >
                  📋 SQL 스키마 복사
                </button>
              </li>
            </ol>
          </div>

          <div className="form-group">
            <label>Project URL</label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Anon Key (public)</label>
            <input
              type="text"
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="form-input"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>취소</button>
          <button
            className={`btn-primary ${saved ? 'saved' : ''}`}
            onClick={handleSave}
          >
            {saved ? (
              <><CheckCircle size={16} /> 저장됨!</>
            ) : (
              '저장 및 연결'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const SQL_SCHEMA = `-- 영수증 다이어리 스키마
create extension if not exists "uuid-ossp";

create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  total_budget bigint default 0,
  color text default '#6366f1',
  icon text default '📁',
  show_budget boolean default true,
  budget_rules jsonb default '[]',
  table_columns jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists receipts (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  store_name text not null default '',
  date date not null default current_date,
  total_amount bigint default 0,
  image_url text,
  items jsonb default '[]',
  created_at timestamptz default now()
);

alter table projects enable row level security;
alter table receipts enable row level security;

create policy "users_own_projects" on projects for all using (auth.uid() = user_id);
create policy "users_own_receipts" on receipts for all using (auth.uid() = user_id);

create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_receipts_project_id on receipts(project_id);
create index if not exists idx_receipts_user_id on receipts(user_id);`;

export default SupabaseSetupModal;
