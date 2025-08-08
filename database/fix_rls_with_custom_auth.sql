-- RLS를 유지하면서 커스텀 인증 시스템과 호환되도록 수정
-- 이 스크립트는 app.current_user_id를 사용하여 현재 사용자를 식별합니다

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

-- 3. 현재 사용자 ID를 가져오는 함수 생성
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  -- app.current_user_id가 설정되어 있으면 사용
  IF current_setting('app.current_user_id', true) IS NOT NULL THEN
    RETURN current_setting('app.current_user_id', true)::UUID;
  END IF;
  
  -- 설정되어 있지 않으면 NULL 반환
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 현재 사용자의 프로필을 가져오는 함수
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS profiles AS $$
DECLARE
  user_profile profiles;
BEGIN
  SELECT * INTO user_profile
  FROM profiles
  WHERE auth_id = get_current_user_id();
  
  RETURN user_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 현재 사용자의 역할을 확인하는 함수
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE auth_id = get_current_user_id();
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Reading Materials 정책 재생성
CREATE POLICY "Users can view materials" ON reading_materials
  FOR SELECT USING (true);

CREATE POLICY "Teachers and admins can create materials" ON reading_materials
  FOR INSERT WITH CHECK (
    current_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "Teachers and admins can update materials" ON reading_materials
  FOR UPDATE USING (
    current_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "Teachers and admins can delete materials" ON reading_materials
  FOR DELETE USING (
    current_user_role() IN ('teacher', 'admin')
  );

-- 7. Problems 정책 재생성
CREATE POLICY "Users can view problems" ON problems
  FOR SELECT USING (true);

CREATE POLICY "Teachers and admins can create problems" ON problems
  FOR INSERT WITH CHECK (
    current_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "Teachers and admins can update problems" ON problems
  FOR UPDATE USING (
    current_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "Teachers and admins can delete problems" ON problems
  FOR DELETE USING (
    current_user_role() IN ('teacher', 'admin')
  );

-- 8. Assignments 정책 재생성
CREATE POLICY "Users can view their assignments" ON assignments
  FOR SELECT USING (
    assigned_to = (SELECT id FROM profiles WHERE auth_id = get_current_user_id())
    OR assigned_by = (SELECT id FROM profiles WHERE auth_id = get_current_user_id())
    OR current_user_role() = 'admin'
  );

CREATE POLICY "Teachers and admins can create assignments" ON assignments
  FOR INSERT WITH CHECK (
    current_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "Users can update their assignments" ON assignments
  FOR UPDATE USING (
    assigned_to = (SELECT id FROM profiles WHERE auth_id = get_current_user_id())
  );

CREATE POLICY "Teachers can update their created assignments" ON assignments
  FOR UPDATE USING (
    assigned_by = (SELECT id FROM profiles WHERE auth_id = get_current_user_id())
    AND current_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "Teachers can delete their assignments" ON assignments
  FOR DELETE USING (
    assigned_by = (SELECT id FROM profiles WHERE auth_id = get_current_user_id())
    AND current_user_role() IN ('teacher', 'admin')
  );

-- 9. 디버깅을 위한 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW debug_current_user AS
SELECT 
  get_current_user_id() as current_user_id,
  current_user_role() as current_user_role,
  (SELECT id FROM profiles WHERE auth_id = get_current_user_id()) as profile_id,
  (SELECT full_name FROM profiles WHERE auth_id = get_current_user_id()) as full_name;

-- 권한 부여
GRANT SELECT ON debug_current_user TO authenticated, anon;