import React, { useState, useCallback } from 'react'
import { 
  Brain, 
  Shuffle, 
  Eye, 
  Zap, 
  Target, 
  BookOpen,
  MessageSquare,
  Layers,
  Link,
  Timer
} from 'lucide-react'
import aiService from '../../services/aiService'

/**
 * 독해력 훈련 모듈 컬렉션
 * 다양한 독해력 향상 훈련을 제공하는 컴포넌트
 */

// 1. 문장 순서 배열하기
export function SentenceOrderingModule({ text, gradeLevel, onComplete }) {
  const [sentences, setSentences] = useState([])
  const [shuffledSentences, setShuffledSentences] = useState([])
  const [userOrder, setUserOrder] = useState([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateExercise = useCallback(async () => {
    setIsGenerating(true)
    try {
      const prompt = `다음 지문을 5-7개의 의미 있는 문장으로 나누고, 순서를 섞어주세요:

지문: ${text}

다음 형식으로 응답해주세요:
{
  "originalSentences": ["문장1", "문장2", "문장3", ...],
  "shuffledOrder": [2, 0, 3, 1, ...],
  "hint": "첫 문장을 찾는 힌트"
}`

      const response = await aiService.generateContent({
        contentType: 'analysis',
        prompt,
        targetAge: gradeLevel
      })

      if (response.success && response.content) {
        const data = typeof response.content === 'string' 
          ? JSON.parse(response.content) 
          : response.content

        setSentences(data.originalSentences)
        const shuffled = data.shuffledOrder.map(index => ({
          text: data.originalSentences[index],
          originalIndex: index
        }))
        setShuffledSentences(shuffled)
      }
    } catch (error) {
      console.error('문장 순서 문제 생성 오류:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [text, gradeLevel])

  const checkAnswer = () => {
    let correctCount = 0
    userOrder.forEach((item, index) => {
      if (item.originalIndex === index) {
        correctCount++
      }
    })
    const finalScore = Math.round((correctCount / sentences.length) * 100)
    setScore(finalScore)
    setIsCompleted(true)
    onComplete?.('sentence_ordering', finalScore)
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <Shuffle className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-xl font-semibold">문장 순서 배열하기</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        섞인 문장들을 올바른 순서로 배열해보세요.
      </p>

      {isGenerating ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 문장 드래그 앤 드롭 UI 구현 */}
          <div className="text-center">
            <button 
              onClick={generateExercise}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              시작하기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 2. 빈칸 채우기
export function FillInTheBlanksModule({ text, gradeLevel, onComplete }) {
  const [blankedText, setBlankedText] = useState('')
  const [blanks, setBlanks] = useState([])
  const [userAnswers, setUserAnswers] = useState({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateExercise = useCallback(async () => {
    setIsGenerating(true)
    try {
      const prompt = `다음 지문에서 중요한 단어 5-8개를 빈칸으로 만들어주세요:

지문: ${text}

다음 형식으로 응답해주세요:
{
  "blankedText": "빈칸이 포함된 지문 (빈칸은 ___로 표시)",
  "answers": ["답1", "답2", "답3", ...],
  "hints": ["힌트1", "힌트2", "힌트3", ...]
}`

      const response = await aiService.generateContent({
        contentType: 'analysis',
        prompt,
        targetAge: gradeLevel
      })

      if (response.success && response.content) {
        const data = typeof response.content === 'string' 
          ? JSON.parse(response.content) 
          : response.content

        setBlankedText(data.blankedText)
        setBlanks(data.answers)
      }
    } catch (error) {
      console.error('빈칸 채우기 문제 생성 오류:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [text, gradeLevel])

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <Eye className="w-6 h-6 text-green-600 mr-2" />
        <h3 className="text-xl font-semibold">핵심 단어 빈칸 채우기</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        빈칸에 알맞은 단어를 채워 문장을 완성하세요.
      </p>

      {/* 구현 내용 */}
    </div>
  )
}

// 3. 속독 훈련
export function SpeedReadingModule({ text, gradeLevel, onComplete }) {
  const [currentSpeed, setCurrentSpeed] = useState(200) // 분당 글자수
  const [isRunning, setIsRunning] = useState(false)
  const [comprehensionTest, setComprehensionTest] = useState(null)
  const [results, setResults] = useState(null)

  const startSpeedReading = () => {
    setIsRunning(true)
    // RSVP (Rapid Serial Visual Presentation) 방식 구현
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <Zap className="w-6 h-6 text-yellow-600 mr-2" />
        <h3 className="text-xl font-semibold">속독 훈련</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        빠르게 읽으면서도 내용을 이해하는 훈련입니다.
      </p>

      <div className="text-center">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            읽기 속도: {currentSpeed}자/분
          </label>
          <input 
            type="range" 
            min="100" 
            max="500" 
            value={currentSpeed}
            onChange={(e) => setCurrentSpeed(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <button 
          onClick={startSpeedReading}
          className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          속독 시작
        </button>
      </div>
    </div>
  )
}

// 4. 핵심 내용 요약하기
export function SummarizationModule({ text, gradeLevel, onComplete }) {
  const [userSummary, setUserSummary] = useState('')
  const [aiSummary, setAiSummary] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzeSummary = useCallback(async () => {
    setIsAnalyzing(true)
    try {
      const prompt = `다음 지문의 핵심 내용을 2-3문장으로 요약하고, 사용자의 요약을 평가해주세요:

원문: ${text}
사용자 요약: ${userSummary}

다음 형식으로 응답해주세요:
{
  "modelSummary": "모범 요약",
  "score": 85,
  "feedback": "평가 피드백",
  "missedPoints": ["놓친 핵심 1", "놓친 핵심 2"],
  "goodPoints": ["잘 파악한 점 1", "잘 파악한 점 2"]
}`

      const response = await aiService.generateContent({
        contentType: 'analysis',
        prompt,
        targetAge: gradeLevel
      })

      if (response.success && response.content) {
        const data = typeof response.content === 'string' 
          ? JSON.parse(response.content) 
          : response.content

        setAiSummary(data.modelSummary)
        setFeedback(data)
        onComplete?.('summarization', data.score)
      }
    } catch (error) {
      console.error('요약 분석 오류:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [text, userSummary, gradeLevel, onComplete])

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <Target className="w-6 h-6 text-purple-600 mr-2" />
        <h3 className="text-xl font-semibold">핵심 내용 요약하기</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        읽은 내용의 핵심을 2-3문장으로 요약해보세요.
      </p>

      <textarea
        value={userSummary}
        onChange={(e) => setUserSummary(e.target.value)}
        placeholder="핵심 내용을 요약해주세요..."
        className="w-full p-4 border border-gray-300 rounded-lg mb-4"
        rows="4"
      />

      <button 
        onClick={analyzeSummary}
        disabled={!userSummary.trim() || isAnalyzing}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
      >
        {isAnalyzing ? '분석 중...' : '제출하기'}
      </button>

      {feedback && (
        <div className="mt-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">모범 요약</h4>
            <p className="text-blue-800">{aiSummary}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">점수: {feedback.score}점</h4>
            <p className="text-green-800">{feedback.feedback}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// 5. 추론 능력 훈련
export function InferenceModule({ text, gradeLevel, onComplete }) {
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const generateInferenceQuestions = useCallback(async () => {
    setIsGenerating(true)
    try {
      const prompt = `다음 지문을 읽고 추론 능력을 평가할 수 있는 문제 5개를 만들어주세요:

지문: ${text}

추론 문제 유형:
1. 인물의 감정이나 의도 추론
2. 다음에 일어날 일 예측
3. 원인과 결과 관계 파악
4. 숨겨진 의미나 주제 파악
5. 상황에 대한 판단

다음 형식으로 응답해주세요:
{
  "questions": [
    {
      "question": "추론 질문",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "correctAnswer": 0,
      "explanation": "정답 설명",
      "inferenceType": "emotion|prediction|causality|theme|judgment"
    }
  ]
}`

      const response = await aiService.generateContent({
        contentType: 'analysis',
        prompt,
        targetAge: gradeLevel
      })

      if (response.success && response.content) {
        const data = typeof response.content === 'string' 
          ? JSON.parse(response.content) 
          : response.content

        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('추론 문제 생성 오류:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [text, gradeLevel])

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <Brain className="w-6 h-6 text-indigo-600 mr-2" />
        <h3 className="text-xl font-semibold">추론 능력 훈련</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        글에 직접 나타나지 않은 내용을 추론해보세요.
      </p>

      {/* 추론 문제 UI 구현 */}
    </div>
  )
}

// 6. 어휘 맥락 이해
export function VocabularyContextModule({ text, gradeLevel, onComplete }) {
  const [contextWords, setContextWords] = useState([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)

  const generateContextExercise = useCallback(async () => {
    setIsGenerating(true)
    try {
      const prompt = `다음 지문에서 문맥상 의미를 파악해야 하는 단어 5개를 선정하고 문제를 만들어주세요:

지문: ${text}

다음 형식으로 응답해주세요:
{
  "words": [
    {
      "word": "단어",
      "sentence": "단어가 포함된 문장",
      "contextMeaning": "문맥상 의미",
      "options": ["의미1", "의미2", "의미3", "의미4"],
      "correctAnswer": 0,
      "explanation": "설명"
    }
  ]
}`

      const response = await aiService.generateContent({
        contentType: 'analysis',
        prompt,
        targetAge: gradeLevel
      })

      if (response.success && response.content) {
        const data = typeof response.content === 'string' 
          ? JSON.parse(response.content) 
          : response.content

        setContextWords(data.words)
      }
    } catch (error) {
      console.error('어휘 맥락 문제 생성 오류:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [text, gradeLevel])

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <BookOpen className="w-6 h-6 text-orange-600 mr-2" />
        <h3 className="text-xl font-semibold">어휘 맥락 이해</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        문장 속에서 단어가 어떤 의미로 사용되었는지 파악해보세요.
      </p>

      {/* 어휘 맥락 문제 UI 구현 */}
    </div>
  )
}

// 7. 논리적 연결 훈련
export function LogicalConnectionModule({ text, gradeLevel, onComplete }) {
  const [connections, setConnections] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generateConnectionExercise = useCallback(async () => {
    setIsGenerating(true)
    try {
      const prompt = `다음 지문에서 논리적 연결 관계를 찾아 문제를 만들어주세요:

지문: ${text}

연결 관계 유형:
- 원인과 결과
- 대조와 비교
- 예시와 설명
- 시간적 순서
- 조건과 결과

다음 형식으로 응답해주세요:
{
  "connections": [
    {
      "sentence1": "첫 번째 문장",
      "sentence2": "두 번째 문장",
      "connectionType": "cause-effect|contrast|example|sequence|condition",
      "connector": "연결어구",
      "explanation": "관계 설명"
    }
  ]
}`

      const response = await aiService.generateContent({
        contentType: 'analysis',
        prompt,
        targetAge: gradeLevel
      })

      if (response.success && response.content) {
        const data = typeof response.content === 'string' 
          ? JSON.parse(response.content) 
          : response.content

        setConnections(data.connections)
      }
    } catch (error) {
      console.error('논리적 연결 문제 생성 오류:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [text, gradeLevel])

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <Link className="w-6 h-6 text-teal-600 mr-2" />
        <h3 className="text-xl font-semibold">논리적 연결 훈련</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        문장들 사이의 논리적 관계를 파악해보세요.
      </p>

      {/* 논리적 연결 문제 UI 구현 */}
    </div>
  )
}

// 전체 훈련 모듈 통합 컴포넌트
export default function ComprehensionTrainingHub({ text, gradeLevel }) {
  const [selectedModule, setSelectedModule] = useState(null)
  const [completedModules, setCompletedModules] = useState({})
  const [overallProgress, setOverallProgress] = useState(0)

  const modules = [
    {
      id: 'sentence_ordering',
      name: '문장 순서 배열',
      icon: Shuffle,
      description: '섞인 문장을 올바른 순서로 배열하기',
      component: SentenceOrderingModule,
      color: 'blue'
    },
    {
      id: 'fill_blanks',
      name: '빈칸 채우기',
      icon: Eye,
      description: '핵심 단어가 빠진 빈칸 채우기',
      component: FillInTheBlanksModule,
      color: 'green'
    },
    {
      id: 'speed_reading',
      name: '속독 훈련',
      icon: Zap,
      description: '빠르게 읽으면서 이해하기',
      component: SpeedReadingModule,
      color: 'yellow'
    },
    {
      id: 'summarization',
      name: '요약하기',
      icon: Target,
      description: '핵심 내용을 간단히 요약하기',
      component: SummarizationModule,
      color: 'purple'
    },
    {
      id: 'inference',
      name: '추론 훈련',
      icon: Brain,
      description: '숨겨진 의미와 내용 추론하기',
      component: InferenceModule,
      color: 'indigo'
    },
    {
      id: 'vocabulary_context',
      name: '어휘 맥락',
      icon: BookOpen,
      description: '문맥 속 단어 의미 파악하기',
      component: VocabularyContextModule,
      color: 'orange'
    },
    {
      id: 'logical_connection',
      name: '논리 연결',
      icon: Link,
      description: '문장 간 논리적 관계 이해하기',
      component: LogicalConnectionModule,
      color: 'teal'
    }
  ]

  const handleModuleComplete = (moduleId, score) => {
    setCompletedModules(prev => ({
      ...prev,
      [moduleId]: score
    }))
    
    const newProgress = Object.keys(completedModules).length + 1
    setOverallProgress((newProgress / modules.length) * 100)
  }

  if (selectedModule) {
    const ModuleComponent = selectedModule.component
    return (
      <div>
        <button
          onClick={() => setSelectedModule(null)}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← 모듈 목록으로 돌아가기
        </button>
        
        <ModuleComponent
          text={text}
          gradeLevel={gradeLevel}
          onComplete={(moduleId, score) => {
            handleModuleComplete(moduleId, score)
            setSelectedModule(null)
          }}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">독해력 훈련 센터</h2>
        <p className="text-gray-600">다양한 방법으로 독해력을 향상시켜보세요.</p>
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">전체 진행도</span>
            <span className="text-sm text-gray-600">
              {Object.keys(completedModules).length} / {modules.length} 완료
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(module => {
          const Icon = module.icon
          const isCompleted = completedModules[module.id] !== undefined
          const score = completedModules[module.id]
          
          return (
            <button
              key={module.id}
              onClick={() => setSelectedModule(module)}
              className={`p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all text-left ${
                isCompleted ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <Icon className={`w-8 h-8 text-${module.color}-600`} />
                {isCompleted && (
                  <span className="text-green-600 font-semibold">{score}점</span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{module.name}</h3>
              <p className="text-sm text-gray-600">{module.description}</p>
              
              {isCompleted && (
                <div className="mt-4 text-sm text-green-600">
                  ✓ 완료됨
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}