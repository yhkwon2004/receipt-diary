-- ================================================================
-- 영수증 다이어리 - Supabase DB 스키마
-- https://supabase.com → SQL Editor 에서 실행하세요
-- ================================================================

-- 확장 활성화
create extension if not exists "uuid-ossp";

-- ── projects 테이블 ──
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

-- ── receipts 테이블 ──
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

-- ── RLS 활성화 ──
alter table projects enable row level security;
alter table receipts enable row level security;

-- ── RLS 정책 (본인 데이터만 접근) ──
drop policy if exists "users_own_projects" on projects;
create policy "users_own_projects" on projects
  for all using (auth.uid() = user_id);

drop policy if exists "users_own_receipts" on receipts;
create policy "users_own_receipts" on receipts
  for all using (auth.uid() = user_id);

-- ── updated_at 자동 업데이트 트리거 ──
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

-- ── 인덱스 ──
create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_receipts_project_id on receipts(project_id);
create index if not exists idx_receipts_user_id on receipts(user_id);
create index if not exists idx_receipts_date on receipts(date desc);

-- ================================================================
-- 완료! Authentication → Settings → Site URL을 설정하세요:
-- https://yhkwon2004.github.io/receipt-diary/
-- ================================================================
