-- 실용적인 RLS 해결책
-- 커스텀 인증 시스템과 호환되도록 RLS 정책 재구성

-- 1. RLS 활성화
ALTER TABLE reading_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제
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

-- 3. 인증된 요청을 위한 함수 생성
-- 이 함수는 API 호출 시 사용됩니다
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

-- 4. 데이터 접근을 위한 보안 함수들

-- 4-1. Reading Materials 생성 함수
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
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- 자료 생성
  INSERT INTO reading_materials (title, content, topic, level, word_count, created_by)
  VALUES (p_title, p_content, p_topic, p_level, p_word_count, auth_info.profile_id)
  RETURNING * INTO new_material;
  
  RETURN new_material;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4-2. Problems 생성 함수
CREATE OR REPLACE FUNCTION create_problems(
  auth_token TEXT,
  p_problems JSONB
) RETURNS SETOF problems AS $$
DECLARE
  auth_info RECORD;
  problem_data JSONB;
BEGIN
  -- 인증 확인
  SELECT * INTO auth_info FROM authenticate_request(auth_token);
  
  IF NOT auth_info.is_authenticated OR auth_info.user_role NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- 문제들 생성
  FOR problem_data IN SELECT * FROM jsonb_array_elements(p_problems)
  LOOP
    RETURN NEXT (
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
      RETURNING *
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4-3. Assignments 생성 함수
CREATE OR REPLACE FUNCTION create_assignments(
  auth_token TEXT,
  p_assignments JSONB
) RETURNS SETOF assignments AS $$
DECLARE
  auth_info RECORD;
  assignment_data JSONB;
BEGIN
  -- 인증 확인
  SELECT * INTO auth_info FROM authenticate_request(auth_token);
  
  IF NOT auth_info.is_authenticated OR auth_info.user_role NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- 과제들 생성
  FOR assignment_data IN SELECT * FROM jsonb_array_elements(p_assignments)
  LOOP
    RETURN NEXT (
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
      RETURNING *
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS 정책 - 읽기는 허용, 쓰기는 함수를 통해서만

-- Reading Materials
CREATE POLICY "Anyone can read materials" ON reading_materials
  FOR SELECT USING (true);

CREATE POLICY "Only through functions" ON reading_materials
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Only through functions for update" ON reading_materials
  FOR UPDATE USING (false);

CREATE POLICY "Only through functions for delete" ON reading_materials
  FOR DELETE USING (false);

-- Problems
CREATE POLICY "Anyone can read problems" ON problems
  FOR SELECT USING (true);

CREATE POLICY "Only through functions for problems" ON problems
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Only through functions for problems update" ON problems
  FOR UPDATE USING (false);

CREATE POLICY "Only through functions for problems delete" ON problems
  FOR DELETE USING (false);

-- Assignments
CREATE POLICY "Anyone can read assignments" ON assignments
  FOR SELECT USING (true);

CREATE POLICY "Only through functions for assignments" ON assignments
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Students can update their assignment status" ON assignments
  FOR UPDATE USING (false) WITH CHECK (false);

CREATE POLICY "Only through functions for assignments delete" ON assignments
  FOR DELETE USING (false);

-- 6. 권한 부여
GRANT EXECUTE ON FUNCTION authenticate_request(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_reading_material(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_problems(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_assignments(TEXT, JSONB) TO anon, authenticated;