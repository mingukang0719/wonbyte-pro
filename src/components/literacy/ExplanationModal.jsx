import React, { useState, useCallback } from 'react'
import { X, BookOpen, Brain, Sparkles, RefreshCw } from 'lucide-react'
import aiService from '../../services/aiService'

export default function ExplanationModal({ problems, context, onClose }) {
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [aiExplanations, setAiExplanations] = useState({})
  
  const selectedProblem = problems[selectedProblemIndex]
  
  // AI 해설 생성
  const generateAIExplanation = useCallback(async () => {
    if (!selectedProblem) return
    
    setGeneratingAI(true)
    try {
      // AI 해설 생성 API 호출
      const response = await aiService.generateExplanation({
        question: selectedProblem.question,
        correctAnswer: selectedProblem.options?.[selectedProblem.answer] || selectedProblem.sampleAnswer,
        context: context,
        type: selectedProblem.type,
        gradeLevel: selectedProblem.gradeLevel || 'elem4'
      })
      
      if (response.success && response.content) {
        setAiExplanations({
          ...aiExplanations,
          [selectedProblem.id]: response.content.explanation || response.content
        })
      }
    } catch (error) {
      console.error('AI 해설 생성 오류:', error)
      // 오류 시 기본 해설 사용
      setAiExplanations({
        ...aiExplanations,
        [selectedProblem.id]: selectedProblem.explanation || '해설을 생성할 수 없습니다.'
      })
    } finally {
      setGeneratingAI(false)
    }
  }, [selectedProblem, context, aiExplanations])
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold">문제 해설</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 문제 선택 탭 */}
        <div className="px-6 py-3 border-b bg-gray-50">
          <div className="flex gap-2 overflow-x-auto">
            {problems.map((problem, index) => (
              <button
                key={problem.id}
                onClick={() => setSelectedProblemIndex(index)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedProblemIndex === index
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                문제 {index + 1}
              </button>
            ))}
          </div>
        </div>
        
        {/* 내용 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedProblem && (
            <div className="space-y-6">
              {/* 문제 표시 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">{selectedProblem.question}</h3>
                
                {/* 객관식 문제인 경우 */}
                {selectedProblem.type === 'multiple_choice' && selectedProblem.options && (
                  <div className="space-y-2">
                    {selectedProblem.options.map((option, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-2 rounded ${
                          index === selectedProblem.answer
                            ? 'bg-green-100 text-green-800 font-medium'
                            : ''
                        }`}
                      >
                        <span className="w-6">{index + 1})</span>
                        <span>{option}</span>
                        {index === selectedProblem.answer && (
                          <span className="ml-auto text-sm">✓ 정답</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 서술형 문제인 경우 */}
                {selectedProblem.type === 'short_answer' && (
                  <div className="mt-3 space-y-2">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm font-medium text-blue-700">예시 답안:</p>
                      <p className="text-blue-900">{selectedProblem.sampleAnswer}</p>
                    </div>
                    {selectedProblem.gradingCriteria && (
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-sm font-medium text-purple-700">채점 기준:</p>
                        <ul className="list-disc list-inside text-purple-900 text-sm mt-1">
                          {selectedProblem.gradingCriteria.map((criteria, index) => (
                            <li key={index}>{criteria}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* 기본 해설 */}
              {selectedProblem.explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">기본 해설</h4>
                      <p className="text-blue-800">{selectedProblem.explanation}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* AI 해설 */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-purple-900 mb-2">AI 상세 해설</h4>
                      {aiExplanations[selectedProblem.id] ? (
                        <p className="text-purple-800 whitespace-pre-wrap">
                          {aiExplanations[selectedProblem.id]}
                        </p>
                      ) : (
                        <p className="text-purple-600 italic">
                          AI 해설을 생성하려면 버튼을 클릭하세요.
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={generateAIExplanation}
                    disabled={generatingAI}
                    className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {generatingAI ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        AI 해설 생성
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* 학습 팁 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">💡 학습 팁</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• 문제를 다시 읽고 핵심 키워드를 찾아보세요.</li>
                  <li>• 지문에서 관련된 부분을 다시 확인해보세요.</li>
                  <li>• 비슷한 유형의 문제를 더 풀어보면 실력이 향상됩니다.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        
        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedProblemIndex + 1} / {problems.length} 문제
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedProblemIndex(Math.max(0, selectedProblemIndex - 1))}
              disabled={selectedProblemIndex === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              이전 문제
            </button>
            <button
              onClick={() => setSelectedProblemIndex(Math.min(problems.length - 1, selectedProblemIndex + 1))}
              disabled={selectedProblemIndex === problems.length - 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음 문제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}