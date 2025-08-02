// EduText Pro Backend - Simplified Version
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Anthropic } from '@anthropic-ai/sdk'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Enable CORS for all origins during debugging
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Body parser middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  if (req.method === 'POST') {
    console.log('Body:', JSON.stringify(req.body).substring(0, 200))
  }
  next()
})

// Helper function to clean API keys
function cleanApiKey(key) {
  if (!key) return null
  return key.toString().trim().replace(/^["']|["']$/g, '')
}

// Initialize AI clients
let claudeClient = null
const claudeKey = cleanApiKey(process.env.CLAUDE_API_KEY)
if (claudeKey) {
  try {
    claudeClient = new Anthropic({
      apiKey: claudeKey
    })
    console.log('✅ Claude client initialized')
  } catch (error) {
    console.error('❌ Failed to initialize Claude:', error.message)
  }
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'EduText Pro Backend',
    version: '2.0',
    status: 'running',
    timestamp: new Date().toISOString()
  })
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      claude: claudeClient ? 'active' : 'inactive'
    }
  })
})

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  })
})

// AI status endpoint
app.get('/api/ai/status', (req, res) => {
  res.json({
    success: true,
    providers: {
      claude: {
        available: !!claudeClient,
        status: claudeClient ? 'ready' : 'not configured'
      }
    }
  })
})

// Main AI generation endpoint
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { 
      prompt,
      provider = 'claude',
      contentType = 'reading',
      targetAge = 10,
      contentLength = 800
    } = req.body

    console.log('Generate request:', { provider, contentType, promptLength: prompt?.length })

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      })
    }

    // For now, only support Claude
    if (provider !== 'claude' || !claudeClient) {
      return res.status(400).json({
        success: false,
        error: 'Only Claude is currently available'
      })
    }

    // Create the full prompt based on content type
    let fullPrompt = prompt
    if (contentType === 'reading') {
      fullPrompt = `한국어 읽기 지문을 생성해주세요.
주제: ${prompt}
대상: ${targetAge}세
길이: 약 ${contentLength}자

요구사항:
- 해당 연령에 적합한 어휘와 문장 구조 사용
- 교육적 가치가 있는 내용
- 흥미롭고 이해하기 쉬운 내용
- 정확히 ${contentLength}자 내외로 작성`
    }

    // Call Claude API
    console.log('Calling Claude API...')
    const response = await claudeClient.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: fullPrompt
      }]
    })

    const content = response.content[0].text

    res.json({
      success: true,
      content: content,
      provider: 'claude',
      model: 'claude-3-haiku-20240307',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Generation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate content',
      message: error.message
    })
  }
})

// Extract vocabulary endpoint
app.post('/api/ai/extract-vocabulary', async (req, res) => {
  try {
    const { text, grade = 'elem4', count = 10 } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      })
    }

    if (!claudeClient) {
      return res.status(400).json({
        success: false,
        error: 'AI service not available'
      })
    }

    const prompt = `다음 지문에서 ${grade} 학년 수준에 맞는 중요한 어휘 ${count}개를 추출하고, 각 어휘의 뜻과 예문을 제공해주세요.

지문: ${text}

다음 JSON 형식으로 응답해주세요:
{
  "vocabulary": [
    {
      "word": "어휘",
      "meaning": "의미 설명",
      "example": "예문",
      "difficulty": 1-5 (난이도)
    }
  ]
}`

    const response = await claudeClient.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.5,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    let vocabulary = []
    try {
      const content = response.content[0].text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        vocabulary = parsed.vocabulary || []
      }
    } catch (parseError) {
      console.error('Failed to parse vocabulary:', parseError)
    }

    res.json({
      success: true,
      vocabulary,
      count: vocabulary.length
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

// Generate problems endpoint
app.post('/api/ai/generate-problems', async (req, res) => {
  try {
    const { text, type = 'reading', count = 5, grade = 'elem4' } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      })
    }

    if (!claudeClient) {
      return res.status(400).json({
        success: false,
        error: 'AI service not available'
      })
    }

    const prompt = `다음 지문을 바탕으로 ${grade} 학년 수준의 ${type === 'vocabulary' ? '어휘' : '독해'} 문제 ${count}개를 생성해주세요.

지문: ${text}

다음 JSON 형식으로 응답해주세요:
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

    const response = await claudeClient.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 3000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    let problems = []
    try {
      const content = response.content[0].text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        problems = parsed.problems || []
      }
    } catch (parseError) {
      console.error('Failed to parse problems:', parseError)
    }

    res.json({
      success: true,
      problems,
      count: problems.length
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

// Analyze text endpoint
app.post('/api/ai/analyze-text', async (req, res) => {
  try {
    const { text, targetGrade = 'elem4' } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      })
    }

    if (!claudeClient) {
      return res.status(400).json({
        success: false,
        error: 'AI service not available'
      })
    }

    const prompt = `다음 지문의 문해력 난이도를 ${targetGrade} 학년 기준으로 분석해주세요.

지문: ${text}

분석 항목:
1. 텍스트 길이 적절성 (1-10점)
2. 어휘 수준 (1-10점)
3. 문장 복잡도 (1-10점)
4. 내용 수준 (1-10점)
5. 배경지식 요구도 (1-10점)

각 항목을 점수와 함께 설명하고, 총평을 제공해주세요.`

    const response = await claudeClient.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.5,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    res.json({
      success: true,
      analysis: response.content[0].text,
      targetGrade
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

// PDF generation endpoint
app.post('/api/pdf/generate', async (req, res) => {
  try {
    const { title, blocks = [], ...otherData } = req.body

    // Convert individual fields to blocks if needed
    let pdfBlocks = blocks
    if (!pdfBlocks.length && otherData.text) {
      pdfBlocks = []
      
      if (otherData.text) {
        pdfBlocks.push({
          type: 'text',
          title: '지문',
          content: otherData.text
        })
      }
      
      if (otherData.selectedVocabulary?.length) {
        pdfBlocks.push({
          type: 'vocabulary',
          title: '핵심 어휘',
          content: otherData.selectedVocabulary
        })
      }
      
      if (otherData.generatedProblems?.length) {
        pdfBlocks.push({
          type: 'problems',
          title: '문제',
          content: otherData.generatedProblems
        })
      }
    }

    res.json({
      success: true,
      html: `<html><body><h1>${title}</h1><p>PDF content here</p></body></html>`,
      filename: `edutext-${Date.now()}.pdf`
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF',
      message: error.message
    })
  }
})

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Not found: ${req.method} ${req.originalUrl}`)
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  })
})

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('===========================================')
  console.log('🚀 EduText Pro Backend v2.0')
  console.log(`📡 Server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log('===========================================')
  console.log('📋 Available endpoints:')
  console.log('  GET  /api/health')
  console.log('  GET  /api/test')
  console.log('  GET  /api/ai/status')
  console.log('  POST /api/ai/generate')
  console.log('  POST /api/ai/extract-vocabulary')
  console.log('  POST /api/ai/generate-problems')
  console.log('  POST /api/ai/analyze-text')
  console.log('  POST /api/pdf/generate')
  console.log('===========================================')
  console.log('🔑 API Keys:')
  console.log(`  Claude: ${claudeKey ? '✅ Configured' : '❌ Missing'}`)
  console.log('===========================================')
})

export default app