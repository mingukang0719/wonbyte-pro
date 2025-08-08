# RLS (Row Level Security) 솔루션 가이드

## 문제 상황
- 원바이트 PRO는 Supabase Auth 대신 커스텀 인증 시스템(`user_auth`, `user_sessions` 테이블)을 사용합니다.
- 기본 RLS 정책은 `auth.uid()`를 사용하는데, 커스텀 인증에서는 이 값이 항상 NULL입니다.
- 따라서 RLS가 활성화되면 데이터 생성/수정이 차단됩니다.

## 해결 방법
RLS를 유지하면서 커스텀 인증과 호환되도록 PostgreSQL 함수를 통한 보안 레이어를 구현합니다.

### 1. SQL 스크립트 적용
Supabase Dashboard에서:
1. SQL Editor로 이동
2. `apply_rls_solution.sql` 파일의 내용을 복사하여 붙여넣기
3. Run 버튼 클릭하여 실행

### 2. 작동 원리
- 모든 데이터 읽기는 허용 (SELECT)
- 데이터 생성/수정/삭제는 직접 접근 차단
- 대신 보안 함수를 통해서만 가능:
  - `create_reading_material()`: 지문 생성
  - `create_problems()`: 문제 생성
  - `create_assignments()`: 과제 배정

### 3. 보안 함수 특징
- 인증 토큰 검증
- 사용자 역할 확인 (teacher, admin만 생성 가능)
- 세션 만료 시간 체크
- SQL Injection 방지

### 4. 프론트엔드 변경사항
기존 코드:
```javascript
await supabase
  .from('reading_materials')
  .insert({ ... })
```

변경된 코드:
```javascript
await supabase
  .rpc('create_reading_material', {
    auth_token: authToken,
    p_title: title,
    p_content: content,
    // ...
  })
```

### 5. 테스트 방법
```sql
-- 인증 시스템 테스트
SELECT * FROM test_auth_system('your-auth-token-here');
```

### 6. 롤백 방법
만약 문제가 발생하면:
```sql
-- RLS 임시 비활성화
ALTER TABLE reading_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE problems DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
```

## 장점
- ✅ RLS 유지로 보안 강화
- ✅ 커스텀 인증 시스템과 완벽 호환
- ✅ 역할 기반 접근 제어
- ✅ SQL Injection 방지
- ✅ 세션 관리 통합

## 주의사항
- 함수 호출 시 항상 인증 토큰 필요
- 토큰은 localStorage에서 가져옴
- 세션 만료 시 재로그인 필요