import React, { useState, useRef, useEffect } from 'react'
import { Type, Move, RotateCw, Trash2 } from 'lucide-react'

const TextBlock = ({ 
  id, 
  x = 100, 
  y = 100, 
  width = 200, 
  height = 100, 
  text = '텍스트를 입력하세요',
  fontSize = 16,
  fontFamily = 'Noto Sans KR',
  color = '#333333',
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [localText, setLocalText] = useState(text)
  const textareaRef = useRef(null)
  
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'TEXTAREA') return
    
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - x,
      y: e.clientY - y
    })
    onSelect?.(id)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    onUpdate?.(id, { x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleTextChange = (e) => {
    setLocalText(e.target.value)
  }

  const handleTextBlur = () => {
    setIsEditing(false)
    if (localText !== text) {
      onUpdate?.(id, { text: localText })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextBlur()
    } else if (e.key === 'Escape') {
      setLocalText(text)
      setIsEditing(false)
    }
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  return (
    <>
      <div
        className={`
          absolute border-2 transition-all duration-200 cursor-move bg-white
          ${isSelected 
            ? 'border-blue-500 shadow-lg' 
            : 'border-transparent hover:border-gray-300'
          }
          ${isDragging ? 'cursor-grabbing shadow-xl z-50' : 'cursor-grab'}
        `}
        style={{
          left: `${x}px`,
          top: `${y}px`,
          width: `${width}px`,
          height: `${height}px`,
          fontFamily,
          fontSize: `${fontSize}px`,
          color
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={localText}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-2 resize-none border-none outline-none bg-transparent"
            style={{ fontFamily, fontSize: `${fontSize}px`, color }}
            placeholder="텍스트를 입력하세요..."
          />
        ) : (
          <div 
            className="w-full h-full p-2 overflow-hidden"
            style={{ 
              fontFamily, 
              fontSize: `${fontSize}px`, 
              color,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {text || '텍스트를 입력하세요'}
          </div>
        )}

        {/* Selection Controls */}
        {isSelected && !isEditing && (
          <>
            {/* Resize Handles */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize" />
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize" />
            
            {/* Action Buttons */}
            <div className="absolute -top-8 right-0 flex space-x-1">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
                title="편집"
              >
                <Type className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete?.(id)}
                className="p-1 bg-red-500 text-white rounded shadow hover:bg-red-600"
                title="삭제"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Block Type Indicator */}
      {isSelected && (
        <div
          className="absolute bg-blue-500 text-white text-xs px-2 py-1 rounded shadow"
          style={{
            left: `${x}px`,
            top: `${y - 24}px`
          }}
        >
          텍스트 블록
        </div>
      )}
    </>
  )
}

export default TextBlock