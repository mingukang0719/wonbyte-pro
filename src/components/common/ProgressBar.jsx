import React from 'react'

/**
 * 프로그레스 바 컴포넌트
 * @param {number} value - 현재 값 (0-100 또는 0-max)
 * @param {number} max - 최대 값 (기본값: 100)
 * @param {string} label - 라벨 텍스트
 * @param {boolean} showValue - 값 표시 여부
 * @param {string} color - 색상 ('blue', 'green', 'yellow', 'red', 'purple')
 * @param {string} size - 크기 ('small', 'medium', 'large')
 */
export default function ProgressBar({ 
  value = 0, 
  max = 100, 
  label, 
  showValue = true,
  color = 'blue',
  size = 'medium'
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600'
  }

  const sizeClasses = {
    small: 'h-1',
    medium: 'h-2',
    large: 'h-3'
  }

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between mb-1">
          {label && (
            <span className={`font-medium text-gray-700 ${textSizeClasses[size]}`}>
              {label}
            </span>
          )}
          {showValue && (
            <span className={`text-gray-600 ${textSizeClasses[size]}`}>
              {max === 100 ? `${Math.round(percentage)}%` : `${value}/${max}`}
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}