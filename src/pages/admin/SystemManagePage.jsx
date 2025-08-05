import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Settings, 
  Users, 
  Database, 
  Activity,
  Shield,
  Server,
  LogOut,
  ChevronRight,
  BarChart,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function SystemManagePage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const systemStats = [
    { label: '총 사용자 수', value: '1,234', icon: Users, change: '+12%' },
    { label: '활성 세션', value: '89', icon: Activity, change: '+5%' },
    { label: '데이터베이스 사용량', value: '45.2GB', icon: Database, change: '+2.1GB' },
    { label: '서버 가동 시간', value: '99.9%', icon: Server, change: '0%' }
  ]

  const menuItems = [
    { 
      title: '사용자 관리', 
      description: '사용자 계정 및 권한 관리',
      icon: Users,
      path: '/admin/users',
      color: 'bg-blue-500'
    },
    { 
      title: '시스템 설정', 
      description: '시스템 전반 설정 및 구성',
      icon: Settings,
      path: '/admin/settings',
      color: 'bg-purple-500'
    },
    { 
      title: '보안 설정', 
      description: '보안 정책 및 접근 권한',
      icon: Shield,
      path: '/admin/security',
      color: 'bg-green-500'
    },
    { 
      title: '활동 로그', 
      description: '시스템 활동 및 감사 로그',
      icon: Activity,
      path: '/admin/logs',
      color: 'bg-orange-500'
    },
    { 
      title: '통계 및 분석', 
      description: '시스템 사용 통계 및 분석',
      icon: BarChart,
      path: '/admin/analytics',
      color: 'bg-indigo-500'
    },
    { 
      title: '데이터베이스', 
      description: '데이터베이스 관리 및 백업',
      icon: Database,
      path: '/admin/database',
      color: 'bg-red-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">시스템 관리</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'Administrator'}</p>
                <p className="text-xs text-gray-500">{profile?.role || 'admin'}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-8 h-8 text-gray-400" />
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Alert Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">시스템 알림</h3>
              <p className="text-sm text-yellow-700 mt-1">
                다음 정기 점검이 2024년 2월 15일에 예정되어 있습니다. 백업을 미리 준비해주세요.
              </p>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div className={`${item.color} p-3 rounded-lg text-white`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-4 text-left">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 mt-2 text-left">
                {item.description}
              </p>
            </button>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">관리자 로그인</span>
              </div>
              <span className="text-xs text-gray-500">방금 전</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">데이터베이스 백업 완료</span>
              </div>
              <span className="text-xs text-gray-500">2시간 전</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-700">시스템 업데이트 설치</span>
              </div>
              <span className="text-xs text-gray-500">어제</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}