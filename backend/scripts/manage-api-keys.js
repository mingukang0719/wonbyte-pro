import APIKeyService from '../services/apiKeyService.js'
import dotenv from 'dotenv'
import readline from 'readline'

dotenv.config()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function main() {
  const apiKeyService = new APIKeyService()
  
  console.log('\n🔑 API Key Management Tool')
  console.log('=========================\n')
  
  while (true) {
    console.log('\nOptions:')
    console.log('1. Store API Key')
    console.log('2. Check API Key Status')
    console.log('3. Test API Keys')
    console.log('4. Deactivate API Key')
    console.log('5. Exit')
    
    const choice = await question('\nSelect option (1-5): ')
    
    switch (choice) {
      case '1':
        await storeAPIKey(apiKeyService)
        break
      case '2':
        await checkStatus(apiKeyService)
        break
      case '3':
        await testAPIKeys(apiKeyService)
        break
      case '4':
        await deactivateKey(apiKeyService)
        break
      case '5':
        console.log('\n👋 Goodbye!')
        rl.close()
        process.exit(0)
      default:
        console.log('❌ Invalid option')
    }
  }
}

async function storeAPIKey(service) {
  console.log('\n📝 Store API Key')
  console.log('Provider options: openai, claude, gemini')
  
  const provider = await question('Provider: ')
  if (!['openai', 'claude', 'gemini'].includes(provider)) {
    console.log('❌ Invalid provider')
    return
  }
  
  const apiKey = await question('API Key: ')
  if (!apiKey) {
    console.log('❌ API Key is required')
    return
  }
  
  // 임시 사용자 ID (실제로는 인증된 관리자 ID 사용)
  const userId = process.env.ADMIN_USER_ID || 'temp-admin-id'
  
  const result = await service.storeAPIKey(provider, apiKey, userId)
  
  if (result.success) {
    console.log(`✅ ${provider} API key stored successfully!`)
  } else {
    console.log(`❌ Failed to store API key: ${result.error}`)
  }
}

async function checkStatus(service) {
  console.log('\n📊 API Key Status')
  
  const status = await service.getAllAPIKeyStatus()
  
  if (status.length === 0) {
    console.log('No API keys found')
    return
  }
  
  console.log('\nProvider | Active | Usage | Last Used')
  console.log('---------|--------|-------|----------')
  
  status.forEach(key => {
    const lastUsed = key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'
    console.log(`${key.provider.padEnd(8)} | ${key.isActive ? '✅' : '❌'}     | ${String(key.usageCount).padEnd(5)} | ${lastUsed}`)
  })
}

async function testAPIKeys(service) {
  console.log('\n🧪 Testing API Keys')
  
  const providers = ['openai', 'claude', 'gemini']
  
  for (const provider of providers) {
    const key = await service.getAPIKey(provider)
    if (key) {
      console.log(`✅ ${provider}: Key found (${key.substring(0, 10)}...)`)
    } else {
      console.log(`❌ ${provider}: No active key found`)
    }
  }
}

async function deactivateKey(service) {
  console.log('\n🚫 Deactivate API Key')
  
  const provider = await question('Provider to deactivate: ')
  const confirm = await question(`Are you sure you want to deactivate ${provider}? (y/n): `)
  
  if (confirm.toLowerCase() === 'y') {
    const result = await service.deactivateAPIKey(provider)
    if (result.success) {
      console.log(`✅ ${provider} API key deactivated`)
    } else {
      console.log(`❌ Failed: ${result.error}`)
    }
  }
}

// 환경 변수에서 자동으로 API 키 설정
async function autoSetupFromEnv() {
  const service = new APIKeyService()
  const userId = process.env.ADMIN_USER_ID || 'temp-admin-id'
  
  const providers = {
    openai: process.env.OPENAI_API_KEY,
    claude: process.env.CLAUDE_API_KEY,
    gemini: process.env.GEMINI_API_KEY
  }
  
  let hasValidKeys = false
  
  for (const [provider, key] of Object.entries(providers)) {
    if (key && !key.includes('your_') && !key.includes('your-')) {
      console.log(`\n🔑 Setting up ${provider} API key...`)
      const result = await service.storeAPIKey(provider, key, userId)
      if (result.success) {
        console.log(`✅ ${provider} API key stored successfully!`)
        hasValidKeys = true
      }
    }
  }
  
  return hasValidKeys
}

// 명령줄 인수 확인
if (process.argv.includes('--auto')) {
  console.log('🚀 Auto-setup mode')
  autoSetupFromEnv().then(success => {
    if (success) {
      console.log('\n✅ API keys setup completed!')
    } else {
      console.log('\n⚠️  No valid API keys found in environment variables')
    }
    process.exit(0)
  })
} else {
  main()
}