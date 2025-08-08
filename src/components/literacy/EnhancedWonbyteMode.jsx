import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, CheckCircle, MousePointer, Keyboard, Brain, Check, XIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import aiService from '../../services/aiService'

export default function EnhancedWonbyteMode({ text, onClose, onComplete, gradeLevel = 'elem4' }) {
  const { user } = useAuth()
  const [sentences, setSentences] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [totalCharsRead, setTotalCharsRead] = useState(0)
  
  // 키워드 퀴즈 관련 상태
  const [showKeywordQuiz, setShowKeywordQuiz] = useState(false)
  const [keywords, setKeywords] = useState({ related: [], unrelated: [] })
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizAnswers, setQuizAnswers] = useState({})
  const [showQuizResult, setShowQuizResult] = useState(false)
  const [comprehensionScore, setComprehensionScore] = useState(0)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  
  // 문장 분리 로직
  useEffect(() => {
    if (text) {
      // 한국어 문장 종결 패턴으로 분리
      const sentenceArray = text
        .split(/(?<=[.!?。！？])\s+/)
        .filter(sentence => sentence.trim().length > 0)
        .map(sentence => sentence.trim())
      
      setSentences(sentenceArray)
    }
  }, [text])

  // AI를 통한 키워드 생성
  const generateKeywords = useCallback(async () => {
    setIsGeneratingQuiz(true)
    try {
      const prompt = `다음 지문을 읽고 키워드를 추출해주세요:

지문: ${text}

다음 형식으로 응답해주세요:
{
  "related": ["관련키워드1", "관련키워드2", "관련키워드3", "관련키워드4", "관련키워드5"],
  "unrelated": ["무관키워드1", "무관키워드2", "무관키워드3", "무관키워드4", "무관키워드5"]
}

- related: 지문과 직접적으로 관련된 핵심 키워드 5개
- unrelated: 지문과 전혀 관련 없는 키워드 5개 (같은 주제 영역이지만 지문에 나오지 않는 단어들)
- ${gradeLevel} 수준에 맞는 단어로 선정해주세요`

      const response = await aiService.generateContent({
        contentType: 'analysis',
        prompt,
        targetAge: gradeLevel
      })

      if (response.success && response.content) {
        let keywordData
        try {
          if (typeof response.content === 'string') {
            keywordData = JSON.parse(response.content)
          } else {
            keywordData = response.content
          }
        } catch (e) {
          // 파싱 실패 시 기본값
          keywordData = {
            related: ['핵심', '주제', '내용', '설명', '이해'],
            unrelated: ['날씨', '음식', '운동', '여행', '게임']
          }
        }

        setKeywords(keywordData)
        
        // 퀴즈 문제 생성 (관련 키워드와 무관 키워드를 섞어서)
        const allKeywords = [
          ...keywordData.related.map(k => ({ word: k, isRelated: true })),
          ...keywordData.unrelated.map(k => ({ word: k, isRelated: false }))
        ]
        
        // 랜덤하게 섞기
        const shuffled = allKeywords.sort(() => Math.random() - 0.5)
        setQuizQuestions(shuffled.slice(0, 10)) // 10개 문제
      }
    } catch (error) {
      console.error('키워드 생성 오류:', error)
      // 오류 시 기본 키워드 사용
      const defaultKeywords = {
        related: ['내용', '주제', '설명', '이야기', '문장'],
        unrelated: ['운동', '음악', '영화', '요리', '여행']
      }
      setKeywords(defaultKeywords)
      
      const allKeywords = [
        ...defaultKeywords.related.map(k => ({ word: k, isRelated: true })),
        ...defaultKeywords.unrelated.map(k => ({ word: k, isRelated: false }))
      ]
      setQuizQuestions(allKeywords.sort(() => Math.random() - 0.5))
    } finally {
      setIsGeneratingQuiz(false)
    }
  }, [text, gradeLevel])

  // 다음 문장으로 이동
  const showNextSentence = useCallback(() => {
    if (currentIndex < sentences.length - 1) {
      const currentSentence = sentences[currentIndex]
      setTotalCharsRead(prev => prev + currentSentence.length)
      setCurrentIndex(prev => prev + 1)
    } else if (currentIndex === sentences.length - 1 && !isCompleted) {
      // 마지막 문장 읽기 완료
      const lastSentence = sentences[currentIndex]
      setTotalCharsRead(prev => prev + lastSentence.length)
      setIsCompleted(true)
      // 키워드 퀴즈 생성
      generateKeywords()
    }
  }, [currentIndex, sentences, isCompleted, generateKeywords])

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && !isCompleted && !showKeywordQuiz) {
        e.preventDefault()
        showNextSentence()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showNextSentence, isCompleted, showKeywordQuiz])

  // 퀴즈 답변 처리
  const handleQuizAnswer = (index, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [index]: answer
    }))
  }

  // 퀴즈 결과 계산
  const calculateQuizResult = () => {
    let correctCount = 0
    quizQuestions.forEach((question, index) => {
      const userAnswer = quizAnswers[index]
      if (userAnswer !== undefined) {
        if ((question.isRelated && userAnswer === true) || (!question.isRelated && userAnswer === false)) {
          correctCount++
        }
      }
    })
    
    const score = Math.round((correctCount / quizQuestions.length) * 100)
    setComprehensionScore(score)
    setShowQuizResult(true)
  }

  // 완료 처리
  const handleComplete = async () => {
    try {
      // 읽은 글자수 및 이해도 점수 업데이트
      if (user?.id) {
        const { data: existingStats } = await supabase
          .from('user_stats')
          .select('total_chars_read, comprehension_scores')
          .eq('user_id', user.id)
          .single()

        const currentTotal = existingStats?.total_chars_read || 0
        const scores = existingStats?.comprehension_scores || []
        scores.push(comprehensionScore)
        
        await supabase
          .from('user_stats')
          .upsert({
            user_id: user.id,
            total_chars_read: currentTotal + totalCharsRead,
            comprehension_scores: scores,
            average_comprehension: scores.reduce((a, b) => a + b, 0) / scores.length,
            last_activity: new Date().toISOString()
          })

        // 학습 기록 저장
        await supabase
          .from('learning_records')
          .insert({
            user_id: user.id,
            activity_type: 'enhanced_wonbyte_mode',
            chars_read: totalCharsRead,
            comprehension_score: comprehensionScore,
            completed_at: new Date().toISOString()
          })
      }

      onComplete?.(totalCharsRead, comprehensionScore)
      onClose()
    } catch (error) {
      console.error('Error saving reading progress:', error)
    }
  }

  const progress = sentences.length > 0 ? ((currentIndex + 1) / sentences.length) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-5xl mx-auto p-8 flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">
              {showKeywordQuiz ? '이해도 확인' : '원바이트 모드'}
            </h2>
            {!showKeywordQuiz && (
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <MousePointer className="w-4 h-4" />
                <span>클릭</span>
                <span className="mx-2">또는</span>
                <Keyboard className="w-4 h-4" />
                <span>스페이스바</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 진행 상태 바 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-sm">
              {showKeywordQuiz ? '키워드 퀴즈' : `${currentIndex + 1} / ${sentences.length} 문장`}
            </span>
            <span className="text-white text-sm">
              {totalCharsRead}자 읽음
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${showKeywordQuiz ? 100 : progress}%` }}
            />
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        {!showKeywordQuiz ? (
          /* 문장 표시 영역 */
          <div 
            className="flex-1 flex items-center cursor-pointer px-8"
            onClick={!isCompleted ? showNextSentence : undefined}
          >
            <div className="max-w-4xl">
              {sentences[currentIndex] && (
                <p className="text-3xl md:text-4xl lg:text-5xl text-white leading-relaxed font-medium text-left">
                  {sentences[currentIndex]}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* 키워드 퀴즈 영역 */
          <div className="flex-1 overflow-y-auto px-8">
            <div className="max-w-3xl mx-auto">
              {!showQuizResult ? (
                <>
                  <div className="mb-8 text-white">
                    <h3 className="text-xl font-semibold mb-4">
                      <Brain className="inline-block w-6 h-6 mr-2" />
                      방금 읽은 지문과 관련된 키워드인지 판단해보세요
                    </h3>
                    <p className="text-gray-300">
                      각 키워드가 지문과 관련이 있으면 O, 없으면 X를 선택하세요.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {isGeneratingQuiz ? (
                      <div className="text-center text-white py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p>퀴즈를 생성하고 있습니다...</p>
                      </div>
                    ) : (
                      quizQuestions.map((question, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-6">
                          <div className="flex items-center justify-between">
                            <span className="text-xl text-white font-medium">
                              {question.word}
                            </span>
                            <div className="flex gap-4">
                              <button
                                onClick={() => handleQuizAnswer(index, true)}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                                  quizAnswers[index] === true
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                <Check className="w-5 h-5 inline-block mr-2" />
                                O (관련)
                              </button>
                              <button
                                onClick={() => handleQuizAnswer(index, false)}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                                  quizAnswers[index] === false
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                <XIcon className="w-5 h-5 inline-block mr-2" />
                                X (무관)
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {!isGeneratingQuiz && Object.keys(quizAnswers).length === quizQuestions.length && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={calculateQuizResult}
                        className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
                      >
                        결과 확인
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* 퀴즈 결과 표시 */
                <div className="text-center text-white">
                  <div className="mb-8">
                    <h3 className="text-3xl font-bold mb-4">이해도 평가 결과</h3>
                    <div className="text-6xl font-bold mb-4">
                      {comprehensionScore}%
                    </div>
                    <p className="text-xl text-gray-300">
                      {comprehensionScore >= 80 ? '훌륭해요! 지문을 잘 이해했습니다.' :
                       comprehensionScore >= 60 ? '좋아요! 대체로 잘 이해했습니다.' :
                       '더 연습이 필요해요. 다시 한번 읽어보세요.'}
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6 mb-8">
                    <h4 className="text-lg font-semibold mb-4">상세 결과</h4>
                    <div className="space-y-3">
                      {quizQuestions.map((question, index) => {
                        const userAnswer = quizAnswers[index]
                        const isCorrect = (question.isRelated && userAnswer === true) || 
                                        (!question.isRelated && userAnswer === false)
                        
                        return (
                          <div key={index} className="flex items-center justify-between text-left">
                            <span className="text-gray-300">{question.word}</span>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm ${question.isRelated ? 'text-green-400' : 'text-red-400'}`}>
                                {question.isRelated ? '관련' : '무관'}
                              </span>
                              {isCorrect ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <X className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 하단 컨트롤 */}
        <div className="flex justify-center mt-8">
          {!showKeywordQuiz && !isCompleted ? (
            <button
              onClick={showNextSentence}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다음 문장
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : isCompleted && !showKeywordQuiz ? (
            <button
              onClick={() => setShowKeywordQuiz(true)}
              disabled={isGeneratingQuiz}
              className="flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold disabled:bg-gray-600"
            >
              <Brain className="w-6 h-6" />
              {isGeneratingQuiz ? '퀴즈 생성 중...' : '이해도 확인하기'}
            </button>
          ) : showQuizResult ? (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
            >
              <CheckCircle className="w-6 h-6" />
              완료 (이해도 {comprehensionScore}%)
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}