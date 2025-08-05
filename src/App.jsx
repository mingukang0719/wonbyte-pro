import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { config } from './config'
import { AuthProvider } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import StudentDashboardPage from './pages/StudentDashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import CreateAssignmentPage from './pages/admin/CreateAssignmentPage'
import SystemManagePage from './pages/admin/SystemManagePage'
import ReadingTrainerPage from './pages/ReadingTrainerPage'
import TestPage from './pages/TestPage'
import PrivateRoute from './components/auth/PrivateRoute'

function App() {
  
  return (
    <Router basename={config.basename}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/test" element={<TestPage />} />
            
            {/* Student routes */}
            <Route path="/student/dashboard" element={
              <PrivateRoute allowedRoles={['student']}>
                <StudentDashboardPage />
              </PrivateRoute>
            } />
            
            {/* Admin routes (teacher, parent, admin) */}
            <Route path="/admin/dashboard" element={
              <PrivateRoute allowedRoles={['teacher', 'parent', 'admin']}>
                <AdminDashboardPage />
              </PrivateRoute>
            } />
            <Route path="/admin/assignments/new" element={
              <PrivateRoute allowedRoles={['teacher', 'parent', 'admin']}>
                <CreateAssignmentPage />
              </PrivateRoute>
            } />
            <Route path="/admin/system" element={<SystemManagePage />} />
            <Route path="/admin/system-protected" element={
              <PrivateRoute allowedRoles={['admin']}>
                <SystemManagePage />
              </PrivateRoute>
            } />
            
            {/* Legacy routes - will be updated */}
            <Route path="/reading-trainer" element={
              <PrivateRoute allowedRoles={['student']}>
                <ReadingTrainerPage />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App