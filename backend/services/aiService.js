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
        this.claude = new Anthropic({
          apiKey: finalClaudeKey
        })
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
    
    const keyLower = key.toLowerCase()
    for (const placeholder of placeholders) {
      if (keyLower.includes(placeholder)) {
        console.log(`Invalid API key detected (contains "${placeholder}"): ${key.substring(0, 10)}...`)
        return null
      }
    }
    
    // Valid OpenAI key should start with sk- and be longer than 40 chars
    if (key.startsWith('sk-') && key.length > 40) {
      console.log(`Valid OpenAI key detected: ${key.substring(0, 10)}...`)
      return key
    }
    
    // Valid Claude key should be longer than 30 chars and not start with sk-
    if (key.length > 30 && !key.startsWith('sk-')) {
      console.log(`Valid Claude/Gemini key detected: ${key.substring(0, 10)}...`)
      return key
    }
    
    console.log(`API key validation failed for key: ${key.substring(0, 10)}... (length: ${key.length})`)
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
      // API 키가 없거나 테스트 키인 경우 모의 응답 제공
      if (!this.openaiKey || this.openaiKey === 'your_openai_api_key_here') {
        return this.getMockResponse('openai', prompt)
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: '당신은 한국어 교육 전문가입니다. 항상 JSON 형식으로만 응답하세요.'
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
      // API 키가 없거나 테스트 키인 경우 또는 클라이언트가 초기화되지 않은 경우 모의 응답 제공
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here' || !this.gemini) {
        return this.getMockResponse('gemini', prompt)
      }

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
      // API 키가 없거나 테스트 키인 경우 또는 클라이언트가 초기화되지 않은 경우 모의 응답 제공
      if (!process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY === 'your_claude_api_key_here' || !this.claude) {
        return this.getMockResponse('claude', prompt)
      }

      const message = await this.claude.messages.create({
        model: 'claude-3-sonnet-20240229',
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
    const basePrompts = {
      vocabulary: `지문에서 어려운 어휘를 추출하고 분석해주세요. 
각 어휘의 의미, 유의어, 반의어, 난이도를 포함해야 합니다.`,

      grammar: `한국어 문법 학습 자료를 생성해주세요.
문법 규칙의 명확한 설명, 다양한 예문, 주의사항을 포함해야 합니다.`,

      reading: `한국어 읽기 지문을 생성해주세요.
해당 연령과 수준에 맞는 지문을 정확한 글자 수로 작성해야 합니다.`,

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

    return `${basePrompts[contentType] || basePrompts.vocabulary}

사용자 요청: "${userPrompt}"

설정:
- 난이도: ${options.difficulty} (${difficultyGuides[options.difficulty]})
- 대상 연령: ${options.targetAge} (${ageGuides[options.targetAge]})
- 글자 수: 정확히 ${options.contentLength}자

${contentType === 'reading' ? `**중요**: 지문은 반드시 ${options.contentLength}자로 작성해주세요. 해당 학년 수준에 맞는 어휘와 문체를 사용하여 학생이 이해할 수 있는 내용으로 만들어주세요.` : ''}

다음 JSON 형식으로 정확히 응답해주세요:

${this.getJsonFormat(contentType)}

중요: 반드시 유효한 JSON 형식으로만 응답하고, 추가 설명은 JSON 내부에 포함시켜주세요.`
  }

  getJsonFormat(contentType) {
    switch (contentType) {
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
    // TODO: 데이터베이스에 생성 로그 저장
    console.log('Generation Log:', {
      userId,
      provider,
      promptLength: prompt.length,
      tokensUsed: result.tokensUsed,
      timestamp: new Date().toISOString()
    })
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

  // 모의 응답 생성 (API 키가 없을 때 사용)
  getMockResponse(provider, prompt) {
    console.log(`Mock response for ${provider} with prompt: ${prompt}`)
    
    const isReading = prompt.includes('읽기 지문') || prompt.includes('지문을')
    const isVocabulary = prompt.includes('어휘') || prompt.includes('vocabulary')
    const isQuestions = prompt.includes('문제') || prompt.includes('questions')
    const isAnswers = prompt.includes('해설') || prompt.includes('answers')

    let mockContent

    if (isReading) {
      // Extract topic from prompt for smarter mock responses
      let topic = "일반 주제"
      let title = "샘플 지문"
      let content = "이것은 API 키가 설정되지 않아 생성된 샘플 지문입니다."
      
      // Try to extract topic from prompt patterns
      const topicMatch = prompt.match(/(.+?)에 대한.*지문/);
      if (topicMatch) {
        topic = topicMatch[1].trim();
        
        // Generate topic-appropriate sample content
        if (topic.includes('로봇') || topic.includes('인공지능') || topic.includes('AI')) {
          title = "로봇과 인공지능"
          content = "요즘 우리 주변에서 로봇을 많이 볼 수 있습니다. 청소 로봇은 집안을 깨끗하게 치워주고, 음성 인식 기기는 우리가 하는 말을 알아듣고 답해줍니다. 인공지능은 컴퓨터가 사람처럼 생각하고 배울 수 있게 하는 기술입니다. 병원에서는 의사가 병을 진단할 때 도움을 주고, 자동차는 스스로 운전할 수 있게 됩니다. 하지만 로봇과 인공지능은 사람을 대신하는 것이 아니라 우리를 도와주는 친구입니다. 앞으로 더 똑똑해진 로봇들이 우리 생활을 더욱 편리하게 만들어 줄 것입니다. 우리도 새로운 기술을 배우고 잘 활용해야 합니다."
        } else if (topic.includes('동물') || topic.includes('자연')) {
          title = "동물과 자연"
          content = "숲속에는 많은 동물들이 살고 있습니다. 다람쥐는 나무 위에서 도토리를 모으고, 토끼는 풀밭에서 뛰어놉니다. 새들은 하늘을 자유롭게 날아다니며 아름다운 노래를 부릅니다. 동물들은 각자 다른 모습과 특징을 가지고 있어요. 사자는 힘이 세고, 치타는 빠르게 달릴 수 있습니다. 코끼리는 크고, 개미는 작지만 모두 소중한 생명입니다. 우리는 동물들과 자연을 보호해야 합니다. 쓰레기를 함부로 버리지 않고, 동물들의 집을 지켜주어야 해요."
        } else if (topic.includes('포켓몬') || topic.includes('Pokemon')) {
          title = "포켓몬스터"
          content = "포켓몬스터는 전 세계 어린이들이 좋아하는 캐릭터들입니다. 피카츄는 가장 유명한 포켓몬으로 노란색 몸에 빨간 볼을 가지고 있어요. 포켓몬들은 각각 다른 능력을 가지고 있습니다. 물 타입, 불 타입, 풀 타입 등 여러 종류가 있어요. 포켓몬 트레이너는 포켓몬들과 친구가 되어 함께 모험을 떠납니다. 포켓몬들을 돌보고 사랑하는 것이 가장 중요합니다. 우리도 동물이나 친구들을 아끼고 보살펴야 해요."
        } else {
          title = topic
          content = `${topic}는 정말 흥미로운 주제입니다. 이 주제에 대해 더 많은 것을 배워보면 좋겠어요. ${topic}에 관련된 다양한 이야기들이 있습니다. 우리 주변에서도 ${topic}와 관련된 것들을 찾아볼 수 있어요. 새로운 것을 배우는 것은 언제나 즐거운 일입니다. ${topic}에 대해 더 알아보고 싶다면 책을 읽거나 어른들께 물어보세요.`
        }
      }
      
      mockContent = {
        title: title,
        description: `${topic}에 대한 읽기 지문`,
        mainContent: {
          introduction: content,
          keyPoints: [
            "봄에는 여러 가지 꽃들이 핀다",
            "꽃마다 색깔과 모양이 다르다", 
            "꽃은 생명이므로 소중히 여겨야 한다"
          ],
          examples: [
            {
              korean: "개나리가 노랗게 피었어요.",
              explanation: "봄에 가장 먼저 피는 노란 꽃"
            }
          ]
        }
      }
    } else if (isVocabulary) {
      mockContent = {
        title: "어휘 분석 결과",
        vocabularyList: [
          {
            word: "관찰",
            meaning: "자세히 살펴보는 것",
            synonyms: ["구경", "살피기"],
            antonyms: ["무시", "소홀"],
            difficulty: "★★★☆☆",
            example: "꽃을 관찰해보세요."
          },
          {
            word: "생명",
            meaning: "살아있는 것",
            synonyms: ["목숨", "삶"],
            antonyms: ["죽음"],
            difficulty: "★★☆☆☆", 
            example: "꽃도 생명이에요."
          }
        ]
      }
    } else if (isQuestions) {
      mockContent = {
        title: "서술형 문제",
        questions: [
          {
            type: "내용 이해형",
            question: "봄에 피는 꽃의 종류를 3가지 써보세요.",
            answerSpace: 3,
            points: 10
          },
          {
            type: "맥락 추론형", 
            question: "글쓴이가 꽃을 꺾지 말라고 하는 이유를 써보세요.",
            answerSpace: 4,
            points: 15
          }
        ]
      }
    } else if (isAnswers) {
      mockContent = {
        title: "문제 해설",
        answers: [
          {
            questionNumber: 1,
            correctAnswer: "개나리, 진달래, 벚꽃",
            explanation: "지문에서 봄에 피는 꽃으로 개나리(노란색), 진달래(분홍색), 벚꽃(하얀색, 분홍색)을 제시했습니다.",
            gradingCriteria: ["3가지 꽃 이름 정확히 쓰기", "맞춤법 정확성"],
            tips: "지문을 차근차근 읽으며 꽃 이름을 찾아보세요."
          }
        ]
      }
    }

    return {
      content: mockContent,
      provider: provider,
      tokensUsed: 100
    }
  }
}

export default AIService