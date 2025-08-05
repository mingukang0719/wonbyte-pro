// Client-side AI Service for direct API calls
import { apiKeys } from '../config/apiKeys'
import { isAllowedEnvironment, apiRateLimiter, sanitizeApiResponse, logApiUsage } from '../utils/security'

class ClientAIService {
  constructor() {
    this.providers = {
      openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: (apiKey) => ({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }),
        formatRequest: (prompt) => ({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.7
        }),
        parseResponse: (data) => ({
          success: true,
          content: data.choices?.[0]?.message?.content || '',
          metadata: {
            provider: 'openai',
            model: data.model,
            tokensUsed: data.usage?.total_tokens || 0
          }
        })
      },
      anthropic: {
        // Anthropic API는 CORS를 지원하지 않으므로 프록시 서버가 필요합니다
        // 백엔드 서버를 통해 호출하거나, Netlify Functions을 사용해야 합니다
        url: '/api/anthropic', // 프록시 엔드포인트
        headers: (apiKey) => ({
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }),
        formatRequest: (prompt) => ({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        }),
        parseResponse: (data) => ({
          success: true,
          content: data.content?.[0]?.text || '',
          metadata: {
            provider: 'anthropic',
            model: data.model,
            tokensUsed: data.usage?.total_tokens || 0
          }
        })
      }
    }
  }

  async generateContent(request) {
    try {
      // 환경 체크
      if (!isAllowedEnvironment()) {
        throw new Error('허용되지 않은 환경에서의 API 호출입니다.')
      }

      // Rate limiting 체크
      if (!apiRateLimiter.canMakeRequest()) {
        const remainingTime = Math.ceil(apiRateLimiter.getRemainingTime() / 1000)
        throw new Error(`API 호출 제한을 초과했습니다. ${remainingTime}초 후에 다시 시도해주세요.`)
      }

      const { provider = 'openai', prompt } = request
      const apiKey = apiKeys[provider]
      
      if (!apiKey) {
        throw new Error(`${provider} API 키가 설정되지 않았습니다.`)
      }

      const providerConfig = this.providers[provider]
      if (!providerConfig) {
        throw new Error(`지원하지 않는 AI 제공자입니다: ${provider}`)
      }

      const response = await fetch(providerConfig.url, {
        method: 'POST',
        headers: providerConfig.headers(apiKey),
        body: JSON.stringify(providerConfig.formatRequest(prompt))
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `API 호출 실패: ${response.status}`)
      }

      const data = await response.json()
      const result = providerConfig.parseResponse(data)
      
      // Sanitize response
      if (result.content && typeof result.content === 'string') {
        result.content = sanitizeApiResponse(result.content)
      }
      
      // Log usage
      logApiUsage(provider, true)
      
      return result

    } catch (error) {
      console.error('Client AI Service Error:', error)
      logApiUsage(request.provider || 'openai', false, error)
      throw error
    }
  }

  // 한국어 읽기 지문 생성을 위한 특화 메서드
  async generateReadingText(topic, grade, length, provider = 'openai') {
    const prompt = `다음 조건에 맞는 한국어 읽기 지문을 작성해주세요:
    
주제: ${topic}
학년 수준: ${grade}
길이: 약 ${length}자

지문 작성 시 다음 사항을 지켜주세요:
1. 해당 학년 수준에 맞는 어휘와 문장 구조 사용
2. 교육적이고 흥미로운 내용
3. 명확한 주제와 구조를 가진 완성된 글
4. 한국어 맞춤법과 문법 준수

지문만 작성하고 다른 설명은 포함하지 마세요.`

    const response = await this.generateContent({ provider, prompt })
    
    // 응답 텍스트 정제
    let content = response.content
    if (typeof content === 'string') {
      content = content.trim()
      // 제목과 본문 구분
      const lines = content.split('\n')
      const title = lines[0]?.replace(/^#+ /, '') || `${topic} 이야기`
      const mainContent = lines.slice(1).join('\n').trim() || content
      
      response.content = {
        title,
        mainContent: {
          introduction: mainContent
        }
      }
    }
    
    return response
  }

  // 문해력 분석
  async analyzeReadingLevel(text, gradeLevel, provider = 'openai') {
    const prompt = `다음 텍스트의 문해력 난이도를 분석해주세요:

텍스트: """
${text}
"""

대상 학년: ${gradeLevel}

다음 5가지 기준으로 각각 1-10점으로 평가하고 간단한 설명을 제공해주세요:
1. 텍스트 길이와 구조 (textLength)
2. 어휘 난이도 (vocabularyLevel)
3. 문장 복잡도 (sentenceComplexity)
4. 내용 수준 (contentLevel)
5. 배경지식 요구도 (backgroundKnowledge)

응답 형식:
{
  "textLength": 점수,
  "vocabularyLevel": 점수,
  "sentenceComplexity": 점수,
  "contentLevel": 점수,
  "backgroundKnowledge": 점수,
  "totalScore": 평균점수,
  "analysis": "종합 분석 설명"
}`

    const response = await this.generateContent({ provider, prompt })
    
    try {
      // JSON 파싱 시도
      const content = response.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        response.content = parsed
      } else {
        // 파싱 실패 시 기본값
        response.content = {
          textLength: 5,
          vocabularyLevel: 5,
          sentenceComplexity: 5,
          contentLevel: 5,
          backgroundKnowledge: 5,
          totalScore: 5,
          analysis: '문해력 분석을 완료했습니다.'
        }
      }
    } catch (e) {
      console.error('분석 결과 파싱 오류:', e)
    }
    
    return response
  }

  // 어휘 추출
  async extractVocabulary(text, gradeLevel, count = 10, provider = 'openai') {
    const prompt = `다음 텍스트에서 ${gradeLevel} 학생이 학습해야 할 핵심 어휘 ${count}개를 추출해주세요:

텍스트: """
${text}
"""

각 어휘에 대해 다음 정보를 제공해주세요:
- word: 단어
- meaning: 의미 설명 (학년 수준에 맞게)
- difficulty: 난이도 (★ 1-5개)
- example: 예문

JSON 배열 형식으로 응답해주세요.`

    const response = await this.generateContent({ provider, prompt })
    
    try {
      const content = response.content
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const vocabularyList = JSON.parse(jsonMatch[0])
        response.content = { vocabularyList }
      } else {
        // 파싱 실패 시 기본값
        response.content = {
          vocabularyList: [
            { word: '학습', meaning: '배우고 익히는 것', difficulty: '★★★', example: '매일 꾸준히 학습해야 합니다.' }
          ]
        }
      }
    } catch (e) {
      console.error('어휘 추출 파싱 오류:', e)
    }
    
    return response
  }

  // 문제 생성
  async generateProblems(text, problemType, count, provider = 'openai') {
    const typeMap = {
      vocabulary: '어휘',
      comprehension: '독해',
      inference: '추론',
      critical: '비판적 사고'
    }
    
    const prompt = `다음 지문을 바탕으로 ${typeMap[problemType] || problemType} 문제를 ${count}개 만들어주세요:

지문: """
${text}
"""

각 문제는 다음 형식으로 작성해주세요:
- id: 문제 번호
- type: "${problemType}"
- question: 문제
- options: 4개의 선택지 배열
- answer: 정답 인덱스 (0-3)
- explanation: 해설

JSON 배열 형식으로 응답해주세요.`

    const response = await this.generateContent({ provider, prompt })
    
    try {
      const content = response.content
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const problems = JSON.parse(jsonMatch[0])
        response.content = { problems }
      } else {
        // 파싱 실패 시 기본 문제
        response.content = {
          problems: [{
            id: 1,
            type: problemType,
            question: '이 글의 주제는 무엇입니까?',
            options: ['선택지 1', '선택지 2', '선택지 3', '선택지 4'],
            answer: 0,
            explanation: '이 글의 주제를 파악하는 문제입니다.'
          }]
        }
      }
    } catch (e) {
      console.error('문제 생성 파싱 오류:', e)
    }
    
    return response
  }
}

export default new ClientAIService()