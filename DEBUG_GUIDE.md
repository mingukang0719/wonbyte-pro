# 원바이트 PRO 디버깅 가이드

## 현재 문제
- 프론트엔드에서 백엔드 API 호출 시 "Endpoint not found" 오류 발생
- Failed to fetch 오류로 AI 콘텐츠 생성 실패

## 확인 사항

### 1. 배포 상태 확인
- **백엔드 상태**: https://edutext-pro-backend.onrender.com/api/health
- **프론트엔드**: https://wonbyte-pro-app.vercel.app

### 2. 브라우저 개발자 도구에서 확인
1. F12로 개발자 도구 열기
2. Network 탭 선택
3. AI 생성 버튼 클릭
4. 실패한 요청 확인:
   - Request URL이 올바른지 확인
   - Response 내용 확인

### 3. 예상되는 API 엔드포인트
- 지문 생성: `POST /api/ai/generate`
- 어휘 추출: `POST /api/ai/extract-vocabulary`
- 문제 생성: `POST /api/ai/generate-problems`
- PDF 생성: `POST /api/pdf/generate`

### 4. Render 환경변수 확인
Render 대시보드에서 다음 환경변수가 설정되어 있는지 확인:
- `OPENAI_API_KEY` (따옴표 없이)
- `CLAUDE_API_KEY` (따옴표 없이)
- `GEMINI_API_KEY` (따옴표 없이)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5. 수동 테스트
백엔드가 실행 중인지 확인하려면 브라우저에서:
- https://edutext-pro-backend.onrender.com/api/health
- https://edutext-pro-backend.onrender.com/api/ai/status

### 6. 로컬 테스트
로컬에서 백엔드 실행하여 테스트:
```bash
cd backend
npm run dev
```

프론트엔드도 로컬에서 실행:
```bash
cd 원바이트 프로
npm run dev
```

로컬에서 작동하면 배포 환경의 문제입니다.