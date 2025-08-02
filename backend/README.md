# 원바이트 프로 백엔드

교육 콘텐츠 생성 및 관리를 위한 백엔드 서버

## 기술 스택

- Node.js + Express
- Supabase (PostgreSQL)
- AI Integration (OpenAI, Claude, Gemini)
- JWT Authentication

## 시작하기

### 1. 환경변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# AI API Keys
OPENAI_API_KEY=your_openai_api_key
CLAUDE_API_KEY=your_claude_api_key
GEMINI_API_KEY=your_gemini_api_key

# Security Keys
JWT_SECRET=your-jwt-secret
API_KEY_ENCRYPTION_SECRET=your-encryption-secret

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. `database/schema.sql` 파일의 SQL을 Supabase SQL Editor에서 실행
3. 프로젝트 설정에서 URL과 API 키를 복사하여 `.env` 파일에 입력

### 3. 의존성 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 실행
npm start
```

## API 엔드포인트

### 인증
- `POST /api/admin/login` - 관리자 로그인

### AI 콘텐츠 생성
- `POST /api/ai/generate` - AI 콘텐츠 생성
- `GET /api/ai/status` - AI 제공자 상태 확인

### PDF 생성
- `POST /api/pdf/generate` - PDF 생성
- `GET /api/pdf/download/:fileName` - PDF 다운로드

### 템플릿 관리
- `GET /api/admin/templates` - 템플릿 목록
- `POST /api/admin/templates` - 템플릿 생성
- `PUT /api/admin/templates/:id` - 템플릿 수정
- `DELETE /api/admin/templates/:id` - 템플릿 삭제

### 통계
- `GET /api/admin/stats` - 사용 통계 (인증 필요)

## 데이터베이스 구조

### 주요 테이블
- `users` - 사용자 정보
- `ai_generations` - AI 생성 로그
- `generated_content` - 생성된 콘텐츠
- `reading_templates` - 읽기 템플릿
- `user_activities` - 사용자 활동 로그
- `api_keys` - 암호화된 API 키
- `pdf_generation_logs` - PDF 생성 로그

## 보안

- JWT 기반 인증
- API 키 암호화 저장
- Rate Limiting 적용
- CORS 설정
- Helmet.js로 보안 헤더 설정
- Row Level Security (RLS) 정책 적용

## 배포

### Railway 배포
`railway.toml` 파일이 포함되어 있어 Railway에 쉽게 배포할 수 있습니다.

```bash
railway login
railway link
railway up
```

### 환경변수 설정
Railway 대시보드에서 모든 환경변수를 설정하세요.

## 문제 해결

### Supabase 연결 오류
- Supabase URL과 키가 올바른지 확인
- 네트워크 연결 상태 확인
- RLS 정책이 올바르게 설정되었는지 확인

### AI API 오류
- API 키가 유효한지 확인
- API 사용량 한도 확인
- 네트워크 연결 상태 확인