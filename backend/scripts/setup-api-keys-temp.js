import APIKeyService from '../services/apiKeyService.js'
import dotenv from 'dotenv'

dotenv.config()

// 테스트용 API 키 (실제 키로 교체 필요)
const testKeys = {
  openai: 'sk-proj-test-openai-key',
  claude: 'sk-ant-api03-test-claude-key', 
  gemini: 'AIzaSyTest-gemini-key'
}

async function setupKeys() {
  const apiKeyService = new APIKeyService()
  
  console.log('🔐 Setting up API keys in Supabase...\n')
  
  // 임시 관리자 ID (실제 사용 시 변경 필요)
  const adminUserId = 'temp-admin-id'
  
  for (const [provider, key] of Object.entries(testKeys)) {
    console.log(`📝 Setting ${provider} API key...`)
    
    const result = await apiKeyService.storeAPIKey(provider, key, adminUserId)
    
    if (result.success) {
      console.log(`✅ ${provider} API key stored successfully!`)
    } else {
      console.log(`❌ Failed to store ${provider} API key: ${result.error}`)
    }
  }
  
  console.log('\n📊 Checking API key status...')
  const status = await apiKeyService.getAllAPIKeyStatus()
  
  console.log('\nProvider | Active | Usage | Last Used')
  console.log('---------|--------|-------|----------')
  
  status.forEach(key => {
    const lastUsed = key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'
    console.log(`${key.provider.padEnd(8)} | ${key.isActive ? '✅' : '❌'}     | ${String(key.usageCount).padEnd(5)} | ${lastUsed}`)
  })
  
  console.log('\n✅ API key setup completed!')
  console.log('\n⚠️  IMPORTANT: Please replace the test keys with your actual API keys:')
  console.log('   - OpenAI: sk-proj-...')
  console.log('   - Claude: sk-ant-api03-...')
  console.log('   - Gemini: AIzaSy...')
  
  process.exit(0)
}

setupKeys().catch(error => {
  console.error('Error setting up API keys:', error)
  process.exit(1)
})