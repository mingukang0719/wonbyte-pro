// Backend AI Service - 백엔드 API를 통한 AI 서비스
class BackendAIService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  }

  async generateContent(request) {
    try {
      const response = await fetch(`${this.baseURL}/api/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: request.provider || 'gemini',
          contentType: request.contentType || 'reading',
          difficulty: request.difficulty || 'intermediate',
          targetAge: request.targetAge || 'adult',
          prompt: request.prompt
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'AI 생성 실패')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Backend AI Service Error:', error)
      throw error
    }
  }

  // 한국어 읽기 지문 생성
  async generateReadingText(topic, grade, length, provider = 'gemini') {
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

    return this.generateContent({ 
      provider, 
      prompt,
      contentType: 'reading',
      targetAge: grade
    })
  }

  // 문해력 분석
  async analyzeReadingLevel(text, gradeLevel, provider = 'gemini') {
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

JSON 형식으로 응답해주세요.`

    return this.generateContent({ 
      provider, 
      prompt,
      contentType: 'analysis'
    })
  }

  // 어휘 추출
  async extractVocabulary(text, gradeLevel, count = 10, provider = 'gemini') {
    const prompt = `다음 텍스트에서 ${gradeLevel} 학생이 학습해야 할 핵심 어휘 ${count}개를 추출해주세요:

텍스트: """
${text}
"""

각 어휘에 대해 다음 정보를 JSON 배열로 제공해주세요:
- word: 단어
- meaning: 의미 설명 (학년 수준에 맞게)
- difficulty: 난이도 (★ 1-5개)
- example: 예문`

    return this.generateContent({ 
      provider, 
      prompt,
      contentType: 'vocabulary'
    })
  }

  // 문제 생성
  async generateProblems(text, problemType, count, provider = 'gemini') {
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

각 문제는 다음 형식의 JSON 배열로 작성해주세요:
- id: 문제 번호
- type: "${problemType}"
- question: 문제
- options: 4개의 선택지 배열
- answer: 정답 인덱스 (0-3)
- explanation: 해설`

    return this.generateContent({ 
      provider, 
      prompt,
      contentType: 'problems'
    })
  }
}

export default new BackendAIService()