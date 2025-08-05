import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Save, 
  Download, 
  Settings, 
  Type, 
  Image, 
  Table, 
  HelpCircle,
  Palette,
  Zap,
  Home,
  Grid,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Sparkles
} from 'lucide-react'
import TextBlock from '../components/Editor/TextBlock'

export default function EditorPage() {
  const navigate = useNavigate()
  const [zoom, setZoom] = useState(100)
  const [showGrid, setShowGrid] = useState(true)
  const [selectedTool, setSelectedTool] = useState('select')
  const [aiProvider, setAiProvider] = useState('gemini')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [contentType, setContentType] = useState('reading')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [targetAge, setTargetAge] = useState('elem1')
  const [contentLength, setContentLength] = useState('400')
  const [generatedContent, setGeneratedContent] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [selectedBlockId, setSelectedBlockId] = useState(null)
  
  // 새로운 상태 추가
  const [showVocabularyPanel, setShowVocabularyPanel] = useState(false)
  const [vocabularyData, setVocabularyData] = useState(null)
  const [selectedVocabulary, setSelectedVocabulary] = useState([])
  const [isGeneratingVocabulary, setIsGeneratingVocabulary] = useState(false)
  
  // 문제 생성 관련 상태
  const [showQuestionPanel, setShowQuestionPanel] = useState(false)
  const [questionData, setQuestionData] = useState(null)
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  
  // 페이지 관리 상태
  const [currentPage, setCurrentPage] = useState('main')
  const [pages, setPages] = useState({
    main: [],
    vocabulary: [],
    questions: [],
    answers: []
  })
  
  // 해설 생성 관련 상태
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false)
  const [answerData, setAnswerData] = useState(null)

  // A4 dimensions in pixels (96 DPI)
  const A4_WIDTH = 794
  const A4_HEIGHT = 1123

  const handleZoomIn = () => setZoom(prev => Math.min(200, prev + 10))
  const handleZoomOut = () => setZoom(prev => Math.max(50, prev - 10))
  const handleZoomFit = () => setZoom(100)

  // 블록 관리 함수들
  const generateBlockId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

  const addTextBlock = () => {
    const newBlock = {
      id: generateBlockId(),
      type: 'text',
      x: 50 + Math.random() * 100,
      y: 50 + Math.random() * 100,
      width: 200,
      height: 80,
      text: '새 텍스트 블록',
      fontSize: 16,
      fontFamily: 'Noto Sans KR',
      color: '#333333'
    }
    setBlocks(prev => [...prev, newBlock])
    setSelectedBlockId(newBlock.id)
  }

  const updateBlock = (id, updates) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ))
  }

  const deleteBlock = (id) => {
    setBlocks(prev => prev.filter(block => block.id !== id))
    if (selectedBlockId === id) {
      setSelectedBlockId(null)
    }
  }

  const selectBlock = (id) => {
    setSelectedBlockId(id)
  }

  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedBlockId(null)
    }
  }

  const handleToolClick = (toolId) => {
    setSelectedTool(toolId)
    if (toolId === 'text') {
      addTextBlock()
    }
  }

  const addGeneratedContentToPage = () => {
    if (!generatedContent) return

    let yOffset = 50
    const blockSpacing = 120

    // 제목 블록 추가
    if (generatedContent.title) {
      const titleBlock = {
        id: generateBlockId(),
        type: 'text',
        x: 50,
        y: yOffset,
        width: 500,
        height: 60,
        text: generatedContent.title,
        fontSize: 24,
        fontFamily: 'Noto Sans KR',
        color: '#1f2937'
      }
      setBlocks(prev => [...prev, titleBlock])
      yOffset += blockSpacing
    }

    // 설명 블록 추가
    if (generatedContent.description) {
      const descBlock = {
        id: generateBlockId(),
        type: 'text',
        x: 50,
        y: yOffset,
        width: 500,
        height: 80,
        text: generatedContent.description,
        fontSize: 14,
        fontFamily: 'Noto Sans KR',
        color: '#6b7280'
      }
      setBlocks(prev => [...prev, descBlock])
      yOffset += blockSpacing
    }

    // 주요 내용 블록 추가
    if (generatedContent.mainContent) {
      const { introduction, keyPoints, examples } = generatedContent.mainContent

      if (introduction) {
        const introBlock = {
          id: generateBlockId(),
          type: 'text',
          x: 50,
          y: yOffset,
          width: 500,
          height: 100,
          text: introduction,
          fontSize: 16,
          fontFamily: 'Noto Sans KR',
          color: '#374151'
        }
        setBlocks(prev => [...prev, introBlock])
        yOffset += blockSpacing
      }

      if (keyPoints && keyPoints.length > 0) {
        const keyPointsText = "주요 포인트:\n" + keyPoints.map((point, idx) => `${idx + 1}. ${point}`).join('\n')
        const keyPointsBlock = {
          id: generateBlockId(),
          type: 'text',
          x: 50,
          y: yOffset,
          width: 500,
          height: Math.max(100, keyPoints.length * 25 + 40),
          text: keyPointsText,
          fontSize: 14,
          fontFamily: 'Noto Sans KR',
          color: '#374151'
        }
        setBlocks(prev => [...prev, keyPointsBlock])
        yOffset += Math.max(blockSpacing, keyPoints.length * 25 + 60)
      }

      if (examples && examples.length > 0) {
        examples.forEach((example, idx) => {
          const exampleText = `예시 ${idx + 1}:\n${example.korean}${example.english ? `\n(${example.english})` : ''}${example.explanation ? `\n→ ${example.explanation}` : ''}`
          const exampleBlock = {
            id: generateBlockId(),
            type: 'text',
            x: 50,
            y: yOffset,
            width: 500,
            height: 100,
            text: exampleText,
            fontSize: 14,
            fontFamily: 'Noto Sans KR',
            color: '#059669'
          }
          setBlocks(prev => [...prev, exampleBlock])
          yOffset += blockSpacing
        })
      }
    }

    // AI 패널 닫기 및 선택 해제
    setGeneratedContent(null)
    setShowAiPanel(false)
    setSelectedTool('select')
  }

  // 어휘 생성 함수
  const handleGenerateVocabulary = async () => {
    if (!generatedContent?.mainContent?.introduction) {
      alert('먼저 지문을 생성해주세요.')
      return
    }

    setIsGeneratingVocabulary(true)
    try {
      const aiService = (await import('../services/aiService.js')).default
      
      const result = await aiService.generateContent({
        provider: aiProvider,
        contentType: 'vocabulary',
        difficulty,
        targetAge,
        prompt: `다음 지문에서 ${ageGuides[targetAge]}이 모를만한 어려운 어휘 3-5개를 추출하고 분석해주세요:
        
        ${generatedContent.mainContent.introduction}
        
        각 어휘에 대해:
        1. 한자어 기반으로 쉽게 풀이
        2. 유의어와 반의어 제시
        3. 난이도를 별표(★) 1-5개로 표시 (5개가 가장 어려움)
        4. 반드시 어려운 어휘만 포함`
      })
      
      setVocabularyData(result.content)
      setShowVocabularyPanel(true)
      
    } catch (error) {
      console.error('어휘 생성 실패:', error)
      alert(`어휘 생성에 실패했습니다: ${error.message}`)
    } finally {
      setIsGeneratingVocabulary(false)
    }
  }

  // 문제 생성 함수
  const handleGenerateQuestions = async () => {
    if (!generatedContent?.mainContent?.introduction) {
      alert('먼저 지문을 생성해주세요.')
      return
    }

    setIsGeneratingQuestions(true)
    try {
      const aiService = (await import('../services/aiService.js')).default
      
      const result = await aiService.generateContent({
        provider: aiProvider,
        contentType: 'questions',
        difficulty,
        targetAge,
        prompt: `다음 지문을 바탕으로 ${ageGuides[targetAge]} 수준의 서술형 문제 6문제를 만들어주세요:
        
        ${generatedContent.mainContent.introduction}
        
        문제 유형:
        - 맥락 추론형 3문제
        - 내용 이해형 3문제
        
        각 문제는 해당 학년 수준에 맞는 난이도로 작성해주세요.`
      })
      
      setQuestionData(result.content)
      setShowQuestionPanel(true)
      
    } catch (error) {
      console.error('문제 생성 실패:', error)
      alert(`문제 생성에 실패했습니다: ${error.message}`)
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  // 연령 가이드 매핑
  const ageGuides = {
    elem1: '초등학교 1학년',
    elem2: '초등학교 2학년', 
    elem3: '초등학교 3학년',
    elem4: '초등학교 4학년',
    elem5: '초등학교 5학년',
    elem6: '초등학교 6학년',
    middle1: '중학교 1학년',
    middle2: '중학교 2학년',
    middle3: '중학교 3학년',
    high1: '고등학교 1학년',
    high2: '고등학교 2학년',
    high3: '고등학교 3학년'
  }

  // 해설 생성 함수
  const handleGenerateAnswers = async () => {
    if (!questionData?.questions || selectedQuestions.length === 0) {
      alert('먼저 문제를 선택해주세요.')
      return
    }

    setIsGeneratingAnswers(true)
    try {
      const aiService = (await import('../services/aiService.js')).default
      
      const selectedQuestionsList = selectedQuestions.map(index => questionData.questions[index])
      
      const result = await aiService.generateContent({
        provider: aiProvider,
        contentType: 'answers',
        difficulty,
        targetAge,
        prompt: `다음 문제들에 대한 상세한 해설을 작성해주세요. ${ageGuides[targetAge]} 수준에 맞게 설명해주세요:
        
        ${selectedQuestionsList.map((q, idx) => `
        문제 ${idx + 1}: ${q.question}
        유형: ${q.type}
        `).join('\n')}
        
        각 문제에 대해:
        1. 정답 또는 예시 답안
        2. 해설 (왜 그런 답이 나오는지 단계별 설명)
        3. 채점 기준
        4. 유사 문제 해결 팁`
      })
      
      setAnswerData(result.content)
      
    } catch (error) {
      console.error('해설 생성 실패:', error)
      alert(`해설 생성에 실패했습니다: ${error.message}`)
    } finally {
      setIsGeneratingAnswers(false)
    }
  }

  // 페이지 전환 함수
  const switchPage = (pageType) => {
    // 현재 페이지의 블록들을 저장
    setPages(prev => ({
      ...prev,
      [currentPage]: blocks
    }))
    
    // 새 페이지로 전환
    setCurrentPage(pageType)
    setBlocks(pages[pageType] || [])
    setSelectedBlockId(null)
  }

  const handleGenerateContent = async () => {
    if (!aiPrompt.trim()) return
    
    setIsGenerating(true)
    try {
      // AI 서비스 import
      const aiService = (await import('../services/aiService.js')).default
      
      const result = await aiService.generateContent({
        provider: aiProvider,
        contentType,
        difficulty,
        targetAge,
        contentLength,
        prompt: aiPrompt
      })
      
      setGeneratedContent(result.content)
      // Content generated successfully
      
      // 성공 후 UI 업데이트
      setAiPrompt('')
      // AI 패널은 열어두어서 결과를 볼 수 있게 함
      
    } catch (error) {
      console.error('AI 생성 실패:', error)
      alert(`AI 생성에 실패했습니다: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      // 현재 페이지의 블록들을 pages에 저장
      const allPages = {
        ...pages,
        [currentPage]: blocks
      }
      
      // 내용이 있는 페이지들만 필터링
      const pagesWithContent = Object.entries(allPages)
        .filter(([_, pageBlocks]) => pageBlocks.length > 0)
        .map(([pageType, pageBlocks]) => ({
          title: pageType === 'main' ? '지문' : pageType === 'vocabulary' ? '어휘' : pageType === 'questions' ? '문제' : '해설',
          blocks: pageBlocks
        }))
      
      if (pagesWithContent.length === 0) {
        alert('내보낼 내용이 없습니다.')
        return
      }
      
      // 클라이언트 사이드 PDF 서비스 사용
      const PDFService = (await import('../services/pdfService.js')).default
      const pdfService = new PDFService()
      
      const success = pdfService.openPDFPreview('한국어 학습 자료', pagesWithContent)
      
      if (!success) {
        throw new Error('PDF 생성에 실패했습니다')
      }
      
    } catch (error) {
      console.error('PDF 내보내기 실패:', error)
      alert(`PDF 내보내기에 실패했습니다: ${error.message}`)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Toolbar */}
      <header className="bg-white border-b border-gray-300 px-4 py-2 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium">홈으로</span>
          </button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded hover:bg-gray-100 text-gray-600">
              <Save className="w-4 h-4" />
            </button>
            <button className="p-2 rounded hover:bg-gray-100 text-gray-600">
              <Undo className="w-4 h-4" />
            </button>
            <button className="p-2 rounded hover:bg-gray-100 text-gray-600">
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Section - Page Navigation */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { id: 'main', label: '지문', icon: '📄' },
              { id: 'vocabulary', label: '어휘', icon: '📚' },
              { id: 'questions', label: '문제', icon: '❓' },
              { id: 'answers', label: '해설', icon: '💡' }
            ].map((page) => (
              <button
                key={page.id}
                onClick={() => switchPage(page.id)}
                className={`
                  px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1
                  ${currentPage === page.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span>{page.icon}</span>
                <span>{page.label}</span>
                {pages[page.id]?.length > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-600 text-xs px-1 rounded">
                    {pages[page.id].length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">저장됨</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-white"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-12 text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-white"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded ${showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          
          <button 
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>PDF 내보내기</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Sidebar - Tools */}
        <div className="w-16 bg-white border-r border-gray-300 flex flex-col items-center py-4 space-y-2">
          {[
            { id: 'select', icon: '🔘', label: '선택' },
            { id: 'text', icon: <Type className="w-5 h-5" />, label: '텍스트' },
            { id: 'image', icon: <Image className="w-5 h-5" />, label: '이미지' },
            { id: 'table', icon: <Table className="w-5 h-5" />, label: '표' },
            { id: 'quiz', icon: <HelpCircle className="w-5 h-5" />, label: '퀴즈' },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`
                w-12 h-12 rounded-lg flex items-center justify-center transition-colors
                ${selectedTool === tool.id 
                  ? 'bg-blue-100 text-blue-600 border-2 border-blue-300' 
                  : 'hover:bg-gray-100 text-gray-600'
                }
              `}
              title={tool.label}
            >
              {typeof tool.icon === 'string' ? (
                <span className="text-lg">{tool.icon}</span>
              ) : (
                tool.icon
              )}
            </button>
          ))}
          
          <div className="h-px w-8 bg-gray-300 my-2" />
          
          {/* AI Tools */}
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className={`
              w-12 h-12 rounded-lg flex items-center justify-center transition-colors
              ${showAiPanel 
                ? 'bg-purple-100 text-purple-600 border-2 border-purple-300' 
                : 'hover:bg-gray-100 text-gray-600'
              }
            `}
            title="AI 생성"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 relative overflow-auto">
          {/* Canvas */}
          <div 
            className="min-h-full flex items-center justify-center p-8"
            style={{ 
              backgroundColor: '#f8f9fa',
              backgroundImage: showGrid ? 
                'radial-gradient(circle, #e9ecef 1px, transparent 1px)' : 'none',
              backgroundSize: showGrid ? '20px 20px' : 'auto'
            }}
          >
            {/* A4 Page */}
            <div
              className="bg-white shadow-lg relative overflow-hidden"
              style={{
                width: `${A4_WIDTH * (zoom / 100)}px`,
                height: `${A4_HEIGHT * (zoom / 100)}px`,
                transform: `scale(1)`,
                transformOrigin: 'center center'
              }}
              onClick={handleCanvasClick}
            >
              {/* Page Content Area */}
              <div 
                className="absolute inset-4 border border-dashed border-gray-300 rounded"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
              >
                {/* Render Blocks */}
                {blocks.map(block => {
                  if (block.type === 'text') {
                    return (
                      <TextBlock
                        key={block.id}
                        id={block.id}
                        x={block.x}
                        y={block.y}
                        width={block.width}
                        height={block.height}
                        text={block.text}
                        fontSize={block.fontSize}
                        fontFamily={block.fontFamily}
                        color={block.color}
                        isSelected={selectedBlockId === block.id}
                        onSelect={selectBlock}
                        onUpdate={updateBlock}
                        onDelete={deleteBlock}
                      />
                    )
                  }
                  return null
                })}

                {/* Welcome Message when no blocks */}
                {blocks.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Type className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">
                        빈 {currentPage === 'main' ? '지문' : currentPage === 'vocabulary' ? '어휘' : currentPage === 'questions' ? '문제' : '해설'} 페이지
                      </p>
                      <p className="text-sm">
                        {currentPage === 'main' 
                          ? '좌측 도구에서 텍스트 블록을 선택하거나 AI 도구로 지문을 생성하세요'
                          : currentPage === 'vocabulary'
                          ? '먼저 지문을 생성한 후 어휘 페이지를 생성하세요'
                          : currentPage === 'questions'
                          ? '먼저 지문을 생성한 후 문제를 생성하세요'
                          : '먼저 문제를 생성한 후 해설을 생성하세요'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Page Info */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                A4 (210mm × 297mm) - {currentPage} 페이지 - {blocks.length}개 블록
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties/AI/Vocabulary/Questions */}
        <div className="w-80 bg-white border-l border-gray-300">
          {showVocabularyPanel ? (
            /* Vocabulary Panel */
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">어휘 선택</h3>
                  <button
                    onClick={() => setShowVocabularyPanel(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600">어휘를 선택하여 페이지에 추가하세요</p>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                {vocabularyData?.vocabularyList?.map((vocab, index) => (
                  <div key={index} className="mb-4 p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{vocab.word}</h4>
                      <input
                        type="checkbox"
                        checked={selectedVocabulary.includes(index)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVocabulary([...selectedVocabulary, index])
                          } else {
                            setSelectedVocabulary(selectedVocabulary.filter(i => i !== index))
                          }
                        }}
                        className="ml-2"
                      />
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{vocab.meaning}</p>
                    <div className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">유의어:</span> {vocab.synonyms?.join(', ') || '없음'}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">반의어:</span> {vocab.antonyms?.join(', ') || '없음'}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">난이도:</span> {vocab.difficulty}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">예문:</span> {vocab.example}
                    </div>
                  </div>
                ))}

                {/* 사용자 직접 추가 */}
                <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                  <button className="w-full text-center text-gray-600 hover:text-gray-800">
                    + 사용자 직접 추가
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    // 선택된 어휘들을 페이지에 추가하는 로직
                    // Selected vocabulary will be added to page
                    setShowVocabularyPanel(false)
                  }}
                  disabled={selectedVocabulary.length === 0}
                  className="w-full bg-orange-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  선택한 어휘 페이지 추가 ({selectedVocabulary.length}개)
                </button>
              </div>
            </div>
          ) : showQuestionPanel ? (
            /* Questions Panel */
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">문제 선택</h3>
                  <button
                    onClick={() => setShowQuestionPanel(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600">문제를 선택하여 페이지에 추가하세요</p>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                {questionData?.questions?.map((question, index) => (
                  <div key={index} className="mb-4 p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded mb-2">
                          {question.type}
                        </span>
                        <p className="text-sm text-gray-900">{question.question}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(index)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQuestions([...selectedQuestions, index])
                          } else {
                            setSelectedQuestions(selectedQuestions.filter(i => i !== index))
                          }
                        }}
                        className="ml-2"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      답안 줄 수: {question.answerSpace}줄 | 배점: {question.points}점
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      // 선택된 문제들을 페이지에 추가하는 로직
                      // Selected questions will be added to page
                      setShowQuestionPanel(false)
                    }}
                    disabled={selectedQuestions.length === 0}
                    className="w-full bg-teal-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    선택한 문제 페이지 추가 ({selectedQuestions.length}개)
                  </button>
                  
                  <button
                    onClick={handleGenerateAnswers}
                    disabled={selectedQuestions.length === 0 || isGeneratingAnswers}
                    className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingAnswers ? '해설 생성 중...' : '해설 추가'}
                  </button>
                </div>
              </div>
            </div>
          ) : showAiPanel ? (
            /* AI Panel */
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">AI 콘텐츠 생성</h3>
                
                {/* AI Provider Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI 제공업체
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setAiProvider('gemini')}
                      className={`
                        flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${aiProvider === 'gemini'
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      Gemini
                    </button>
                    <button
                      onClick={() => setAiProvider('claude')}
                      className={`
                        flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${aiProvider === 'claude'
                          ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      Claude
                    </button>
                  </div>
                </div>

                {/* Content Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    콘텐츠 유형
                  </label>
                  <select 
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="reading">지문 생성</option>
                  </select>
                </div>

                {/* Difficulty Level */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    난이도
                  </label>
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="beginner">초급</option>
                    <option value="intermediate">중급</option>
                    <option value="advanced">고급</option>
                  </select>
                </div>

                {/* Target Age */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    대상 연령
                  </label>
                  <select 
                    value={targetAge}
                    onChange={(e) => setTargetAge(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="elem1">초등학교 1학년</option>
                    <option value="elem2">초등학교 2학년</option>
                    <option value="elem3">초등학교 3학년</option>
                    <option value="elem4">초등학교 4학년</option>
                    <option value="elem5">초등학교 5학년</option>
                    <option value="elem6">초등학교 6학년</option>
                    <option value="middle1">중학교 1학년</option>
                    <option value="middle2">중학교 2학년</option>
                    <option value="middle3">중학교 3학년</option>
                    <option value="high1">고등학교 1학년</option>
                    <option value="high2">고등학교 2학년</option>
                    <option value="high3">고등학교 3학년</option>
                  </select>
                </div>

                {/* Content Length */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    글의 길이
                  </label>
                  <select 
                    value={contentLength}
                    onChange={(e) => setContentLength(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="400">400자</option>
                    <option value="800">800자</option>
                    <option value="1200">1200자</option>
                  </select>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="flex-1 p-4 flex flex-col">
                {!generatedContent ? (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      생성할 내용 설명
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="예: 한국어 인사말에 대한 학습 자료를 만들어주세요. 존댓말과 반말의 차이를 포함해서..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    <button
                      onClick={handleGenerateContent}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className={`
                        mt-4 w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2
                        ${isGenerating || !aiPrompt.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : aiProvider === 'gemini'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }
                      `}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>생성 중...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>{aiProvider === 'gemini' ? 'Gemini로' : 'Claude로'} 생성</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  /* Generated Content Display */
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">생성된 콘텐츠</h4>
                      <button
                        onClick={() => setGeneratedContent(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <span className="text-sm">새로 생성</span>
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 text-sm">
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-900 mb-2">
                          {generatedContent?.title || '제목 없음'}
                        </h5>
                        <p className="text-gray-600 text-xs mb-3">
                          {generatedContent?.description}
                        </p>
                      </div>

                      {generatedContent?.mainContent && (
                        <div className="mb-4">
                          {generatedContent.mainContent.introduction && (
                            <p className="text-gray-700 mb-3">
                              {generatedContent.mainContent.introduction}
                            </p>
                          )}

                          {generatedContent.mainContent.keyPoints && (
                            <div className="mb-3">
                              <h6 className="font-medium text-gray-800 mb-2">주요 포인트:</h6>
                              <ul className="list-disc list-inside space-y-1">
                                {generatedContent.mainContent.keyPoints.map((point, idx) => (
                                  <li key={idx} className="text-gray-700">{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {generatedContent.mainContent.examples && (
                            <div className="mb-3">
                              <h6 className="font-medium text-gray-800 mb-2">예시:</h6>
                              <div className="space-y-2">
                                {generatedContent.mainContent.examples.map((example, idx) => (
                                  <div key={idx} className="bg-white p-2 rounded border">
                                    <p className="font-medium">{example.korean}</p>
                                    {example.english && <p className="text-gray-600 text-xs">{example.english}</p>}
                                    {example.explanation && <p className="text-gray-500 text-xs mt-1">{example.explanation}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {generatedContent?.exercises && generatedContent.exercises.length > 0 && (
                        <div className="mb-4">
                          <h6 className="font-medium text-gray-800 mb-2">연습 문제:</h6>
                          <div className="space-y-2">
                            {generatedContent.exercises.map((exercise, idx) => (
                              <div key={idx} className="bg-white p-2 rounded border">
                                <p className="font-medium mb-1">{exercise.question}</p>
                                {exercise.options && (
                                  <div className="text-xs space-y-1">
                                    {exercise.options.map((option, optIdx) => (
                                      <div key={optIdx} className={`
                                        ${optIdx === exercise.correctAnswer ? 'text-green-600 font-medium' : 'text-gray-600'}
                                      `}>
                                        {optIdx + 1}. {option}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {exercise.explanation && (
                                  <p className="text-gray-500 text-xs mt-1">{exercise.explanation}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex space-x-2">
                      <button 
                        onClick={addGeneratedContentToPage}
                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        페이지에 추가
                      </button>
                      <button 
                        onClick={() => setGeneratedContent(null)}
                        className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        다시 생성
                      </button>
                    </div>

                    {/* 지문 생성 후 추가 기능 버튼들 */}
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={handleGenerateVocabulary}
                        disabled={isGeneratingVocabulary}
                        className="w-full bg-orange-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingVocabulary ? '어휘 생성 중...' : '어휘 페이지 생성'}
                      </button>
                      
                      <button
                        onClick={handleGenerateQuestions}
                        disabled={isGeneratingQuestions}
                        className="w-full bg-teal-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingQuestions ? '문제 생성 중...' : '문제 페이지 생성'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Properties Panel */
            <div className="h-full p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">속성</h3>
              <div className="text-gray-500 text-center py-8">
                블록을 선택하면 속성을 편집할 수 있습니다.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <footer className="bg-white border-t border-gray-300 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>선택된 도구: {selectedTool}</span>
          <span>줌: {zoom}%</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>A4 (210 × 297mm)</span>
          <span>원바이트 Print 모드</span>
        </div>
      </footer>
    </div>
  )
}