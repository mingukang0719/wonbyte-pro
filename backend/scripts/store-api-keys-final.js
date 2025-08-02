import { createClient } from '@supabase/supabase-js'
import APIKeyManager from '../utils/encryption.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })

// Set encryption key
process.env.ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function storeApiKeys() {
  const encryptionManager = new APIKeyManager()
  
  console.log('🔐 Storing API keys...\n')
  
  const providers = {
    openai: process.env.OPENAI_API_KEY,
    claude: process.env.CLAUDE_API_KEY,
    gemini: process.env.GEMINI_API_KEY
  }
  
  for (const [provider, apiKey] of Object.entries(providers)) {
    if (!apiKey) {
      console.log(`⚠️  No ${provider.toUpperCase()} API key found`)
      continue
    }
    
    try {
      // Encrypt the API key
      const encryptedData = encryptionManager.encrypt(apiKey)
      const encryptedJson = JSON.stringify(encryptedData)
      
      // First, try to delete existing entry
      const { error: deleteError } = await supabase
        .from('api_keys')
        .delete()
        .eq('provider', provider)
      
      if (deleteError) {
        console.log(`⚠️  Could not delete existing ${provider} key:`, deleteError.message)
      }
      
      // Now insert the new key
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          provider,
          encrypted_key: encryptedJson,
          is_active: true
        })
        .select()
      
      if (error) {
        console.log(`❌ Failed to store ${provider} key:`, error.message)
      } else {
        console.log(`✅ ${provider} key stored successfully!`)
      }
    } catch (err) {
      console.log(`❌ Error with ${provider} key:`, err.message)
    }
  }
  
  // Verify stored keys
  console.log('\n📊 Verifying stored keys...')
  
  const { data: keys, error: keysError } = await supabase
    .from('api_keys')
    .select('provider, encrypted_key, is_active')
  
  if (keysError) {
    console.log('❌ Failed to fetch keys:', keysError.message)
  } else if (keys && keys.length > 0) {
    console.log('\nStored API keys:')
    keys.forEach(key => {
      console.log(`- ${key.provider}: ${key.is_active ? '✅ Active' : '❌ Inactive'}`)
      // Test decryption
      try {
        const encryptedData = JSON.parse(key.encrypted_key)
        const decrypted = encryptionManager.decrypt(encryptedData)
        const masked = decrypted.substring(0, 10) + '...' + decrypted.substring(decrypted.length - 4)
        console.log(`  Decryption test: ${masked}`)
      } catch (err) {
        console.log(`  Decryption test failed:`, err.message)
      }
    })
  } else {
    console.log('No API keys found in database')
  }
  
  console.log('\n✨ Done!')
}

storeApiKeys().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})