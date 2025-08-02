// 환경변수 검증 스크립트
import dotenv from 'dotenv'

dotenv.config()

console.log('=== Environment Variables Validation ===')
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set')
console.log('PORT:', process.env.PORT || 'not set')

// Supabase
console.log('\n--- Supabase Config ---')
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing')
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? `✓ Set (${process.env.SUPABASE_ANON_KEY.substring(0, 20)}...)` : '✗ Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing')

// AI API Keys
console.log('\n--- AI API Keys ---')
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `✓ Set (${process.env.OPENAI_API_KEY.substring(0, 15)}...)` : '✗ Missing')
console.log('CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? `✓ Set (${process.env.CLAUDE_API_KEY.substring(0, 15)}...)` : '✗ Missing')
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `✓ Set (${process.env.GEMINI_API_KEY.substring(0, 10)}...)` : '✗ Missing')

// Security Keys
console.log('\n--- Security Keys ---')
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing')
console.log('API_KEY_ENCRYPTION_SECRET:', process.env.API_KEY_ENCRYPTION_SECRET ? '✓ Set' : '✗ Missing')

// Check for quotes in API keys
console.log('\n--- API Key Format Check ---')
if (process.env.OPENAI_API_KEY?.includes('"')) {
  console.log('⚠️  OPENAI_API_KEY contains quotes - this will cause issues!')
}
if (process.env.CLAUDE_API_KEY?.includes('"')) {
  console.log('⚠️  CLAUDE_API_KEY contains quotes - this will cause issues!')
}
if (process.env.GEMINI_API_KEY?.includes('"')) {
  console.log('⚠️  GEMINI_API_KEY contains quotes - this will cause issues!')
}

console.log('\n=== Validation Complete ===')

// Render 환경변수 설정 가이드
console.log('\n📝 Render Environment Variables Setup:')
console.log('1. Go to https://dashboard.render.com')
console.log('2. Select your backend service')
console.log('3. Go to Environment tab')
console.log('4. Add the following variables WITHOUT quotes:')
console.log('   - OPENAI_API_KEY=sk-proj-...')
console.log('   - CLAUDE_API_KEY=sk-ant-api03-...')
console.log('   - GEMINI_API_KEY=AIzaSy...')
console.log('5. Click "Save Changes"')
console.log('6. The service will automatically redeploy')