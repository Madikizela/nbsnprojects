import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import ClientDashboard from './components/ClientDashboard'
import SDPDashboard from './components/SDPDashboard'
import SDPManagerDashboard from './components/SDPManagerDashboard'
import ResetPassword from './components/ResetPassword'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          <Route path="/sdp-dashboard" element={<SDPDashboard />} />
          <Route path="/sdp-manager-dashboard" element={<SDPManagerDashboard />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
