import { createClient } from '@supabase/supabase-js'
import APIKeyManager from '../utils/encryption.js'

class APIKeyService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    this.encryptionManager = new APIKeyManager()
    this.apiKeys = {}
    this.lastFetch = null
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes cache
  }

  async getApiKey(provider) {
    // Check cache first
    if (this.apiKeys[provider] && this.lastFetch && (Date.now() - this.lastFetch < this.cacheTimeout)) {
      return this.apiKeys[provider]
    }

    try {
      // Fetch from Supabase
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('encrypted_key')
        .eq('provider', provider)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        console.error(`Failed to fetch ${provider} API key:`, error?.message)
        // Fallback to environment variable
        const envKey = process.env[`${provider.toUpperCase()}_API_KEY`]
        if (envKey) {
          console.log(`Using ${provider} API key from environment variable`)
          return envKey
        }
        return null
      }

      // Decrypt the API key
      const encryptedData = JSON.parse(data.encrypted_key)
      const decryptedKey = this.encryptionManager.decrypt(encryptedData)
      
      // Cache the key
      this.apiKeys[provider] = decryptedKey
      this.lastFetch = Date.now()
      
      console.log(`Successfully retrieved ${provider} API key from Supabase`)
      return decryptedKey
    } catch (err) {
      console.error(`Error getting ${provider} API key:`, err.message)
      // Fallback to environment variable
      const envKey = process.env[`${provider.toUpperCase()}_API_KEY`]
      if (envKey) {
        console.log(`Using ${provider} API key from environment variable (fallback)`)
        return envKey
      }
      return null
    }
  }

  async incrementUsage(provider) {
    try {
      const { error } = await this.supabase
        .rpc('increment_api_usage', { provider_name: provider })
      
      if (error) {
        // If RPC doesn't exist, try direct update
        await this.supabase
          .from('api_keys')
          .update({ usage_count: this.supabase.raw('usage_count + 1') })
          .eq('provider', provider)
      }
    } catch (err) {
      console.error(`Failed to increment usage for ${provider}:`, err.message)
    }
  }

  clearCache() {
    this.apiKeys = {}
    this.lastFetch = null
  }
}

export default new APIKeyService()