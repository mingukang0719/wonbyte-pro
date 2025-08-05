# 원바이트 PRO - 통합 학습 관리 시스템 설계

## 1. 시스템 개요

### 1.1 목적
- 아동 개별 맞춤형 한국어 문해력 학습 플랫폼
- 학습 진도 추적 및 성취도 시각화
- 교사/부모를 위한 통합 관리 시스템

### 1.2 주요 사용자
- **학생**: 초등학생 ~ 중학생
- **관리자**: 교사, 부모, 학원 관리자
- **시스템 관리자**: 플랫폼 운영자

## 2. 시스템 아키텍처

### 2.1 기술 스택
```
Frontend:
├── React 18 (SPA)
├── React Router v6 (라우팅)
├── Tailwind CSS (스타일링)
├── Recharts (데이터 시각화)
├── @supabase/auth-helpers-react (인증)
└── Zustand (상태 관리)

Backend:
├── Supabase (BaaS)
│   ├── PostgreSQL (데이터베이스)
│   ├── Auth (인증/인가)
│   ├── Realtime (실시간 동기화)
│   └── Storage (파일 저장소)
├── Express.js (API 서버)
└── AI Services (OpenAI, Claude, Gemini)

Deployment:
├── Frontend: Netlify
└── Backend: Render
```

### 2.2 시스템 구성도
```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 인터페이스                       │
├─────────────────────┬───────────────────┬──────────────────┤
│    로그인/회원가입    │    학생 대시보드    │   관리자 대시보드   │
└─────────────────────┴───────────────────┴──────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                         API Gateway                          │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  인증 API     │   학습 API    │   관리 API    │   분석 API    │
└──────────────┴──────────────┴──────────────┴───────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Backend                        │
├────────────────────────┬────────────────────────────────────┤
│    Database (PostgreSQL) │         Services                  │
│    ├── users           │         ├── Auth                   │
│    ├── profiles        │         ├── Realtime               │
│    ├── learning_data   │         ├── Storage                │
│    ├── assignments     │         └── Functions              │
│    └── analytics       │                                     │
└────────────────────────┴────────────────────────────────────┘
```

## 3. 데이터베이스 설계

### 3.1 주요 테이블 구조

#### users (Supabase Auth 제공)
```sql
-- Supabase Auth가 자동 관리
-- id, email, created_at 등 기본 필드 포함
```

#### profiles (사용자 프로필)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'parent', 'admin')),
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  grade_level TEXT,
  school_name TEXT,
  parent_id UUID REFERENCES profiles(id),
  teacher_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### learning_sessions (학습 세션)
```sql
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_characters_read INT DEFAULT 0,
  total_problems_solved INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  session_type TEXT CHECK (session_type IN ('reading', 'vocabulary', 'problem_solving'))
);
```

#### reading_materials (읽기 자료)
```sql
CREATE TABLE reading_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  topic TEXT,
  character_count INT NOT NULL,
  difficulty_score JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT false
);
```

#### assignments (과제 배정)
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES reading_materials(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed'))
);
```

#### vocabulary_progress (어휘 학습 진도)
```sql
CREATE TABLE vocabulary_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  meaning TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  review_count INT DEFAULT 0,
  mastery_level INT DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  UNIQUE(user_id, word)
);
```

#### wrong_answers (오답 기록)
```sql
CREATE TABLE wrong_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES learning_sessions(id),
  question_type TEXT,
  question TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  is_mastered BOOLEAN DEFAULT false
);
```

#### learning_achievements (학습 성취)
```sql
CREATE TABLE learning_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  milestone_value INT,
  badge_url TEXT
);
```

#### daily_learning_stats (일일 학습 통계)
```sql
CREATE TABLE daily_learning_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_study_time INT DEFAULT 0, -- 분 단위
  characters_read INT DEFAULT 0,
  problems_solved INT DEFAULT 0,
  accuracy_rate DECIMAL(5,2),
  vocabulary_learned INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  UNIQUE(user_id, date)
);
```

### 3.2 Row Level Security (RLS) 정책

```sql
-- profiles 테이블 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Teachers can view their students" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT teacher_id FROM profiles WHERE id = profiles.id
    )
  );

CREATE POLICY "Parents can view their children" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT parent_id FROM profiles WHERE id = profiles.id
    )
  );

-- learning_sessions 테이블 RLS
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON learning_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student sessions" ON learning_sessions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM profiles WHERE teacher_id = auth.uid()
    )
  );
```

## 4. 주요 기능 설계

### 4.1 인증 시스템

#### 4.1.1 회원가입 플로우
```
1. 역할 선택 (학생/교사/부모)
2. 기본 정보 입력
   - 이메일
   - 비밀번호
   - 이름
   - 학생: 학년, 학교
   - 교사: 학교, 담당 학년
   - 부모: 자녀 연결 코드
3. 이메일 인증
4. 프로필 완성
```

#### 4.1.2 로그인 플로우
```
1. 이메일/비밀번호 입력
2. 역할 기반 리다이렉션
   - 학생 → 학생 대시보드
   - 교사/부모 → 관리자 대시보드
   - 시스템 관리자 → 시스템 관리 페이지
```

### 4.2 학생 대시보드

#### 4.2.1 메인 화면 구성
```
┌─────────────────────────────────────────────────────────────┐
│  오늘의 학습 목표           연속 학습일: 15일 🔥              │
├─────────────────────────────────────────────────────────────┤
│  📚 오늘 읽은 글자수        🎯 정답률           ⏱️ 학습 시간   │
│     2,348자                  87%              45분          │
├─────────────────────────────────────────────────────────────┤
│                      이번 주 학습 그래프                       │
│  [막대 그래프: 일별 읽은 글자수, 문제 풀이 수]                 │
├─────────────────────────────────────────────────────────────┤
│  📋 오늘의 과제             🏆 최근 획득 배지                 │
│  • 과학 지문 읽기          • 1만자 읽기 달성                │
│  • 어휘 복습 10개          • 연속 7일 학습                  │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.2 학습 콘텐츠 접근
- **새 지문 학습**: AI 생성 또는 교사 배정 지문
- **어휘 복습**: 스페이스드 리피티션 기반
- **오답노트**: 틀린 문제 재학습
- **나의 성취**: 배지, 레벨, 랭킹

### 4.3 관리자 대시보드

#### 4.3.1 교사용 기능
```
1. 학생 관리
   - 학생 목록 및 프로필 조회
   - 학습 진도 모니터링
   - 개별/그룹 과제 배정

2. 콘텐츠 관리
   - 지문 생성 및 편집
   - 문제 생성 및 관리
   - 난이도 조정

3. 분석 및 리포트
   - 학급 전체 성취도
   - 개별 학생 상세 리포트
   - 학습 패턴 분석
```

#### 4.3.2 부모용 기능
```
1. 자녀 학습 현황
   - 일일/주간/월간 리포트
   - 실시간 학습 알림
   - 성취도 추이

2. 학습 설정
   - 학습 시간 제한
   - 난이도 조정 요청
   - 교사와 소통
```

### 4.4 동기부여 시스템

#### 4.4.1 성취 시스템
```javascript
const achievements = {
  reading: [
    { id: 'read_1k', name: '책벌레 시작', target: 1000, badge: '🐛' },
    { id: 'read_10k', name: '독서가', target: 10000, badge: '📖' },
    { id: 'read_100k', name: '독서왕', target: 100000, badge: '👑' },
    { id: 'read_1m', name: '독서신', target: 1000000, badge: '⭐' }
  ],
  streak: [
    { id: 'streak_7', name: '일주일 개근', days: 7, badge: '🔥' },
    { id: 'streak_30', name: '한달 개근', days: 30, badge: '💎' },
    { id: 'streak_100', name: '100일 개근', days: 100, badge: '🏆' }
  ],
  accuracy: [
    { id: 'perfect_10', name: '완벽주의자', perfect: 10, badge: '💯' },
    { id: 'high_accuracy', name: '정확도 마스터', rate: 95, badge: '🎯' }
  ]
};
```

#### 4.4.2 레벨 시스템
```javascript
const levelSystem = {
  calculateLevel: (totalCharsRead) => {
    const levels = [
      { level: 1, required: 0, title: '글자 탐험가' },
      { level: 2, required: 5000, title: '문장 수집가' },
      { level: 3, required: 15000, title: '단락 마스터' },
      { level: 4, required: 30000, title: '지문 정복자' },
      { level: 5, required: 50000, title: '독서 달인' },
      // ... 최대 레벨 50까지
    ];
    return levels.find(l => totalCharsRead >= l.required);
  }
};
```

#### 4.4.3 시각적 진도 표시
```javascript
const ProgressVisualization = {
  // 읽은 글자수를 실제 책 권수로 환산
  booksRead: (chars) => Math.floor(chars / 50000), // 1권 = 5만자
  
  // 마라톤 거리로 환산
  marathonProgress: (chars) => (chars / 1000000) * 42.195, // 100만자 = 풀코스
  
  // 나무 성장 시각화
  treeGrowth: (chars) => {
    const stages = ['씨앗', '새싹', '묘목', '나무', '큰나무', '거대한나무'];
    return stages[Math.floor(chars / 200000)];
  }
};
```

## 5. API 설계

### 5.1 인증 API
```
POST   /api/auth/signup       - 회원가입
POST   /api/auth/login        - 로그인
POST   /api/auth/logout       - 로그아웃
GET    /api/auth/me           - 현재 사용자 정보
POST   /api/auth/refresh      - 토큰 갱신
```

### 5.2 학습 API
```
GET    /api/learning/materials          - 학습 자료 목록
GET    /api/learning/materials/:id      - 학습 자료 상세
POST   /api/learning/materials          - 학습 자료 생성 (관리자)
POST   /api/learning/sessions           - 학습 세션 시작
PUT    /api/learning/sessions/:id       - 학습 세션 업데이트
POST   /api/learning/sessions/:id/end   - 학습 세션 종료
```

### 5.3 과제 API
```
GET    /api/assignments                 - 과제 목록
POST   /api/assignments                 - 과제 생성 (관리자)
PUT    /api/assignments/:id             - 과제 수정
DELETE /api/assignments/:id             - 과제 삭제
POST   /api/assignments/:id/complete    - 과제 완료
```

### 5.4 분석 API
```
GET    /api/analytics/user/:id          - 사용자 학습 분석
GET    /api/analytics/class/:id         - 학급 전체 분석
GET    /api/analytics/progress/:userId  - 진도 상세
GET    /api/analytics/achievements      - 성취 목록
```

## 6. 보안 설계

### 6.1 인증/인가
- JWT 기반 인증 (Supabase Auth)
- 역할 기반 접근 제어 (RBAC)
- Row Level Security (RLS)
- API Rate Limiting

### 6.2 데이터 보호
- HTTPS 전송 암호화
- 민감 정보 암호화 저장
- XSS/CSRF 방어
- SQL Injection 방지

## 7. 성능 최적화

### 7.1 프론트엔드
- 코드 스플리팅
- 레이지 로딩
- 이미지 최적화
- 캐싱 전략

### 7.2 백엔드
- 데이터베이스 인덱싱
- 쿼리 최적화
- Redis 캐싱 (추후)
- CDN 활용

## 8. 확장성 고려사항

### 8.1 향후 기능
- **AI 튜터**: 개인별 맞춤 학습 추천
- **소셜 기능**: 친구와 경쟁, 그룹 학습
- **게임화**: 미니게임, 퀘스트 시스템
- **오프라인 모드**: PWA 지원
- **다국어 지원**: 영어, 중국어 등

### 8.2 기술적 확장
- 마이크로서비스 아키텍처 전환
- GraphQL API 도입
- 실시간 협업 기능
- 머신러닝 기반 난이도 조정

## 9. 구현 로드맵

### Phase 1: 기본 기능 (2주)
- [ ] Supabase 설정 및 데이터베이스 구축
- [ ] 인증 시스템 구현
- [ ] 기본 대시보드 UI
- [ ] 핵심 학습 기능

### Phase 2: 관리 기능 (2주)
- [ ] 관리자 대시보드
- [ ] 과제 시스템
- [ ] 기본 분석 기능
- [ ] 알림 시스템

### Phase 3: 동기부여 시스템 (1주)
- [ ] 성취 시스템
- [ ] 레벨/배지 시스템
- [ ] 시각화 컴포넌트
- [ ] 리더보드

### Phase 4: 고도화 (2주)
- [ ] AI 기반 추천
- [ ] 상세 분석 리포트
- [ ] 성능 최적화
- [ ] 사용성 개선

## 10. 모니터링 및 분석

### 10.1 핵심 지표 (KPIs)
- 일일 활성 사용자 (DAU)
- 평균 학습 시간
- 과제 완료율
- 학습 연속일
- 정답률 향상도

### 10.2 모니터링 도구
- Supabase Dashboard
- Google Analytics
- Sentry (에러 추적)
- Custom Analytics Dashboard