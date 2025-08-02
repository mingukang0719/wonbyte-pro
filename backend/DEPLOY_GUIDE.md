# EduText Pro Backend 배포 가이드

## 🚀 빠른 시작

### 1. 로컬 테스트
```bash
# 환경변수 확인
npm run validate-env

# 서버 시작
npm start

# 다른 터미널에서 테스트
npm test
```

### 2. Render 배포

#### 2.1 환경변수 설정 (가장 중요!)
1. https://dashboard.render.com 접속
2. 백엔드 서비스 선택
3. Environment 탭 이동
4. 다음 변수 추가 (따옴표 없이!):
   ```
   CLAUDE_API_KEY=sk-ant-api03-xxxxx
   ```

#### 2.2 시작 명령어 확인
Settings 탭에서 Start Command가 다음과 같은지 확인:
```
npm start
```

#### 2.3 배포
1. GitHub에 코드 푸시
2. Render가 자동으로 배포 시작
3. Logs 탭에서 배포 상태 확인

## 🧪 배포 확인

### 1. 기본 테스트
```bash
# Health check
curl https://edutext-pro-backend.onrender.com/api/health

# AI status
curl https://edutext-pro-backend.onrender.com/api/ai/status
```

### 2. AI 생성 테스트
```bash
curl -X POST https://edutext-pro-backend.onrender.com/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "전주 비빔밥", "contentType": "reading"}'
```

## 🐛 문제 해결

### "Failed to fetch" 오류
1. Render 대시보드에서 Logs 확인
2. Claude API key가 제대로 설정되었는지 확인
3. CORS 오류인 경우 프론트엔드 URL 확인

### API key 오류
1. Environment 탭에서 CLAUDE_API_KEY 확인
2. 따옴표가 포함되지 않았는지 확인
3. API key가 유효한지 확인

### 404 오류
1. 엔드포인트 URL이 정확한지 확인
2. HTTP 메서드 (GET/POST)가 맞는지 확인
3. /api/health로 서버 상태 확인

## 📝 서버 구조

### newServer.js
- 가장 간단한 구조
- 모든 라우트가 한 파일에 정의
- Claude API만 지원 (현재)
- 에러 처리 강화

### 주요 엔드포인트
- GET /api/health - 서버 상태
- GET /api/test - 테스트
- GET /api/ai/status - AI 상태
- POST /api/ai/generate - 콘텐츠 생성
- POST /api/ai/extract-vocabulary - 어휘 추출
- POST /api/ai/generate-problems - 문제 생성
- POST /api/ai/analyze-text - 텍스트 분석
- POST /api/pdf/generate - PDF 생성

## 💡 팁

1. **환경변수**: 절대 따옴표 사용하지 않기
2. **로그 확인**: Render Logs 탭 활용
3. **테스트**: 배포 후 즉시 /api/health 확인
4. **CORS**: 프론트엔드 URL 변경 시 업데이트 필요