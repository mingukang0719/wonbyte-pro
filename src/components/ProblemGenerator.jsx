import React, { useState, useCallback, useEffect } from 'react'
import { FileQuestion, RefreshCw, Sparkles, AlertCircle } from 'lucide-react'
import aiService from '../services/aiService'

export default function ProblemGenerator({ 
  generatedText, 
  onProblemsChange, 
  allowEdit = false,
  autoGenerate = false 
}) {
  const [problems, setProblems] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (autoGenerate && generatedText && problems.length === 0) {
      generateProblems()
    }
  }, [generatedText, autoGenerate])

  const generateProblems = useCallback(async () => {
    if (!generatedText?.trim()) {
      setError('분석할 지문이 없습니다.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await aiService.generateReadingProblems(generatedText, 'mixed', 5)
      
      let problemsData = null
      if (response.success) {
        if (response.content?.problems) {
          problemsData = response.content.problems
        } else if (response.problems) {
          problemsData = response.problems
        }
      }
      
      if (problemsData && problemsData.length > 0) {
        const formattedProblems = problemsData.map((problem, index) => ({
          id: `problem_${Date.now()}_${index}`,
          type: problem.type === 'multiple_choice' ? 'objective' : 'subjective',
          category: problem.category || 'general',
          question: problem.question,
          options: problem.options || [],
          correctAnswer: problem.correctAnswer,
          explanation: problem.explanation || '',
          points: problem.points || 10,
          expectedLength: problem.expectedLength,
          sampleAnswer: problem.sampleAnswer,
          gradingCriteria: problem.gradingCriteria
        }))
        
        setProblems(formattedProblems)
        onProblemsChange?.(formattedProblems)
      } else {
        throw new Error('문제 생성 응답이 올바르지 않습니다.')
      }
    } catch (error) {
      console.error('문제 생성 오류:', error)
      setError('문제 생성 중 오류가 발생했습니다.')
      
      // 오류 시 샘플 데이터
      const sampleProblems = [
        {
          id: 'sample_1',
          type: 'objective',
          category: 'comprehension',
          question: '이 글의 주제로 가장 적절한 것은?',
          options: ['환경 보호의 중요성', '기술 발전의 문제점', '교육의 필요성', '건강한 생활 습관'],
          correctAnswer: 0,
          explanation: '글 전체에서 환경을 보호해야 한다는 내용이 반복적으로 나타납니다.',
          points: 10
        },
        {
          id: 'sample_2',
          type: 'objective',
          category: 'vocabulary',
          question: '글에서 사용된 단어의 의미로 적절한 것은?',
          options: ['대충 보기', '자세히 살펴보기', '빨리 훑어보기', '멀리서 보기'],
          correctAnswer: 1,
          explanation: '문맥상 자세히 살펴보는 의미가 적절합니다.',
          points: 10
        },
        {
          id: 'sample_3',
          type: 'subjective',
          category: 'application',
          question: '본문의 내용을 바탕으로 우리가 실천할 수 있는 일을 두 가지 쓰시오.',
          expectedLength: '1-2문장',
          sampleAnswer: '쓰레기 분리수거를 하고, 일회용품 사용을 줄인다.',
          gradingCriteria: ['구체적인 실천 방안 제시', '두 가지 이상 언급'],
          explanation: '일상생활에서 실천 가능한 구체적인 방법을 제시해야 합니다.',
          points: 20
        }
      ]
      setProblems(sampleProblems)
      onProblemsChange?.(sampleProblems)
    } finally {
      setIsGenerating(false)
    }
  }, [generatedText, onProblemsChange])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">문제 생성</h3>
          {problems.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              총 {problems.length}개 문제 (객관식 {problems.filter(p => p.type === 'objective').length}개, 
              서술형 {problems.filter(p => p.type === 'subjective').length}개)
            </p>
          )}
        </div>
        
        <button
          onClick={generateProblems}
          disabled={isGenerating || !generatedText?.trim()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              문제 생성
            </>
          )}
        </button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 문제 목록 */}
      {problems.length > 0 && (
        <div className="space-y-4">
          {problems.map((problem, index) => (
            <div key={problem.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 font-semibold rounded-full">
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      problem.type === 'objective'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {problem.type === 'objective' ? '객관식' : '서술형'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {problem.points}점
                    </span>
                  </div>
                </div>
              </div>

              <p className="font-medium text-gray-900 mb-3">{problem.question}</p>

              {/* 객관식 선택지 */}
              {problem.type === 'objective' && problem.options && (
                <div className="space-y-2 mb-3">
                  {problem.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`flex items-center gap-2 p-2 rounded ${
                        problem.correctAnswer === optionIndex
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{optionIndex + 1}.</span>
                      <span>{option}</span>
                      {problem.correctAnswer === optionIndex && (
                        <span className="ml-auto text-sm">(정답)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 서술형 정보 */}
              {problem.type === 'subjective' && (
                <div className="bg-gray-50 rounded p-3 mb-3 text-sm">
                  {problem.expectedLength && (
                    <p className="text-gray-600">
                      <span className="font-medium">답안 길이:</span> {problem.expectedLength}
                    </p>
                  )}
                  {problem.sampleAnswer && (
                    <p className="text-gray-600 mt-1">
                      <span className="font-medium">예시 답안:</span> {problem.sampleAnswer}
                    </p>
                  )}
                </div>
              )}

              {/* 해설 */}
              {problem.explanation && (
                <div className="text-sm text-gray-600 bg-blue-50 rounded p-3">
                  <span className="font-medium">해설:</span> {problem.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 문제 없을 때 */}
      {!isGenerating && problems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FileQuestion className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>문제 생성 버튼을 클릭하여 문제를 만들어보세요.</p>
        </div>
      )}
    </div>
  )
}