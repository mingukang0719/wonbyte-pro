import React from 'react'
import { AlertCircle, X } from 'lucide-react'

/**
 * 에러 메시지 컴포넌트
 * @param {string} title - 에러 제목
 * @param {string} message - 에러 메시지
 * @param {function} onClose - 닫기 콜백
 * @param {string} type - 에러 타입 ('error', 'warning', 'info')
 */
export default function ErrorMessage({ 
  title = '오류', 
  message, 
  onClose, 
  type = 'error' 
}) {
  const typeStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      icon: 'text-red-600',
      title: 'text-red-800',
      message: 'text-red-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      message: 'text-yellow-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-700'
    }
  }

  const styles = typeStyles[type]

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-4 mb-4`}>
      <div className="flex items-start">
        <AlertCircle className={`${styles.icon} h-5 w-5 mt-0.5 flex-shrink-0`} />
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${styles.title}`}>
            {title}
          </h3>
          {message && (
            <p className={`mt-1 text-sm ${styles.message}`}>
              {message}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 -mr-1 -mt-1 ${styles.icon} hover:opacity-70 transition-opacity`}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}