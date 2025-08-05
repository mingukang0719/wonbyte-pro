import React, { useState } from 'react'
import { FileText, RefreshCw, Sparkles, AlertCircle } from 'lucide-react'
import aiService from '../services/aiService'

export default function TextGenerator({ onTextGenerated, showPreview = true, allowEdit = false }) {
  const [formData, setFormData] = useState({
    topic: '',
    gradeLevel: '초3',
    wordCount: '300',
    difficulty: 'medium'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedText, setGeneratedText] = useState('')
  const [error, setError] = useState('')

  const gradeOptions = [
    { value: '초1', label: '초등학교 1학년' },
    { value: '초2', label: '초등학교 2학년' },
    { value: '초3', label: '초등학교 3학년' },
    { value: '초4', label: '초등학교 4학년' },
    { value: '초5', label: '초등학교 5학년' },
    { value: '초6', label: '초등학교 6학년' },
    { value: '중1', label: '중학교 1학년' },
    { value: '중2', label: '중학교 2학년' },
    { value: '중3', label: '중학교 3학년' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.topic.trim()) {
      setError('주제를 입력해주세요.')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await aiService.generateReadingText(
        formData.topic,
        formData.gradeLevel,
        parseInt(formData.wordCount),
        formData.difficulty
      )

      if (response.success && response.content) {
        const text = response.content.text || response.content
        setGeneratedText(text)
        onTextGenerated?.(text, {
          topic: formData.topic,
          gradeLevel: formData.gradeLevel,
          wordCount: formData.wordCount,
          difficulty: formData.difficulty,
          level: formData.difficulty
        })
      } else {
        throw new Error('지문 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Text generation error:', error)
      setError(error.message || '지문 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTextChange = (e) => {
    const newText = e.target.value
    setGeneratedText(newText)
    if (onTextGenerated) {
      onTextGenerated(newText, {
        topic: formData.topic,
        gradeLevel: formData.gradeLevel,
        wordCount: newText.length,
        difficulty: formData.difficulty,
        level: formData.difficulty
      })
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 주제 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              주제 *
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 환경 보호, 우주 탐험, 건강한 생활"
            />
          </div>

          {/* 학년 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학년
            </label>
            <select
              value={formData.gradeLevel}
              onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {gradeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 글자 수 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              글자 수
            </label>
            <select
              value={formData.wordCount}
              onChange={(e) => setFormData({ ...formData, wordCount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="200">200자</option>
              <option value="300">300자</option>
              <option value="400">400자</option>
              <option value="500">500자</option>
              <option value="600">600자</option>
            </select>
          </div>

          {/* 난이도 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              난이도
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="easy">쉬움</option>
              <option value="medium">보통</option>
              <option value="hard">어려움</option>
            </select>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 생성 버튼 */}
        <button
          type="submit"
          disabled={isGenerating || !formData.topic.trim()}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              지문 생성 중...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              AI 지문 생성
            </>
          )}
        </button>
      </form>

      {/* 생성된 지문 미리보기 */}
      {showPreview && generatedText && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              생성된 지문
            </h3>
            <span className="text-sm text-gray-500">
              {generatedText.length}자
            </span>
          </div>

          {allowEdit ? (
            <textarea
              value={generatedText}
              onChange={handleTextChange}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="10"
            />
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {generatedText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}