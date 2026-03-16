<div align="center">

# 🧾 영수증 다이어리

**AI가 영수증을 읽어주는 스마트 지출 관리 앱**

[![배포 상태](https://img.shields.io/badge/배포-GitHub%20Pages-222222?logo=github)](https://yhkwon2004.github.io/receipt-diary/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-DB%20%2B%20Auth-3ECF8E?logo=supabase)](https://supabase.com/)
[![라이선스](https://img.shields.io/badge/License-MIT-green)](LICENSE)

<br/>

**🌐 [지금 바로 사용하기 → https://yhkwon2004.github.io/receipt-diary/](https://yhkwon2004.github.io/receipt-diary/)**

<br/>

> 영수증 사진 한 장으로 항목·금액을 자동 정리하고,  
> 프로젝트별 예산을 다이어리처럼 손쉽게 관리하세요.

</div>

---

## 📌 목차

1. [주요 기능](#-주요-기능)
2. [앱 구동 방식](#-앱-구동-방식)
3. [화면 구성 및 사용법](#-화면-구성-및-사용법)
4. [영수증 AI 분석 원리](#-영수증-ai-분석-원리)
5. [데이터 저장 구조](#-데이터-저장-구조)
6. [설치 및 로컬 실행](#-설치-및-로컬-실행)
7. [Supabase 연동 설정](#-supabase-연동-설정)
8. [AI API 설정](#-ai-api-설정)
9. [엑셀·CSV 파일 가져오기](#-엑셀csv-파일-가져오기)
10. [예산 규칙 및 경고 시스템](#-예산-규칙-및-경고-시스템)
11. [프로젝트 구조](#-프로젝트-구조)
12. [기술 스택](#-기술-스택)
13. [FAQ](#-faq)

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 📷 **영수증 스캔** | 카메라 실시간 촬영 또는 갤러리 사진 선택 |
| 🤖 **AI 자동 분석** | GPT Vision으로 항목·수량·단가·합계 자동 추출 |
| ✏️ **직접 입력** | AI 없이 수동으로 항목 입력 가능 |
| 📁 **프로젝트 관리** | 연구비·행사비 등 용도별 독립 공간 운영 |
| 💰 **예산 대시보드** | 총 예산·사용 금액·잔여 금액 한눈에 확인 |
| ⚠️ **상한 경고** | 카테고리별 상한액 설정 시 초과 항목 자동 경고 |
| 📊 **카테고리 통계** | 식비·교통비·숙박비 등 분류별 집계 |
| 📂 **파일 가져오기** | 엑셀(.xlsx/.xls)·CSV에서 표 구조 자동 등록 |
| 🔐 **이메일 로그인** | 비밀번호 없는 매직 링크(Magic Link) 인증 |
| ☁️ **클라우드 동기화** | Supabase 연동 시 모든 기기에서 데이터 공유 |
| 📱 **PWA 지원** | 홈 화면에 추가하여 앱처럼 사용 |
| 💾 **로컬 모드** | Supabase 없이 브라우저 로컬 스토리지로 즉시 사용 |

---

## 🔄 앱 구동 방식

### 전체 흐름도

```
사용자 접속
    │
    ▼
┌─────────────────────────────────────┐
│  Supabase 설정 여부 확인             │
│  (localStorage의 sb_url 키)          │
└─────────────┬───────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
    ▼                    ▼
[설정됨]           [미설정 / 로컬 모드]
이메일 로그인           홈 화면 바로 진입
    │                    │
    ▼                    ▼
매직 링크 이메일    브라우저 localStorage
    │               데이터 사용
    ▼
Supabase 세션 생성
    │
    ▼
홈 화면 진입 (프로젝트 목록)
    │
    ├── 프로젝트 선택 ──→ 프로젝트 상세
    │                       │
    │                       ├── 영수증 추가 버튼
    │                       │       │
    │                       │   ┌───┴───────────────┐
    │                       │   │  영수증 입력 방식  │
    │                       │   ├───────────────────┤
    │                       │   │ 1) 카메라 촬영     │
    │                       │   │ 2) 갤러리 선택     │
    │                       │   │ 3) 직접 입력       │
    │                       │   └───────────────────┘
    │                       │           │
    │                       │       [이미지 선택 시]
    │                       │           │
    │                       │           ▼
    │                       │    GPT Vision API 호출
    │                       │    (Base64 인코딩 전송)
    │                       │           │
    │                       │           ▼
    │                       │    JSON 파싱 & 항목 추출
    │                       │    (품목/수량/단가/합계/카테고리)
    │                       │           │
    │                       │           ▼
    │                       │    예산 규칙 위반 검사
    │                       │    (카테고리별 상한 비교)
    │                       │           │
    │                       │           ▼
    │                       │    결과 편집 화면
    │                       │    (수정/삭제/추가 가능)
    │                       │           │
    │                       │           ▼
    │                       │    저장 (DB or localStorage)
    │                       │
    │                       ├── 예산 현황 표시
    │                       │   ├── 잔여 금액 (굵게)
    │                       │   ├── -사용 금액 (파란색)
    │                       │   └── 총 예산 (토글 숨김)
    │                       │
    │                       └── 카테고리 통계 차트
    │
    └── 설정 ──→ API 키, DB 연결, 로그아웃
```

### 인증 흐름 (Supabase Magic Link)

```
① 사용자가 이메일 입력
         │
         ▼
② Supabase signInWithOtp() 호출
         │
         ▼
③ Supabase → 사용자 이메일로 링크 발송
   (링크 예시: https://yhkwon2004.github.io/receipt-diary/#access_token=...)
         │
         ▼
④ 사용자가 이메일의 링크 클릭
         │
         ▼
⑤ 앱이 URL 해시의 access_token 자동 감지
   (Supabase SDK가 detectSessionInUrl: true 옵션으로 처리)
         │
         ▼
⑥ 세션 생성 & 홈 화면 진입
         │
         ▼
⑦ onAuthStateChange 이벤트 발생
   → 해당 사용자의 프로젝트/영수증 데이터 로드
```

### 데이터 저장 전략 (이중 모드)

```
┌────────────────────────────────────────────┐
│              데이터 저장 전략               │
├──────────────────┬─────────────────────────┤
│   로컬 모드       │    Supabase 모드         │
│  (기본 동작)      │  (설정 후 동작)          │
├──────────────────┼─────────────────────────┤
│ localStorage에   │ PostgreSQL DB에          │
│ JSON 직렬화 저장  │ 실시간 저장              │
│                  │                         │
│ - 브라우저 종속  │ - 기기 간 동기화          │
│ - 오프라인 가능  │ - 이메일 로그인 필요      │
│ - 설정 불필요    │ - RLS로 개인정보 보호     │
│ - 약 5MB 제한    │ - 영구 저장              │
└──────────────────┴─────────────────────────┘
```

---

## 📱 화면 구성 및 사용법

### 터치 4번 이내 모든 기능 접근 원칙

> 앱의 모든 핵심 기능은 **최대 4번의 터치**로 접근할 수 있도록 설계되었습니다.

| 터치 횟수 | 도달 가능한 기능 |
|:--------:|-----------------|
| **1번** | 프로젝트 목록 확인, 전체 예산 현황 |
| **2번** | 프로젝트 상세 진입 (잔여 예산, 영수증 목록) |
| **3번** | 영수증 추가 스캐너 실행 |
| **4번** | AI 분석 완료 후 저장 |

---

### 🏠 홈 화면

```
┌─────────────────────────┐
│ 🧾 영수증 다이어리       ⚙│  ← 앱 제목 + 설정 버튼
│ user@email.com · 3개    │
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │ 🔺 전체 예산 현황  │  │  ← 보라색 요약 카드
│  │  잔여 3,200,000원  │  │    (총예산 합산)
│  │  -1,800,000 사용  │  │
│  │  ████████░░ 56%   │  │
│  └───────────────────┘  │
│                          │
│  프로젝트          +새로 │  ← 섹션 헤더
│  ┌───────────────────┐  │
│  │ 📊 2024 연구비    │>│  │  ← 프로젝트 카드
│  │ 잔여 1,200,000원  │  │
│  │ -300,000 사용    │  │
│  │ ██░░░░░░ 20%     │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 💼 출장비          │>│  │
│  │ ⚠️ 상한 초과 1건   │  │  ← 경고 배지
│  └───────────────────┘  │
└─────────────────────────┘
```

---

### 📁 프로젝트 상세 화면

```
┌─────────────────────────┐
│ ← 📊 2024 연구비      ⚙│  ← 프로젝트 색상 그라디언트 헤더
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │ 잔여               │  │  ← 예산 카드
│  │ 1,200,000원        │  │    (프로젝트 색상)
│  │ - 300,000          │  │    파란색 사용금액
│  │ 총 예산 보기 ▶     │  │  ← 토글 버튼 (원금 숨김)
│  │ ████░░░░ 20.0%    │  │
│  │ ⚠️ 상한 초과 1건   │  │
│  └───────────────────┘  │
│  [카테고리 통계 ▼]       │
│  ─────────────────────  │
│  전체카테고리▼  최신순▼  │  ← 필터 + [영수증 추가] 버튼
│  ┌───────────────────┐  │
│  │ 2024.03.15        │  │  ← 영수증 카드 (접힘)
│  │ 스타벅스    3건   │  │
│  │        -15,000 ▶  │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 2024.03.14  ⚠️    │  │  ← 경고 영수증
│  │ 출장 숙박비  1건  │  │
│  │       -180,000 ▼  │  │  ← 펼쳐진 상태
│  ├───────────────────┤  │
│  │ 품목  수량 단가 합계│  │  ← 상세 테이블
│  │ 숙박⚠️ 1 180,000   │  │
│  │       상한 초과    │  │
│  │ 합계: 180,000      │  │
│  │          [🗑 삭제] │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

---

### 📷 영수증 스캐너

**STEP 1 — 입력 방법 선택**
```
┌─────────────────────────┐
│ 영수증 스캔           ✕ │
├─────────────────────────┤
│  ┌──────┐  ┌──────┐    │
│  │  📷  │  │  🖼  │    │
│  │카메라│  │갤러리│    │
│  │촬영  │  │선택  │    │
│  └──────┘  └──────┘    │
│                          │
│    [ 직접 입력하기 ]      │
└─────────────────────────┘
```

**STEP 2 — AI 분석 (이미지 선택 시)**
```
┌─────────────────────────┐
│  [영수증 이미지 미리보기] │
│                          │
│  [ 다시 찍기 ] [AI 분석] │ ← "AI 분석" 클릭 시
└─────────────────────────┘   GPT Vision 호출 (2~5초)
```

**STEP 3 — 결과 편집 및 저장**
```
┌─────────────────────────┐
│ 가게명: [스타벅스      ] │  ← 편집 가능
│ 날짜:  [2024-03-15    ] │
├─────────────────────────┤
│ 품목    수량  단가  합계  │
│ 아메리카노 2 3,000 6,000 │  ← 각 셀 직접 수정 가능
│ 케이크  1  9,000  9,000  │
│ ⚠️ 식비 상한(10,000) 초과│  ← 자동 경고
│ + 항목 추가              │
├─────────────────────────┤
│ 총 합계           15,000 │
├─────────────────────────┤
│    [취소]      [저장하기]│
└─────────────────────────┘
```

---

### ➕ 새 프로젝트 만들기 (3단계 위저드)

**1단계 — 기본 정보**
- 프로젝트 아이콘 선택 (20가지 이모지)
- 색상 선택 (10가지 컬러 팔레트)
- 프로젝트명 입력
- 설명 입력 (선택)
- 총 예산 입력

**2단계 — 예산 규칙**
- 카테고리별 상한 금액 설정
- 예시: `식비 → 50,000원 이하`, `숙박비 → 150,000원 이하`
- 전체 항목에 적용되는 공통 규칙도 설정 가능

**3단계 — 표 구조 설정**
- 엑셀/CSV 파일에서 열 구조 자동 가져오기
- 직접 열 추가/삭제/이름 변경
- 열 타입 지정: 텍스트 / 숫자 / 날짜 / 카테고리

---

## 🤖 영수증 AI 분석 원리

### 처리 과정

```
① 이미지 파일 선택
         │
         ▼
② FileReader API로 Base64 인코딩
   (data:image/jpeg;base64,/9j/4AAQ...)
         │
         ▼
③ OpenAI Chat Completions API 호출
   - 모델: gpt-5 (Vision 지원)
   - content: [image_url 블록] + [텍스트 프롬프트]
         │
         ▼
④ 프롬프트 내용:
   "이 영수증을 분석하여 다음 JSON 형식으로 반환:
    { storeName, date, items:[{name,quantity,unitPrice,totalPrice,category}], totalAmount }"
         │
         ▼
⑤ 응답 JSON 파싱
   (코드블록 제거 후 JSON.parse)
         │
         ▼
⑥ 카테고리 자동 분류
   (식비·교통비·숙박비 등 9개 카테고리 중 선택)
         │
         ▼
⑦ 예산 규칙 위반 검사
   (각 항목의 totalPrice vs 카테고리 상한액)
         │
         ▼
⑧ 결과 화면 표시 (수정 가능)
```

### 지원 카테고리

| 카테고리 | 예시 품목 |
|---------|---------|
| 식비 | 식사, 카페, 편의점 |
| 교통비 | 택시, KTX, 항공권 |
| 숙박비 | 호텔, 펜션, 에어비앤비 |
| 업무비 | 문구, 인쇄, 소프트웨어 |
| 재료비 | 실험재료, 소모품 |
| 인건비 | 외주, 알바 |
| 장비비 | 기기 구매, 렌탈 |
| 통신비 | 인터넷, 전화 |
| 기타 | 분류 불가 항목 |

---

## 🗄️ 데이터 저장 구조

### Supabase DB 테이블

#### `projects` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | 프로젝트 고유 ID (PK) |
| `user_id` | uuid | 소유자 (auth.users FK) |
| `name` | text | 프로젝트명 |
| `description` | text | 설명 |
| `total_budget` | bigint | 총 예산 (원 단위 정수) |
| `color` | text | 카드 색상 (#hex) |
| `icon` | text | 이모지 아이콘 |
| `show_budget` | boolean | 총 예산 표시 토글 상태 |
| `budget_rules` | jsonb | 예산 규칙 배열 |
| `table_columns` | jsonb | 커스텀 열 구조 배열 |
| `created_at` | timestamptz | 생성 시각 |
| `updated_at` | timestamptz | 수정 시각 (트리거 자동 갱신) |

#### `receipts` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | 영수증 고유 ID (PK) |
| `project_id` | uuid | 소속 프로젝트 (FK) |
| `user_id` | uuid | 소유자 (auth.users FK) |
| `store_name` | text | 가게명 |
| `date` | date | 영수증 날짜 |
| `total_amount` | bigint | 총 금액 |
| `image_url` | text | 원본 이미지 URL (선택) |
| `items` | jsonb | 영수증 항목 배열 |
| `created_at` | timestamptz | 등록 시각 |

#### `items` JSONB 배열 구조

```json
[
  {
    "id": "abc123",
    "name": "아메리카노",
    "quantity": 2,
    "unitPrice": 3000,
    "totalPrice": 6000,
    "category": "식비",
    "warning": false,
    "warningMessage": ""
  },
  {
    "id": "def456",
    "name": "숙박비",
    "quantity": 1,
    "unitPrice": 180000,
    "totalPrice": 180000,
    "category": "숙박비",
    "warning": true,
    "warningMessage": "숙박비 상한(150,000원) 초과"
  }
]
```

### Row Level Security (RLS)

모든 테이블에 RLS가 활성화되어 있어 **본인의 데이터만 조회·수정·삭제**할 수 있습니다.

```sql
-- 예시: projects 테이블 RLS 정책
create policy "users_own_projects" on projects
  for all using (auth.uid() = user_id);
```

---

## 💻 설치 및 로컬 실행

### 요구 사항

- **Node.js** 18 이상
- **npm** 9 이상 (또는 yarn)
- (선택) Supabase 계정
- (선택) OpenAI 호환 API 키

### 설치 과정

```bash
# 1. 저장소 클론
git clone https://github.com/yhkwon2004/receipt-diary.git
cd receipt-diary

# 2. 패키지 설치
npm install

# 3. 환경변수 설정 (선택)
cp .env.example .env.local
# .env.local 파일을 편집하여 아래 값 입력

# 4. 개발 서버 실행
npm start
# → http://localhost:3000 에서 확인
```

### 환경변수 목록 (`.env.local`)

```env
# ── Supabase 설정 (선택: 없으면 로컬 모드) ──
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── AI 분석 API 설정 (선택: 없으면 직접 입력 모드) ──
REACT_APP_OPENAI_BASE_URL=https://www.genspark.ai/api/llm_proxy/v1
REACT_APP_OPENAI_API_KEY=sk-...
```

> **참고**: 환경변수 없이도 앱은 정상 동작합니다.  
> Supabase 미설정 시 → 브라우저 로컬 저장소 사용  
> API 키 미설정 시 → AI 분석 비활성화, 직접 입력만 가능

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 빌드 결과물 로컬 서빙 (테스트용)
npx serve -s build

# GitHub Pages 배포
npm run deploy
```

---

## 🔐 Supabase 연동 설정

클라우드 저장 및 이메일 로그인 기능을 사용하려면 Supabase 프로젝트를 연결해야 합니다.

### Step 1. Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com) 접속 후 무료 계정 생성
2. **New Project** 클릭
3. 프로젝트 이름 입력, 데이터베이스 비밀번호 설정, 지역 선택 (`Northeast Asia (Seoul)` 권장)
4. **Create new project** 클릭 (약 1~2분 소요)

### Step 2. DB 스키마 실행

1. Supabase 대시보드 → **SQL Editor** 클릭
2. **New query** 클릭
3. 아래 SQL을 복사하여 붙여넣기 후 **Run** 실행

```sql
-- 확장 활성화
create extension if not exists "uuid-ossp";

-- projects 테이블
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

-- receipts 테이블
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

-- RLS 활성화
alter table projects enable row level security;
alter table receipts enable row level security;

-- RLS 정책
create policy "users_own_projects" on projects
  for all using (auth.uid() = user_id);

create policy "users_own_receipts" on receipts
  for all using (auth.uid() = user_id);

-- updated_at 자동 트리거
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

-- 인덱스
create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_receipts_project_id on receipts(project_id);
create index if not exists idx_receipts_user_id on receipts(user_id);
create index if not exists idx_receipts_date on receipts(date desc);
```

### Step 3. Magic Link 리다이렉트 URL 설정

이메일로 받은 링크를 클릭했을 때 앱으로 돌아오려면 반드시 설정해야 합니다.

1. Supabase 대시보드 → **Authentication** → **URL Configuration**
2. **Site URL** 항목에 아래 URL 입력:
   ```
   https://yhkwon2004.github.io/receipt-diary/
   ```
   (직접 배포한 경우 자신의 URL 입력)
3. **Redirect URLs** 항목에도 동일하게 추가
4. **Save** 클릭

### Step 4. API 키 확인

1. Supabase 대시보드 → **Project Settings** → **API**
2. 다음 두 값을 복사:
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **anon / public 키**: `eyJhbGciOiJIUzI1...`

### Step 5. 앱에 연결

**방법 A — 앱 내 설정 (권장)**
1. 앱 접속 → 우측 하단 **"서버 설정"** 버튼 클릭
2. Project URL, Anon Key 입력 후 **저장 및 연결**
3. 페이지 자동 새로고침 후 이메일 로그인 화면 표시

**방법 B — 환경변수 (.env.local)**
```env
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
```

---

## 🤖 AI API 설정

AI 영수증 분석 기능은 **OpenAI 호환 Vision API**를 사용합니다.

### 지원 API

| 서비스 | Base URL | 비고 |
|--------|----------|------|
| GenSpark AI | `https://www.genspark.ai/api/llm_proxy/v1` | 기본값 |
| OpenAI 공식 | `https://api.openai.com/v1` | gpt-4o 사용 가능 |
| Azure OpenAI | `https://{resource}.openai.azure.com/openai` | 기업용 |

### 설정 방법

1. 앱 → 우측 상단 ⚙️ **설정** 클릭
2. **AI 영수증 분석** 섹션
3. **API Key** 입력: `sk-...` 또는 `gsk-...`
4. **Base URL** 확인 (기본값 유지 또는 변경)
5. **저장** 클릭

### API 키 없이 사용하기

API 키 없이도 **직접 입력 모드**로 영수증을 관리할 수 있습니다:
- 영수증 추가 → **"직접 입력하기"** 선택
- 품목명, 수량, 단가를 수동으로 입력

---

## 📂 엑셀·CSV 파일 가져오기

프로젝트 생성 시 기존 엑셀/CSV 파일의 **열 구조**를 자동으로 가져올 수 있습니다.

### 지원 형식

| 형식 | 확장자 | 비고 |
|------|--------|------|
| Excel | `.xlsx`, `.xls` | 첫 번째 시트의 첫 행을 헤더로 인식 |
| CSV | `.csv` | UTF-8 인코딩 권장 |

### 사용 방법

1. 새 프로젝트 만들기 → **3단계: 표 구조 설정**
2. **"엑셀/CSV에서 불러오기"** 버튼 클릭
3. 파일 선택 → 열 구조 자동 가져오기
4. 열 이름 수정, 타입 변경, 삭제/추가 가능
5. **프로젝트 만들기** 완료

### 예시 엑셀 파일 구조

| 품목명 | 수량 | 단가 | 합계 | 카테고리 | 비고 |
|--------|------|------|------|---------|------|
| 복사용지 | 5 | 8,000 | 40,000 | 재료비 | A4 |
| 볼펜 | 10 | 500 | 5,000 | 업무비 | |

> 위와 같은 헤더 행이 있는 파일을 업로드하면 열 구조가 자동으로 인식됩니다.

### 열 타입 자동 감지 규칙

| 헤더 키워드 | 자동 감지 타입 |
|------------|--------------|
| 날짜, date, 일자 | 날짜 |
| 금액, 가격, price, amount, 수량, 단가 | 숫자 |
| 분류, 카테고리, category | 카테고리 |
| 그 외 | 텍스트 |

---

## ⚠️ 예산 규칙 및 경고 시스템

### 규칙 설정

각 프로젝트마다 **카테고리별 최대 허용 금액**을 설정할 수 있습니다.

```
[설정 예시]
  전체     → 500,000원 이하 (모든 단일 항목)
  식비     → 50,000원 이하
  숙박비   → 150,000원 이하
  교통비   → 100,000원 이하
```

### 경고 표시 레벨

```
영수증 항목 수준:
  해당 항목 행 → 노란 배경
  항목 아래    → ⚠️ "숙박비 상한(150,000원) 초과" 메시지

영수증 카드 수준:
  카드 헤더    → ⚠️ 아이콘 표시
  카드 테두리  → 노란 색상

프로젝트 카드 수준:
  홈 화면     → "⚠️ 상한 초과 항목" 배지
  프로젝트 상세 → 경고 건수 합산 표시
```

### 규칙 관리

- **추가**: 프로젝트 ⚙️ → 예산 규칙 탭 → 카테고리 + 금액 입력 후 + 클릭
- **삭제**: 규칙 항목 오른쪽 🗑️ 아이콘 클릭
- **수정**: 삭제 후 재등록

---

## 📁 프로젝트 구조

```
receipt-manager/
├── public/
│   ├── index.html          # PWA 메타태그, SPA 리다이렉트 스크립트
│   ├── 404.html            # GitHub Pages SPA 라우팅 처리
│   └── manifest.json       # PWA 앱 매니페스트
│
├── src/
│   ├── App.tsx             # 앱 진입점, 뷰 라우터, 인증 분기
│   ├── App.css             # 전체 스타일시트 (CSS 변수 기반)
│   │
│   ├── types/
│   │   └── index.ts        # 타입 정의 (Project, Receipt, ReceiptItem 등)
│   │
│   ├── store/
│   │   └── AppContext.tsx   # 전역 상태 관리 (React Context + useReducer)
│   │
│   ├── utils/
│   │   ├── supabase.ts     # Supabase 클라이언트 초기화 (싱글톤)
│   │   ├── database.ts     # DB CRUD 함수 (Supabase + 로컬 모드 추상화)
│   │   ├── openai.ts       # AI 영수증 분석 (Vision API 호출)
│   │   ├── fileParser.ts   # 엑셀/CSV 파일 파싱 (xlsx 라이브러리)
│   │   └── helpers.ts      # 유틸 함수 (날짜·금액 포맷, ID 생성 등)
│   │
│   └── components/
│       ├── AuthScreen.tsx          # 이메일 로그인 화면 (Magic Link)
│       ├── SupabaseSetupModal.tsx  # Supabase 연결 설정 모달
│       ├── HomeScreen.tsx          # 홈: 프로젝트 목록 + 전체 예산 요약
│       ├── ProjectScreen.tsx       # 프로젝트 상세 + 영수증 목록
│       ├── NewProjectModal.tsx     # 새 프로젝트 3단계 위저드
│       ├── ProjectSettingsModal.tsx# 프로젝트 설정·삭제·예산 규칙 관리
│       ├── ReceiptScanner.tsx      # 영수증 스캔 (카메라/갤러리/AI 분석)
│       ├── ReceiptCard.tsx         # 영수증 카드 (접기·펼치기·삭제)
│       ├── BudgetDisplay.tsx       # 예산 표시 (토글·프로그레스바)
│       └── SettingsScreen.tsx      # 앱 설정 (API 키·DB 연결·로그아웃)
│
├── supabase_schema.sql     # DB 초기화 SQL (Supabase SQL Editor에서 실행)
├── package.json            # 의존성 및 배포 스크립트
└── README.md               # 이 문서
```

---

## 🛠️ 기술 스택

### 프론트엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19 | UI 컴포넌트 프레임워크 |
| TypeScript | 4.9 | 타입 안전성 |
| React Context API | — | 전역 상태 관리 |
| Lucide React | 0.577 | 아이콘 라이브러리 |

### 백엔드 & 인증

| 기술 | 용도 |
|------|------|
| Supabase | PostgreSQL DB + Magic Link 인증 |
| Row Level Security | 사용자별 데이터 격리 |
| Supabase Realtime | 향후 실시간 동기화 지원 예정 |

### AI & 파일 처리

| 기술 | 용도 |
|------|------|
| OpenAI SDK (`openai`) | Vision API 영수증 OCR |
| SheetJS (`xlsx`) | 엑셀/CSV 파싱 |

### 배포

| 기술 | 용도 |
|------|------|
| GitHub Pages | 정적 웹 호스팅 (무료) |
| gh-pages | 자동 배포 npm 스크립트 |
| PWA (manifest.json) | 모바일 앱처럼 설치 가능 |

---

## ❓ FAQ

<details>
<summary><strong>Q. 처음 접속하면 로그인 화면이 안 나오고 바로 앱이 열립니다. 왜인가요?</strong></summary>

**A.** Supabase가 연결되지 않은 **로컬 모드**이기 때문입니다.  
로컬 모드에서는 이메일 로그인 없이 브라우저 localStorage에 데이터가 저장됩니다.  
이메일 로그인과 클라우드 동기화를 원하시면 [Supabase 연동 설정](#-supabase-연동-설정) 가이드를 따라 설정해주세요.

</details>

<details>
<summary><strong>Q. 매직 링크 이메일이 오지 않아요.</strong></summary>

**A.** 다음 사항을 확인해주세요:
1. **스팸 폴더** 확인 (Supabase 이메일이 스팸으로 분류될 수 있음)
2. Supabase 대시보드 → Authentication → **Logs** 에서 이메일 발송 내역 확인
3. Supabase의 무료 플랜은 **시간당 3회** 이메일 발송 제한이 있습니다
4. Site URL 설정이 올바른지 확인 ([Step 3](#step-3-magic-link-리다이렉트-url-설정) 참고)

</details>

<details>
<summary><strong>Q. AI 분석이 실패했다고 나옵니다.</strong></summary>

**A.** 다음을 확인해주세요:
1. 설정 화면에서 **API Key**가 올바르게 입력되었는지 확인
2. 이미지가 **선명하고 영수증 전체**가 보이는지 확인
3. 이미지 파일 크기가 **20MB 이하**인지 확인
4. API 키 없이 사용하려면 **"직접 입력하기"** 버튼을 사용하세요

</details>

<details>
<summary><strong>Q. 엑셀 파일을 가져오면 열이 이상하게 인식됩니다.</strong></summary>

**A.** 엑셀 파일의 **첫 번째 행**이 헤더(열 이름)여야 합니다.  
병합 셀이 있는 경우 정확히 인식되지 않을 수 있습니다.  
CSV 형식으로 저장 후 가져오기를 시도해보세요.

</details>

<details>
<summary><strong>Q. 데이터가 갑자기 사라졌습니다.</strong></summary>

**A.** 로컬 모드를 사용 중이라면 브라우저의 **사이트 데이터 초기화** 시 데이터가 삭제됩니다.  
중요한 데이터는 **Supabase를 연동**하여 클라우드에 저장하는 것을 권장합니다.  
또는 크롬의 경우 개발자 도구 → Application → Local Storage → `receipt_manager_data` 키를 백업하세요.

</details>

<details>
<summary><strong>Q. 여러 명이 같은 프로젝트를 공유할 수 있나요?</strong></summary>

**A.** 현재 버전은 **개인 전용**입니다. RLS 정책으로 본인 데이터만 접근 가능합니다.  
팀 공유 기능은 향후 업데이트에서 지원 예정입니다.

</details>

<details>
<summary><strong>Q. 모바일에서 카메라가 바로 실행되지 않습니다.</strong></summary>

**A.** 브라우저의 **카메라 권한**을 허용해야 합니다.  
Safari(iOS): 설정 → Safari → 카메라 → 허용  
Chrome(Android): 주소창 왼쪽 🔒 → 권한 → 카메라 → 허용

</details>

<details>
<summary><strong>Q. 홈 화면에 앱 아이콘을 추가하고 싶습니다.</strong></summary>

**A.** 브라우저 메뉴에서 **"홈 화면에 추가"** 를 선택하면 앱처럼 설치할 수 있습니다.  
iOS Safari: 하단 공유 버튼 → 홈 화면에 추가  
Android Chrome: 주소창 우측 ⋮ → 홈 화면에 추가

</details>

---

## 📄 라이선스

MIT License — 자유롭게 사용, 수정, 배포 가능합니다.

---

<div align="center">

**🌐 [https://yhkwon2004.github.io/receipt-diary/](https://yhkwon2004.github.io/receipt-diary/)**

Made with ❤️ using React + Supabase + OpenAI

</div>
