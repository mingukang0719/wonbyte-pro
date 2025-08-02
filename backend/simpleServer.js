// 가장 간단한 백엔드 서버 - 디버깅용
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// CORS - 모든 origin 허용 (테스트용)
app.use(cors({
  origin: true,
  credentials: true
}))

app.use(express.json())

// 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  console.log('Origin:', req.headers.origin)
  console.log('Body:', req.body)
  next()
})

// 테스트 엔드포인트
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Simple server is working!',
    timestamp: new Date().toISOString()
  })
})

// AI 생성 엔드포인트 - 매우 간단한 버전
app.post('/api/ai/generate', async (req, res) => {
  console.log('AI Generate called with:', req.body)
  
  try {
    const { prompt, provider = 'claude' } = req.body
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      })
    }

    // Claude API 직접 호출
    if (provider === 'claude' && process.env.CLAUDE_API_KEY) {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      
      // API 키에서 따옴표 제거
      const apiKey = process.env.CLAUDE_API_KEY.replace(/^["']|["']$/g, '')
      console.log('Using Claude API key:', apiKey.substring(0, 15) + '...')
      
      const anthropic = new Anthropic({
        apiKey: apiKey
      })

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      return res.json({
        success: true,
        content: response.content[0].text,
        provider: 'claude',
        timestamp: new Date().toISOString()
      })
    }

    // 환경변수가 없으면 테스트 응답
    res.json({
      success: true,
      content: `테스트 응답입니다. 요청하신 내용: ${prompt}`,
      provider: 'test',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in generate:', error)
    res.status(500).json({
      success: false,
      error: 'Generation failed',
      message: error.message
    })
  }
})

// 404 핸들러
app.use('*', (req, res) => {
  console.log('404 for:', req.originalUrl)
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple server running on port ${PORT}`)
  console.log('Environment:', process.env.NODE_ENV || 'development')
  console.log('Claude API Key:', process.env.CLAUDE_API_KEY ? 'Set' : 'Not set')
})