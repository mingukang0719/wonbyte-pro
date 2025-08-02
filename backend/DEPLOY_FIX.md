# 배포 문제 해결 가이드

## 문제 진단 결과

Playwright로 직접 확인한 결과:
1. **CORS 에러**: `Access to fetch at 'https://edutext-pro-backend.onrender.com/api/ai/generate' from origin 'https://wonbyte-pro-app.vercel.app'`
2. **404 에러**: 백엔드 엔드포인트가 존재하지 않음
3. **Failed to fetch**: 네트워크 요청 자체가 실패

## 근본 원인

1. **복잡한 초기화**: AIService 초기화 중 오류 발생 시 전체 라우트가 등록되지 않음
2. **동적 import 문제**: ES 모듈의 동적 import가 Render에서 제대로 작동하지 않을 수 있음
3. **환경변수 문제**: API 키 형식이나 값이 잘못되어 서비스 초기화 실패

## 즉시 해결 방법

### 1. Render에서 간단한 서버 사용하기

Render 대시보드에서:
1. Environment 탭으로 이동
2. Start Command를 다음으로 변경:
   ```
   node simpleServer.js
   ```

### 2. 환경변수 확인 (따옴표 제거!)

```
CLAUDE_API_KEY=your-claude-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

**중요**: API 키를 설정할 때 따옴표를 포함하지 마세요!

### 3. 테스트 URL

배포 후 다음 URL로 테스트:
- https://edutext-pro-backend.onrender.com/api/test
- https://edutext-pro-backend.onrender.com/api/ai/generate (POST)

## 장기 해결 방법

1. **정적 import 사용**: 모든 동적 import를 정적으로 변경
2. **에러 핸들링 강화**: 초기화 실패 시에도 기본 라우트는 작동하도록
3. **로깅 강화**: 배포 환경에서 무엇이 실패하는지 정확히 파악

## 로컬 테스트

```bash
# 간단한 서버 테스트
npm run start:simple

# 환경변수 검증
npm run validate-env
```