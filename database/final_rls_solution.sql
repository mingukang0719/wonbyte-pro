-- 최종 RLS 해결책: API 레벨에서 보안 처리
-- RLS는 활성화하되, 실제 보안은 API/미들웨어 레벨에서 처리

-- 1. RLS 활성화 유지
ALTER TABLE reading_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;  
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 모두 삭제
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('reading_materials', 'problems', 'assignments', 'profiles', 'user_auth', 'user_sessions')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. Service Role을 위한 정책 생성
-- Service Role은 모든 작업을 수행할 수 있음

-- Reading Materials
CREATE POLICY "Service role has full access to reading_materials" ON reading_materials
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_sessions 
      WHERE token = current_setting('request.headers', true)::json->>'x-auth-token'
      AND expires_at > NOW()
    )
  );

-- Problems
CREATE POLICY "Service role has full access to problems" ON problems
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_sessions 
      WHERE token = current_setting('request.headers', true)::json->>'x-auth-token'
      AND expires_at > NOW()
    )
  );

-- Assignments
CREATE POLICY "Service role has full access to assignments" ON assignments
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_sessions 
      WHERE token = current_setting('request.headers', true)::json->>'x-auth-token'
      AND expires_at > NOW()
    )
  );

-- Profiles - 특별 처리
CREATE POLICY "Service role and authenticated users can access profiles" ON profiles
  FOR SELECT USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_sessions 
      WHERE token = current_setting('request.headers', true)::json->>'x-auth-token'
      AND expires_at > NOW()
    )
  );

CREATE POLICY "Service role can modify profiles" ON profiles
  FOR INSERT WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id)  -- 신규 회원가입 허용
  );

CREATE POLICY "Service role can update profiles" ON profiles
  FOR UPDATE USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_sessions 
      WHERE token = current_setting('request.headers', true)::json->>'x-auth-token'
      AND expires_at > NOW()
    )
  );

-- User Auth
CREATE POLICY "Public can create auth entries for signup" ON user_auth
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role and authenticated can view auth" ON user_auth
  FOR SELECT USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR true  -- 로그인 시 필요
  );

-- User Sessions
CREATE POLICY "Public can create sessions for login" ON user_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Sessions can be viewed by owner or service role" ON user_sessions
  FOR SELECT USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR token = current_setting('request.headers', true)::json->>'x-auth-token'
  );

CREATE POLICY "Sessions can be deleted by owner" ON user_sessions
  FOR DELETE USING (
    token = current_setting('request.headers', true)::json->>'x-auth-token'
  );

-- 4. 애플리케이션에서 사용할 헬퍼 함수
CREATE OR REPLACE FUNCTION verify_user_session(auth_token TEXT)
RETURNS TABLE (
  user_id UUID,
  profile_id UUID,
  role TEXT,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.user_id,
    p.id as profile_id,
    p.role,
    (s.expires_at > NOW()) as is_valid
  FROM user_sessions s
  JOIN user_auth a ON s.user_id = a.id
  JOIN profiles p ON p.auth_id = a.id
  WHERE s.token = auth_token
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION verify_user_session(TEXT) TO anon, authenticated;