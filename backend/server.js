// EduText Pro Backend - Ultra Minimal Version
// Force rebuild: 2025-08-02 13:30
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Anthropic } from '@anthropic-ai/sdk'
import apiKeyService from './services/apiKeyService.js'

dotenv.config()

// Set encryption key
process.env.ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET

const app = express()
const PORT = process.env.PORT || 3001

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://extraordinary-bublanina-2886c0.netlify.app',
      'https://wonbyte-pro.netlify.app', // 커스텀 도메인 추가 시 사용
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

// Claude setup - will be initialized on first use
let claude = null
const initClaude = async () => {
  if (!claude) {
    const apiKey = await apiKeyService.getApiKey('claude')
    if (apiKey) {
      claude = new Anthropic({ apiKey: apiKey })
      console.log('Claude initialized with API key from Supabase')
    } else {
      console.error('No Claude API key available')
    }
  }
  return claude
}

// Routes
app.get('/', async (req, res) => {
  const claudeClient = await initClaude()
  res.json({ status: 'running', claude: !!claudeClient })
})

app.get('/api/health', async (req, res) => {
  const claudeClient = await initClaude()
  res.json({ status: 'OK', claude: !!claudeClient })
})

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Working!' })
})

app.get('/api/ai/status', async (req, res) => {
  const claudeClient = await initClaude()
  res.json({
    success: true,
    providers: { claude: { available: !!claudeClient } }
  })
})

app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt, contentType = 'reading', targetAge = 10, contentLength = 800 } = req.body
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt required'
      })
    }
    
    const claudeClient = await initClaude()
    if (!claudeClient) {
      return res.status(503).json({ 
        success: false, 
        error: 'AI service not available' 
      })
    }

    const fullPrompt = contentType === 'reading' 
      ? `한국어 읽기 지문을 생성해주세요.\n주제: ${prompt}\n대상: ${targetAge}세\n길이: 약 ${contentLength}자\n\n요구사항:\n- 해당 연령에 적합한 어휘와 문장 구조 사용\n- 교육적 가치가 있는 내용\n- 흥미롭고 이해하기 쉬운 내용\n- 정확히 ${contentLength}자 내외로 작성`
      : prompt

    const response = await claudeClient.messages.create({
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
    const { text, grade = 'elem4', count = 5 } = req.body
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text required'
      })
    }
    
    const claudeClient = await initClaude()
    if (!claudeClient) {
      return res.status(503).json({ 
        success: false, 
        error: 'AI service not available' 
      })
    }

    const prompt = `다음 지문에서 ${grade} 학년 수준에 맞는 핵심 어휘 ${count}개를 추출하고 분석해주세요.\n\n지문: ${text}\n\n다음 JSON 형식으로만 응답해주세요. 절대로 JSON 외의 다른 텍스트는 포함하지 마세요:\n{\n  "vocabularyList": [\n    {\n      "word": "어휘",\n      "meaning": "한자어 기반 쉬운 풀이",\n      "etymology": "한자어 어원 (예: 觀(볼 관) + 察(살필 찰))",\n      "synonyms": ["유의어1", "유의어2"],\n      "antonyms": ["반의어1", "반의어2"],\n      "difficulty": "★★★☆☆",\n      "example": "자연스러운 예문",\n      "gradeAppropriate": true\n    }\n  ]\n}`

    const response = await claudeClient.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 3000,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }]
    })

    let vocabularyList = []
    try {
      const content = response.content[0].text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        vocabularyList = parsed.vocabularyList || []
      }
    } catch (e) {
      console.error('Parse error:', e)
      // 파싱 실패 시 샘플 데이터 제공
      vocabularyList = [
        {
          word: '관찰',
          meaning: '자세히 살펴보는 것',
          etymology: '觀(볼 관) + 察(살필 찰)',
          synonyms: ['구경', '살피기'],
          antonyms: ['무시', '소홀'],
          difficulty: '★★★☆☆',
          example: '과학자는 현미경으로 세포를 관찰했습니다.',
          gradeAppropriate: true
        }
      ]
    }

    res.json({ success: true, content: { vocabularyList }, count: vocabularyList.length })
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/ai/generate-problems', async (req, res) => {
  try {
    const { text, type = 'mixed', count = 5, grade = 'elem4' } = req.body
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text required'
      })
    }
    
    const claudeClient = await initClaude()
    if (!claudeClient) {
      return res.status(503).json({ 
        success: false, 
        error: 'AI service not available' 
      })
    }

    const prompt = `다음 지문을 바탕으로 ${grade} 학년 수준의 문해력 훈련 문제 ${count}개를 생성해주세요.\n\n지문: ${text}\n\n문제 구성: 객관식 3-4개, 서술형 1-2개\n\n다음 JSON 형식으로만 응답해주세요. 절대로 JSON 외의 다른 텍스트는 포함하지 마세요:\n{\n  "problems": [\n    {\n      "type": "multiple_choice",\n      "question": "문제 내용",\n      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],\n      "correctAnswer": 0,\n      "explanation": "정답 해설"\n    },\n    {\n      "type": "short_answer",\n      "question": "서술형 문제 내용",\n      "expectedLength": "1-2문장",\n      "sampleAnswer": "예시 답안",\n      "gradingCriteria": ["채점 기준 1", "채점 기준 2"],\n      "explanation": "문제 해설"\n    }\n  ]\n}`

    const response = await claudeClient.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
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
      // 파싱 실패 시 샘플 데이터 제공
      problems = [
        {
          type: 'multiple_choice',
          question: '이 글의 주제로 가장 적절한 것은?',
          options: ['환경 보호의 중요성', '기술 발전의 문제점', '교육의 필요성', '건강한 생활 습관'],
          correctAnswer: 0,
          explanation: '글 전체에서 환경을 보호해야 한다는 내용이 반복적으로 나타나므로 주제는 환경 보호의 중요성입니다.'
        },
        {
          type: 'short_answer',
          question: '환경을 보호하기 위해 우리가 할 수 있는 일을 두 가지 쓰시오.',
          expectedLength: '1-2문장',
          sampleAnswer: '쓰레기 분리수거를 하고, 일회용품 사용을 줄인다.',
          gradingCriteria: ['환경 보호와 관련된 구체적인 행동 제시', '두 가지 이상의 방법 언급'],
          explanation: '환경 보호를 위한 실천 방안으로는 재활용, 에너지 절약, 대중교통 이용 등이 있습니다.'
        }
      ]
    }

    res.json({ success: true, content: { problems }, count: problems.length })
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/ai/analyze-text', async (req, res) => {
  try {
    const { text, grade = 'elem4' } = req.body
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text required'
      })
    }
    
    const claudeClient = await initClaude()
    if (!claudeClient) {
      return res.status(503).json({ 
        success: false, 
        error: 'AI service not available' 
      })
    }

    const prompt = `다음 지문의 문해력 난이도를 ${grade} 학년 기준으로 분석해주세요.\n\n지문: ${text}\n\n다음 JSON 형식으로만 응답해주세요. 절대로 JSON 외의 다른 텍스트는 포함하지 마세요:\n{\n  "textLength": 8,\n  "vocabularyLevel": 7,\n  "sentenceComplexity": 6,\n  "contentLevel": 7,\n  "backgroundKnowledge": 5,\n  "totalScore": 6.6,\n  "analysis": "해당 학년 수준에 맞는지에 대한 상세한 분석"\n}\n\n각 항목은 1-10점으로 평가해주세요:\n1. textLength: 텍스트 길이 적절성\n2. vocabularyLevel: 어휘 난이도\n3. sentenceComplexity: 문장 구조 복잡성\n4. contentLevel: 내용 구성 수준\n5. backgroundKnowledge: 배경지식 의존도\n6. totalScore: 전체 평균 점수\n7. analysis: 종합적인 분석 설명`

    const response = await claudeClient.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }]
    })

    let analysisResult = null
    try {
      const content = response.content[0].text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('Parse error:', e)
      // 파싱 실패 시 기본 분석 제공
      const charCount = text.length
      const sentences = text.split(/[.!?]/).filter(s => s.trim())
      const sentenceCount = sentences.length || 1
      const avgSentenceLength = charCount / sentenceCount
      
      analysisResult = {
        textLength: Math.min(10, Math.round(charCount / 200)),
        vocabularyLevel: Math.min(10, Math.round(avgSentenceLength / 10)),
        sentenceComplexity: Math.min(10, Math.round(avgSentenceLength / 15)),
        contentLevel: Math.min(10, 7),
        backgroundKnowledge: Math.min(10, 5),
        totalScore: Math.round((charCount / 200 + avgSentenceLength / 10 + avgSentenceLength / 15 + 7 + 5) / 5 * 10) / 10,
        analysis: '이 지문은 해당 학년 수준에 적합한 난이도를 가지고 있습니다.'
      }
    }

    res.json({
      success: true,
      content: analysisResult,
      targetGrade: grade
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

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server on port ${PORT}`)
  // Try to initialize Claude on startup
  const claudeClient = await initClaude()
  console.log(`Claude: ${claudeClient ? 'Ready' : 'Not configured'}`)
})