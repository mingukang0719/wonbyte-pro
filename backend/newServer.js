// EduText Pro Backend - Ultra Simple Version
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Anthropic } from '@anthropic-ai/sdk'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Enable CORS for all origins
app.use(cors())

// Body parser
app.use(express.json({ limit: '10mb' }))

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body).substring(0, 200))
  }
  next()
})

// Initialize Claude client
let claude = null
const claudeKey = process.env.CLAUDE_API_KEY?.trim().replace(/^["']|["']$/g, '')

if (claudeKey) {
  try {
    claude = new Anthropic({ apiKey: claudeKey })
    console.log('✅ Claude initialized successfully')
  } catch (error) {
    console.error('❌ Claude initialization failed:', error.message)
  }
} else {
  console.warn('⚠️ CLAUDE_API_KEY not found')
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'EduText Pro Backend',
    version: '3.0',
    status: 'running',
    claude: claude ? 'ready' : 'not configured'
  })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    claude: claude ? 'active' : 'inactive',
    timestamp: new Date().toISOString()
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

// AI status
app.get('/api/ai/status', (req, res) => {
  res.json({
    success: true,
    providers: {
      claude: {
        available: !!claude,
        status: claude ? 'ready' : 'not configured'
      }
    }
  })
})

// Main AI generation endpoint
app.post('/api/ai/generate', async (req, res) => {
  console.log('🚀 AI Generate called')
  
  try {
    const { prompt, contentType = 'reading', targetAge = 10, contentLength = 800 } = req.body

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' })
    }

    if (!claude) {
      return res.status(503).json({ success: false, error: 'AI service not available' })
    }

    // Build Korean learning prompt
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

    console.log('📝 Calling Claude API...')
    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{ role: 'user', content: fullPrompt }]
    })

    const content = response.content[0].text
    console.log('✅ Claude response received:', content.substring(0, 100) + '...')

    res.json({
      success: true,
      content: content,
      provider: 'claude',
      model: 'claude-3-haiku-20240307'
    })

  } catch (error) {
    console.error('❌ Generation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate content',
      message: error.message
    })
  }
})

// Extract vocabulary
app.post('/api/ai/extract-vocabulary', async (req, res) => {
  console.log('📚 Extract vocabulary called')
  
  try {
    const { text, grade = 'elem4', count = 10 } = req.body

    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' })
    }

    if (!claude) {
      return res.status(503).json({ success: false, error: 'AI service not available' })
    }

    const prompt = `다음 지문에서 ${grade} 학년 수준에 맞는 중요한 어휘 ${count}개를 추출하고, 각 어휘의 뜻과 예문을 제공해주세요.

지문: ${text}

다음 JSON 형식으로만 응답해주세요 (다른 설명 없이):
{
  "vocabulary": [
    {
      "word": "어휘",
      "meaning": "의미 설명",
      "example": "예문",
      "difficulty": 1
    }
  ]
}`

    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }]
    })

    // Parse JSON from response
    let vocabulary = []
    try {
      const content = response.content[0].text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        vocabulary = parsed.vocabulary || []
      }
    } catch (e) {
      console.error('JSON parse error:', e)
      vocabulary = [{
        word: "파싱 오류",
        meaning: "JSON 파싱에 실패했습니다",
        example: "다시 시도해주세요",
        difficulty: 1
      }]
    }

    res.json({
      success: true,
      vocabulary,
      count: vocabulary.length
    })

  } catch (error) {
    console.error('❌ Vocabulary extraction error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to extract vocabulary',
      message: error.message
    })
  }
})

// Generate problems
app.post('/api/ai/generate-problems', async (req, res) => {
  console.log('📝 Generate problems called')
  
  try {
    const { text, type = 'reading', count = 5, grade = 'elem4' } = req.body

    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' })
    }

    if (!claude) {
      return res.status(503).json({ success: false, error: 'AI service not available' })
    }

    const prompt = `다음 지문을 바탕으로 ${grade} 학년 수준의 ${type === 'vocabulary' ? '어휘' : '독해'} 문제 ${count}개를 생성해주세요.

지문: ${text}

다음 JSON 형식으로만 응답해주세요 (다른 설명 없이):
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

    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 3000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    })

    // Parse JSON from response
    let problems = []
    try {
      const content = response.content[0].text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        problems = parsed.problems || []
      }
    } catch (e) {
      console.error('JSON parse error:', e)
      problems = [{
        question: "파싱 오류가 발생했습니다",
        options: ["다시", "시도해", "주세요", "!"],
        answer: 0,
        explanation: "JSON 파싱에 실패했습니다"
      }]
    }

    res.json({
      success: true,
      problems,
      count: problems.length
    })

  } catch (error) {
    console.error('❌ Problem generation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate problems',
      message: error.message
    })
  }
})

// Analyze text
app.post('/api/ai/analyze-text', async (req, res) => {
  console.log('🔍 Analyze text called')
  
  try {
    const { text, targetGrade = 'elem4' } = req.body

    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' })
    }

    if (!claude) {
      return res.status(503).json({ success: false, error: 'AI service not available' })
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

    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }]
    })

    res.json({
      success: true,
      analysis: response.content[0].text,
      targetGrade
    })

  } catch (error) {
    console.error('❌ Text analysis error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze text',
      message: error.message
    })
  }
})

// PDF generation
app.post('/api/pdf/generate', async (req, res) => {
  console.log('📄 PDF generate called')
  
  try {
    const { title = 'EduText Pro', blocks = [], ...data } = req.body

    // Simple HTML response for now
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Nanum Gothic', sans-serif; padding: 40px; }
    h1 { color: #333; }
    .block { margin: 20px 0; }
    .vocabulary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    .problem { margin: 15px 0; padding: 10px; border-left: 3px solid #4285f4; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${blocks.map(block => {
    if (block.type === 'text') {
      return `<div class="block"><h2>${block.title}</h2><p>${block.content}</p></div>`
    } else if (block.type === 'vocabulary') {
      return `<div class="block vocabulary"><h2>${block.title}</h2>${
        block.content.map(v => `<p><strong>${v.word}</strong>: ${v.meaning}</p>`).join('')
      }</div>`
    } else if (block.type === 'problems') {
      return `<div class="block"><h2>${block.title}</h2>${
        block.content.map((p, i) => `
          <div class="problem">
            <p><strong>${i + 1}. ${p.question}</strong></p>
            <ol>${p.options.map(o => `<li>${o}</li>`).join('')}</ol>
          </div>
        `).join('')
      }</div>`
    }
    return ''
  }).join('')}
</body>
</html>`

    res.json({
      success: true,
      html,
      filename: `edutext-${Date.now()}.pdf`
    })

  } catch (error) {
    console.error('❌ PDF generation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF',
      message: error.message
    })
  }
})

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`)
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/test',
      'GET /api/ai/status',
      'POST /api/ai/generate',
      'POST /api/ai/extract-vocabulary',
      'POST /api/ai/generate-problems',
      'POST /api/ai/analyze-text',
      'POST /api/pdf/generate'
    ]
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('============================================')
  console.log('🚀 EduText Pro Backend v3.0')
  console.log(`📡 Server running on port ${PORT}`)
  console.log(`🔑 Claude: ${claude ? '✅ Ready' : '❌ Not configured'}`)
  console.log('============================================')
  console.log('📋 Available endpoints:')
  console.log('  GET  /api/health')
  console.log('  GET  /api/test')
  console.log('  GET  /api/ai/status')
  console.log('  POST /api/ai/generate')
  console.log('  POST /api/ai/extract-vocabulary')
  console.log('  POST /api/ai/generate-problems')
  console.log('  POST /api/ai/analyze-text')
  console.log('  POST /api/pdf/generate')
  console.log('============================================')
})

export default app