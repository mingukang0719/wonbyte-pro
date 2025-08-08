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
import UserManagementPage from './pages/admin/UserManagementPage'
import StudentDetailPage from './pages/admin/StudentDetailPage'
import StudentProfilePage from './pages/StudentProfilePage'
import ReadingTrainerPage from './pages/ReadingTrainerPage'
import EditorPage from './pages/EditorPage'
import StudentEditPage from './pages/admin/StudentEditPage'
import VocabularyTrainingPage from './pages/admin/VocabularyTrainingPage'
import ComprehensionTrainingPage from './pages/admin/ComprehensionTrainingPage'
import TrainingSchedulePage from './pages/admin/TrainingSchedulePage'
import TestEnvPage from './pages/TestEnvPage'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <Router basename="/">
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/test-env" element={<TestEnvPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reading-trainer" element={<ReadingTrainerPage />} />
          <Route path="/editor" element={<EditorPage />} />

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
          <Route 
            path="/profile" 
            element={
              <PrivateRoute allowedRoles={['student']}>
                <StudentProfilePage />
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
                <ErrorBoundary>
                  <CreateAssignmentPage />
                </ErrorBoundary>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/students/:id" 
            element={
              <PrivateRoute allowedRoles={['teacher', 'parent', 'admin']}>
                <StudentDetailPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/students/:id/edit" 
            element={
              <PrivateRoute allowedRoles={['teacher', 'admin']}>
                <StudentEditPage />
              </PrivateRoute>
            } 
          />
          
          {/* Training Management Routes */}
          <Route 
            path="/admin/training/vocabulary" 
            element={
              <PrivateRoute allowedRoles={['teacher', 'admin']}>
                <VocabularyTrainingPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/training/comprehension" 
            element={
              <PrivateRoute allowedRoles={['teacher', 'admin']}>
                <ComprehensionTrainingPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/training/schedule" 
            element={
              <PrivateRoute allowedRoles={['teacher', 'admin']}>
                <TrainingSchedulePage />
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
          <Route 
            path="/admin/users" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <UserManagementPage />
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