// Environment variables validation script
import dotenv from 'dotenv'

dotenv.config()

console.log('============================================')
console.log('🔍 Environment Variables Check')
console.log('============================================')

// Check CLAUDE_API_KEY (most important)
const claudeKey = process.env.CLAUDE_API_KEY
if (claudeKey) {
  const cleaned = claudeKey.trim().replace(/^["']|["']$/g, '')
  console.log('✅ CLAUDE_API_KEY:')
  console.log(`   Original length: ${claudeKey.length}`)
  console.log(`   Cleaned length: ${cleaned.length}`)
  console.log(`   Starts with: ${cleaned.substring(0, 15)}...`)
  console.log(`   Has quotes: ${claudeKey.includes('"') || claudeKey.includes("'")}`)
  
  if (claudeKey !== cleaned) {
    console.log('   ⚠️  WARNING: API key contains quotes or spaces!')
    console.log('   Fix in .env file: CLAUDE_API_KEY=your-key-here (no quotes)')
  }
} else {
  console.log('❌ CLAUDE_API_KEY: Not found')
}

// Check PORT
const port = process.env.PORT
console.log(`\n📡 PORT: ${port || '3001 (default)'}`)

// Check NODE_ENV
const nodeEnv = process.env.NODE_ENV
console.log(`\n🌍 NODE_ENV: ${nodeEnv || 'development (default)'}`)

console.log('\n============================================')
console.log('💡 Render Setup Instructions:')
console.log('1. Go to https://dashboard.render.com')
console.log('2. Select your backend service')
console.log('3. Go to Environment tab')
console.log('4. Add CLAUDE_API_KEY WITHOUT quotes:')
console.log('   CLAUDE_API_KEY=sk-ant-api03-xxxxx')
console.log('5. Click "Save Changes"')
console.log('6. Service will automatically redeploy')
console.log('============================================')