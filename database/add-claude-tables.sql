-- Claude API 통합을 위해 기존 데이터베이스에 추가할 테이블들
-- 기존 테이블과 충돌하지 않도록 확인하면서 실행하세요!

-- ========================================
-- 1. 새로운 테이블 추가 (기존에 없는 경우만)
-- ========================================

-- 관리자 권한 테이블 (기존에 없는 경우)
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name TEXT UNIQUE NOT NULL,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 관리자 사용자 테이블 (기존에 없는 경우)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role_id UUID REFERENCES admin_roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 지문 템플릿 테이블 (기존에 없는 경우)
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

-- 생성된 지문 저장 (기존에 없는 경우)
CREATE TABLE IF NOT EXISTS generated_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES reading_templates(id),
  generated_content JSONB NOT NULL,
  ai_provider TEXT NOT NULL CHECK (ai_provider IN ('claude', 'gemini')),
  generated_by UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id), -- 기존 projects 테이블 참조
  variables_used JSONB,
  tokens_used INTEGER,
  generation_time INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 생성 로그 확장 (기존 ai_generations 테이블이 있다면 새 테이블로)
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

-- 감사 로그 테이블 (기존에 없는 경우)
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
-- 6. 기존 테이블 확인
-- ========================================

-- 기존 테이블 목록 확인
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 새로 추가된 테이블 확인
SELECT * FROM admin_roles;

-- ========================================
-- 7. 관리자 추가 (사용자 생성 후 실행)
-- ========================================

/*
-- 이메일로 관리자 추가
INSERT INTO admin_users (id, role_id)
SELECT 
  u.id,
  r.id
FROM auth.users u, admin_roles r
WHERE u.email = 'your-email@example.com'  -- 실제 이메일로 변경!
AND r.role_name = 'content_admin'
ON CONFLICT (id) DO NOTHING;
*/