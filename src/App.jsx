import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  console.log('App component rendering')
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <h1 className="text-3xl font-bold text-center pt-8">App is rendering</h1>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/test" element={<div>Test Page</div>} />
          <Route path="/admin/system" element={<div>Admin System Page</div>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App