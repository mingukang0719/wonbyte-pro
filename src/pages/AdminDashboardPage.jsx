import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  UserPlus,
  TrendingUp,
  Award,
  Activity,
  BookOpen,
  Target,
  Calendar
} from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function AdminDashboardPage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGrade, setFilterGrade] = useState('all')
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false)
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    averageAccuracy: 0,
    totalReadingTime: 0,
    completedAssignments: 0,
    pendingAssignments: 0
  })
  const [weeklyProgress, setWeeklyProgress] = useState([])
  const [gradeDistribution, setGradeDistribution] = useState([])

  useEffect(() => {
    if (user && profile) {
      fetchDashboardData()
    }
  }, [user, profile, activeTab])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchStudents(),
        fetchAssignments(),
        fetchStats(),
        fetchWeeklyProgress(),
        fetchGradeDistribution()
      ])
    } catch (error) {
      console.error('Dashboard data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    // daily_learning_stats 테이블이 없으므로 기본 프로필 정보만 가져오기
    const { data: allStudents, error: allError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')

    console.log('All students fetched:', allStudents)
    console.log('Fetch error:', allError)

    if (!allError && allStudents) {
      let filteredStudents = allStudents
      
      if (profile.role === 'teacher') {
        // 클라이언트에서 필터링: 자신의 학생 + 미배정 학생
        filteredStudents = allStudents.filter(student => 
          student.teacher_id === user.id || student.teacher_id === null
        )
        console.log('Filtered students for teacher:', filteredStudents)
      } else if (profile.role === 'parent') {
        filteredStudents = allStudents.filter(student => student.parent_id === user.id)
      }
      
      // 기본 통계값으로 설정
      const studentsWithStats = filteredStudents.map(student => ({
        ...student,
        todayCharsRead: 0,
        todayAccuracy: 0,
        todayReadingTime: 0
      }))
      
      console.log('Final students with stats:', studentsWithStats)
      setStudents(studentsWithStats)
    } else {
      console.error('Failed to fetch students:', allError)
      setStudents([])
    }
  }

  const fetchAssignments = async () => {
    let query = supabase
      .from('assignments')
      .select(`
        *,
        reading_materials(title, topic)
      `)
      .order('assigned_at', { ascending: false })

    // 관리자(admin)가 아닌 경우에만 필터링
    if (profile.role === 'teacher') {
      query = query.eq('assigned_by', profile.id)
    }
    // admin인 경우 모든 과제 조회 (필터링 없음)

    const { data, error } = await query

    if (!error && data) {
      // Fetch student details for each assignment
      const assignmentsWithStudents = await Promise.all(
        data.map(async (assignment) => {
          const { data: student } = await supabase
            .from('profiles')
            .select('full_name, grade_level')
            .eq('id', assignment.assigned_to)
            .single()
          
          return {
            ...assignment,
            student: student
          }
        })
      )
      setAssignments(assignmentsWithStudents)
    } else if (error) {
      console.error('Failed to fetch assignments:', error)
      setAssignments([])
    }
  }

  const fetchStats = async () => {
    try {
      // 전체 통계 계산
      const totalStudents = students.length
      const activeStudents = students.filter(s => s.todayCharsRead > 0).length
      const averageAccuracy = students.reduce((sum, s) => sum + s.todayAccuracy, 0) / (activeStudents || 1)
      const totalReadingTime = students.reduce((sum, s) => sum + s.todayReadingTime, 0)
      const completedAssignments = assignments.filter(a => a.status === 'completed').length
      const pendingAssignments = assignments.filter(a => a.status === 'pending').length

      setStats({
        totalStudents,
        activeStudents,
        averageAccuracy: Math.round(averageAccuracy),
        totalReadingTime,
        completedAssignments,
        pendingAssignments
      })
    } catch (error) {
      console.error('Stats calculation error:', error)
    }
  }

  const fetchWeeklyProgress = async () => {
    // 최근 7일간의 진행률 데이터
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    try {
      const { data, error } = await supabase
        .from('daily_learning_stats')
        .select('*')
        .in('date', last7Days)

      if (!error && data) {
        const progressData = last7Days.map(date => {
          const dayStats = data.filter(stat => stat.date === date)
          const avgAccuracy = dayStats.reduce((sum, stat) => sum + stat.accuracy_rate, 0) / (dayStats.length || 1)
          const totalChars = dayStats.reduce((sum, stat) => sum + stat.characters_read, 0)
          
          return {
            date: new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
            accuracy: Math.round(avgAccuracy),
            characters: totalChars
          }
        })
        setWeeklyProgress(progressData)
      }
    } catch (error) {
      console.error('Weekly progress fetch error:', error)
    }
  }

  const fetchGradeDistribution = async () => {
    // 학년별 분포 계산
    const distribution = students.reduce((acc, student) => {
      const grade = student.grade_level || '미지정'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {})

    const distributionData = Object.entries(distribution).map(([grade, count]) => ({
      name: grade,
      value: count
    }))

    setGradeDistribution(distributionData)
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.school_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrade = filterGrade === 'all' || student.grade_level === filterGrade
    const matchesUnassigned = !showUnassignedOnly || !student.teacher_id
    return matchesSearch && matchesGrade && matchesUnassigned
  })

  const handleAssignStudent = async (studentId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ teacher_id: user.id })
        .eq('id', studentId)

      if (error) throw error
      
      alert('학생이 성공적으로 배정되었습니다.')
      await fetchStudents()
    } catch (error) {
      console.error('Failed to assign student:', error)
      alert('학생 배정 중 오류가 발생했습니다.')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-50', text: '대기중' },
      in_progress: { icon: AlertCircle, color: 'text-blue-600 bg-blue-50', text: '진행중' },
      completed: { icon: CheckCircle, color: 'text-green-600 bg-green-50', text: '완료' }
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    )
  }

  const handleCreateAssignment = () => {
    navigate('/admin/create-assignment')
  }

  const handleViewStudent = (studentId) => {
    navigate(`/admin/students/${studentId}`)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">원바이트 PRO 관리자</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {profile?.full_name}님 ({profile?.role === 'teacher' ? '교사' : profile?.role === 'parent' ? '학부모' : '관리자'})
              </span>
              <button
                onClick={() => navigate('/admin/settings')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={signOut}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                개요
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4" />
                학생 관리
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'assignments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                과제 관리
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'training'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Target className="w-4 h-4" />
                훈련 관리
              </button>
            </nav>
          </div>
        </div>

        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">전체 학생</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}명</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">{stats.activeStudents}명</span>
                  <span className="text-gray-500 ml-1">오늘 활동</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">평균 정답률</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageAccuracy}%</p>
                  </div>
                  <Target className="w-8 h-8 text-green-500" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600">전주 대비 +5%</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">총 학습 시간</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.floor(stats.totalReadingTime / 60)}분</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-500" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-gray-500">평균 {Math.floor(stats.totalReadingTime / (stats.activeStudents || 1))}분/학생</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">과제 현황</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedAssignments}/{stats.completedAssignments + stats.pendingAssignments}</p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-500" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-orange-600 font-medium">{stats.pendingAssignments}개</span>
                  <span className="text-gray-500 ml-1">진행중</span>
                </div>
              </div>
            </div>

            {/* 차트 섹션 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 주간 진행률 차트 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">주간 학습 진행률</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" label={{ value: '정답률 (%)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: '글자수', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#8884d8" name="정답률" />
                    <Line yAxisId="right" type="monotone" dataKey="characters" stroke="#82ca9d" name="읽은 글자수" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 학년 분포 차트 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">학년별 분포</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
              <div className="space-y-4">
                {assignments.slice(0, 5).map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        assignment.status === 'completed' ? 'bg-green-500' :
                        assignment.status === 'in_progress' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{assignment.student?.full_name || '-'}</p>
                        <p className="text-xs text-gray-500">{assignment.reading_materials?.title || '-'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        -
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(assignment.assigned_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 학생 관리 탭 */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="이름, 이메일, 학교로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">전체 학년</option>
                  <option value="초1">초1</option>
                  <option value="초2">초2</option>
                  <option value="초3">초3</option>
                  <option value="초4">초4</option>
                  <option value="초5">초5</option>
                  <option value="초6">초6</option>
                  <option value="중1">중1</option>
                  <option value="중2">중2</option>
                  <option value="중3">중3</option>
                </select>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showUnassignedOnly}
                    onChange={(e) => setShowUnassignedOnly(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">미배정 학생만</span>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        학생 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        학년
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        오늘의 학습
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        정답률
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        학습 시간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center">
                          <div className="text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-lg font-medium">학생이 없습니다</p>
                            <p className="text-sm mt-1">
                              {showUnassignedOnly ? '미배정 학생이 없습니다.' : '등록된 학생이 없습니다.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {student.full_name}
                              </span>
                              {!student.teacher_id && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  미배정
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {student.grade_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.todayCharsRead.toLocaleString()}자
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900">{student.todayAccuracy}%</span>
                            {student.todayAccuracy >= 80 && (
                              <Award className="w-4 h-4 text-yellow-500 ml-1" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.todayReadingTime}분
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!student.teacher_id ? (
                            <button
                              onClick={() => handleAssignStudent(student.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                              title="나에게 배정"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-gray-400 mr-3" title="이미 배정됨">
                              <CheckCircle className="w-4 h-4" />
                            </span>
                          )}
                          <button
                            onClick={() => handleViewStudent(student.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/students/${student.id}/edit`)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 과제 관리 탭 */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">과제 목록</h3>
                <button
                  onClick={handleCreateAssignment}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  새 과제 만들기
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        과제명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        학생
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        배정일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        마감일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        점수
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.reading_materials.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.reading_materials.topic}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {assignment.student?.full_name || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.student?.grade_level || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(assignment.assigned_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assignment.due_date 
                            ? new Date(assignment.due_date).toLocaleDateString('ko-KR')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(assignment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          -
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 훈련 관리 탭 */}
        {activeTab === 'training' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">훈련 관리</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button 
                onClick={() => navigate('/admin/training/vocabulary')}
                className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
              >
                <BookOpen className="w-12 h-12 text-gray-400 group-hover:text-blue-500 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">어휘 훈련 설정</h4>
                <p className="text-sm text-gray-500 mt-2">학생별 어휘 훈련 난이도 및 목표 설정</p>
              </button>

              <button 
                onClick={() => navigate('/admin/training/comprehension')}
                className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition group"
              >
                <Target className="w-12 h-12 text-gray-400 group-hover:text-green-500 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-900 group-hover:text-green-600">독해력 훈련 설정</h4>
                <p className="text-sm text-gray-500 mt-2">독해 훈련 모듈 및 난이도 조정</p>
              </button>

              <button 
                onClick={() => navigate('/admin/training/schedule')}
                className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition group"
              >
                <Calendar className="w-12 h-12 text-gray-400 group-hover:text-purple-500 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-900 group-hover:text-purple-600">훈련 일정 관리</h4>
                <p className="text-sm text-gray-500 mt-2">주간/월간 훈련 일정 계획 수립</p>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}