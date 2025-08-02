# AI API 통합 설계 (Gemini/Claude)

## 1. AI 서비스 아키텍처 개요

원바이트 Print 모드의 AI 통합은 Google Gemini를 주요 공급자로, Anthropic Claude를 보조 공급자로 사용하는 이중화 구조로 설계됩니다.

### 1.1 AI 서비스 전략

```
Primary Provider: Google Gemini Pro
├── 한국어 특화 성능 우수
├── 비용 효율성
├── 빠른 응답 속도
└── 구조화된 출력 지원

Fallback Provider: Anthropic Claude
├── 높은 품질의 콘텐츠 생성
├── 복잡한 추론 작업
├── 안정성과 일관성
└── 긴 컨텍스트 지원
```

## 2. AI 서비스 구현

### 2.1 통합 AI 서비스 클래스

```javascript
// backend/services/aiService.js
class AIService {
  constructor() {
    this.geminiService = new GeminiService()
    this.claudeService = new ClaudeService()
    this.defaultProvider = 'gemini'
    this.retryAttempts = 3
    this.circuitBreaker = new CircuitBreaker()
  }

  async generateContent(request) {
    const {
      prompt,
      contentType,
      difficulty = 'intermediate',
      targetAge = 'adult',
      learningGoal = 'general',
      provider = this.defaultProvider,
      userId
    } = request

    // 요청 로깅
    await this.logRequest(request, userId)

    try {
      // Circuit breaker 패턴 적용
      if (this.circuitBreaker.isOpen(provider)) {
        return await this.generateWithFallback(request)
      }

      let result
      if (provider === 'gemini') {
        result = await this.geminiService.generate(request)
      } else if (provider === 'claude') {
        result = await this.claudeService.generate(request)
      }

      // 성공 응답 로깅
      await this.logResponse(result, userId, provider)
      this.circuitBreaker.recordSuccess(provider)
      
      return result

    } catch (error) {
      // 실패 시 Circuit breaker 업데이트
      this.circuitBreaker.recordFailure(provider)
      
      // 폴백 시도
      if (provider === 'gemini') {
        console.warn('Gemini failed, trying Claude fallback')
        return await this.claudeService.generate(request)
      } else {
        console.warn('Claude failed, trying Gemini fallback')
        return await this.geminiService.generate(request)
      }
    }
  }

  // 프롬프트 빌더
  buildPrompt(userPrompt, contentType, options) {
    const prompts = new KoreanLearningPrompts()
    return prompts.build(userPrompt, contentType, options)
  }

  // 응답 파서
  parseResponse(response, contentType) {
    const parser = new ContentParser()
    return parser.parse(response, contentType)
  }
}
```

### 2.2 Google Gemini 서비스

```javascript
// backend/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai'

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
      }
    })
  }

  async generate(request) {
    const { prompt, contentType, difficulty, targetAge, learningGoal } = request
    
    // 한국어 학습 전용 프롬프트 생성
    const enhancedPrompt = this.buildKoreanLearningPrompt(
      prompt, 
      contentType, 
      { difficulty, targetAge, learningGoal }
    )

    try {
      const result = await this.model.generateContent(enhancedPrompt)
      const response = await result.response
      const text = response.text()

      // JSON 파싱 시도
      try {
        const parsedContent = JSON.parse(text)
        return {
          success: true,
          content: parsedContent,
          provider: 'gemini',
          timestamp: new Date().toISOString(),
          tokensUsed: this.estimateTokens(text)
        }
      } catch (parseError) {
        // JSON 파싱 실패 시 텍스트 그대로 반환
        return {
          success: true,
          content: { rawText: text },
          provider: 'gemini',
          timestamp: new Date().toISOString(),
          tokensUsed: this.estimateTokens(text)
        }
      }

    } catch (error) {
      console.error('Gemini API Error:', error)
      throw new Error(`Gemini generation failed: ${error.message}`)
    }
  }

  buildKoreanLearningPrompt(userPrompt, contentType, options) {
    const basePrompts = {
      vocabulary: `한국어 어휘 학습 자료를 생성해주세요. 
다음 요소들을 포함해야 합니다:
- 새로운 단어들의 정의와 예문
- 단어의 품사와 활용
- 실생활 사용 예시
- 유사한 의미의 다른 단어들`,

      grammar: `한국어 문법 학습 자료를 생성해주세요.
다음 요소들을 포함해야 합니다:
- 문법 규칙의 명확한 설명
- 다양한 예문 (긍정문, 부정문, 의문문)
- 주의사항이나 예외 상황
- 비슷한 문법과의 차이점`,

      reading: `한국어 읽기 학습 자료를 생성해주세요.
다음 요소들을 포함해야 합니다:
- 적절한 길이의 읽기 지문
- 지문 내용에 대한 이해 문제
- 새로운 어휘 설명
- 문화적 배경 정보`,

      quiz: `한국어 학습 퀴즈를 생성해주세요.
다음 요소들을 포함해야 합니다:
- 다양한 유형의 문제 (객관식, 주관식, 빈칸 채우기)
- 명확하고 정확한 정답
- 오답에 대한 설명
- 추가 학습 팁`
    }

    const difficultyGuides = {
      beginner: '초급자용 (한글을 읽을 수 있고 기본 단어 500개 정도 아는 수준)',
      intermediate: '중급자용 (일상 대화가 가능하고 기본 문법을 아는 수준)',
      advanced: '고급자용 (복잡한 문장을 이해하고 뉘앙스를 구분할 수 있는 수준)'
    }

    const ageGuides = {
      child: '어린이용 (재미있고 쉬운 예시, 그림이나 게임 요소 포함)',
      teen: '청소년용 (학교생활, 친구 관계 등 관련 예시)',
      adult: '성인용 (직장생활, 사회생활 등 실용적 예시)',
      senior: '시니어용 (천천히, 자세히, 반복 설명 위주)'
    }

    return `${basePrompts[contentType] || basePrompts.vocabulary}

사용자 요청: "${userPrompt}"

설정:
- 난이도: ${options.difficulty} (${difficultyGuides[options.difficulty]})
- 대상 연령: ${options.targetAge} (${ageGuides[options.targetAge]})
- 학습 목표: ${options.learningGoal}

응답 형식:
다음 JSON 구조로 정확히 응답해주세요:

{
  "title": "학습 자료 제목",
  "description": "학습 자료에 대한 간단한 설명",
  "mainContent": {
    "introduction": "도입부 설명",
    "keyPoints": [
      "핵심 포인트 1",
      "핵심 포인트 2",
      "핵심 포인트 3"
    ],
    "examples": [
      {
        "korean": "한국어 예문",
        "romanization": "로마자 표기 (초급자용일 때만)",
        "english": "영어 번역",
        "explanation": "설명"
      }
    ]
  },
  "exercises": [
    {
      "type": "multiple-choice",
      "question": "문제",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "correctAnswer": 0,
      "explanation": "정답 설명"
    },
    {
      "type": "fill-in-blank",
      "sentence": "빈칸이 있는 _____ 문장",
      "answer": "정답",
      "hint": "힌트"
    }
  ],
  "additionalNotes": [
    "추가 학습 팁이나 주의사항"
  ],
  "culturalContext": "한국 문화와 관련된 배경 정보 (해당되는 경우)"
}

중요: 반드시 유효한 JSON 형식으로만 응답하고, 추가 설명은 JSON 내부에 포함시켜주세요.`
  }

  estimateTokens(text) {
    // 한국어 토큰 추정 (대략적)
    return Math.ceil(text.length / 2.5)
  }
}
```

### 2.3 Anthropic Claude 서비스

```javascript
// backend/services/claudeService.js
import Anthropic from '@anthropic-ai/sdk'

class ClaudeService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    })
    this.model = 'claude-3-5-sonnet-20241022'
  }

  async generate(request) {
    const { prompt, contentType, difficulty, targetAge, learningGoal } = request
    
    const enhancedPrompt = this.buildKoreanLearningPrompt(
      prompt, 
      contentType, 
      { difficulty, targetAge, learningGoal }
    )

    try {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: enhancedPrompt
        }]
      })

      const text = message.content[0].text

      // JSON 파싱 시도
      try {
        const parsedContent = JSON.parse(text)
        return {
          success: true,
          content: parsedContent,
          provider: 'claude',
          timestamp: new Date().toISOString(),
          tokensUsed: message.usage?.output_tokens || this.estimateTokens(text)
        }
      } catch (parseError) {
        return {
          success: true,
          content: { rawText: text },
          provider: 'claude',
          timestamp: new Date().toISOString(),
          tokensUsed: message.usage?.output_tokens || this.estimateTokens(text)
        }
      }

    } catch (error) {
      console.error('Claude API Error:', error)
      throw new Error(`Claude generation failed: ${error.message}`)
    }
  }

  buildKoreanLearningPrompt(userPrompt, contentType, options) {
    // Gemini와 유사하지만 Claude에 최적화된 프롬프트
    return `당신은 한국어 교육 전문가입니다. 한국어를 배우는 외국인 학습자를 위한 고품질 학습 자료를 생성해주세요.

요청 내용: ${userPrompt}
콘텐츠 유형: ${contentType}
난이도: ${options.difficulty}
대상 연령: ${options.targetAge}
학습 목표: ${options.learningGoal}

다음 JSON 형식으로 정확히 응답해주세요:

{
  "title": "학습 자료 제목",
  "description": "학습 자료 설명",
  "mainContent": {
    "introduction": "도입 설명",
    "keyPoints": ["핵심 내용들"],
    "examples": [
      {
        "korean": "한국어 예문",
        "english": "영어 번역",
        "explanation": "설명"
      }
    ]
  },
  "exercises": [
    {
      "type": "문제 유형",
      "question": "문제",
      "answer": "정답",
      "explanation": "설명"
    }
  ],
  "tips": ["학습 팁들"]
}

반드시 유효한 JSON만 출력하고, 한국어 학습에 실제로 도움이 되는 정확하고 실용적인 내용을 포함해주세요.`
  }

  estimateTokens(text) {
    return Math.ceil(text.length / 3)
  }
}
```

## 3. Circuit Breaker 패턴 구현

```javascript
// backend/utils/circuitBreaker.js
class CircuitBreaker {
  constructor() {
    this.failures = new Map() // provider -> failure count
    this.lastFailureTime = new Map() // provider -> timestamp
    this.state = new Map() // provider -> 'closed' | 'open' | 'half-open'
    
    this.failureThreshold = 5
    this.resetTimeout = 60000 // 1분
  }

  isOpen(provider) {
    const state = this.state.get(provider) || 'closed'
    
    if (state === 'open') {
      const lastFailure = this.lastFailureTime.get(provider) || 0
      if (Date.now() - lastFailure > this.resetTimeout) {
        this.state.set(provider, 'half-open')
        return false
      }
      return true
    }
    
    return false
  }

  recordSuccess(provider) {
    this.failures.set(provider, 0)
    this.state.set(provider, 'closed')
  }

  recordFailure(provider) {
    const currentFailures = this.failures.get(provider) || 0
    const newFailures = currentFailures + 1
    
    this.failures.set(provider, newFailures)
    this.lastFailureTime.set(provider, Date.now())
    
    if (newFailures >= this.failureThreshold) {
      this.state.set(provider, 'open')
    }
  }

  getStatus() {
    return {
      gemini: {
        state: this.state.get('gemini') || 'closed',
        failures: this.failures.get('gemini') || 0
      },
      claude: {
        state: this.state.get('claude') || 'closed',
        failures: this.failures.get('claude') || 0
      }
    }
  }
}
```

## 4. 콘텐츠 파서 및 검증

```javascript
// backend/utils/contentParser.js
class ContentParser {
  parse(response, contentType) {
    try {
      // 이미 파싱된 경우
      if (typeof response.content === 'object') {
        return this.validateAndFormat(response.content, contentType)
      }
      
      // 텍스트에서 JSON 추출
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsedContent = JSON.parse(jsonMatch[0])
        return this.validateAndFormat(parsedContent, contentType)
      }
      
      // JSON 파싱 실패 시 기본 구조로 변환
      return this.createDefaultStructure(response.content, contentType)
      
    } catch (error) {
      console.error('Content parsing error:', error)
      return this.createErrorStructure(response.content)
    }
  }

  validateAndFormat(content, contentType) {
    const validators = {
      vocabulary: this.validateVocabulary.bind(this),
      grammar: this.validateGrammar.bind(this),
      reading: this.validateReading.bind(this),
      quiz: this.validateQuiz.bind(this)
    }

    const validator = validators[contentType] || this.validateGeneral.bind(this)
    return validator(content)
  }

  validateVocabulary(content) {
    return {
      type: 'vocabulary',
      title: content.title || '어휘 학습',
      description: content.description || '',
      words: content.words || content.mainContent?.examples || [],
      exercises: content.exercises || [],
      tips: content.tips || content.additionalNotes || []
    }
  }

  validateGrammar(content) {
    return {
      type: 'grammar',
      title: content.title || '문법 학습',
      description: content.description || '',
      rules: content.rules || content.mainContent?.keyPoints || [],
      examples: content.examples || content.mainContent?.examples || [],
      exercises: content.exercises || [],
      tips: content.tips || content.additionalNotes || []
    }
  }

  validateQuiz(content) {
    return {
      type: 'quiz',
      title: content.title || '한국어 퀴즈',
      description: content.description || '',
      questions: (content.exercises || []).map(q => ({
        type: q.type || 'multiple-choice',
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer || q.answer,
        explanation: q.explanation || q.hint || ''
      }))
    }
  }

  createDefaultStructure(rawContent, contentType) {
    return {
      type: contentType,
      title: `${contentType} 학습 자료`,
      description: 'AI가 생성한 학습 자료입니다.',
      content: rawContent,
      exercises: [],
      tips: []
    }
  }

  createErrorStructure(rawContent) {
    return {
      type: 'error',
      title: '생성 오류',
      description: '콘텐츠 생성 중 오류가 발생했습니다.',
      content: rawContent || '오류가 발생했습니다.',
      error: true
    }
  }
}
```

## 5. API 엔드포인트

```javascript
// backend/routes/ai.js
import express from 'express'
import { AIService } from '../services/aiService.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateAIRequest } from '../middleware/validation.js'

const router = express.Router()
const aiService = new AIService()

// AI 콘텐츠 생성
router.post('/generate', authMiddleware, validateAIRequest, async (req, res) => {
  try {
    const userId = req.user.id
    const request = {
      ...req.body,
      userId
    }

    const result = await aiService.generateContent(request)
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI generation error:', error)
    res.status(500).json({
      success: false,
      error: 'AI 콘텐츠 생성에 실패했습니다.',
      message: error.message
    })
  }
})

// AI 서비스 상태 확인
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const status = aiService.getStatus()
    res.json({
      success: true,
      status
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'AI 서비스 상태 확인에 실패했습니다.'
    })
  }
})

// 생성 히스토리 조회
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const { limit = 20, offset = 0 } = req.query

    const history = await aiService.getGenerationHistory(userId, limit, offset)
    
    res.json({
      success: true,
      data: history
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: '생성 히스토리 조회에 실패했습니다.'
    })
  }
})

export default router
```

## 6. 프론트엔드 AI 서비스

```javascript
// src/services/aiService.js
class AIService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001'
  }

  async generateContent(request) {
    try {
      const response = await fetch(`${this.baseURL}/api/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'AI 생성에 실패했습니다.')
      }

      return data.data

    } catch (error) {
      console.error('AI Service Error:', error)
      throw error
    }
  }

  async getStatus() {
    try {
      const response = await fetch(`${this.baseURL}/api/ai/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()
      return data.status

    } catch (error) {
      console.error('AI Status Error:', error)
      return null
    }
  }

  async getHistory(limit = 20, offset = 0) {
    try {
      const response = await fetch(
        `${this.baseURL}/api/ai/history?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      const data = await response.json()
      return data.data

    } catch (error) {
      console.error('AI History Error:', error)
      return []
    }
  }
}

export default new AIService()
```

## 7. 비용 최적화 및 모니터링

### 7.1 토큰 사용량 추적

```javascript
// backend/utils/tokenTracker.js
class TokenTracker {
  constructor() {
    this.dailyUsage = new Map() // userId -> tokens used today
    this.monthlyUsage = new Map() // userId -> tokens used this month
  }

  trackUsage(userId, tokensUsed, provider) {
    const today = new Date().toDateString()
    const month = new Date().toISOString().slice(0, 7) // YYYY-MM

    // 일일 사용량
    const dailyKey = `${userId}-${today}`
    const currentDaily = this.dailyUsage.get(dailyKey) || 0
    this.dailyUsage.set(dailyKey, currentDaily + tokensUsed)

    // 월간 사용량
    const monthlyKey = `${userId}-${month}`
    const currentMonthly = this.monthlyUsage.get(monthlyKey) || 0
    this.monthlyUsage.set(monthlyKey, currentMonthly + tokensUsed)

    // 데이터베이스에 저장
    this.saveToDatabase(userId, tokensUsed, provider, today, month)
  }

  async checkLimits(userId, tokensNeeded) {
    const userTier = await this.getUserTier(userId)
    const limits = this.getTierLimits(userTier)

    const todayUsage = await this.getTodayUsage(userId)
    const monthlyUsage = await this.getMonthlyUsage(userId)

    if (todayUsage + tokensNeeded > limits.daily) {
      throw new Error('일일 토큰 한도를 초과했습니다.')
    }

    if (monthlyUsage + tokensNeeded > limits.monthly) {
      throw new Error('월간 토큰 한도를 초과했습니다.')
    }

    return true
  }

  getTierLimits(tier) {
    const limits = {
      free: { daily: 10000, monthly: 100000 },
      basic: { daily: 50000, monthly: 500000 },
      premium: { daily: 200000, monthly: 2000000 }
    }
    return limits[tier] || limits.free
  }
}
```

이 AI 통합 설계는 안정성, 확장성, 비용 효율성을 모두 고려하여 설계되었으며, 사용자에게 일관된 고품질의 한국어 학습 콘텐츠를 제공할 수 있습니다.