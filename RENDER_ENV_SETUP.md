# Render 환경변수 설정 가이드

## 필수 환경변수

Render 대시보드에서 다음 환경변수를 추가하세요:

### 1. CLAUDE_API_KEY
- 설명: Claude API 키
- 예시: sk-ant-api03-xxxxx (실제 키 사용)

### 2. JWT_SECRET  
- 설명: JWT 토큰 서명용 비밀키
- 예시: `my-super-secret-jwt-key-2025`
- 또는 랜덤 생성: `openssl rand -hex 32`

### 3. API_KEY_ENCRYPTION_SECRET
- 설명: API 키 암호화용 32자리 키
- 예시: `1234567890abcdef1234567890abcdef`
- 또는 랜덤 생성: `openssl rand -hex 16`

## 설정 방법

1. Render 대시보드 접속
2. 백엔드 서비스 선택 
3. Environment 탭 클릭
4. 위 환경변수 추가
5. Save Changes 클릭

## 확인 방법

배포 완료 후:
- https://your-backend.onrender.com/api/health
- 관리자 로그인 테스트