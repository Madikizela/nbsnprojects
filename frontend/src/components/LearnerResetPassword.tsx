import React, { useState } from 'react';

const API = (import.meta.env.VITE_API_URL as string || '').replace(/\/$/, '');

export default function LearnerResetPassword() {
  const [step, setStep] = useState<'email' | 'token' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<unknown>(null);

  // Step 1: Get reset token by email
  async function handleGetToken(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/Auth/get-learner-reset-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setTokenInfo(data);
        setToken(data.token);
        setStep('token');
      } else {
        setError(data.message || 'No reset token found. Please request a password reset first.');
      }
    } catch {
      setError('Cannot reach server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Reset password with token
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/Auth/learner-reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('success');
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch {
      setError('Cannot reach server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  const containerStyle = {
    minHeight: '100vh',
    background: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };

  const cardStyle = {
    background: '#1e293b',
    borderRadius: 16,
    padding: 40,
    width: '100%',
    maxWidth: 450,
    boxShadow: '0 20px 40px rgba(0,0,0,.4)',
  };

  const inputStyle = {
    width: '100%',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '12px 16px',
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
  };

  const labelStyle = {
    display: 'block',
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
  };

  const buttonStyle = {
    width: '100%',
    background: '#0EA5E9',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 0',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    marginTop: 8,
  };

  // Step 1: Enter Email
  if (step === 'email') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ background: '#f59e0b', borderRadius: '50%', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>
              🔑
            </div>
            <h2 style={{ color: '#fff', margin: 0 }}>Get Reset Token</h2>
            <p style={{ color: '#94a3b8', margin: '8px 0 0', fontSize: 14 }}>
              Enter your email to retrieve your password reset token
            </p>
          </div>
          <form onSubmit={handleGetToken}>
            <label style={labelStyle}>Email Address</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
            {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Checking...' : 'Get Reset Token'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <a href="/learner" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>
                ← Back to Login
              </a>
            </div>
          </form>
          <div style={{ marginTop: 24, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: '#fff' }}>Note:</strong> If you recently requested a password reset via "Forgot Password", 
              enter your email here to retrieve your reset token. Then use it to set a new password.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Show Token & Enter New Password
  if (step === 'token') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ background: '#10b981', borderRadius: '50%', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>
              🔓
            </div>
            <h2 style={{ color: '#fff', margin: 0 }}>Reset Your Password</h2>
            <p style={{ color: '#94a3b8', margin: '8px 0 0', fontSize: 14 }}>
              Token found! Now set your new password
            </p>
          </div>

          {/* Show Token Info */}
          <div style={{ marginBottom: 24, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #10b981' }}>
            <p style={{ color: '#10b981', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>✅ Reset Token Retrieved</p>
            <div style={{ background: '#1e293b', padding: 12, borderRadius: 6, marginBottom: 8 }}>
              <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 4px' }}>Token:</p>
              <p style={{ color: '#fff', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all', margin: 0 }}>
                {token}
              </p>
            </div>
            {tokenInfo && (tokenInfo as Record<string, unknown>).expiresAt && (
              <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>
                ⏰ Expires: {new Date((tokenInfo as Record<string, unknown>).expiresAt as string).toLocaleString()}
              </p>
            )}
          </div>

          <form onSubmit={handleResetPassword}>
            <label style={labelStyle}>New Password</label>
            <input
              style={inputStyle}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />

            <label style={labelStyle}>Confirm New Password</label>
            <input
              style={inputStyle}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
            />

            {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setToken('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer' }}
              >
                ← Start Over
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 3: Success
  if (step === 'success') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h3 style={{ color: '#10b981', margin: '0 0 12px' }}>Password Reset Successful!</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
              Your password has been changed. You can now login with your new password.
            </p>
            <a
              href="/learner"
              style={{
                display: 'inline-block',
                width: '100%',
                background: '#0EA5E9',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 8,
                padding: '12px 0',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              Go to Login →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
