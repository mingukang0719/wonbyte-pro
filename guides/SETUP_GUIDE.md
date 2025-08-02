# Claude API 통합 설정 가이드

## 현재 상태
✅ 백엔드 서버 실행 중 (http://localhost:3001)
✅ 프론트엔드 서버 실행 중 (http://localhost:5173)
✅ Claude API 키 설정 완료
✅ 모든 필요한 파일 생성 완료

## 남은 설정 단계

### 1. Supabase 데이터베이스 설정

1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. 프로젝트 선택: `Korean Learning Content Creator`
3. 왼쪽 메뉴에서 `SQL Editor` 클릭
4. `New query` 버튼 클릭
5. `supabase-setup-complete.sql` 파일의 전체 내용을 복사하여 붙여넣기
6. `Run` 버튼 클릭하여 실행

### 2. 관리자 계정 생성

1. Supabase 대시보드에서 `Authentication` → `Users` 메뉴로 이동
2. `Add user` → `Create new user` 클릭
3. 다음 정보 입력:
   - Email: 원하는 관리자 이메일
   - Password: 안전한 비밀번호
   - Auto Confirm User: 체크
4. `Create user` 클릭

### 3. 관리자 권한 부여

1. SQL Editor로 다시 이동
2. 다음 쿼리 실행 (이메일을 실제 값으로 변경):

```sql
INSERT INTO admin_users (id, role_id)
SELECT 
  u.id,
  r.id
FROM auth.users u, admin_roles r
WHERE u.email = 'your-admin@example.com'  -- 여기에 실제 이메일 입력!
AND r.role_name = 'content_admin'
ON CONFLICT (id) DO NOTHING;
```

### 4. 테스트

1. 브라우저에서 http://localhost:5173/admin/login 접속
2. 생성한 관리자 계정으로 로그인
3. 템플릿 관리 및 콘텐츠 생성 테스트

## 주요 기능

### 템플릿 관리
- 다양한 콘텐츠 유형의 템플릿 생성 (어휘, 문법, 읽기, 퀴즈 등)
- 난이도 및 대상 연령 설정
- 변수를 사용한 동적 콘텐츠 생성

### 즉시 생성
- Claude API를 통한 실시간 콘텐츠 생성
- 생성된 콘텐츠 히스토리 관리
- 토큰 사용량 추적

### 보안
- JWT 기반 인증
- 역할 기반 접근 제어 (RBAC)
- API 키 암호화 저장
- 감사 로그

## 문제 해결

### 로그인이 안 되는 경우
1. Supabase에서 사용자가 생성되었는지 확인
2. admin_users 테이블에 권한이 부여되었는지 확인
3. 백엔드 콘솔에서 에러 메시지 확인

### 콘텐츠 생성이 안 되는 경우
1. Claude API 키가 올바른지 확인
2. 네트워크 연결 상태 확인
3. 백엔드 콘솔에서 에러 메시지 확인

## API 엔드포인트

- POST `/api/auth/admin/login` - 관리자 로그인
- GET `/api/admin/stats` - 통계 조회
- GET `/api/templates` - 템플릿 목록
- POST `/api/templates` - 템플릿 생성
- POST `/api/ai/generate-from-template` - 템플릿 기반 생성
- POST `/api/ai/generate-direct` - 직접 생성