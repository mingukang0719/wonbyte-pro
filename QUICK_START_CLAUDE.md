# Claude API 빠른 시작 가이드

## 🚀 즉시 시작하기 (5분 소요)

### 1. 환경 설정 (1분)
```bash
cd backend
cp .env.setup .env
```

⚠️ **중요**: `.env` 파일에서 Supabase 정보를 입력하세요:
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase anon 키

### 2. 데이터베이스 설정 (2분)
1. Supabase 대시보드 접속
2. SQL Editor 열기
3. `supabase-claude-integration.sql` 파일 내용 전체 복사
4. 실행 (Run 버튼 클릭)

### 3. 서버 재시작 (1분)
```bash
cd backend
npm install
npm start
```

### 4. 첫 관리자 생성 (1분)
Supabase SQL Editor에서:
```sql
-- 1. Auth에서 사용자 생성 후 아래 실행
-- 2. your-email@example.com을 실제 이메일로 변경

INSERT INTO admin_users (id, role_id)
SELECT 
  auth.users.id,
  admin_roles.id
FROM auth.users, admin_roles
WHERE auth.users.email = 'your-email@example.com'
AND admin_roles.role_name = 'content_admin';
```

## ✅ 테스트하기

### 1. 관리자 로그인
- http://localhost:5173/admin/login
- 위에서 생성한 계정으로 로그인

### 2. 첫 템플릿 생성
관리자 대시보드 → 템플릿 관리 → 새 템플릿 추가

**예시 템플릿:**
- **이름**: 초급 한국어 읽기 지문
- **타입**: reading
- **난이도**: beginner
- **대상**: elem1
- **프롬프트**: 
```
{{topic}} 주제로 초등학교 1학년 수준의 한국어 읽기 지문을 작성해주세요.
글자 수는 정확히 {{length}}자로 맞춰주세요.
어려운 단어는 피하고 쉽고 재미있게 작성해주세요.
```
- **변수**: 
  - topic (주제)
  - length (글자 수)

### 3. 지문 생성
1. 관리자 대시보드 → 지문 생성
2. Claude 3.5 Sonnet 선택
3. 템플릿 선택
4. 변수 입력:
   - topic: 봄 꽃
   - length: 200
5. "지문 생성하기" 클릭

## 🎉 완료!

이제 Claude API를 통해 고품질 한국어 학습 자료를 즉시 생성할 수 있습니다!

## 문제 해결

### Claude API 오류
- API 키 확인: `.env` 파일의 `CLAUDE_API_KEY`
- 네트워크 연결 확인
- Anthropic 콘솔에서 API 키 상태 확인

### 로그인 실패
- Supabase URL과 anon key 확인
- 관리자 권한 SQL 실행 확인
- 브라우저 콘솔 에러 확인

### 생성 실패
- 템플릿 프롬프트 형식 확인
- 변수 {{}} 형식 확인
- 서버 로그 확인: `npm start` 터미널

## 다음 단계

1. **더 많은 템플릿 생성**
   - 어휘 학습 템플릿
   - 문법 설명 템플릿
   - 퀴즈 템플릿

2. **팀원 추가**
   - 추가 관리자 계정 생성
   - 권한별 접근 제어

3. **프로덕션 배포**
   - 환경 변수 보안 설정
   - HTTPS 활성화
   - Rate limiting 조정