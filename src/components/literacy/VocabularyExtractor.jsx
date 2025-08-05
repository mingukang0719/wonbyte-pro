import React, { useState, useCallback } from 'react'
import { Plus, BookOpen, Check, X, Edit3, Save, RotateCcw, Sparkles, Star } from 'lucide-react'
import aiService from '../../services/aiService'
import { VocabularyManager, LearningStatsManager } from '../../utils/storage'

/**
 * 별표 난이도 표시 컴포넌트
 */
function StarRating({ difficulty }) {
  // "★★★☆☆" 형태의 문자열을 숫자로 변환
  const getStarCount = (difficultyStr) => {
    if (typeof difficultyStr === 'number') return difficultyStr
    if (typeof difficultyStr !== 'string') return 3
    const filledStars = (difficultyStr.match(/★/g) || []).length
    return Math.min(Math.max(filledStars, 1), 5)
  }

  const starCount = getStarCount(difficulty)

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= starCount
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-gray-600">({starCount}/5)</span>
    </div>
  )
}

/**
 * 한자어 표시 컴포넌트 (훈과 음 포함)
 */
function HanjaDisplay({ etymology }) {
  if (!etymology) return null

  // "觀(볼 관) + 察(살필 찰)" 형태를 파싱하여 개별 한자 표시
  const parseHanja = (etymologyStr) => {
    // 한자(훈 음) 패턴 매칭
    const hanjaPattern = /([一-龯])\(([^)]+)\)/g
    const matches = []
    let match
    
    while ((match = hanjaPattern.exec(etymologyStr)) !== null) {
      const [, hanja, reading] = match
      const parts = reading.split(' ')
      matches.push({
        hanja,
        hun: parts[0] || '', // 훈
        eum: parts[1] || ''  // 음
      })
    }
    
    return matches
  }

  const hanjaList = parseHanja(etymology)
  
  if (hanjaList.length === 0) {
    // 파싱에 실패한 경우 원본 텍스트 표시
    return (
      <span className="text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded text-sm">
        {etymology}
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {hanjaList.map((item, index) => (
        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-800 mb-1">{item.hanja}</div>
            <div className="text-xs text-gray-600">
              <div className="font-medium">{item.hun}</div>
              <div className="text-blue-600">{item.eum}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 어휘 추출 및 관리 컴포넌트
 * - AI를 통한 핵심 어휘 5개 추출
 * - 사용자 추가 어휘 기능
 * - 어휘별 상세 정보 (한자어 풀이, 예문, 유의어/반의어)
 * - 체크리스트 기능으로 학습할 어휘 선택
 * - 별표 난이도 표시
 * - 한자어 훈과 음 표기
 */
export default function VocabularyExtractor({ text, gradeLevel, onVocabularyChange }) {
  const [vocabularyList, setVocabularyList] = useState([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [newWord, setNewWord] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingData, setEditingData] = useState({})
  const [error, setError] = useState(null)

  // AI를 통한 어휘 추출
  const extractVocabulary = useCallback(async () => {
    if (!text?.trim()) {
      setError('분석할 지문이 없습니다.')
      return
    }

    setIsExtracting(true)
    setError(null)

    try {
      const response = await aiService.extractVocabulary(text, gradeLevel, 5)
      
      // Handle both old and new API response formats
      let vocabularyData = null
      if (response.success) {
        // Try new format first (content.vocabularyList)
        if (response.content?.vocabularyList) {
          vocabularyData = response.content.vocabularyList
        }
        // Fallback to old format (vocabulary directly)
        else if (response.vocabulary) {
          vocabularyData = response.vocabulary
        }
      }
      
      if (vocabularyData && vocabularyData.length > 0) {
        const extractedWords = vocabularyData.map((word, index) => ({
          id: `extracted_${Date.now()}_${index}`,
          ...word,
          isChecked: false,
          isCustom: false
        }))
        setVocabularyList(extractedWords)
        onVocabularyChange?.(extractedWords)
      } else {
        throw new Error('어휘 추출 응답이 올바르지 않습니다.')
      }
    } catch (error) {
      console.error('어휘 추출 오류:', error)
      setError('어휘 추출 중 오류가 발생했습니다: ' + error.message)
      
      // 오류 시 샘플 데이터 제공
      const sampleWords = [
        {
          id: 'sample_1',
          word: '관찰',
          meaning: '자세히 살펴보는 것',
          etymology: '觀(볼 관) + 察(살필 찰)',
          synonyms: ['구경', '살피기'],
          antonyms: ['무시', '소홀'],
          difficulty: '★★★☆☆',
          example: '과학자는 현미경으로 세포를 관찰했습니다.',
          gradeAppropriate: true,
          isChecked: false,
          isCustom: false
        },
        {
          id: 'sample_2',
          word: '발전',
          meaning: '더 나은 상태로 나아가는 것',
          etymology: '發(발할 발) + 展(펼 전)',
          synonyms: ['성장', '진보'],
          antonyms: ['퇴보', '후퇴'],
          difficulty: '★★☆☆☆',
          example: '기술의 발전으로 우리 생활이 편리해졌습니다.',
          gradeAppropriate: true,
          isChecked: false,
          isCustom: false
        }
      ]
      setVocabularyList(sampleWords)
    } finally {
      setIsExtracting(false)
    }
  }, [text, gradeLevel, onVocabularyChange])

  // 사용자 어휘 추가 및 AI 분석
  const addCustomVocabulary = useCallback(async () => {
    if (!newWord.trim()) return

    setIsGenerating(true)
    setError(null)

    try {
      // AI를 통해 어휘 분석
      const prompt = `다음 어휘에 대한 상세 정보를 제공해주세요: "${newWord}"`
      const response = await aiService.generateContent({
        contentType: 'vocabulary_extraction',
        prompt,
        gradeLevel,
        count: 1
      })

      let wordData
      if (response.success && response.content?.vocabularyList?.[0]) {
        wordData = response.content.vocabularyList[0]
      } else {
        // AI 실패 시 기본 데이터
        wordData = {
          word: newWord,
          meaning: `${newWord}의 의미를 설명합니다.`,
          etymology: '',
          synonyms: [],
          antonyms: [],
          difficulty: '★★★☆☆',
          example: `${newWord}을(를) 사용한 예문입니다.`,
          gradeAppropriate: true
        }
      }

      const customWord = {
        id: `custom_${Date.now()}`,
        ...wordData,
        isChecked: true, // 사용자 추가 어휘는 기본적으로 선택됨
        isCustom: true
      }

      const updatedList = [...vocabularyList, customWord]
      setVocabularyList(updatedList)
      onVocabularyChange?.(updatedList)
      setNewWord('')
    } catch (error) {
      console.error('어휘 생성 오류:', error)
      setError('어휘 정보 생성 중 오류가 발생했습니다: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }, [newWord, gradeLevel, vocabularyList, onVocabularyChange])

  // 어휘 체크 상태 변경
  const toggleVocabularyCheck = useCallback((id) => {
    const updatedList = vocabularyList.map(word =>
      word.id === id ? { ...word, isChecked: !word.isChecked } : word
    )
    setVocabularyList(updatedList)
    onVocabularyChange?.(updatedList)
  }, [vocabularyList, onVocabularyChange])

  // 어휘 편집 시작
  const startEditing = useCallback((word) => {
    setEditingId(word.id)
    setEditingData({ ...word })
  }, [])

  // 어휘 편집 저장
  const saveEditing = useCallback(() => {
    const updatedList = vocabularyList.map(word =>
      word.id === editingId ? { ...editingData } : word
    )
    setVocabularyList(updatedList)
    onVocabularyChange?.(updatedList)
    setEditingId(null)
    setEditingData({})
  }, [vocabularyList, editingId, editingData, onVocabularyChange])

  // 어휘 편집 취소
  const cancelEditing = useCallback(() => {
    setEditingId(null)
    setEditingData({})
  }, [])

  // 어휘 삭제
  const removeVocabulary = useCallback((id) => {
    const updatedList = vocabularyList.filter(word => word.id !== id)
    setVocabularyList(updatedList)
    onVocabularyChange?.(updatedList)
  }, [vocabularyList, onVocabularyChange])

  // 선택된 어휘 수
  const selectedCount = vocabularyList.filter(word => word.isChecked).length

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">핵심 어휘 분석</h3>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                {selectedCount}개 선택됨
              </span>
            )}
            {vocabularyList.length > 0 && (
              <button
                onClick={() => {
                  const selectedWords = vocabularyList.filter(word => word.isChecked || word.selected)
                  selectedWords.forEach(word => {
                    VocabularyManager.addVocabulary(word)
                  })
                  LearningStatsManager.updateStats({
                    vocabularyLearned: selectedWords.length
                  })
                  alert(`${selectedWords.length}개의 어휘가 저장되었습니다!`)
                }}
                className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full hover:bg-purple-700 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-1" />
                어휘 저장
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={extractVocabulary}
          disabled={isExtracting || !text?.trim()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isExtracting ? (
            <>
              <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              어휘 추출
            </>
          )}
        </button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 어휘 추가 입력 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="추가할 어휘를 입력하세요..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && addCustomVocabulary()}
          />
          <button
            onClick={addCustomVocabulary}
            disabled={!newWord.trim() || isGenerating}
            className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                추가
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          어휘를 추가하면 AI가 자동으로 의미, 자연스러운 예문, 유의어/반의어를 생성합니다.
        </p>
      </div>

      {/* 어휘 목록 */}
      <div className="space-y-4">
        {vocabularyList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>어휘 추출 버튼을 클릭하여 핵심 어휘를 분석해보세요.</p>
          </div>
        ) : (
          vocabularyList.map((word) => (
            <div
              key={word.id}
              className={`border rounded-lg p-4 transition-all ${
                word.isChecked 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* 어휘 헤더 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleVocabularyCheck(word.id)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                      word.isChecked
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {word.isChecked && <Check className="w-4 h-4" />}
                  </button>
                  
                  <div>
                    {editingId === word.id ? (
                      <input
                        type="text"
                        value={editingData.word || ''}
                        onChange={(e) => setEditingData({...editingData, word: e.target.value})}
                        className="text-lg font-semibold border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <h4 className="text-lg font-semibold text-gray-900">{word.word}</h4>
                    )}
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <StarRating difficulty={word.difficulty} />
                      {word.isCustom && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          사용자 추가
                        </span>
                      )}
                      {word.gradeAppropriate && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          학년 적합
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {editingId === word.id ? (
                    <>
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
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(word)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="편집"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {word.isCustom && (
                        <button
                          onClick={() => removeVocabulary(word.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 어휘 상세 정보 */}
              <div className="space-y-3">
                {/* 의미 */}
                <div>
                  <span className="text-sm font-medium text-gray-700">의미: </span>
                  {editingId === word.id ? (
                    <input
                      type="text"
                      value={editingData.meaning || ''}
                      onChange={(e) => setEditingData({...editingData, meaning: e.target.value})}
                      className="w-full mt-1 border border-gray-300 rounded px-2 py-1"
                    />
                  ) : (
                    <span className="text-gray-900">{word.meaning}</span>
                  )}
                </div>

                {/* 한자어 어원 */}
                {word.etymology && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 mb-2 block">한자어 풀이: </span>
                    {editingId === word.id ? (
                      <input
                        type="text"
                        value={editingData.etymology || ''}
                        onChange={(e) => setEditingData({...editingData, etymology: e.target.value})}
                        className="w-full mt-1 border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <HanjaDisplay etymology={word.etymology} />
                    )}
                  </div>
                )}

                {/* 예문 */}
                <div>
                  <span className="text-sm font-medium text-gray-700">예문: </span>
                  {editingId === word.id ? (
                    <textarea
                      value={editingData.example || ''}
                      onChange={(e) => setEditingData({...editingData, example: e.target.value})}
                      className="w-full mt-1 border border-gray-300 rounded px-2 py-1"
                      rows="2"
                    />
                  ) : (
                    <span className="text-gray-900 italic">"{word.example}"</span>
                  )}
                </div>

                {/* 유의어/반의어 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {word.synonyms && word.synonyms.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">유의어: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {word.synonyms.map((synonym, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded"
                          >
                            {synonym}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {word.antonyms && word.antonyms.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">반의어: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {word.antonyms.map((antonym, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded"
                          >
                            {antonym}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 선택된 어휘 요약 */}
      {selectedCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">
              {selectedCount}개 어휘가 학습 목록에 추가되었습니다.
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            선택된 어휘들은 PDF 생성 시 어휘 페이지에 포함됩니다.
          </p>
        </div>
      )}
    </div>
  )
}