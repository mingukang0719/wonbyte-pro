import React, { memo, useMemo } from 'react'
import { Bookmark } from 'lucide-react'
import EditableText from '../common/EditableText'
import { BookmarkManager } from '../../utils/storage'

/**
 * 텍스트 표시 컴포넌트 (메모이제이션 + 편집 기능)
 * @param {string} text - 표시할 텍스트
 * @param {string} title - 제목
 * @param {boolean} showCharCount - 글자 수 표시 여부
 * @param {string} className - 추가 CSS 클래스
 * @param {boolean} editable - 편집 가능 여부
 * @param {function} onTextChange - 텍스트 변경 핸들러
 */
const TextDisplay = memo(function TextDisplay({ 
  text = '', 
  title = '읽기 지문', 
  showCharCount = true,
  className = '',
  editable = false,
  onTextChange,
  gradeLevel = 'elem4'
}) {
  // 글자 수 계산 (메모이제이션)
  const charCount = useMemo(() => text.length, [text])
  
  // 문장 수 계산 (메모이제이션)
  const sentenceCount = useMemo(() => {
    const sentences = text.split(/[.!?]/).filter(s => s.trim())
    return sentences.length
  }, [text])

  const handleBookmark = () => {
    BookmarkManager.addBookmark({
      content: text,
      gradeLevel: gradeLevel,
      title: title
    })
    alert('북마크에 저장되었습니다!')
  }

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        {text && text.length > 100 && (
          <button
            onClick={handleBookmark}
            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="북마크에 저장"
          >
            <Bookmark className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="bg-gray-50 rounded-lg">
        {editable ? (
          <EditableText
            value={text}
            onSave={onTextChange}
            type="textarea"
            rows={10}
            placeholder="지문을 입력하세요..."
            className="w-full"
            editClassName="text-lg leading-relaxed"
            displayClassName="p-4"
            renderDisplay={(displayValue) => (
              <p className="text-lg leading-relaxed whitespace-pre-wrap p-4">
                {displayValue}
              </p>
            )}
          />
        ) : (
          <p className="text-lg leading-relaxed whitespace-pre-wrap p-4">
            {text}
          </p>
        )}
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