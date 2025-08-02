import React, { memo, useMemo } from 'react'

/**
 * 텍스트 표시 컴포넌트 (메모이제이션)
 * @param {string} text - 표시할 텍스트
 * @param {string} title - 제목
 * @param {boolean} showCharCount - 글자 수 표시 여부
 * @param {string} className - 추가 CSS 클래스
 */
const TextDisplay = memo(function TextDisplay({ 
  text = '', 
  title = '읽기 지문', 
  showCharCount = true,
  className = ''
}) {
  // 글자 수 계산 (메모이제이션)
  const charCount = useMemo(() => text.length, [text])
  
  // 문장 수 계산 (메모이제이션)
  const sentenceCount = useMemo(() => {
    const sentences = text.split(/[.!?]/).filter(s => s.trim())
    return sentences.length
  }, [text])

  return (
    <div className={`mb-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-lg leading-relaxed whitespace-pre-wrap">
          {text}
        </p>
      </div>
      {showCharCount && (
        <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
          <span>글자 수: {charCount}자</span>
          <span>문장 수: {sentenceCount}개</span>
        </div>
      )}
    </div>
  )
})

export default TextDisplay