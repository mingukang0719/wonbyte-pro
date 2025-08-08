import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, CheckCircle, MousePointer, Keyboard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function WonbyteMode({ text, onClose, onComplete }) {
  const { user } = useAuth()
  const [sentences, setSentences] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [totalCharsRead, setTotalCharsRead] = useState(0)
  
  // 문장 분리 로직
  useEffect(() => {
    if (text) {
      // 한국어 문장 종결 패턴으로 분리
      const sentenceArray = text
        .split(/(?<=[.!?。！？])\s+/)
        .filter(sentence => sentence.trim().length > 0)
        .map(sentence => sentence.trim())
      
      setSentences(sentenceArray)
    }
  }, [text])

  // 다음 문장으로 이동
  const showNextSentence = useCallback(() => {
    if (currentIndex < sentences.length - 1) {
      const currentSentence = sentences[currentIndex]
      setTotalCharsRead(prev => prev + currentSentence.length)
      setCurrentIndex(prev => prev + 1)
    } else if (currentIndex === sentences.length - 1 && !isCompleted) {
      // 마지막 문장 읽기 완료
      const lastSentence = sentences[currentIndex]
      setTotalCharsRead(prev => prev + lastSentence.length)
      setIsCompleted(true)
    }
  }, [currentIndex, sentences, isCompleted])

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && !isCompleted) {
        e.preventDefault()
        showNextSentence()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showNextSentence, isCompleted])

  // 완료 처리
  const handleComplete = async () => {
    try {
      // 읽은 글자수 업데이트
      if (user?.id) {
        const { data: existingStats } = await supabase
          .from('user_stats')
          .select('total_chars_read')
          .eq('user_id', user.id)
          .single()

        const currentTotal = existingStats?.total_chars_read || 0
        
        await supabase
          .from('user_stats')
          .upsert({
            user_id: user.id,
            total_chars_read: currentTotal + totalCharsRead,
            last_activity: new Date().toISOString()
          })

        // 학습 기록 저장
        await supabase
          .from('learning_records')
          .insert({
            user_id: user.id,
            activity_type: 'wonbyte_mode',
            chars_read: totalCharsRead,
            completed_at: new Date().toISOString()
          })
      }

      onComplete?.(totalCharsRead)
      onClose()
    } catch (error) {
      console.error('Error saving reading progress:', error)
    }
  }

  const progress = sentences.length > 0 ? ((currentIndex + 1) / sentences.length) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-5xl mx-auto p-8 flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">원바이트 모드</h2>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <MousePointer className="w-4 h-4" />
              <span>클릭</span>
              <span className="mx-2">또는</span>
              <Keyboard className="w-4 h-4" />
              <span>스페이스바</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 진행 상태 바 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-sm">
              {currentIndex + 1} / {sentences.length} 문장
            </span>
            <span className="text-white text-sm">
              {totalCharsRead}자 읽음
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 문장 표시 영역 */}
        <div 
          className="flex-1 flex items-center justify-center cursor-pointer"
          onClick={!isCompleted ? showNextSentence : undefined}
        >
          <div className="text-center max-w-4xl">
            {sentences[currentIndex] && (
              <p className="text-3xl md:text-4xl lg:text-5xl text-white leading-relaxed font-medium">
                {sentences[currentIndex]}
              </p>
            )}
          </div>
        </div>

        {/* 하단 컨트롤 */}
        <div className="flex justify-center mt-8">
          {!isCompleted ? (
            <button
              onClick={showNextSentence}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다음 문장
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
            >
              <CheckCircle className="w-6 h-6" />
              읽기 완료 ({totalCharsRead}자)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}