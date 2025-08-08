import { createClient } from '@supabase/supabase-js'

// 환경 변수
const supabaseUrl = (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_URL) || 
                    import.meta.env?.VITE_SUPABASE_URL || 
                    ''
const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_ANON_KEY) || 
                        import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                        ''

// 인증된 사용자를 위한 Supabase 클라이언트 생성
export function createAuthenticatedClient(userId, profileId) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing')
    return null
  }
  
  // 커스텀 헤더와 함께 클라이언트 생성
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'x-user-id': userId || '',
        'x-profile-id': profileId || ''
      }
    }
  })
  
  return client
}

// 기본 클라이언트 (인증 없음)
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})