import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import ClientDashboard from './components/ClientDashboard'
import SDPDashboard from './components/SDPDashboard'
import SDPManagerDashboard from './components/SDPManagerDashboard'
import ResetPassword from './components/ResetPassword'
import LearnerPortal from './components/LearnerPortal'
import LearnerResetPassword from './components/LearnerResetPassword'
import ExternalPortal from './components/ExternalPortal'
import PopiaPolicyPage from './components/PopiaPolicyPage'
import {
  isTokenExpired,
  forceLogout,
  AUTH_LOGOUT_EVENT,
  getUserRoleInfo,
  getStoredUser,
  getStoredLearner,
  type NormalizedUser,
  type RoleInfo,
} from './utils/api'
import './App.css'

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;  // 30 minutes
const WARNING_BEFORE_MS     =  2 * 60 * 1000;  // warn 2 min before logout

/**
 * The standard 401 redirect target: clear state and land on login screen.
 * Only used inside components that have access to useNavigate (not the raw
 * forceLogout utility which is shared with non-React callers).
 */
function useAuthRedirectOnLogout() {
  const navigate = useNavigate();
  useEffect(() => {
    const onLogout = (evt: Event) => {
      const reason = (evt as CustomEvent<string>).detail || 'session_expired';
      navigate(`/login?reason=${encodeURIComponent(reason)}`, { replace: true });
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout as EventListener);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout as EventListener);
  }, [navigate]);
}

/** Shared predicate — true when the user is currently on a "staff" dashboard page. */
function isStaffDashboard(path: string): boolean {
  return (
    path.startsWith('/dashboard') ||
    path.startsWith('/client-dashboard') ||
    path.startsWith('/sdp-dashboard') ||
    path.startsWith('/sdp-manager-dashboard') ||
    path.startsWith('/external-portal')
  );
}

/** Shared predicate — true for learner portal pages. */
function isLearnerDashboard(path: string): boolean {
  return path.startsWith('/learner');
}

/** Redirects to /login if the staff token is missing or expired. */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login?reason=session_expired" replace />;
  }
  return <>{children}</>;
}

/**
 * Enforce role-based access control for a route.
 * The predicate receives the normalized RoleInfo for the stored user
 * and returns true if the user is allowed on this route.
 * If the user fails the check they are redirected to /login with reason=unauthorized.
 */
function RoleProtectedRoute({
  children,
  allow,
}: {
  children: ReactNode;
  allow: (roles: RoleInfo, user: NormalizedUser | null) => boolean;
}) {
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login?reason=session_expired" replace />;
  }
  const user = getStoredUser();
  const roles = getUserRoleInfo(user);
  if (!allow(roles, user)) {
    // Clear token so a follow-up login redirect can happen cleanly without stale state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login?reason=unauthorized" replace />;
  }
  return <>{children}</>;
}

/**
 * Guard for /learner* pages — checks learner_token (separate auth store).
 * If there is no valid learner token, the route still renders — LearnerPortal
 * will show its built-in login form. We still gate because the InactivityWatcher
 * should count it as an "authed page" only when a learner is actually signed in.
 */
function LearnerProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = getStoredLearner();
  if (token && isTokenExpired(token)) {
    // Learner token expired — clear so the portal falls back to login screen.
    localStorage.removeItem('learner_token');
    localStorage.removeItem('learner_user');
  }
  return <>{children}</>;
}

/**
 * Global inactivity watcher.
 *
 * - Staff dashboards: always active (existing 30-min behaviour + warning dialog).
 * - Learner portal: now ALSO protected (C3 fix — previously Learner paths were
 *   explicitly excluded from the inactivity watcher, meaning a learner who
 *   walked away from a shared-lab PC stayed logged in forever).
 * - Auth pages (/login, /reset-password, /learner-reset-password): never start
 *   the timer — logging in is impossible if you get auto-kicked from the login screen.
 */
function InactivityWatcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReset = useRef<number>(0);
  const [showWarning, setShowWarning] = useState(false);

  useAuthRedirectOnLogout();

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/reset-password' ||
    location.pathname === '/learner-reset-password';

  const isLearnerPage = isLearnerDashboard(location.pathname);
  const isStaffPage = isStaffDashboard(location.pathname);
  const isProtected = !isAuthPage && (isStaffPage || isLearnerPage);

  // Determine whether there is currently an *active* (authenticated) session on this page type
  const hasActiveSession = (): boolean => {
    if (isStaffPage) {
      const t = localStorage.getItem('token');
      return !!t && !isTokenExpired(t);
    }
    if (isLearnerPage) {
      const { token: lt } = getStoredLearner();
      return !!lt && !isTokenExpired(lt);
    }
    return false;
  };

  const reset = () => {
    setShowWarning(false);
    if (timer.current) clearTimeout(timer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);

    // Debounce: don't clear+reschedule the timers more than once per 5 seconds —
    // a scroll event fires 60x/sec, we don't need 60 setTimeout re-sets per second.
    const now = Date.now();
    if (now - lastReset.current < 5000) return;
    lastReset.current = now;

    if (!isProtected) return;
    if (!hasActiveSession()) return;

    warnTimer.current = setTimeout(() => setShowWarning(true), INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);
    timer.current = setTimeout(
      () => {
        // Clear the right token for whichever page type we're on
        if (isStaffPage) {
          forceLogout('inactivity');
        } else if (isLearnerPage) {
          localStorage.removeItem('learner_token');
          localStorage.removeItem('learner_user');
          // Force a soft navigation back to the learner portal itself (re-renders its own login form)
          navigate('/learner', { replace: true });
          // Also set showWarning=false to dismiss the modal that triggered this
          setShowWarning(false);
        }
      },
      INACTIVITY_TIMEOUT_MS,
    );
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    const listeners: Array<() => void> = [];
    events.forEach((e) => {
      const handler = reset.bind(null);
      window.addEventListener(e, handler, { passive: true });
      listeners.push(handler);
    });
    reset();
    return () => {
      events.forEach((e, i) => window.removeEventListener(e, listeners[i]));
      if (timer.current) clearTimeout(timer.current);
      if (warnTimer.current) clearTimeout(warnTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!showWarning) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '32px 40px',
          maxWidth: 420,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏱️</div>
        <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>Still there?</h3>
        <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: 14 }}>
          Your session will expire in 2 minutes due to inactivity.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '10px 28px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Keep me logged in
          </button>
          <button
            onClick={() => {
              setShowWarning(false);
              if (isStaffPage) forceLogout('manual');
              else if (isLearnerPage) {
                localStorage.removeItem('learner_token');
                localStorage.removeItem('learner_user');
                navigate('/learner', { replace: true });
              }
            }}
            style={{
              padding: '10px 28px',
              borderRadius: 10,
              border: '1.5px solid #e2e8f0',
              background: '#fff',
              color: '#64748b',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Subscribes to the AUTH_LOGOUT_EVENT custom event *before* any routes mount so
 * we catch logouts that fire very early in the lifecycle (during StrictMode
 * double-mount, from a 401 during initial data fetches, etc.).
 */
function LogoutEventBridge() {
  useAuthRedirectOnLogout();
  return null;
}

function App() {
  // Show a message if redirected due to session expiry / unauth access
  const params = new URLSearchParams(window.location.search);
  const expiredMsg =
    params.get('reason') === 'session_expired'
      ? 'Your session has expired. Please sign in again.'
      : params.get('reason') === 'inactivity'
      ? 'You were logged out due to inactivity.'
      : params.get('reason') === 'unauthorized'
      ? 'You do not have permission to access that page. Please sign in with the correct account.'
      : null;

  return (
    <Router>
      <LogoutEventBridge />
      <InactivityWatcher />
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login expiredMessage={expiredMsg} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/popia-policy" element={<PopiaPolicyPage />} />
          <Route
            path="/learner-reset-password"
            element={<LearnerResetPassword />}
          />

          {/* Role-gated staff routes — C2: one predicate per route */}
          <Route
            path="/dashboard"
            element={
              <RoleProtectedRoute allow={(r) => r.isSysAdmin}>
                <Dashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/client-dashboard"
            element={
              <RoleProtectedRoute allow={(r) => r.isSysAdmin || r.isClient}>
                <ClientDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/sdp-dashboard"
            element={
              <RoleProtectedRoute allow={(r) => r.isSysAdmin || r.isSDP || r.isManager}>
                <SDPDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/sdp-manager-dashboard"
            element={
              <RoleProtectedRoute allow={(r) => r.isSysAdmin || r.isManager}>
                <SDPManagerDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/external-portal"
            element={
              <RoleProtectedRoute allow={(r) => r.isSysAdmin || r.isExternal}>
                <ExternalPortal />
              </RoleProtectedRoute>
            }
          />

          {/* Learner portal — learner_token store + inactivity watcher now enabled for it (C3) */}
          <Route
            path="/learner"
            element={
              <LearnerProtectedRoute>
                <LearnerPortal />
              </LearnerProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
