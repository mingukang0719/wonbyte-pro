import { createClient } from '@supabase/supabase-js'
import APIKeyManager from '../utils/encryption.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '..', '.env') })

console.log('🔍 Debug Information:')
console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
console.log('Has SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY)
console.log('CLAUDE_API_KEY exists:', !!process.env.CLAUDE_API_KEY)
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY)
console.log('API_KEY_ENCRYPTION_SECRET exists:', !!process.env.API_KEY_ENCRYPTION_SECRET)
console.log('\n')

// Create test payload
const testPayload = {
  provider: 'test',
  encrypted_key: 'test_encrypted_key',
  is_active: true,
  usage_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

console.log('📝 Creating manual insert script...\n')

// Generate SQL for manual insertion
const providers = ['openai', 'claude', 'gemini']
const encryptionManager = new APIKeyManager()

console.log('-- SQL script to manually insert API keys into Supabase')
console.log('-- Run this in Supabase SQL Editor\n')

console.log('-- First, check if table exists and its structure')
console.log(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'api_keys';`)
console.log('\n')

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
      console.log(`INSERT INTO api_keys (provider, encrypted_key, is_active, usage_count)`)
      console.log(`VALUES ('${provider}', '${encryptedData}', true, 0)`)
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

console.log('\n\n📋 Alternative: Use Supabase Dashboard')
console.log('1. Go to your Supabase project dashboard')
console.log('2. Navigate to Table Editor > api_keys')
console.log('3. Click "Insert row" and add the following encrypted keys:\n')

providers.forEach(provider => {
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`]
  if (apiKey) {
    try {
      const encryptedData = encryptionManager.encrypt(apiKey)
      console.log(`${provider}:`)
      console.log(`  provider: ${provider}`)
      console.log(`  encrypted_key: ${encryptedData}`)
      console.log(`  is_active: true`)
      console.log(`  usage_count: 0`)
      console.log('')
    } catch (err) {
      console.log(`${provider}: Error - ${err.message}`)
    }
  }
})