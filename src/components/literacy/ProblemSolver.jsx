import React, { useState, useCallback } from 'react'
import { CheckCircle, XCircle, BookOpen, ChevronRight, FileText, RotateCcw } from 'lucide-react'
import aiService from '../../services/aiService'
import { WrongAnswerManager } from '../../utils/storage'

/**
 * 문제 풀이 컴포넌트
 * - 문제를 보여주고 답을 선택할 수 있게 함
 * - 답 제출 후 정답 확인 및 해설 표시
 * - 오답 자동 저장
 */
export default function ProblemSolver({ problems, text, gradeLevel, onComplete }) {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showExplanations, setShowExplanations] = useState(false)
  const [explanations, setExplanations] = useState({})
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false)
  const [score, setScore] = useState(null)

  const currentProblem = problems[currentProblemIndex]

  // 답안 선택/입력
  const handleAnswerSelect = useCallback((answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentProblem.id]: answer
    }))
  }, [currentProblem])

  // 다음 문제로
  const handleNextProblem = useCallback(() => {
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1)
    }
  }, [currentProblemIndex, problems.length])

  // 이전 문제로
  const handlePrevProblem = useCallback(() => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(prev => prev - 1)
    }
  }, [currentProblemIndex])

  // 채점 및 해설 생성
  const handleSubmit = useCallback(async () => {
    // 채점
    let correctCount = 0
    const wrongAnswers = []

    problems.forEach(problem => {
      const userAnswer = selectedAnswers[problem.id]
      const isCorrect = problem.type === 'multiple_choice' 
        ? userAnswer === problem.correctAnswer
        : userAnswer && userAnswer.trim().length > 0 // 서술형은 작성 여부만 체크

      if (isCorrect) {
        correctCount++
      } else if (userAnswer !== undefined) {
        // 오답 저장
        wrongAnswers.push({
          problemId: problem.id,
          question: problem.question,
          userAnswer: problem.type === 'multiple_choice' ? problem.options[userAnswer] : userAnswer,
          correctAnswer: problem.type === 'multiple_choice' ? problem.options[problem.correctAnswer] : problem.sampleAnswer,
          explanation: problem.explanation,
          context: text.substring(0, 200) + '...' // 지문의 일부 저장
        })
      }
    })

    // 오답 저장
    wrongAnswers.forEach(wrongAnswer => {
      WrongAnswerManager.addWrongAnswer({
        ...wrongAnswer,
        date: new Date().toISOString(),
        grade: gradeLevel
      })
    })

    setScore({
      correct: correctCount,
      total: problems.length,
      percentage: Math.round((correctCount / problems.length) * 100)
    })

    // 해설 표시
    setShowExplanations(true)
    
    // AI 해설 생성
    setIsGeneratingExplanation(true)
    try {
      const explanationPromises = problems.map(async (problem) => {
        const userAnswer = selectedAnswers[problem.id]
        const response = await aiService.generateExplanation({
          question: problem.question,
          type: problem.type,
          correctAnswer: problem.type === 'multiple_choice' ? problem.options[problem.correctAnswer] : problem.sampleAnswer,
          userAnswer: problem.type === 'multiple_choice' ? (problem.options[userAnswer] || '답 선택 안함') : (userAnswer || '답 작성 안함'),
          explanation: problem.explanation,
          context: text.substring(0, 500)
        })
        
        return {
          problemId: problem.id,
          explanation: response.success ? response.content.explanation : problem.explanation
        }
      })

      const generatedExplanations = await Promise.all(explanationPromises)
      const explanationMap = {}
      generatedExplanations.forEach(exp => {
        explanationMap[exp.problemId] = exp.explanation
      })
      setExplanations(explanationMap)
    } catch (error) {
      console.error('해설 생성 오류:', error)
      // 기본 해설 사용
      const defaultExplanations = {}
      problems.forEach(problem => {
        defaultExplanations[problem.id] = problem.explanation
      })
      setExplanations(defaultExplanations)
    } finally {
      setIsGeneratingExplanation(false)
    }
  }, [problems, selectedAnswers, text, gradeLevel])

  // 다시 풀기
  const handleReset = useCallback(() => {
    setCurrentProblemIndex(0)
    setSelectedAnswers({})
    setShowExplanations(false)
    setExplanations({})
    setScore(null)
  }, [])

  if (problems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>풀 문제가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 진행 상황 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            문제 {currentProblemIndex + 1} / {problems.length}
          </span>
          {score && (
            <span className="text-sm font-medium text-blue-600">
              점수: {score.correct}/{score.total} ({score.percentage}%)
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentProblemIndex + 1) / problems.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 문제 표시 */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-4 ${
            currentProblem.type === 'multiple_choice'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {currentProblem.type === 'multiple_choice' ? '객관식' : '서술형'}
          </span>
          
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {currentProblem.question}
          </h3>
        </div>

        {/* 객관식 선택지 */}
        {currentProblem.type === 'multiple_choice' && (
          <div className="space-y-3">
            {currentProblem.options?.map((option, index) => {
              const isSelected = selectedAnswers[currentProblem.id] === index
              const isCorrect = showExplanations && index === currentProblem.correctAnswer
              const isWrong = showExplanations && isSelected && index !== currentProblem.correctAnswer

              return (
                <button
                  key={index}
                  onClick={() => !showExplanations && handleAnswerSelect(index)}
                  disabled={showExplanations}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isCorrect
                      ? 'border-green-500 bg-green-50'
                      : isWrong
                      ? 'border-red-500 bg-red-50'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${showExplanations ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-medium mr-3">{index + 1}.</span>
                      <span>{option}</span>
                    </div>
                    {showExplanations && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {showExplanations && isWrong && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* 서술형 답안 입력 */}
        {currentProblem.type === 'short_answer' && (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              {currentProblem.expectedLength || '1-2문장으로 답하세요'}
            </p>
            <textarea
              value={selectedAnswers[currentProblem.id] || ''}
              onChange={(e) => handleAnswerSelect(e.target.value)}
              disabled={showExplanations}
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              rows="4"
              placeholder="답을 작성하세요..."
            />
            {showExplanations && currentProblem.sampleAnswer && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">예시 답안:</p>
                <p className="text-sm text-green-700">{currentProblem.sampleAnswer}</p>
              </div>
            )}
          </div>
        )}

        {/* 해설 표시 */}
        {showExplanations && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <BookOpen className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 mb-2">해설</p>
                {isGeneratingExplanation ? (
                  <div className="flex items-center text-sm text-blue-700">
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    AI 해설 생성 중...
                  </div>
                ) : (
                  <p className="text-sm text-blue-700">
                    {explanations[currentProblem.id] || currentProblem.explanation}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevProblem}
          disabled={currentProblemIndex === 0}
          className="px-4 py-2 text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          이전 문제
        </button>

        <div className="flex gap-3">
          {!showExplanations && currentProblemIndex === problems.length - 1 && (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(selectedAnswers).length === 0}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              제출하기
            </button>
          )}
          
          {showExplanations && (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                다시 풀기
              </button>
              {onComplete && (
                <button
                  onClick={onComplete}
                  className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  완료
                </button>
              )}
            </>
          )}
        </div>

        <button
          onClick={handleNextProblem}
          disabled={currentProblemIndex === problems.length - 1}
          className="px-4 py-2 text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed flex items-center"
        >
          다음 문제
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* 점수 요약 */}
      {showExplanations && score && (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            학습 완료!
          </h3>
          <p className="text-lg text-gray-700">
            총 {score.total}문제 중 {score.correct}문제 정답
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {score.percentage}%
          </p>
          {score.percentage === 100 && (
            <p className="text-sm text-green-600 mt-2">🎉 완벽해요!</p>
          )}
          {score.percentage >= 80 && score.percentage < 100 && (
            <p className="text-sm text-blue-600 mt-2">👍 잘했어요!</p>
          )}
          {score.percentage < 80 && (
            <p className="text-sm text-orange-600 mt-2">💪 더 연습해봐요!</p>
          )}
        </div>
      )}
    </div>
  )
}