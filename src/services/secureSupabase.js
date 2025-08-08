import { createClient } from '@supabase/supabase-js'

// 환경 변수
const supabaseUrl = (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_URL) || 
                    import.meta.env?.VITE_SUPABASE_URL || 
                    ''
const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_ANON_KEY) || 
                        import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                        ''

// 서비스 역할 키 (보안상 서버 사이드에서만 사용해야 함)
const supabaseServiceKey = (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_SERVICE_KEY) || 
                           import.meta.env?.VITE_SUPABASE_SERVICE_KEY || 
                           ''

// 보안 Supabase 클라이언트 생성
export function createSecureClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing')
    return null
  }
  
  // 서비스 키가 있으면 사용, 없으면 anon 키 사용
  const key = supabaseServiceKey || supabaseAnonKey
  
  const client = createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        // 커스텀 인증 토큰 헤더 추가
        'x-auth-token': localStorage.getItem('auth_token') || ''
      }
    }
  })
  
  return client
}

// RLS를 우회하는 안전한 쿼리 실행 함수
export async function secureQuery(queryFn) {
  const client = createSecureClient()
  if (!client) {
    throw new Error('Failed to create Supabase client')
  }
  
  try {
    // 현재 사용자 세션 확인
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('No authentication token found')
    }
    
    // 세션 유효성 검증
    const { data: session, error: sessionError } = await client
      .rpc('verify_user_session', { auth_token: token })
      .single()
    
    if (sessionError || !session || !session.is_valid) {
      throw new Error('Invalid or expired session')
    }
    
    // 실제 쿼리 실행
    return await queryFn(client, session)
  } catch (error) {
    console.error('Secure query error:', error)
    throw error
  }
}