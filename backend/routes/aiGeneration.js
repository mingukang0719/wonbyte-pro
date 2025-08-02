import express from 'express'
import { adminAuthMiddleware, requirePermission } from '../middleware/adminAuth.js'
import AIService from '../services/aiService.js'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const router = express.Router()
const aiService = new AIService()
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// 템플릿 기반 콘텐츠 생성
router.post('/generate-from-template', adminAuthMiddleware, requirePermission('generate_content'), async (req, res) => {
  try {
    const { templateId, variables = {}, provider = 'claude' } = req.body

    // 템플릿 가져오기
    const { data: template, error: templateError } = await supabase
      .from('reading_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return res.status(404).json({ 
        success: false,
        error: 'Template not found' 
      })
    }

    // 변수 치환
    let prompt = template.template_prompt
    Object.entries(variables).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value)
    })

    const startTime = Date.now()

    // AI 생성
    const result = await aiService.generateContent({
      provider,
      contentType: template.content_type,
      prompt,
      difficulty: template.difficulty,
      targetAge: template.target_age,
      userId: req.user.id
    })

    const generationTime = Date.now() - startTime

    // 생성 결과 저장
    const { data: generatedReading, error: saveError } = await supabase
      .from('generated_readings')
      .insert({
        template_id: templateId,
        generated_content: result.content,
        ai_provider: provider,
        generated_by: req.user.id,
        variables_used: variables,
        tokens_used: result.tokensUsed,
        generation_time: `${generationTime} milliseconds`
      })
      .select()
      .single()

    if (saveError) {
      console.error('Save error:', saveError)
    }

    // 생성 로그 저장
    await supabase.from('ai_generation_logs').insert({
      user_id: req.user.id,
      template_id: templateId,
      prompt,
      content_type: template.content_type,
      ai_provider: provider,
      generated_content: result.content,
      tokens_used: result.tokensUsed,
      cost_estimate: calculateCost(provider, result.tokensUsed),
      success: true,
      metadata: {
        variables,
        generation_time: generationTime
      }
    })

    res.json({
      success: true,
      content: result.content,
      metadata: {
        id: generatedReading?.id,
        provider,
        tokensUsed: result.tokensUsed,
        generationTime,
        templateUsed: template.title
      }
    })

  } catch (error) {
    console.error('Generation error:', error)
    console.error('Error stack:', error.stack)
    console.error('Environment check:', {
      hasClaudeKey: !!process.env.CLAUDE_API_KEY,
      provider: req.body.provider
    })
    
    // 실패 로그 저장
    try {
      await supabase.from('ai_generation_logs').insert({
        user_id: req.user.id,
        template_id: req.body.templateId,
        prompt: 'Failed to generate',
        content_type: 'unknown',
        ai_provider: req.body.provider || 'claude',
        generated_content: null,
        error_message: error.message,
        success: false
      })
    } catch (logError) {
      console.error('Failed to save error log:', logError)
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to generate content',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// 직접 프롬프트로 생성
router.post('/generate-direct', adminAuthMiddleware, requirePermission('generate_content'), async (req, res) => {
  try {
    const { 
      prompt,
      contentType = 'reading',
      difficulty = 'intermediate',
      targetAge = 'adult',
      provider = 'claude'
    } = req.body

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      })
    }

    const result = await aiService.generateContent({
      provider,
      contentType,
      prompt,
      difficulty,
      targetAge,
      userId: req.user.id
    })

    res.json({
      success: true,
      content: result.content,
      metadata: {
        provider,
        tokensUsed: result.tokensUsed
      }
    })

  } catch (error) {
    console.error('Direct generation error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate content',
      message: error.message 
    })
  }
})

// 배치 생성
router.post('/generate-batch', adminAuthMiddleware, requirePermission('generate_content'), async (req, res) => {
  try {
    const { jobs } = req.body // [{templateId, variables}, ...]
    
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Jobs array is required'
      })
    }

    const results = []
    
    for (const job of jobs) {
      try {
        // 각 작업을 순차적으로 처리
        const { data: template } = await supabase
          .from('reading_templates')
          .select('*')
          .eq('id', job.templateId)
          .single()

        if (!template) {
          results.push({
            success: false,
            templateId: job.templateId,
            error: 'Template not found'
          })
          continue
        }

        let prompt = template.template_prompt
        Object.entries(job.variables || {}).forEach(([key, value]) => {
          prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value)
        })

        const result = await aiService.generateContent({
          provider: job.provider || 'claude',
          contentType: template.content_type,
          prompt,
          difficulty: template.difficulty,
          targetAge: template.target_age,
          userId: req.user.id
        })

        results.push({
          success: true,
          templateId: job.templateId,
          content: result.content,
          tokensUsed: result.tokensUsed
        })

      } catch (error) {
        results.push({
          success: false,
          templateId: job.templateId,
          error: error.message
        })
      }
    }

    res.json({
      success: true,
      totalJobs: jobs.length,
      successCount: results.filter(r => r.success).length,
      results
    })

  } catch (error) {
    console.error('Batch generation error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Batch generation failed',
      message: error.message 
    })
  }
})

// 생성 히스토리 조회
router.get('/history', adminAuthMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query

    const { data: history, error } = await supabase
      .from('generated_readings')
      .select(`
        *,
        reading_templates (
          title,
          content_type
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json({
      success: true,
      history
    })

  } catch (error) {
    console.error('History fetch error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch history' 
    })
  }
})

// 비용 계산 함수
function calculateCost(provider, tokens) {
  const rates = {
    claude: { input: 0.003, output: 0.015 }, // per 1K tokens
    gemini: { input: 0.00025, output: 0.0005 } // per 1K tokens
  }

  const rate = rates[provider] || rates.claude
  // 간단한 추정 (실제로는 input/output 토큰을 구분해야 함)
  return (tokens / 1000) * rate.output
}

export default router