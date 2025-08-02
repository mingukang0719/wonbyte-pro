import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Edit3, Save, X, RotateCcw } from 'lucide-react'

/**
 * 편집 가능한 텍스트 컴포넌트
 * - 인라인 편집 기능
 * - 저장/취소 기능
 * - 다양한 입력 타입 지원 (text, textarea, select)
 * - 검증 기능
 */
export default function EditableText({
  value,
  onSave,
  onCancel,
  placeholder = '텍스트를 입력하세요...',
  type = 'text', // 'text', 'textarea', 'select'
  options = [], // select 타입일 때 사용
  className = '',
  editClassName = '',
  displayClassName = '',
  disabled = false,
  maxLength,
  rows = 3,
  autoFocus = true,
  validator,
  formatDisplay,
  renderDisplay,
  editable = true,
  children
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const [validationError, setValidationError] = useState('')
  const inputRef = useRef(null)

  // 편집 시작
  const startEditing = useCallback(() => {
    if (disabled || !editable) return
    setIsEditing(true)
    setEditValue(value || '')
    setValidationError('')
  }, [disabled, editable, value])

  // 편집 저장
  const saveEditing = useCallback(() => {
    // 검증 실행
    if (validator) {
      const error = validator(editValue)
      if (error) {
        setValidationError(error)
        return
      }
    }

    // 값이 변경된 경우만 저장
    if (editValue !== value) {
      onSave?.(editValue)
    }
    
    setIsEditing(false)
    setValidationError('')
  }, [editValue, value, validator, onSave])

  // 편집 취소
  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setEditValue(value || '')
    setValidationError('')
    onCancel?.()
  }, [value, onCancel])

  // Enter 키 처리
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault()
      saveEditing()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditing()
    }
  }, [type, saveEditing, cancelEditing])

  // 편집 모드일 때 자동 포커스
  useEffect(() => {
    if (isEditing && autoFocus && inputRef.current) {
      inputRef.current.focus()
      if (type === 'text' || type === 'textarea') {
        inputRef.current.select()
      }
    }
  }, [isEditing, autoFocus, type])

  // 표시 값 포맷팅
  const displayValue = formatDisplay ? formatDisplay(value) : value

  if (isEditing) {
    return (
      <div className={`inline-block w-full ${className}`}>
        <div className="flex items-start space-x-2">
          <div className="flex-1">
            {type === 'textarea' ? (
              <textarea
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                maxLength={maxLength}
                rows={rows}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${editClassName}`}
              />
            ) : type === 'select' ? (
              <select
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${editClassName}`}
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                maxLength={maxLength}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${editClassName}`}
              />
            )}
            
            {/* 검증 오류 메시지 */}
            {validationError && (
              <p className="mt-1 text-sm text-red-600">{validationError}</p>
            )}
            
            {/* 글자 수 표시 */}
            {maxLength && (
              <p className="mt-1 text-xs text-gray-500 text-right">
                {editValue.length}/{maxLength}
              </p>
            )}
          </div>

          {/* 편집 버튼들 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={saveEditing}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="저장"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={cancelEditing}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="취소"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`group inline-block w-full ${className}`}>
      <div className="flex items-start justify-between">
        <div className={`flex-1 ${displayClassName}`}>
          {renderDisplay ? (
            renderDisplay(displayValue)
          ) : children ? (
            children
          ) : (
            <span className={displayValue ? '' : 'text-gray-400 italic'}>
              {displayValue || placeholder}
            </span>
          )}
        </div>

        {/* 편집 버튼 */}
        {editable && !disabled && (
          <button
            onClick={startEditing}
            className="ml-2 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-all"
            title="편집"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * 편집 가능한 리스트 아이템 컴포넌트
 */
export function EditableListItem({ 
  items = [], 
  onItemsChange, 
  placeholder = '항목을 입력하세요...', 
  maxItems = 10,
  allowEmpty = false 
}) {
  const [editingIndex, setEditingIndex] = useState(null)
  const [newItem, setNewItem] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // 아이템 수정
  const updateItem = useCallback((index, newValue) => {
    if (!newValue.trim() && !allowEmpty) {
      return
    }
    
    const updatedItems = [...items]
    updatedItems[index] = newValue.trim()
    onItemsChange?.(updatedItems)
    setEditingIndex(null)
  }, [items, onItemsChange, allowEmpty])

  // 아이템 삭제
  const removeItem = useCallback((index) => {
    const updatedItems = items.filter((_, i) => i !== index)
    onItemsChange?.(updatedItems)
  }, [items, onItemsChange])

  // 아이템 추가
  const addItem = useCallback(() => {
    if (!newItem.trim()) {
      setIsAdding(false)
      return
    }
    
    const updatedItems = [...items, newItem.trim()]
    onItemsChange?.(updatedItems)
    setNewItem('')
    setIsAdding(false)
  }, [items, newItem, onItemsChange])

  return (
    <div className="space-y-2">
      {/* 기존 아이템들 */}
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2 group">
          <div className="flex-1">
            <EditableText
              value={item}
              onSave={(value) => updateItem(index, value)}
              placeholder={placeholder}
              className="w-full"
            />
          </div>
          
          <button
            onClick={() => removeItem(index)}
            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
            title="삭제"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* 새 아이템 추가 */}
      {isAdding ? (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addItem()
              } else if (e.key === 'Escape') {
                setIsAdding(false)
                setNewItem('')
              }
            }}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={addItem}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="추가"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsAdding(false)
              setNewItem('')
            }}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="취소"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        items.length < maxItems && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-300 hover:text-blue-600 rounded-lg transition-colors"
          >
            + 항목 추가
          </button>
        )
      )}
    </div>
  )
}