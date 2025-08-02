// 데모 서비스 - 백엔드 없이 프론트엔드에서 모의 응답 제공

class DemoService {
  constructor() {
    this.delay = 1000; // 실제 API 응답처럼 1초 지연
  }

  // 모의 지연 함수
  async simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  // 관리자 로그인 모의 응답
  async adminLogin(email, password) {
    await this.simulateDelay();
    
    if (email === 'admin@inblanq.com' && password === '2025') {
      return {
        success: true,
        token: 'demo-admin-token-12345',
        user: {
          id: 'demo-admin-id',
          email: 'admin@inblanq.com',
          role: 'admin'
        }
      };
    } else {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
  }

  // AI 콘텐츠 생성 모의 응답
  async generateContent(provider, contentType, prompt, options = {}) {
    await this.simulateDelay();

    const { targetAge = 'elem2', difficulty = 'beginner', contentLength = '800' } = options;

    // 지문 생성
    if (contentType === 'reading') {
      return {
        success: true,
        content: {
          title: "봄에 피는 꽃들",
          description: `${this.getAgeDescription(targetAge)}을 위한 봄 꽃 이야기`,
          mainContent: {
            introduction: this.generateReadingContent(contentLength, targetAge),
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
        },
        provider: provider,
        timestamp: new Date().toISOString(),
        tokensUsed: 150
      };
    }

    // 어휘 생성
    if (contentType === 'vocabulary') {
      return {
        success: true,
        content: {
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
            },
            {
              word: "아름다운",
              meaning: "보기 좋고 예쁜",
              synonyms: ["예쁜", "곱다"],
              antonyms: ["못생긴", "추한"],
              difficulty: "★★☆☆☆",
              example: "아름다운 꽃이 피었어요."
            }
          ]
        },
        provider: provider,
        timestamp: new Date().toISOString(),
        tokensUsed: 100
      };
    }

    // 문제 생성
    if (contentType === 'questions') {
      return {
        success: true,
        content: {
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
            },
            {
              type: "내용 이해형",
              question: "꽃을 관찰할 때 주의할 점을 써보세요.",
              answerSpace: 3,
              points: 10
            },
            {
              type: "맥락 추론형",
              question: "자연이 우리에게 주는 의미를 생각해서 써보세요.",
              answerSpace: 5,
              points: 20
            },
            {
              type: "내용 이해형",
              question: "가족과 함께 꽃구경을 가면 좋은 이유를 써보세요.",
              answerSpace: 4,
              points: 15
            },
            {
              type: "맥락 추론형",
              question: "이 글을 읽고 느낀 점을 자유롭게 써보세요.",
              answerSpace: 5,
              points: 20
            }
          ]
        },
        provider: provider,
        timestamp: new Date().toISOString(),
        tokensUsed: 120
      };
    }

    // 해설 생성
    if (contentType === 'answers') {
      return {
        success: true,
        content: {
          title: "문제 해설",
          answers: [
            {
              questionNumber: 1,
              correctAnswer: "개나리, 진달래, 벚꽃",
              explanation: "지문에서 봄에 피는 꽃으로 개나리(노란색), 진달래(분홍색), 벚꽃(하얀색, 분홍색)을 제시했습니다.",
              gradingCriteria: ["3가지 꽃 이름 정확히 쓰기", "맞춤법 정확성"],
              tips: "지문을 차근차근 읽으며 꽃 이름을 찾아보세요."
            },
            {
              questionNumber: 2,
              correctAnswer: "꽃도 우리처럼 살아있는 생명이기 때문입니다.",
              explanation: "글쓴이는 꽃도 생명체임을 강조하며 생명을 소중히 여겨야 한다고 말합니다.",
              gradingCriteria: ["생명의 소중함 언급", "논리적 설명"],
              tips: "지문에서 생명에 관련된 부분을 찾아보세요."
            }
          ]
        },
        provider: provider,
        timestamp: new Date().toISOString(),
        tokensUsed: 90
      };
    }

    // 기본 응답
    return {
      success: true,
      content: {
        title: "데모 콘텐츠",
        description: "데모 모드에서 생성된 샘플 콘텐츠입니다."
      },
      provider: provider,
      timestamp: new Date().toISOString(),
      tokensUsed: 50
    };
  }

  // 연령 설명 생성
  getAgeDescription(targetAge) {
    const ageMap = {
      elem1: '초등학교 1학년',
      elem2: '초등학교 2학년',
      elem3: '초등학교 3학년',
      elem4: '초등학교 4학년',
      elem5: '초등학교 5학년',
      elem6: '초등학교 6학년',
      middle1: '중학교 1학년',
      middle2: '중학교 2학년',
      middle3: '중학교 3학년',
      high1: '고등학교 1학년',
      high2: '고등학교 2학년',
      high3: '고등학교 3학년'
    };
    return ageMap[targetAge] || '초등학교 2학년';
  }

  // 글자 수에 맞는 읽기 지문 생성
  generateReadingContent(contentLength, targetAge) {
    const baseContent = "따뜻한 봄이 오면 여러 가지 예쁜 꽃들이 피어납니다. 개나리는 노란색으로 먼저 피고, 진달래는 분홍색으로 예쁘게 핍니다. 벚꽃은 하얀색과 분홍색으로 피어서 마치 눈이 내린 것 같아요. 꽃들은 우리에게 봄이 왔다고 알려주는 친구들입니다. 꽃들을 보면 마음이 기뻐집니다. 우리는 꽃을 소중히 여겨야 해요. 꽃을 꺾지 말고 예쁘게 구경만 해야 합니다. 꽃들도 우리처럼 살아있는 생명이기 때문입니다.";
    
    const additionalContent = " 봄에는 가족과 함께 꽃구경을 가면 좋겠어요. 공원이나 산에 가서 여러 가지 꽃들을 찾아보세요. 꽃의 색깔과 모양을 자세히 관찰해보면 정말 신기합니다. 자연은 우리에게 아름다운 선물을 주는 것 같아요. 꽃향기를 맡아보고, 나비나 벌들이 꽃을 찾아오는 모습도 관찰해보세요. 계절이 바뀌면서 피는 꽃들도 달라집니다.";

    const extraContent = " 여름에는 해바라기와 장미가 피고, 가을에는 코스모스와 국화가 아름답게 핍니다. 겨울에는 동백꽃이 추위를 이겨내며 붉게 피어납니다. 우리나라에는 정말 다양한 꽃들이 사계절 내내 피어나므로 언제든지 아름다운 자연을 만날 수 있습니다. 꽃을 통해 자연의 신비로움과 생명의 소중함을 배울 수 있어요.";

    const targetLength = parseInt(contentLength);
    let result = baseContent;

    if (targetLength >= 600) {
      result += additionalContent;
    }
    if (targetLength >= 1000) {
      result += extraContent;
    }

    // 목표 길이에 근사하게 조정
    if (result.length < targetLength) {
      const padding = " 꽃은 우리 생활에 기쁨과 아름다움을 가져다줍니다.".repeat(Math.ceil((targetLength - result.length) / 30));
      result += padding;
    }

    return result.substring(0, targetLength);
  }

  // 통계 정보 모의 응답
  async getStats() {
    await this.simulateDelay();
    
    return {
      success: true,
      stats: {
        totalGenerations: 42,
        totalTokens: 3580,
        providerBreakdown: {
          claude: { count: 25, tokens: 2100 },
          gemini: { count: 17, tokens: 1480 }
        },
        contentTypeBreakdown: {
          reading: { count: 15, tokens: 1800 },
          vocabulary: { count: 12, tokens: 980 },
          questions: { count: 10, tokens: 600 },
          answers: { count: 5, tokens: 200 }
        },
        dailyUsage: {
          '2025-08-01': { count: 8, tokens: 720 },
          '2025-07-31': { count: 12, tokens: 1040 },
          '2025-07-30': { count: 10, tokens: 850 }
        }
      }
    };
  }
}

export default DemoService;