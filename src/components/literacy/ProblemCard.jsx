import React, { memo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { WrongAnswerManager, LearningStatsManager, GameDataManager } from '../../utils/storage'

/**
 * 문제 카드 컴포넌트 (메모이제이션)
 * @param {object} problem - 문제 데이터
 * @param {number} index - 문제 번호
 * @param {string} type - 문제 유형 ('vocab' or 'reading')
 * @param {function} onAnswerSelect - 답변 선택 콜백
 */
const ProblemCard = memo(function ProblemCard({ problem, index, type, onAnswerSelect, context = '' }) {
  const [selectedOption, setSelectedOption] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)

  const handleOptionSelect = (optionIndex) => {
    if (showResult) return // 이미 답을 확인한 경우
    
    setSelectedOption(optionIndex)
    const correctAnswer = problem.answer !== undefined ? problem.answer : problem.correctAnswer
    const correct = optionIndex === correctAnswer
    setIsCorrect(correct)
    setShowResult(true)
    
    // 통계 업데이트
    LearningStatsManager.updateStats({
      problemsSolved: 1,
      correctAnswers: correct ? 1 : 0
    })
    
    // 게임 포인트
    if (correct) {
      GameDataManager.addPoints(10)
      GameDataManager.addExp(5)
    } else {
      // 오답노트에 추가
      WrongAnswerManager.addWrongAnswer({
        question: problem.question,
        userAnswer: problem.options[optionIndex],
        correctAnswer: problem.options[correctAnswer],
        type: type === 'vocab' ? 'multiple_choice' : 'multiple_choice',
        context: context,
        explanation: problem.explanation || ''
      })
    }
    
    if (onAnswerSelect) {
      onAnswerSelect(problem.id, optionIndex)
    }
  }

  return (
    <div className={`mb-4 p-4 border rounded-lg transition-all ${
      showResult && isCorrect ? 'border-green-500 bg-green-50' : 
      showResult && !isCorrect ? 'border-red-500 bg-red-50' : 
      'hover:shadow-md'
    }`}>
      <p className="font-medium mb-3">
        {index + 1}. {problem.question}
      </p>
      <div className="space-y-2">
        {problem.options.map((option, optIndex) => {
          const isSelected = selectedOption === optIndex
          const correctAnswer = problem.answer !== undefined ? problem.answer : problem.correctAnswer
          const isCorrectOption = optIndex === correctAnswer
          
          return (
            <label 
              key={optIndex} 
              className={`flex items-center cursor-pointer p-2 rounded transition-all ${
                showResult && isCorrectOption ? 'bg-green-100 border-2 border-green-500' :
                showResult && isSelected && !isCorrect ? 'bg-red-100 border-2 border-red-500' :
                !showResult ? 'hover:bg-gray-50' : ''
              }`}
            >
              <input
                type="radio"
                name={`${type}-${problem.id}`}
                className="mr-3 text-blue-600 focus:ring-blue-500"
                onChange={() => handleOptionSelect(optIndex)}
                checked={selectedOption === optIndex}
                disabled={showResult}
              />
              <span className="text-gray-700 flex-1">
                {optIndex + 1}) {option}
              </span>
              {showResult && isCorrectOption && (
                <Check className="w-5 h-5 text-green-600 ml-2" />
              )}
              {showResult && isSelected && !isCorrect && (
                <X className="w-5 h-5 text-red-600 ml-2" />
              )}
            </label>
          )
        })}
      </div>
      
      {showResult && (
        <div className={`mt-4 p-3 rounded-lg ${
          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isCorrect ? '정답입니다! 🎉' : '아쉽네요. 다시 한번 도전해보세요!'}
        </div>
      )}
    </div>
  )
})

export default ProblemCard