import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createClient } from '@supabase/supabase-js'
import SupabaseService from './services/supabaseService.js'
import templateRoutes from './routes/templates.js'
// import aiGenerationRoutes from './routes/aiGeneration.js'
import aiGenerationRoutes from './routes/aiGenerationSimple.js'
import pdfGenerationRoutes from './routes/pdfGeneration.js'
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
  origin: [
    'https://wonbyte-pro-app.vercel.app',
    'https://wonbyte-pro.vercel.app',
    'https://onbyte-print.netlify.app', 
    'https://edutext-pro.netlify.app', 
    'https://onbyte-print-frontend.onrender.com',
    'https://mingukang0719.github.io',
    // Local development
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
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

// Rate limiting with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit AI generation requests
  message: { error: 'AI generation rate limit exceeded. Please wait before making another request.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', generalLimiter)
app.use('/api/ai/', aiLimiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Let cors middleware handle preflight requests automatically

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
        claudeKeyLength: process.env.CLAUDE_API_KEY?.length || 0,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
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

// AI Content Generation endpoint is now handled by aiGenerationRoutes

// AI Provider Status endpoint
app.get('/api/ai/status', async (req, res) => {
  try {
    const AIService = (await import('./services/aiService.js')).default
    const aiService = new AIService()
    
    const status = await aiService.checkProviderStatus()
    
    // Debug: Show raw environment variable info
    const envDebug = {
      claudeKeyExists: !!process.env.CLAUDE_API_KEY,
      claudeKeyLength: process.env.CLAUDE_API_KEY?.length || 0,
      claudeKeyFirstChars: process.env.CLAUDE_API_KEY?.substring(0, 20) || 'not set',
      claudeKeyHasNewlines: process.env.CLAUDE_API_KEY?.includes('\n') || false,
      claudeKeyHasSpaces: process.env.CLAUDE_API_KEY?.includes(' ') || false,
      claudeKeyCharCodes: process.env.CLAUDE_API_KEY ? 
        Array.from(process.env.CLAUDE_API_KEY.substring(0, 30)).map(c => c.charCodeAt(0)).join(',') : 
        'not set'
    }
    
    res.json({
      success: true,
      status,
      debug: envDebug
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
    const { 
      title, 
      blocks,
      // 개별 필드들도 지원
      grade,
      text,
      analysisResult,
      selectedVocabulary,
      generatedProblems,
      vocabularyProblems,
      readingProblems
    } = req.body

    // blocks가 없으면 개별 필드들로부터 생성
    let pdfBlocks = blocks
    if (!pdfBlocks && text) {
      pdfBlocks = []
      
      // 지문 블록
      if (text) {
        pdfBlocks.push({
          type: 'text',
          title: '지문',
          content: text,
          metadata: { grade }
        })
      }
      
      // 분석 결과 블록
      if (analysisResult) {
        pdfBlocks.push({
          type: 'analysis',
          title: '난이도 분석',
          content: analysisResult
        })
      }
      
      // 어휘 블록
      if (selectedVocabulary && selectedVocabulary.length > 0) {
        pdfBlocks.push({
          type: 'vocabulary',
          title: '핵심 어휘',
          content: selectedVocabulary
        })
      }
      
      // 문제 블록들
      if (generatedProblems && generatedProblems.length > 0) {
        pdfBlocks.push({
          type: 'problems',
          title: '읽기 문제',
          content: generatedProblems
        })
      }
      
      if (vocabularyProblems && vocabularyProblems.length > 0) {
        pdfBlocks.push({
          type: 'problems',
          title: '어휘 문제',
          content: vocabularyProblems
        })
      }
      
      if (readingProblems && readingProblems.length > 0) {
        pdfBlocks.push({
          type: 'problems',
          title: '독해 문제',
          content: readingProblems
        })
      }
    }

    if (!pdfBlocks || !Array.isArray(pdfBlocks) || pdfBlocks.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No content to generate PDF' 
      })
    }

    // PDF 서비스 동적 import
    const PDFService = (await import('./services/pdfService.js')).default
    const pdfService = new PDFService()

    const result = await pdfService.generatePDF({ title, blocks: pdfBlocks })

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
    
    // 기본 PDF 미리보기 템플릿 반환
    // 향후 파일 저장소 통합 시 확장 가능
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

// Legacy generate endpoint removed - use /api/ai/generate instead

// Template management routes
app.use('/api/admin/templates', templateRoutes)

// AI generation routes
console.log('Mounting AI generation routes at /api/ai')
app.use('/api/ai', aiGenerationRoutes)

// PDF generation routes
app.use('/api/pdf', pdfGenerationRoutes)

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
  console.log(`404 - Endpoint not found: ${req.method} ${req.originalUrl}`)
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl, method: req.method })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 EduText Pro Backend running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})