-- Claude API 통합을 위한 데이터베이스 스키마

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
  project_id UUID REFERENCES projects(id),
  variables_used JSONB,
  tokens_used INTEGER,
  generation_time INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 생성 로그 확장
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  template_id UUID REFERENCES reading_templates(id),
  prompt TEXT NOT NULL,
  content_type TEXT NOT NULL,
  ai_provider TEXT NOT NULL,
  generated_content JSONB NOT NULL,
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

-- 인덱스 생성
CREATE INDEX idx_reading_templates_content_type ON reading_templates(content_type);
CREATE INDEX idx_reading_templates_created_by ON reading_templates(created_by);
CREATE INDEX idx_generated_readings_template_id ON generated_readings(template_id);
CREATE INDEX idx_generated_readings_generated_by ON generated_readings(generated_by);
CREATE INDEX idx_ai_generation_logs_user_id ON ai_generation_logs(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 기본 권한 데이터 삽입
INSERT INTO admin_roles (role_name, permissions) VALUES 
('super_admin', '{"all": true}'),
('content_admin', '{"generate_content": true, "manage_templates": true, "view_analytics": true}'),
('viewer', '{"view_analytics": true}')
ON CONFLICT (role_name) DO NOTHING;

-- RLS (Row Level Security) 정책
ALTER TABLE reading_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- 템플릿은 모든 인증된 사용자가 읽을 수 있지만, 관리자만 생성/수정 가능
CREATE POLICY "Templates are viewable by authenticated users" ON reading_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Templates are editable by admins only" ON reading_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- 생성된 지문은 생성자와 관리자만 접근 가능
CREATE POLICY "Generated readings are viewable by creator and admins" ON generated_readings
  FOR SELECT USING (
    generated_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- 트리거: updated_at 자동 업데이트
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