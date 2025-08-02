-- Supabase 데이터베이스 스키마
-- 원바이트 프로 프로젝트

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI 생성 로그 테이블
CREATE TABLE IF NOT EXISTS ai_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'claude', 'gemini')),
    content_type VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    target_age VARCHAR(50),
    difficulty VARCHAR(50),
    content_length INTEGER,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 생성된 콘텐츠 저장 테이블
CREATE TABLE IF NOT EXISTS generated_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API 키 저장 테이블 (암호화됨)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    encrypted_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider)
);

-- 읽기 템플릿 테이블
CREATE TABLE IF NOT EXISTS reading_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content_structure JSONB NOT NULL,
    target_age VARCHAR(50),
    difficulty_level VARCHAR(50),
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PDF 생성 로그 테이블
CREATE TABLE IF NOT EXISTS pdf_generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES generated_content(id) ON DELETE SET NULL,
    file_name VARCHAR(500) NOT NULL,
    file_size INTEGER,
    page_count INTEGER,
    generation_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_created_at ON ai_generations(created_at);
CREATE INDEX idx_generated_content_user_id ON generated_content(user_id);
CREATE INDEX idx_generated_content_content_type ON generated_content(content_type);
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);

-- RLS (Row Level Security) 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_generation_logs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 볼 수 있도록 정책 설정
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own generations" ON ai_generations
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own content" ON generated_content
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own activities" ON user_activities
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own API keys" ON api_keys
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Anyone can view active templates" ON reading_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON reading_templates
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    ));

CREATE POLICY "Users can view own PDF logs" ON pdf_generation_logs
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_content_updated_at BEFORE UPDATE ON generated_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_templates_updated_at BEFORE UPDATE ON reading_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 관리자 계정 생성 (비밀번호는 bcrypt로 해시된 'admin123')
-- 실제 운영시에는 반드시 변경해야 함
INSERT INTO users (email, password_hash, role, is_active)
VALUES ('admin@onbyte.com', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l4bVeQgDL6td8C/X6HsBbUd4.y.', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- 샘플 템플릿 데이터
INSERT INTO reading_templates (title, description, content_structure, target_age, difficulty_level, category, is_active)
VALUES 
(
    '기초 어휘 학습 템플릿',
    '일상생활에서 자주 사용하는 기초 어휘를 학습하는 템플릿',
    '{
        "sections": [
            {
                "type": "vocabulary",
                "title": "오늘의 단어",
                "wordCount": 10,
                "includeDefinition": true,
                "includeExample": true
            },
            {
                "type": "exercise",
                "title": "연습 문제",
                "questionCount": 5,
                "questionTypes": ["matching", "fill-in-blank"]
            }
        ]
    }'::jsonb,
    'elementary',
    'beginner',
    'vocabulary',
    true
),
(
    '읽기 이해력 템플릿',
    '짧은 글을 읽고 내용을 이해하는 능력을 기르는 템플릿',
    '{
        "sections": [
            {
                "type": "reading",
                "title": "읽기 지문",
                "paragraphCount": 3,
                "wordCount": 200
            },
            {
                "type": "comprehension",
                "title": "이해도 확인",
                "questionCount": 5,
                "questionTypes": ["multiple-choice", "true-false", "short-answer"]
            }
        ]
    }'::jsonb,
    'middle',
    'intermediate',
    'reading',
    true
);