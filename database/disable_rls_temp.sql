-- 임시로 RLS 비활성화
-- 커스텀 인증 시스템을 사용하고 있어 auth.uid()가 작동하지 않음
-- 프로덕션에서는 적절한 보안 정책을 구현해야 함

-- RLS 비활성화
ALTER TABLE reading_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE problems DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;

-- 모든 사용자가 접근 가능하도록 임시 정책 설정
-- 주의: 프로덕션에서는 사용하지 마세요!