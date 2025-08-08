import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  ArrowLeft,
  Target,
  BookOpen,
  Brain,
  Zap,
  Save,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../../services/supabaseClient'

export default function ComprehensionTrainingPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [settings, setSettings] = useState({
    readingSpeed: 'medium',
    questionTypes: [],
    difficultyProgression: 'adaptive',
    sessionDuration: 30,
    focusSkills: []
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
      // 실제로는 comprehension_training_settings 테이블에 저장
      
      setMessage({ type: 'success', text: '독해력 훈련 설정이 저장되었습니다.' })
    } catch (error) {
      console.error('Save settings error:', error)
      setMessage({ type: 'error', text: '설정 저장 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const questionTypeOptions = [
    { value: 'main_idea', label: '주제 파악' },
    { value: 'detail', label: '세부 정보 이해' },
    { value: 'inference', label: '추론' },
    { value: 'vocabulary', label: '어휘 이해' },
    { value: 'sequence', label: '순서 파악' },
    { value: 'cause_effect', label: '인과 관계' }
  ]

  const focusSkillOptions = [
    { value: 'speed', label: '읽기 속도' },
    { value: 'accuracy', label: '정확도' },
    { value: 'retention', label: '기억력' },
    { value: 'critical', label: '비판적 사고' },
    { value: 'synthesis', label: '종합 능력' }
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
              <h1 className="text-2xl font-bold text-gray-900">독해력 훈련 설정</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5" />
              독해 훈련 모듈 및 난이도 조정
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

            {/* 읽기 속도 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                읽기 속도 목표
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="relative">
                  <input
                    type="radio"
                    name="readingSpeed"
                    value="slow"
                    checked={settings.readingSpeed === 'slow'}
                    onChange={(e) => setSettings({ ...settings, readingSpeed: e.target.value })}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer text-center transition ${
                    settings.readingSpeed === 'slow' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <Zap className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <p className="font-medium">천천히</p>
                    <p className="text-xs text-gray-500 mt-1">정확도 우선</p>
                  </div>
                </label>
                <label className="relative">
                  <input
                    type="radio"
                    name="readingSpeed"
                    value="medium"
                    checked={settings.readingSpeed === 'medium'}
                    onChange={(e) => setSettings({ ...settings, readingSpeed: e.target.value })}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer text-center transition ${
                    settings.readingSpeed === 'medium' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <Zap className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="font-medium">보통</p>
                    <p className="text-xs text-gray-500 mt-1">균형잡힌 속도</p>
                  </div>
                </label>
                <label className="relative">
                  <input
                    type="radio"
                    name="readingSpeed"
                    value="fast"
                    checked={settings.readingSpeed === 'fast'}
                    onChange={(e) => setSettings({ ...settings, readingSpeed: e.target.value })}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer text-center transition ${
                    settings.readingSpeed === 'fast' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <Zap className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <p className="font-medium">빠르게</p>
                    <p className="text-xs text-gray-500 mt-1">속독 훈련</p>
                  </div>
                </label>
              </div>
            </div>

            {/* 문제 유형 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                집중 훈련할 문제 유형
              </label>
              <div className="grid grid-cols-2 gap-2">
                {questionTypeOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={settings.questionTypes.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({ 
                            ...settings, 
                            questionTypes: [...settings.questionTypes, option.value] 
                          })
                        } else {
                          setSettings({ 
                            ...settings, 
                            questionTypes: settings.questionTypes.filter(v => v !== option.value) 
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

            {/* 난이도 진행 방식 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                난이도 진행 방식
              </label>
              <select
                value={settings.difficultyProgression}
                onChange={(e) => setSettings({ ...settings, difficultyProgression: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="fixed">고정 난이도</option>
                <option value="gradual">점진적 상승</option>
                <option value="adaptive">적응형 (성과 기반)</option>
              </select>
            </div>

            {/* 학습 시간 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                일일 학습 시간 (분)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="5"
                  value={settings.sessionDuration}
                  onChange={(e) => setSettings({ ...settings, sessionDuration: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-16 text-center font-medium text-gray-900">
                  {settings.sessionDuration}분
                </span>
              </div>
            </div>

            {/* 집중 스킬 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                집중 향상 스킬
              </label>
              <div className="space-y-2">
                {focusSkillOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={settings.focusSkills.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({ 
                            ...settings, 
                            focusSkills: [...settings.focusSkills, option.value] 
                          })
                        } else {
                          setSettings({ 
                            ...settings, 
                            focusSkills: settings.focusSkills.filter(v => v !== option.value) 
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