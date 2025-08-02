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

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

console.log('🔐 Connecting to Supabase...')
console.log('URL:', supabaseUrl)
console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon')

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function storeApiKeys() {
  const encryptionManager = new APIKeyManager()
  
  console.log('\n📊 Creating table if not exists...')
  
  // Create table
  const { error: createError } = await supabase.rpc('query', {
    query: `
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        provider VARCHAR(50) UNIQUE NOT NULL,
        encrypted_key TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `
  }).catch(err => {
    // If RPC doesn't exist, try direct approach
    return { error: 'RPC not available' }
  })
  
  if (createError) {
    console.log('⚠️  Could not create table via RPC:', createError)
    console.log('   Table might already exist or needs to be created manually')
  }
  
  console.log('\n🔐 Storing API keys...')
  
  const providers = {
    openai: process.env.OPENAI_API_KEY,
    claude: process.env.CLAUDE_API_KEY,
    gemini: process.env.GEMINI_API_KEY
  }
  
  let storedCount = 0
  let errors = []
  
  for (const [provider, apiKey] of Object.entries(providers)) {
    if (!apiKey) {
      console.log(`⚠️  No ${provider.toUpperCase()} API key found`)
      continue
    }
    
    try {
      // Encrypt the API key
      const encryptedData = encryptionManager.encrypt(apiKey)
      const encryptedJson = JSON.stringify(encryptedData)
      
      // Try to store in Supabase
      const { data, error } = await supabase
        .from('api_keys')
        .upsert({
          provider,
          encrypted_key: encryptedJson,
          is_active: true,
          usage_count: 0
        }, {
          onConflict: 'provider'
        })
        .select()
      
      if (error) {
        console.log(`❌ Failed to store ${provider} key:`, error.message)
        errors.push({ provider, error: error.message })
      } else {
        console.log(`✅ ${provider} key stored successfully!`)
        storedCount++
      }
    } catch (err) {
      console.log(`❌ Error with ${provider} key:`, err.message)
      errors.push({ provider, error: err.message })
    }
  }
  
  // Check stored keys
  console.log('\n📊 Checking stored keys...')
  
  try {
    const { data: keys, error: keysError } = await supabase
      .from('api_keys')
      .select('provider, is_active, usage_count')
      .order('provider')
    
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
  } catch (err) {
    console.log('❌ Error checking keys:', err.message)
  }
  
  console.log(`\n📝 Summary: ${storedCount} keys stored successfully`)
  
  if (errors.length > 0) {
    console.log('\n⚠️  Errors encountered:')
    errors.forEach(({ provider, error }) => {
      console.log(`- ${provider}: ${error}`)
    })
    
    console.log('\n💡 If you see authentication errors:')
    console.log('1. Make sure you have the correct service role key in backend/.env')
    console.log('2. Or manually run the SQL in Supabase dashboard')
  }
}

storeApiKeys().catch(error => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})