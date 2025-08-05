-- username 필드 추가를 위한 마이그레이션
-- profiles 테이블에 username 컬럼 추가

-- 1. profiles 테이블에 username 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. username에 대한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 3. 기존 사용자들의 username을 email의 @ 앞부분으로 설정
UPDATE profiles 
SET username = SPLIT_PART(email, '@', 1) 
WHERE username IS NULL;

-- 4. username을 NOT NULL로 변경
ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;

-- 5. RLS 정책 업데이트 - username으로도 프로필 조회 가능
CREATE POLICY "Users can view profiles by username" ON profiles
  FOR SELECT USING (true);