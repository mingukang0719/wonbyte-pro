# 원바이트 Print 모드 배포 가이드

## 🚀 배포 개요

이 가이드는 원바이트 Print 모드 웹 애플리케이션을 실제 서비스로 배포하는 과정을 설명합니다.

## 📋 배포 구조

- **프론트엔드**: Netlify (정적 호스팅)
- **백엔드**: Railway 또는 Render (Node.js 서버)
- **데이터베이스**: Supabase (PostgreSQL)

## 🎯 1단계: 프론트엔드 배포 (Netlify)

### 1.1 GitHub 저장소 준비
```bash
# 현재 변경사항이 커밋되어 있는지 확인
git status

# GitHub에 푸시 (이미 연결된 저장소가 있는 경우)
git push origin master
```

### 1.2 Netlify 배포
1. [Netlify](https://app.netlify.com) 접속 및 로그인
2. "New site from Git" 클릭
3. GitHub 저장소 선택
4. 빌드 설정:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

### 1.3 환경변수 설정
Netlify 사이트 설정에서 환경변수 추가:
```
VITE_API_BASE_URL=https://your-backend-url.railway.app/api
VITE_SUPABASE_URL=https://xrjrddwrsasjifhghzfl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🛡️ 2단계: 백엔드 배포 (Railway)

### 2.1 Railway 계정 설정
1. [Railway](https://railway.app) 접속 및 GitHub 연결
2. "New Project" → "Deploy from GitHub repo" 선택
3. 저장소 선택 후 `backend` 폴더 지정

### 2.2 환경변수 설정
Railway 프로젝트 설정에서 다음 환경변수 추가:
```
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://xrjrddwrsasjifhghzfl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
API_KEY_ENCRYPTION_SECRET=EduTextPro2024SecretKey!@#$%^&*()1234567890
JWT_SECRET=EduTextProJWTSecret2024!@#$%^&*()
GEMINI_API_KEY=your-actual-gemini-api-key
CLAUDE_API_KEY=your-actual-claude-api-key
```

### 2.3 도메인 설정
Railway에서 생성된 도메인을 확인하고 프론트엔드 환경변수 업데이트

## 🗄️ 3단계: 데이터베이스 설정 (Supabase)

### 3.1 테이블 생성
Supabase SQL Editor에서 다음 스키마 실행:

```sql
-- 프로젝트 테이블
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  blocks JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);
```

## 🔧 4단계: 최종 설정

### 4.1 도메인 연결
1. Netlify에서 커스텀 도메인 설정 (선택사항)
2. HTTPS 자동 활성화 확인
3. 백엔드 CORS 설정에 최종 도메인 추가

### 4.2 테스트
1. 프론트엔드 배포 확인: `https://your-site.netlify.app`
2. 백엔드 헬스체크: `https://your-backend.railway.app/api/health`
3. AI 기능 테스트 (API 키 설정 후)
4. PDF 내보내기 기능 테스트

## 📊 배포 상태 체크리스트

- [ ] 프론트엔드 Netlify 배포 완료
- [ ] 백엔드 Railway 배포 완료
- [ ] 환경변수 모두 설정
- [ ] CORS 설정 업데이트
- [ ] Supabase 데이터베이스 스키마 적용
- [ ] AI API 키 설정 (Gemini, Claude)
- [ ] 전체 기능 테스트 완료

## 🔗 배포된 서비스 URL

**배포 완료 후 업데이트 예정:**
- 프론트엔드: `https://onbyte-print.netlify.app`
- 백엔드: `https://onbyte-print-backend.railway.app`
- API 문서: `https://onbyte-print-backend.railway.app/api/health`

## 🚨 트러블슈팅

### 빌드 실패
- Node.js 버전 확인 (18 권장)
- 환경변수 누락 확인
- 의존성 설치 로그 확인

### CORS 오류
- 백엔드 server.js의 origin 설정 확인
- 프론트엔드 도메인이 허용 목록에 있는지 확인

### AI 기능 오류
- API 키가 올바르게 설정되었는지 확인
- Rate limit 확인
- 백엔드 로그에서 자세한 오류 메시지 확인

## 📞 지원

배포 과정에서 문제가 발생하면:
1. 각 서비스의 로그 확인
2. 환경변수 설정 재검토
3. GitHub Issues에 문제 상황 보고

---

**생성일**: 2025-08-01  
**버전**: 1.0.0  
**상태**: 배포 준비 완료 ✅