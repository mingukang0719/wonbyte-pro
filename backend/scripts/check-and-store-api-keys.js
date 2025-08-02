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

async function checkTableAndStore() {
  console.log('🔍 Checking table structure...\n')
  
  // First, try to get one row to see the structure
  const { data: existingRows, error: checkError } = await supabase
    .from('api_keys')
    .select('*')
    .limit(1)
  
  if (checkError) {
    console.log('❌ Error checking table:', checkError.message)
    console.log('\n📝 Creating table...')
    
    // Try to create the table through a direct SQL query (this might not work with anon key)
    console.log('Please create the table manually in Supabase dashboard with this SQL:')
    console.log(`
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider VARCHAR(50) UNIQUE NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
    `)
    return
  }
  
  console.log('✅ Table exists!')
  
  if (existingRows && existingRows.length > 0) {
    console.log('Table columns:', Object.keys(existingRows[0]))
  }
  
  // Now store the API keys
  const encryptionManager = new APIKeyManager()
  
  console.log('\n🔐 Storing API keys...\n')
  
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
      
      // Prepare the data object based on existing columns
      let dataToStore = {
        provider,
        encrypted_key: encryptedJson,
        is_active: true
      }
      
      // Add usage_count only if the column exists
      if (existingRows && existingRows.length > 0 && 'usage_count' in existingRows[0]) {
        dataToStore.usage_count = 0
      }
      
      // Store in Supabase
      const { data, error } = await supabase
        .from('api_keys')
        .upsert(dataToStore, {
          onConflict: 'provider'
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
    .select('*')
  
  if (keysError) {
    console.log('❌ Failed to fetch keys:', keysError.message)
  } else if (keys && keys.length > 0) {
    console.log('\nStored API keys:')
    keys.forEach(key => {
      console.log(`- ${key.provider}: ${key.is_active ? '✅ Active' : '❌ Inactive'}`)
    })
  } else {
    console.log('No API keys found in database')
  }
  
  console.log('\n✨ Done!')
}

checkTableAndStore().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})