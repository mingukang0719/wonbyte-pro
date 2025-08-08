import { supabase } from '../services/supabaseClient.js'

// 브라우저에서 사용 가능한 간단한 해시 함수
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function createAdminUser() {
  try {
    // 비밀번호 해시
    const passwordHash = await hashPassword('admin123')
    
    // user_auth 테이블에 삽입
    const { data: authData, error: authError } = await supabase
      .from('user_auth')
      .insert({
        username: 'admin',
        password_hash: passwordHash,
        email: 'admin@wonbyte.com'
      })
      .select()
      .single()
    
    if (authError) {
      console.error('Auth insert error:', authError)
      return
    }
    
    console.log('Auth data created:', authData)
    
    // profiles 테이블에 삽입
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.id,
        auth_id: authData.id,
        username: 'admin',
        email: 'admin@wonbyte.com',
        full_name: '시스템 관리자',
        role: 'admin'
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('Profile insert error:', profileError)
      // 프로필 생성 실패시 auth 데이터 삭제
      await supabase.from('user_auth').delete().eq('id', authData.id)
      return
    }
    
    console.log('Admin user created successfully:', profileData)
  } catch (error) {
    console.error('Error creating admin user:', error)
  }
}

// 실행
createAdminUser()