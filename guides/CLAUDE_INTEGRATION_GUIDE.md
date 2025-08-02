# Claude API 백엔드 통합 가이드

## 개요
이 가이드는 Claude API를 백엔드에 통합하여 관리자가 로그인 후 즉시 지문을 생성할 수 있도록 하는 방법을 설명합니다.

## 필요 사항
- Claude API 키 (Anthropic Console에서 발급)
- Supabase 프로젝트
- Node.js 백엔드 서버

## 설치 단계

### 1. 환경 변수 설정
`.env` 파일에 다음 추가:
```bash
CLAUDE_API_KEY=your_claude_api_key_here
ENCRYPTION_KEY=32바이트_16진수_문자열
SESSION_SECRET=랜덤_문자열
```

### 2. 데이터베이스 설정
Supabase SQL 에디터에서 `supabase-claude-integration.sql` 파일 실행

### 3. 백엔드 파일 추가
다음 파일들을 프로젝트에 추가:
- `backend/middleware/adminAuth.js`
- `backend/routes/templates.js`
- `backend/routes/aiGeneration.js`

### 4. server.js 업데이트
`server-update-guide.js`의 지침에 따라 server.js 파일 수정

### 5. 프론트엔드 컴포넌트 추가
다음 컴포넌트를 추가:
- `src/components/Admin/TemplateManager.jsx`
- `src/components/Admin/ContentGenerator.jsx`

### 6. 관리자 대시보드 라우팅 추가
`AdminDashboard.jsx`에 새 라우트 추가:
```jsx
import TemplateManager from '../components/Admin/TemplateManager'
import ContentGenerator from '../components/Admin/ContentGenerator'

// Routes 내부에 추가
<Route path="/admin/templates" element={<TemplateManager />} />
<Route path="/admin/generate" element={<ContentGenerator />} />
```

## 사용 방법

### 1. 관리자 계정 생성
Supabase 대시보드에서:
1. Authentication > Users에서 새 사용자 생성
2. SQL 에디터에서 관리자 권한 부여:
```sql
INSERT INTO admin_users (id, role_id)
SELECT 
  auth.users.id,
  admin_roles.id
FROM auth.users, admin_roles
WHERE auth.users.email = 'admin@example.com'
AND admin_roles.role_name = 'content_admin';
```

### 2. 템플릿 생성
1. 관리자로 로그인
2. 템플릿 관리 페이지 접속
3. "새 템플릿 추가" 클릭
4. 템플릿 정보 입력:
   - 이름: "초급 읽기 지문"
   - 타입: reading
   - 프롬프트: "{{topic}} 주제로 {{level}} 수준의 한국어 읽기 지문을 {{length}}자로 작성해주세요"
   - 변수: topic, level, length

### 3. 지문 생성
1. "지문 생성" 페이지 접속
2. AI 제공자 선택 (Claude 또는 Gemini)
3. 템플릿 선택
4. 변수 값 입력
5. "지문 생성하기" 클릭

## 보안 고려사항

### API 키 보호
- 절대 클라이언트 사이드에 API 키 노출하지 않기
- 환경 변수로만 관리
- 암호화 저장 고려

### 접근 제어
- 관리자 권한 확인 미들웨어 필수
- 권한별 기능 제한
- 감사 로그 활성화

### Rate Limiting
- IP당 시간당 100회 제한
- 사용자별 추가 제한 가능
- 비용 모니터링 필수

## 모니터링

### 사용량 추적
- 대시보드에서 실시간 통계 확인
- 토큰 사용량 및 비용 모니터링
- 일별/월별 리포트

### 에러 처리
- 모든 에러 로깅
- 실패 시 폴백 전략
- 사용자 친화적 에러 메시지

## 문제 해결

### Claude API 오류
1. API 키 확인
2. 잔액 확인
3. Rate limit 확인

### 생성 실패
1. 템플릿 프롬프트 검증
2. 변수 값 확인
3. 네트워크 상태 확인

## 확장 가능성

### 배치 처리
- 여러 템플릿 동시 생성
- 큐 시스템 구현
- 백그라운드 작업

### 다른 AI 제공자
- OpenAI GPT 통합
- 로컬 LLM 지원
- 멀티 프로바이더 전략

## 업데이트 계획

### v1.1
- 웹소켓 실시간 생성 진행률
- 생성 히스토리 검색/필터
- 템플릿 공유 기능

### v1.2
- AI 응답 품질 평가
- 자동 재시도 로직
- 비용 최적화 제안

## 지원
문제 발생 시:
1. 로그 확인
2. 감사 로그 검토
3. 이슈 트래커 활용