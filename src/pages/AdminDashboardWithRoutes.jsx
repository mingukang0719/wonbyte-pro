import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { BarChart3, Users, FileText, Settings, LogOut, FileCode, Sparkles, History, BarChart } from 'lucide-react'
import TemplateManager from '../components/Admin/TemplateManager'
import ContentGenerator from '../components/Admin/ContentGenerator'

export default function AdminDashboardWithRoutes() {
  const [stats, setStats] = useState({
    totalUsers: 1245,
    totalContent: 567,
    todayGenerated: 89,
    activeUsers: 234
  })
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // 관리자 권한 확인
    const isAdmin = localStorage.getItem('isAdmin')
    const adminToken = localStorage.getItem('adminToken')
    if (!isAdmin && !adminToken) {
      navigate('/admin/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('adminToken')
    navigate('/')
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center mb-8">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            <h2 className="ml-2 text-xl font-bold text-gray-900">관리자 패널</h2>
          </div>
          
          <nav className="space-y-2">
            <Link
              to="/admin/dashboard"
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive('/admin/dashboard') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart className="h-5 w-5 mr-3" />
              대시보드
            </Link>
            
            <Link
              to="/admin/templates"
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive('/admin/templates') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileCode className="h-5 w-5 mr-3" />
              템플릿 관리
            </Link>
            
            <Link
              to="/admin/generate"
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive('/admin/generate') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Sparkles className="h-5 w-5 mr-3" />
              지문 생성
            </Link>
            
            <Link
              to="/admin/history"
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive('/admin/history') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <History className="h-5 w-5 mr-3" />
              생성 히스토리
            </Link>
            
            <Link
              to="/admin/analytics"
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive('/admin/analytics') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              사용 분석
            </Link>
          </nav>
          
          <div className="mt-8 pt-8 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">EduText Pro 관리자</h1>
          </div>
        </header>

        <main className="p-8">
          <Routes>
            <Route path="dashboard" element={<DashboardHome stats={stats} />} />
            <Route path="templates" element={<TemplateManager />} />
            <Route path="generate" element={<ContentGenerator />} />
            <Route path="history" element={<GenerationHistory />} />
            <Route path="analytics" element={<UsageAnalytics />} />
            <Route path="*" element={<DashboardHome stats={stats} />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// Dashboard Home Component
function DashboardHome({ stats }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">대시보드 개요</h2>
      
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

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">최근 활동</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { title: '수학 기초 개념', user: '홍길동', time: '5분 전', type: 'reading' },
              { title: '영어 문법 정리', user: '김철수', time: '15분 전', type: 'grammar' },
              { title: '과학 실험 가이드', user: '이영희', time: '30분 전', type: 'quiz' },
              { title: '역사 연표 정리', user: '박민수', time: '1시간 전', type: 'vocabulary' }
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.user} • {item.type}</p>
                </div>
                <span className="text-sm text-gray-400">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Placeholder Components
function GenerationHistory() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">생성 히스토리</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">생성 히스토리 기능이 곧 추가됩니다.</p>
      </div>
    </div>
  )
}

function UsageAnalytics() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">사용 분석</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">사용 분석 기능이 곧 추가됩니다.</p>
      </div>
    </div>
  )
}