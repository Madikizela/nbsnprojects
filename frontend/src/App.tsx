import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import ClientDashboard from './components/ClientDashboard'
import SDPDashboard from './components/SDPDashboard'
import SDPManagerDashboard from './components/SDPManagerDashboard'
import ResetPassword from './components/ResetPassword'
import LearnerPortal from './components/LearnerPortal'
import LearnerResetPassword from './components/LearnerResetPassword'
import ExternalPortal from './components/ExternalPortal'
import { isTokenExpired, forceLogout } from './utils/api'
import './App.css'

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;  // 30 minutes
const WARNING_BEFORE_MS     =  2 * 60 * 1000;  // warn 2 min before logout

/** Redirects to /login if token is missing or expired */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login?reason=session_expired" replace />;
  }
  return <>{children}</>;
}

/** Tracks user activity and auto-logs out after INACTIVITY_TIMEOUT_MS of inactivity */
function InactivityWatcher() {
  const location = useLocation();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const isAuthPage = location.pathname === '/login' ||
                     location.pathname === '/reset-password' ||
                     location.pathname.startsWith('/learner');

  const reset = () => {
    setShowWarning(false);
    if (timer.current) clearTimeout(timer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);

    if (isAuthPage) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    warnTimer.current = setTimeout(() => setShowWarning(true), INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);
    timer.current = setTimeout(() => forceLogout('inactivity'), INACTIVITY_TIMEOUT_MS);
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
      if (warnTimer.current) clearTimeout(warnTimer.current);
    };
  }, [location.pathname]);

  if (!showWarning) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '32px 40px',
        maxWidth: 420, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏱️</div>
        <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>Still there?</h3>
        <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: 14 }}>
          Your session will expire in 2 minutes due to inactivity.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '10px 28px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer'
            }}>
            Keep me logged in
          </button>
          <button
            onClick={() => forceLogout('manual')}
            style={{
              padding: '10px 28px', borderRadius: 10,
              border: '1.5px solid #e2e8f0', background: '#fff',
              color: '#64748b', fontSize: 15, cursor: 'pointer'
            }}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  // Show a message if redirected due to session expiry
  const params = new URLSearchParams(window.location.search);
  const expiredMsg = params.get('reason') === 'session_expired'
    ? 'Your session has expired. Please sign in again.'
    : params.get('reason') === 'inactivity'
    ? 'You were logged out due to inactivity.'
    : null;

  return (
    <Router>
      <InactivityWatcher />
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login expiredMessage={expiredMsg} />} />
          <Route path="/dashboard"            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/client-dashboard"     element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
          <Route path="/sdp-dashboard"        element={<ProtectedRoute><SDPDashboard /></ProtectedRoute>} />
          <Route path="/sdp-manager-dashboard" element={<ProtectedRoute><SDPManagerDashboard /></ProtectedRoute>} />
          <Route path="/external-portal"      element={<ProtectedRoute><ExternalPortal /></ProtectedRoute>} />
          <Route path="/reset-password"       element={<ResetPassword />} />
          <Route path="/learner"              element={<LearnerPortal />} />
          <Route path="/learner-reset-password" element={<LearnerResetPassword />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
