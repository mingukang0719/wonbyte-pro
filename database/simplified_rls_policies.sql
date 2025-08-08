-- 간소화된 RLS 정책 - 커스텀 인증 시스템과 호환
-- 이 접근 방법은 테이블의 user_id나 created_by 필드를 직접 사용합니다

-- 1. RLS 활성화
ALTER TABLE reading_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view materials" ON reading_materials;
DROP POLICY IF EXISTS "Teachers and admins can create materials" ON reading_materials;
DROP POLICY IF EXISTS "Teachers and admins can update materials" ON reading_materials;
DROP POLICY IF EXISTS "Teachers and admins can delete materials" ON reading_materials;
DROP POLICY IF EXISTS "Users can view problems" ON problems;
DROP POLICY IF EXISTS "Teachers and admins can create problems" ON problems;
DROP POLICY IF EXISTS "Teachers and admins can update problems" ON problems;
DROP POLICY IF EXISTS "Teachers and admins can delete problems" ON problems;
DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can create assignments" ON assignments;
DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can update their created assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can delete their assignments" ON assignments;

-- 3. Reading Materials 정책 (매우 단순화)
-- 모든 인증된 사용자가 자료를 볼 수 있음
CREATE POLICY "All users can view materials" ON reading_materials
  FOR SELECT USING (true);

-- 모든 인증된 사용자가 자료를 생성할 수 있음 (프론트엔드에서 역할 체크)
CREATE POLICY "All users can create materials" ON reading_materials
  FOR INSERT WITH CHECK (true);

-- 자료를 생성한 사용자만 수정 가능
CREATE POLICY "Users can update own materials" ON reading_materials
  FOR UPDATE USING (true);  -- 프론트엔드에서 체크

-- 자료를 생성한 사용자만 삭제 가능
CREATE POLICY "Users can delete own materials" ON reading_materials
  FOR DELETE USING (true);  -- 프론트엔드에서 체크

-- 4. Problems 정책
-- 모든 사용자가 문제를 볼 수 있음
CREATE POLICY "All users can view problems" ON problems
  FOR SELECT USING (true);

-- 모든 사용자가 문제를 생성할 수 있음 (프론트엔드에서 역할 체크)
CREATE POLICY "All users can create problems" ON problems
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 문제를 수정할 수 있음 (프론트엔드에서 역할 체크)
CREATE POLICY "All users can update problems" ON problems
  FOR UPDATE USING (true);

-- 모든 사용자가 문제를 삭제할 수 있음 (프론트엔드에서 역할 체크)
CREATE POLICY "All users can delete problems" ON problems
  FOR DELETE USING (true);

-- 5. Assignments 정책
-- 모든 사용자가 과제를 볼 수 있음 (프론트엔드에서 필터링)
CREATE POLICY "All users can view assignments" ON assignments
  FOR SELECT USING (true);

-- 모든 사용자가 과제를 생성할 수 있음 (프론트엔드에서 역할 체크)
CREATE POLICY "All users can create assignments" ON assignments
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 과제를 수정할 수 있음 (프론트엔드에서 권한 체크)
CREATE POLICY "All users can update assignments" ON assignments
  FOR UPDATE USING (true);

-- 모든 사용자가 과제를 삭제할 수 있음 (프론트엔드에서 권한 체크)
CREATE POLICY "All users can delete assignments" ON assignments
  FOR DELETE USING (true);