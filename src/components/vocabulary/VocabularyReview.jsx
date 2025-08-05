import React, { useState, useEffect } from 'react'
import { RotateCcw, Check, X, Star, BookOpen, Shuffle, ChevronLeft, ChevronRight } from 'lucide-react'
import { VocabularyManager, LearningStatsManager, GameDataManager } from '../../utils/storage'

export default function VocabularyReview({ onClose }) {
  const [vocabulary, setVocabulary] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)
  const [reviewMode, setReviewMode] = useState('flashcard') // flashcard, quiz
  const [quizOptions, setQuizOptions] = useState([])
  const [selectedOption, setSelectedOption] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [stats, setStats] = useState({ reviewed: 0, correct: 0 })

  useEffect(() => {
    loadVocabulary()
  }, [])

  const loadVocabulary = () => {
    const unmasteredWords = VocabularyManager.getUnmasteredVocabulary()
    setVocabulary(shuffleArray(unmasteredWords))
  }

  const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const generateQuizOptions = (correctWord) => {
    const allWords = VocabularyManager.getVocabulary()
    const otherWords = allWords.filter(w => w.word !== correctWord.word)
    const wrongOptions = shuffleArray(otherWords).slice(0, 3).map(w => w.meaning)
    const options = shuffleArray([correctWord.meaning, ...wrongOptions])
    setQuizOptions(options)
  }

  const handleNext = () => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowMeaning(false)
      setSelectedOption(null)
      setIsCorrect(null)
      if (reviewMode === 'quiz' && vocabulary[currentIndex + 1]) {
        generateQuizOptions(vocabulary[currentIndex + 1])
      }
    } else {
      // 복습 완료
      completeReview()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowMeaning(false)
      setSelectedOption(null)
      setIsCorrect(null)
      if (reviewMode === 'quiz' && vocabulary[currentIndex - 1]) {
        generateQuizOptions(vocabulary[currentIndex - 1])
      }
    }
  }

  const handleFlashcardClick = () => {
    if (!showMeaning) {
      setShowMeaning(true)
      const word = vocabulary[currentIndex]
      VocabularyManager.updateVocabulary(word.id, {
        reviewCount: word.reviewCount + 1,
        lastReviewDate: new Date().toISOString()
      })
      setStats({ ...stats, reviewed: stats.reviewed + 1 })
    }
  }

  const handleQuizAnswer = (option) => {
    if (selectedOption !== null) return

    setSelectedOption(option)
    const word = vocabulary[currentIndex]
    const correct = option === word.meaning

    setIsCorrect(correct)
    
    VocabularyManager.updateVocabulary(word.id, {
      reviewCount: word.reviewCount + 1,
      correctCount: word.correctCount + (correct ? 1 : 0),
      lastReviewDate: new Date().toISOString(),
      mastered: word.correctCount + (correct ? 1 : 0) >= 3
    })

    setStats({
      reviewed: stats.reviewed + 1,
      correct: stats.correct + (correct ? 1 : 0)
    })

    // 게임 포인트 추가
    if (correct) {
      GameDataManager.addPoints(5)
      GameDataManager.addExp(10)
    }
  }

  const handleMasterToggle = () => {
    const word = vocabulary[currentIndex]
    VocabularyManager.updateVocabulary(word.id, {
      mastered: !word.mastered
    })
    
    // 마스터하면 다음 단어로
    if (!word.mastered) {
      handleNext()
    } else {
      // 마스터 해제하면 다시 로드
      loadVocabulary()
    }
  }

  const switchMode = (mode) => {
    setReviewMode(mode)
    setShowMeaning(false)
    setSelectedOption(null)
    setIsCorrect(null)
    if (mode === 'quiz' && vocabulary[currentIndex]) {
      generateQuizOptions(vocabulary[currentIndex])
    }
  }

  const completeReview = () => {
    // 학습 통계 업데이트
    LearningStatsManager.updateStats({
      vocabularyLearned: stats.reviewed,
      time: Math.round(stats.reviewed * 0.5) // 단어당 30초 추정
    })

    // 게임 보상
    if (stats.reviewed > 0) {
      GameDataManager.addPoints(stats.reviewed * 10)
      GameDataManager.addExp(stats.reviewed * 5)
      
      // 정답률에 따른 추가 보상
      const accuracy = stats.correct / stats.reviewed
      if (accuracy >= 0.9) {
        GameDataManager.unlockBadge('vocabulary_master')
      } else if (accuracy >= 0.7) {
        GameDataManager.addPoints(20)
      }
    }

    onClose()
  }

  if (vocabulary.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
          <Star className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-2">모든 단어를 마스터했어요!</h2>
          <p className="text-gray-600 mb-6">
            새로운 지문을 읽고 더 많은 어휘를 학습해보세요.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    )
  }

  const currentWord = vocabulary[currentIndex]
  const progress = ((currentIndex + 1) / vocabulary.length) * 100

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center">
              <BookOpen className="w-6 h-6 mr-2" />
              어휘 복습
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* 진도 바 */}
          <div className="bg-white bg-opacity-20 rounded-full h-2 mb-2">
            <div 
              className="bg-white rounded-full h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>{currentIndex + 1} / {vocabulary.length}</span>
            <span>복습: {stats.reviewed} | 정답: {stats.correct}</span>
          </div>
        </div>

        {/* 모드 선택 */}
        <div className="flex p-4 gap-2 bg-gray-50">
          <button
            onClick={() => switchMode('flashcard')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              reviewMode === 'flashcard'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            플래시카드
          </button>
          <button
            onClick={() => switchMode('quiz')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              reviewMode === 'quiz'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            퀴즈 모드
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="p-6">
          {reviewMode === 'flashcard' ? (
            // 플래시카드 모드
            <div 
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 min-h-[300px] cursor-pointer select-none"
              onClick={handleFlashcardClick}
            >
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-800 mb-6">
                  {currentWord.word}
                </h3>
                
                {currentWord.etymology && (
                  <p className="text-lg text-blue-700 mb-4">
                    {currentWord.etymology}
                  </p>
                )}
                
                {showMeaning ? (
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-xl text-gray-700">
                      {currentWord.meaning}
                    </p>
                    
                    {currentWord.example && (
                      <p className="text-gray-600 italic">
                        "{currentWord.example}"
                      </p>
                    )}
                    
                    <div className="flex justify-center gap-4 mt-6">
                      {currentWord.synonyms && currentWord.synonyms.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-500">유의어:</span>
                          <div className="flex gap-2 mt-1">
                            {currentWord.synonyms.map((syn, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                                {syn}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {currentWord.antonyms && currentWord.antonyms.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-500">반의어:</span>
                          <div className="flex gap-2 mt-1">
                            {currentWord.antonyms.map((ant, idx) => (
                              <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                                {ant}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 mt-8">
                    카드를 클릭하여 의미를 확인하세요
                  </p>
                )}
              </div>
            </div>
          ) : (
            // 퀴즈 모드
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                  {currentWord.word}
                </h3>
                {currentWord.etymology && (
                  <p className="text-lg text-blue-700">
                    {currentWord.etymology}
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                {quizOptions.map((option, index) => {
                  const isSelected = selectedOption === option
                  const isCorrectOption = option === currentWord.meaning
                  const showResult = selectedOption !== null
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuizAnswer(option)}
                      disabled={selectedOption !== null}
                      className={`w-full p-4 rounded-lg text-left transition-all ${
                        showResult && isCorrectOption
                          ? 'bg-green-100 border-2 border-green-500'
                          : showResult && isSelected && !isCorrect
                          ? 'bg-red-100 border-2 border-red-500'
                          : isSelected
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800">{option}</span>
                        {showResult && isCorrectOption && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              
              {selectedOption !== null && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-700">
                    <span className="font-semibold">예문:</span> {currentWord.example}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handleMasterToggle}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentWord.mastered
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {currentWord.mastered ? '마스터 해제' : '마스터'}
            </button>
            
            <button
              onClick={() => loadVocabulary()}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="다시 섞기"
            >
              <Shuffle className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            {currentIndex === vocabulary.length - 1 ? '완료' : '다음'}
            <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}