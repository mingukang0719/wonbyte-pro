import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  ArrowLeft,
  User,
  School,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Save,
  AlertCircle,
  CheckCircle,
  UserPlus
} from 'lucide-react'
import { supabase } from '../../services/supabaseClient'

export default function StudentEditPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [student, setStudent] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    school_name: '',
    grade_level: '',
    teacher_id: ''
  })

  const GRADE_OPTIONS = [
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

  useEffect(() => {
    fetchStudentData()
    fetchTeachers()
  }, [id])

  const fetchStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setStudent(data)
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          school_name: data.school_name || '',
          grade_level: data.grade_level || '',
          teacher_id: data.teacher_id || ''
        })
      }
    } catch (error) {
      console.error('Fetch student error:', error)
      setMessage({ type: 'error', text: '학생 정보를 불러올 수 없습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'teacher')

      if (!error && data) {
        setTeachers(data)
      }
    } catch (error) {
      console.error('Fetch teachers error:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          email: formData.email || null,
          phone_number: formData.phone_number,
          school_name: formData.school_name,
          grade_level: formData.grade_level,
          teacher_id: formData.teacher_id || null
        })
        .eq('id', id)

      if (error) throw error
      
      setMessage({ type: 'success', text: '학생 정보가 성공적으로 업데이트되었습니다.' })
      setTimeout(() => {
        navigate('/admin/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Update student error:', error)
      setMessage({ type: 'error', text: '학생 정보 업데이트 중 오류가 발생했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-700">학생을 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    )
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
              <h1 className="text-2xl font-bold text-gray-900">학생 정보 수정</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* 프로필 아이콘 */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          {/* 메시지 표시 */}
          {message.text && (
            <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이름 */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="홍길동"
                />
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일 <span className="text-gray-400 text-xs">(선택사항)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* 연락처 */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                연락처
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="010-1234-5678"
                />
              </div>
            </div>

            {/* 학교 */}
            <div>
              <label htmlFor="school_name" className="block text-sm font-medium text-gray-700 mb-1">
                학교
              </label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="school_name"
                  name="school_name"
                  type="text"
                  required
                  value={formData.school_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="○○초등학교"
                />
              </div>
            </div>

            {/* 학년 */}
            <div>
              <label htmlFor="grade_level" className="block text-sm font-medium text-gray-700 mb-1">
                학년
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  id="grade_level"
                  name="grade_level"
                  required
                  value={formData.grade_level}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">학년 선택</option>
                  {GRADE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 담당 교사 */}
            {profile?.role === 'admin' && (
              <div>
                <label htmlFor="teacher_id" className="block text-sm font-medium text-gray-700 mb-1">
                  담당 교사
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    id="teacher_id"
                    name="teacher_id"
                    value={formData.teacher_id}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">미배정</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 계정 정보 */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-3">계정 정보</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <span className="font-medium">아이디:</span> {student?.username}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">가입일:</span> 
                  {new Date(student?.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}