# Wonbyte Pro Backend

한국어 문해력 교육 플랫폼 백엔드 서비스

## 🚀 빠른 시작

```bash
# 의존성 설치
npm install

# 환경변수 확인
npm run validate-env

# 서버 시작
npm start

# 테스트 실행
npm test
```

## 📋 필수 요구사항

- Node.js >= 18.0.0
- Claude API Key

## 🔧 환경변수 설정

`.env` 파일을 backend 디렉토리에 생성:

```env
CLAUDE_API_KEY=sk-ant-api03-xxxxx
PORT=3001
```

**중요**: API 키에 따옴표를 사용하지 마세요!

## 📁 프로젝트 구조

```
backend/
├── newServer.js      # 메인 서버 (간소화 버전)
├── server.js         # 이전 서버 (복잡한 버전)
├── simpleServer.js   # 디버그 서버 (최소 버전)
├── validateEnv.js    # 환경변수 검증
├── testLocal.js      # 로컬 테스트 스크립트
├── package.json      # 의존성
└── .env             # 환경변수 (직접 생성)
```

## 🌐 API 엔드포인트

### 상태 확인
- `GET /api/health` - 서버 상태 확인
- `GET /api/test` - 기본 테스트
- `GET /api/ai/status` - AI 서비스 상태

### AI 생성
- `POST /api/ai/generate` - 읽기 콘텐츠 생성
- `POST /api/ai/extract-vocabulary` - 텍스트에서 어휘 추출
- `POST /api/ai/generate-problems` - 이해력 문제 생성
- `POST /api/ai/analyze-text` - 텍스트 난이도 분석

### PDF
- `POST /api/pdf/generate` - 콘텐츠를 PDF로 생성

## 🚀 배포

자세한 배포 지침은 [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)를 참조하세요.

## 🧪 테스트

```bash
# 로컬 테스트 실행
npm test

# 배포된 서버 테스트
curl https://edutext-pro-backend.onrender.com/api/health
```

## 🐛 문제 해결

### 일반적인 문제

1. **"Failed to fetch" 오류**
   - 서버가 실행 중인지 확인
   - CORS 설정 확인
   - API 키 확인

2. **404 오류**
   - 엔드포인트 URL 확인
   - HTTP 메서드 (GET/POST) 확인

3. **AI 서비스 사용 불가**
   - .env의 CLAUDE_API_KEY 확인
   - API 키에서 따옴표 제거
   - API 키 유효성 확인

## 📝 참고사항

- 현재 Claude AI만 지원
- CORS는 모든 origin 허용 (프로덕션에서 업데이트 필요)
- 모든 응답은 JSON 형식
- 한국어 콘텐츠 생성에 최적화