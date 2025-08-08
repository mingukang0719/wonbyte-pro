-- RLS 정책 수정 스크립트
-- 과제 생성 시 발생하는 권한 오류를 해결합니다

-- 1. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Teachers and admins can create materials" ON reading_materials;
DROP POLICY IF EXISTS "Teachers and admins can create problems" ON problems;
DROP POLICY IF EXISTS "Teachers can create assignments" ON assignments;

-- 2. reading_materials 테이블에 대한 새로운 정책
-- 선생님과 관리자가 자료를 생성할 수 있도록 허용
CREATE POLICY "Teachers and admins can create materials" ON reading_materials
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
    AND created_by = auth.uid()
  );

-- 선생님과 관리자가 자신이 만든 자료를 수정할 수 있도록 허용
CREATE POLICY "Teachers and admins can update own materials" ON reading_materials
  FOR UPDATE USING (
    created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );

-- 선생님과 관리자가 자신이 만든 자료를 삭제할 수 있도록 허용
CREATE POLICY "Teachers and admins can delete own materials" ON reading_materials
  FOR DELETE USING (
    created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );

-- 3. problems 테이블에 대한 새로운 정책
CREATE POLICY "Teachers and admins can create problems" ON problems
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );

-- 선생님과 관리자가 문제를 수정할 수 있도록 허용
CREATE POLICY "Teachers and admins can update problems" ON problems
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );

-- 선생님과 관리자가 문제를 삭제할 수 있도록 허용
CREATE POLICY "Teachers and admins can delete problems" ON problems
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );

-- 4. assignments 테이블에 대한 새로운 정책
CREATE POLICY "Teachers can create assignments" ON assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
    AND assigned_by = auth.uid()
  );

-- 선생님이 자신이 배정한 과제를 수정할 수 있도록 허용
CREATE POLICY "Teachers can update own assignments" ON assignments
  FOR UPDATE USING (
    assigned_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );

-- 선생님이 자신이 배정한 과제를 삭제할 수 있도록 허용
CREATE POLICY "Teachers can delete own assignments" ON assignments
  FOR DELETE USING (
    assigned_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );

-- 5. 선생님이 자신의 학생들의 과제를 볼 수 있도록 추가 정책
CREATE POLICY "Teachers can view students assignments" ON assignments
  FOR SELECT USING (
    assigned_by = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles student
      JOIN profiles teacher ON student.teacher_id = teacher.id
      WHERE student.id = assignments.assigned_to
      AND teacher.id = auth.uid()
      AND teacher.role = 'teacher'
    )
  );

-- 6. 디버깅을 위한 임시 정책 (개발 환경에서만 사용)
-- 주의: 프로덕션에서는 이 정책을 삭제해야 합니다!
-- CREATE POLICY "Temporary allow all for debugging" ON reading_materials
--   FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Temporary allow all for debugging" ON problems
--   FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Temporary allow all for debugging" ON assignments
--   FOR ALL USING (true) WITH CHECK (true);