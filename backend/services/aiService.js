// AI 서비스 - OpenAI, Gemini, Claude 선택형
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'
import APIKeyService from './apiKeyService.js'
import dotenv from 'dotenv'

// 환경변수 로드
dotenv.config()

class AIService {
  constructor() {
    this.apiKeyService = new APIKeyService()
    this.initialized = false
    this.initPromise = this.initialize()
  }

  async initialize() {
    try {
      // Debug: Log raw environment variables
      console.log('Raw environment variables:', {
        claudeKeyRaw: process.env.CLAUDE_API_KEY ? `"${process.env.CLAUDE_API_KEY}"` : 'not set',
        claudeKeyLength: process.env.CLAUDE_API_KEY?.length || 0,
        claudeKeyCharCodes: process.env.CLAUDE_API_KEY ? 
          Array.from(process.env.CLAUDE_API_KEY.slice(0, 20)).map(c => c.charCodeAt(0)) : 
          'not set'
      })

      // Supabase에서 API 키 가져오기
      const [openaiKey, claudeKey, geminiKey] = await Promise.all([
        this.apiKeyService.getAPIKey('openai'),
        this.apiKeyService.getAPIKey('claude'),
        this.apiKeyService.getAPIKey('gemini')
      ])

      // 환경변수 우선, 없으면 Supabase에서 가져온 키 사용
      const finalOpenAIKey = this.getValidKey(process.env.OPENAI_API_KEY) || openaiKey
      const finalClaudeKey = this.getValidKey(process.env.CLAUDE_API_KEY) || claudeKey
      const finalGeminiKey = this.getValidKey(process.env.GEMINI_API_KEY) || geminiKey

      console.log('AIService initialization:', {
        hasOpenAIKey: !!finalOpenAIKey,
        hasClaudeKey: !!finalClaudeKey,
        hasGeminiKey: !!finalGeminiKey,
        source: {
          openai: this.getValidKey(process.env.OPENAI_API_KEY) ? 'env' : 'supabase',
          claude: this.getValidKey(process.env.CLAUDE_API_KEY) ? 'env' : 'supabase',
          gemini: this.getValidKey(process.env.GEMINI_API_KEY) ? 'env' : 'supabase'
        }
      })
      
      // OpenAI API 키 설정
      this.openaiKey = finalOpenAIKey
      
      // Google Gemini 설정
      if (finalGeminiKey) {
        this.gemini = new GoogleGenerativeAI(finalGeminiKey)
        this.geminiModel = this.gemini.getGenerativeModel({ 
          model: 'gemini-1.5-pro',
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 4096,
          }
        })
      }

      // Anthropic Claude 설정
      if (finalClaudeKey) {
        console.log('Claude key setup:', {
          keyLength: finalClaudeKey.length,
          keyStart: finalClaudeKey.substring(0, 15),
          keyEnd: finalClaudeKey.substring(finalClaudeKey.length - 10)
        })
        
        try {
          this.claude = new Anthropic({
            apiKey: finalClaudeKey
          })
          console.log('Claude client initialized successfully')
        } catch (error) {
          console.error('Failed to initialize Claude client:', error)
          this.claude = null
        }
      }

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize AI Service:', error)
      // 초기화 실패해도 환경변수 키로 폴백
      this.fallbackToEnvKeys()
    }
  }

  getValidKey(key) {
    if (!key) return null
    
    // Clean and trim the key to remove any whitespace, newlines, or control characters
    // Be conservative - only remove clearly problematic characters
    let cleanedKey = key.toString()
      .trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/[\r\n\t\f\v]/g, '') // Remove line breaks and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters but keep printable
    
    console.log('Key cleaning debug:', {
      originalLength: key.length,
      cleanedLength: cleanedKey.length,
      original: `"${key}"`,
      cleaned: `"${cleanedKey}"`
    })
    
    if (!cleanedKey) return null
    
    // Check for common placeholder patterns
    const placeholders = [
      'your_',
      'your-',
      'placeholder',
      'example',
      'test_key',
      'dummy',
      'fake',
      'api_key_here'
    ]
    
    const keyLower = cleanedKey.toLowerCase()
    for (const placeholder of placeholders) {
      if (keyLower.includes(placeholder)) {
        console.log(`Invalid API key detected (contains "${placeholder}"): ${cleanedKey.substring(0, 10)}...`)
        return null
      }
    }
    
    // OpenAI API 키: sk-로 시작하고 40자 이상
    if (cleanedKey.startsWith('sk-proj-') && cleanedKey.length > 40) {
      console.log(`Valid OpenAI key detected: ${cleanedKey.substring(0, 15)}...`)
      return cleanedKey
    }
    
    // Legacy OpenAI API 키: sk-로 시작하고 40자 이상
    if (cleanedKey.startsWith('sk-') && !cleanedKey.startsWith('sk-ant-') && cleanedKey.length > 40) {
      console.log(`Valid OpenAI key detected: ${cleanedKey.substring(0, 10)}...`)
      return cleanedKey
    }
    
    // Claude API 키: sk-ant-로 시작
    if (cleanedKey.startsWith('sk-ant-') && cleanedKey.length > 50) {
      console.log(`Valid Claude key detected: ${cleanedKey.substring(0, 15)}...`)
      return cleanedKey
    }
    
    // Gemini API 키: 30자 이상이고 sk-로 시작하지 않음
    if (cleanedKey.length > 30 && !cleanedKey.startsWith('sk-')) {
      console.log(`Valid Gemini key detected: ${cleanedKey.substring(0, 10)}...`)
      return cleanedKey
    }
    
    // 길이가 20자 이상이면 일단 유효한 것으로 간주 (너무 엄격한 검증 완화)
    if (cleanedKey.length > 20) {
      console.log(`API key accepted with relaxed validation: ${cleanedKey.substring(0, 10)}... (length: ${cleanedKey.length})`)
      return cleanedKey
    }
    
    console.log(`API key validation failed for key: ${cleanedKey.substring(0, 10)}... (length: ${cleanedKey.length})`)
    return null
  }

  fallbackToEnvKeys() {
    const envOpenAI = this.getValidKey(process.env.OPENAI_API_KEY)
    const envClaude = this.getValidKey(process.env.CLAUDE_API_KEY)
    const envGemini = this.getValidKey(process.env.GEMINI_API_KEY)

    if (envOpenAI) this.openaiKey = envOpenAI
    if (envGemini) {
      this.gemini = new GoogleGenerativeAI(envGemini)
      this.geminiModel = this.gemini.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 4096,
        }
      })
    }
    if (envClaude) {
      this.claude = new Anthropic({ apiKey: envClaude })
    }
  }

  async generateContent(request) {
    // 초기화 대기
    if (!this.initialized) {
      await this.initPromise
    }
    const {
      provider = 'gemini',
      contentType = 'reading',
      difficulty = 'intermediate',
      targetAge = 'elem1',
      contentLength = '400',
      prompt,
      userId
    } = request

    try {
      let result
      console.log('Building prompt with parameters:', { contentType, difficulty, targetAge, contentLength })
      const enhancedPrompt = this.buildKoreanLearningPrompt(prompt, contentType, { difficulty, targetAge, contentLength })

      if (provider === 'openai' || provider === 'gpt') {
        result = await this.generateWithOpenAI(enhancedPrompt)
      } else if (provider === 'gemini') {
        result = await this.generateWithGemini(enhancedPrompt)
      } else if (provider === 'claude') {
        result = await this.generateWithClaude(enhancedPrompt)
      } else {
        throw new Error('지원하지 않는 AI 제공업체입니다.')
      }

      // 생성 로그 저장 (추후 구현)
      await this.logGeneration(userId, provider, prompt, result)

      return {
        success: true,
        content: result.content,
        provider: result.provider,
        timestamp: new Date().toISOString(),
        tokensUsed: result.tokensUsed
      }

    } catch (error) {
      console.error(`AI Generation Error (${provider}):`, error)
      throw new Error(`${provider} 콘텐츠 생성에 실패했습니다: ${error.message}`)
    }
  }

  async generateWithOpenAI(prompt) {
    try {
      // API 키가 없으면 오류 발생
      if (!this.openaiKey) {
        throw new Error('OpenAI API 키가 설정되지 않았습니다. 환경변수에서 OPENAI_API_KEY를 확인해주세요.')
      }
      
      console.log('OpenAI: Using real API with key:', this.openaiKey.substring(0, 10) + '...')

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: '당신은 한국어 교육 전문가입니다. 반드시 유효한 JSON 형식으로만 응답하세요. 어떤 인사말, 설명, 안내문구도 포함하지 마세요. 오직 요청된 JSON 데이터만 반환하세요.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4096,
          response_format: { type: "json_object" }
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const text = data.choices[0].message.content

      // JSON 파싱
      let parsedContent
      try {
        parsedContent = JSON.parse(text)
      } catch (parseError) {
        parsedContent = this.parseUnstructuredText(text)
      }

      return {
        content: parsedContent,
        provider: 'openai',
        tokensUsed: data.usage?.total_tokens || this.estimateTokens(text)
      }

    } catch (error) {
      console.error('OpenAI API Error:', error)
      throw new Error(`OpenAI 생성 실패: ${error.message}`)
    }
  }

  async generateWithGemini(prompt) {
    try {
      // Gemini 클라이언트가 초기화되지 않은 경우 오류 발생
      if (!this.gemini || !this.geminiModel) {
        throw new Error('Gemini API 키가 설정되지 않았습니다. 환경변수에서 GEMINI_API_KEY를 확인해주세요.')
      }
      
      console.log('Gemini: Using real API with initialized client')

      const result = await this.geminiModel.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // JSON 파싱 시도
      let parsedContent
      try {
        parsedContent = JSON.parse(text)
      } catch (parseError) {
        // JSON 파싱 실패 시 텍스트를 구조화
        parsedContent = this.parseUnstructuredText(text)
      }

      return {
        content: parsedContent,
        provider: 'gemini',
        tokensUsed: this.estimateTokens(text)
      }

    } catch (error) {
      console.error('Gemini API Error:', error)
      throw new Error(`Gemini 생성 실패: ${error.message}`)
    }
  }

  async generateWithClaude(prompt) {
    try {
      // Claude 클라이언트가 초기화되지 않은 경우 오류 발생
      if (!this.claude) {
        throw new Error('Claude API 키가 설정되지 않았습니다. 환경변수에서 CLAUDE_API_KEY를 확인해주세요.')
      }
      
      console.log('Claude: Using real API with initialized client')

      const message = await this.claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const text = message.content[0].text

      // JSON 파싱 시도
      let parsedContent
      try {
        parsedContent = JSON.parse(text)
      } catch (parseError) {
        console.log('Claude response is not JSON, parsing as unstructured text')
        parsedContent = this.parseUnstructuredText(text)
      }

      return {
        content: parsedContent,
        provider: 'claude',
        tokensUsed: message.usage?.output_tokens || this.estimateTokens(text)
      }

    } catch (error) {
      console.error('Claude API Error:', error)
      throw new Error(`Claude 생성 실패: ${error.message}`)
    }
  }

  buildKoreanLearningPrompt(userPrompt, contentType, options) {
    // userPrompt가 문자열인지 확인
    const promptText = typeof userPrompt === 'string' ? userPrompt : String(userPrompt || '')
    
    const basePrompts = {
      vocabulary: `지문에서 어려운 어휘를 추출하고 분석해주세요. 
각 어휘의 의미, 유의어, 반의어, 난이도를 포함해야 합니다.`,

      grammar: `한국어 문법 학습 자료를 생성해주세요.
문법 규칙의 명확한 설명, 다양한 예문, 주의사항을 포함해야 합니다.`,

      reading: `한국어 읽기 지문을 생성해주세요.
사용자가 요청한 주제에 대해 해당 연령과 수준에 맞는 지문을 정확한 글자 수로 작성해야 합니다.
지문은 교육적 가치가 있고 학생들이 흥미를 느낄 수 있는 내용이어야 합니다.`,

      analysis: `다음 지문의 문해력 난이도를 상세히 분석해주세요.
텍스트 길이, 어휘 수준, 문장 복잡도, 내용 수준, 배경지식 요구도를 각각 1-10점으로 평가하고,
해당 학년 수준에 맞는지 판단하여 구체적인 개선 방안을 제시해야 합니다.`,

      vocabulary_extraction: `다음 지문에서 해당 학년에게 어려울 만한 핵심 어휘 5개를 추출하고 분석해주세요.
각 어휘는 한자어 기반으로 쉽게 풀이하고, 예문, 유의어/반의어(있는 경우만)를 포함해야 합니다.
학년 수준에 적합한지도 판단해주세요.`,

      reading_problems: `다음 지문을 바탕으로 문해력 훈련 문제 5개를 생성해주세요.
객관식 문제 3-4개와 1-2문장으로 답할 수 있는 서술형 문제 1-2개를 포함해야 합니다.
각 문제는 정답과 상세한 해설을 포함해야 합니다.`,

      questions: `지문 기반 서술형 문제를 생성해주세요.
맥락 추론형과 내용 이해형 문제를 포함해야 합니다.`,

      answers: `문제에 대한 상세한 해설을 작성해주세요.
정답, 해설, 채점 기준, 학습 팁을 포함해야 합니다.`,

      quiz: `한국어 학습 퀴즈를 생성해주세요.
다양한 유형의 문제와 명확한 정답, 해설을 포함해야 합니다.`
    }

    const difficultyGuides = {
      beginner: '초급자용 (한글을 읽을 수 있고 기본 단어 500개 정도 아는 수준)',
      intermediate: '중급자용 (일상 대화가 가능하고 기본 문법을 아는 수준)',
      advanced: '고급자용 (복잡한 문장을 이해하고 뉘앙스를 구분할 수 있는 수준)'
    }

    const ageGuides = {
      elem1: '초등학교 1학년 (7세)',
      elem2: '초등학교 2학년 (8세)', 
      elem3: '초등학교 3학년 (9세)',
      elem4: '초등학교 4학년 (10세)',
      elem5: '초등학교 5학년 (11세)',
      elem6: '초등학교 6학년 (12세)',
      middle1: '중학교 1학년 (13세)',
      middle2: '중학교 2학년 (14세)',
      middle3: '중학교 3학년 (15세)',
      high1: '고등학교 1학년 (16세)',
      high2: '고등학교 2학년 (17세)',
      high3: '고등학교 3학년 (18세)'
    }

    // 특별한 프롬프트 구조가 필요한 contentType들 처리
    let enhancedPrompt = ''
    
    if (contentType === 'analysis') {
      enhancedPrompt = `${basePrompts[contentType]}

분석할 지문:
"${promptText}"

설정:
- 대상 연령: ${options.targetAge} (${ageGuides[options.targetAge]})
- 난이도 기준: ${options.difficulty} (${difficultyGuides[options.difficulty]})

**분석 기준**:
1. 텍스트 길이: 해당 학년이 읽기에 적절한 분량인지
2. 어휘 수준: 사용된 단어들이 학년 수준에 맞는지
3. 문장 복잡도: 문장 구조의 복잡성 평가
4. 내용 수준: 주제와 개념의 추상성 정도
5. 배경지식: 이해에 필요한 사전 지식 요구도`
    } else if (contentType === 'vocabulary_extraction') {
      enhancedPrompt = `${basePrompts[contentType]}

지문:
"${promptText}"

설정:
- 대상 연령: ${options.targetAge} (${ageGuides[options.targetAge]})
- 추출할 어휘 수: 5개

**추출 기준**:
- 해당 학년에게 다소 어려울 수 있는 핵심 어휘
- 교육적 가치가 있는 중요한 단어
- 한자어는 어원을 활용한 쉬운 설명 (단, 외래어나 고유어는 한자 표기 금지)
- 일상에서 활용 가능한 실용적 어휘

**중요 주의사항**:
- 외래어(예: 컴퓨터, 인터넷, 프로그램, 시스템, 데이터 등)는 etymology 필드를 비워두세요
- 순우리말(예: 하늘, 바람, 마음 등)도 etymology 필드를 비워두세요
- 오직 한자어인 경우에만 한자 어원을 표기하세요`
    } else if (contentType === 'reading_problems') {
      enhancedPrompt = `${basePrompts[contentType]}

지문:
"${promptText}"

설정:
- 대상 연령: ${options.targetAge} (${ageGuides[options.targetAge]})
- 문제 수: 5개
- 문제 구성: 객관식 3-4개, 서술형 1-2개

**문제 유형**:
1. 내용 이해형 (객관식): 지문의 핵심 내용 파악
2. 어휘 이해형 (객관식): 중요 단어의 의미
3. 추론형 (객관식/서술형): 글의 의도나 화자의 생각
4. 서술형: 1-2문장으로 답할 수 있는 간단한 문제`
    } else {
      enhancedPrompt = `${basePrompts[contentType] || basePrompts.vocabulary}

사용자 요청: "${promptText}"

설정:
- 난이도: ${options.difficulty} (${difficultyGuides[options.difficulty]})
- 대상 연령: ${options.targetAge} (${ageGuides[options.targetAge]})
- 글자 수: 정확히 ${options.contentLength}자

${contentType === 'reading' ? `**중요**: 지문은 반드시 ${options.contentLength}자로 작성해주세요. 해당 학년 수준에 맞는 어휘와 문체를 사용하여 학생이 이해할 수 있는 내용으로 만들어주세요.` : ''}`
    }

    return `${enhancedPrompt}

다음 JSON 형식으로 정확히 응답해주세요. 절대로 JSON 외의 다른 텍스트(인사말, 설명, 안내문구 등)는 포함하지 마세요:

${this.getJsonFormat(contentType)}

중요: 오직 유효한 JSON만 응답하세요. 어떤 추가 설명도 하지 마세요.`
  }

  getJsonFormat(contentType) {
    switch (contentType) {
      case 'reading':
        return `{
  "title": "읽기 지문 제목",
  "description": "지문에 대한 간단한 설명",
  "mainContent": {
    "introduction": "사용자가 요청한 주제에 대해 정확히 요청된 글자 수로 작성된 읽기 지문 내용. 해당 학년 수준에 맞는 어휘와 문체로 작성되어야 함."
  },
  "metadata": {
    "characterCount": "실제 글자 수",
    "gradeLevel": "대상 학년",
    "topic": "실제 주제",
    "difficulty": "난이도"
  }
}`

      case 'analysis':
        return `{
  "title": "문해력 난이도 분석 결과",
  "analysis": {
    "textLength": "텍스트 길이 점수 (1-10)",
    "vocabularyLevel": "어휘 난이도 점수 (1-10)",
    "sentenceComplexity": "문장 복잡도 점수 (1-10)",
    "contentLevel": "내용 수준 점수 (1-10)",
    "backgroundKnowledge": "배경지식 요구도 점수 (1-10)",
    "totalScore": "전체 난이도 점수 (1-10)"
  },
  "feedback": "학년 수준에 맞는지에 대한 상세한 분석과 개선 제안",
  "recommendations": [
    "구체적인 개선 방안 1",
    "구체적인 개선 방안 2"
  ]
}`

      case 'vocabulary_extraction':
        return `{
  "title": "어휘 분석 결과",
  "vocabularyList": [
    {
      "word": "어휘",
      "meaning": "쉽고 명확한 의미 설명",
      "etymology": "한자어인 경우만 표기 (예: 觀(볼 관) + 察(살필 찰)), 외래어나 고유어는 빈 문자열 ''",
      "synonyms": ["유의어1", "유의어2"],
      "antonyms": ["반의어1", "반의어2"],
      "difficulty": "★★★☆☆",
      "example": "실제 사용 예문",
      "gradeAppropriate": true
    }
  ]
}`

      case 'reading_problems':
        return `{
  "title": "문해력 문제",
  "problems": [
    {
      "type": "multiple_choice",
      "question": "문제 내용",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "correctAnswer": 0,
      "explanation": "정답 해설"
    },
    {
      "type": "short_answer",
      "question": "서술형 문제 내용 (1-2문장으로 답할 수 있는)",
      "expectedLength": "1-2문장",
      "sampleAnswer": "예시 답안",
      "gradingCriteria": ["채점 기준 1", "채점 기준 2"],
      "explanation": "문제 해설"
    }
  ]
}`

      case 'vocabulary':
        return `{
  "title": "어휘 분석 결과",
  "vocabularyList": [
    {
      "word": "어휘",
      "meaning": "한자어 기반 쉬운 풀이",
      "synonyms": ["유의어1", "유의어2"],
      "antonyms": ["반의어1", "반의어2"],
      "difficulty": "★★★★☆",
      "example": "예문"
    }
  ]
}`

      case 'questions':
        return `{
  "title": "서술형 문제",
  "questions": [
    {
      "type": "맥락 추론형",
      "question": "문제 내용",
      "answerSpace": 3,
      "points": 10
    },
    {
      "type": "내용 이해형", 
      "question": "문제 내용",
      "answerSpace": 4,
      "points": 10
    }
  ]
}`

      case 'answers':
        return `{
  "title": "문제 해설",
  "answers": [
    {
      "questionNumber": 1,
      "correctAnswer": "예시 정답",
      "explanation": "상세한 해설",
      "gradingCriteria": ["채점 기준 1", "채점 기준 2"],
      "tips": "학습 팁"
    }
  ]
}`

      default:
        return `{
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
    }
  ],
  "additionalNotes": [
    "추가 학습 팁이나 주의사항"
  ]
}`
    }
  }

  parseUnstructuredText(text) {
    // 구조화되지 않은 텍스트를 기본 구조로 변환
    const lines = text.split('\n').filter(line => line.trim())
    
    return {
      title: lines[0] || '한국어 학습 자료',
      description: 'AI가 생성한 학습 자료입니다.',
      mainContent: {
        introduction: lines.slice(1, 3).join(' ') || '',
        keyPoints: lines.slice(3, 6) || [],
        examples: []
      },
      exercises: [],
      additionalNotes: lines.slice(6) || []
    }
  }

  estimateTokens(text) {
    // 한국어 토큰 추정 (대략적)
    return Math.ceil(text.length / 2.5)
  }

  async logGeneration(userId, provider, prompt, result) {
    // AI 생성 로그를 콘솔에 기록 (향후 데이터베이스 연동 가능)
    console.log('Generation Log:', {
      userId,
      provider,
      promptLength: prompt.length,
      tokensUsed: result.tokensUsed,
      timestamp: new Date().toISOString()
    })
    
    // 향후 구현: Supabase ai_generation_logs 테이블에 저장
    // await this.supabase.from('ai_generation_logs').insert({
    //   user_id: userId,
    //   provider: provider,
    //   prompt_length: prompt.length,
    //   tokens_used: result.tokensUsed,
    //   created_at: new Date().toISOString()
    // })
  }

  // 문해력 문제 생성
  async generateReadingProblems(text, problemType = 'mixed', count = 5) {
    try {
      const contentType = 'reading_problems'
      const prompt = `다음 지문을 바탕으로 문해력 훈련 문제 ${count}개를 생성해주세요:\n\n"${text}"`
      
      const result = await this.generateContent({
        contentType,
        prompt,
        targetAge: 'elem4', // 기본값
        difficulty: 'intermediate'
      })
      
      return result
    } catch (error) {
      console.error('문제 생성 오류:', error)
      throw new Error(`문제 생성에 실패했습니다: ${error.message}`)
    }
  }

  // 어휘 추출
  async extractVocabulary(text, gradeLevel = 'elem4', count = 5) {
    try {
      const contentType = 'vocabulary_extraction'
      const prompt = `다음 지문에서 핵심 어휘 ${count}개를 추출해주세요:\n\n"${text}"`
      
      const result = await this.generateContent({
        contentType,
        prompt,
        targetAge: gradeLevel,
        difficulty: 'intermediate'
      })
      
      return result
    } catch (error) {
      console.error('어휘 추출 오류:', error)
      throw new Error(`어휘 추출에 실패했습니다: ${error.message}`)
    }
  }

  // 문해력 난이도 분석
  async analyzeReadingLevel(text, gradeLevel = 'elem4') {
    try {
      const contentType = 'analysis'
      const prompt = text
      
      const result = await this.generateContent({
        contentType,
        prompt,
        targetAge: gradeLevel,
        difficulty: 'intermediate'
      })
      
      return result
    } catch (error) {
      console.error('난이도 분석 오류:', error)
      throw new Error(`난이도 분석에 실패했습니다: ${error.message}`)
    }
  }

  // AI 제공업체 상태 확인
  async checkProviderStatus() {
    const status = {
      openai: { available: !!process.env.OPENAI_API_KEY },
      gemini: { available: !!process.env.GEMINI_API_KEY },
      claude: { available: !!process.env.CLAUDE_API_KEY }
    }

    // 간단한 테스트 요청으로 실제 상태 확인 (선택적)
    try {
      if (status.gemini.available) {
        // Gemini 테스트는 비용이 발생할 수 있어서 키 존재만 확인
        status.gemini.lastCheck = new Date().toISOString()
      }
      
      if (status.claude.available) {
        // Claude 테스트도 마찬가지
        status.claude.lastCheck = new Date().toISOString()
      }
    } catch (error) {
      console.error('Provider status check failed:', error)
    }

    return status
  }

}

export default AIService