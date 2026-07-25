import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/nbsn-logo.png';
import productIcon from '../assets/mobile_icon.png';
import {
  EyeIcon,
  EyeOffIcon,
  SignInIcon
} from './CustomIcons';
import ForgotPassword from './ForgotPassword';
import { encryptData } from '../utils/encryption';
import { apiCall } from '../utils/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
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
      // Build encrypted payload
      const encryptedPayload = encryptData({ Email: email, Password: password });

      const response = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, encryptedLoginData: encryptedPayload }),
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
        console.log('Login: Determining dashboard for role:', role, 'Department:', normalizedUser.departmentName);
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

        // Route to appropriate dashboard
        if (role === '18' || role === 'ExternalUser') {
          navigate('/external-portal');
        } else if (isLogistics || isQA || isAdminManager || isFinance || isIT) {
          navigate('/sdp-manager-dashboard');
        } else if (isSDP) {
          navigate('/sdp-dashboard');
        } else if (isClient) {
          navigate('/client-dashboard');
        } else {
          navigate('/dashboard');
        }
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

  // Show forgot password component if requested
  if (showForgotPassword) {
    return <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />;
  }

  return (
    <div 
      className="position-relative overflow-hidden"
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        overflowY: 'auto'
      }}
    >
      {/* Animated Background Styles */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        .floating-shape {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          animation: float 6s ease-in-out infinite;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 20px 60px 0 rgba(0, 0, 0, 0.3), 
                      0 0 0 1px rgba(0, 0, 0, 0.1);
        }
        
        .input-glass {
          background: rgba(248, 249, 250, 0.8) !important;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        
        .input-glass:focus {
          background: rgba(255, 255, 255, 0.95) !important;
          transform: translateY(-2px);
        }
        
        .btn-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          transition: all 0.3s ease;
        }
        
        .btn-gradient:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        
        .btn-gradient:disabled {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          cursor: not-allowed;
        }
      `}</style>

      {/* Floating Decorative Shapes */}
      <div className="floating-shape" style={{ width: '300px', height: '300px', top: '10%', left: '10%', animationDelay: '0s' }} />
      <div className="floating-shape" style={{ width: '200px', height: '200px', top: '60%', right: '15%', animationDelay: '2s' }} />
      <div className="floating-shape" style={{ width: '150px', height: '150px', bottom: '15%', left: '20%', animationDelay: '4s' }} />
      <div className="floating-shape" style={{ width: '250px', height: '250px', top: '20%', right: '10%', animationDelay: '3s' }} />

      <div className="position-relative" style={{ width: '100%', maxWidth: '550px', padding: '40px 20px', zIndex: 10 }}>
        <div style={{ width: '100%' }}>
          <div style={{ width: '100%', marginBottom: '30px' }}>
            {/* Login Card with Glassmorphism */}
            <div className="card glass-card border-0" style={{ borderRadius: '24px', overflow: 'hidden' }}>
              <div className="card-body p-4">
                {/* Logo and Header */}
                <div className="text-center mb-3">
                   <div style={{ animation: 'pulse 3s ease-in-out infinite' }}>
                     <img 
                       src={productIcon} 
                       alt="NBSN Mobile" 
                       style={{ 
                         width: '100px', 
                         height: '100px', 
                         objectFit: 'contain',
                         borderRadius: '20px'
                       }} 
                     />
                   </div>
                  <div className="d-flex align-items-center justify-content-center gap-2 mt-2 mb-1">
                    <img 
                      src={logoImage} 
                      alt="NBSN Logo" 
                      style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
                    />
                    <h2 className="fw-bold mb-0" style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontSize: '1.6rem',
                      letterSpacing: '0.5px'
                    }}>
                      NBSN
                    </h2>
                  </div>
                  <p className="text-muted fw-medium mb-0" style={{ fontSize: '0.85rem' }}>
                    Skills Development & Training Portal
                  </p>
                  <div className="mt-1" style={{ 
                    height: '3px', 
                    width: '60px', 
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    margin: '0 auto',
                    borderRadius: '2px'
                  }} />
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="alert alert-danger border-0 py-2" role="alert" style={{ 
                    borderRadius: '12px',
                    background: 'rgba(220, 53, 69, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(220, 53, 69, 0.2)'
                  }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} noValidate>
                  {/* Email Field */}
                  <div className="mb-2">
                    <label htmlFor="email" className="form-label fw-semibold text-dark mb-1" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-envelope-fill me-2" style={{ color: '#667eea' }}></i>
                      Email Address
                    </label>
                    <div className="position-relative">
                      <input
                        type="email"
                        id="email"
                        className="form-control input-glass border-0"
                        placeholder="Enter your email"
                        value={email}
                        onChange={handleEmailChange}
                        style={{
                          borderRadius: '12px',
                          paddingLeft: '16px',
                          fontSize: '14px',
                          height: '46px',
                          boxShadow: emailError ? '0 0 0 3px rgba(220, 53, 69, 0.1)' : email && !emailError ? '0 0 0 3px rgba(25, 135, 84, 0.1)' : 'none'
                        }}
                      />
                      {email && !emailError && (
                        <i className="bi bi-check-circle-fill position-absolute text-success top-50 end-0 translate-middle-y me-3" style={{ fontSize: '18px' }}></i>
                      )}
                      {emailError && (
                        <i className="bi bi-exclamation-circle-fill position-absolute text-danger top-50 end-0 translate-middle-y me-3" style={{ fontSize: '18px' }}></i>
                      )}
                    </div>
                    {emailError && (
                      <div className="text-danger mt-2" style={{ fontSize: '13px' }}>
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        {emailError}
                      </div>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold text-dark mb-1" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-lock-fill me-2" style={{ color: '#667eea' }}></i>
                      Password
                    </label>
                    <div className="position-relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control input-glass border-0"
                        id="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        style={{ 
                          borderRadius: '12px',
                          paddingLeft: '16px',
                          paddingRight: '50px',
                          fontSize: '14px',
                          height: '46px',
                          boxShadow: passwordError ? '0 0 0 3px rgba(220, 53, 69, 0.1)' : password && !passwordError ? '0 0 0 3px rgba(25, 135, 84, 0.1)' : 'none'
                        }}
                      />
                      <button
                        type="button"
                        className="btn position-absolute"
                        style={{ 
                          right: '8px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'transparent',
                          color: '#6c757d',
                          fontSize: '18px',
                          padding: '4px 8px'
                        }}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                      </button>
                    </div>
                    {passwordError && (
                      <div className="text-danger mt-2" style={{ fontSize: '13px' }}>
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        {passwordError}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="d-grid mb-2">
                    <button
                      type="submit"
                      className="btn btn-gradient btn-lg text-white fw-semibold"
                      disabled={isLoading || emailError !== '' || passwordError !== ''}
                      style={{
                        borderRadius: '12px',
                        fontSize: '15px',
                        padding: '12px 24px',
                        height: '46px'
                      }}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Signing In...
                        </>
                      ) : (
                        <>
                          <SignInIcon className="me-2" size={16} />
                          Sign In
                        </>
                      )}
                    </button>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-center">
                    <a 
                      href="#" 
                      className="text-decoration-none fw-semibold"
                      style={{ 
                        color: '#667eea',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setShowForgotPassword(true);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#764ba2'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#667eea'}
                    >
                      <i className="bi bi-key me-2"></i>
                      Forgot your password?
                    </a>
                  </div>
                </form>
              </div>
            </div>

            {/* Learner Portal Button */}
            <div className="text-center" style={{ marginTop: '20px' }}>
              <button
                onClick={() => navigate('/learner')}
                className="btn btn-lg text-white fw-bold shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '14px 32px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  maxWidth: '400px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(245, 87, 108, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
                }}
              >
                <i className="bi bi-person-circle me-2" style={{ fontSize: '20px' }}></i>
                Learner Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

