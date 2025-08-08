import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  ArrowLeft,
  BookOpen,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react'
import { supabase } from '../services/supabaseClient'

export default function AssignmentReadingPage() {
  const { user, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const { assignmentId, materialId, assignmentData } = location.state || {}
  
  const [loading, setLoading] = useState(true)
  const [readingMaterial, setReadingMaterial] = useState(null)
  const [problems, setProblems] = useState([])
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!assignmentId || !materialId) {
      navigate('/student/dashboard')
      return
    }
    
    fetchAssignmentData()
  }, [assignmentId, materialId])

  const fetchAssignmentData = async () => {
    try {
      // 지문 가져오기
      const { data: material, error: materialError } = await supabase
        .from('reading_materials')
        .select('*')
        .eq('id', materialId)
        .single()
      
      if (materialError) throw materialError
      setReadingMaterial(material)

      // 문제 가져오기
      const { data: problemsData, error: problemsError } = await supabase
        .from('problems')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: true })
      
      if (problemsError) throw problemsError
      setProblems(problemsData || [])

      // 과제 상태를 진행중으로 업데이트
      if (assignmentData?.status === 'pending') {
        await supabase
          .from('assignments')
          .update({ status: 'in_progress' })
          .eq('id', assignmentId)
      }
    } catch (error) {
      console.error('Error fetching assignment data:', error)
      alert('과제 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (problemId, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [problemId]: answerIndex
    }))
  }

  const handleNextProblem = () => {
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1)
    }
  }

  const handlePreviousProblem = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(currentProblemIndex - 1)
    }
  }

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < problems.length) {
      alert('모든 문제를 풀어주세요.')
      return
    }

    setSubmitting(true)
    try {
      // 정답 계산
      let correctCount = 0
      const results = problems.map(problem => {
        const isCorrect = selectedAnswers[problem.id] === problem.correct_answer
        if (isCorrect) correctCount++
        return {
          problem_id: problem.id,
          selected_answer: selectedAnswers[problem.id],
          is_correct: isCorrect
        }
      })

      const score = Math.round((correctCount / problems.length) * 100)

      // 학습 진행 상황 저장
      const authToken = localStorage.getItem('auth_token')
      const { data: progress, error: progressError } = await supabase
        .from('learning_progress')
        .insert({
          user_id: profile.id,
          assignment_id: assignmentId,
          material_id: materialId,
          problems_attempted: problems.length,
          problems_correct: correctCount,
          accuracy_rate: score,
          completed_at: new Date().toISOString()
        })

      if (progressError) throw progressError

      // 과제 완료 처리
      const { error: updateError } = await supabase
        .from('assignments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', assignmentId)

      if (updateError) throw updateError

      setShowResults(true)
    } catch (error) {
      console.error('Error submitting assignment:', error)
      alert('과제 제출 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const calculateScore = () => {
    let correct = 0
    problems.forEach(problem => {
      if (selectedAnswers[problem.id] === problem.correct_answer) {
        correct++
      }
    })
    return Math.round((correct / problems.length) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!readingMaterial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">과제를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (showResults) {
    const score = calculateScore()
    const isPassed = score >= 70

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">과제 완료</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className={`w-24 h-24 rounded-full ${isPassed ? 'bg-green-100' : 'bg-red-100'} mx-auto mb-6 flex items-center justify-center`}>
              {isPassed ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : (
                <AlertCircle className="w-12 h-12 text-red-600" />
              )}
            </div>

            <h2 className="text-3xl font-bold mb-2">{score}점</h2>
            <p className="text-gray-600 mb-6">
              {problems.length}문제 중 {problems.filter(p => selectedAnswers[p.id] === p.correct_answer).length}문제 정답
            </p>

            <div className="space-y-4 text-left max-w-2xl mx-auto mb-8">
              {problems.map((problem, index) => {
                const isCorrect = selectedAnswers[problem.id] === problem.correct_answer
                return (
                  <div key={problem.id} className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-start gap-3">
                      <span className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {index + 1}.
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-2">{problem.question}</p>
                        <p className="text-sm text-gray-600">
                          내 답: {problem.options[selectedAnswers[problem.id]]}
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-green-600 mt-1">
                            정답: {problem.options[problem.correct_answer]}
                          </p>
                        )}
                        {problem.explanation && !isCorrect && (
                          <p className="text-sm text-gray-500 mt-2">{problem.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => navigate('/student/dashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </main>
      </div>
    )
  }

  const currentProblem = problems[currentProblemIndex]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">{readingMaterial.title}</h1>
            </div>
            <div className="text-sm text-gray-600">
              문제 {currentProblemIndex + 1} / {problems.length}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 지문 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              지문
            </h2>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {readingMaterial.content}
              </p>
            </div>
          </div>

          {/* 문제 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              문제 {currentProblemIndex + 1}
            </h2>
            
            {currentProblem && (
              <div>
                <p className="text-gray-900 mb-4">{currentProblem.question}</p>
                
                <div className="space-y-3">
                  {currentProblem.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentProblem.id, index)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition ${
                        selectedAnswers[currentProblem.id] === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">{index + 1}. </span>
                      {option}
                    </button>
                  ))}
                </div>

                {/* 네비게이션 */}
                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={handlePreviousProblem}
                    disabled={currentProblemIndex === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      currentProblemIndex === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    이전 문제
                  </button>

                  {currentProblemIndex === problems.length - 1 ? (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || Object.keys(selectedAnswers).length < problems.length}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          제출 중...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          제출하기
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleNextProblem}
                      disabled={!selectedAnswers[currentProblem.id]}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        !selectedAnswers[currentProblem.id]
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      다음 문제
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* 진행 상황 */}
                <div className="mt-6">
                  <div className="flex gap-1">
                    {problems.map((_, index) => (
                      <div
                        key={index}
                        className={`flex-1 h-2 rounded ${
                          selectedAnswers[problems[index]?.id]
                            ? 'bg-blue-600'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    {Object.keys(selectedAnswers).length} / {problems.length} 문제 완료
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}