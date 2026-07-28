import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import productIcon from '../assets/mobile_icon.png';
import {
  EyeIcon,
  EyeOffIcon,
  SignInIcon
} from './CustomIcons';
import ForgotPassword from './ForgotPassword';
import { apiCall } from '../utils/api';
import PopiaConsentModal, { POPIA_CONSENT_KEY } from './PopiaConsentModal';

const Login: React.FC<{ expiredMessage?: string | null }> = ({ expiredMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(expiredMessage || '');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPopiaModal, setShowPopiaModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    
    // Validate form
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);
    
    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);
    
    if (emailValidationError || passwordValidationError) {
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Normalize user object keys across different backends (camelCase vs PascalCase)
        const normalizedUser = {
          id: data.user?.id ?? data.user?.Id,
          name: data.user?.name ?? data.user?.Name ?? `${data.user?.firstName ?? data.user?.FirstName} ${data.user?.lastName ?? data.user?.LastName}`,
          firstName: data.user?.firstName ?? data.user?.FirstName,
          lastName: data.user?.lastName ?? data.user?.LastName,
          email: data.user?.email ?? data.user?.Email,
          role: data.user?.role ?? data.user?.Role,
          status: data.user?.status ?? data.user?.Status,
          userType: data.user?.userType ?? data.user?.UserType,
          accessLevel: data.user?.accessLevel ?? data.user?.AccessLevel ?? 0,
          clientId: data.user?.clientId ?? data.user?.ClientId ?? null,
          clientName: data.user?.clientName ?? data.user?.ClientName ?? null,
          skillsDevelopmentProviderId: data.user?.skillsDevelopmentProviderId ?? data.user?.SkillsDevelopmentProviderId ?? null,
          skillsDevelopmentProviderName: data.user?.skillsDevelopmentProviderName ?? data.user?.SkillsDevelopmentProviderName ?? null,
          departmentId: data.user?.departmentId ?? data.user?.DepartmentId ?? null,
          departmentName: data.user?.departmentName ?? data.user?.DepartmentName ?? null,
          projectCount: data.user?.projectCount ?? data.user?.ProjectCount ?? 0,
          activeProjectCount: data.user?.activeProjectCount ?? data.user?.ActiveProjectCount ?? 0,
          departmentCount: data.user?.departmentCount ?? data.user?.DepartmentCount ?? 0,
        };
        
        // Store authentication data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        
        // Determine role from normalized user
        const isClient =
          normalizedUser.role === 'ClientAdmin' ||
          normalizedUser.role === '2' ||
          normalizedUser.userType === 'ClientAdmin' ||
          normalizedUser.accessLevel === 3 ||
          (typeof normalizedUser.clientId === 'number' && normalizedUser.clientId !== null && normalizedUser.clientId > 0);

        const isSDP = 
          normalizedUser.role === 'SDPAdministrator' ||
          normalizedUser.role === '3' ||
          normalizedUser.userType === 'SDPAdmin' ||
          (typeof normalizedUser.skillsDevelopmentProviderId === 'number' && normalizedUser.skillsDevelopmentProviderId !== null && normalizedUser.skillsDevelopmentProviderId > 0);

        // Enhanced logic for specific manager dashboards
        const role = String(normalizedUser.role);
        const deptName = (normalizedUser.departmentName || '').toLowerCase();
        
        // Logistics Manager/Support
        const isLogistics = role === '5' || role === '12' || deptName.includes('logistic');
        
        // QA Manager/Support (Moderators and Assessors)
        const isQA = role === '7' || role === '14' || role === '8' || role === 'SDPModerator' || role === 'SDPAssessor' || deptName.includes('quality') || deptName.includes('moderator') || deptName.includes('assessor');
        
        // Admin Manager/Support
        const isAdminManager = (role === '3' && normalizedUser.departmentId) || role === '15' || (role === 'SDPAdministrator' && normalizedUser.departmentId) || deptName.includes('admin');
        
        // Finance Manager/Support
        const isFinance = role === '4' || role === '11' || deptName.includes('finance');
        
        // IT Manager/Support
        const isIT = role === '6' || role === '13' || role === 'SDPIT' || deptName.includes('it');

        // Determine the target route for this user
        let targetRoute = '/dashboard';
        if (role === '18' || role === 'ExternalUser') {
          targetRoute = '/external-portal';
        } else if (isLogistics || isQA || isAdminManager || isFinance || isIT) {
          targetRoute = '/sdp-manager-dashboard';
        } else if (isSDP) {
          targetRoute = '/sdp-dashboard';
        } else if (isClient) {
          targetRoute = '/client-dashboard';
        }

        // POPIA: gate the navigation behind consent if not already accepted
        const popiaRecord = localStorage.getItem(POPIA_CONSENT_KEY);
        if (!popiaRecord) {
          setPendingRoute(targetRoute);
          setShowPopiaModal(true);
          setIsLoading(false);
          return;
        }

        navigate(targetRoute);
      } else {
        const text = await response.text();
        let errorMessage = 'Login failed';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += `\nDetails: ${errorData.details}`;
          }
        } catch {
          errorMessage = `Server Error (${response.status}): ${text.substring(0, 100)}...`;
        }
        setError(errorMessage);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Please try again.';
      setError(`Network error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePopiaAccept = () => {
    setShowPopiaModal(false);
    if (pendingRoute) navigate(pendingRoute);
  };

  const handlePopiaDecline = () => {
    // Clear token & state — user refused consent
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setShowPopiaModal(false);
    setPendingRoute(null);
    setError('You must accept the POPIA Privacy Notice to use this system.');
  };

  // Show forgot password component if requested
  if (showForgotPassword) {
    return <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* POPIA Consent Modal — shown on first login before routing */}
      {showPopiaModal && (
        <PopiaConsentModal onAccept={handlePopiaAccept} onDecline={handlePopiaDecline} />
      )}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-input {
          width: 100%;
          padding: 13px 44px 13px 44px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          background: #f8fafc;
          color: #1e293b;
          transition: all 0.2s;
          outline: none;
        }
        .login-input:focus {
          border-color: #667eea;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(102,126,234,0.12);
        }
        .login-input.error { border-color: #ef4444; box-shadow: 0 0 0 4px rgba(239,68,68,0.1); }
        .login-input.valid { border-color: #10b981; box-shadow: 0 0 0 4px rgba(16,185,129,0.1); }
        .sign-in-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.3px;
        }
        .sign-in-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102,126,234,0.45);
        }
        .sign-in-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          background: rgba(255,255,255,0.1);
          border-radius: 14px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          margin-bottom: 12px;
          animation: fadeInUp 0.6s ease both;
        }
        .feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .left-panel { display: none !important; }
          .right-panel { width: 100% !important; }
        }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="left-panel" style={{
        width: '50%',
        background: 'linear-gradient(145deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradientShift 12s ease infinite',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background circles */}
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'rgba(102,126,234,0.15)', top:'-100px', left:'-100px', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'rgba(118,75,162,0.2)', bottom:'-80px', right:'-80px', filter:'blur(40px)' }} />

        {/* Logo + title */}
        <div style={{ textAlign:'center', marginBottom:48, animation:'floatUp 4s ease-in-out infinite' }}>
          <img src={productIcon} alt="NBSN" style={{ width:120, height:120, borderRadius:28, objectFit:'contain', filter:'drop-shadow(0 12px 32px rgba(102,126,234,0.5))' }} />
          <h1 style={{ color:'#fff', fontSize:32, fontWeight:800, margin:'20px 0 6px', letterSpacing:0.5 }}>NBSN Portal</h1>
          <p style={{ color:'rgba(255,255,255,0.65)', fontSize:15, margin:0 }}>Skills Development & Training</p>
        </div>

        {/* Feature list */}
        <div style={{ width:'100%', maxWidth:340 }}>
          {[
            { icon:'🎓', title:'Learner Management', desc:'Enroll and track learner progress' },
            { icon:'👆', title:'Biometric Attendance', desc:'Fingerprint & face recognition' },
            { icon:'📊', title:'Assessments & Reports', desc:'Formative, summative & logbooks' },
            { icon:'📍', title:'Site & Project Tracking', desc:'GPS-verified attendance clocking' },
          ].map((f, i) => (
            <div key={i} className="feature-item" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <div>
                <div style={{ color:'#fff', fontWeight:600, fontSize:14 }}>{f.title}</div>
                <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, marginTop:2 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={{ position:'absolute', bottom:24, color:'rgba(255,255,255,0.35)', fontSize:12 }}>
          © {new Date().getFullYear()} NBSN Projects
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="right-panel" style={{
        width: '50%',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        overflowY: 'auto',
      }}>
        <div style={{ width:'100%', maxWidth:420, animation:'fadeInUp 0.5s ease' }}>

          {/* Header */}
          <div style={{ marginBottom:36 }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:'#1e293b', margin:'0 0 6px' }}>Welcome back 👋</h2>
            <p style={{ color:'#64748b', fontSize:15, margin:0 }}>Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'12px 16px', marginBottom:20, color:'#dc2626', fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
              <i className="bi bi-exclamation-triangle-fill"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:14, fontWeight:600, color:'#374151', marginBottom:8 }}>
                Email Address
              </label>
              <div style={{ position:'relative' }}>
                <i className="bi bi-envelope" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:16 }}></i>
                <input
                  type="email"
                  className={`login-input${emailError ? ' error' : email && !emailError ? ' valid' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={handleEmailChange}
                />
                {email && !emailError && <i className="bi bi-check-circle-fill" style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'#10b981', fontSize:16 }}></i>}
              </div>
              {emailError && <p style={{ color:'#ef4444', fontSize:12, marginTop:6, marginBottom:0 }}>{emailError}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom:28 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <label style={{ fontSize:14, fontWeight:600, color:'#374151' }}>Password</label>
                <a href="#" style={{ fontSize:13, color:'#667eea', textDecoration:'none', fontWeight:500 }}
                  onClick={(e) => { e.preventDefault(); setShowForgotPassword(true); }}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position:'relative' }}>
                <i className="bi bi-lock" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:16 }}></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`login-input${passwordError ? ' error' : password && !passwordError ? ' valid' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  style={{ paddingRight:48 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4 }}>
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
              {passwordError && <p style={{ color:'#ef4444', fontSize:12, marginTop:6, marginBottom:0 }}>{passwordError}</p>}
            </div>

            {/* Sign In button */}
            <button type="submit" className="sign-in-btn" disabled={isLoading || !!emailError || !!passwordError}>
              {isLoading ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Signing In...</>
              ) : (
                <><SignInIcon className="me-2" size={16} />Sign In</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'28px 0' }}>
            <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
            <span style={{ color:'#94a3b8', fontSize:13 }}>or</span>
            <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
          </div>

          {/* Learner Portal button */}
          <button
            onClick={() => navigate('/learner')}
            style={{
              width:'100%', padding:'13px', borderRadius:12, border:'2px solid #e2e8f0',
              background:'#fff', cursor:'pointer', display:'flex', alignItems:'center',
              justifyContent:'center', gap:10, fontSize:15, fontWeight:600, color:'#374151',
              transition:'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor='#667eea'; e.currentTarget.style.color='#667eea'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#374151'; }}
          >
            <i className="bi bi-mortarboard-fill" style={{ fontSize:18, color:'#10b981' }}></i>
            Access Learner Portal
          </button>

          <p style={{ textAlign:'center', color:'#94a3b8', fontSize:12, marginTop:32 }}>
            © {new Date().getFullYear()} NBSN Projects. All rights reserved.{' '}
            <a
              href="/popia-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0d9488', textDecoration: 'underline' }}
            >
              POPIA Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

