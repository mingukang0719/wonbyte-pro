import React, { memo } from 'react'

/**
 * 문제 카드 컴포넌트 (메모이제이션)
 * @param {object} problem - 문제 데이터
 * @param {number} index - 문제 번호
 * @param {string} type - 문제 유형 ('vocab' or 'reading')
 * @param {function} onAnswerSelect - 답변 선택 콜백
 */
const ProblemCard = memo(function ProblemCard({ problem, index, type, onAnswerSelect }) {
  const handleOptionSelect = (optionIndex) => {
    if (onAnswerSelect) {
      onAnswerSelect(problem.id, optionIndex)
    }
  }

  return (
    <div className="mb-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
      <p className="font-medium mb-3">
        {index + 1}. {problem.question}
      </p>
      <div className="space-y-2">
        {problem.options.map((option, optIndex) => (
          <label 
            key={optIndex} 
            className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
          >
            <input
              type="radio"
              name={`${type}-${problem.id}`}
              className="mr-3 text-blue-600 focus:ring-blue-500"
              onChange={() => handleOptionSelect(optIndex)}
            />
            <span className="text-gray-700">
              {optIndex + 1}) {option}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
})

export default ProblemCard