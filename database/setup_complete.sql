-- 원바이트 PRO 전체 데이터베이스 설정 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 1. UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 프로필 테이블 생성
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'parent', 'admin')),
  grade_level TEXT,
  school_name TEXT,
  phone_number TEXT,
  teacher_id UUID REFERENCES profiles(id),
  parent_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 읽기 자료 테이블
CREATE TABLE IF NOT EXISTS reading_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  topic TEXT,
  level TEXT CHECK (level IN ('easy', 'medium', 'hard')),
  word_count INTEGER,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 문제 테이블
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES reading_materials(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB,
  correct_answer INTEGER,
  explanation TEXT,
  type TEXT CHECK (type IN ('objective', 'subjective')),
  category TEXT,
  points INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 과제 테이블
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES reading_materials(id),
  assigned_to UUID REFERENCES profiles(id),
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed'))
);

-- 6. 일일 학습 통계 테이블
CREATE TABLE IF NOT EXISTS daily_learning_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  characters_read INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 0,
  total_study_time INTEGER DEFAULT 0, -- 분 단위
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 7. 학습 성취 테이블
CREATE TABLE IF NOT EXISTS learning_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_id ON profiles(teacher_id);
CREATE INDEX IF NOT EXISTS idx_profiles_parent_id ON profiles(parent_id);
CREATE INDEX IF NOT EXISTS idx_reading_materials_created_by ON reading_materials(created_by);
CREATE INDEX IF NOT EXISTS idx_problems_material_id ON problems(material_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_by ON assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_daily_learning_stats_user_date ON daily_learning_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_learning_achievements_user_id ON learning_achievements(user_id);

-- 9. RLS (Row Level Security) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_learning_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_achievements ENABLE ROW LEVEL SECURITY;

-- 10. RLS 정책 생성

-- Profiles 정책
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Teachers can view their students" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'teacher'
      AND profiles.teacher_id = p.id
    )
  );

CREATE POLICY "Parents can view their children" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'parent'
      AND profiles.parent_id = p.id
    )
  );

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public profiles can be created during signup" ON profiles
  FOR INSERT WITH CHECK (true);

-- Reading Materials 정책
CREATE POLICY "Users can view materials" ON reading_materials
  FOR SELECT USING (true);

CREATE POLICY "Teachers and admins can create materials" ON reading_materials
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Problems 정책
CREATE POLICY "Users can view problems" ON problems
  FOR SELECT USING (true);

CREATE POLICY "Teachers and admins can create problems" ON problems
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Assignments 정책
CREATE POLICY "Users can view their assignments" ON assignments
  FOR SELECT USING (
    assigned_to = auth.uid() OR assigned_by = auth.uid()
  );

CREATE POLICY "Teachers can create assignments" ON assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Users can update their assignments" ON assignments
  FOR UPDATE USING (assigned_to = auth.uid());

-- Daily Learning Stats 정책
CREATE POLICY "Users can view own stats" ON daily_learning_stats
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own stats" ON daily_learning_stats
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own stats" ON daily_learning_stats
  FOR UPDATE USING (user_id = auth.uid());

-- Learning Achievements 정책
CREATE POLICY "Users can view own achievements" ON learning_achievements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create achievements" ON learning_achievements
  FOR INSERT WITH CHECK (true);

-- 11. 함수 생성: 프로필 자동 생성 (선택사항)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성 (주의: 이미 회원가입 로직이 있다면 생략)
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();