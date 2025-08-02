import express from 'express'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const router = express.Router()

// 간단한 테스트 엔드포인트
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'AI Generation routes are working',
    timestamp: new Date().toISOString()
  })
})

// AI 생성 엔드포인트 - 심플 버전
router.post('/generate', async (req, res) => {
  try {
    const { 
      prompt,
      contentType = 'reading',
      difficulty = 'intermediate',
      targetAge = 10,
      contentLength = 800,
      provider = 'claude'
    } = req.body

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      })
    }

    console.log('AI Generation Request received:', {
      provider,
      contentType,
      promptLength: prompt.length,
      timestamp: new Date().toISOString()
    })

    // AI Service를 동적으로 import하여 초기화 오류 방지
    try {
      const AIService = (await import('../services/aiService.js')).default
      const aiService = new AIService()
      
      const result = await aiService.generateContent({
        provider,
        contentType,
        difficulty,
        targetAge,
        contentLength,
        prompt
      })

      res.json(result)
    } catch (serviceError) {
      console.error('AI Service Error:', serviceError)
      res.status(500).json({
        success: false,
        error: 'AI 서비스 초기화 실패',
        message: serviceError.message,
        details: process.env.NODE_ENV === 'development' ? serviceError.stack : undefined
      })
    }

  } catch (error) {
    console.error('Generate endpoint error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate content',
      message: error.message
    })
  }
})

// 어휘 추출 엔드포인트 - 심플 버전
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

    try {
      const AIService = (await import('../services/aiService.js')).default
      const aiService = new AIService()
      
      const result = await aiService.generateContent({
        provider: 'claude',
        contentType: 'vocabulary',
        prompt,
        targetAge: parseInt(grade.replace(/\D/g, '')) || 10
      })

      let vocabulary = []
      try {
        const parsed = JSON.parse(result.content)
        vocabulary = parsed.vocabulary || []
      } catch (parseError) {
        console.error('Failed to parse vocabulary response:', parseError)
        vocabulary = []
      }

      res.json({
        success: true,
        vocabulary,
        count: vocabulary.length
      })
    } catch (serviceError) {
      console.error('AI Service Error in vocabulary:', serviceError)
      res.status(500).json({
        success: false,
        error: 'AI 서비스 오류',
        message: serviceError.message
      })
    }

  } catch (error) {
    console.error('Extract vocabulary error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to extract vocabulary',
      message: error.message
    })
  }
})

// 문제 생성 엔드포인트 - 심플 버전
router.post('/generate-problems', async (req, res) => {
  try {
    const { text, type = 'reading', count = 5, grade = 'elem4' } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      })
    }

    const prompt = `다음 지문을 바탕으로 ${grade} 학년 수준의 ${type === 'vocabulary' ? '어휘' : '독해'} 문제 ${count}개를 생성해주세요.

지문: ${text}

응답 형식:
{
  "problems": [
    {
      "question": "문제",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answer": 0,
      "explanation": "해설"
    }
  ]
}`

    try {
      const AIService = (await import('../services/aiService.js')).default
      const aiService = new AIService()
      
      const result = await aiService.generateContent({
        provider: 'claude',
        contentType: type === 'vocabulary' ? 'vocabulary_problems' : 'reading_problems',
        prompt,
        targetAge: parseInt(grade.replace(/\D/g, '')) || 10
      })

      let problems = []
      try {
        const parsed = JSON.parse(result.content)
        problems = parsed.problems || []
      } catch (parseError) {
        console.error('Failed to parse problems response:', parseError)
        problems = []
      }

      res.json({
        success: true,
        problems,
        count: problems.length
      })
    } catch (serviceError) {
      console.error('AI Service Error in problems:', serviceError)
      res.status(500).json({
        success: false,
        error: 'AI 서비스 오류',
        message: serviceError.message
      })
    }

  } catch (error) {
    console.error('Generate problems error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate problems',
      message: error.message
    })
  }
})

// 텍스트 분석 엔드포인트 - 심플 버전
router.post('/analyze-text', async (req, res) => {
  try {
    const { text, targetGrade = 'elem4' } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      })
    }

    const prompt = `다음 지문의 문해력 난이도를 ${targetGrade} 학년 기준으로 분석해주세요.

지문: ${text}

분석 항목:
1. 텍스트 길이 적절성
2. 어휘 수준
3. 문장 복잡도
4. 내용 수준
5. 배경지식 요구도

각 항목을 1-10점으로 평가하고 총평을 제공해주세요.`

    try {
      const AIService = (await import('../services/aiService.js')).default
      const aiService = new AIService()
      
      const result = await aiService.generateContent({
        provider: 'claude',
        contentType: 'analysis',
        prompt,
        targetAge: parseInt(targetGrade.replace(/\D/g, '')) || 10
      })

      res.json({
        success: true,
        analysis: result.content,
        targetGrade
      })
    } catch (serviceError) {
      console.error('AI Service Error in analysis:', serviceError)
      res.status(500).json({
        success: false,
        error: 'AI 서비스 오류',
        message: serviceError.message
      })
    }

  } catch (error) {
    console.error('Analyze text error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze text',
      message: error.message
    })
  }
})

export default router