import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { 
  ArrowLeft,
  BookOpen,
  Users,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle,
  FileText,
  Target,
  Clock,
  Plus,
  X
} from 'lucide-react'
import { supabase } from '../../services/supabaseClient'
import TextGenerator from '../../components/TextGenerator'
import ProblemGenerator from '../../components/ProblemGenerator'

export default function CreateAssignmentPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: 지문생성, 2: 문제생성, 3: 학생배정
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [generatedText, setGeneratedText] = useState('')
  const [generatedProblems, setGeneratedProblems] = useState([])
  const [textMetadata, setTextMetadata] = useState({})
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  useEffect(() => {
    fetchStudents()
  }, [user, profile])

  const fetchStudents = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')

      // 교사인 경우 자신의 학생만
      if (profile.role === 'teacher') {
        query = query.eq('teacher_id', user.id)
      }

      const { data, error } = await query
      if (!error && data) {
        setStudents(data)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const handleTextGenerated = (text, metadata) => {
    setGeneratedText(text)
    setTextMetadata(metadata)
    setStep(2)
  }

  const handleProblemsGenerated = (problems) => {
    setGeneratedProblems(problems)
    setStep(3)
  }

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  const selectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map(s => s.id))
    }
  }

  const onSubmit = async (data) => {
    if (selectedStudents.length === 0) {
      alert('최소 한 명 이상의 학생을 선택해주세요.')
      return
    }

    setLoading(true)
    try {
      // 1. 지문 저장
      const { data: materialData, error: materialError } = await supabase
        .from('reading_materials')
        .insert({
          title: data.title,
          content: generatedText,
          topic: textMetadata.topic || data.title,
          level: textMetadata.level || 'intermediate',
          word_count: generatedText.length,
          created_by: user.id
        })
        .select()
        .single()

      if (materialError) throw materialError

      // 2. 문제 저장
      const problemsToInsert = generatedProblems.map(problem => ({
        material_id: materialData.id,
        question: problem.question,
        options: problem.options,
        correct_answer: problem.correctAnswer,
        explanation: problem.explanation || '',
        type: problem.type,
        category: problem.category || 'general',
        points: problem.points || 10
      }))

      const { error: problemsError } = await supabase
        .from('problems')
        .insert(problemsToInsert)

      if (problemsError) throw problemsError

      // 3. 과제 배정
      const assignmentsToInsert = selectedStudents.map(studentId => ({
        material_id: materialData.id,
        assigned_to: studentId,
        assigned_by: user.id,
        due_date: data.dueDate || null,
        status: 'pending',
        assigned_at: new Date().toISOString()
      }))

      const { error: assignmentsError } = await supabase
        .from('assignments')
        .insert(assignmentsToInsert)

      if (assignmentsError) throw assignmentsError

      // 성공 메시지 표시 후 목록으로 이동
      alert(`${selectedStudents.length}명의 학생에게 과제가 배정되었습니다.`)
      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Assignment creation error:', error)
      alert('과제 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">새 과제 만들기</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className={`flex items-center ${num > 1 ? 'ml-4' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= num
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {num}
                    </div>
                    {num < 3 && (
                      <div
                        className={`w-12 h-0.5 ml-2 ${
                          step > num ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: 지문 생성 */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                1단계: 지문 생성
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                AI를 활용하여 학습 지문을 생성합니다.
              </p>
            </div>
            <div className="p-6">
              <TextGenerator
                onTextGenerated={handleTextGenerated}
                showPreview={true}
                allowEdit={true}
              />
            </div>
          </div>
        )}

        {/* Step 2: 문제 생성 */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5" />
                2단계: 문제 생성
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                생성된 지문을 바탕으로 문제를 만듭니다.
              </p>
            </div>
            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">생성된 지문</h3>
                <p className="text-gray-700 whitespace-pre-wrap line-clamp-5">
                  {generatedText}
                </p>
              </div>
              
              <ProblemGenerator
                generatedText={generatedText}
                onProblemsChange={handleProblemsGenerated}
                allowEdit={true}
              />

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  이전 단계
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 학생 배정 */}
        {step === 3 && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  3단계: 학생 배정
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  과제를 배정할 학생을 선택하고 세부사항을 설정합니다.
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* 과제 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    과제 제목 *
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: '과제 제목을 입력해주세요.' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 3월 2주차 독해 과제"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* 마감일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    마감일 (선택)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      {...register('dueDate')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* 학생 선택 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      학생 선택 ({selectedStudents.length}명 선택됨)
                    </label>
                    <button
                      type="button"
                      onClick={selectAllStudents}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {selectedStudents.length === students.length ? '전체 해제' : '전체 선택'}
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                    {students.length === 0 ? (
                      <p className="p-4 text-center text-gray-500">
                        배정 가능한 학생이 없습니다.
                      </p>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {students.map((student) => (
                          <label
                            key={student.id}
                            className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => toggleStudentSelection(student.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {student.full_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {student.grade_level} | {student.school_name}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 과제 요약 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">과제 요약</h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• 지문: {textMetadata.topic || '생성된 지문'}</li>
                    <li>• 문제 수: {generatedProblems.length}개</li>
                    <li>• 배정 학생: {selectedStudents.length}명</li>
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  이전 단계
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedStudents.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      과제 생성 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      과제 생성 완료
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}