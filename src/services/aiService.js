// Frontend AI Service - CACHE BUST 2025-08-02-15:05
import { config } from '../config'
import DemoService from './demoService'
import ClientAIService from './clientAIService'
import { hasApiKeys } from '../config/apiKeys'

class AIService {
  constructor() {
    // FORCE CORRECT URL - CACHE BUSTING
    this.baseURL = 'https://wonbyte-pro.onrender.com'
    this.demoService = new DemoService()
    this.clientAIService = ClientAIService
    this.isDemo = false // Force disable demo mode
    // 항상 백엔드 API 사용하도록 변경 (클라이언트 직접 호출 비활성화)
    this.useClientAI = false
    // Service initialized with backend URL
  }

  async generateContent(request) {
    try {
      // 클라이언트 AI 사용 가능한 경우
      if (this.useClientAI) {
        if (request.contentType === 'reading') {
          const topic = request.prompt.match(/(.+)에 대한/)?.[1] || '주제'
          const length = request.contentLength || 800
          return await this.clientAIService.generateReadingText(topic, request.targetAge, length, request.provider)
        }
        return await this.clientAIService.generateContent(request)
      }
      
      // 데모 모드인 경우 데모 서비스 사용
      if (this.isDemo) {
        // 데모 모드: 모의 AI 응답 사용
        return await this.demoService.generateContent(
          request.provider || 'claude',
          request.contentType || 'reading',
          request.prompt,
          {
            targetAge: request.targetAge,
            difficulty: request.difficulty,
            contentLength: request.contentLength
          }
        )
      }

      const url = `${this.baseURL}/api/ai/generate`
      // Making API request to backend
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      return data

    } catch (error) {
      console.error('AI Service Error:', error)
      
      // AI 생성 실패 시 에러를 사용자에게 표시하고 재시도 유도
      throw new Error(`AI 콘텐츠 생성에 실패했습니다. 잠시 후 다시 시도해주세요. (${error.message})`)
    }
  }

  // 문해력 분석
  async analyzeReadingLevel(text, gradeLevel) {
    try {
      if (this.useClientAI) {
        return await this.clientAIService.analyzeReadingLevel(text, gradeLevel)
      }

      if (this.isDemo) {
        // 데모 모드에서는 간단한 분석 로직 사용
        return this.mockAnalyzeReadingLevel(text)
      }

      const response = await fetch(`${this.baseURL}/api/ai/analyze-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          grade: gradeLevel
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '텍스트 분석에 실패했습니다.')
      }

      return data
    } catch (error) {
      console.error('Reading Level Analysis Error:', error)
      throw error
    }
  }

  // 어휘 추출 및 분석
  async extractVocabulary(text, gradeLevel, count = 20) {
    try {
      if (this.useClientAI) {
        return await this.clientAIService.extractVocabulary(text, gradeLevel, count)
      }

      if (this.isDemo) {
        return this.mockExtractVocabulary(text, count)
      }

      const response = await fetch(`${this.baseURL}/api/ai/extract-vocabulary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          grade: gradeLevel,
          count
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '어휘 추출에 실패했습니다.')
      }

      return data
    } catch (error) {
      console.error('Vocabulary Extraction Error:', error)
      
      // AI 어휘 추출 실패 시 에러를 사용자에게 표시
      throw new Error(`어휘 추출에 실패했습니다. 잠시 후 다시 시도해주세요. (${error.message})`)
    }
  }

  // 문해력 훈련 문제 생성
  async generateReadingProblems(text, problemType, count, gradeLevel = 'elem4') {
    try {
      if (this.useClientAI) {
        return await this.clientAIService.generateProblems(text, problemType, count)
      }

      if (this.isDemo) {
        return this.mockGenerateProblems(text, problemType, count)
      }

      const response = await fetch(`${this.baseURL}/api/ai/generate-problems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          grade: gradeLevel,
          problemTypes: Array.isArray(problemType) ? problemType : [problemType],
          count
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '문제 생성에 실패했습니다.')
      }

      return data
    } catch (error) {
      console.error('Problem Generation Error:', error)
      
      // AI 문제 생성 실패 시 에러를 사용자에게 표시
      throw new Error(`문제 생성에 실패했습니다. 잠시 후 다시 시도해주세요. (${error.message})`)
    }
  }

  // 데모 모드용 모의 함수들
  mockAnalyzeReadingLevel(text) {
    const charCount = text.length
    const sentenceCount = text.split(/[.!?]/).filter(s => s.trim()).length
    const avgSentenceLength = charCount / sentenceCount

    return {
      success: true,
      content: {
        textLength: Math.min(10, Math.round(charCount / 200)),
        vocabularyLevel: Math.min(10, Math.round(avgSentenceLength / 5)),
        sentenceComplexity: Math.min(10, Math.round(avgSentenceLength / 10)),
        contentLevel: Math.min(10, 7),
        backgroundKnowledge: Math.min(10, 5),
        totalScore: Math.round((charCount / 200 + avgSentenceLength / 5 + avgSentenceLength / 10 + 7 + 5) / 5),
        analysis: '이 지문은 해당 학년 수준에 적합한 난이도를 가지고 있습니다.'
      }
    }
  }

  mockExtractVocabulary(text, count) {
    // 간단한 어휘 추출 (실제로는 형태소 분석 필요)
    const words = ['학습', '이해', '발전', '노력', '성취', '목표', '과정', '결과', '방법', '전략']
    const extracted = words.slice(0, Math.min(count, words.length))

    return {
      success: true,
      content: {
        vocabularyList: extracted.map(word => ({
          word: word,
          meaning: `${word}의 의미 설명`,
          difficulty: '★★★☆☆',
          example: `${word}을(를) 사용한 예문입니다.`
        }))
      }
    }
  }

  mockGenerateProblems(text, problemType, count) {
    const problems = []
    
    if (problemType === 'vocabulary') {
      for (let i = 1; i <= count; i++) {
        problems.push({
          id: i,
          type: 'vocabulary',
          question: `문제 ${i}: 다음 단어의 의미로 가장 적절한 것은?`,
          word: '예시단어',
          options: ['의미1', '의미2', '의미3', '의미4'],
          answer: 0,
          explanation: '이 단어는 이런 의미를 가지고 있습니다.'
        })
      }
    } else {
      for (let i = 1; i <= count; i++) {
        problems.push({
          id: i,
          type: 'comprehension',
          question: `문제 ${i}: 이 글의 내용과 일치하는 것은?`,
          options: ['선택지1', '선택지2', '선택지3', '선택지4'],
          answer: 0,
          explanation: '지문의 이 부분에서 확인할 수 있습니다.'
        })
      }
    }

    return {
      success: true,
      content: {
        problems: problems
      }
    }
  }

  async getProviderStatus() {
    try {
      const response = await fetch(`${this.baseURL}/api/ai/status`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.status

    } catch (error) {
      console.error('AI Status Error:', error)
      return null
    }
  }

  // 어휘 분석 생성
  async generateVocabularyAnalysis(word, gradeLevel) {
    try {
      const prompt = `다음 단어에 대한 학습 자료를 생성해주세요:

단어: ${word}
학년: ${gradeLevel}

다음 형식으로 응답해주세요:
{
  "meaning": "단어의 의미",
  "hanja": [{"character": "한자", "meaning": "뜻", "reading": "음"}],
  "example": "예문",
  "synonyms": ["유의어1", "유의어2"],
  "antonyms": ["반의어1", "반의어2"]
}`
      
      const response = await this.generateContent({
        contentType: 'vocabulary',
        prompt,
        targetAge: gradeLevel
      })
      
      if (response.success && response.content) {
        // Parse AI response
        let parsedContent
        try {
          // content가 문자열인 경우 JSON 파싱
          if (typeof response.content === 'string') {
            parsedContent = JSON.parse(response.content)
          } else {
            parsedContent = response.content
          }
        } catch (e) {
          // 파싱 실패 시 기본값 사용
          parsedContent = {
            meaning: `${word}의 의미를 설명합니다.`,
            hanja: [],
            example: `${word}을(를) 사용한 예문입니다.`,
            synonyms: [],
            antonyms: []
          }
        }
        
        return {
          success: true,
          content: {
            word: word,
            meaning: parsedContent.meaning || `${word}의 의미를 설명합니다.`,
            hanja: parsedContent.hanja || [],
            example: parsedContent.example || `${word}을(를) 사용한 예문입니다.`,
            synonyms: parsedContent.synonyms || [],
            antonyms: parsedContent.antonyms || [],
            difficulty: '★★★☆☆',
            gradeAppropriate: true
          }
        }
      }
      
      throw new Error('AI 응답이 올바르지 않습니다.')
      
    } catch (error) {
      console.error('AI Vocabulary Analysis Error:', error)
      // 오류 시 기본 분석 반환
      return {
        success: true,
        content: {
          word: word,
          meaning: `${word}의 의미를 설명합니다.`,
          hanja: [],
          example: `${word}을(를) 사용한 예문입니다.`,
          synonyms: [],
          antonyms: [],
          difficulty: '★★★☆☆',
          gradeAppropriate: true
        }
      }
    }
  }

  // AI 해설 생성
  async generateExplanation(params) {
    try {
      if (this.useClientAI) {
        return await this.clientAIService.generateExplanation(params)
      }

      if (this.isDemo) {
        // 데모 모드에서는 간단한 해설 생성
        return {
          success: true,
          content: {
            explanation: `이 문제는 ${params.type === 'multiple_choice' ? '객관식' : '서술형'} 문제입니다.\n\n정답: ${params.correctAnswer}\n\n이 답이 정답인 이유는 지문의 내용을 정확히 이해하고 분석했을 때 가장 적절한 답변이기 때문입니다. 문제를 풀 때는 항상 지문을 꼼꼼히 읽고, 핵심 내용을 파악하는 것이 중요합니다.`
          }
        }
      }

      const response = await fetch(`${this.baseURL}/api/ai/generate-explanation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'AI 해설 생성에 실패했습니다.')
      }

      return data

    } catch (error) {
      console.error('AI Explanation Error:', error)
      // 오류 시 기본 해설 반환
      return {
        success: true,
        content: {
          explanation: params.explanation || '해설을 생성할 수 없습니다. 문제의 기본 해설을 참고해주세요.'
        }
      }
    }
  }

  // 콘텐츠 생성 헬퍼 메서드들
  async generateVocabulary(prompt, options = {}) {
    return this.generateContent({
      contentType: 'vocabulary',
      prompt,
      ...options
    })
  }

  async generateGrammar(prompt, options = {}) {
    return this.generateContent({
      contentType: 'grammar',
      prompt,
      ...options
    })
  }

  async generateReading(prompt, options = {}) {
    return this.generateContent({
      contentType: 'reading',
      prompt,
      ...options
    })
  }

  async generateQuiz(prompt, options = {}) {
    return this.generateContent({
      contentType: 'quiz',
      prompt,
      ...options
    })
  }

  // 콘텐츠 타입별 샘플 프롬프트
  getSamplePrompts() {
    return {
      vocabulary: [
        "한국어 인사말에 대한 어휘 학습 자료를 만들어주세요",
        "음식 관련 한국어 단어들을 정리해주세요", 
        "한국의 전통 문화 관련 어휘를 학습할 수 있는 자료를 만들어주세요"
      ],
      grammar: [
        "한국어 존댓말과 반말의 차이를 설명해주세요",
        "한국어 조사 '은/는'과 '이/가'의 사용법을 알려주세요",
        "한국어 시제 표현에 대해 설명해주세요"
      ],
      reading: [
        "한국의 사계절에 대한 읽기 자료를 만들어주세요",
        "한국의 전통 음식 소개 글을 작성해주세요",
        "한국 대학생의 일상생활에 대한 글을 써주세요"
      ],
      quiz: [
        "한국어 기초 어휘 퀴즈를 만들어주세요",
        "한국 문화에 대한 이해도를 확인하는 퀴즈를 만들어주세요",
        "한국어 문법 실력을 테스트하는 문제를 만들어주세요"
      ]
    }
  }

  // 난이도별 안내
  getDifficultyGuide() {
    return {
      beginner: {
        label: '초급',
        description: '한글을 읽을 수 있고 기본 단어 500개 정도 아는 수준',
        features: ['로마자 표기 포함', '쉬운 어휘 사용', '단순한 문장 구조']
      },
      intermediate: {
        label: '중급', 
        description: '일상 대화가 가능하고 기본 문법을 아는 수준',
        features: ['실용적인 표현', '다양한 문법 활용', '문화적 맥락 포함']
      },
      advanced: {
        label: '고급',
        description: '복잡한 문장을 이해하고 뉘앙스를 구분할 수 있는 수준', 
        features: ['고급 어휘', '복잡한 문법', '추상적 개념']
      }
    }
  }

  // 대상 연령별 안내
  getAgeGuide() {
    return {
      child: {
        label: '어린이',
        description: '재미있고 쉬운 예시, 그림이나 게임 요소 포함',
        features: ['놀이 중심', '시각적 요소', '반복 학습']
      },
      teen: {
        label: '청소년',
        description: '학교생활, 친구 관계 등 관련 예시',
        features: ['학급 친화적', '또래 문화', '실용적 회화']
      },
      adult: {
        label: '성인',
        description: '직장생활, 사회생활 등 실용적 예시',
        features: ['비즈니스 한국어', '공식적 표현', '사회 문화']
      },
      senior: {
        label: '시니어',
        description: '천천히, 자세히, 반복 설명 위주',
        features: ['체계적 설명', '충분한 연습', '반복 강화']
      }
    }
  }
}

// 지문 생성 메서드 추가
AIService.prototype.generateReadingText = async function(topic, gradeLevel, wordCount, difficulty, provider = 'claude') {
  try {
    const prompt = `${topic}에 대한 ${gradeLevel} 수준의 ${wordCount}자 정도의 지문을 생성해주세요. 난이도는 ${difficulty}입니다.`
    
    const response = await this.generateContent({
      contentType: 'reading',
      prompt,
      targetAge: gradeLevel,
      difficulty,
      contentLength: wordCount,
      provider
    })
    
    return response
  } catch (error) {
    console.error('Generate reading text error:', error)
    throw error
  }
}

export default new AIService()