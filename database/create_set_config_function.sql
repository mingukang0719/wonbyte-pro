-- set_config RPC 함수 생성
-- 이 함수는 PostgreSQL 세션 변수를 설정하는 데 사용됩니다

CREATE OR REPLACE FUNCTION set_config(setting text, value text, is_local boolean DEFAULT true)
RETURNS text AS $$
BEGIN
  -- PostgreSQL의 set_config 함수 호출
  RETURN set_config(setting, value, is_local);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수에 대한 권한 부여
GRANT EXECUTE ON FUNCTION set_config(text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION set_config(text, text, boolean) TO anon;