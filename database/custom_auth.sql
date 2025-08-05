-- 커스텀 인증을 위한 테이블 생성
-- Supabase Auth 대신 자체 인증 시스템 구현

-- 1. 사용자 인증 테이블 생성
CREATE TABLE IF NOT EXISTS user_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_auth_username ON user_auth(username);
CREATE INDEX IF NOT EXISTS idx_user_auth_email ON user_auth(email);

-- 3. profiles 테이블과 연결
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES user_auth(id);

-- 4. RLS 활성화
ALTER TABLE user_auth ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책
CREATE POLICY "Public can create auth entries" ON user_auth
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own auth" ON user_auth
  FOR SELECT USING (true);

CREATE POLICY "Users can update own auth" ON user_auth
  FOR UPDATE USING (id = current_setting('app.current_user_id')::uuid);

-- 6. 세션 테이블
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 세션 인덱스
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- 8. 세션 RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Public can create sessions" ON user_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (user_id = current_setting('app.current_user_id')::uuid);