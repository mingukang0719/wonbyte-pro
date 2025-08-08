import { createClient } from '@supabase/supabase-js'

// Webpack DefinePlugin으로 주입된 환경 변수 사용
const supabaseUrl = (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_URL) || 
                    import.meta.env?.VITE_SUPABASE_URL || 
                    ''
const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_ANON_KEY) || 
                        import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                        ''

let supabase

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase 환경 변수가 설정되지 않았습니다.')
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl || '❌ 미설정')
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 설정됨' : '❌ 미설정')
  console.error('Netlify에서 환경 변수를 설정해주세요: Site configuration → Environment variables')
  
  // 더미 supabase 객체 반환하여 앱이 크래시하지 않도록 함
  supabase = {
    auth: {
      signUp: async () => ({ error: new Error('Supabase가 설정되지 않았습니다.') }),
      signInWithPassword: async () => ({ error: new Error('Supabase가 설정되지 않았습니다.') }),
      signOut: async () => ({ error: new Error('Supabase가 설정되지 않았습니다.') }),
      resetPasswordForEmail: async () => ({ error: new Error('Supabase가 설정되지 않았습니다.') }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: async () => ({ data: { session: null } })
    },
    from: () => ({
      select: () => ({ data: null, error: new Error('Supabase가 설정되지 않았습니다.') }),
      insert: () => ({ data: null, error: new Error('Supabase가 설정되지 않았습니다.') }),
      update: () => ({ data: null, error: new Error('Supabase가 설정되지 않았습니다.') }),
      delete: () => ({ data: null, error: new Error('Supabase가 설정되지 않았습니다.') })
    })
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}

export { supabase }