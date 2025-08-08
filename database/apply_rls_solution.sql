-- RLS를 유지하면서 커스텀 인증 시스템과 호환되도록 하는 완전한 솔루션
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. RLS 재활성화 (이미 비활성화된 경우)
ALTER TABLE reading_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 모두 삭제
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('reading_materials', 'problems', 'assignments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. 인증 확인 함수 생성
CREATE OR REPLACE FUNCTION authenticate_request(auth_token TEXT)
RETURNS TABLE (
  user_id UUID,
  profile_id UUID,
  user_role TEXT,
  is_authenticated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.user_id,
    p.id as profile_id,
    p.role as user_role,
    CASE 
      WHEN s.expires_at > NOW() THEN true
      ELSE false
    END as is_authenticated
  FROM user_sessions s
  LEFT JOIN profiles p ON p.auth_id = s.user_id
  WHERE s.token = auth_token
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Reading Material 생성 함수
CREATE OR REPLACE FUNCTION create_reading_material(
  auth_token TEXT,
  p_title TEXT,
  p_content TEXT,
  p_topic TEXT,
  p_level TEXT,
  p_word_count INTEGER
) RETURNS reading_materials AS $$
DECLARE
  auth_info RECORD;
  new_material reading_materials;
BEGIN
  -- 인증 확인
  SELECT * INTO auth_info FROM authenticate_request(auth_token);
  
  IF NOT auth_info.is_authenticated OR auth_info.user_role NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only teachers and admins can create materials';
  END IF;
  
  -- 자료 생성
  INSERT INTO reading_materials (title, content, topic, level, word_count, created_by)
  VALUES (p_title, p_content, p_topic, p_level, p_word_count, auth_info.profile_id)
  RETURNING * INTO new_material;
  
  RETURN new_material;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Problems 생성 함수
CREATE OR REPLACE FUNCTION create_problems(
  auth_token TEXT,
  p_problems JSONB
) RETURNS SETOF problems AS $$
DECLARE
  auth_info RECORD;
  problem_data JSONB;
  new_problem problems;
BEGIN
  -- 인증 확인
  SELECT * INTO auth_info FROM authenticate_request(auth_token);
  
  IF NOT auth_info.is_authenticated OR auth_info.user_role NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only teachers and admins can create problems';
  END IF;
  
  -- 문제들 생성
  FOR problem_data IN SELECT * FROM jsonb_array_elements(p_problems)
  LOOP
    INSERT INTO problems (
      material_id,
      question,
      options,
      correct_answer,
      explanation,
      type,
      category,
      points
    )
    VALUES (
      (problem_data->>'material_id')::UUID,
      problem_data->>'question',
      problem_data->'options',
      (problem_data->>'correct_answer')::INTEGER,
      problem_data->>'explanation',
      problem_data->>'type',
      problem_data->>'category',
      COALESCE((problem_data->>'points')::INTEGER, 10)
    )
    RETURNING * INTO new_problem;
    
    RETURN NEXT new_problem;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Assignments 생성 함수
CREATE OR REPLACE FUNCTION create_assignments(
  auth_token TEXT,
  p_assignments JSONB
) RETURNS SETOF assignments AS $$
DECLARE
  auth_info RECORD;
  assignment_data JSONB;
  new_assignment assignments;
BEGIN
  -- 인증 확인
  SELECT * INTO auth_info FROM authenticate_request(auth_token);
  
  IF NOT auth_info.is_authenticated OR auth_info.user_role NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only teachers and admins can create assignments';
  END IF;
  
  -- 과제들 생성
  FOR assignment_data IN SELECT * FROM jsonb_array_elements(p_assignments)
  LOOP
    INSERT INTO assignments (
      material_id,
      assigned_to,
      assigned_by,
      due_date,
      status,
      assigned_at
    )
    VALUES (
      (assignment_data->>'material_id')::UUID,
      (assignment_data->>'assigned_to')::UUID,
      auth_info.profile_id,
      (assignment_data->>'due_date')::TIMESTAMPTZ,
      COALESCE(assignment_data->>'status', 'pending'),
      COALESCE((assignment_data->>'assigned_at')::TIMESTAMPTZ, NOW())
    )
    RETURNING * INTO new_assignment;
    
    RETURN NEXT new_assignment;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS 정책 설정

-- Reading Materials 정책
CREATE POLICY "Anyone can read materials" ON reading_materials
  FOR SELECT USING (true);

CREATE POLICY "No direct inserts" ON reading_materials
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct updates" ON reading_materials
  FOR UPDATE USING (false);

CREATE POLICY "No direct deletes" ON reading_materials
  FOR DELETE USING (false);

-- Problems 정책
CREATE POLICY "Anyone can read problems" ON problems
  FOR SELECT USING (true);

CREATE POLICY "No direct problem inserts" ON problems
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct problem updates" ON problems
  FOR UPDATE USING (false);

CREATE POLICY "No direct problem deletes" ON problems
  FOR DELETE USING (false);

-- Assignments 정책
CREATE POLICY "Anyone can read assignments" ON assignments
  FOR SELECT USING (true);

CREATE POLICY "No direct assignment inserts" ON assignments
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct assignment updates" ON assignments
  FOR UPDATE USING (false);

CREATE POLICY "No direct assignment deletes" ON assignments
  FOR DELETE USING (false);

-- 8. 권한 부여
GRANT EXECUTE ON FUNCTION authenticate_request(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_reading_material(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_problems(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_assignments(TEXT, JSONB) TO anon, authenticated;

-- 9. 디버깅을 위한 테스트 함수
CREATE OR REPLACE FUNCTION test_auth_system(auth_token TEXT)
RETURNS TABLE (
  message TEXT,
  auth_info JSONB
) AS $$
DECLARE
  auth_record RECORD;
BEGIN
  -- 인증 확인
  SELECT * INTO auth_record FROM authenticate_request(auth_token);
  
  IF auth_record.is_authenticated THEN
    RETURN QUERY SELECT 
      'Authentication successful' as message,
      jsonb_build_object(
        'user_id', auth_record.user_id,
        'profile_id', auth_record.profile_id,
        'role', auth_record.user_role,
        'is_authenticated', auth_record.is_authenticated
      ) as auth_info;
  ELSE
    RETURN QUERY SELECT 
      'Authentication failed' as message,
      jsonb_build_object('error', 'Invalid or expired token') as auth_info;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION test_auth_system(TEXT) TO anon, authenticated;