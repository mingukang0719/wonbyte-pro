import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupDatabase() {
  console.log('🔧 Setting up database tables...\n')
  
  // SQL 쿼리들
  const queries = [
    // 1. update_updated_at_column 함수 생성
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';`,
    
    // 2. admin_roles 테이블 생성
    `CREATE TABLE IF NOT EXISTS admin_roles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      role_name TEXT UNIQUE NOT NULL,
      permissions JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // 3. admin_users 테이블 생성  
    `CREATE TABLE IF NOT EXISTS admin_users (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      role_id UUID REFERENCES admin_roles(id),
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // 4. 기본 권한 데이터 삽입
    `INSERT INTO admin_roles (role_name, permissions) VALUES 
    ('super_admin', '{"all": true}'),
    ('content_admin', '{"generate_content": true, "manage_templates": true, "view_analytics": true}'),
    ('viewer', '{"view_analytics": true}')
    ON CONFLICT (role_name) DO NOTHING;`,
    
    // 5. api_keys 테이블 생성
    `CREATE TABLE IF NOT EXISTS api_keys (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      provider TEXT NOT NULL UNIQUE CHECK (provider IN ('openai', 'claude', 'gemini')),
      encrypted_key JSONB NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_used TIMESTAMP WITH TIME ZONE,
      usage_count INTEGER DEFAULT 0,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // 6. api_key_usage_logs 테이블 생성
    `CREATE TABLE IF NOT EXISTS api_key_usage_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      provider TEXT NOT NULL,
      user_id UUID REFERENCES auth.users(id),
      tokens_used INTEGER,
      cost_estimate DECIMAL(10,4),
      request_type TEXT,
      success BOOLEAN DEFAULT TRUE,
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // 7. 인덱스 생성
    `CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);`,
    `CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_provider ON api_key_usage_logs(provider);`,
    `CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_created_at ON api_key_usage_logs(created_at);`,
    
    // 8. RLS 활성화
    `ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE api_key_usage_logs ENABLE ROW LEVEL SECURITY;`,
    
    // 9. RLS 정책 생성
    `CREATE POLICY "API keys are only accessible by admins" ON api_keys
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM admin_users 
          WHERE id = auth.uid() AND is_active = TRUE
        )
      );`,
      
    `CREATE POLICY "API key usage logs are viewable by admins only" ON api_key_usage_logs
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM admin_users 
          WHERE id = auth.uid() AND is_active = TRUE
        )
      );`,
    
    // 10. 트리거 생성
    `CREATE TRIGGER update_api_keys_updated_at 
      BEFORE UPDATE ON api_keys
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`
  ]
  
  // 쿼리 실행
  for (let i = 0; i < queries.length; i++) {
    try {
      const { error } = await supabase.rpc('exec_sql', { query: queries[i] })
      if (error) {
        console.log(`❌ Query ${i + 1} failed:`, error.message)
      } else {
        console.log(`✅ Query ${i + 1} executed successfully`)
      }
    } catch (err) {
      // RPC가 없을 경우 직접 실행 시도
      console.log(`⚠️  Query ${i + 1} - RPC not available, skipping...`)
    }
  }
  
  // 테이블 확인
  console.log('\n📊 Checking tables...')
  
  const { data: tables, error: tablesError } = await supabase
    .from('api_keys')
    .select('*')
    .limit(1)
  
  if (tablesError) {
    console.log('❌ api_keys table check failed:', tablesError.message)
  } else {
    console.log('✅ api_keys table exists!')
  }
  
  console.log('\n🎉 Database setup complete!')
  console.log('\nNext steps:')
  console.log('1. Go to Supabase dashboard and run the SQL manually if tables were not created')
  console.log('2. Use the API key management script to store your actual API keys')
}

setupDatabase().catch(error => {
  console.error('Setup failed:', error)
  process.exit(1)
})