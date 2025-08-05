import React, { useState, useEffect } from 'react'
import { AlertCircle, RotateCcw, CheckCircle, X, BookOpen, TrendingUp, Calendar } from 'lucide-react'
import { WrongAnswerManager, LearningStatsManager, GameDataManager } from '../../utils/storage'

export default function WrongAnswerNote({ onClose, onSelectProblem }) {
  const [wrongAnswers, setWrongAnswers] = useState([])
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [retryAnswer, setRetryAnswer] = useState('')
  const [retryResult, setRetryResult] = useState(null)
  const [filter, setFilter] = useState('all') // all, unsolved, solved

  useEffect(() => {
    loadWrongAnswers()
  }, [])

  const loadWrongAnswers = () => {
    const answers = filter === 'unsolved' 
      ? WrongAnswerManager.getUnsolvedProblems()
      : filter === 'solved'
      ? WrongAnswerManager.getWrongAnswers().filter(w => w.solved)
      : WrongAnswerManager.getWrongAnswers()
    
    setWrongAnswers(answers)
  }

  useEffect(() => {
    loadWrongAnswers()
  }, [filter])

  const handleRetrySubmit = () => {
    if (!selectedProblem || !retryAnswer.trim()) return

    const isCorrect = retryAnswer.trim().toLowerCase() === 
      selectedProblem.correctAnswer.toLowerCase()

    setRetryResult(isCorrect)

    // 업데이트
    WrongAnswerManager.updateWrongAnswer(selectedProblem.id, {
      reviewCount: selectedProblem.reviewCount + 1,
      lastReviewDate: new Date().toISOString(),
      solved: isCorrect || selectedProblem.reviewCount >= 2
    })

    // 통계 업데이트
    LearningStatsManager.updateStats({
      problemsSolved: 1,
      correctAnswers: isCorrect ? 1 : 0
    })

    // 게임 포인트
    if (isCorrect) {
      GameDataManager.addPoints(10)
      GameDataManager.addExp(15)
      
      // 모든 오답 해결시 배지
      const remaining = WrongAnswerManager.getUnsolvedProblems()
      if (remaining.length === 0) {
        GameDataManager.unlockBadge('perfect_learner')
      }
    }

    // 목록 새로고침
    setTimeout(() => {
      loadWrongAnswers()
      if (isCorrect) {
        setSelectedProblem(null)
        setRetryAnswer('')
        setRetryResult(null)
        setShowAnswer(false)
      }
    }, 2000)
  }

  const handleDelete = (id) => {
    if (window.confirm('이 문제를 오답노트에서 삭제하시겠습니까?')) {
      WrongAnswerManager.removeWrongAnswer(id)
      loadWrongAnswers()
      if (selectedProblem?.id === id) {
        setSelectedProblem(null)
      }
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '어제'
    if (diffDays < 7) return `${diffDays}일 전`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
    return `${Math.floor(diffDays / 30)}개월 전`
  }

  const getProblemTypeLabel = (type) => {
    const types = {
      'multiple_choice': '객관식',
      'short_answer': '단답형',
      'long_answer': '서술형'
    }
    return types[type] || type
  }

  const unsolvedCount = wrongAnswers.filter(w => !w.solved).length
  const solvedCount = wrongAnswers.filter(w => w.solved).length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <AlertCircle className="w-6 h-6 mr-2" />
              오답노트
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="mt-2 flex gap-4 text-sm">
            <span>미해결: {unsolvedCount}개</span>
            <span>해결완료: {solvedCount}개</span>
            <span>전체: {wrongAnswers.length}개</span>
          </div>
        </div>

        {/* 필터 */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('unsolved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unsolved'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              미해결
            </button>
            <button
              onClick={() => setFilter('solved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'solved'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              해결완료
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* 문제 목록 */}
          <div className="w-1/3 border-r overflow-y-auto">
            {wrongAnswers.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <p className="text-gray-500">
                  {filter === 'unsolved' 
                    ? '미해결 문제가 없습니다!'
                    : '오답이 없습니다!'}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {wrongAnswers.map(problem => (
                  <div
                    key={problem.id}
                    onClick={() => {
                      setSelectedProblem(problem)
                      setShowAnswer(false)
                      setRetryAnswer('')
                      setRetryResult(null)
                    }}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                      selectedProblem?.id === problem.id
                        ? 'bg-red-100 border-2 border-red-300'
                        : 'bg-white hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        problem.solved 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {problem.solved ? '해결' : '미해결'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getProblemTypeLabel(problem.type)}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">
                      {problem.question}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(problem.addedDate)}
                      </span>
                      <span className="flex items-center">
                        <RotateCcw className="w-3 h-3 mr-1" />
                        복습 {problem.reviewCount}회
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 문제 상세 */}
          <div className="flex-1 overflow-y-auto">
            {selectedProblem ? (
              <div className="p-6">
                {/* 원본 텍스트 */}
                {selectedProblem.context && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2" />
                      원본 텍스트
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedProblem.context}
                    </p>
                  </div>
                )}

                {/* 문제 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">문제</h3>
                  <p className="text-gray-800">{selectedProblem.question}</p>
                </div>

                {/* 오답 히스토리 */}
                <div className="mb-6 p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-700 mb-2">내가 쓴 답</h4>
                  <p className="text-red-600">{selectedProblem.userAnswer}</p>
                </div>

                {/* 정답 확인 */}
                {showAnswer && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg animate-fade-in">
                    <h4 className="font-medium text-green-700 mb-2">정답</h4>
                    <p className="text-green-600">{selectedProblem.correctAnswer}</p>
                    {selectedProblem.explanation && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <h4 className="font-medium text-green-700 mb-1">해설</h4>
                        <p className="text-gray-700">{selectedProblem.explanation}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 다시 풀기 */}
                {!selectedProblem.solved && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">다시 풀어보기</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={retryAnswer}
                        onChange={(e) => setRetryAnswer(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleRetrySubmit()}
                        placeholder="답을 입력하세요"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        disabled={retryResult !== null}
                      />
                      <button
                        onClick={handleRetrySubmit}
                        disabled={!retryAnswer.trim() || retryResult !== null}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                      >
                        제출
                      </button>
                    </div>

                    {retryResult !== null && (
                      <div className={`mt-3 p-3 rounded-lg ${
                        retryResult ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {retryResult ? '정답입니다! 🎉' : '아쉽네요. 다시 한번 생각해보세요.'}
                      </div>
                    )}
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  {!showAnswer && (
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      정답 확인
                    </button>
                  )}
                  
                  {onSelectProblem && (
                    <button
                      onClick={() => onSelectProblem(selectedProblem)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      유사 문제 풀기
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(selectedProblem.id)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>문제를 선택하여 상세 내용을 확인하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}