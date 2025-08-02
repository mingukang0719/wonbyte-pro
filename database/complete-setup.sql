-- 원바이트 프로 데이터베이스 완전 설정

-- 1. 필요한 함수 먼저 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. 관리자 권한 테이블
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name TEXT UNIQUE NOT NULL,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 관리자 사용자 테이블
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role_id UUID REFERENCES admin_roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 기본 권한 데이터 삽입
INSERT INTO admin_roles (role_name, permissions) VALUES 
('super_admin', '{"all": true}'),
('content_admin', '{"generate_content": true, "manage_templates": true, "view_analytics": true}'),
('viewer', '{"view_analytics": true}')
ON CONFLICT (role_name) DO NOTHING;

-- 5. API 키 저장 테이블
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE CHECK (provider IN ('openai', 'claude', 'gemini')),
  encrypted_key JSONB NOT NULL, -- {encrypted, iv, authTag}
  is_active BOOLEAN DEFAULT TRUE,
  last_used TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. API 키 사용 로그
CREATE TABLE IF NOT EXISTS api_key_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  tokens_used INTEGER,
  cost_estimate DECIMAL(10,4),
  request_type TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_provider ON api_key_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_created_at ON api_key_usage_logs(created_at);

-- 8. RLS 정책 - 관리자만 접근 가능
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage_logs ENABLE ROW LEVEL SECURITY;

-- 9. API 키는 관리자만 접근 가능
CREATE POLICY "API keys are only accessible by admins" ON api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- 10. API 키 사용 로그는 관리자만 볼 수 있음
CREATE POLICY "API key usage logs are viewable by admins only" ON api_key_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- 11. API 키 업데이트시 updated_at 자동 업데이트
CREATE TRIGGER update_api_keys_updated_at 
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. 현재 사용자를 관리자로 등록 (auth.uid()가 있을 경우에만)
DO $$ 
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO admin_users (id, role_id, is_active) 
    VALUES (
      auth.uid(), 
      (SELECT id FROM admin_roles WHERE role_name = 'super_admin'),
      TRUE
    )
    ON CONFLICT (id) DO UPDATE SET is_active = TRUE;
  END IF;
END $$;