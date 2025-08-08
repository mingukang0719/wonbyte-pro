import { supabase } from './supabaseClient'

// 브라우저에서 사용 가능한 간단한 해시 함수 (실제 운영환경에서는 더 안전한 방법 사용 필요)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// 사용자 등록
export async function signUp({ username, password, email, fullName, role, gradeLevel, schoolName, phoneNumber }) {
  try {
    // 비밀번호 해시
    const passwordHash = await hashPassword(password)
    
    // user_auth 테이블에 삽입
    const { data: authData, error: authError } = await supabase
      .from('user_auth')
      .insert({
        username,
        password_hash: passwordHash,
        email
      })
      .select()
      .single()
    
    if (authError) throw authError
    
    // profiles 테이블에 삽입
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.id,
        auth_id: authData.id,
        username,
        email: email || `${username}@local`,
        full_name: fullName,
        role,
        grade_level: gradeLevel,
        school_name: schoolName,
        phone_number: phoneNumber
      })
      .select()
      .single()
    
    if (profileError) {
      // 프로필 생성 실패시 auth 데이터 삭제
      await supabase.from('user_auth').delete().eq('id', authData.id)
      throw profileError
    }
    
    return { user: profileData, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

// 로그인
export async function signIn({ username, password }) {
  try {
    // 사용자 조회
    const { data: authData, error: authError } = await supabase
      .from('user_auth')
      .select('*')
      .eq('username', username)
      .single()
    
    if (authError || !authData) {
      return { user: null, session: null, error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
    }
    
    // 비밀번호 확인
    const passwordHash = await hashPassword(password)
    if (passwordHash !== authData.password_hash) {
      return { user: null, session: null, error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
    }
    
    // 세션 생성
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24시간 유효
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: authData.id,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()
    
    if (sessionError) throw sessionError
    
    // 프로필 조회
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', authData.id)
      .single()
    
    if (profileError) throw profileError
    
    // 토큰을 로컬 스토리지에 저장
    localStorage.setItem('auth_token', token)
    
    return { 
      user: profileData, 
      session: { token, expires_at: expiresAt },
      error: null 
    }
  } catch (error) {
    return { user: null, session: null, error: error.message }
  }
}

// 로그아웃
export async function signOut() {
  try {
    const token = localStorage.getItem('auth_token')
    if (token) {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('token', token)
      
      localStorage.removeItem('auth_token')
    }
    
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// 현재 사용자 조회
export async function getCurrentUser() {
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) return { user: null, error: null }
    
    // 세션 확인
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*, user_auth(*)')
      .eq('token', token)
      .single()
    
    if (sessionError || !sessionData) {
      localStorage.removeItem('auth_token')
      return { user: null, error: null }
    }
    
    // 세션 만료 확인
    if (new Date(sessionData.expires_at) < new Date()) {
      await signOut()
      return { user: null, error: null }
    }
    
    // 프로필 조회
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', sessionData.user_id)
      .single()
    
    if (profileError) throw profileError
    
    return { user: profileData, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

// 토큰 생성 함수
function generateToken() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}