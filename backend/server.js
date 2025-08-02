import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createClient } from '@supabase/supabase-js'
import SupabaseService from './services/supabaseService.js'
import templateRoutes from './routes/templates.js'
import aiGenerationRoutes from './routes/aiGeneration.js'
import { adminAuthMiddleware } from './middleware/adminAuth.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Initialize Supabase Service
const supabaseService = new SupabaseService()

// CORS configuration - MUST come before other middleware
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://wonbyte-pro-app.vercel.app',
      'https://wonbyte-pro.vercel.app',
      'https://onbyte-print.netlify.app', 
      'https://edutext-pro.netlify.app', 
      'https://onbyte-print-frontend.onrender.com',
      'https://mingukang0719.github.io'
    ]
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.log('CORS blocked origin:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Request-Id']
}

app.use(cors(corsOptions))

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.headers.origin}`)
  next()
})

// Helmet configuration - configured to work with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api/', limiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Handle preflight requests for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.sendStatus(200)
})

// Health check endpoint with Supabase status
app.get('/api/health', async (req, res) => {
  try {
    const supabaseHealth = await supabaseService.healthCheck()
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        supabase: supabaseHealth.success ? 'connected' : 'disconnected',
        database: supabaseHealth.supabase
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasClaudeKey: !!process.env.CLAUDE_API_KEY,
        claudeKeyLength: process.env.CLAUDE_API_KEY?.length,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasEncryptionSecret: !!process.env.API_KEY_ENCRYPTION_SECRET
      }
    })
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

// AI Content Generation endpoint
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { 
      provider = 'gemini',
      contentType = 'vocabulary',
      difficulty = 'intermediate', 
      targetAge = 'adult',
      prompt,
      userId 
    } = req.body

    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        error: 'Prompt is required' 
      })
    }

    // AI 서비스 동적 import (실제 구현에서는 상단에서 import)
    const AIService = (await import('./services/aiService.js')).default
    const aiService = new AIService()

    const result = await aiService.generateContent({
      provider,
      contentType,
      difficulty,
      targetAge,
      prompt,
      userId
    })

    // Supabase에 생성 로그 저장
    if (result.success && userId) {
      try {
        await supabaseService.logAIGeneration(
          userId,
          provider,
          contentType,
          prompt,
          result.content,
          {
            targetAge,
            difficulty,
            contentLength,
            tokensUsed: result.tokensUsed
          }
        )
      } catch (logError) {
        console.error('Failed to log AI generation:', logError)
        // 로깅 실패는 치명적이지 않으므로 계속 진행
      }
    }

    res.json(result)

  } catch (error) {
    console.error('AI Generation error:', error)
    res.status(500).json({ 
      success: false,
      error: 'AI 콘텐츠 생성에 실패했습니다',
      message: error.message 
    })
  }
})

// AI Provider Status endpoint
app.get('/api/ai/status', async (req, res) => {
  try {
    const AIService = (await import('./services/aiService.js')).default
    const aiService = new AIService()
    
    const status = await aiService.checkProviderStatus()
    
    res.json({
      success: true,
      status
    })
  } catch (error) {
    console.error('AI Status error:', error)
    res.status(500).json({
      success: false,
      error: 'AI 상태 확인에 실패했습니다'
    })
  }
})

// PDF Generation endpoint
app.post('/api/pdf/generate', async (req, res) => {
  try {
    const { title, blocks } = req.body

    if (!blocks || !Array.isArray(blocks)) {
      return res.status(400).json({ 
        success: false,
        error: 'Blocks array is required' 
      })
    }

    // PDF 서비스 동적 import
    const PDFService = (await import('./services/pdfService.js')).default
    const pdfService = new PDFService()

    const result = await pdfService.generatePDF({ title, blocks })

    res.json(result)

  } catch (error) {
    console.error('PDF Generation error:', error)
    res.status(500).json({ 
      success: false,
      error: 'PDF 생성에 실패했습니다',
      message: error.message 
    })
  }
})

// PDF Download endpoint (HTML preview)
app.get('/api/pdf/download/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params
    
    // TODO: 실제 구현에서는 파일 저장소에서 HTML 파일을 읽어서 반환
    // 현재는 기본 템플릿 반환
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PDF Preview - ${fileName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Noto Sans KR', sans-serif;
            background: #f5f5f5;
            padding: 20px;
            margin: 0;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            background: white;
            margin: 0 auto;
            padding: 20mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .message {
            text-align: center;
            color: #666;
            margin-top: 100px;
          }
          .button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Noto Sans KR', sans-serif;
            margin-top: 20px;
          }
          @media print {
            body { background: white; padding: 0; }
            .page { box-shadow: none; margin: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="message">
            <h1>PDF 미리보기</h1>
            <p>요청된 파일: ${fileName}</p>
            <p>실제 콘텐츠가 표시될 위치입니다.</p>
            <div class="no-print">
              <button class="button" onclick="window.print()">PDF로 저장 / 인쇄</button>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)

  } catch (error) {
    console.error('PDF Download error:', error)
    res.status(500).json({
      success: false,
      error: 'PDF 다운로드에 실패했습니다'
    })
  }
})

// Legacy generate endpoint (for backward compatibility)
app.post('/api/generate', async (req, res) => {
  try {
    const { text, userId } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    // 기본 샘플 콘텐츠 반환
    const generatedContent = `생성된 교육 콘텐츠: ${text}에 대한 상세한 설명과 예시들...

주요 개념:
1. 기본 원리 설명
2. 실제 적용 사례
3. 연습 문제와 해답
4. 추가 학습 자료

이 내용은 샘플 콘텐츠입니다. AI 생성을 위해서는 /api/ai/generate를 사용하세요.`

    res.json({
      success: true,
      generatedContent,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Generation error:', error)
    res.status(500).json({ 
      error: 'Content generation failed',
      message: error.message 
    })
  }
})

// Template management routes
app.use('/api/admin/templates', templateRoutes)

// AI generation routes
app.use('/api/ai', aiGenerationRoutes)

// Admin login endpoint with Supabase integration
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Use Supabase authentication
    const result = await supabaseService.authenticateUser(email, password)
    
    res.json({
      success: true,
      token: result.token,
      user: result.user
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(401).json({ 
      success: false,
      error: error.message || 'Invalid credentials' 
    })
  }
})

// Admin stats endpoint with real Supabase data
app.get('/api/admin/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const stats = await supabaseService.getUsageStats()
    
    // Claude 사용 통계 추가
    const { data: claudeStats } = await supabase
      .from('ai_generation_logs')
      .select('ai_provider, tokens_used, cost_estimate')
      .eq('ai_provider', 'claude')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const claudeUsage = claudeStats?.reduce((acc, log) => ({
      totalTokens: acc.totalTokens + (log.tokens_used || 0),
      totalCost: acc.totalCost + (log.cost_estimate || 0),
      count: acc.count + 1
    }), { totalTokens: 0, totalCost: 0, count: 0 })
    
    res.json({
      success: true,
      stats: {
        totalGenerations: stats.totalGenerations,
        totalTokens: stats.totalTokens,
        providerBreakdown: {
          ...stats.byProvider,
          claude: claudeUsage
        },
        contentTypeBreakdown: stats.byContentType,
        dailyUsage: stats.dailyUsage,
        templates: {
          total: await supabase.from('reading_templates').select('count'),
          active: await supabase.from('reading_templates').select('count').eq('is_active', true)
        }
      }
    })

  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch stats' 
    })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 EduText Pro Backend running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})