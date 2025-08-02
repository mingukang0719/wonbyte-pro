import { createClient } from '@supabase/supabase-js'
import APIKeyManager from '../utils/encryption.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function storeApiKeysFromEnv() {
  const encryptionManager = new APIKeyManager()
  
  console.log('🔐 Storing API keys from environment variables...\n')
  
  // API key mapping from env variables
  const apiKeys = {
    openai: process.env.OPENAI_API_KEY,
    claude: process.env.CLAUDE_API_KEY,
    gemini: process.env.GEMINI_API_KEY
  }
  
  let storedCount = 0
  
  for (const [provider, apiKey] of Object.entries(apiKeys)) {
    if (!apiKey) {
      console.log(`⚠️  No ${provider.toUpperCase()} API key found in environment variables`)
      continue
    }
    
    try {
      // 암호화
      const encryptedData = encryptionManager.encrypt(apiKey)
      
      // Supabase에 저장 (upsert로 기존 키가 있으면 업데이트)
      const { data, error } = await supabase
        .from('api_keys')
        .upsert({
          provider,
          encrypted_key: encryptedData,
          is_active: true,
          usage_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'provider'
        })
        .select()
      
      if (error) {
        console.log(`❌ Failed to store ${provider} key:`, error.message)
      } else {
        console.log(`✅ ${provider} key stored successfully!`)
        storedCount++
      }
    } catch (err) {
      console.log(`❌ Error storing ${provider} key:`, err.message)
    }
  }
  
  // 저장된 키 확인
  console.log('\n📊 Checking stored keys...')
  
  const { data: keys, error: keysError } = await supabase
    .from('api_keys')
    .select('provider, is_active, usage_count, created_at, updated_at')
    .order('provider')
  
  if (keysError) {
    console.log('❌ Failed to fetch keys:', keysError.message)
  } else if (keys && keys.length > 0) {
    console.log('\nStored API keys:')
    keys.forEach(key => {
      console.log(`- ${key.provider}: ${key.is_active ? '✅ Active' : '❌ Inactive'} (Used ${key.usage_count} times, Updated: ${new Date(key.updated_at).toLocaleString()})`)
    })
  } else {
    console.log('No API keys found in database')
  }
  
  console.log(`\n✨ Done! Stored ${storedCount} API keys from environment variables.`)
  
  // Test decryption
  console.log('\n🔓 Testing decryption...')
  for (const [provider] of Object.entries(apiKeys)) {
    try {
      const { data: keyData, error } = await supabase
        .from('api_keys')
        .select('encrypted_key')
        .eq('provider', provider)
        .single()
      
      if (!error && keyData) {
        const decrypted = encryptionManager.decrypt(keyData.encrypted_key)
        const maskedKey = decrypted.substring(0, 10) + '...' + decrypted.substring(decrypted.length - 4)
        console.log(`✅ ${provider} key can be decrypted successfully: ${maskedKey}`)
      }
    } catch (err) {
      console.log(`❌ Failed to test ${provider} key:`, err.message)
    }
  }
}

storeApiKeysFromEnv().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})