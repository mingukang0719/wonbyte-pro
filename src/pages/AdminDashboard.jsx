import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Users, FileText, Settings, LogOut } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 1245,
    totalContent: 567,
    todayGenerated: 89,
    activeUsers: 234
  })
  const navigate = useNavigate()

  useEffect(() => {
    // 관리자 권한 확인
    const isAdmin = localStorage.getItem('isAdmin')
    if (!isAdmin) {
      navigate('/admin/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('isAdmin')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">EduText Pro 관리자</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-500 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5 mr-1" />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 사용자</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">생성된 콘텐츠</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">오늘 생성</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayGenerated}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">활성 사용자</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">최근 생성된 콘텐츠</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { title: '수학 기초 개념', user: '홍길동', time: '5분 전' },
                  { title: '영어 문법 정리', user: '김철수', time: '15분 전' },
                  { title: '과학 실험 가이드', user: '이영희', time: '30분 전' },
                  { title: '역사 연표 정리', user: '박민수', time: '1시간 전' }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.user}</p>
                    </div>
                    <span className="text-sm text-gray-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">시스템 설정</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <button className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50">
                  <Settings className="h-5 w-5 text-gray-400 mr-3" />
                  <span>일반 설정</span>
                </button>
                <button className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <span>사용자 관리</span>
                </button>
                <button className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <span>콘텐츠 관리</span>
                </button>
                <button className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50">
                  <BarChart3 className="h-5 w-5 text-gray-400 mr-3" />
                  <span>분석 및 리포트</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}