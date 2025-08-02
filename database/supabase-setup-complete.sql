-- 전체 Supabase 설정을 한 번에 실행하는 SQL 스크립트
-- 이 전체 내용을 복사해서 Supabase SQL Editor에 붙여넣고 Run 하세요!

-- ========================================
-- 1. 테이블 생성
-- ========================================

-- 관리자 권한 테이블
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name TEXT UNIQUE NOT NULL,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 관리자 사용자 테이블
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role_id UUID REFERENCES admin_roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 지문 템플릿 테이블
CREATE TABLE IF NOT EXISTS reading_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('vocabulary', 'grammar', 'reading', 'quiz', 'questions', 'answers')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  target_age TEXT NOT NULL,
  template_prompt TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 생성된 지문 저장
CREATE TABLE IF NOT EXISTS generated_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES reading_templates(id),
  generated_content JSONB NOT NULL,
  ai_provider TEXT NOT NULL CHECK (ai_provider IN ('claude', 'gemini')),
  generated_by UUID REFERENCES auth.users(id),
  project_id UUID,
  variables_used JSONB,
  tokens_used INTEGER,
  generation_time INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 생성 로그
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  template_id UUID REFERENCES reading_templates(id),
  prompt TEXT NOT NULL,
  content_type TEXT NOT NULL,
  ai_provider TEXT NOT NULL,
  generated_content JSONB,
  tokens_used INTEGER,
  cost_estimate DECIMAL(10,4),
  error_message TEXT,
  success BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 감사 로그 테이블
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  request_data JSONB,
  response_status INTEGER,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. 인덱스 생성
-- ========================================

CREATE INDEX IF NOT EXISTS idx_reading_templates_content_type ON reading_templates(content_type);
CREATE INDEX IF NOT EXISTS idx_reading_templates_created_by ON reading_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_generated_readings_template_id ON generated_readings(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_readings_generated_by ON generated_readings(generated_by);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_user_id ON ai_generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ========================================
-- 3. 기본 권한 데이터 삽입
-- ========================================

INSERT INTO admin_roles (role_name, permissions) VALUES 
('super_admin', '{"all": true}'),
('content_admin', '{"generate_content": true, "manage_templates": true, "view_analytics": true}'),
('viewer', '{"view_analytics": true}')
ON CONFLICT (role_name) DO NOTHING;

-- ========================================
-- 4. RLS (Row Level Security) 정책
-- ========================================

ALTER TABLE reading_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- 템플릿 읽기 권한
CREATE POLICY "Templates are viewable by authenticated users" ON reading_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- 템플릿 수정 권한
CREATE POLICY "Templates are editable by admins only" ON reading_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- 생성된 지문 읽기 권한
CREATE POLICY "Generated readings are viewable by creator and admins" ON generated_readings
  FOR SELECT USING (
    generated_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- ========================================
-- 5. 트리거 생성
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reading_templates_updated_at 
  BEFORE UPDATE ON reading_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. 테스트 데이터 및 확인
-- ========================================

-- 권한 확인
SELECT * FROM admin_roles;

-- 사용자 목록 확인
SELECT id, email, created_at FROM auth.users LIMIT 10;

-- ========================================
-- 7. 첫 번째 관리자 추가 (이메일 수정 필요!)
-- ========================================
-- 아래 쿼리는 주석 처리되어 있습니다. 
-- 먼저 Supabase Authentication에서 사용자를 생성한 후,
-- 해당 이메일로 아래 쿼리를 수정해서 실행하세요.

/*
-- 방법 1: 이메일로 관리자 추가
INSERT INTO admin_users (id, role_id)
SELECT 
  u.id,
  r.id
FROM auth.users u, admin_roles r
WHERE u.email = 'your-email@example.com'  -- 여기에 실제 이메일 입력!
AND r.role_name = 'content_admin'
ON CONFLICT (id) DO NOTHING;

-- 방법 2: User ID로 직접 추가 (Authentication에서 복사)
INSERT INTO admin_users (id, role_id)
VALUES (
  'paste-user-id-here',  -- User ID 붙여넣기
  (SELECT id FROM admin_roles WHERE role_name = 'content_admin')
)
ON CONFLICT (id) DO NOTHING;
*/

-- 관리자 확인
SELECT 
  au.*, 
  ar.role_name, 
  ar.permissions,
  u.email
FROM admin_users au
JOIN admin_roles ar ON au.role_id = ar.id
JOIN auth.users u ON au.id = u.id;