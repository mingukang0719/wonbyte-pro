import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  console.log('PrivateRoute: State check', {
    loading,
    user,
    profile,
    allowedRoles,
    currentPath: location.pathname
  })

  // 로딩 중일 때
  if (loading) {
    console.log('PrivateRoute: Loading state')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // 로그인하지 않은 경우
  if (!user) {
    console.log('PrivateRoute: No user, redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 프로필 로딩 중일 때
  if (!profile) {
    console.log('PrivateRoute: No profile yet')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // 역할이 허용되지 않은 경우
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    // 역할에 따라 적절한 페이지로 리다이렉트
    if (profile.role === 'student') {
      return <Navigate to="/student/dashboard" replace />
    } else if (['teacher', 'parent'].includes(profile.role)) {
      return <Navigate to="/admin/dashboard" replace />
    } else if (profile.role === 'admin') {
      return <Navigate to="/admin/system" replace />
    }
    
    // 기본 리다이렉트
    return <Navigate to="/unauthorized" replace />
  }

  console.log('PrivateRoute: All checks passed, rendering children')
  return children
}