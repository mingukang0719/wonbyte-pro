import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { config } from './config'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import ReadingTrainerPage from './pages/ReadingTrainerPage'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminDashboardWithRoutes from './pages/AdminDashboardWithRoutes'

function App() {
  
  return (
    <Router basename={config.basename}>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/reading-trainer" element={<ReadingTrainerPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/*" element={<AdminDashboardWithRoutes />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App