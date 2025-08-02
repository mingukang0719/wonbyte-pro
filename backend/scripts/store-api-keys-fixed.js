import { createClient } from '@supabase/supabase-js'
import APIKeyManager from '../utils/encryption.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '..', '.env') })

console.log('🔍 Checking environment...')
console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
console.log('SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
console.log('API_KEY_ENCRYPTION_SECRET:', process.env.API_KEY_ENCRYPTION_SECRET)
console.log('\n')

// Set encryption key from env
process.env.ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET

console.log('📝 Generating SQL script for manual insertion...\n')

// Generate SQL for manual insertion
const providers = ['openai', 'claude', 'gemini']
const encryptionManager = new APIKeyManager()

console.log('-- SQL script to manually insert API keys into Supabase')
console.log('-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/jqlouemxgafrbzdxyojl/sql/new)\n')

console.log('-- Create table if not exists')
console.log(`CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider VARCHAR(50) UNIQUE NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);`)
console.log('\n')

console.log('-- Insert encrypted API keys')

providers.forEach(provider => {
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`]
  if (apiKey) {
    try {
      const encryptedData = encryptionManager.encrypt(apiKey)
      // Convert object to JSON string for storage
      const encryptedJson = JSON.stringify(encryptedData)
      console.log(`-- ${provider.toUpperCase()} API Key`)
      console.log(`INSERT INTO api_keys (provider, encrypted_key, is_active, usage_count)`)
      console.log(`VALUES ('${provider}', '${encryptedJson}', true, 0)`)
      console.log(`ON CONFLICT (provider) DO UPDATE SET encrypted_key = EXCLUDED.encrypted_key, updated_at = NOW();`)
      console.log('')
    } catch (err) {
      console.log(`-- Error encrypting ${provider} key: ${err.message}`)
    }
  } else {
    console.log(`-- No ${provider.toUpperCase()} API key found in environment`)
  }
})

console.log('\n-- Verify insertion')
console.log(`SELECT provider, is_active, usage_count, created_at FROM api_keys ORDER BY provider;`)

console.log('\n\n✅ Copy the SQL above and run it in your Supabase SQL Editor')
console.log('   URL: https://supabase.com/dashboard/project/jqlouemxgafrbzdxyojl/sql/new')

// Also create a version that can be run with the service key
console.log('\n\n📝 Alternative: If you have the service role key, update backend/.env and run:')
console.log('   node scripts/store-api-keys-from-env.js')