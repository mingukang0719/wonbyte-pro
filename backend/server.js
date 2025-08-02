// EduText Pro Backend - Ultra Minimal Version
// Force rebuild: 2025-08-02 13:30
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Anthropic } from '@anthropic-ai/sdk'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://wonbyte-pro.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ]
    // Allow requests with no origin (like mobile apps or postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(null, true) // Temporarily allow all origins for testing
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// Claude setup
let claude = null
const key = process.env.CLAUDE_API_KEY?.trim().replace(/^["']|["']$/g, '')
if (key) {
  claude = new Anthropic({ apiKey: key })
  console.log('Claude ready')
}

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'running', claude: !!claude })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', claude: !!claude })
})

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Working!' })
})

app.get('/api/ai/status', (req, res) => {
  res.json({
    success: true,
    providers: { claude: { available: !!claude } }
  })
})

app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt, contentType = 'reading', targetAge = 10, contentLength = 800 } = req.body
    
    if (!prompt || !claude) {
      return res.status(400).json({ 
        success: false, 
        error: !prompt ? 'Prompt required' : 'AI not available' 
      })
    }

    const fullPrompt = contentType === 'reading' 
      ? `한국어 읽기 지문을 생성해주세요.\n주제: ${prompt}\n대상: ${targetAge}세\n길이: 약 ${contentLength}자\n\n요구사항:\n- 해당 연령에 적합한 어휘와 문장 구조 사용\n- 교육적 가치가 있는 내용\n- 흥미롭고 이해하기 쉬운 내용\n- 정확히 ${contentLength}자 내외로 작성`
      : prompt

    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{ role: 'user', content: fullPrompt }]
    })

    res.json({
      success: true,
      content: response.content[0].text,
      provider: 'claude'
    })
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/ai/extract-vocabulary', async (req, res) => {
  try {
    const { text, grade = 'elem4', count = 10 } = req.body
    
    if (!text || !claude) {
      return res.status(400).json({ 
        success: false, 
        error: !text ? 'Text required' : 'AI not available' 
      })
    }

    const prompt = `다음 지문에서 ${grade} 학년 수준에 맞는 중요한 어휘 ${count}개를 추출하고, 각 어휘의 뜻과 예문을 제공해주세요.\n\n지문: ${text}\n\n다음 JSON 형식으로만 응답해주세요:\n{\n  "vocabulary": [\n    {\n      "word": "어휘",\n      "meaning": "의미 설명",\n      "example": "예문",\n      "difficulty": 1\n    }\n  ]\n}`

    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }]
    })

    let vocabulary = []
    try {
      const content = response.content[0].text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        vocabulary = parsed.vocabulary || []
      }
    } catch (e) {
      console.error('Parse error:', e)
    }

    res.json({ success: true, vocabulary, count: vocabulary.length })
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/ai/generate-problems', async (req, res) => {
  try {
    const { text, type = 'reading', count = 5, grade = 'elem4' } = req.body
    
    if (!text || !claude) {
      return res.status(400).json({ 
        success: false, 
        error: !text ? 'Text required' : 'AI not available' 
      })
    }

    const prompt = `다음 지문을 바탕으로 ${grade} 학년 수준의 ${type === 'vocabulary' ? '어휘' : '독해'} 문제 ${count}개를 생성해주세요.\n\n지문: ${text}\n\n다음 JSON 형식으로만 응답해주세요:\n{\n  "problems": [\n    {\n      "question": "문제",\n      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],\n      "answer": 0,\n      "explanation": "해설"\n    }\n  ]\n}`

    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 3000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    })

    let problems = []
    try {
      const content = response.content[0].text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        problems = parsed.problems || []
      }
    } catch (e) {
      console.error('Parse error:', e)
    }

    res.json({ success: true, problems, count: problems.length })
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/ai/analyze-text', async (req, res) => {
  try {
    const { text, targetGrade = 'elem4' } = req.body
    
    if (!text || !claude) {
      return res.status(400).json({ 
        success: false, 
        error: !text ? 'Text required' : 'AI not available' 
      })
    }

    const prompt = `다음 지문의 문해력 난이도를 ${targetGrade} 학년 기준으로 분석해주세요.\n\n지문: ${text}\n\n분석 항목:\n1. 텍스트 길이 적절성 (1-10점)\n2. 어휘 수준 (1-10점)\n3. 문장 복잡도 (1-10점)\n4. 내용 수준 (1-10점)\n5. 배경지식 요구도 (1-10점)\n\n각 항목을 점수와 함께 설명하고, 총평을 제공해주세요.`

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
    console.error('Error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/pdf/generate', (req, res) => {
  const { title = 'EduText Pro', blocks = [] } = req.body
  res.json({
    success: true,
    html: `<html><body><h1>${title}</h1></body></html>`,
    filename: `edutext-${Date.now()}.pdf`
  })
})

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server on port ${PORT}`)
  console.log(`Claude: ${claude ? 'Ready' : 'Not configured'}`)
})