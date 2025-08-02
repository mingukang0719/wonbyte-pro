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

// 일반 사용자용 AI 생성 (인증 불필요)
router.post('/generate', async (req, res) => {
  try {
    const { 
      prompt,
      contentType = 'reading',
      difficulty = 'intermediate',
      targetAge = 10,
      contentLength = 800,
      provider = 'openai'
    } = req.body

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      })
    }

    const startTime = Date.now()
    
    const result = await aiService.generateContent({
      provider,
      contentType,
      prompt,
      difficulty,
      targetAge,
      contentLength
    })

    const generationTime = Date.now() - startTime

    // 공개 로그 저장 (민감 정보 제외)
    try {
      await supabase.from('ai_generation_logs').insert({
        user_id: null, // 익명 사용자
        prompt: prompt.substring(0, 100), // 프롬프트 일부만 저장
        content_type: contentType,
        ai_provider: provider,
        generated_content: result.content?.substring(0, 200) || null, // 내용 일부만 저장
        tokens_used: result.tokensUsed,
        success: true,
        metadata: {
          generation_time: generationTime,
          content_length: contentLength
        }
      })
    } catch (logError) {
      console.error('Failed to save public log:', logError)
    }

    res.json({
      success: true,
      content: result.content,
      metadata: {
        provider,
        tokensUsed: result.tokensUsed,
        generationTime,
        contentLength
      }
    })

  } catch (error) {
    console.error('Public generation error:', error)
    console.error('Error stack:', error.stack)
    console.error('Environment check:', {
      hasClaudeKey: !!process.env.CLAUDE_API_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      provider: req.body.provider
    })
    
    // 익명 실패 로그
    try {
      await supabase.from('ai_generation_logs').insert({
        user_id: null,
        prompt: req.body.prompt?.substring(0, 100) || 'Failed request',
        content_type: req.body.contentType || 'unknown',
        ai_provider: req.body.provider || 'openai',
        generated_content: null,
        error_message: error.message,
        success: false
      })
    } catch (logError) {
      console.error('Failed to save public error log:', logError)
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to generate content',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// 직접 프롬프트로 생성 (관리자용)
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

// 어휘 추출 엔드포인트
router.post('/extract-vocabulary', async (req, res) => {
  try {
    const { text, grade = 'elem4', count = 10 } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      })
    }

    const prompt = `다음 지문에서 ${grade} 학년 수준에 맞는 중요한 어휘 ${count}개를 추출하고, 각 어휘의 뜻과 예문을 제공해주세요.

지문: ${text}

응답 형식:
{
  "vocabulary": [
    {
      "word": "어휘",
      "meaning": "의미 설명",
      "example": "예문"
    }
  ]
}`

    const result = await aiService.generateContent({
      provider: 'openai',
      contentType: 'vocabulary',
      prompt,
      targetAge: parseInt(grade.replace(/\D/g, '')) || 10
    })

    let vocabulary = []
    try {
      const parsed = JSON.parse(result.content)
      vocabulary = parsed.vocabulary || []
    } catch (parseError) {
      console.error('Failed to parse vocabulary JSON:', parseError)
      // JSON 파싱 실패 시 텍스트에서 추출 시도
      vocabulary = extractVocabularyFromText(result.content)
    }

    res.json({
      success: true,
      content: {
        vocabularyList: vocabulary
      },
      metadata: {
        provider: 'openai',
        tokensUsed: result.tokensUsed,
        extractedCount: vocabulary.length
      }
    })

  } catch (error) {
    console.error('Vocabulary extraction error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to extract vocabulary',
      message: error.message
    })
  }
})

// 문제 생성 엔드포인트
router.post('/generate-problems', async (req, res) => {
  try {
    const { 
      text, 
      grade = 'elem4', 
      problemTypes = ['comprehension', 'vocabulary'],
      count = 5 
    } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      })
    }

    const prompt = `다음 지문을 바탕으로 ${grade} 학년 수준에 맞는 문제 ${count}개를 생성해주세요.
문제 유형: ${problemTypes.join(', ')}

지문: ${text}

응답 형식:
{
  "problems": [
    {
      "type": "문제유형",
      "question": "문제",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "correct": 0,
      "explanation": "정답 해설"
    }
  ]
}`

    const result = await aiService.generateContent({
      provider: 'openai',
      contentType: 'questions',
      prompt,
      targetAge: parseInt(grade.replace(/\D/g, '')) || 10
    })

    let problems = []
    try {
      const parsed = JSON.parse(result.content)
      problems = parsed.problems || []
    } catch (parseError) {
      console.error('Failed to parse problems JSON:', parseError)
      // JSON 파싱 실패 시 텍스트에서 추출 시도
      problems = extractProblemsFromText(result.content)
    }

    res.json({
      success: true,
      content: {
        problems: problems
      },
      metadata: {
        provider: 'openai',
        tokensUsed: result.tokensUsed,
        problemCount: problems.length,
        types: problemTypes
      }
    })

  } catch (error) {
    console.error('Problem generation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate problems',
      message: error.message
    })
  }
})

// 텍스트 분석 엔드포인트
router.post('/analyze-text', async (req, res) => {
  try {
    const { text, grade = 'elem4' } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      })
    }

    const prompt = `다음 지문을 ${grade} 학년 기준으로 분석해주세요:

지문: ${text}

다음 항목들을 분석해주세요:
1. 어휘 난이도 (1-10점)
2. 문장 복잡도 (1-10점) 
3. 내용 난이도 (1-10점)
4. 예상 독해 시간 (분)
5. 추천 학년 범위

응답 형식:
{
  "analysis": {
    "vocabularyLevel": 7,
    "sentenceComplexity": 6,
    "contentDifficulty": 8,
    "readingTime": 5,
    "recommendedGrades": ["elem4", "elem5"],
    "totalScore": 7.0,
    "summary": "분석 요약"
  }
}`

    const result = await aiService.generateContent({
      provider: 'openai',
      contentType: 'analysis',
      prompt,
      targetAge: parseInt(grade.replace(/\D/g, '')) || 10
    })

    let analysis = {}
    try {
      const parsed = JSON.parse(result.content)
      analysis = parsed.analysis || {}
    } catch (parseError) {
      console.error('Failed to parse analysis JSON:', parseError)
      analysis = {
        vocabularyLevel: 5,
        sentenceComplexity: 5,
        contentDifficulty: 5,
        readingTime: Math.ceil(text.length / 200),
        recommendedGrades: [grade],
        totalScore: 5.0,
        summary: '분석 결과를 파싱할 수 없습니다.'
      }
    }

    res.json({
      success: true,
      content: analysis,
      metadata: {
        provider: 'openai',
        tokensUsed: result.tokensUsed,
        textLength: text.length
      }
    })

  } catch (error) {
    console.error('Text analysis error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze text',
      message: error.message
    })
  }
})

// 헬퍼 함수들
function extractVocabularyFromText(text) {
  // 간단한 어휘 추출 로직 (JSON 파싱 실패 시 사용)
  const lines = text.split('\n').filter(line => line.trim())
  const vocabulary = []
  
  for (const line of lines) {
    if (line.includes(':') && vocabulary.length < 10) {
      const parts = line.split(':')
      if (parts.length >= 2) {
        vocabulary.push({
          word: parts[0].trim(),
          meaning: parts[1].trim(),
          example: `${parts[0].trim()}을/를 사용한 예문입니다.`
        })
      }
    }
  }
  
  return vocabulary
}

function extractProblemsFromText(text) {
  // 간단한 문제 추출 로직 (JSON 파싱 실패 시 사용)
  return [
    {
      type: 'comprehension',
      question: '지문의 주요 내용은 무엇인가요?',
      options: ['내용1', '내용2', '내용3', '내용4'],
      correct: 0,
      explanation: '지문을 통해 확인할 수 있습니다.'
    }
  ]
}

// 비용 계산 함수
function calculateCost(provider, tokens) {
  const rates = {
    claude: { input: 0.003, output: 0.015 }, // per 1K tokens
    gemini: { input: 0.00025, output: 0.0005 }, // per 1K tokens
    openai: { input: 0.001, output: 0.002 } // per 1K tokens
  }

  const rate = rates[provider] || rates.openai
  // 간단한 추정 (실제로는 input/output 토큰을 구분해야 함)
  return (tokens / 1000) * rate.output
}

export default router