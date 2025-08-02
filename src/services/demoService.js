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

    // 주제 추출 (프롬프트에서 주제를 파악)
    const topic = this.extractTopic(prompt);

    // 지문 생성
    if (contentType === 'reading') {
      const topicData = this.getTopicData(topic, targetAge);
      
      return {
        success: true,
        content: {
          title: topicData.title,
          description: `${this.getAgeDescription(targetAge)}을 위한 ${topicData.topic} 이야기`,
          mainContent: {
            introduction: this.generateReadingContent(contentLength, targetAge, topic),
            keyPoints: topicData.keyPoints,
            examples: topicData.examples
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

  // 주제 추출 (프롬프트에서)
  extractTopic(prompt) {
    if (!prompt) return 'game';
    
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('게임') || promptLower.includes('기술') || promptLower.includes('컴퓨터') || promptLower.includes('로봇')) {
      return 'game';
    } else if (promptLower.includes('스포츠') || promptLower.includes('축구') || promptLower.includes('운동')) {
      return 'sports';
    } else if (promptLower.includes('음악') || promptLower.includes('노래') || promptLower.includes('엔터테인먼트')) {
      return 'music';
    } else if (promptLower.includes('동물') || promptLower.includes('자연') || promptLower.includes('환경')) {
      return 'nature';
    } else if (promptLower.includes('과학') || promptLower.includes('우주') || promptLower.includes('실험')) {
      return 'science';
    } else if (promptLower.includes('음식') || promptLower.includes('요리') || promptLower.includes('맛')) {
      return 'food';
    } else {
      return 'game'; // 기본값
    }
  }

  // 주제별 데이터 생성
  getTopicData(topic, targetAge) {
    const topicMap = {
      game: {
        title: "게임과 기술",
        topic: "게임 & 기술",
        keyPoints: [
          "컴퓨터 게임은 재미있는 놀이입니다",
          "기술 발전으로 게임이 더 발달했습니다", 
          "게임을 할 때는 시간을 지켜야 합니다"
        ],
        examples: [
          {
            korean: "친구들과 함께 게임을 하면 더 재미있어요.",
            explanation: "협동하는 게임의 즐거움"
          }
        ]
      },
      sports: {
        title: "스포츠와 건강",
        topic: "스포츠",
        keyPoints: [
          "운동은 우리 몸을 건강하게 합니다",
          "여러 가지 스포츠가 있습니다",
          "팀워크가 중요합니다"
        ],
        examples: [
          {
            korean: "축구를 하면 다리 근육이 강해져요.",
            explanation: "운동과 건강의 관계"
          }
        ]
      },
      nature: {
        title: "동물과 자연",
        topic: "동물 & 자연",
        keyPoints: [
          "자연에는 많은 동물들이 살고 있습니다",
          "동물마다 다른 특징을 가지고 있습니다",
          "자연을 보호해야 합니다"
        ],
        examples: [
          {
            korean: "숲에서 다람쥐가 도토리를 모으고 있어요.",
            explanation: "동물의 생활 모습"
          }
        ]
      }
    };

    return topicMap[topic] || topicMap.game;
  }

  // 글자 수에 맞는 읽기 지문 생성
  generateReadingContent(contentLength, targetAge, topic = 'nature') {
    const contentMap = {
      game: {
        base: "요즘 컴퓨터 게임은 정말 재미있습니다. 스마트폰이나 컴퓨터로 여러 가지 게임을 할 수 있어요. 게임을 하면 친구들과 함께 즐길 수 있고, 새로운 것을 배울 수도 있습니다. 하지만 게임을 할 때는 시간을 정해서 해야 해요. 너무 오래 하면 눈이 아프고 공부할 시간이 부족해집니다. 게임은 재미있지만 적당히 하는 것이 좋습니다.",
        additional: " 게임을 만드는 사람들을 개발자라고 부릅니다. 이들은 컴퓨터 프로그래밍을 배워서 재미있는 게임을 만들어요. 미래에는 더욱 발달한 기술로 더 재미있는 게임들이 나올 것입니다. 가상현실 게임이나 로봇과 함께 하는 게임도 있어요. 기술이 발전하면 우리 생활이 더욱 편리해집니다.",
        extra: " 로봇 기술도 많이 발전했습니다. 집에서 청소를 도와주는 로봇이나 음성으로 대화할 수 있는 AI도 있어요. 인공지능은 사람처럼 생각하고 배울 수 있는 기술입니다. 앞으로 로봇이 더 똑똑해져서 우리 생활을 많이 도와줄 것입니다."
      },
      nature: {
        base: "따뜻한 봄이 오면 여러 가지 예쁜 꽃들이 피어납니다. 개나리는 노란색으로 먼저 피고, 진달래는 분홍색으로 예쁘게 핍니다. 벚꽃은 하얀색과 분홍색으로 피어서 마치 눈이 내린 것 같아요. 꽃들은 우리에게 봄이 왔다고 알려주는 친구들입니다. 꽃들을 보면 마음이 기뻐집니다. 우리는 꽃을 소중히 여겨야 해요. 꽃을 꺾지 말고 예쁘게 구경만 해야 합니다. 꽃들도 우리처럼 살아있는 생명이기 때문입니다.",
        additional: " 봄에는 가족과 함께 꽃구경을 가면 좋겠어요. 공원이나 산에 가서 여러 가지 꽃들을 찾아보세요. 꽃의 색깔과 모양을 자세히 관찰해보면 정말 신기합니다. 자연은 우리에게 아름다운 선물을 주는 것 같아요. 꽃향기를 맡아보고, 나비나 벌들이 꽃을 찾아오는 모습도 관찰해보세요. 계절이 바뀌면서 피는 꽃들도 달라집니다.",
        extra: " 여름에는 해바라기와 장미가 피고, 가을에는 코스모스와 국화가 아름답게 핍니다. 겨울에는 동백꽃이 추위를 이겨내며 붉게 피어납니다. 우리나라에는 정말 다양한 꽃들이 사계절 내내 피어나므로 언제든지 아름다운 자연을 만날 수 있습니다. 꽃을 통해 자연의 신비로움과 생명의 소중함을 배울 수 있어요."
      },
      sports: {
        base: "운동은 우리 몸을 건강하게 만들어 줍니다. 축구, 농구, 수영 등 여러 가지 스포츠가 있어요. 친구들과 함께 운동을 하면 더욱 재미있습니다. 운동을 하면 근육이 강해지고 심장도 건강해집니다. 매일 조금씩이라도 몸을 움직이는 것이 좋아요. 운동은 스트레스를 줄여주고 기분을 좋게 만들어 줍니다.",
        additional: " 팀 스포츠를 하면 협동심을 기를 수 있어요. 서로 도와주고 응원하면서 함께 목표를 달성하는 기쁨을 느낄 수 있습니다. 올림픽이나 월드컵 같은 큰 대회를 보면서 선수들의 노력과 열정을 배울 수 있어요.",
        extra: " 운동선수가 되려면 어릴 때부터 꾸준히 연습해야 합니다. 건강한 몸과 강한 정신력이 필요해요. 우리도 매일 운동하는 습관을 기르면 건강하고 행복한 생활을 할 수 있습니다."
      }
    };

    const content = contentMap[topic] || contentMap.nature;
    const { base, additional, extra } = content;

    const targetLength = parseInt(contentLength);
    let result = base;

    if (targetLength >= 600) {
      result += additional;
    }
    if (targetLength >= 1000) {
      result += extra;
    }

    // 목표 길이에 근사하게 조정
    if (result.length < targetLength) {
      const paddingMap = {
        game: " 기술은 우리 생활을 더욱 편리하게 만들어 줍니다.",
        nature: " 자연은 우리 생활에 기쁨과 아름다움을 가져다줍니다.",
        sports: " 운동은 건강한 생활의 기초가 됩니다."
      };
      const padding = (paddingMap[topic] || paddingMap.nature).repeat(
        Math.ceil((targetLength - result.length) / 30)
      );
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