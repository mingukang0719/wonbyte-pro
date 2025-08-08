import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/auth/PrivateRoute'

// Pages
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import HomePage from './pages/HomePage'
import StudentDashboardPage from './pages/StudentDashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import SystemManagePage from './pages/admin/SystemManagePage'
import CreateAssignmentPage from './pages/admin/CreateAssignmentPage'
import ReadingTrainerPage from './pages/ReadingTrainerPage'
import EditorPage from './pages/EditorPage'

function App() {
  return (
    <Router basename="/">
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Student Routes */}
          <Route 
            path="/student/dashboard" 
            element={
              <PrivateRoute allowedRoles={['student']}>
                <StudentDashboardPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/student/reading-trainer" 
            element={
              <PrivateRoute allowedRoles={['student']}>
                <ReadingTrainerPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/student/editor" 
            element={
              <PrivateRoute allowedRoles={['student']}>
                <EditorPage />
              </PrivateRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <PrivateRoute allowedRoles={['teacher', 'parent', 'admin']}>
                <AdminDashboardPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/create-assignment" 
            element={
              <PrivateRoute allowedRoles={['teacher', 'admin']}>
                <CreateAssignmentPage />
              </PrivateRoute>
            } 
          />
          
          {/* System Admin Routes */}
          <Route 
            path="/admin/system" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <SystemManagePage />
              </PrivateRoute>
            } 
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App