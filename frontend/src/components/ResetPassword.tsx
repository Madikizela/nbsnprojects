import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const pwdLenOk = password.length >= 8;
  const confirmMatch = confirmPassword.length > 0 && password === confirmPassword;
  const confirmMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
      return;
    }

    const pwdErr = validatePassword(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (response.ok) {
        setSuccess('Your password has been reset successfully. You can now log in.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to reset password. The token may be invalid or expired.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
    backgroundSize: '400% 400%',
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  } as React.CSSProperties;

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    border: 'none',
    width: '100%',
    maxWidth: '400px',
    margin: '0 20px'
  } as React.CSSProperties;

  const inputStyle = {
    borderRadius: '12px',
    padding: '12px 16px',
    border: '2px solid #e9ecef',
    fontSize: '16px',
    width: '100%'
  } as React.CSSProperties;

  const buttonStyle = {
    borderRadius: '12px',
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    width: '100%',
    border: 'none',
    cursor: 'pointer'
  } as React.CSSProperties;

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 className="fw-bold text-primary mb-2">Reset Password</h2>
            <p className="text-muted">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ ...inputStyle, paddingRight: 52 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                    fontSize: 18, padding: '2px 4px', lineHeight: 1
                  }}
                >{showPassword ? '🙈' : '👁️'}</button>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: pwdLenOk ? '#10b981' : '#94a3b8' }}>
                  {pwdLenOk ? '✅' : '○'}
                </span>
                <span style={{ color: pwdLenOk ? '#10b981' : '#64748b' }}>
                  At least 8 characters
                </span>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="form-control"
                  style={{
                    ...inputStyle,
                    paddingRight: 52,
                    borderColor: confirmMismatch ? '#ef4444' : confirmMatch ? '#10b981' : undefined
                  }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={() => setShowConfirm(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                    fontSize: 18, padding: '2px 4px', lineHeight: 1
                  }}
                >{showConfirm ? '🙈' : '👁️'}</button>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: confirmMatch ? '#10b981' : confirmMismatch ? '#ef4444' : '#94a3b8' }}>
                  {confirmMatch ? '✅' : confirmMismatch ? '❌' : '○'}
                </span>
                <span style={{ color: confirmMatch ? '#10b981' : confirmMismatch ? '#ef4444' : '#64748b' }}>
                  {confirmMatch ? 'Passwords match' : confirmMismatch ? 'Passwords do not match' : 'Confirm your password'}
                </span>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success" role="alert">
                {success} <Link to="/login">Go to Login</Link>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={buttonStyle}
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;