# 원바이트 PRO - 컴포넌트 아키텍처 설계

## 1. 컴포넌트 계층 구조

```
src/
├── components/
│   ├── auth/                    # 인증 관련 컴포넌트
│   │   ├── LoginForm.jsx
│   │   ├── SignupForm.jsx
│   │   ├── PasswordReset.jsx
│   │   └── AuthGuard.jsx
│   │
│   ├── layout/                  # 레이아웃 컴포넌트
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Footer.jsx
│   │   └── PageLayout.jsx
│   │
│   ├── dashboard/               # 대시보드 컴포넌트
│   │   ├── student/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── LearningProgress.jsx
│   │   │   ├── AchievementBadges.jsx
│   │   │   └── DailyGoals.jsx
│   │   │
│   │   └── admin/
│   │       ├── AdminDashboard.jsx
│   │       ├── StudentList.jsx
│   │       ├── ContentManager.jsx
│   │       └── AnalyticsView.jsx
│   │
│   ├── learning/                # 학습 컴포넌트
│   │   ├── ReadingSession.jsx
│   │   ├── VocabularyPractice.jsx
│   │   ├── ProblemSolving.jsx
│   │   └── AssignmentView.jsx
│   │
│   ├── analytics/               # 분석 컴포넌트
│   │   ├── ProgressChart.jsx
│   │   ├── StatisticsCard.jsx
│   │   ├── LeaderBoard.jsx
│   │   └── DetailedReport.jsx
│   │
│   └── common/                  # 공통 컴포넌트
│       ├── LoadingSpinner.jsx
│       ├── ErrorBoundary.jsx
│       ├── Modal.jsx
│       └── Toast.jsx
│
├── pages/                       # 페이지 컴포넌트
│   ├── HomePage.jsx
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── StudentDashboardPage.jsx
│   ├── AdminDashboardPage.jsx
│   ├── ProfilePage.jsx
│   └── SettingsPage.jsx
│
├── hooks/                       # 커스텀 훅
│   ├── useAuth.js
│   ├── useSupabase.js
│   ├── useLearningData.js
│   └── useAnalytics.js
│
├── contexts/                    # Context API
│   ├── AuthContext.jsx
│   ├── ThemeContext.jsx
│   └── NotificationContext.jsx
│
├── services/                    # API 서비스
│   ├── authService.js
│   ├── learningService.js
│   ├── analyticsService.js
│   └── supabaseClient.js
│
└── utils/                       # 유틸리티
    ├── constants.js
    ├── helpers.js
    └── validators.js
```

## 2. 주요 컴포넌트 상세 설계

### 2.1 인증 컴포넌트

#### LoginForm.jsx
```jsx
const LoginForm = () => {
  // 상태 관리
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // student, teacher, parent
  const [loading, setLoading] = useState(false);
  
  // 로그인 처리
  const handleLogin = async () => {
    // 1. 입력 검증
    // 2. Supabase 로그인
    // 3. 역할 기반 리다이렉션
  };
  
  return (
    <form className="login-form">
      {/* 역할 선택 */}
      <RoleSelector value={role} onChange={setRole} />
      
      {/* 로그인 폼 */}
      <input type="email" placeholder="이메일" />
      <input type="password" placeholder="비밀번호" />
      
      {/* 소셜 로그인 */}
      <SocialLoginButtons />
      
      <button type="submit">로그인</button>
    </form>
  );
};
```

#### AuthGuard.jsx
```jsx
const AuthGuard = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};
```

### 2.2 학생 대시보드 컴포넌트

#### StudentDashboard.jsx
```jsx
const StudentDashboard = () => {
  const { user } = useAuth();
  const { stats, loading } = useLearningStats(user.id);
  
  return (
    <DashboardLayout>
      {/* 오늘의 학습 현황 */}
      <TodayStats 
        charactersRead={stats.todayCharsRead}
        accuracy={stats.todayAccuracy}
        studyTime={stats.todayStudyTime}
      />
      
      {/* 연속 학습일 */}
      <StreakCounter days={stats.streakDays} />
      
      {/* 주간 학습 그래프 */}
      <WeeklyProgressChart data={stats.weeklyData} />
      
      {/* 오늘의 과제 */}
      <TodayAssignments userId={user.id} />
      
      {/* 최근 획득 배지 */}
      <RecentAchievements userId={user.id} />
      
      {/* 빠른 시작 버튼 */}
      <QuickStartButtons />
    </DashboardLayout>
  );
};
```

#### LearningProgress.jsx
```jsx
const LearningProgress = ({ userId }) => {
  const { progress } = useLearningProgress(userId);
  
  return (
    <div className="learning-progress">
      {/* 레벨 표시 */}
      <LevelIndicator 
        level={progress.level}
        experience={progress.experience}
        nextLevelExp={progress.nextLevelExp}
      />
      
      {/* 읽은 글자수 시각화 */}
      <CharacterCountVisualizer 
        total={progress.totalCharsRead}
        milestone={progress.nextMilestone}
      />
      
      {/* 진도 상세 */}
      <ProgressDetails>
        <ProgressItem 
          icon="📚" 
          label="총 읽은 책" 
          value={Math.floor(progress.totalCharsRead / 50000)}
        />
        <ProgressItem 
          icon="🏃" 
          label="마라톤 진도" 
          value={`${(progress.totalCharsRead / 1000000 * 42.195).toFixed(1)}km`}
        />
        <ProgressItem 
          icon="🌳" 
          label="나무 성장" 
          value={getTreeStage(progress.totalCharsRead)}
        />
      </ProgressDetails>
    </div>
  );
};
```

### 2.3 관리자 대시보드 컴포넌트

#### AdminDashboard.jsx
```jsx
const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('students');
  
  return (
    <AdminLayout>
      {/* 탭 네비게이션 */}
      <TabNavigation 
        tabs={['students', 'content', 'assignments', 'analytics']}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      
      {/* 탭 콘텐츠 */}
      {activeTab === 'students' && <StudentManagement />}
      {activeTab === 'content' && <ContentManagement />}
      {activeTab === 'assignments' && <AssignmentManagement />}
      {activeTab === 'analytics' && <ClassAnalytics />}
    </AdminLayout>
  );
};
```

#### StudentList.jsx
```jsx
const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filter, setFilter] = useState({ grade: 'all', status: 'all' });
  
  return (
    <div className="student-list">
      {/* 필터 옵션 */}
      <FilterBar onFilterChange={setFilter} />
      
      {/* 학생 목록 테이블 */}
      <DataTable
        columns={[
          { key: 'name', label: '이름' },
          { key: 'grade', label: '학년' },
          { key: 'lastActive', label: '마지막 활동' },
          { key: 'progress', label: '진도율', render: (val) => <ProgressBar value={val} /> },
          { key: 'accuracy', label: '정답률' }
        ]}
        data={students}
        onRowClick={setSelectedStudent}
      />
      
      {/* 학생 상세 모달 */}
      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};
```

### 2.4 학습 컴포넌트

#### ReadingSession.jsx
```jsx
const ReadingSession = ({ materialId, onComplete }) => {
  const [material, setMaterial] = useState(null);
  const [startTime] = useState(Date.now());
  const [highlightedWords, setHighlightedWords] = useState([]);
  
  const handleWordClick = (word) => {
    // 단어 클릭 시 어휘 목록에 추가
    setHighlightedWords([...highlightedWords, word]);
  };
  
  const handleComplete = async () => {
    const sessionData = {
      materialId,
      duration: Date.now() - startTime,
      charactersRead: material.content.length,
      vocabularyCollected: highlightedWords
    };
    
    await saveSession(sessionData);
    onComplete(sessionData);
  };
  
  return (
    <div className="reading-session">
      {/* 진도 표시 */}
      <ReadingProgress 
        current={scrollPosition}
        total={material?.content.length}
      />
      
      {/* 읽기 도구 */}
      <ReadingTools>
        <FontSizeControl />
        <ThemeToggle />
        <TimerDisplay startTime={startTime} />
      </ReadingTools>
      
      {/* 본문 */}
      <ReadingContent 
        content={material?.content}
        onWordClick={handleWordClick}
        highlightedWords={highlightedWords}
      />
      
      {/* 완료 버튼 */}
      <CompleteButton onClick={handleComplete} />
    </div>
  );
};
```

### 2.5 분석 컴포넌트

#### ProgressChart.jsx
```jsx
const ProgressChart = ({ userId, period = 'week' }) => {
  const { data, loading } = useProgressData(userId, period);
  
  return (
    <div className="progress-chart">
      {/* 기간 선택 */}
      <PeriodSelector 
        value={period}
        options={['week', 'month', 'year']}
        onChange={setPeriod}
      />
      
      {/* 차트 */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="charactersRead" fill="#8884d8" name="읽은 글자수" />
          <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#82ca9d" name="정답률" />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 통계 요약 */}
      <StatsSummary data={data} />
    </div>
  );
};
```

## 3. 상태 관리 설계

### 3.1 Zustand Store 구조

```javascript
// stores/authStore.js
const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  
  login: async (email, password) => {
    // Supabase 로그인 로직
  },
  
  logout: async () => {
    // 로그아웃 로직
  },
}));

// stores/learningStore.js
const useLearningStore = create((set) => ({
  currentSession: null,
  sessionHistory: [],
  vocabulary: [],
  
  startSession: (type, materialId) => {
    // 세션 시작 로직
  },
  
  endSession: async (sessionData) => {
    // 세션 종료 및 저장
  },
  
  addVocabulary: (word) => {
    // 어휘 추가
  },
}));
```

### 3.2 Real-time 구독 관리

```javascript
// hooks/useRealtimeSubscription.js
const useRealtimeSubscription = (table, filter) => {
  const [data, setData] = useState([]);
  const supabase = useSupabase();
  
  useEffect(() => {
    const subscription = supabase
      .from(table)
      .on('*', (payload) => {
        // 실시간 데이터 업데이트
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [table, filter]);
  
  return data;
};
```

## 4. 성능 최적화 전략

### 4.1 컴포넌트 최적화
- React.memo를 활용한 불필요한 리렌더링 방지
- useMemo, useCallback을 통한 연산 최적화
- 가상화를 통한 대량 데이터 렌더링 최적화

### 4.2 번들 최적화
- 라우트 기반 코드 스플리팅
- 동적 임포트를 통한 지연 로딩
- 트리 쉐이킹을 통한 번들 크기 최소화

### 4.3 데이터 페칭 최적화
- React Query를 통한 서버 상태 관리
- 낙관적 업데이트 구현
- 백그라운드 리페칭 전략

## 5. 접근성 고려사항

### 5.1 키보드 내비게이션
- 모든 인터랙티브 요소에 키보드 접근 가능
- Tab 순서 논리적 구성
- 단축키 지원

### 5.2 스크린 리더 지원
- 시맨틱 HTML 사용
- ARIA 레이블 적절히 활용
- 동적 콘텐츠 변경 알림

### 5.3 시각적 접근성
- 고대비 모드 지원
- 색맹 친화적 색상 팔레트
- 확대/축소 기능