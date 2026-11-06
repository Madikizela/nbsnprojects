import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = (import.meta.env.VITE_API_URL as string || '').replace(/\/$/, '');

const ChangePassword = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirm, setConfirm]                 = useState('');
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId     = storedUser?.id;
  const token      = localStorage.getItem('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.'); return;
    }
    if (newPassword !== confirm) {
      setError('New passwords do not match.'); return;
    }
    if (!userId || !token) {
      setError('Session error. Please log in again.'); return;
    }

    setLoading(true);
    try {
      const r = await fetch(`${API}/api/Users/${userId}/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const d = await r.json();
      if (r.ok) {
        // Clear the mustChangePassword flag in localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.mustChangePassword = false;
        localStorage.setItem('user', JSON.stringify(user));
        // Navigate to the correct dashboard
        const role = String(storedUser.role ?? '');
        const isSDP = role === 'SDPAdministrator' || role === '3' || storedUser.skillsDevelopmentProviderId;
        navigate(isSDP ? '/sdp-dashboard' : '/dashboard');
      } else {
        setError(d.message || 'Failed to change password.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f172a,#1e3a5f)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'40px 36px', width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🔐</div>
          <h2 style={{ fontSize:24, fontWeight:800, color:'#1e293b', margin:'0 0 6px' }}>Change Your Password</h2>
          <p style={{ color:'#64748b', fontSize:14, margin:0 }}>
            For your security, please set a new password before continuing.
          </p>
        </div>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', marginBottom:18, color:'#dc2626', fontSize:13, display:'flex', gap:8 }}>
            <i className="bi bi-exclamation-triangle-fill" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Current password */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Current Password</label>
            <div style={{ position:'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                style={{ width:'100%', padding:'10px 40px 10px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, outline:'none', boxSizing:'border-box' }}
                placeholder="Enter current password"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16 }}>
                <i className={`bi ${showCurrent ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>

          {/* New password */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>New Password</label>
            <div style={{ position:'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required minLength={8}
                style={{ width:'100%', padding:'10px 40px 10px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, outline:'none', boxSizing:'border-box' }}
                placeholder="Min 8 characters"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16 }}>
                <i className={`bi ${showNew ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
            {newPassword && newPassword.length < 8 && (
              <p style={{ color:'#ef4444', fontSize:11, margin:'4px 0 0' }}>Password must be at least 8 characters</p>
            )}
          </div>

          {/* Confirm */}
          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Confirm New Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1.5px solid ${confirm && confirm !== newPassword ? '#ef4444' : '#e2e8f0'}`, fontSize:14, outline:'none', boxSizing:'border-box' }}
              placeholder="Re-enter new password"
            />
            {confirm && confirm !== newPassword && (
              <p style={{ color:'#ef4444', fontSize:11, margin:'4px 0 0' }}>Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || newPassword !== confirm}
            style={{ width:'100%', padding:'12px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', fontWeight:700, fontSize:15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Saving…</> : '🔐 Set New Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
