import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  BookOpen, 
  Trophy, 
  Target, 
  TrendingUp,
  Calendar,
  Award,
  Clock,
  BarChart3,
  LogOut,
  User,
  Settings,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { supabase } from '../services/supabaseClient'

export default function StudentDashboardPage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    todayCharsRead: 0,
    todayAccuracy: 0,
    todayStudyTime: 0,
    streakDays: 0,
    totalCharsRead: 0,
    level: 1,
    nextLevelProgress: 0
  })
  const [recentAchievements, setRecentAchievements] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && profile) {
      fetchDashboardData()
    }
  }, [user, profile])

  const fetchDashboardData = async () => {
    try {
      // 오늘의 학습 통계 가져오기
      const today = new Date().toISOString().split('T')[0]
      const { data: todayStats } = await supabase
        .from('daily_learning_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      // 전체 통계 가져오기
      const { data: totalStats } = await supabase
        .from('daily_learning_stats')
        .select('characters_read, streak_days')
        .eq('user_id', user.id)

      // 최근 성취 가져오기
      const { data: achievements } = await supabase
        .from('learning_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false })
        .limit(3)

      // 할당된 과제 가져오기
      const { data: assignedTasks, error: assignError } = await supabase
        .from('assignments')
        .select(`
          *,
          reading_materials(
            id,
            title,
            topic,
            level,
            word_count
          )
        `)
        .eq('assigned_to', profile.id)
        .order('assigned_at', { ascending: false })

      if (!assignError && assignedTasks) {
        setAssignments(assignedTasks)
      }

      // 통계 계산
      const totalChars = totalStats?.reduce((sum, stat) => sum + (stat.characters_read || 0), 0) || 0
      const level = Math.floor(totalChars / 50000) + 1
      const currentLevelChars = totalChars % 50000
      const nextLevelProgress = (currentLevelChars / 50000) * 100

      setStats({
        todayCharsRead: todayStats?.characters_read || 0,
        todayAccuracy: todayStats?.accuracy_rate || 0,
        todayStudyTime: todayStats?.total_study_time || 0,
        streakDays: todayStats?.streak_days || 0,
        totalCharsRead: totalChars,
        level: level,
        nextLevelProgress: nextLevelProgress
      })

      setRecentAchievements(achievements || [])
    } catch (error) {
      console.error('Dashboard data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLevelTitle = (level) => {
    const titles = [
      '글자 탐험가', '문장 수집가', '단락 마스터', '지문 정복자', '독서 달인',
      '독서왕', '독서신', '독서전설'
    ]
    return titles[Math.min(level - 1, titles.length - 1)]
  }

  const formatStudyTime = (minutes) => {
    if (minutes < 60) return `${minutes}분`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}시간 ${mins}분`
  }

  const handleStartLearning = () => {
    navigate('/student/reading-trainer')
  }

  const handleStartAssignment = (assignment) => {
    // 과제 전용 학습 페이지로 이동
    navigate('/student/assignment-reading', { 
      state: { 
        assignmentId: assignment.id,
        materialId: assignment.material_id,
        assignmentData: assignment
      } 
    })
  }

  const getAssignmentStatusBadge = (status) => {
    const badges = {
      pending: { icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50', text: '대기중' },
      in_progress: { icon: Clock, color: 'text-blue-600 bg-blue-50', text: '진행중' },
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

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return '마감일 지남'
    if (diffDays === 0) return '오늘 마감'
    if (diffDays === 1) return '내일 마감'
    return `${diffDays}일 남음`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">원바이트 PRO</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {profile?.full_name}님 ({profile?.grade_level})
              </span>
              <button
                onClick={() => navigate('/profile')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <User className="w-5 h-5 text-gray-600" />
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
        {/* 오늘의 학습 현황 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">오늘의 학습 현황</h2>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <span className="text-lg font-semibold text-orange-500">
                연속 {stats.streakDays}일 학습 중! 🔥
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {stats.todayCharsRead.toLocaleString()}자
                </span>
              </div>
              <p className="text-sm text-gray-600">오늘 읽은 글자수</p>
            </div>

            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-6 h-6 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {stats.todayAccuracy}%
                </span>
              </div>
              <p className="text-sm text-gray-600">정답률</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-6 h-6 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">
                  {formatStudyTime(stats.todayStudyTime)}
                </span>
              </div>
              <p className="text-sm text-gray-600">학습 시간</p>
            </div>
          </div>
        </div>

        {/* 할당된 과제 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              나의 과제
            </h2>
            <span className="text-sm text-gray-500">
              총 {assignments.filter(a => a.status !== 'completed').length}개의 미완료 과제
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">아직 할당된 과제가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 5).map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => handleStartAssignment(assignment)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {assignment.reading_materials?.title || '제목 없음'}
                      </h3>
                      {getAssignmentStatusBadge(assignment.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>주제: {assignment.reading_materials?.topic || '-'}</span>
                      <span>난이도: {assignment.reading_materials?.level || '-'}</span>
                      <span>{assignment.reading_materials?.word_count || 0}자</span>
                      {assignment.due_date && (
                        <span className={`font-medium ${
                          getDaysRemaining(assignment.due_date).includes('지남') ? 'text-red-600' : 
                          getDaysRemaining(assignment.due_date).includes('오늘') ? 'text-orange-600' : 
                          'text-gray-600'
                        }`}>
                          {getDaysRemaining(assignment.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
              
              {assignments.length > 5 && (
                <button
                  onClick={() => navigate('/student/assignments')}
                  className="w-full py-2 text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  모든 과제 보기 ({assignments.length}개)
                </button>
              )}
            </div>
          )}
        </div>

        {/* 레벨 및 진도 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Lv.{stats.level} {getLevelTitle(stats.level)}
              </h3>
              <p className="text-sm text-gray-600">
                총 {stats.totalCharsRead.toLocaleString()}자 읽음
              </p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${stats.nextLevelProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-right">
            다음 레벨까지 {((50000 - (stats.totalCharsRead % 50000)) / 1000).toFixed(1)}K자
          </p>
        </div>

        {/* 빠른 시작 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={handleStartLearning}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-xl font-bold mb-2">새로운 학습 시작하기</h3>
                <p className="text-blue-100">AI가 생성한 맞춤 지문으로 학습해요</p>
              </div>
              <BookOpen className="w-12 h-12 text-white opacity-80" />
            </div>
          </button>

          <button
            onClick={() => navigate('/student/review')}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-xl font-bold mb-2">복습하기</h3>
                <p className="text-green-100">어휘와 오답노트를 복습해요</p>
              </div>
              <TrendingUp className="w-12 h-12 text-white opacity-80" />
            </div>
          </button>
        </div>

        {/* 최근 성취 */}
        {recentAchievements.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">최근 획득한 배지</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Award className="w-10 h-10 text-yellow-500" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{achievement.achievement_name}</h4>
                    <p className="text-sm text-gray-600">{achievement.achievement_description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}