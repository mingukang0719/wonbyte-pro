# 원바이트 PRO 배포 가이드

## 🚀 Render 환경 변수 설정

### 필수 환경 변수
Render 대시보드 (https://dashboard.render.com)에서 다음 환경 변수를 설정해야 합니다:

```bash
# AI API Keys (필수)
OPENAI_API_KEY=sk-proj-... # OpenAI API 키
CLAUDE_API_KEY=sk-ant-api03-... # Claude API 키 (줄바꿈 없이!)
GEMINI_API_KEY=AIzaSy... # Gemini API 키

# Supabase (이미 설정됨)
SUPABASE_URL=https://jqlouemxgafrbzdxyojl.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Security Keys (이미 설정됨)
JWT_SECRET=...
API_KEY_ENCRYPTION_SECRET=...
```

### ⚠️ 중요 사항
1. **API 키 복사 시 주의**: 줄바꿈이나 공백이 포함되지 않도록 주의
2. **Claude API 키 문제 해결**: 현재 Claude API 키에 줄바꿈이 포함되어 있어 오류 발생
3. **OpenAI/Gemini 미설정**: 현재 배포된 버전에는 이 키들이 없어서 mock 데이터 반환

## 📝 환경 변수 설정 방법

1. Render 대시보드 접속
2. `edutext-pro-backend` 서비스 선택
3. Environment → Environment Variables 클릭
4. 다음 변수 추가/수정:
   - `OPENAI_API_KEY`: OpenAI API 키 입력
   - `GEMINI_API_KEY`: Gemini API 키 입력
   - `CLAUDE_API_KEY`: 기존 키 확인하고 줄바꿈 제거

## 🔄 코드 배포 프로세스

### 자동 배포 (GitHub 연동)
```bash
# 1. 변경사항 커밋
git add -A
git commit -m "fix: Remove mock responses and fix AI integration"

# 2. GitHub에 푸시
git push origin main

# 3. Render가 자동으로 재배포 (약 5-10분 소요)
```

### 수동 배포
1. Render 대시보드에서 "Manual Deploy" 클릭
2. "Deploy latest commit" 선택

## 🧪 배포 확인

### 1. 백엔드 상태 확인
```bash
curl https://edutext-pro-backend.onrender.com/api/health
```

### 2. AI 생성 테스트
```bash
curl -X POST https://edutext-pro-backend.onrender.com/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "contentType": "reading",
    "prompt": "전주 비빔밥에 대한 읽기 지문",
    "targetAge": "elem4",
    "contentLength": "200"
  }'
```

## 🛠️ 문제 해결

### "Failed to fetch" 오류
- CORS 설정 확인 (이미 수정됨)
- API 키 설정 확인

### Mock 데이터 반환
- 환경 변수 설정 확인
- 백엔드 코드가 최신 버전인지 확인

### API 키 오류
- 키에 줄바꿈이나 공백이 없는지 확인
- 키가 올바른 형식인지 확인

## 📱 프론트엔드 설정

현재 프론트엔드는 자동으로 배포된 백엔드를 사용합니다:
- Production: https://edutext-pro-backend.onrender.com
- Local: http://localhost:3001

## 🔐 API 키 획득 방법

### OpenAI
1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. 키 복사 (sk-proj-로 시작)

### Claude (Anthropic)
1. https://console.anthropic.com/ 접속
2. API Keys 섹션에서 키 생성
3. 키 복사 (sk-ant-로 시작)

### Google Gemini
1. https://makersuite.google.com/app/apikey 접속
2. "Create API Key" 클릭
3. 키 복사 (AIzaSy로 시작)