-- EduText Pro 데이터베이스 스키마 설정

-- 1. 사용자 테이블 (확장)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 2. AI 생성 로그 테이블
CREATE TABLE IF NOT EXISTS public.ai_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    provider VARCHAR(50) NOT NULL, -- 'gemini' or 'claude'
    content_type VARCHAR(50) NOT NULL, -- 'reading', 'vocabulary', 'questions', 'answers'
    prompt TEXT NOT NULL,
    response JSONB NOT NULL,
    target_age VARCHAR(20),
    difficulty VARCHAR(20),
    content_length VARCHAR(10),
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 생성된 콘텐츠 저장 테이블
CREATE TABLE IF NOT EXISTS public.generated_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 사용자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. API 키 관리 테이블 (암호화된 키 저장)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    provider VARCHAR(50) NOT NULL,
    encrypted_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON public.ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON public.ai_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_content_user_id ON public.generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- 관리자 계정 생성
INSERT INTO public.users (email, password_hash, role) 
VALUES (
    'admin@inblanq.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 암호화된 '2025'
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- RLS 정책 생성
-- 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id OR role = 'admin');
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own generations" ON public.ai_generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generations" ON public.ai_generations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own content" ON public.generated_content FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activities" ON public.user_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own api keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);