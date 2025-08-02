import React, { useState, useCallback } from 'react'
import { FileQuestion, RefreshCw, Edit3, Save, X, Plus, Check } from 'lucide-react'
import aiService from '../../services/aiService'
import EditableText from '../common/EditableText'

/**
 * 문해력 문제 생성 및 관리 컴포넌트
 * - AI를 통한 5개 문제 생성 (객관식 3-4개, 서술형 1-2개)
 * - 문제별 편집 기능
 * - 채점 기준 및 예시 답안 관리
 * - 서술형 문제 1-2문장 답안 형태
 */
export default function ProblemGenerator({ text, gradeLevel, onProblemsChange }) {
  const [problems, setProblems] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [editingProblem, setEditingProblem] = useState(null)

  // AI를 통한 문제 생성
  const generateProblems = useCallback(async () => {
    if (!text?.trim()) {
      setError('분석할 지문이 없습니다.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await aiService.generateReadingProblems(text, 'mixed', 5)
      
      // Handle both old and new API response formats
      let problemsData = null
      if (response.success) {
        // Try new format first (content.problems)
        if (response.content?.problems) {
          problemsData = response.content.problems
        }
        // Fallback to old format (problems directly)
        else if (response.problems) {
          problemsData = response.problems
        }
      }
      
      if (problemsData && problemsData.length > 0) {
        const generatedProblems = problemsData.map((problem, index) => ({
          id: `generated_${Date.now()}_${index}`,
          ...problem,
          isCustom: false
        }))
        setProblems(generatedProblems)
        onProblemsChange?.(generatedProblems)
      } else {
        throw new Error('문제 생성 응답이 올바르지 않습니다.')
      }
    } catch (error) {
      console.error('문제 생성 오류:', error)
      setError('문제 생성 중 오류가 발생했습니다: ' + error.message)
      
      // 오류 시 샘플 데이터 제공
      const sampleProblems = [
        {
          id: 'sample_1',
          type: 'multiple_choice',
          question: '이 글의 주제로 가장 적절한 것은?',
          options: ['환경 보호의 중요성', '기술 발전의 문제점', '교육의 필요성', '건강한 생활 습관'],
          correctAnswer: 0,
          explanation: '글 전체에서 환경을 보호해야 한다는 내용이 반복적으로 나타나므로 주제는 \'환경 보호의 중요성\'입니다.',
          isCustom: false
        },
        {
          id: 'sample_2',
          type: 'multiple_choice',
          question: '글에서 \'관찰\'의 의미로 가장 적절한 것은?',
          options: ['대충 보기', '자세히 살펴보기', '빨리 훑어보기', '멀리서 보기'],
          correctAnswer: 1,
          explanation: '\'관찰\'은 어떤 대상을 자세히 살펴보고 연구하는 행위를 의미합니다.',
          isCustom: false
        },
        {
          id: 'sample_3',
          type: 'short_answer',
          question: '환경을 보호하기 위해 우리가 할 수 있는 일을 두 가지 쓰시오.',
          expectedLength: '1-2문장',
          sampleAnswer: '쓰레기 분리수거를 하고, 일회용품 사용을 줄인다.',
          gradingCriteria: ['환경 보호와 관련된 구체적인 행동 제시', '두 가지 이상의 방법 언급'],
          explanation: '환경 보호를 위한 실천 방안으로는 재활용, 에너지 절약, 대중교통 이용 등이 있습니다.',
          isCustom: false
        }
      ]
      setProblems(sampleProblems)
    } finally {
      setIsGenerating(false)
    }
  }, [text, gradeLevel, onProblemsChange])

  // 문제 편집 시작
  const startEditingProblem = useCallback((problem) => {
    setEditingProblem({ ...problem })
  }, [])

  // 문제 편집 저장
  const saveEditingProblem = useCallback(() => {
    const updatedProblems = problems.map(problem =>
      problem.id === editingProblem.id ? { ...editingProblem } : problem
    )
    setProblems(updatedProblems)
    onProblemsChange?.(updatedProblems)
    setEditingProblem(null)
  }, [problems, editingProblem, onProblemsChange])

  // 문제 편집 취소
  const cancelEditingProblem = useCallback(() => {
    setEditingProblem(null)
  }, [])

  // 새 문제 추가
  const addNewProblem = useCallback(() => {
    const newProblem = {
      id: `custom_${Date.now()}`,
      type: 'multiple_choice',
      question: '새 문제를 입력하세요.',
      options: ['선택지 1', '선택지 2', '선택지 3', '선택지 4'],
      correctAnswer: 0,
      explanation: '정답 해설을 입력하세요.',
      isCustom: true
    }
    
    const updatedProblems = [...problems, newProblem]
    setProblems(updatedProblems)
    onProblemsChange?.(updatedProblems)
    setEditingProblem({ ...newProblem })
  }, [problems, onProblemsChange])

  // 문제 삭제
  const removeProblem = useCallback((id) => {
    const updatedProblems = problems.filter(problem => problem.id !== id)
    setProblems(updatedProblems)
    onProblemsChange?.(updatedProblems)
  }, [problems, onProblemsChange])

  // 문제 타입 변경
  const changeProblemType = useCallback((type) => {
    if (type === 'short_answer') {
      setEditingProblem({
        ...editingProblem,
        type,
        expectedLength: '1-2문장',
        sampleAnswer: '',
        gradingCriteria: [],
        options: undefined,
        correctAnswer: undefined
      })
    } else {
      setEditingProblem({
        ...editingProblem,
        type,
        options: ['선택지 1', '선택지 2', '선택지 3', '선택지 4'],
        correctAnswer: 0,
        expectedLength: undefined,
        sampleAnswer: undefined,
        gradingCriteria: undefined
      })
    }
  }, [editingProblem])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileQuestion className="w-6 h-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">문해력 훈련 문제</h3>
          {problems.length > 0 && (
            <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              {problems.length}개 문제
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={addNewProblem}
            className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            문제 추가
          </button>
          
          <button
            onClick={generateProblems}
            disabled={isGenerating || !text?.trim()}
            className="flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <FileQuestion className="w-4 h-4 mr-2" />
                문제 생성
              </>
            )}
          </button>
        </div>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 문제 목록 */}
      <div className="space-y-6">
        {problems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileQuestion className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>문제 생성 버튼을 클릭하여 문해력 훈련 문제를 만들어보세요.</p>
            <p className="text-sm mt-2">객관식 3-4개, 서술형 1-2개가 생성됩니다.</p>
          </div>
        ) : (
          problems.map((problem, index) => (
            <div
              key={problem.id}
              className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow"
            >
              {/* 문제 헤더 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 font-semibold rounded-full">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        problem.type === 'multiple_choice'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {problem.type === 'multiple_choice' ? '객관식' : '서술형'}
                      </span>
                      {problem.isCustom && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                          사용자 추가
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {editingProblem?.id === problem.id ? (
                    <>
                      <button
                        onClick={saveEditingProblem}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="저장"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditingProblem}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="취소"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditingProblem(problem)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="편집"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {problem.isCustom && (
                        <button
                          onClick={() => removeProblem(problem.id)}
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

              {/* 문제 편집 폼 */}
              {editingProblem?.id === problem.id ? (
                <div className="space-y-4">
                  {/* 문제 타입 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      문제 타입
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="problemType"
                          value="multiple_choice"
                          checked={editingProblem.type === 'multiple_choice'}
                          onChange={(e) => changeProblemType(e.target.value)}
                          className="mr-2"
                        />
                        객관식
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="problemType"
                          value="short_answer"
                          checked={editingProblem.type === 'short_answer'}
                          onChange={(e) => changeProblemType(e.target.value)}
                          className="mr-2"
                        />
                        서술형
                      </label>
                    </div>
                  </div>

                  {/* 문제 내용 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      문제
                    </label>
                    <textarea
                      value={editingProblem.question}
                      onChange={(e) => setEditingProblem({
                        ...editingProblem,
                        question: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows="2"
                    />
                  </div>

                  {/* 객관식 선택지 */}
                  {editingProblem.type === 'multiple_choice' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        선택지
                      </label>
                      <div className="space-y-2">
                        {editingProblem.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={editingProblem.correctAnswer === optionIndex}
                              onChange={() => setEditingProblem({
                                ...editingProblem,
                                correctAnswer: optionIndex
                              })}
                              className="text-purple-600"
                            />
                            <span className="w-6 text-sm text-gray-600">
                              {optionIndex + 1}.
                            </span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...editingProblem.options]
                                newOptions[optionIndex] = e.target.value
                                setEditingProblem({
                                  ...editingProblem,
                                  options: newOptions
                                })
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 서술형 문제 설정 */}
                  {editingProblem.type === 'short_answer' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          예상 답안 길이
                        </label>
                        <input
                          type="text"
                          value={editingProblem.expectedLength || '1-2문장'}
                          onChange={(e) => setEditingProblem({
                            ...editingProblem,
                            expectedLength: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          예시 답안
                        </label>
                        <textarea
                          value={editingProblem.sampleAnswer || ''}
                          onChange={(e) => setEditingProblem({
                            ...editingProblem,
                            sampleAnswer: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          rows="2"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          채점 기준 (쉼표로 구분)
                        </label>
                        <textarea
                          value={editingProblem.gradingCriteria?.join(', ') || ''}
                          onChange={(e) => setEditingProblem({
                            ...editingProblem,
                            gradingCriteria: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          rows="2"
                        />
                      </div>
                    </>
                  )}

                  {/* 해설 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      정답 해설
                    </label>
                    <textarea
                      value={editingProblem.explanation}
                      onChange={(e) => setEditingProblem({
                        ...editingProblem,
                        explanation: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows="3"
                    />
                  </div>
                </div>
              ) : (
                /* 문제 표시 */
                <div className="space-y-4">
                  {/* 문제 내용 */}
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-3">
                      {problem.question}
                    </p>

                    {/* 객관식 선택지 */}
                    {problem.type === 'multiple_choice' && (
                      <div className="space-y-2 mb-4">
                        {problem.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                              problem.correctAnswer === optionIndex
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {optionIndex + 1}
                            </span>
                            <span className={problem.correctAnswer === optionIndex ? 'font-medium text-green-700' : ''}>
                              {option}
                            </span>
                            {problem.correctAnswer === optionIndex && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 서술형 문제 정보 */}
                    {problem.type === 'short_answer' && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-700">예상 답안 길이:</span>
                            <p className="text-sm text-gray-600">{problem.expectedLength}</p>
                          </div>
                          {problem.sampleAnswer && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">예시 답안:</span>
                              <p className="text-sm text-gray-600 italic">"{problem.sampleAnswer}"</p>
                            </div>
                          )}
                        </div>
                        {problem.gradingCriteria && problem.gradingCriteria.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm font-medium text-gray-700">채점 기준:</span>
                            <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                              {problem.gradingCriteria.map((criteria, index) => (
                                <li key={index}>{criteria}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 해설 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-blue-700 mr-2">해설:</span>
                        <p className="text-sm text-blue-800">{problem.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 문제 생성 안내 */}
      {problems.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <FileQuestion className="w-5 h-5 text-purple-600 mr-2" />
            <span className="text-purple-800 font-medium">
              총 {problems.length}개 문제가 생성되었습니다.
            </span>
          </div>
          <p className="text-sm text-purple-700 mt-1">
            객관식: {problems.filter(p => p.type === 'multiple_choice').length}개, 
            서술형: {problems.filter(p => p.type === 'short_answer').length}개
          </p>
        </div>
      )}
    </div>
  )
}