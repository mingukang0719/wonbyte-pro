import { createClient } from '@supabase/supabase-js'
import APIKeyManager from '../utils/encryption.js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

class APIKeyService {
  constructor() {
    this.encryptionManager = new APIKeyManager()
  }

  /**
   * API 키를 암호화해서 Supabase에 저장
   */
  async storeAPIKey(provider, apiKey, userId) {
    try {
      // API 키 암호화
      const encryptedData = this.encryptionManager.encrypt(apiKey)
      
      // Supabase에 저장
      const { data, error } = await supabase
        .from('api_keys')
        .upsert({
          provider,
          encrypted_key: encryptedData,
          created_by: userId,
          is_active: true
        }, {
          onConflict: 'provider'
        })
        .select()
        .single()

      if (error) throw error

      console.log(`✅ ${provider} API key stored successfully`)
      return { success: true, data }
    } catch (error) {
      console.error(`Failed to store ${provider} API key:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Supabase에서 API 키를 가져와서 복호화
   */
  async getAPIKey(provider) {
    try {
      // Supabase에서 암호화된 키 가져오기
      const { data, error } = await supabase
        .from('api_keys')
        .select('encrypted_key, is_active')
        .eq('provider', provider)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        console.log(`No active API key found for ${provider}`)
        return null
      }

      // 복호화
      const decryptedKey = this.encryptionManager.decrypt(data.encrypted_key)
      
      // 사용 횟수 업데이트
      await this.updateUsageCount(provider)
      
      return decryptedKey
    } catch (error) {
      console.error(`Failed to get ${provider} API key:`, error)
      return null
    }
  }

  /**
   * 모든 활성 API 키 상태 확인
   */
  async getAllAPIKeyStatus() {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('provider, is_active, last_used, usage_count, created_at')
        .order('provider')

      if (error) throw error

      return data.map(key => ({
        provider: key.provider,
        isActive: key.is_active,
        hasKey: true,
        lastUsed: key.last_used,
        usageCount: key.usage_count,
        createdAt: key.created_at
      }))
    } catch (error) {
      console.error('Failed to get API key status:', error)
      return []
    }
  }

  /**
   * API 키 사용 횟수 업데이트
   */
  async updateUsageCount(provider) {
    try {
      const { error } = await supabase.rpc('increment', {
        table_name: 'api_keys',
        column_name: 'usage_count',
        row_id: provider,
        id_column: 'provider'
      })

      if (!error) {
        await supabase
          .from('api_keys')
          .update({ last_used: new Date().toISOString() })
          .eq('provider', provider)
      }
    } catch (error) {
      console.error(`Failed to update usage count for ${provider}:`, error)
    }
  }

  /**
   * API 사용 로그 기록
   */
  async logAPIUsage(provider, userId, tokensUsed, costEstimate, requestType, success = true, errorMessage = null) {
    try {
      const { error } = await supabase
        .from('api_key_usage_logs')
        .insert({
          provider,
          user_id: userId,
          tokens_used: tokensUsed,
          cost_estimate: costEstimate,
          request_type: requestType,
          success,
          error_message: errorMessage
        })

      if (error) throw error
    } catch (error) {
      console.error('Failed to log API usage:', error)
    }
  }

  /**
   * API 키 비활성화
   */
  async deactivateAPIKey(provider) {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('provider', provider)

      if (error) throw error
      
      console.log(`✅ ${provider} API key deactivated`)
      return { success: true }
    } catch (error) {
      console.error(`Failed to deactivate ${provider} API key:`, error)
      return { success: false, error: error.message }
    }
  }
}

// Supabase RPC 함수 생성 (increment 함수가 없는 경우)
export async function createIncrementFunction() {
  const query = `
    CREATE OR REPLACE FUNCTION increment(table_name text, column_name text, row_id text, id_column text)
    RETURNS void AS $$
    BEGIN
      EXECUTE format('UPDATE %I SET %I = %I + 1 WHERE %I = %L', 
        table_name, column_name, column_name, id_column, row_id);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `
  
  const { error } = await supabase.rpc('query', { query })
  if (error) console.error('Failed to create increment function:', error)
}

export default APIKeyService