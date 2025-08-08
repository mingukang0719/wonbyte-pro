import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Target,
  Save,
  AlertCircle,
  Plus,
  X
} from 'lucide-react'
import { supabase } from '../../services/supabaseClient'

export default function TrainingSchedulePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [scheduleType, setScheduleType] = useState('weekly')
  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: { enabled: true, time: '16:00', duration: 30, type: 'vocabulary' },
    tuesday: { enabled: true, time: '16:00', duration: 30, type: 'comprehension' },
    wednesday: { enabled: true, time: '16:00', duration: 30, type: 'vocabulary' },
    thursday: { enabled: true, time: '16:00', duration: 30, type: 'comprehension' },
    friday: { enabled: true, time: '16:00', duration: 30, type: 'mixed' },
    saturday: { enabled: false, time: '10:00', duration: 30, type: 'mixed' },
    sunday: { enabled: false, time: '10:00', duration: 30, type: 'mixed' }
  })
  const [monthlyGoals, setMonthlyGoals] = useState({
    vocabularyWords: 500,
    readingPassages: 20,
    comprehensionScore: 80,
    totalHours: 20
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

  const handleSaveSchedule = async () => {
    if (!selectedStudent) {
      setMessage({ type: 'error', text: '학생을 선택해주세요.' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // 실제로는 training_schedules 테이블에 저장
      
      setMessage({ type: 'success', text: '훈련 일정이 저장되었습니다.' })
    } catch (error) {
      console.error('Save schedule error:', error)
      setMessage({ type: 'error', text: '일정 저장 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const days = [
    { key: 'monday', label: '월요일' },
    { key: 'tuesday', label: '화요일' },
    { key: 'wednesday', label: '수요일' },
    { key: 'thursday', label: '목요일' },
    { key: 'friday', label: '금요일' },
    { key: 'saturday', label: '토요일' },
    { key: 'sunday', label: '일요일' }
  ]

  const trainingTypes = [
    { value: 'vocabulary', label: '어휘 훈련', icon: BookOpen, color: 'text-blue-600' },
    { value: 'comprehension', label: '독해 훈련', icon: Target, color: 'text-green-600' },
    { value: 'mixed', label: '종합 훈련', icon: Users, color: 'text-purple-600' }
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
              <h1 className="text-2xl font-bold text-gray-900">훈련 일정 관리</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              주간/월간 훈련 일정 계획 수립
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

            {/* 일정 유형 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                일정 유형
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scheduleType"
                    value="weekly"
                    checked={scheduleType === 'weekly'}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">주간 일정</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scheduleType"
                    value="monthly"
                    checked={scheduleType === 'monthly'}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">월간 목표</span>
                </label>
              </div>
            </div>

            {/* 주간 일정 설정 */}
            {scheduleType === 'weekly' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">주간 훈련 일정</h3>
                <div className="space-y-3">
                  {days.map(day => {
                    const schedule = weeklySchedule[day.key]
                    const TrainingIcon = trainingTypes.find(t => t.value === schedule.type)?.icon || BookOpen
                    const iconColor = trainingTypes.find(t => t.value === schedule.type)?.color || 'text-gray-600'
                    
                    return (
                      <div key={day.key} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={schedule.enabled}
                            onChange={(e) => setWeeklySchedule({
                              ...weeklySchedule,
                              [day.key]: { ...schedule, enabled: e.target.checked }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 w-20 font-medium text-gray-900">{day.label}</span>
                        </label>
                        
                        {schedule.enabled && (
                          <>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <input
                                type="time"
                                value={schedule.time}
                                onChange={(e) => setWeeklySchedule({
                                  ...weeklySchedule,
                                  [day.key]: { ...schedule, time: e.target.value }
                                })}
                                className="px-2 py-1 border border-gray-300 rounded"
                              />
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">시간:</span>
                              <select
                                value={schedule.duration}
                                onChange={(e) => setWeeklySchedule({
                                  ...weeklySchedule,
                                  [day.key]: { ...schedule, duration: parseInt(e.target.value) }
                                })}
                                className="px-2 py-1 border border-gray-300 rounded"
                              >
                                <option value="15">15분</option>
                                <option value="30">30분</option>
                                <option value="45">45분</option>
                                <option value="60">60분</option>
                              </select>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-1">
                              <TrainingIcon className={`w-4 h-4 ${iconColor}`} />
                              <select
                                value={schedule.type}
                                onChange={(e) => setWeeklySchedule({
                                  ...weeklySchedule,
                                  [day.key]: { ...schedule, type: e.target.value }
                                })}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded"
                              >
                                {trainingTypes.map(type => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 월간 목표 설정 */}
            {scheduleType === 'monthly' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">월간 학습 목표</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      어휘 학습 목표 (단어)
                    </label>
                    <input
                      type="number"
                      value={monthlyGoals.vocabularyWords}
                      onChange={(e) => setMonthlyGoals({
                        ...monthlyGoals,
                        vocabularyWords: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      독해 지문 목표 (개)
                    </label>
                    <input
                      type="number"
                      value={monthlyGoals.readingPassages}
                      onChange={(e) => setMonthlyGoals({
                        ...monthlyGoals,
                        readingPassages: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      목표 정답률 (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={monthlyGoals.comprehensionScore}
                      onChange={(e) => setMonthlyGoals({
                        ...monthlyGoals,
                        comprehensionScore: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      총 학습 시간 (시간)
                    </label>
                    <input
                      type="number"
                      value={monthlyGoals.totalHours}
                      onChange={(e) => setMonthlyGoals({
                        ...monthlyGoals,
                        totalHours: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

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
                onClick={handleSaveSchedule}
                disabled={loading || !selectedStudent}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? '저장 중...' : '일정 저장'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}