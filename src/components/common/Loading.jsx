import React from 'react'
import { RefreshCw } from 'lucide-react'

/**
 * 로딩 컴포넌트
 * @param {string} message - 로딩 메시지
 * @param {string} size - 크기 ('small', 'medium', 'large')
 */
export default function Loading({ message = '로딩 중...', size = 'medium' }) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  }

  const textClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <RefreshCw 
        className={`${sizeClasses[size]} text-blue-600 animate-spin mb-4`} 
      />
      <p className={`${textClasses[size]} text-gray-600`}>
        {message}
      </p>
    </div>
  )
}