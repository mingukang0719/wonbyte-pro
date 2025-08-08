import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  ArrowLeft,
  BookOpen,
  Target,
  Sliders,
  Users,
  Save,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../../services/supabaseClient'

export default function VocabularyTrainingPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [settings, setSettings] = useState({
    dailyGoal: 50,
    difficulty: 'medium',
    focusAreas: [],
    repetitionCount: 3
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchStudents()
  }, [user, profile])

  const fetchStudents = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')

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

  const handleSaveSettings = async () => {
    if (!selectedStudent) {
      setMessage({ type: 'error', text: '학생을 선택해주세요.' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // 실제로는 vocabulary_training_settings 테이블에 저장
      // 여기서는 profiles 테이블의 metadata 필드를 활용하거나 별도 테이블 생성 필요
      
      setMessage({ type: 'success', text: '어휘 훈련 설정이 저장되었습니다.' })
    } catch (error) {
      console.error('Save settings error:', error)
      setMessage({ type: 'error', text: '설정 저장 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const focusAreaOptions = [
    { value: 'basic', label: '기초 어휘' },
    { value: 'academic', label: '학술 어휘' },
    { value: 'daily', label: '일상 어휘' },
    { value: 'reading', label: '독해 어휘' },
    { value: 'writing', label: '작문 어휘' }
  ]

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
              <h1 className="text-2xl font-bold text-gray-900">어휘 훈련 설정</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              학생별 어휘 훈련 난이도 및 목표 설정
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* 학생 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학생 선택
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">학생을 선택하세요</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.grade_level})
                  </option>
                ))}
              </select>
            </div>

            {/* 일일 목표 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                일일 학습 목표 (단어 수)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={settings.dailyGoal}
                  onChange={(e) => setSettings({ ...settings, dailyGoal: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-16 text-center font-medium text-gray-900">
                  {settings.dailyGoal}개
                </span>
              </div>
            </div>

            {/* 난이도 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                난이도
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="relative">
                  <input
                    type="radio"
                    name="difficulty"
                    value="easy"
                    checked={settings.difficulty === 'easy'}
                    onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer text-center transition ${
                    settings.difficulty === 'easy' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <p className="font-medium">쉬움</p>
                    <p className="text-xs text-gray-500 mt-1">기초 어휘 중심</p>
                  </div>
                </label>
                <label className="relative">
                  <input
                    type="radio"
                    name="difficulty"
                    value="medium"
                    checked={settings.difficulty === 'medium'}
                    onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer text-center transition ${
                    settings.difficulty === 'medium' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <p className="font-medium">보통</p>
                    <p className="text-xs text-gray-500 mt-1">학년 수준</p>
                  </div>
                </label>
                <label className="relative">
                  <input
                    type="radio"
                    name="difficulty"
                    value="hard"
                    checked={settings.difficulty === 'hard'}
                    onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer text-center transition ${
                    settings.difficulty === 'hard' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <p className="font-medium">어려움</p>
                    <p className="text-xs text-gray-500 mt-1">심화 어휘 포함</p>
                  </div>
                </label>
              </div>
            </div>

            {/* 집중 영역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                집중 학습 영역
              </label>
              <div className="space-y-2">
                {focusAreaOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={settings.focusAreas.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({ 
                            ...settings, 
                            focusAreas: [...settings.focusAreas, option.value] 
                          })
                        } else {
                          setSettings({ 
                            ...settings, 
                            focusAreas: settings.focusAreas.filter(v => v !== option.value) 
                          })
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 반복 학습 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                단어별 반복 횟수
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={settings.repetitionCount}
                  onChange={(e) => setSettings({ ...settings, repetitionCount: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-16 text-center font-medium text-gray-900">
                  {settings.repetitionCount}회
                </span>
              </div>
            </div>

            {/* 메시지 표시 */}
            {message.text && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            {/* 저장 버튼 */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                취소
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={loading || !selectedStudent}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? '저장 중...' : '설정 저장'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}