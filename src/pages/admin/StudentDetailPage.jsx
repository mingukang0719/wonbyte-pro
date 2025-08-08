import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  ArrowLeft,
  User,
  School,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle,
  FileText,
  Activity,
  Mail,
  Phone,
  Edit,
  Download,
  BarChart3
} from 'lucide-react'
import { supabase } from '../../services/supabaseClient'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'

export default function StudentDetailPage() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState(null)
  const [learningStats, setLearningStats] = useState([])
  const [assignments, setAssignments] = useState([])
  const [monthlyProgress, setMonthlyProgress] = useState([])
  const [skillRadar, setSkillRadar] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (id) {
      fetchStudentData()
    }
  }, [id])

  const fetchStudentData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchStudentProfile(),
        fetchLearningStats(),
        fetchAssignments(),
        fetchMonthlyProgress(),
        fetchSkillAnalysis(),
        fetchRecentActivity()
      ])
    } catch (error) {
      console.error('Failed to fetch student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (!error && data) {
      setStudent(data)
    }
  }

  const fetchLearningStats = async () => {
    const { data, error } = await supabase
      .from('daily_learning_stats')
      .select('*')
      .eq('user_id', id)
      .order('date', { ascending: false })
      .limit(30)

    if (!error && data) {
      setLearningStats(data.reverse())
    }
  }

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        reading_materials!inner(title, difficulty_level),
        assignment_progress!left(
          completed_at,
          score,
          time_spent
        )
      `)
      .eq('assigned_to', id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAssignments(data)
    }
  }

  const fetchMonthlyProgress = async () => {
    // 최근 6개월 데이터
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return date
    }).reverse()

    const monthlyData = last6Months.map(date => {
      const monthStats = learningStats.filter(stat => {
        const statDate = new Date(stat.date)
        return statDate.getMonth() === date.getMonth() && 
               statDate.getFullYear() === date.getFullYear()
      })

      const avgAccuracy = monthStats.reduce((sum, stat) => sum + stat.accuracy_rate, 0) / (monthStats.length || 1)
      const totalChars = monthStats.reduce((sum, stat) => sum + stat.characters_read, 0)
      const totalTime = monthStats.reduce((sum, stat) => sum + stat.reading_time, 0)

      return {
        month: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' }),
        accuracy: Math.round(avgAccuracy),
        characters: totalChars,
        time: totalTime
      }
    })

    setMonthlyProgress(monthlyData)
  }

  const fetchSkillAnalysis = async () => {
    // 스킬별 분석 데이터 (실제로는 더 복잡한 계산이 필요)
    const skills = [
      { skill: '읽기 속도', score: 85 },
      { skill: '이해력', score: 78 },
      { skill: '어휘력', score: 82 },
      { skill: '집중도', score: 75 },
      { skill: '문법 이해', score: 80 },
      { skill: '추론 능력', score: 72 }
    ]
    setSkillRadar(skills)
  }

  const fetchRecentActivity = async () => {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select(`
        *,
        reading_materials!inner(title, topic)
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      setRecentActivity(data)
    }
  }

  const calculateOverallStats = () => {
    if (!learningStats.length) return { avgAccuracy: 0, totalChars: 0, totalTime: 0, improvement: 0 }

    const recentStats = learningStats.slice(-7) // 최근 7일
    const previousStats = learningStats.slice(-14, -7) // 그 전 7일

    const avgAccuracy = recentStats.reduce((sum, stat) => sum + stat.accuracy_rate, 0) / recentStats.length
    const totalChars = learningStats.reduce((sum, stat) => sum + stat.characters_read, 0)
    const totalTime = learningStats.reduce((sum, stat) => sum + stat.reading_time, 0)

    const prevAvgAccuracy = previousStats.length 
      ? previousStats.reduce((sum, stat) => sum + stat.accuracy_rate, 0) / previousStats.length
      : avgAccuracy

    const improvement = avgAccuracy - prevAvgAccuracy

    return {
      avgAccuracy: Math.round(avgAccuracy),
      totalChars,
      totalTime,
      improvement: Math.round(improvement * 10) / 10
    }
  }

  const getCompletionRate = () => {
    if (!assignments.length) return 0
    const completed = assignments.filter(a => a.status === 'completed').length
    return Math.round((completed / assignments.length) * 100)
  }

  const getStrengthsAndWeaknesses = () => {
    const sortedSkills = [...skillRadar].sort((a, b) => b.score - a.score)
    return {
      strengths: sortedSkills.slice(0, 2),
      weaknesses: sortedSkills.slice(-2)
    }
  }

  const overallStats = calculateOverallStats()
  const completionRate = getCompletionRate()
  const { strengths, weaknesses } = getStrengthsAndWeaknesses()

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
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">학생 정보를 찾을 수 없습니다.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">학생 상세 정보</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/admin/students/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
                정보 수정
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                리포트 다운로드
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 학생 정보 카드 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{student.full_name}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <School className="w-4 h-4" />
                    {student.school_name} {student.grade_level}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {student.email || '이메일 없음'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {student.phone_number}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">가입일</p>
              <p className="text-lg font-medium">{new Date(student.created_at).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>

          {/* 핵심 지표 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Target className="w-8 h-8 text-blue-500" />
                <span className={`text-sm font-medium ${overallStats.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overallStats.improvement >= 0 ? '+' : ''}{overallStats.improvement}%
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{overallStats.avgAccuracy}%</p>
              <p className="text-sm text-gray-600">평균 정답률</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <BookOpen className="w-8 h-8 text-green-500" />
              <p className="text-2xl font-bold text-gray-900 mt-2">{overallStats.totalChars.toLocaleString()}</p>
              <p className="text-sm text-gray-600">총 읽은 글자수</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <Clock className="w-8 h-8 text-purple-500" />
              <p className="text-2xl font-bold text-gray-900 mt-2">{Math.floor(overallStats.totalTime / 60)}시간</p>
              <p className="text-sm text-gray-600">총 학습 시간</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <CheckCircle className="w-8 h-8 text-orange-500" />
              <p className="text-2xl font-bold text-gray-900 mt-2">{completionRate}%</p>
              <p className="text-sm text-gray-600">과제 완료율</p>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                개요
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'progress'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                학습 진행률
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'assignments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                과제 현황
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'analysis'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                실력 분석
              </button>
            </nav>
          </div>
        </div>

        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 최근 학습 추이 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 30일 학습 추이</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={learningStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString('ko-KR')}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="accuracy_rate" 
                    stroke="#8884d8" 
                    name="정답률 (%)" 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="characters_read" 
                    stroke="#82ca9d" 
                    name="읽은 글자수" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 강점과 약점 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">강점과 개선점</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    강점
                  </h4>
                  <div className="space-y-2">
                    {strengths.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-green-900">{skill.skill}</span>
                        <span className="text-sm text-green-700">{skill.score}점</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    개선 필요
                  </h4>
                  <div className="space-y-2">
                    {weaknesses.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <span className="text-sm font-medium text-orange-900">{skill.skill}</span>
                        <span className="text-sm text-orange-700">{skill.score}점</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 추천 사항 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">맞춤 학습 추천</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 집중도 향상을 위한 짧은 텍스트부터 시작</li>
                  <li>• 추론 능력 개발을 위한 토론형 과제 추가</li>
                  <li>• 주 3회 이상 규칙적인 학습 습관 형성</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 학습 진행률 탭 */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* 월별 진행률 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 학습 진행률</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="accuracy" fill="#8884d8" name="평균 정답률 (%)" />
                  <Bar yAxisId="right" dataKey="characters" fill="#82ca9d" name="읽은 글자수" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 스킬 레이더 차트 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">문해력 스킬 분석</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={skillRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="현재 실력" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 과제 현황 탭 */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">과제 목록</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      과제명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      난이도
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      배정일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      완료일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      점수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      소요 시간
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assignment.reading_materials.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          assignment.reading_materials.difficulty_level === 'easy' 
                            ? 'bg-green-100 text-green-800'
                            : assignment.reading_materials.difficulty_level === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {assignment.reading_materials.difficulty_level === 'easy' ? '쉬움' :
                           assignment.reading_materials.difficulty_level === 'medium' ? '보통' : '어려움'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(assignment.assigned_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.assignment_progress?.[0]?.completed_at 
                          ? new Date(assignment.assignment_progress[0].completed_at).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          assignment.status === 'completed' 
                            ? 'bg-green-50 text-green-600'
                            : assignment.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-yellow-50 text-yellow-600'
                        }`}>
                          {assignment.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                           assignment.status === 'in_progress' ? <Activity className="w-3 h-3" /> :
                           <Clock className="w-3 h-3" />}
                          {assignment.status === 'completed' ? '완료' :
                           assignment.status === 'in_progress' ? '진행중' : '대기중'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.assignment_progress?.[0]?.score || '-'}점
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.assignment_progress?.[0]?.time_spent 
                          ? `${assignment.assignment_progress[0].time_spent}분`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 실력 분석 탭 */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* 최근 활동 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 학습 활동</h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.reading_materials.title}</p>
                        <p className="text-xs text-gray-500">{activity.reading_materials.topic}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{activity.accuracy}% 정답률</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 개선 추천 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">맞춤형 개선 추천</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">단기 목표 (1개월)</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 일일 학습 시간 30분으로 증가</li>
                    <li>• 평균 정답률 85% 달성</li>
                    <li>• 중급 난이도 텍스트 도전</li>
                  </ul>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">장기 목표 (3개월)</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• 읽기 속도 분당 200자 달성</li>
                    <li>• 고급 텍스트 이해력 향상</li>
                    <li>• 추론 문제 정답률 80% 이상</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}