-- 원바이트 PRO 업데이트된 데이터베이스 스키마
-- 회원가입 시 요구 정보 추가: 이메일(아이디), 이름, 학년, 학교, 연락처

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 사용자 프로필 (profiles) - 업데이트됨
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,  -- 아이디로 사용
  full_name TEXT NOT NULL,     -- 이름
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'parent', 'admin')),
  grade_level TEXT,            -- 학년 (예: '초4', '중1', '고2')
  school_name TEXT,            -- 학교명
  phone_number TEXT,           -- 연락처
  avatar_url TEXT,
  parent_id UUID REFERENCES profiles(id),
  teacher_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로필 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_id ON profiles(teacher_id);
CREATE INDEX IF NOT EXISTS idx_profiles_parent_id ON profiles(parent_id);

-- =====================================================
-- Row Level Security (RLS) 정책 - profiles
-- =====================================================

-- profiles 테이블 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can view their students" ON profiles;
DROP POLICY IF EXISTS "Parents can view their children" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 새로운 정책 생성
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can view their students" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT teacher_id FROM profiles WHERE id = profiles.id
    )
  );

CREATE POLICY "Parents can view their children" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT parent_id FROM profiles WHERE id = profiles.id
    )
  );

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- Functions & Triggers
-- =====================================================

-- 프로필 업데이트 시간 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거가 이미 존재하는지 확인하고 생성
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 초기 관리자 계정 생성 함수
-- =====================================================
CREATE OR REPLACE FUNCTION create_admin_profile(
  admin_email TEXT,
  admin_name TEXT,
  admin_id UUID
)
RETURNS void AS $$
BEGIN
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    grade_level,
    school_name,
    phone_number
  ) VALUES (
    admin_id,
    admin_email,
    admin_name,
    'admin',
    NULL,
    '원바이트 PRO',
    NULL
  ) ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 학년 레벨 표준화 함수
-- =====================================================
CREATE OR REPLACE FUNCTION standardize_grade_level(grade TEXT)
RETURNS TEXT AS $$
BEGIN
  -- 초등학교
  IF grade LIKE '%초%1%' OR grade = '초1' THEN RETURN 'elem1';
  ELSIF grade LIKE '%초%2%' OR grade = '초2' THEN RETURN 'elem2';
  ELSIF grade LIKE '%초%3%' OR grade = '초3' THEN RETURN 'elem3';
  ELSIF grade LIKE '%초%4%' OR grade = '초4' THEN RETURN 'elem4';
  ELSIF grade LIKE '%초%5%' OR grade = '초5' THEN RETURN 'elem5';
  ELSIF grade LIKE '%초%6%' OR grade = '초6' THEN RETURN 'elem6';
  -- 중학교
  ELSIF grade LIKE '%중%1%' OR grade = '중1' THEN RETURN 'mid1';
  ELSIF grade LIKE '%중%2%' OR grade = '중2' THEN RETURN 'mid2';
  ELSIF grade LIKE '%중%3%' OR grade = '중3' THEN RETURN 'mid3';
  -- 고등학교
  ELSIF grade LIKE '%고%1%' OR grade = '고1' THEN RETURN 'high1';
  ELSIF grade LIKE '%고%2%' OR grade = '고2' THEN RETURN 'high2';
  ELSIF grade LIKE '%고%3%' OR grade = '고3' THEN RETURN 'high3';
  -- 기타
  ELSE RETURN 'unknown';
  END IF;
END;
$$ LANGUAGE plpgsql;