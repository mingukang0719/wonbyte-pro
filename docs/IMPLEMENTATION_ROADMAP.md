# 원바이트 PRO - 구현 로드맵

## 📋 구현 우선순위

### Phase 1: 기본 인프라 구축 (1주차)
- **Day 1-2**: Supabase 설정 및 데이터베이스 구축
- **Day 3-4**: 인증 시스템 구현 (로그인/회원가입)
- **Day 5-7**: 기본 라우팅 및 레이아웃 구성

### Phase 2: 핵심 기능 구현 (2-3주차)
- **Week 2**: 학생 대시보드 및 학습 기능
- **Week 3**: 관리자 대시보드 및 과제 시스템

### Phase 3: 고도화 기능 (4주차)
- **Week 4**: 동기부여 시스템 및 분석 기능

### Phase 4: 최적화 및 배포 (5주차)
- **Week 5**: 성능 최적화, 테스트, 배포

## 🏗️ 상세 구현 계획

### Phase 1: 기본 인프라 구축

#### 1.1 Supabase 초기 설정
```bash
# 1. Supabase 프로젝트 생성
# 2. 환경 변수 설정
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# 3. 데이터베이스 스키마 적용
# database/schema.sql 파일을 Supabase SQL Editor에서 실행
```

#### 1.2 프로젝트 구조 설정
```bash
# 필요한 패키지 설치
npm install @supabase/supabase-js @supabase/auth-helpers-react
npm install zustand recharts react-hook-form
npm install react-router-dom@6
```

#### 1.3 기본 컴포넌트 생성
- [ ] App.jsx 라우팅 설정
- [ ] AuthContext 구현
- [ ] Layout 컴포넌트 (Header, Sidebar, Footer)
- [ ] 로그인/회원가입 페이지

### Phase 2: 핵심 기능 구현

#### 2.1 학생 대시보드
- [ ] StudentDashboard 페이지
- [ ] 학습 진도 표시 컴포넌트
- [ ] 오늘의 과제 컴포넌트
- [ ] 성취 배지 표시

#### 2.2 학습 기능
- [ ] 지문 읽기 세션
- [ ] 어휘 학습 모듈
- [ ] 문제 풀이 인터페이스
- [ ] 학습 데이터 저장

#### 2.3 관리자 기능
- [ ] 학생 목록 및 관리
- [ ] 지문 생성/편집
- [ ] 과제 배정 시스템
- [ ] 진도 모니터링

### Phase 3: 고도화 기능

#### 3.1 동기부여 시스템
- [ ] 레벨 및 경험치 시스템
- [ ] 성취 배지 시스템
- [ ] 시각적 진도 표시
- [ ] 리더보드

#### 3.2 분석 및 리포트
- [ ] 학습 통계 차트
- [ ] 진도 리포트 생성
- [ ] 상세 분석 대시보드

### Phase 4: 최적화 및 배포

#### 4.1 성능 최적화
- [ ] 코드 스플리팅
- [ ] 이미지 최적화
- [ ] 캐싱 전략 구현

#### 4.2 테스트
- [ ] 단위 테스트 작성
- [ ] 통합 테스트
- [ ] 사용자 테스트

#### 4.3 배포
- [ ] 프로덕션 빌드
- [ ] Netlify 배포 설정
- [ ] 모니터링 설정

## 💻 주요 코드 템플릿

### Supabase 클라이언트 설정
```javascript
// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 인증 Context
```javascript
// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    // 세션 체크
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (!error && data) {
      setProfile(data)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 라우팅 설정
```javascript
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import StudentDashboardPage from './pages/StudentDashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'

function PrivateRoute({ children, allowedRoles = [] }) {
  const { user, profile, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  if (!user) return <Navigate to="/login" />
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/unauthorized" />
  }
  
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route path="/student/*" element={
            <PrivateRoute allowedRoles={['student']}>
              <StudentDashboardPage />
            </PrivateRoute>
          } />
          
          <Route path="/admin/*" element={
            <PrivateRoute allowedRoles={['teacher', 'parent', 'admin']}>
              <AdminDashboardPage />
            </PrivateRoute>
          } />
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

## 🔧 개발 가이드라인

### 코딩 컨벤션
- 컴포넌트: PascalCase
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- 파일명: 컴포넌트는 PascalCase, 그 외는 camelCase

### Git 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 기타 변경사항
```

### 폴더 구조 규칙
- 컴포넌트별 폴더 생성
- 관련 스타일, 테스트 파일 동일 폴더에 위치
- 공통 컴포넌트는 common 폴더에 위치

## 📊 진행 상황 추적

### Week 1 체크리스트
- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 스키마 적용
- [ ] 인증 시스템 구현
- [ ] 기본 라우팅 설정
- [ ] 레이아웃 컴포넌트 생성

### Week 2 체크리스트
- [ ] 학생 대시보드 UI
- [ ] 학습 세션 기능
- [ ] 데이터 저장 로직
- [ ] 실시간 업데이트

### Week 3 체크리스트
- [ ] 관리자 대시보드
- [ ] 학생 관리 기능
- [ ] 과제 시스템
- [ ] 지문 생성기

### Week 4 체크리스트
- [ ] 성취 시스템
- [ ] 분석 차트
- [ ] 리포트 생성
- [ ] 알림 시스템

### Week 5 체크리스트
- [ ] 성능 최적화
- [ ] 테스트 작성
- [ ] 배포 준비
- [ ] 문서화