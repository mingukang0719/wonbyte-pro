// 전역 상수 및 설정
export const CONSTANTS = {
  // API 제공자
  API_PROVIDERS: {
    OPENAI: 'openai',
    CLAUDE: 'claude',
    GEMINI: 'gemini'
  },

  // 컨텐츠 타입
  CONTENT_TYPES: {
    READING: 'reading',
    VOCABULARY: 'vocabulary',
    GRAMMAR: 'grammar',
    QUESTIONS: 'questions',
    ANSWERS: 'answers'
  },

  // 난이도 레벨
  DIFFICULTY_LEVELS: {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced'
  },

  // 지문 길이 옵션
  TEXT_LENGTH: {
    SHORT: 400,
    MEDIUM: 800,
    LONG: 1200,
    MIN: 200,
    MAX: 2000
  },

  // 문제 개수 제한
  PROBLEM_COUNT: {
    VOCABULARY: {
      MIN: 5,
      DEFAULT: 10,
      MAX: 20
    },
    READING: {
      MIN: 3,
      DEFAULT: 5,
      MAX: 10
    }
  },

  // 파일 업로드
  FILE_UPLOAD: {
    ACCEPTED_TYPES: ['.txt', '.docx', '.pdf'],
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    MIME_TYPES: {
      TXT: 'text/plain',
      DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      PDF: 'application/pdf'
    }
  },

  // 에러 메시지
  ERROR_MESSAGES: {
    GENERIC: '오류가 발생했습니다. 다시 시도해주세요.',
    NETWORK: '네트워크 연결을 확인해주세요.',
    API_KEY: 'API 키가 설정되지 않았습니다.',
    FILE_TYPE: '지원하지 않는 파일 형식입니다.',
    FILE_SIZE: '파일 크기가 너무 큽니다. (최대 5MB)',
    EMPTY_TEXT: '텍스트를 입력해주세요.',
    MIN_LENGTH: '최소 200자 이상 입력해주세요.',
    MAX_LENGTH: '최대 2000자까지 입력 가능합니다.'
  },

  // 성공 메시지
  SUCCESS_MESSAGES: {
    TEXT_GENERATED: '지문이 성공적으로 생성되었습니다.',
    ANALYSIS_COMPLETE: '분석이 완료되었습니다.',
    PROBLEMS_GENERATED: '문제가 성공적으로 생성되었습니다.',
    PDF_CREATED: 'PDF가 생성되었습니다.'
  },

  // 로딩 메시지
  LOADING_MESSAGES: {
    GENERATING_TEXT: '지문을 생성하고 있습니다...',
    ANALYZING: '문해력을 분석하고 있습니다...',
    GENERATING_PROBLEMS: '문제를 생성하고 있습니다...',
    PROCESSING_FILE: '파일을 처리하고 있습니다...'
  }
}

// 주제 카테고리
export const TOPIC_CATEGORIES = [
  { id: 'game', label: '🎮 게임 & 기술', keywords: ['게임', '인공지능', '로봇', '메타버스'] },
  { id: 'sports', label: '⚽ 스포츠', keywords: ['축구', '야구', '올림픽', '스포츠 선수'] },
  { id: 'music', label: '🎵 음악 & 엔터테인먼트', keywords: ['K-pop', '아이돌', '영화', '드라마'] },
  { id: 'animal', label: '🐾 동물 & 자연', keywords: ['동물의 생태', '환경보호', '자연현상'] },
  { id: 'science', label: '🚀 과학 & 우주', keywords: ['우주탐험', '과학실험', '발명품', '미래기술'] },
  { id: 'food', label: '🍕 음식 & 요리', keywords: ['세계 음식', '요리법', '건강한 식단'] },
  { id: 'art', label: '🎨 예술 & 창작', keywords: ['미술', '만화', '공예', '창작 활동'] },
  { id: 'daily', label: '📱 일상 & 학교생활', keywords: ['친구 관계', '가족', '학교 이야기', '성장'] },
  { id: 'custom', label: '📚 사용자 정의', keywords: [] }
]

// 학년 옵션
export const GRADE_OPTIONS = [
  { value: 'elem1', label: '초등학교 1학년', age: 7 },
  { value: 'elem2', label: '초등학교 2학년', age: 8 },
  { value: 'elem3', label: '초등학교 3학년', age: 9 },
  { value: 'elem4', label: '초등학교 4학년', age: 10 },
  { value: 'elem5', label: '초등학교 5학년', age: 11 },
  { value: 'elem6', label: '초등학교 6학년', age: 12 },
  { value: 'middle1', label: '중학교 1학년', age: 13 },
  { value: 'middle2', label: '중학교 2학년', age: 14 },
  { value: 'middle3', label: '중학교 3학년', age: 15 }
]

// 지문 길이 옵션
export const LENGTH_OPTIONS = [
  { value: '400', label: '기초 (400자)' },
  { value: '800', label: '표준 (800자)' },
  { value: '1200', label: '심화 (1200자)' },
  { value: 'custom', label: '직접 입력' }
]