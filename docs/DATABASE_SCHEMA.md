# 데이터베이스 스키마 설계

## 1. 데이터베이스 개요

원바이트 Print 모드는 Supabase PostgreSQL을 사용하여 다음과 같은 데이터를 관리합니다:

- **사용자 관리**: 인증, 프로필, 구독 정보
- **프로젝트/문서 관리**: A4 페이지 데이터, 블록 구조
- **템플릿 시스템**: 재사용 가능한 레이아웃 템플릿
- **AI 생성 로그**: AI 사용 추적 및 최적화
- **PDF 내보내기**: 내보내기 기록 및 파일 관리

## 2. 전체 스키마 구조

```
사용자 시스템
├── auth.users (Supabase 기본)
├── user_profiles
├── user_subscriptions
└── user_preferences

콘텐츠 관리
├── projects
├── project_versions
├── blocks
└── block_relationships

템플릿 시스템
├── templates
├── template_categories
└── template_usage_stats

AI 및 생성
├── ai_generation_logs
├── ai_usage_stats
└── ai_prompt_templates

내보내기 및 파일
├── pdf_exports
├── file_uploads
└── export_history

시스템 관리
├── activity_logs
├── error_logs
└── system_settings
```

## 3. 상세 스키마 정의

### 3.1 사용자 관리 테이블

```sql
-- 사용자 프로필 (auth.users 확장)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  language_preference TEXT DEFAULT 'ko',
  timezone TEXT DEFAULT 'Asia/Seoul',
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_projects INTEGER DEFAULT 0,
  total_ai_generations INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 구독 정보
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'premium', 'enterprise')),
  plan_name TEXT NOT NULL,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  price_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'KRW',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 환경설정
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  editor_theme TEXT DEFAULT 'light' CHECK (editor_theme IN ('light', 'dark', 'auto')),
  default_font_family TEXT DEFAULT 'Noto Sans KR',
  default_font_size INTEGER DEFAULT 14,
  auto_save_interval INTEGER DEFAULT 30, -- seconds
  show_grid BOOLEAN DEFAULT TRUE,
  show_rulers BOOLEAN DEFAULT TRUE,
  snap_to_grid BOOLEAN DEFAULT TRUE,
  grid_size INTEGER DEFAULT 10, -- pixels
  default_page_margins JSONB DEFAULT '{"top": 20, "right": 20, "bottom": 20, "left": 20}',
  ai_provider_preference TEXT DEFAULT 'gemini' CHECK (ai_provider_preference IN ('gemini', 'claude', 'auto')),
  export_quality TEXT DEFAULT 'high' CHECK (export_quality IN ('draft', 'standard', 'high')),
  notifications JSONB DEFAULT '{"email": true, "push": false, "marketing": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### 3.2 프로젝트 및 콘텐츠 관리

```sql
-- 프로젝트/문서 메인 테이블
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  
  -- 페이지 설정
  page_format TEXT DEFAULT 'A4' CHECK (page_format IN ('A4', 'A3', 'Letter', 'Legal')),
  page_orientation TEXT DEFAULT 'portrait' CHECK (page_orientation IN ('portrait', 'landscape')),
  page_margins JSONB DEFAULT '{"top": 20, "right": 20, "bottom": 20, "left": 20}',
  
  -- 문서 상태
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
  version INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT FALSE,
  is_template BOOLEAN DEFAULT FALSE,
  
  -- 메타데이터
  tags TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'ko',
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  target_age TEXT CHECK (target_age IN ('child', 'teen', 'adult', 'senior')),
  learning_objectives TEXT[],
  
  -- 통계
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  
  -- 타임스탬프
  published_at TIMESTAMP WITH TIME ZONE,
  last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 프로젝트 버전 관리
CREATE TABLE project_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_snapshot JSONB NOT NULL, -- 전체 블록 데이터
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, version_number)
);

-- 블록 데이터 테이블
CREATE TABLE blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  -- 블록 기본 정보
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'table', 'quiz', 'drawing', 'video', 'audio', 'embed')),
  order_index INTEGER NOT NULL,
  layer INTEGER DEFAULT 0,
  
  -- 위치 및 크기 (픽셀 단위)
  position_x DECIMAL(10,2) NOT NULL DEFAULT 0,
  position_y DECIMAL(10,2) NOT NULL DEFAULT 0,
  width DECIMAL(10,2) NOT NULL DEFAULT 100,
  height DECIMAL(10,2) NOT NULL DEFAULT 50,
  rotation DECIMAL(5,2) DEFAULT 0,
  
  -- 블록 내용
  content JSONB NOT NULL,
  
  -- 스타일링
  styles JSONB DEFAULT '{}',
  
  -- 상태
  is_locked BOOLEAN DEFAULT FALSE,
  is_visible BOOLEAN DEFAULT TRUE,
  is_selected BOOLEAN DEFAULT FALSE,
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 블록 관계 (그룹핑, 링크 등)
CREATE TABLE block_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_block_id UUID REFERENCES blocks(id) ON DELETE CASCADE NOT NULL,
  child_block_id UUID REFERENCES blocks(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('group', 'link', 'dependency')),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_block_id, child_block_id, relationship_type)
);
```

### 3.3 템플릿 시스템

```sql
-- 템플릿 카테고리
CREATE TABLE template_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 템플릿 메인 테이블
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES template_categories(id) ON DELETE SET NULL,
  
  -- 기본 정보
  name TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  description TEXT,
  description_ko TEXT,
  
  -- 미리보기
  preview_image_url TEXT,
  thumbnail_url TEXT,
  
  -- 템플릿 구조
  blocks JSONB NOT NULL, -- 블록 데이터
  page_settings JSONB DEFAULT '{}',
  default_content JSONB DEFAULT '{}',
  
  -- 메타데이터
  tags TEXT[] DEFAULT '{}',
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  target_age TEXT CHECK (target_age IN ('child', 'teen', 'adult', 'senior')),
  subject_areas TEXT[] DEFAULT '{}',
  
  -- 상태 및 권한
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  
  -- 통계
  usage_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- 작성자 정보
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- 타임스탬프
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 템플릿 사용 통계
CREATE TABLE template_usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_status TEXT CHECK (completion_status IN ('started', 'completed', 'abandoned')),
  UNIQUE(template_id, user_id, project_id)
);

-- 템플릿 평가
CREATE TABLE template_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);
```

### 3.4 AI 생성 및 로깅

```sql
-- AI 생성 로그
CREATE TABLE ai_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
  
  -- 요청 정보
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'claude')),
  model_name TEXT,
  content_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  prompt_tokens INTEGER,
  
  -- 응답 정보
  generated_content JSONB NOT NULL,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  
  -- 성능 메트릭
  generation_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  -- 품질 평가
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,
  
  -- 설정 정보
  generation_params JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 사용량 통계 (일별)
CREATE TABLE ai_usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  
  -- 사용량 통계
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  
  -- 토큰 사용량
  total_tokens INTEGER DEFAULT 0,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  
  -- 제공업체별 통계
  gemini_requests INTEGER DEFAULT 0,
  claude_requests INTEGER DEFAULT 0,
  
  -- 콘텐츠 타입별 통계
  vocabulary_requests INTEGER DEFAULT 0,
  grammar_requests INTEGER DEFAULT 0,
  reading_requests INTEGER DEFAULT 0,
  quiz_requests INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- AI 프롬프트 템플릿
CREATE TABLE ai_prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  target_age TEXT CHECK (target_age IN ('child', 'teen', 'adult', 'senior')),
  
  -- 프롬프트 내용
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  example_inputs JSONB DEFAULT '[]',
  example_outputs JSONB DEFAULT '[]',
  
  -- 메타데이터
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- 성능 통계
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.5 파일 및 내보내기 관리

```sql
-- 파일 업로드 관리
CREATE TABLE file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
  
  -- 파일 정보
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_hash TEXT,
  
  -- 이미지 메타데이터 (이미지인 경우)
  image_width INTEGER,
  image_height INTEGER,
  image_format TEXT,
  
  -- 상태
  upload_status TEXT DEFAULT 'completed' CHECK (upload_status IN ('uploading', 'completed', 'failed', 'deleted')),
  is_public BOOLEAN DEFAULT FALSE,
  
  -- CDN 정보
  cdn_url TEXT,
  thumbnail_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF 내보내기 로그
CREATE TABLE pdf_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  -- 내보내기 설정
  export_settings JSONB DEFAULT '{}',
  page_format TEXT DEFAULT 'A4',
  page_orientation TEXT DEFAULT 'portrait',
  quality TEXT DEFAULT 'high' CHECK (quality IN ('draft', 'standard', 'high')),
  
  -- 파일 정보
  file_path TEXT,
  file_size INTEGER,
  file_hash TEXT,
  
  -- 처리 정보
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_time_ms INTEGER,
  error_message TEXT,
  
  -- 다운로드 통계
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 내보내기 히스토리 (요약 정보)
CREATE TABLE export_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'image', 'html', 'docx')),
  
  -- 통계 정보
  total_exports INTEGER DEFAULT 0,
  successful_exports INTEGER DEFAULT 0,
  failed_exports INTEGER DEFAULT 0,
  
  -- 날짜별 그룹핑
  export_date DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, export_type, export_date)
);
```

### 3.6 시스템 로깅 및 관리

```sql
-- 사용자 활동 로그
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 활동 정보
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  resource_type TEXT, -- 'project', 'template', 'block' etc.
  resource_id UUID,
  
  -- 메타데이터
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- 추가 데이터
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 에러 로그
CREATE TABLE error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- 에러 정보
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  
  -- 컨텍스트
  endpoint TEXT,
  http_method TEXT,
  request_body JSONB,
  
  -- 환경 정보
  user_agent TEXT,
  ip_address INET,
  
  -- 심각도
  severity TEXT DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  
  -- 해결 상태
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 시스템 설정
CREATE TABLE system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. 인덱스 및 최적화

```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_tags ON projects USING GIN(tags);

CREATE INDEX idx_blocks_project_id ON blocks(project_id);
CREATE INDEX idx_blocks_type ON blocks(type);
CREATE INDEX idx_blocks_order ON blocks(project_id, order_index);

CREATE INDEX idx_templates_category ON templates(category_id);
CREATE INDEX idx_templates_public ON templates(is_public);
CREATE INDEX idx_templates_featured ON templates(is_featured);
CREATE INDEX idx_templates_usage ON templates(usage_count DESC);

CREATE INDEX idx_ai_logs_user_id ON ai_generation_logs(user_id);
CREATE INDEX idx_ai_logs_created_at ON ai_generation_logs(created_at DESC);
CREATE INDEX idx_ai_logs_provider ON ai_generation_logs(provider);

CREATE INDEX idx_ai_stats_user_date ON ai_usage_stats(user_id, date);

CREATE INDEX idx_files_user_id ON file_uploads(user_id);
CREATE INDEX idx_files_project_id ON file_uploads(project_id);

CREATE INDEX idx_pdf_exports_user_id ON pdf_exports(user_id);
CREATE INDEX idx_pdf_exports_status ON pdf_exports(processing_status);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
```

## 5. RLS (Row Level Security) 정책

```sql
-- 사용자 프로필 보안
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- 프로젝트 보안
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can create own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- 블록 보안
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access blocks of own projects" ON blocks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = blocks.project_id 
    AND (projects.user_id = auth.uid() OR projects.is_public = true)
  )
);

-- 템플릿 보안
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public templates" ON templates FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own templates" ON templates FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create templates" ON templates FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own templates" ON templates FOR UPDATE USING (auth.uid() = created_by);

-- AI 로그 보안
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own AI logs" ON ai_generation_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own AI logs" ON ai_generation_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 파일 업로드 보안
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own files" ON file_uploads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public files are accessible" ON file_uploads FOR SELECT USING (is_public = true);
```

## 6. 함수 및 트리거

```sql
-- 자동 타임스탬프 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 프로젝트 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_profiles 
        SET total_projects = total_projects + 1 
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_profiles 
        SET total_projects = total_projects - 1 
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_project_count 
AFTER INSERT OR DELETE ON projects 
FOR EACH ROW EXECUTE FUNCTION update_project_stats();

-- AI 사용량 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_ai_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO ai_usage_stats (user_id, date, total_requests, successful_requests, failed_requests, total_tokens, prompt_tokens, completion_tokens)
    VALUES (
        NEW.user_id,
        CURRENT_DATE,
        1,
        CASE WHEN NEW.success THEN 1 ELSE 0 END,
        CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
        COALESCE(NEW.total_tokens, 0),
        COALESCE(NEW.prompt_tokens, 0),
        COALESCE(NEW.completion_tokens, 0)
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
        total_requests = ai_usage_stats.total_requests + 1,
        successful_requests = ai_usage_stats.successful_requests + CASE WHEN NEW.success THEN 1 ELSE 0 END,
        failed_requests = ai_usage_stats.failed_requests + CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
        total_tokens = ai_usage_stats.total_tokens + COALESCE(NEW.total_tokens, 0),
        prompt_tokens = ai_usage_stats.prompt_tokens + COALESCE(NEW.prompt_tokens, 0),
        completion_tokens = ai_usage_stats.completion_tokens + COALESCE(NEW.completion_tokens, 0),
        updated_at = NOW();
    
    -- 사용자 프로필의 총 AI 생성 수 업데이트
    UPDATE user_profiles 
    SET total_ai_generations = total_ai_generations + 1 
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_stats_trigger 
AFTER INSERT ON ai_generation_logs 
FOR EACH ROW EXECUTE FUNCTION update_ai_usage_stats();
```

## 7. 초기 데이터 삽입

```sql
-- 기본 템플릿 카테고리
INSERT INTO template_categories (name, name_ko, description, icon, color, order_index) VALUES
('vocabulary', '어휘 학습', '단어와 표현을 학습하는 템플릿', 'book-open', '#3B82F6', 1),
('grammar', '문법 학습', '한국어 문법을 학습하는 템플릿', 'edit-3', '#10B981', 2),
('reading', '읽기 연습', '읽기 능력을 향상시키는 템플릿', 'file-text', '#F59E0B', 3),
('quiz', '퀴즈', '학습 내용을 확인하는 퀴즈 템플릿', 'help-circle', '#EF4444', 4),
('worksheet', '워크시트', '다양한 연습 문제가 있는 템플릿', 'clipboard', '#8B5CF6', 5);

-- 기본 시스템 설정
INSERT INTO system_settings (key, value, description, is_public) VALUES
('ai_providers', '{"primary": "gemini", "fallback": "claude", "enabled": true}', 'AI 제공업체 설정', false),
('file_upload_limits', '{"max_size_mb": 10, "allowed_types": ["image/jpeg", "image/png", "image/gif", "image/webp"]}', '파일 업로드 제한', false),
('subscription_limits', '{"free": {"projects": 5, "ai_requests_daily": 50}, "basic": {"projects": 50, "ai_requests_daily": 500}, "premium": {"projects": -1, "ai_requests_daily": 2000}}', '구독 계획별 제한', false),
('app_version', '"1.0.0"', '애플리케이션 버전', true),
('maintenance_mode', 'false', '유지보수 모드', true);

-- AI 프롬프트 템플릿 예시
INSERT INTO ai_prompt_templates (name, content_type, difficulty_level, target_age, system_prompt, user_prompt_template, description) VALUES
('기본 어휘 학습', 'vocabulary', 'intermediate', 'adult', 
'당신은 한국어 교육 전문가입니다. 외국인 학습자를 위한 어휘 학습 자료를 생성해주세요.',
'다음 주제에 대한 한국어 어휘 학습 자료를 생성해주세요: {{topic}}. 난이도: {{difficulty}}, 대상: {{target_age}}',
'일반적인 어휘 학습용 기본 템플릿'),

('문법 설명', 'grammar', 'intermediate', 'adult',
'당신은 한국어 문법 전문가입니다. 명확하고 이해하기 쉬운 문법 설명을 작성해주세요.',
'다음 한국어 문법에 대해 설명해주세요: {{grammar_point}}. 예문과 함께 {{difficulty}} 수준으로 설명해주세요.',
'한국어 문법 규칙 설명용 템플릿');
```

이 데이터베이스 스키마는 원바이트 Print 모드의 모든 기능을 지원하며, 확장성과 성능을 고려하여 설계되었습니다. 사용자 경험과 시스템 안정성을 보장하는 동시에 AI 기반 콘텐츠 생성과 PDF 내보내기 기능을 효율적으로 지원합니다.