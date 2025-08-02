import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

class SupabaseService {
  constructor() {
    // SERVICE_ROLE_KEY가 없으면 ANON_KEY 사용
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      serviceKey
    )
    this.publicSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )
  }

  // 사용자 인증
  async authenticateUser(email, password) {
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (error || !user) {
        throw new Error('사용자를 찾을 수 없습니다')
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      if (!isValidPassword) {
        throw new Error('비밀번호가 올바르지 않습니다')
      }

      // JWT 토큰 생성
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      )

      // 로그인 활동 기록
      await this.logUserActivity(user.id, 'login', { ip: '127.0.0.1' })

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        token
      }
    } catch (error) {
      console.error('Auth error:', error)
      throw error
    }
  }

  // AI 생성 로그 저장
  async logAIGeneration(userId, provider, contentType, prompt, response, metadata = {}) {
    try {
      const { data, error } = await this.supabase
        .from('ai_generations')
        .insert({
          user_id: userId,
          provider,
          content_type: contentType,
          prompt,
          response,
          target_age: metadata.targetAge,
          difficulty: metadata.difficulty,
          content_length: metadata.contentLength,
          tokens_used: metadata.tokensUsed || 0
        })
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('AI generation log error:', error)
      throw error
    }
  }

  // 생성된 콘텐츠 저장
  async saveGeneratedContent(userId, title, content, contentType, metadata = {}) {
    try {
      const { data, error } = await this.supabase
        .from('generated_content')
        .insert({
          user_id: userId,
          title,
          content,
          content_type: contentType,
          metadata
        })
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('Content save error:', error)
      throw error
    }
  }

  // 사용자 콘텐츠 조회
  async getUserContent(userId, contentType = null, limit = 50) {
    try {
      let query = this.supabase
        .from('generated_content')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (contentType) {
        query = query.eq('content_type', contentType)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get user content error:', error)
      throw error
    }
  }

  // 사용자 활동 로그
  async logUserActivity(userId, activityType, activityData = {}) {
    try {
      const { data, error } = await this.supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: activityType,  
          activity_data: activityData,
          ip_address: activityData.ip || null,
          user_agent: activityData.userAgent || null
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('User activity log error:', error)
      // 활동 로그 실패는 치명적이지 않으므로 에러를 throw하지 않음
      return null
    }
  }

  // 사용 통계 조회
  async getUsageStats(userId = null) {
    try {
      let query = this.supabase.from('ai_generations')

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query
        .select('provider, content_type, tokens_used, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // 최근 30일

      if (error) throw error

      // 통계 계산
      const stats = {
        totalGenerations: data.length,
        totalTokens: data.reduce((sum, item) => sum + (item.tokens_used || 0), 0),
        byProvider: {},
        byContentType: {},
        dailyUsage: {}
      }

      data.forEach(item => {
        // Provider 별 통계
        if (!stats.byProvider[item.provider]) {
          stats.byProvider[item.provider] = { count: 0, tokens: 0 }
        }
        stats.byProvider[item.provider].count++
        stats.byProvider[item.provider].tokens += item.tokens_used || 0

        // Content Type 별 통계
        if (!stats.byContentType[item.content_type]) {
          stats.byContentType[item.content_type] = { count: 0, tokens: 0 }
        }
        stats.byContentType[item.content_type].count++
        stats.byContentType[item.content_type].tokens += item.tokens_used || 0

        // 일별 사용량
        const date = new Date(item.created_at).toISOString().split('T')[0]
        if (!stats.dailyUsage[date]) {
          stats.dailyUsage[date] = { count: 0, tokens: 0 }
        }
        stats.dailyUsage[date].count++
        stats.dailyUsage[date].tokens += item.tokens_used || 0
      })

      return stats
    } catch (error) {
      console.error('Usage stats error:', error)
      throw error
    }
  }

  // API 키 암호화 저장
  async saveEncryptedAPIKey(userId, provider, apiKey) {
    try {
      const cipher = crypto.createCipher('aes-256-cbc', process.env.API_KEY_ENCRYPTION_SECRET)
      let encrypted = cipher.update(apiKey, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const { data, error } = await this.supabase
        .from('api_keys')
        .upsert({
          user_id: userId,
          provider,
          encrypted_key: encrypted,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('API key save error:', error)
      throw error
    }
  }

  // API 키 복호화 조회
  async getDecryptedAPIKey(userId, provider) {
    try {
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('encrypted_key')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('is_active', true)
        .single()

      if (error || !data) return null

      const decipher = crypto.createDecipher('aes-256-cbc', process.env.API_KEY_ENCRYPTION_SECRET)
      let decrypted = decipher.update(data.encrypted_key, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      console.error('API key decrypt error:', error)
      return null
    }
  }

  // 헬스 체크
  async healthCheck() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1)

      return { 
        success: !error,
        supabase: 'connected',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        supabase: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
}

export default SupabaseService