-- 원바이트 PRO 데이터베이스 스키마
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 사용자 프로필 (profiles)
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'parent', 'admin')),
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  grade_level TEXT,
  school_name TEXT,
  parent_id UUID REFERENCES profiles(id),
  teacher_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로필 인덱스
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_teacher_id ON profiles(teacher_id);
CREATE INDEX idx_profiles_parent_id ON profiles(parent_id);

-- =====================================================
-- 2. 학습 세션 (learning_sessions)
-- =====================================================
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_characters_read INT DEFAULT 0,
  total_problems_solved INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  session_type TEXT CHECK (session_type IN ('reading', 'vocabulary', 'problem_solving')),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 학습 세션 인덱스
CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_learning_sessions_started_at ON learning_sessions(started_at);

-- =====================================================
-- 3. 읽기 자료 (reading_materials)
-- =====================================================
CREATE TABLE reading_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  topic TEXT,
  character_count INT NOT NULL,
  difficulty_score JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- 읽기 자료 인덱스
CREATE INDEX idx_reading_materials_grade_level ON reading_materials(grade_level);
CREATE INDEX idx_reading_materials_topic ON reading_materials(topic);
CREATE INDEX idx_reading_materials_created_by ON reading_materials(created_by);
CREATE INDEX idx_reading_materials_tags ON reading_materials USING GIN(tags);

-- =====================================================
-- 4. 과제 배정 (assignments)
-- =====================================================
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES reading_materials(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  score DECIMAL(5,2),
  feedback TEXT
);

-- 과제 인덱스
CREATE INDEX idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX idx_assignments_assigned_by ON assignments(assigned_by);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- =====================================================
-- 5. 어휘 학습 진도 (vocabulary_progress)
-- =====================================================
CREATE TABLE vocabulary_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  meaning TEXT,
  context TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  review_count INT DEFAULT 0,
  mastery_level INT DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  next_review_date DATE,
  UNIQUE(user_id, word)
);

-- 어휘 진도 인덱스
CREATE INDEX idx_vocabulary_progress_user_id ON vocabulary_progress(user_id);
CREATE INDEX idx_vocabulary_progress_mastery_level ON vocabulary_progress(mastery_level);
CREATE INDEX idx_vocabulary_progress_next_review ON vocabulary_progress(next_review_date);

-- =====================================================
-- 6. 오답 기록 (wrong_answers)
-- =====================================================
CREATE TABLE wrong_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES learning_sessions(id),
  material_id UUID REFERENCES reading_materials(id),
  question_type TEXT,
  question TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  review_count INT DEFAULT 0,
  is_mastered BOOLEAN DEFAULT false
);

-- 오답 기록 인덱스
CREATE INDEX idx_wrong_answers_user_id ON wrong_answers(user_id);
CREATE INDEX idx_wrong_answers_session_id ON wrong_answers(session_id);
CREATE INDEX idx_wrong_answers_is_mastered ON wrong_answers(is_mastered);

-- =====================================================
-- 7. 학습 성취 (learning_achievements)
-- =====================================================
CREATE TABLE learning_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  milestone_value INT,
  badge_url TEXT,
  points INT DEFAULT 0
);

-- 학습 성취 인덱스
CREATE INDEX idx_learning_achievements_user_id ON learning_achievements(user_id);
CREATE INDEX idx_learning_achievements_type ON learning_achievements(achievement_type);

-- =====================================================
-- 8. 일일 학습 통계 (daily_learning_stats)
-- =====================================================
CREATE TABLE daily_learning_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_study_time INT DEFAULT 0, -- 분 단위
  characters_read INT DEFAULT 0,
  problems_solved INT DEFAULT 0,
  problems_correct INT DEFAULT 0,
  accuracy_rate DECIMAL(5,2),
  vocabulary_learned INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  points_earned INT DEFAULT 0,
  UNIQUE(user_id, date)
);

-- 일일 통계 인덱스
CREATE INDEX idx_daily_stats_user_id_date ON daily_learning_stats(user_id, date);

-- =====================================================
-- 9. 학급/그룹 (groups)
-- =====================================================
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- 그룹 멤버십
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'assistant')),
  PRIMARY KEY (group_id, user_id)
);

-- =====================================================
-- 10. 알림 (notifications)
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림 인덱스
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- Row Level Security (RLS) 정책
-- =====================================================

-- profiles 테이블 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

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

-- learning_sessions 테이블 RLS
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON learning_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON learning_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON learning_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student sessions" ON learning_sessions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM profiles WHERE teacher_id = auth.uid()
    )
  );

-- assignments 테이블 RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their assignments" ON assignments
  FOR SELECT USING (auth.uid() = assigned_to);

CREATE POLICY "Teachers can manage assignments" ON assignments
  FOR ALL USING (
    auth.uid() = assigned_by OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
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

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 일일 통계 자동 생성
CREATE OR REPLACE FUNCTION create_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_learning_stats (user_id, date)
  VALUES (NEW.user_id, CURRENT_DATE)
  ON CONFLICT (user_id, date) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_daily_stats_on_session
  AFTER INSERT ON learning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION create_daily_stats();

-- 연속 학습일 계산
CREATE OR REPLACE FUNCTION calculate_streak_days(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_streak INT := 0;
  v_date DATE := CURRENT_DATE;
BEGIN
  WHILE EXISTS (
    SELECT 1 FROM daily_learning_stats 
    WHERE user_id = p_user_id 
    AND date = v_date 
    AND total_study_time > 0
  ) LOOP
    v_streak := v_streak + 1;
    v_date := v_date - INTERVAL '1 day';
  END LOOP;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- 성취 확인 및 부여
CREATE OR REPLACE FUNCTION check_and_grant_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_total_chars INT;
  v_streak_days INT;
BEGIN
  -- 총 읽은 글자수 계산
  SELECT COALESCE(SUM(characters_read), 0) INTO v_total_chars
  FROM daily_learning_stats
  WHERE user_id = NEW.user_id;
  
  -- 읽기 성취 확인
  IF v_total_chars >= 1000000 AND NOT EXISTS (
    SELECT 1 FROM learning_achievements 
    WHERE user_id = NEW.user_id AND achievement_type = 'reading' AND milestone_value = 1000000
  ) THEN
    INSERT INTO learning_achievements (user_id, achievement_type, achievement_name, achievement_description, milestone_value, badge_url, points)
    VALUES (NEW.user_id, 'reading', '독서신', '100만자 읽기 달성!', 1000000, '/badges/reading_1m.svg', 1000);
  END IF;
  
  -- 연속 학습 성취 확인
  v_streak_days := calculate_streak_days(NEW.user_id);
  
  IF v_streak_days >= 30 AND NOT EXISTS (
    SELECT 1 FROM learning_achievements 
    WHERE user_id = NEW.user_id AND achievement_type = 'streak' AND milestone_value = 30
  ) THEN
    INSERT INTO learning_achievements (user_id, achievement_type, achievement_name, achievement_description, milestone_value, badge_url, points)
    VALUES (NEW.user_id, 'streak', '한달 개근', '30일 연속 학습 달성!', 30, '/badges/streak_30.svg', 300);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_achievements_on_stats_update
  AFTER INSERT OR UPDATE ON daily_learning_stats
  FOR EACH ROW
  EXECUTE FUNCTION check_and_grant_achievements();

-- =====================================================
-- Views
-- =====================================================

-- 학생 요약 뷰
CREATE VIEW student_summary AS
SELECT 
  p.id,
  p.full_name,
  p.grade_level,
  COALESCE(SUM(d.characters_read), 0) as total_characters_read,
  COALESCE(AVG(d.accuracy_rate), 0) as avg_accuracy,
  COALESCE(MAX(d.streak_days), 0) as max_streak,
  COUNT(DISTINCT d.date) as active_days,
  COUNT(DISTINCT a.id) as achievements_count
FROM profiles p
LEFT JOIN daily_learning_stats d ON p.id = d.user_id
LEFT JOIN learning_achievements a ON p.id = a.user_id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.grade_level;

-- 교사 대시보드 뷰
CREATE VIEW teacher_dashboard AS
SELECT 
  t.id as teacher_id,
  t.full_name as teacher_name,
  COUNT(DISTINCT s.id) as student_count,
  COUNT(DISTINCT a.id) as active_assignments,
  AVG(st.accuracy_rate) as class_avg_accuracy,
  SUM(st.characters_read) as class_total_reading
FROM profiles t
LEFT JOIN profiles s ON s.teacher_id = t.id
LEFT JOIN assignments a ON a.assigned_by = t.id AND a.status != 'completed'
LEFT JOIN daily_learning_stats st ON st.user_id = s.id AND st.date = CURRENT_DATE
WHERE t.role = 'teacher'
GROUP BY t.id, t.full_name;