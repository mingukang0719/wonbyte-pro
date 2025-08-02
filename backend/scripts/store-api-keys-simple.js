import { createClient } from '@supabase/supabase-js'
import APIKeyManager from '../utils/encryption.js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 실제 API 키를 여기에 입력하세요
const API_KEYS = {
  openai: 'sk-proj-YOUR_OPENAI_KEY_HERE',
  claude: 'sk-ant-api03-YOUR_CLAUDE_KEY_HERE',
  gemini: 'AIzaSyYOUR_GEMINI_KEY_HERE'
}

async function storeApiKeys() {
  const encryptionManager = new APIKeyManager()
  
  console.log('🔐 Storing API keys...\n')
  
  for (const [provider, apiKey] of Object.entries(API_KEYS)) {
    if (apiKey.includes('YOUR_') || apiKey.includes('_HERE')) {
      console.log(`⚠️  Skipping ${provider} - Please add your actual API key`)
      continue
    }
    
    try {
      // 암호화
      const encryptedData = encryptionManager.encrypt(apiKey)
      
      // Supabase에 저장
      const { data, error } = await supabase
        .from('api_keys')
        .upsert({
          provider,
          encrypted_key: encryptedData,
          is_active: true,
          usage_count: 0
        }, {
          onConflict: 'provider'
        })
        .select()
      
      if (error) {
        console.log(`❌ Failed to store ${provider} key:`, error.message)
      } else {
        console.log(`✅ ${provider} key stored successfully!`)
      }
    } catch (err) {
      console.log(`❌ Error storing ${provider} key:`, err.message)
    }
  }
  
  // 저장된 키 확인
  console.log('\n📊 Checking stored keys...')
  
  const { data: keys, error: keysError } = await supabase
    .from('api_keys')
    .select('provider, is_active, usage_count')
  
  if (keysError) {
    console.log('❌ Failed to fetch keys:', keysError.message)
  } else if (keys && keys.length > 0) {
    console.log('\nStored API keys:')
    keys.forEach(key => {
      console.log(`- ${key.provider}: ${key.is_active ? '✅ Active' : '❌ Inactive'} (Used ${key.usage_count} times)`)
    })
  } else {
    console.log('No API keys found in database')
  }
  
  console.log('\n✨ Done!')
  console.log('\n⚠️  IMPORTANT: Edit this file and replace the placeholder API keys with your actual keys!')
  console.log('   Then run this script again.')
}

storeApiKeys().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})