-- JWT 기반 커스텀 인증과 호환되는 RLS 정책
-- 이 방법은 JWT 토큰에서 사용자 정보를 추출합니다

-- 1. RLS 다시 활성화
ALTER TABLE reading_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view materials" ON reading_materials;
DROP POLICY IF EXISTS "Teachers and admins can create materials" ON reading_materials;
DROP POLICY IF EXISTS "Users can view problems" ON problems;
DROP POLICY IF EXISTS "Teachers and admins can create problems" ON problems;
DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can create assignments" ON assignments;
DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;

-- 3. JWT에서 현재 사용자 정보를 추출하는 함수
CREATE OR REPLACE FUNCTION auth_user_id() RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- JWT 토큰에서 사용자 ID 추출 시도
  current_user_id := current_setting('request.jwt.claims', true)::json->>'sub';
  
  IF current_user_id IS NOT NULL THEN
    RETURN current_user_id::UUID;
  END IF;
  
  -- JWT가 없으면 세션에서 시도
  current_user_id := current_setting('app.current_user_id', true);
  
  IF current_user_id IS NOT NULL THEN
    RETURN current_user_id::UUID;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 현재 사용자의 프로필 ID를 가져오는 함수
CREATE OR REPLACE FUNCTION auth_profile_id() RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  SELECT id INTO profile_id
  FROM profiles
  WHERE auth_id = auth_user_id()
  OR id = auth_user_id();  -- 레거시 호환성
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 현재 사용자의 역할을 가져오는 함수
CREATE OR REPLACE FUNCTION auth_user_role() RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth_profile_id();
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Reading Materials 정책
-- 모든 사용자가 자료를 볼 수 있음
CREATE POLICY "Anyone can view materials" ON reading_materials
  FOR SELECT USING (true);

-- 교사와 관리자만 자료를 생성할 수 있음
CREATE POLICY "Teachers and admins can create materials" ON reading_materials
  FOR INSERT WITH CHECK (
    auth_user_role() IN ('teacher', 'admin')
  );

-- 자료를 생성한 사람만 수정할 수 있음
CREATE POLICY "Creators can update their materials" ON reading_materials
  FOR UPDATE USING (
    created_by = auth_profile_id()
    OR auth_user_role() = 'admin'
  );

-- 자료를 생성한 사람만 삭제할 수 있음
CREATE POLICY "Creators can delete their materials" ON reading_materials
  FOR DELETE USING (
    created_by = auth_profile_id()
    OR auth_user_role() = 'admin'
  );

-- 7. Problems 정책
-- 모든 사용자가 문제를 볼 수 있음
CREATE POLICY "Anyone can view problems" ON problems
  FOR SELECT USING (true);

-- 교사와 관리자만 문제를 생성할 수 있음
CREATE POLICY "Teachers and admins can create problems" ON problems
  FOR INSERT WITH CHECK (
    auth_user_role() IN ('teacher', 'admin')
  );

-- 교사와 관리자만 문제를 수정할 수 있음
CREATE POLICY "Teachers and admins can update problems" ON problems
  FOR UPDATE USING (
    auth_user_role() IN ('teacher', 'admin')
  );

-- 교사와 관리자만 문제를 삭제할 수 있음
CREATE POLICY "Teachers and admins can delete problems" ON problems
  FOR DELETE USING (
    auth_user_role() IN ('teacher', 'admin')
  );

-- 8. Assignments 정책
-- 자신에게 배정된 과제나 자신이 배정한 과제를 볼 수 있음
CREATE POLICY "Users can view related assignments" ON assignments
  FOR SELECT USING (
    assigned_to = auth_profile_id()
    OR assigned_by = auth_profile_id()
    OR auth_user_role() = 'admin'
    OR EXISTS (
      -- 교사는 자신의 학생들의 과제를 볼 수 있음
      SELECT 1 FROM profiles
      WHERE profiles.id = assignments.assigned_to
      AND profiles.teacher_id = auth_profile_id()
    )
  );

-- 교사와 관리자만 과제를 생성할 수 있음
CREATE POLICY "Teachers and admins can create assignments" ON assignments
  FOR INSERT WITH CHECK (
    auth_user_role() IN ('teacher', 'admin')
  );

-- 학생은 자신의 과제 상태만 업데이트할 수 있음
CREATE POLICY "Students can update their assignment status" ON assignments
  FOR UPDATE USING (
    assigned_to = auth_profile_id()
  )
  WITH CHECK (
    assigned_to = auth_profile_id()
  );

-- 교사는 자신이 생성한 과제를 업데이트할 수 있음
CREATE POLICY "Teachers can update their assignments" ON assignments
  FOR UPDATE USING (
    assigned_by = auth_profile_id()
    AND auth_user_role() IN ('teacher', 'admin')
  );

-- 교사는 자신이 생성한 과제를 삭제할 수 있음
CREATE POLICY "Teachers can delete their assignments" ON assignments
  FOR DELETE USING (
    assigned_by = auth_profile_id()
    AND auth_user_role() IN ('teacher', 'admin')
  );

-- 9. 디버깅을 위한 뷰 생성
CREATE OR REPLACE VIEW current_user_info AS
SELECT 
  auth_user_id() as auth_user_id,
  auth_profile_id() as profile_id,
  auth_user_role() as user_role,
  p.full_name,
  p.email
FROM profiles p
WHERE p.id = auth_profile_id();

-- 권한 부여
GRANT SELECT ON current_user_info TO authenticated, anon;