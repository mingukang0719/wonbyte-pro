import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
)

async function createAdminUser() {
  try {
    const password = 'admin123'
    const hash = await bcrypt.hash(password, 10)
    
    // 먼저 기존 사용자 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@onbyte.com')
      .single()
    
    if (existingUser) {
      // 기존 사용자 업데이트
      const { data, error } = await supabase
        .from('users')
        .update({ 
          password_hash: hash,
          role: 'admin',
          is_active: true
        })
        .eq('email', 'admin@onbyte.com')
        .select()
      
      if (error) throw error
      console.log('Admin user updated successfully:', data)
    } else {
      // 새 사용자 생성
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: 'admin@onbyte.com',
          password_hash: hash,
          role: 'admin',
          is_active: true
        })
        .select()
      
      if (error) throw error
      console.log('Admin user created successfully:', data)
    }
    
    console.log('\nLogin credentials:')
    console.log('Email: admin@onbyte.com')
    console.log('Password: admin123')
    
  } catch (error) {
    console.error('Error creating/updating admin user:', error)
  }
}

createAdminUser()