import React, { useState, useCallback } from 'react'
import { 
  BookOpen, 
  Sparkles, 
  FileText, 
  Upload, 
  Download,
  ArrowRight,
  RefreshCw,
  Globe,
  BarChart3,
  BookMarked,
  Brain,
  AlertCircle,
  User,
  Trophy
} from 'lucide-react'
import aiService from '../services/aiService'
import { config } from '../config'
import { TOPIC_CATEGORIES, GRADE_OPTIONS, LENGTH_OPTIONS } from '../utils/constants'
import { validateFile } from '../utils/validation'
import { useApiCall, useParallelApiCalls } from '../hooks/useApiCall'
import { useTextAnalysis } from '../hooks/useTextAnalysis'
import { generatePDF } from '../utils/pdfGenerator'
import { getAvailableProviders } from '../config/apiKeys'
import ErrorMessage from '../components/common/ErrorMessage'
import AnalysisChart from '../components/literacy/AnalysisChart'
import ProblemCard from '../components/literacy/ProblemCard'
import TextDisplay from '../components/literacy/TextDisplay'
import VocabularyExtractor from '../components/literacy/VocabularyExtractor'
import ProblemGenerator from '../components/literacy/ProblemGenerator'
import LearningStats from '../components/stats/LearningStats'
import VocabularyReview from '../components/vocabulary/VocabularyReview'
import BookmarkManager from '../components/bookmarks/BookmarkManager'
import WrongAnswerNote from '../components/wronganswers/WrongAnswerNote'
import UserProfile from '../components/profile/UserProfile'
import GameDashboard from '../components/gamification/GameDashboard'
import WonbyteMode from '../components/literacy/WonbyteMode'

export default function ReadingTrainerPage() {
  const [mode, setMode] = useState('generate') // 'generate' or 'input'
  const [step, setStep] = useState(1) // 1: 설정, 2: 지문, 3: 문제
  
  // 새로운 기능 모달 상태
  const [showStats, setShowStats] = useState(false)
  const [showVocabularyReview, setShowVocabularyReview] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showWrongAnswers, setShowWrongAnswers] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showGameDashboard, setShowGameDashboard] = useState(false)
  const [showWonbyteMode, setShowWonbyteMode] = useState(false)
  
  // 지문 생성 설정
  const [selectedTopic, setSelectedTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('elem4')
  const [selectedLength, setSelectedLength] = useState('800')
  const [customLength, setCustomLength] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('claude')
  
  // 사용 가능한 AI 제공자
  const availableProviders = getAvailableProviders()
  
  // 지문 관련 상태
  const [generatedText, setGeneratedText] = useState('')
  const [userText, setUserText] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)
  
  // 텍스트 분석 훅 사용
  const { analysisResult, analyzing, analyzeText } = useTextAnalysis()
  
  // 문제 관련 상태  
  const [vocabularyProblems, setVocabularyProblems] = useState([])
  const [readingProblems, setReadingProblems] = useState([])
  const [generatedProblems, setGeneratedProblems] = useState([])
  
  // 어휘 관련 상태
  const [selectedVocabulary, setSelectedVocabulary] = useState([])
  
  // 사용자 입력 관련 상태
  const [inputType, setInputType] = useState('paste')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [urlInput, setUrlInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // API 호출 훅
  const { execute: generateTextApi, loading: generatingText } = useApiCall(
    useCallback((params) => aiService.generateContent(params), [])
  )
  
  
  // AI 지문 생성
  const handleGenerateText = useCallback(async () => {
    setErrorMessage(null)
    setGeneratedText('') // 이전 텍스트 초기화
    try {
      const topic = selectedTopic === 'custom' ? customTopic : selectedTopic
      const length = selectedLength === 'custom' ? customLength : selectedLength
      
      // 학년을 나이로 변환
      const gradeInfo = GRADE_OPTIONS.find(grade => grade.value === selectedGrade)
      const targetAge = gradeInfo ? gradeInfo.age : 10
      
      const prompt = `${topic}에 대한 ${selectedGrade} 수준의 한국어 읽기 지문을 ${length}자로 작성해주세요.`
      
      const response = await generateTextApi({
        provider: selectedProvider,
        contentType: 'reading',
        prompt: topic,
        targetAge: targetAge,
        difficulty: 'intermediate',
        contentLength: parseInt(length)
      })
      
      setGeneratedText(typeof response.content === 'string' ? response.content : response.content.mainContent?.introduction || response.content)
      setStep(2)
    } catch (error) {
      console.error('지문 생성 오류:', error)
      setErrorMessage(error.message || '지문 생성에 실패했습니다')
    }
  }, [selectedTopic, customTopic, selectedGrade, selectedLength, customLength, generateTextApi])
  
  
  // 지문 분석 실행
  const handleAnalyzeText = useCallback(async () => {
    const textToAnalyze = mode === 'generate' ? generatedText : userText
    await analyzeText(textToAnalyze, selectedGrade)
  }, [mode, generatedText, userText, selectedGrade, analyzeText])
  
  // 어휘 선택 변경 핸들러
  const handleVocabularyChange = useCallback((vocabularyList) => {
    setSelectedVocabulary(vocabularyList)
  }, [])
  
  // 문제 변경 핸들러
  const handleProblemsChange = useCallback((problemsList) => {
    setGeneratedProblems(problemsList)
    // ProblemGenerator에서 생성한 문제를 타입별로 분류
    const vocabProblems = problemsList.filter(p => p.type === 'objective' && p.category === 'vocabulary')
    const readProblems = problemsList.filter(p => p.type === 'objective' && p.category !== 'vocabulary')
    setVocabularyProblems(vocabProblems)
    setReadingProblems(readProblems)
  }, [])
  
  // 지문 편집 핸들러
  const handleTextEdit = useCallback((newText) => {
    if (mode === 'generate') {
      setGeneratedText(newText)
    } else {
      setUserText(newText)
    }
  }, [mode])
  
  // 파일 업로드 처리 (메모이제이션)
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const validation = validateFile(file)
    if (!validation.isValid) {
      setErrorMessage(validation.error)
      return
    }
    
    setUploadedFile(file)
    setErrorMessage(null)
    
    // 파일 읽기 (간단한 텍스트 파일만 처리)
    if (file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUserText(e.target.result)
      }
      reader.readAsText(file)
    }
  }, [])
  
  // 사용자 입력 처리
  const handleProcessUserInput = async () => {
    setIsProcessing(true)
    try {
      let textToProcess = userText
      
      if (inputType === 'file' && uploadedFile) {
        // 파일 처리 로직
        if (uploadedFile.type !== 'text/plain') {
          alert('⚠️ 현재는 텍스트 파일(.txt)만 지원됩니다.\n\n지원 예정: DOCX, PDF 파일');
          return
        }
      } else if (inputType === 'url') {
        // URL 처리 로직 (실제로는 서버에서 처리해야 함)
        alert('🚧 URL 입력 기능은 준비 중입니다.\n\n곧 웹 페이지에서 텍스트를 자동으로 추출할 수 있습니다.');
        return
      }
      
      if (textToProcess.trim()) {
        setStep(2)
      }
    } catch (error) {
      console.error('입력 처리 오류:', error)
      alert(`⚠️ 입력 처리 중 오류가 발생했습니다.\n\n오류 내용: ${error.message}\n\n다시 시도해주세요.`);
    } finally {
      setIsProcessing(false)
    }
  }
  
  
  // PDF 다운로드 처리
  const handlePDFDownload = useCallback(async () => {
    try {
      const textToExport = mode === 'generate' ? generatedText : userText
      const gradeLabel = GRADE_OPTIONS.find(g => g.value === selectedGrade)?.label || selectedGrade
      
      // 백엔드 PDF 생성 API 호출
      const response = await fetch(`${config.apiUrl}/api/pdf/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '원바이트 PRO 문해력 훈련',
          grade: gradeLabel,
          text: textToExport,
          analysisResult,
          selectedVocabulary: selectedVocabulary.filter(word => word.isChecked || word.selected),
          generatedProblems
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // HTML 콘텐츠를 새 창에서 열어서 PDF로 저장할 수 있게 함
        const printWindow = window.open('', '_blank', 'width=900,height=1200,scrollbars=yes')
        printWindow.document.write(result.htmlContent)
        printWindow.document.close()
        
        // 인쇄 대화상자가 나타날 수 있도록 잠시 기다림
        setTimeout(() => {
          printWindow.focus()
        }, 500)
      } else {
        throw new Error(result.error || 'PDF 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      setErrorMessage(`PDF 생성 중 오류가 발생했습니다: ${error.message}`)
    }
  }, [mode, generatedText, userText, selectedGrade, analysisResult, selectedVocabulary, generatedProblems])
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">원바이트 PRO</h1>
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                문해력 훈련
              </span>
            </div>
            
            {/* 새로운 기능 버튼들 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStats(true)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="학습 통계"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowVocabularyReview(true)}
                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="어휘 복습"
              >
                <Brain className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowBookmarks(true)}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                title="북마크"
              >
                <BookMarked className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowWrongAnswers(true)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="오답노트"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowGameDashboard(true)}
                className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                title="게임"
              >
                <Trophy className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowProfile(true)}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="프로필"
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 에러 메시지 표시 */}
        {errorMessage && (
          <ErrorMessage 
            type="error"
            title="오류"
            message={errorMessage}
            onClose={() => setErrorMessage(null)}
          />
        )}
        
        {/* 진행 단계 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">지문 준비</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">지문 분석</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">문제 풀이</span>
            </div>
          </div>
        </div>

        {/* Step 1: 지문 준비 */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">지문 준비하기</h2>
            
            {/* 모드 선택 */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setMode('generate')}
                className={`p-6 border-2 rounded-lg transition-all ${
                  mode === 'generate' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold mb-1">AI 지문 생성</h3>
                <p className="text-sm text-gray-600">관심 주제로 AI가 지문 생성</p>
              </button>
              
              <button
                onClick={() => setMode('input')}
                className={`p-6 border-2 rounded-lg transition-all ${
                  mode === 'input' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold mb-1">직접 입력</h3>
                <p className="text-sm text-gray-600">준비된 지문을 직접 입력</p>
              </button>
            </div>

            {/* AI 생성 모드 */}
            {mode === 'generate' && (
              <div className="space-y-6">
                {/* 주제 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주제 선택
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {TOPIC_CATEGORIES.map(topic => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic.id)}
                        className={`p-3 border rounded-lg text-sm transition-all ${
                          selectedTopic === topic.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {topic.label}
                      </button>
                    ))}
                  </div>
                  {selectedTopic === 'custom' && (
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="관심 주제를 입력하세요"
                      className="mt-3 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* 학년 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    학년 선택
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {GRADE_OPTIONS.map(grade => (
                      <option key={grade.value} value={grade.value}>
                        {grade.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AI 제공자 선택 */}
                {availableProviders.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI 모델 선택
                    </label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {availableProviders.map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 지문 길이 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지문 길이
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {LENGTH_OPTIONS.map(length => (
                      <button
                        key={length.value}
                        onClick={() => setSelectedLength(length.value)}
                        className={`p-2 border rounded-lg text-sm transition-all ${
                          selectedLength === length.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {length.label}
                      </button>
                    ))}
                  </div>
                  {selectedLength === 'custom' && (
                    <input
                      type="number"
                      value={customLength}
                      onChange={(e) => setCustomLength(e.target.value)}
                      placeholder="글자 수 입력 (200-2000)"
                      min="200"
                      max="2000"
                      className="mt-3 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* API 키 설정 안내 */}
                {availableProviders.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-2">
                      <strong>AI API 키가 설정되지 않았습니다.</strong>
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      AI 기능을 사용하려면 다음 중 하나의 API 키가 필요합니다:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• OpenAI API 키: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://platform.openai.com/api-keys</a></li>
                      <li>• Anthropic Claude API 키: <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://console.anthropic.com/</a></li>
                    </ul>
                    <p className="text-sm text-gray-600 mt-2">
                      Netlify 환경 변수에 VITE_OPENAI_API_KEY 또는 VITE_ANTHROPIC_API_KEY를 추가해주세요.
                    </p>
                  </div>
                )}

                {/* 생성 버튼 */}
                <button
                  onClick={handleGenerateText}
                  disabled={!selectedTopic || generatingText || availableProviders.length === 0}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {generatingText ? (
                    <span className="flex items-center justify-center">
                      <RefreshCw className="animate-spin mr-2" />
                      지문 생성 중...
                    </span>
                  ) : (
                    '지문 생성하기'
                  )}
                </button>
              </div>
            )}

            {/* 직접 입력 모드 */}
            {mode === 'input' && (
              <div className="space-y-6">
                {/* 입력 방식 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    입력 방식 선택
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setInputType('paste')}
                      className={`p-3 border rounded-lg text-sm transition-all ${
                        inputType === 'paste'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <FileText className="w-5 h-5 mx-auto mb-1" />
                      텍스트 붙여넣기
                    </button>
                    <button
                      onClick={() => setInputType('file')}
                      className={`p-3 border rounded-lg text-sm transition-all ${
                        inputType === 'file'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Upload className="w-5 h-5 mx-auto mb-1" />
                      파일 업로드
                    </button>
                    <button
                      onClick={() => setInputType('url')}
                      className={`p-3 border rounded-lg text-sm transition-all ${
                        inputType === 'url'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Globe className="w-5 h-5 mx-auto mb-1" />
                      URL 입력
                    </button>
                  </div>
                </div>

                {/* 텍스트 붙여넣기 */}
                {inputType === 'paste' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      지문 입력
                    </label>
                    <textarea
                      value={userText}
                      onChange={(e) => setUserText(e.target.value)}
                      placeholder="학습할 지문을 입력하거나 붙여넣으세요..."
                      className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="mt-2 text-sm text-gray-600">
                      글자 수: {userText.length}자
                    </div>
                  </div>
                )}

                {/* 파일 업로드 */}
                {inputType === 'file' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      파일 선택
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>파일 선택</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept=".txt,.docx,.pdf"
                              onChange={handleFileUpload}
                            />
                          </label>
                          <p className="pl-1">또는 드래그 앤 드롭</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          TXT, DOCX, PDF 파일 지원
                        </p>
                      </div>
                    </div>
                    {uploadedFile && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium">선택된 파일: {uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">크기: {(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    )}
                  </div>
                )}

                {/* URL 입력 */}
                {inputType === 'url' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      웹 문서 URL
                    </label>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/article"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      웹 페이지의 텍스트를 자동으로 추출합니다
                    </p>
                  </div>
                )}

                {/* 학년 선택 (사용자 입력 모드에서도 필요) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    대상 학년
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {GRADE_OPTIONS.map(grade => (
                      <option key={grade.value} value={grade.value}>
                        {grade.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleProcessUserInput}
                  disabled={
                    (inputType === 'paste' && !userText.trim()) ||
                    (inputType === 'file' && !uploadedFile) ||
                    (inputType === 'url' && !urlInput.trim())
                  }
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <RefreshCw className="animate-spin mr-2" />
                      처리 중...
                    </span>
                  ) : (
                    '지문 분석하기'
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: 지문 분석 */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">지문 분석</h2>
            
            {/* 지문 표시 */}
            <TextDisplay 
              text={mode === 'generate' ? generatedText : userText}
              title="읽기 지문"
              showCharCount={true}
              editable={true}
              onTextChange={handleTextEdit}
              gradeLevel={selectedGrade}
            />

            {/* 원바이트 모드 버튼 */}
            <div className="mb-6 flex gap-4">
              <button
                onClick={() => setShowWonbyteMode(true)}
                className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                원바이트 모드
              </button>
            </div>

            {/* 문해력 분석 */}
            <div className="mb-6">
              <button
                onClick={handleAnalyzeText}
                disabled={analyzing}
                className="mb-4 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {analyzing ? (
                  <span className="flex items-center">
                    <RefreshCw className="animate-spin mr-2" />
                    분석 중...
                  </span>
                ) : (
                  '문해력 난이도 분석'
                )}
              </button>

              {analysisResult && <AnalysisChart analysisResult={analysisResult} />}
            </div>

            {/* 핵심 어휘 추출 */}
            <div className="mb-6">
              <VocabularyExtractor
                text={mode === 'generate' ? generatedText : userText}
                gradeLevel={selectedGrade}
                onVocabularyChange={handleVocabularyChange}
              />
            </div>

            {/* 문해력 문제 생성 */}
            <div className="mb-6">
              <ProblemGenerator
                text={mode === 'generate' ? generatedText : userText}
                gradeLevel={selectedGrade}
                onProblemsChange={handleProblemsChange}
              />
            </div>

            {/* 다음 단계 버튼 */}
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setStep(1)
                  setGeneratedProblems([])
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                이전 단계
              </button>
              <button
                onClick={() => {
                  if (generatedProblems.length > 0) {
                    setStep(3)
                  } else {
                    alert('먼저 문제를 생성해주세요.')
                  }
                }}
                disabled={generatedProblems.length === 0}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                문제 풀기 시작
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 문제 풀이 */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">문해력 훈련 문제</h2>
            
            {/* 생성된 문제 표시 */}
            <div className="space-y-4">
              {generatedProblems.map((problem, index) => (
                <ProblemCard 
                  key={problem.id || `problem_${index}`}
                  problem={problem}
                  index={index}
                  type={problem.category === 'vocabulary' ? 'vocab' : 'reading'}
                  context={mode === 'generate' ? generatedText : userText}
                />
              ))}
            </div>
            
            {generatedProblems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                문제가 아직 생성되지 않았습니다.
              </div>
            )}

            {/* PDF 다운로드 버튼 */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                이전 단계
              </button>
              <button
                onClick={handlePDFDownload}
                className="flex items-center px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="mr-2" />
                PDF로 다운로드
              </button>
            </div>
          </div>
        )}
      </main>
      
      {/* 학습 통계 */}
      {showStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">학습 통계</h2>
              <button
                onClick={() => setShowStats(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            <LearningStats />
          </div>
        </div>
      )}
      
      {/* 어휘 복습 */}
      {showVocabularyReview && (
        <VocabularyReview onClose={() => setShowVocabularyReview(false)} />
      )}
      
      {/* 북마크 관리 */}
      {showBookmarks && (
        <BookmarkManager 
          onClose={() => setShowBookmarks(false)}
          onSelectBookmark={(bookmark) => {
            // 북마크된 텍스트를 로드
            setUserText(bookmark.content)
            setSelectedGrade(bookmark.gradeLevel)
            setMode('input')
            setStep(2)
            setShowBookmarks(false)
          }}
        />
      )}
      
      {/* 오답노트 */}
      {showWrongAnswers && (
        <WrongAnswerNote 
          onClose={() => setShowWrongAnswers(false)}
          onSelectProblem={(problem) => {
            // 선택한 문제와 관련된 액션
            setShowWrongAnswers(false)
          }}
        />
      )}
      
      {/* 사용자 프로필 */}
      {showProfile && (
        <UserProfile 
          onClose={() => setShowProfile(false)}
          onProfileUpdate={(profile) => {
            // 프로필 업데이트 시 학년 설정 반영
            if (profile.gradeLevel) {
              setSelectedGrade(profile.gradeLevel)
            }
          }}
        />
      )}
      
      {/* 게임 대시보드 */}
      {showGameDashboard && (
        <GameDashboard onClose={() => setShowGameDashboard(false)} />
      )}
      
      {/* 원바이트 모드 */}
      {showWonbyteMode && (
        <WonbyteMode 
          text={mode === 'generate' ? generatedText : userText}
          onClose={() => setShowWonbyteMode(false)}
          onComplete={(charsRead) => {
            console.log(`완료! ${charsRead}자 읽음`)
            setShowWonbyteMode(false)
          }}
        />
      )}
    </div>
  )
}