# 원바이트 프로 백엔드 설정 가이드

## 빠른 시작 가이드

### 1단계: Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속 후 회원가입/로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Project name: `onbyte-pro` (원하는 이름)
   - Database Password: 강력한 비밀번호 설정
   - Region: `Northeast Asia (Seoul)` 선택 (한국에서 가장 빠름)

### 2단계: 데이터베이스 설정

1. Supabase 대시보드에서 SQL Editor 탭 클릭
2. `backend/database/schema.sql` 파일의 내용을 복사
3. SQL Editor에 붙여넣고 "Run" 클릭
4. 성공 메시지 확인

### 3단계: API 키 가져오기

1. Supabase 대시보드에서 Settings > API 클릭
2. 다음 정보를 복사:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` 키 → `SUPABASE_ANON_KEY`
   - `service_role` 키 → `SUPABASE_SERVICE_KEY` (보안 주의!)

### 4단계: 환경변수 설정

1. `.env` 파일 생성 (`.env.example` 참고)
2. Supabase 정보 입력:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

3. 보안 키 생성:
```bash
# Node.js 콘솔에서 실행
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
생성된 값을 `JWT_SECRET`과 `API_KEY_ENCRYPTION_SECRET`에 입력

4. AI API 키 설정 (선택사항):
   - OpenAI: https://platform.openai.com/api-keys
   - Claude: https://console.anthropic.com/
   - Gemini: https://makersuite.google.com/app/apikey

### 5단계: 서버 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 6단계: 동작 확인

1. 브라우저에서 http://localhost:3001/api/health 접속
2. 다음과 같은 응답 확인:
```json
{
  "status": "OK",
  "services": {
    "supabase": "connected",
    "database": "connected"
  }
}
```

## 문제 해결

### "supabase is not defined" 오류
- `.env` 파일의 Supabase URL과 키를 다시 확인
- 서버를 재시작 (`Ctrl+C` 후 `npm run dev`)

### "JWT_SECRET is not defined" 오류
- `.env` 파일에 JWT_SECRET이 설정되었는지 확인
- 32자 이상의 랜덤 문자열 사용 권장

### CORS 오류
- 프론트엔드 URL이 `FRONTEND_URL`과 일치하는지 확인
- 개발 중에는 `.env`에서 `NODE_ENV=development` 확인

## 프로덕션 배포

### Railway 배포
1. [Railway](https://railway.app) 가입
2. GitHub 리포지토리 연결
3. 환경변수 설정 (Railway 대시보드에서)
4. 자동 배포 확인

### 보안 체크리스트
- [ ] 강력한 JWT_SECRET 사용
- [ ] API_KEY_ENCRYPTION_SECRET 변경
- [ ] Supabase RLS 정책 활성화
- [ ] 프로덕션에서 CORS 설정 제한
- [ ] Rate Limiting 설정 확인
- [ ] 환경변수 노출 방지