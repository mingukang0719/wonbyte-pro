# AI API 설정 가이드

원바이트 PRO에서 AI 기능을 사용하려면 OpenAI 또는 Anthropic Claude API 키가 필요합니다.

## 1. OpenAI API 키 설정 (권장)

### API 키 발급
1. https://platform.openai.com 접속
2. 계정 생성 또는 로그인
3. 우측 상단 프로필 → "API keys" 클릭
4. "Create new secret key" 클릭
5. 키 이름 입력 후 생성
6. 생성된 키 복사 (한 번만 표시되므로 안전한 곳에 저장)

### 가격
- GPT-3.5-turbo: $0.002 / 1K tokens (약 750단어)
- GPT-4: $0.03 / 1K tokens
- 신규 가입 시 무료 크레딧 제공

## 2. Anthropic Claude API 키 설정

### API 키 발급
1. https://console.anthropic.com 접속
2. 계정 생성 또는 로그인
3. "API Keys" 메뉴 클릭
4. "Create Key" 클릭
5. 키 이름 입력 후 생성
6. 생성된 키 복사

### 가격
- Claude 3 Sonnet: $0.003 / 1K input tokens, $0.015 / 1K output tokens
- 더 강력한 모델 사용 가능

## 3. Vercel 환경 변수 설정

1. https://vercel.com 에서 프로젝트 대시보드 접속
2. Settings → Environment Variables
3. 다음 변수 추가:
   - Key: `VITE_OPENAI_API_KEY`
   - Value: `sk-...` (OpenAI API 키)
   - 또는
   - Key: `VITE_ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (Anthropic API 키)
4. Production, Preview, Development 모두 선택
5. "Save" 클릭

## 4. 재배포

환경 변수 추가 후 재배포가 필요합니다:
1. Deployments 탭으로 이동
2. 최신 배포의 "..." 메뉴 클릭
3. "Redeploy" 선택

## 보안 권장사항

1. **API 키 보호**
   - GitHub에 직접 커밋하지 마세요
   - 환경 변수로만 관리하세요

2. **사용량 제한**
   - OpenAI/Anthropic 대시보드에서 월별 사용량 제한 설정
   - 알림 설정으로 과도한 사용 방지

3. **도메인 제한**
   - 프로덕션 환경에서만 API 키 사용 권장

## 문제 해결

### "Failed to fetch" 오류
- API 키가 올바르게 설정되었는지 확인
- Vercel 재배포가 완료되었는지 확인

### 비용 관련
- 초기에는 GPT-3.5-turbo 사용 권장 (저렴)
- 사용량 모니터링 필수