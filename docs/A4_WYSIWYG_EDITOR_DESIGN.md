# A4 WYSIWYG 에디터 컴포넌트 설계

## 1. A4 WYSIWYG 에디터 개요

원바이트 Print 모드의 핵심 컴포넌트인 A4 WYSIWYG 에디터는 실제 A4 용지 크기(210mm × 297mm)에 맞춰 한국어 학습 자료를 시각적으로 편집할 수 있는 고성능 에디터입니다.

### 1.1 핵심 기능

- **정확한 A4 크기**: 794px × 1123px (96 DPI 기준)
- **블록 기반 시스템**: 드래그앤드롭으로 콘텐츠 배치
- **실시간 미리보기**: 편집과 동시에 결과 확인
- **다양한 블록 타입**: 텍스트, 이미지, 테이블, 퀴즈 등
- **정밀한 조작**: 픽셀 단위 위치 조정
- **인쇄 최적화**: PDF 출력과 동일한 레이아웃

### 1.2 기술 스택

- **React 18**: 함수형 컴포넌트와 훅 기반
- **React DnD**: 드래그앤드롭 기능
- **Tailwind CSS**: 스타일링
- **Zustand**: 에디터 상태 관리
- **React-Resizable**: 크기 조정 핸들
- **React-Moveable**: 위치 및 크기 조정

## 2. 에디터 아키텍처

```
A4Editor 컴포넌트 구조
├── EditorContainer (전체 레이아웃)
│   ├── EditorToolbar (도구 모음)
│   ├── EditorSidebar (블록 팔레트)
│   ├── EditorCanvas (메인 편집 영역)
│   │   ├── A4Page (A4 페이지)
│   │   │   ├── Block[] (블록 요소들)
│   │   │   └── SelectionBox (선택 영역)
│   │   ├── RulerHorizontal (가로 눈금자)
│   │   └── RulerVertical (세로 눈금자)
│   ├── PropertyPanel (속성 패널)
│   └── EditorStatusBar (상태 표시줄)
└── PreviewModal (미리보기 모달)
```

## 3. 상태 관리 시스템

### 3.1 Zustand 스토어 설계

```javascript
// src/stores/editorStore.js
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

export const useEditorStore = create()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 에디터 기본 상태
      project: null,
      isLoading: false,
      isDirty: false,
      lastSaved: null,

      // 페이지 설정
      pageSettings: {
        format: 'A4',
        orientation: 'portrait',
        width: 794,
        height: 1123,
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        showGrid: true,
        showRulers: true,
        snapToGrid: true,
        gridSize: 10
      },

      // 뷰포트 설정
      viewport: {
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        canvasWidth: 1200,
        canvasHeight: 1400
      },

      // 블록 관리
      blocks: [],
      selectedBlockIds: [],
      copiedBlocks: [],
      blockHistory: [],
      historyIndex: -1,

      // 에디터 모드
      mode: 'select', // 'select', 'text', 'image', 'draw'
      tool: null,

      // UI 상태
      ui: {
        sidebarCollapsed: false,
        propertyPanelCollapsed: false,
        toolbarVisible: true,
        previewMode: false
      },

      // Actions
      setProject: (project) => set({ project, isDirty: false }),
      
      // 블록 관리 액션들
      addBlock: (block) => {
        const newBlock = {
          id: generateId(),
          type: block.type,
          position: { x: block.x || 100, y: block.y || 100 },
          size: { width: block.width || 200, height: block.height || 100 },
          content: block.content || {},
          styles: block.styles || {},
          layer: block.layer || 0,
          locked: false,
          visible: true,
          created: Date.now(),
          updated: Date.now()
        }

        set((state) => ({
          blocks: [...state.blocks, newBlock],
          selectedBlockIds: [newBlock.id],
          isDirty: true
        }))

        get().saveToHistory()
      },

      updateBlock: (blockId, updates) => {
        set((state) => ({
          blocks: state.blocks.map(block =>
            block.id === blockId
              ? { ...block, ...updates, updated: Date.now() }
              : block
          ),
          isDirty: true
        }))

        get().saveToHistory()
      },

      deleteBlock: (blockId) => {
        set((state) => ({
          blocks: state.blocks.filter(block => block.id !== blockId),
          selectedBlockIds: state.selectedBlockIds.filter(id => id !== blockId),
          isDirty: true
        }))

        get().saveToHistory()
      },

      selectBlocks: (blockIds) => {
        set({ selectedBlockIds: Array.isArray(blockIds) ? blockIds : [blockIds] })
      },

      moveBlock: (blockId, position) => {
        get().updateBlock(blockId, { position })
      },

      resizeBlock: (blockId, size) => {
        get().updateBlock(blockId, { size })
      },

      // 히스토리 관리
      saveToHistory: () => {
        set((state) => {
          const newHistory = [
            ...state.blockHistory.slice(0, state.historyIndex + 1),
            JSON.parse(JSON.stringify(state.blocks))
          ]

          // 히스토리 크기 제한 (50개)
          if (newHistory.length > 50) {
            newHistory.shift()
          }

          return {
            blockHistory: newHistory,
            historyIndex: newHistory.length - 1
          }
        })
      },

      undo: () => {
        const state = get()
        if (state.historyIndex > 0) {
          const previousBlocks = state.blockHistory[state.historyIndex - 1]
          set({
            blocks: JSON.parse(JSON.stringify(previousBlocks)),
            historyIndex: state.historyIndex - 1,
            selectedBlockIds: [],
            isDirty: true
          })
        }
      },

      redo: () => {
        const state = get()
        if (state.historyIndex < state.blockHistory.length - 1) {
          const nextBlocks = state.blockHistory[state.historyIndex + 1]
          set({
            blocks: JSON.parse(JSON.stringify(nextBlocks)),
            historyIndex: state.historyIndex + 1,
            selectedBlockIds: [],
            isDirty: true
          })
        }
      },

      // 뷰포트 액션들
      setZoom: (zoom) => {
        set((state) => ({
          viewport: { ...state.viewport, zoom: Math.max(0.1, Math.min(3, zoom)) }
        }))
      },

      setViewportOffset: (offsetX, offsetY) => {
        set((state) => ({
          viewport: { ...state.viewport, offsetX, offsetY }
        }))
      },

      // 저장 및 로드
      saveProject: async () => {
        const state = get()
        if (!state.project?.id) return

        try {
          set({ isLoading: true })
          
          // API 호출하여 프로젝트 저장
          await projectService.saveProject(state.project.id, {
            blocks: state.blocks,
            pageSettings: state.pageSettings
          })

          set({ isDirty: false, lastSaved: Date.now() })
        } catch (error) {
          console.error('Save failed:', error)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      loadProject: async (projectId) => {
        try {
          set({ isLoading: true })
          
          const project = await projectService.getProject(projectId)
          const blocks = await projectService.getProjectBlocks(projectId)

          set({
            project,
            blocks,
            selectedBlockIds: [],
            isDirty: false,
            lastSaved: Date.now()
          })

          get().saveToHistory()
        } catch (error) {
          console.error('Load failed:', error)
          throw error
        } finally {
          set({ isLoading: false })
        }
      }
    }))
  )
)

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
```

## 4. 핵심 컴포넌트 구현

### 4.1 A4Editor 메인 컴포넌트

```javascript
// src/components/Editor/A4Editor.jsx
import React, { useEffect, useRef, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useEditorStore } from '../../stores/editorStore'
import EditorToolbar from './EditorToolbar'
import EditorSidebar from './EditorSidebar'
import EditorCanvas from './EditorCanvas'
import PropertyPanel from './PropertyPanel'
import EditorStatusBar from './EditorStatusBar'
import { useAutoSave } from '../../hooks/useAutoSave'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'

const A4Editor = ({ projectId, onSave, onExit }) => {
  const containerRef = useRef(null)
  const {
    project,
    isLoading,
    isDirty,
    loadProject,
    saveProject,
    ui
  } = useEditorStore()

  // 자동 저장 설정
  useAutoSave(saveProject, 30000) // 30초마다 자동 저장

  // 키보드 단축키 설정
  useKeyboardShortcuts({
    'ctrl+s': () => saveProject(),
    'ctrl+z': () => useEditorStore.getState().undo(),
    'ctrl+y': () => useEditorStore.getState().redo(),
    'delete': () => {
      const { selectedBlockIds, deleteBlock } = useEditorStore.getState()
      selectedBlockIds.forEach(id => deleteBlock(id))
    },
    'escape': () => useEditorStore.getState().selectBlocks([])
  })

  // 프로젝트 로드
  useEffect(() => {
    if (projectId) {
      loadProject(projectId)
    }
  }, [projectId])

  // 창 닫기 전 확인
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = '저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleSave = useCallback(async () => {
    try {
      await saveProject()
      onSave?.(project)
    } catch (error) {
      console.error('Save failed:', error)
      // 에러 토스트 표시
    }
  }, [saveProject, onSave, project])

  const handleExit = useCallback(() => {
    if (isDirty) {
      if (window.confirm('저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?')) {
        onExit?.()
      }
    } else {
      onExit?.()
    }
  }, [isDirty, onExit])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        ref={containerRef}
        className="h-screen flex flex-col bg-gray-100 overflow-hidden"
      >
        {/* 툴바 */}
        {ui.toolbarVisible && (
          <EditorToolbar 
            onSave={handleSave}
            onExit={handleExit}
            isDirty={isDirty}
          />
        )}

        {/* 메인 에디터 영역 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 사이드바 */}
          {!ui.sidebarCollapsed && (
            <EditorSidebar className="w-64 border-r border-gray-300" />
          )}

          {/* 캔버스 */}
          <div className="flex-1 relative">
            <EditorCanvas />
          </div>

          {/* 속성 패널 */}
          {!ui.propertyPanelCollapsed && (
            <PropertyPanel className="w-80 border-l border-gray-300" />
          )}
        </div>

        {/* 상태 표시줄 */}
        <EditorStatusBar />
      </div>
    </DndProvider>
  )
}

export default A4Editor
```

### 4.2 에디터 캔버스 컴포넌트

```javascript
// src/components/Editor/EditorCanvas.jsx
import React, { useRef, useCallback, useEffect } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import A4Page from './A4Page'
import RulerHorizontal from './RulerHorizontal'
import RulerVertical from './RulerVertical'
import { usePanZoom } from '../../hooks/usePanZoom'

const EditorCanvas = () => {
  const canvasRef = useRef(null)
  const {
    viewport,
    pageSettings,
    setViewportOffset,
    setZoom,
    selectBlocks
  } = useEditorStore()

  // 팬 및 줌 기능
  const { handleMouseDown, handleWheel } = usePanZoom({
    onPan: (deltaX, deltaY) => {
      setViewportOffset(
        viewport.offsetX + deltaX,
        viewport.offsetY + deltaY
      )
    },
    onZoom: (zoom, centerX, centerY) => {
      setZoom(zoom)
    }
  })

  // 캔버스 클릭 시 선택 해제
  const handleCanvasClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      selectBlocks([])
    }
  }, [selectBlocks])

  // 키보드 포커스 설정
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.focus()
    }
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 눈금자 */}
      {pageSettings.showRulers && (
        <>
          <RulerHorizontal 
            zoom={viewport.zoom}
            offset={viewport.offsetX}
            width={viewport.canvasWidth}
          />
          <RulerVertical 
            zoom={viewport.zoom}
            offset={viewport.offsetY}
            height={viewport.canvasHeight}
          />
        </>
      )}

      {/* 메인 캔버스 */}
      <div
        ref={canvasRef}
        className="absolute inset-0 focus:outline-none cursor-grab"
        style={{
          marginLeft: pageSettings.showRulers ? '30px' : '0',
          marginTop: pageSettings.showRulers ? '30px' : '0'
        }}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
      >
        {/* 캔버스 내용 */}
        <div
          className="relative origin-top-left transition-transform duration-200"
          style={{
            transform: `scale(${viewport.zoom}) translate(${viewport.offsetX}px, ${viewport.offsetY}px)`,
            width: `${viewport.canvasWidth}px`,
            height: `${viewport.canvasHeight}px`
          }}
        >
          {/* 배경 그리드 */}
          {pageSettings.showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
                `,
                backgroundSize: `${pageSettings.gridSize}px ${pageSettings.gridSize}px`
              }}
            />
          )}

          {/* A4 페이지 */}
          <A4Page />
        </div>
      </div>
    </div>
  )
}

export default EditorCanvas
```

### 4.3 A4 페이지 컴포넌트

```javascript
// src/components/Editor/A4Page.jsx
import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useEditorStore } from '../../stores/editorStore'
import Block from './Block'
import SelectionBox from './SelectionBox'

const A4Page = () => {
  const { pageSettings, blocks, selectedBlockIds } = useEditorStore()

  const { setNodeRef } = useDroppable({
    id: 'a4-page'
  })

  const pageStyle = {
    width: `${pageSettings.width}px`,
    height: `${pageSettings.height}px`,
    margin: '50px auto',
    backgroundColor: 'white',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden'
  }

  return (
    <div
      ref={setNodeRef}
      style={pageStyle}
      className="border border-gray-300"
    >
      {/* 페이지 여백 표시 */}
      <div
        className="absolute inset-0 border border-dashed border-gray-300 pointer-events-none"
        style={{
          margin: `${pageSettings.margins.top}px ${pageSettings.margins.right}px ${pageSettings.margins.bottom}px ${pageSettings.margins.left}px`
        }}
      />

      {/* 블록들 렌더링 */}
      {blocks
        .sort((a, b) => (a.layer || 0) - (b.layer || 0))
        .map((block) => (
          <Block
            key={block.id}
            block={block}
            isSelected={selectedBlockIds.includes(block.id)}
          />
        ))}

      {/* 선택 영역 표시 */}
      {selectedBlockIds.length > 0 && (
        <SelectionBox selectedBlockIds={selectedBlockIds} />
      )}
    </div>
  )
}

export default A4Page
```

### 4.4 블록 컴포넌트

```javascript
// src/components/Editor/Block.jsx
import React, { useState, useRef, useCallback } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import Moveable from 'react-moveable'
import { useEditorStore } from '../../stores/editorStore'
import TextBlock from './blocks/TextBlock'
import ImageBlock from './blocks/ImageBlock'
import TableBlock from './blocks/TableBlock'
import QuizBlock from './blocks/QuizBlock'

const Block = ({ block, isSelected }) => {
  const moveableRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const {
    selectBlocks,
    updateBlock,
    pageSettings
  } = useEditorStore()

  // 드래그 가능 설정
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform
  } = useDraggable({
    id: block.id,
    data: { type: 'block', block }
  })

  // 블록 클릭 처리
  const handleClick = useCallback((e) => {
    e.stopPropagation()
    if (!isSelected) {
      if (e.ctrlKey || e.metaKey) {
        // 다중 선택
        const { selectedBlockIds } = useEditorStore.getState()
        selectBlocks([...selectedBlockIds, block.id])
      } else {
        selectBlocks([block.id])
      }
    }
  }, [isSelected, block.id, selectBlocks])

  // Moveable 이벤트 핸들러
  const handleDrag = useCallback(({ target, transform }) => {
    target.style.transform = transform
  }, [])

  const handleDragEnd = useCallback(({ target, transform }) => {
    const matrix = new DOMMatrix(transform)
    const newPosition = {
      x: Math.max(0, Math.min(pageSettings.width - block.size.width, block.position.x + matrix.m41)),
      y: Math.max(0, Math.min(pageSettings.height - block.size.height, block.position.y + matrix.m42))
    }
    
    updateBlock(block.id, { position: newPosition })
    target.style.transform = 'none'
  }, [block.id, block.position, block.size, pageSettings, updateBlock])

  const handleResize = useCallback(({ target, width, height, drag }) => {
    target.style.width = `${width}px`
    target.style.height = `${height}px`
    
    if (drag) {
      const transform = drag.transform
      target.style.transform = transform
    }
  }, [])

  const handleResizeEnd = useCallback(({ target, width, height, drag }) => {
    const newSize = {
      width: Math.max(20, Math.min(pageSettings.width - block.position.x, width)),
      height: Math.max(20, Math.min(pageSettings.height - block.position.y, height))
    }
    
    let newPosition = block.position
    if (drag) {
      const matrix = new DOMMatrix(drag.transform)
      newPosition = {
        x: Math.max(0, Math.min(pageSettings.width - newSize.width, block.position.x + matrix.m41)),
        y: Math.max(0, Math.min(pageSettings.height - newSize.height, block.position.y + matrix.m42))
      }
    }
    
    updateBlock(block.id, {
      size: newSize,
      position: newPosition
    })
    
    target.style.transform = 'none'
    target.style.width = `${newSize.width}px`
    target.style.height = `${newSize.height}px`
  }, [block.id, block.position, pageSettings, updateBlock])

  // 블록 콘텐츠 렌더링
  const renderBlockContent = () => {
    switch (block.type) {
      case 'text':
        return <TextBlock block={block} />
      case 'image':
        return <ImageBlock block={block} />
      case 'table':
        return <TableBlock block={block} />
      case 'quiz':
        return <QuizBlock block={block} />
      default:
        return <div>Unknown block type: {block.type}</div>
    }
  }

  const blockStyle = {
    position: 'absolute',
    left: `${block.position.x}px`,
    top: `${block.position.y}px`,
    width: `${block.size.width}px`,
    height: `${block.size.height}px`,
    visibility: block.visible ? 'visible' : 'hidden',
    zIndex: block.layer || 0,
    cursor: isDragging ? 'grabbing' : 'grab',
    ...block.styles
  }

  return (
    <>
      {/* 블록 요소 */}
      <div
        ref={setDragRef}
        style={blockStyle}
        className={`
          block-element 
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
          ${block.locked ? 'cursor-not-allowed' : ''}
        `}
        onClick={handleClick}
        {...attributes}
        {...listeners}
      >
        {renderBlockContent()}
        
        {/* 블록 정보 오버레이 (개발 모드) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 pointer-events-none">
            {block.type}#{block.id.slice(-4)}
          </div>
        )}
      </div>

      {/* Moveable 컴포넌트 (선택된 블록에만) */}
      {isSelected && !block.locked && (
        <Moveable
          ref={moveableRef}
          target={`[data-block-id="${block.id}"]`}
          
          // 드래그 설정
          draggable={true}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          
          // 리사이즈 설정
          resizable={true}
          onResize={handleResize}
          onResizeEnd={handleResizeEnd}
          
          // 회전 설정
          rotatable={false}
          
          // 스케일 설정
          scalable={false}
          
          // 가이드라인
          snappable={pageSettings.snapToGrid}
          snapGridWidth={pageSettings.gridSize}
          snapGridHeight={pageSettings.gridSize}
          
          // 스타일
          bounds={{
            left: 0,
            top: 0,
            right: pageSettings.width,
            bottom: pageSettings.height
          }}
          
          // 테마
          className="moveable-control"
        />
      )}
    </>
  )
}

export default Block
```

## 5. 블록 타입별 컴포넌트

### 5.1 텍스트 블록

```javascript
// src/components/Editor/blocks/TextBlock.jsx
import React, { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../../../stores/editorStore'

const TextBlock = ({ block }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(block.content.text || '')
  const textRef = useRef(null)
  const { updateBlock } = useEditorStore()

  const handleDoubleClick = () => {
    if (!block.locked) {
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (text !== block.content.text) {
      updateBlock(block.id, {
        content: { ...block.content, text }
      })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    } else if (e.key === 'Escape') {
      setText(block.content.text || '')
      setIsEditing(false)
    }
  }

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus()
      textRef.current.select()
    }
  }, [isEditing])

  const textStyle = {
    fontSize: `${block.content.fontSize || 14}px`,
    fontFamily: block.content.fontFamily || 'Noto Sans KR',
    fontWeight: block.content.fontWeight || 'normal',
    fontStyle: block.content.fontStyle || 'normal',
    textAlign: block.content.textAlign || 'left',
    lineHeight: block.content.lineHeight || 1.6,
    color: block.content.color || '#333333',
    backgroundColor: block.content.backgroundColor || 'transparent',
    padding: `${block.content.padding || 8}px`,
    border: block.content.border || 'none',
    borderRadius: `${block.content.borderRadius || 0}px`,
    width: '100%',
    height: '100%',
    resize: 'none',
    outline: 'none',
    overflow: 'hidden'
  }

  if (isEditing) {
    return (
      <textarea
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={textStyle}
        className="block-text-editor"
        placeholder="텍스트를 입력하세요..."
      />
    )
  }

  return (
    <div
      style={textStyle}
      className="block-text-display cursor-text"
      onDoubleClick={handleDoubleClick}
    >
      {text || '텍스트를 입력하려면 더블클릭하세요'}
    </div>
  )
}

export default TextBlock
```

### 5.2 이미지 블록

```javascript
// src/components/Editor/blocks/ImageBlock.jsx
import React, { useState, useRef } from 'react'
import { useEditorStore } from '../../../stores/editorStore'

const ImageBlock = ({ block }) => {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const { updateBlock } = useEditorStore()

  const handleFileSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      return
    }

    try {
      // 파일 업로드 (실제 구현에서는 서버로 업로드)
      const reader = new FileReader()
      reader.onload = (e) => {
        updateBlock(block.id, {
          content: {
            ...block.content,
            imageUrl: e.target.result,
            filename: file.name,
            fileSize: file.size
          }
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Image upload failed:', error)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleClick = () => {
    if (!block.content.imageUrl && !block.locked) {
      fileInputRef.current?.click()
    }
  }

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: block.content.objectFit || 'cover',
    borderRadius: `${block.content.borderRadius || 0}px`,
    border: block.content.border || 'none'
  }

  const containerStyle = {
    width: '100%',
    height: '100%',
    backgroundColor: dragOver ? '#e3f2fd' : '#f5f5f5',
    border: dragOver ? '2px dashed #2196f3' : '2px dashed #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  }

  return (
    <div
      style={block.content.imageUrl ? {} : containerStyle}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className="block-image"
    >
      {block.content.imageUrl ? (
        <img
          src={block.content.imageUrl}
          alt={block.content.alt || ''}
          style={imageStyle}
          draggable={false}
        />
      ) : (
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📷</div>
          <div className="text-sm">
            {dragOver ? '이미지를 놓으세요' : '이미지를 업로드하려면 클릭하거나 드래그하세요'}
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default ImageBlock
```

## 6. 툴바 및 사이드바

### 6.1 에디터 툴바

```javascript
// src/components/Editor/EditorToolbar.jsx
import React from 'react'
import { useEditorStore } from '../../stores/editorStore'
import {
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Grid,
  Ruler,
  Eye,
  X
} from 'lucide-react'

const EditorToolbar = ({ onSave, onExit, isDirty }) => {
  const {
    viewport,
    pageSettings,
    setZoom,
    updatePageSettings,
    undo,
    redo,
    blockHistory,
    historyIndex,
    ui,
    setUI
  } = useEditorStore()

  const handleZoomIn = () => setZoom(viewport.zoom + 0.1)
  const handleZoomOut = () => setZoom(viewport.zoom - 0.1)
  const handleZoomFit = () => setZoom(1)

  const toggleGrid = () => {
    updatePageSettings({ showGrid: !pageSettings.showGrid })
  }

  const toggleRulers = () => {
    updatePageSettings({ showRulers: !pageSettings.showRulers })
  }

  const togglePreview = () => {
    setUI({ previewMode: !ui.previewMode })
  }

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < blockHistory.length - 1

  return (
    <div className="bg-white border-b border-gray-300 px-4 py-2 flex items-center justify-between">
      {/* 왼쪽 그룹 */}
      <div className="flex items-center space-x-2">
        {/* 저장 버튼 */}
        <button
          onClick={onSave}
          className={`
            px-3 py-1.5 rounded text-sm font-medium
            ${isDirty 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
          disabled={!isDirty}
        >
          <Save className="w-4 h-4 mr-1 inline" />
          저장
        </button>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-300" />

        {/* 실행취소/다시실행 */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-300" />

        {/* 줌 컨트롤 */}
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded hover:bg-gray-100"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-sm text-gray-600 min-w-12 text-center">
          {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded hover:bg-gray-100"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomFit}
          className="px-2 py-1 text-xs rounded hover:bg-gray-100"
        >
          맞춤
        </button>
      </div>

      {/* 중앙 그룹 */}
      <div className="flex items-center space-x-2">
        {/* 뷰 옵션 */}
        <button
          onClick={toggleGrid}
          className={`
            p-1.5 rounded
            ${pageSettings.showGrid 
              ? 'bg-blue-100 text-blue-600' 
              : 'hover:bg-gray-100'
            }
          `}
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          onClick={toggleRulers}
          className={`
            p-1.5 rounded
            ${pageSettings.showRulers 
              ? 'bg-blue-100 text-blue-600' 
              : 'hover:bg-gray-100'
            }
          `}
        >
          <Ruler className="w-4 h-4" />
        </button>
        <button
          onClick={togglePreview}
          className={`
            p-1.5 rounded
            ${ui.previewMode 
              ? 'bg-blue-100 text-blue-600' 
              : 'hover:bg-gray-100'
            }
          `}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* 오른쪽 그룹 */}
      <div className="flex items-center space-x-2">
        {/* 닫기 버튼 */}
        <button
          onClick={onExit}
          className="p-1.5 rounded hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default EditorToolbar
```

## 7. 훅스 및 유틸리티

### 7.1 자동 저장 훅

```javascript
// src/hooks/useAutoSave.js
import { useEffect, useRef } from 'react'
import { useEditorStore } from '../stores/editorStore'

export const useAutoSave = (saveFunction, interval = 30000) => {
  const timerRef = useRef(null)
  const { isDirty } = useEditorStore()

  useEffect(() => {
    if (isDirty) {
      timerRef.current = setTimeout(() => {
        saveFunction().catch(console.error)
      }, interval)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isDirty, saveFunction, interval])
}
```

### 7.2 키보드 단축키 훅

```javascript
// src/hooks/useKeyboardShortcuts.js
import { useEffect } from 'react'

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase()
      const modifiers = {
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        shift: e.shiftKey,
        alt: e.altKey
      }

      // 단축키 매칭
      for (const [shortcut, handler] of Object.entries(shortcuts)) {
        if (matchShortcut(shortcut, key, modifiers)) {
          e.preventDefault()
          handler(e)
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

function matchShortcut(shortcut, key, modifiers) {
  const parts = shortcut.toLowerCase().split('+')
  const expectedKey = parts.pop()
  
  if (key !== expectedKey) return false

  const expectedModifiers = {
    ctrl: parts.includes('ctrl'),
    meta: parts.includes('meta') || parts.includes('cmd'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt')
  }

  return (
    modifiers.ctrl === expectedModifiers.ctrl &&
    modifiers.meta === expectedModifiers.meta &&
    modifiers.shift === expectedModifiers.shift &&
    modifiers.alt === expectedModifiers.alt
  )
}
```

이 A4 WYSIWYG 에디터 설계는 정확한 A4 크기 지원, 직관적인 블록 기반 편집, 실시간 미리보기 등 한국어 학습 자료 제작에 최적화된 기능들을 제공합니다. React 18의 최신 기능과 현대적인 상태 관리 패턴을 활용하여 높은 성능과 사용자 경험을 보장합니다.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\uc6d0\ubc14\uc774\ud2b8 Print \ubaa8\ub4dc \uc2dc\uc2a4\ud15c \uc544\ud0a4\ud14d\ucc98 \uc124\uacc4", "status": "completed", "priority": "high", "id": "design-1"}, {"content": "Phase 1 MVP \uae30\ub2a5 \uba85\uc138 \ubc0f \ucef4\ud3ec\ub10c\ud2b8 \uc124\uacc4", "status": "completed", "priority": "high", "id": "design-2"}, {"content": "AI API \ud1b5\ud569 \uc124\uacc4 (Gemini/Claude)", "status": "completed", "priority": "high", "id": "design-3"}, {"content": "\ub370\uc774\ud130\ubca0\uc774\uc2a4 \uc2a4\ud0a4\ub9c8 \uc124\uacc4", "status": "completed", "priority": "high", "id": "design-4"}, {"content": "PDF \uc0dd\uc131 \uc2dc\uc2a4\ud15c \uc124\uacc4", "status": "completed", "priority": "high", "id": "design-5"}, {"content": "A4 WYSIWYG \uc5d0\ub514\ud130 \ucef4\ud3ec\ub10c\ud2b8 \uc124\uacc4", "status": "completed", "priority": "high", "id": "design-6"}]