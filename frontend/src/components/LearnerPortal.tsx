import React, { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5213';

// ─── helpers ────────────────────────────────────────────────────────────────
function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}
async function apiFetch(path: string, token: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { ...authHeaders(token), ...(opts.headers || {}) },
  });
  return res;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface LearnerUser {
  id: number;
  name: string;
  email: string;
  username: string;
  mustChangePassword: boolean;
  profilePhotoPath?: string;
}

// ─── Main Portal ─────────────────────────────────────────────────────────────
export default function LearnerPortal() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('learner_token'));
  const [user, setUser] = useState<LearnerUser | null>(() => {
    const s = localStorage.getItem('learner_user');
    return s ? JSON.parse(s) : null;
  });
  const [section, setSection] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogin(t: string, u: LearnerUser) {
    setToken(t);
    setUser(u);
    localStorage.setItem('learner_token', t);
    localStorage.setItem('learner_user', JSON.stringify(u));
    if (u.mustChangePassword) setSection('change-password');
    else setSection('dashboard');
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('learner_token');
    localStorage.removeItem('learner_user');
    setSection('dashboard');
  }

  function navigateToSection(s: string) {
    setSection(s);
    setMobileMenuOpen(false);
  }

  if (!token || !user) return <LearnerLogin onLogin={handleLogin} />;
  if (user.mustChangePassword && section !== 'change-password')
    return <ChangePassword token={token} user={user} setUser={setUser} onDone={() => setSection('dashboard')} />;

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: '#0f172a', color: '#fff', fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#1e293b', padding: '12px 24px', borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* User Profile Photo or Default Avatar */}
            <div style={{ 
              borderRadius: '50%', 
              width: 36, 
              height: 36, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflow: 'hidden',
              background: user.profilePhotoPath ? 'transparent' : '#0EA5E9',
              fontWeight: 700
            }}>
              {user.profilePhotoPath ? (
                <img 
                  src={`${API}/${user.profilePhotoPath}`} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    // Fallback to default if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.style.background = '#0EA5E9';
                    e.currentTarget.parentElement!.innerHTML = user.name.charAt(0).toUpperCase();
                  }}
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, whiteSpace: 'nowrap' }}>NBSN Learner Portal</span>
          </div>

          {/* Desktop Menu */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} className="desktop-menu">
            {['dashboard', 'profile', 'documents', 'materials', 'assessments', 'remedial', 'notices', 'attendance'].map(s => (
              <button key={s} onClick={() => setSection(s)}
                style={{ 
                  background: section === s ? '#0EA5E9' : 'transparent', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 6, 
                  padding: '6px 14px', 
                  cursor: 'pointer', 
                  fontSize: 14, 
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap'
                }}>
                {s === 'materials' ? 'Study Materials' : s === 'attendance' ? '📅 Attendance' : s}
              </button>
            ))}
            <button onClick={handleLogout}
              style={{ 
                background: '#dc2626', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 6, 
                padding: '6px 14px', 
                cursor: 'pointer', 
                fontSize: 14, 
                marginLeft: 8,
                whiteSpace: 'nowrap'
              }}>
              Logout
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer',
              padding: 8
            }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-menu" style={{
            display: 'none',
            flexDirection: 'column',
            gap: 8,
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid #334155'
          }}>
            {['dashboard', 'profile', 'documents', 'materials', 'assessments', 'remedial', 'notices', 'attendance'].map(s => (
              <button key={s} onClick={() => navigateToSection(s)}
                style={{ 
                  background: section === s ? '#0EA5E9' : 'transparent', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 6, 
                  padding: '10px 14px', 
                  cursor: 'pointer', 
                  fontSize: 14, 
                  textTransform: 'capitalize',
                  textAlign: 'left',
                  width: '100%'
                }}>
                {s === 'materials' ? 'Study Materials' : s === 'attendance' ? '📅 Attendance' : s}
              </button>
            ))}
            <button onClick={handleLogout}
              style={{ 
                background: '#dc2626', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 6, 
                padding: '10px 14px', 
                cursor: 'pointer', 
                fontSize: 14,
                textAlign: 'left',
                width: '100%'
              }}>
              Logout
            </button>
          </div>
        )}
      </nav>{/* Responsive CSS */}
        <style>{`
          @media (max-width: 768px) {
            .desktop-menu {
              display: none !important;
            }
            .mobile-menu-btn {
              display: block !important;
            }
            .mobile-menu {
              display: flex !important;
            }
          }
        `}</style>
      </nav>

      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        {section === 'dashboard'         && <LearnerDashboard token={token} user={user} setSection={setSection} />}
        {section === 'profile'           && <LearnerProfile   token={token} user={user} setUser={setUser} />}
        {section === 'documents'         && <LearnerDocuments token={token} user={user} />}
        {section === 'materials'         && <LearnerMaterials token={token} user={user} />}
        {section === 'assessments'       && <LearnerAssessments token={token} user={user} />}
        {section === 'remedial'          && <LearnerRemedial    token={token} user={user} />}
        {section === 'notices'           && <LearnerNotices     token={token} user={user} />}
        {section === 'attendance'        && <LearnerAttendance  token={token} user={user} />}
        {section === 'change-password'   && <ChangePassword token={token} user={user} setUser={setUser} onDone={() => setSection('dashboard')} />}
      </div>
    </div>
  );
}

// ─── Login ───────────────────────────────────────────────────────────────────
function LearnerLogin({ onLogin }: { onLogin: (t: string, u: LearnerUser) => void }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/Auth/learner-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Login failed'); return; }
      onLogin(data.token, data.user);
    } catch {
      setError('Cannot reach server. Check your connection.');
    } finally { setLoading(false); }
  }

  if (showForgotPassword) {
    return <LearnerForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1e293b', borderRadius: 16, padding: 40, width: 380, boxShadow: '0 20px 40px rgba(0,0,0,.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ background: '#0EA5E9', borderRadius: '50%', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, margin: '0 auto 12px' }}>🎓</div>
          <h2 style={{ color: '#fff', margin: 0 }}>Learner Portal</h2>
          <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: 14 }}>National Building Skills Network</p>
        </div>
        <form onSubmit={submit}>
          <label style={labelStyle}>Email Address</label>
          <input style={inputStyle} type="email" value={login} onChange={e => setLogin(e.target.value)} required placeholder="your.email@example.com" />
          <label style={labelStyle}>Password</label>
          <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Your password" />
          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 8 }}>
            {loading ? 'Logging in…' : 'Login →'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button 
              type="button"
              onClick={() => setShowForgotPassword(true)}
              style={{ background: 'transparent', border: 'none', color: '#0EA5E9', fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Change Password ─────────────────────────────────────────────────────────
function ChangePassword({ token, user, setUser, onDone }: { token: string; user: LearnerUser; setUser: (u: LearnerUser) => void; onDone: () => void }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { setMsg('Passwords do not match'); return; }
    if (next.length < 8) { setMsg('Password must be at least 8 characters'); return; }
    setLoading(true); setMsg('');
    try {
      const res = await apiFetch('/api/Auth/learner-change-password', token, {
        method: 'POST',
        body: JSON.stringify({ currentPassword: cur, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.message || 'Failed'); return; }
      const updated = { ...user, mustChangePassword: false };
      setUser(updated);
      localStorage.setItem('learner_user', JSON.stringify(updated));
      onDone();
    } catch { setMsg('Server error'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <div style={cardStyle}>
        <h3 style={{ color: '#0EA5E9', marginTop: 0 }}>🔒 Set Your New Password</h3>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>You must change your temporary password before continuing.</p>
        <form onSubmit={submit}>
          <label style={labelStyle}>Current (temporary) password</label>
          <input style={inputStyle} type="password" value={cur} onChange={e => setCur(e.target.value)} required />
          <label style={labelStyle}>New password</label>
          <input style={inputStyle} type="password" value={next} onChange={e => setNext(e.target.value)} required />
          <label style={labelStyle}>Confirm new password</label>
          <input style={inputStyle} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          {msg && <p style={{ color: '#f87171', fontSize: 13 }}>{msg}</p>}
          <button type="submit" disabled={loading} style={btnPrimary}>{loading ? 'Saving…' : 'Save Password'}</button>
        </form>
      </div>
    </div>
  );
}

// ─── Forgot Password ─────────────────────────────────────────────────────────
function LearnerForgotPassword({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/Auth/learner-forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to send reset link. Please check your email and try again.');
      }
    } catch {
      setError('Cannot reach server. Check your connection.');
    } finally { setLoading(false); }
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#1e293b', borderRadius: 16, padding: 40, width: 380, boxShadow: '0 20px 40px rgba(0,0,0,.4)', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h3 style={{ color: '#10b981', margin: '0 0 12px' }}>Check Your Email</h3>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
            We've sent a password reset link to <strong style={{ color: '#fff' }}>{email}</strong>.
            Please check your inbox and spam folder.
          </p>
          <div style={{ marginBottom: 24, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 }}>
              <strong style={{ color: '#fff' }}>Can't access email?</strong><br />
              You can reset your password without email by visiting our self-service reset page.
            </p>
            <a
              href="/learner-reset-password"
              style={{
                display: 'inline-block',
                background: '#334155',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Self-Service Reset →
            </a>
          </div>
          <button onClick={onBack}
            style={{ width: '100%', background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#1e293b', borderRadius: 16, padding: 40, width: 380, boxShadow: '0 20px 40px rgba(0,0,0,.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ background: '#f59e0b', borderRadius: '50%', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, margin: '0 auto 12px' }}>🔒</div>
          <h2 style={{ color: '#fff', margin: 0 }}>Reset Password</h2>
          <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: 14 }}>Enter your email to receive a password reset link</p>
        </div>
        <form onSubmit={submit}>
          <label style={labelStyle}>Email Address</label>
          <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your.email@example.com" />
          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 8 }}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button type="button" onClick={onBack}
              style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer' }}>
              ← Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function LearnerDashboard({ token, user, setSection }: { token: string; user: LearnerUser; setSection: (s: string) => void }) {
  const [stats, setStats] = useState<unknown>(null);

  useEffect(() => {
    apiFetch(`/api/Learners/${user.id}`, token).then(r => r.json()).then(setStats).catch(() => {});
  }, [user.id, token]);

  return (
    <div>
      <h2 style={{ color: '#fff', marginTop: 0 }}>Welcome, {user.name.split(' ')[0]} 👋</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { icon: '📄', label: 'My Documents', section: 'documents', color: '#0EA5E9' },
          { icon: '📚', label: 'Study Materials', section: 'materials', color: '#8b5cf6' },
          { icon: '📝', label: 'My Assessments', section: 'assessments', color: '#10b981' },
          {icon: '📢', label: 'Notices', section: 'notices', color: '#ec4899'},
          {icon: '🔁', label: 'Remedial', section: 'remedial', color: '#f59e0b'},
          { icon: '👤', label: 'My Profile', section: 'profile', color: '#06b6d4' },
        ].map(c => (
          <button key={c.section} onClick={() => setSection(c.section)}
            style={{ background: '#1e293b', border: `1px solid ${c.color}33`, borderRadius: 12, padding: 24, cursor: 'pointer', textAlign: 'left', color: '#fff' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{c.label}</div>
          </button>
        ))}
      </div>
      {stats && (
        <div style={cardStyle}>
          <h4 style={{ color: '#94a3b8', marginTop: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Your Info</h4>
          <p style={{ margin: '4px 0' }}><strong>ID Number:</strong> {stats.idNumber}</p>
          <p style={{ margin: '4px 0' }}><strong>Email:</strong> {stats.email}</p>
          <p style={{ margin: '4px 0' }}><strong>Contact:</strong> {stats.contactNumber || '—'}</p>
        </div>
      )}
    </div>
  );
}

// ─── Profile ─────────────────────────────────────────────────────────────────
function LearnerProfile({ token, user, setUser }: { token: string; user: LearnerUser; setUser: (u: LearnerUser) => void }) {
  const [profile, setProfile] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    apiFetch(`/api/Learners/${user.id}`, token).then(r => r.json()).then(setProfile).catch(() => {});
  }, [user.id, token]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const res = await apiFetch(`/api/Learners/${user.id}`, token, {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      if (res.ok) setMsg('✅ Profile saved successfully');
      else setMsg('❌ Save failed');
    } catch { setMsg('❌ Server error'); }
    finally { setSaving(false); }
  }

  async function uploadPhoto(file: File) {
    const fd = new FormData();
    fd.append('photo', file);
    const res = await fetch(`${API}/api/Learners/${user.id}/profile-photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (res.ok) {
      const data = await res.json();
      setProfile((p: unknown) => ({ ...(p as Record<string, unknown>), profilePhotoPath: data.profilePhotoPath }));
      const updated = { ...user, profilePhotoPath: data.profilePhotoPath };
      setUser(updated);
      localStorage.setItem('learner_user', JSON.stringify(updated));
      setMsg('✅ Photo updated');
    }
  }

  async function captureAndSaveFace() {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async blob => {
      if (!blob) return;
      const fd = new FormData();
      fd.append('photo', blob, 'face.jpg');
      const res = await fetch(`${API}/api/Learners/${user.id}/profile-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) { setMsg('✅ Face photo saved'); stopCamera(); }
    }, 'image/jpeg');
  }

  function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
      setStream(s); setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 100);
    }).catch(() => setMsg('Camera not available'));
  }

  function stopCamera() {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null); setCameraOpen(false);
  }

  if (!profile) return <p>Loading…</p>;

  const field = (label: string, key: string, type = 'text') => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} type={type} value={(profile as Record<string, unknown>)[key] || ''} onChange={e => setProfile((p: unknown) => ({ ...(p as Record<string, unknown>), [key]: e.target.value }))} />
    </div>
  );

  const photoUrl = (profile as Record<string, unknown>).profilePhotoPath ? `${API}/${(profile as Record<string, unknown>).profilePhotoPath}` : null;

  return (
    <div>
      <h2 style={{ color: '#fff', marginTop: 0 }}>👤 My Profile</h2>
      {/* Photo section */}
      <div style={{ ...cardStyle, display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24 }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#334155', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
          {photoUrl ? <img src={photoUrl} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
        </div>
        <div>
          <h3 style={{ margin: '0 0 8px', color: '#fff' }}>{(profile as Record<string, unknown>).firstName} {(profile as Record<string, unknown>).lastName}</h3>
          <p style={{ color: '#94a3b8', margin: '0 0 12px', fontSize: 14 }}>ID: {(profile as Record<string, unknown>).idNumber}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={btnSecondary} onClick={() => photoRef.current?.click()}>📷 Upload Photo</button>
            <button style={btnSecondary} onClick={cameraOpen ? stopCamera : startCamera}>
              {cameraOpen ? '❌ Close Camera' : '🤳 Take Photo / Face Registration'}
            </button>
          </div>
          <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
        </div>
      </div>

      {cameraOpen && (
        <div style={{ ...cardStyle, marginBottom: 24, textAlign: 'center' }}>
          <video ref={videoRef} autoPlay style={{ width: '100%', maxWidth: 480, borderRadius: 8 }} />
          <br />
          <button style={{ ...btnPrimary, marginTop: 12, width: 'auto', padding: '10px 24px' }} onClick={captureAndSaveFace}>📸 Capture & Save</button>
        </div>
      )}

      {msg && <p style={{ color: msg.startsWith('✅') ? '#10b981' : '#f87171' }}>{msg}</p>}

      <form onSubmit={saveProfile}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cardStyle}>
            <h4 style={{ color: '#0EA5E9', marginTop: 0 }}>Personal Information</h4>
            {field('First Name', 'firstName')}
            {field('Last Name', 'lastName')}
            {field('Contact Number', 'contactNumber', 'tel')}
            {field('Email', 'email', 'email')}
          </div>
          <div style={cardStyle}>
            <h4 style={{ color: '#0EA5E9', marginTop: 0 }}>Address</h4>
            {field('Address Line 1', 'addressLine1')}
            {field('Address Line 2', 'addressLine2')}
            {field('Address Line 3', 'addressLine3')}
            {field('Postal Code', 'postalCode')}
          </div>
          <div style={cardStyle}>
            <h4 style={{ color: '#0EA5E9', marginTop: 0 }}>Education</h4>
            {field('High School Name', 'highSchoolName')}
            {field('School Location', 'schoolLocation')}
            {field('Highest Grade Passed', 'highestGradePassed')}
            {field('Year of Completion', 'yearOfCompletion', 'number')}
          </div>
          <div style={cardStyle}>
            <h4 style={{ color: '#0EA5E9', marginTop: 0 }}>Next of Kin</h4>
            {field('Name', 'nextOfKinName')}
            {field('Relation', 'nextOfKinRelation')}
            {field('Contact Number', 'nextOfKinContactNumber', 'tel')}
          </div>
        </div>
        <button type="submit" disabled={saving} style={{ ...btnPrimary, marginTop: 16 }}>
          {saving ? 'Saving…' : '💾 Save Profile'}
        </button>
      </form>
    </div>
  );
}

// ─── Documents ───────────────────────────────────────────────────────────────
function LearnerDocuments({ token, user }: { token: string; user: LearnerUser }) {
  const [docs, setDocs] = useState<unknown[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('ID Document');
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const docTypes = ['ID Document', 'Proof of Residence', 'Qualification Certificate', 'CV', 'Bank Statement', 'Medical Certificate', 'Other'];

  useEffect(() => {
    apiFetch(`/api/LearnerDocuments/learner/${user.id}`, token).then(r => r.json()).then(setDocs).catch(() => {});
  }, [user.id, token]);

  async function upload(files: FileList) {
    setUploading(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('LearnerId', user.id.toString());
      fd.append('DocumentType', docType);
      Array.from(files).forEach(f => fd.append('Files', f));
      const res = await fetch(`${API}/api/LearnerDocuments/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        setMsg('✅ Document uploaded');
        apiFetch(`/api/LearnerDocuments/learner/${user.id}`, token).then(r => r.json()).then(setDocs).catch(() => {});
      } else setMsg('❌ Upload failed');
    } catch { setMsg('❌ Server error'); }
    finally { setUploading(false); }
  }

  return (
    <div>
      <h2 style={{ color: '#fff', marginTop: 0 }}>📄 My Documents</h2>
      <div style={cardStyle}>
        <h4 style={{ color: '#0EA5E9', marginTop: 0 }}>Upload Document</h4>
        <label style={labelStyle}>Document Type</label>
        <select style={inputStyle} value={docType} onChange={e => setDocType(e.target.value)}>
          {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button style={{ ...btnSecondary, marginTop: 12 }} onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : '📎 Choose File(s) & Upload'}
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*,.pdf" style={{ display: 'none' }}
          onChange={e => e.target.files?.length && upload(e.target.files)} />
        {msg && <p style={{ color: msg.startsWith('✅') ? '#10b981' : '#f87171', marginTop: 8 }}>{msg}</p>}
      </div>

      <div style={{ marginTop: 24 }}>
        <h4 style={{ color: '#fff' }}>Uploaded Documents ({docs.length})</h4>
        {docs.length === 0 ? <p style={{ color: '#64748b' }}>No documents uploaded yet.</p> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {docs.map((d: unknown) => {
              const doc = d as Record<string, unknown>;
              return (
              <div key={doc.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{doc.documentType}</div>
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>{doc.fileName} · {(Number(doc.fileSize) / 1024).toFixed(0)} KB</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(doc.uploadedAt as string).toLocaleDateString()}</div>
                </div>
                <span style={{ background: doc.approvalStatus === 'Approved' ? '#166534' : doc.approvalStatus === 'Declined' ? '#7f1d1d' : '#1e3a5f', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 12 }}>
                  {doc.approvalStatus || 'Pending'}
                </span>
              </div>
            )
          })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Learning Materials ──────────────────────────────────────────────────────
function LearnerMaterials({ token, user }: { token: string; user: LearnerUser }) {
  const [materials, setMaterials] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMaterials();
  }, [user.id]);

  async function loadMaterials() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/LearningMaterials/learner/${user.id}/materials`, token);
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      } else {
        setError('Failed to load materials');
      }
    } catch {
      setError('Cannot reach server');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(materialId: number, fileName: string) {
    try {
      const res = await fetch(`${API}/api/LearningMaterials/${materialId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      alert('Failed to download file');
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const materialTypeIcon = (type: string) => {
    switch (type) {
      case 'StudyGuide': return '📖';
      case 'LearningMaterial': return '📚';
      case 'Video': return '🎬';
      case 'Presentation': return '📊';
      case 'Worksheet': return '📝';
      default: return '📄';
    }
  };

  const mimeIcon = (mime: string) => {
    if (!mime) return '📄';
    if (mime.includes('pdf')) return '📕';
    if (mime.includes('word') || mime.includes('document')) return '📘';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return '📊';
    if (mime.includes('video')) return '🎬';
    if (mime.includes('image')) return '🖼️';
    return '📄';
  };

  return (
    <div>
      <h2 style={{ color: '#fff', marginTop: 0 }}>📚 Study Materials</h2>
      <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
        Learning materials uploaded by your instructors for your qualification
      </p>

      {loading ? (
        <div style={cardStyle}>
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Loading materials...</p>
        </div>
      ) : error ? (
        <div style={cardStyle}>
          <p style={{ color: '#f87171', textAlign: 'center', padding: 20 }}>{error}</p>
        </div>
      ) : materials.length === 0 ? (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <h4 style={{ color: '#94a3b8', margin: '0 0 8px' }}>No Study Materials Yet</h4>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              Your instructors haven't uploaded any materials yet. Check back later!
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {materials.map((material: unknown) => {
            const mat = material as Record<string, unknown>;
            return (
            <div
              key={mat.id}
              style={{
                ...cardStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{materialTypeIcon(mat.materialType as string)}</span>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: 16 }}>{mat.title}</h4>
                </div>
                {mat.description && (
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 8px', lineHeight: 1.5 }}>
                    {mat.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
                  {mat.qualificationName && (
                    <span>🎓 {mat.qualificationName}</span>
                  )}
                  {mat.unitStandardName && (
                    <span>📋 {mat.unitStandardName}</span>
                  )}
                  {mat.fileName && (
                    <span>
                      {mimeIcon(mat.mimeType as string)} {mat.fileName}
                    </span>
                  )}
                  {mat.fileSize && <span>📦 {formatFileSize(Number(mat.fileSize))}</span>}
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
                  <span className="badge" style={{ background: '#334155', color: '#94a3b8', padding: '2px 8px', borderRadius: 4 }}>
                    {mat.materialType}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDownload(Number(mat.id), mat.fileName as string)}
                style={{
                  background: '#0EA5E9',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                ⬇️ Download
              </button>
            </div>
            )
          })}
        </div>
      )}

      {materials.length > 0 && (
        <div
          style={{
            ...cardStyle,
            marginTop: 16,
            background: '#0f172a',
            borderLeft: '3px solid #0EA5E9',
          }}
        >
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: '#fff' }}>💡 Tip:</strong> Download these materials to study offline. 
            They contain important information for your assessments.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Assessments ─────────────────────────────────────────────────────────────
function LearnerAssessments({ token, user }: { token: string; user: LearnerUser }) {
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [selectedUS, setSelectedUS] = useState<any>(null);
  const [assessments, setAssessments] = useState<any>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, { text: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // ── helpers ──────────────────────────────────────────────────────────────
  function getProgress(usId: number) {
    return progress.find((p: any) => p.projectQualificationUnitStandardId === usId) ?? null;
  }

  // A unit standard is unlocked when the previous one has both formative AND summative completed
  function isUSUnlocked(index: number) {
    if (index === 0) return true;
    const prev = qualifications[index - 1];
    const p = getProgress(prev.id);
    return !!(p?.formativeCompleted && p?.summativeCompleted);
  }

  // Summative is locked until formative is completed for this unit standard
  function isSummativeLocked(usId: number) {
    const p = getProgress(usId);
    return !p?.formativeCompleted;
  }

  async function loadProgress() {
    const res = await apiFetch(`/api/LearnerAssessmentAnswers/learner/${user.id}/progress`, token);
    if (res.ok) setProgress(await res.json());
  }

  // ── data loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        // Step 1: Get the learner record — classEnrollments are embedded
        const learnerRes = await apiFetch(`/api/Learners/${user.id}`, token);
        if (!learnerRes.ok) return;
        const learner = await learnerRes.json();

        const enrollments: any[] = learner.classEnrollments ?? [];
        if (!enrollments.length) { setLoading(false); return; }

        // Step 2: Use the first active enrollment's siteClassId
        const active = enrollments.find((e: any) => e.status === 'Active') ?? enrollments[0];
        const siteClassId = active.siteClassId ?? active.siteClass?.id;
        if (!siteClassId) { setLoading(false); return; }

        // Step 3: Get the site class → projectSiteId
        const classRes = await apiFetch(`/api/SiteClasses/${siteClassId}`, token);
        if (!classRes.ok) { setLoading(false); return; }
        const cls = await classRes.json();
        const projectSiteId = cls.projectSiteId;
        if (!projectSiteId) { setLoading(false); return; }

        // Step 4: Get the project site → projectId
        const siteRes = await apiFetch(`/api/ProjectSites/${projectSiteId}`, token);
        if (!siteRes.ok) { setLoading(false); return; }
        const site = await siteRes.json();
        const projectId = site.projectId;
        if (!projectId) { setLoading(false); return; }

        // Step 5: Load project details and progress in parallel
        const [projRes, progRes] = await Promise.all([
          apiFetch(`/api/Projects/${projectId}/details`, token),
          apiFetch(`/api/LearnerAssessmentAnswers/learner/${user.id}/progress`, token),
        ]);

        if (projRes.ok) {
          const proj = await projRes.json();
          const uss: any[] = [];
          (proj.learningPathways ?? []).forEach((p: any) =>
            (p.qualifications ?? []).forEach((q: any) => {
              const qualName =
                q.occupationalQualification?.name ??
                q.legacyQualification?.name ??
                q.qualificationType?.name ?? '';
              (q.unitStandards ?? []).forEach((us: any) => {
                if (us) uss.push({ ...us, qualificationName: qualName });
              });
            })
          );
          setQualifications(uss);
        }

        if (progRes.ok) setProgress(await progRes.json());
      } catch (e) {
        console.error('Failed to load assessments', e);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [user.id, token]);

  // ── navigation ───────────────────────────────────────────────────────────
  async function openUnitStandard(us: any) {
    setSelectedUS(us); setSelectedAssessment(null); setQuestions([]); setMsg('');
    const [fRes, sRes] = await Promise.all([
      apiFetch(`/api/assessments/formative/unit-standard/${us.id}`, token),
      apiFetch(`/api/assessments/summative/unit-standard/${us.id}`, token),
    ]);
    const formative = fRes.ok ? await fRes.json() : [];
    const summative = sRes.ok ? await sRes.json() : [];
    setAssessments({ formative, summative });
  }

  async function openAssessment(a: any, type: string) {
    setSelectedAssessment({ ...a, type }); setMsg('');
    const path = type === 'Formative'
      ? `/api/Assessments/formative/${a.id}/questions`
      : `/api/Assessments/summative/${a.id}/questions`;
    const res = await apiFetch(path, token);
    if (res.ok) { const qs = await res.json(); setQuestions(qs); setAnswers({}); }
  }

  // ── submit ───────────────────────────────────────────────────────────────
  async function submitAnswers() {
    if (!selectedAssessment || !selectedUS) return;
    setSubmitting(true); setMsg('');
    try {
      for (const q of questions) {
        const ans = answers[q.id];
        if (!ans?.text) continue;
        const fd = new FormData();
        fd.append('LearnerId', user.id.toString());
        fd.append('AssessmentId', selectedAssessment.id.toString());
        fd.append('AssessmentType', selectedAssessment.type);
        fd.append('QuestionId', q.id.toString());
        fd.append('QuestionNumber', q.questionNumber.toString());
        fd.append('IsRemedial', 'false');
        // ProjectQualificationUnitStandardId is the unit standard's id from the project hierarchy
        fd.append('ProjectQualificationUnitStandardId', selectedUS.id.toString());
        // Field name must be 'ScannedDocument' (not 'File') to match the DTO
        const blob = new Blob([ans.text], { type: 'text/plain' });
        fd.append('ScannedDocument', blob, `q${q.questionNumber}_answer.txt`);
        const res = await fetch(`${API}/api/LearnerAssessmentAnswers/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: res.statusText }));
          throw new Error(err.message ?? `Upload failed for Q${q.questionNumber}`);
        }
      }
      setMsg('✅ Answers submitted! You can now go back.');
      setAnswers({});
      // Refresh progress so locks update immediately
      await loadProgress();
    } catch (e: any) {
      setMsg(`❌ ${e.message ?? 'Submission failed'}`);
    } finally {
      setSubmitting(false);
    }
  }

  // ── render: answer page ──────────────────────────────────────────────────
  if (selectedAssessment && questions.length > 0) {
    return (
      <div>
        <button style={btnBack} onClick={() => { setSelectedAssessment(null); setQuestions([]); }}>
          ← Back to Assessments
        </button>
        <h2 style={{ color: '#fff', marginBottom: 4 }}>
          {selectedAssessment.type} Assessment #{selectedAssessment.id}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
          {selectedUS?.unitStandardName}
        </p>
        {questions.map((q: any) => (
          <div key={q.id} style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              Q{q.questionNumber}: {q.questionText}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>
              {q.allocatedMarks} mark{q.allocatedMarks !== 1 ? 's' : ''}
            </div>
            <textarea
              style={{ ...inputStyle, height: 100, resize: 'vertical' }}
              placeholder="Type your answer here…"
              value={answers[q.id]?.text ?? ''}
              onChange={e => setAnswers(a => ({ ...a, [q.id]: { text: e.target.value } }))}
            />
          </div>
        ))}
        {msg && (
          <p style={{ color: msg.startsWith('✅') ? '#10b981' : '#f87171', marginBottom: 12 }}>{msg}</p>
        )}
        <button style={btnPrimary} disabled={submitting} onClick={submitAnswers}>
          {submitting ? 'Submitting…' : '📤 Submit All Answers'}
        </button>
      </div>
    );
  }

  // ── render: assessment list for a unit standard ──────────────────────────
  if (selectedUS) {
    const usProgress = getProgress(selectedUS.id);
    const summativeLocked = isSummativeLocked(selectedUS.id);

    return (
      <div>
        <button style={btnBack} onClick={() => { setSelectedUS(null); setAssessments(null); }}>
          ← Back to Unit Standards
        </button>
        <h2 style={{ color: '#fff', marginBottom: 4 }}>{selectedUS.unitStandardName}</h2>
        {selectedUS.qualificationName && (
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>{selectedUS.qualificationName}</p>
        )}

        {/* Progress indicator */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: usProgress?.formativeCompleted ? '#10b98120' : '#33415540',
            color: usProgress?.formativeCompleted ? '#10b981' : '#94a3b8',
            border: `1px solid ${usProgress?.formativeCompleted ? '#10b981' : '#475569'}`,
          }}>
            {usProgress?.formativeCompleted ? '✓' : '○'} Formative
          </span>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: usProgress?.summativeCompleted ? '#10b98120' : '#33415540',
            color: usProgress?.summativeCompleted ? '#10b981' : '#94a3b8',
            border: `1px solid ${usProgress?.summativeCompleted ? '#10b981' : '#475569'}`,
          }}>
            {usProgress?.summativeCompleted ? '✓' : '○'} Summative
          </span>
        </div>

        {assessments ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {/* Formative */}
            {(assessments.formative ?? []).map((a: any) => (
              <div key={a.id} style={cardStyle}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  📘 Formative Assessment #{a.id}
                </div>
                {usProgress?.formativeCompleted && (
                  <div style={{ color: '#10b981', fontSize: 12, marginBottom: 8 }}>✓ Submitted</div>
                )}
                <button
                  style={{ ...btnPrimary, width: 'auto', padding: '8px 20px' }}
                  onClick={() => openAssessment(a, 'Formative')}
                >
                  {usProgress?.formativeCompleted ? 'View / Re-submit →' : 'Open →'}
                </button>
              </div>
            ))}

            {/* Summative — locked until formative done */}
            {(assessments.summative ?? []).map((a: any) => (
              <div key={a.id} style={{
                ...cardStyle,
                opacity: summativeLocked ? 0.45 : 1,
                position: 'relative',
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  📗 Summative Assessment #{a.id}
                </div>
                {summativeLocked ? (
                  <div style={{ color: '#f59e0b', fontSize: 12, marginBottom: 8 }}>
                    🔒 Complete the Formative assessment first
                  </div>
                ) : usProgress?.summativeCompleted ? (
                  <div style={{ color: '#10b981', fontSize: 12, marginBottom: 8 }}>✓ Submitted</div>
                ) : null}
                <button
                  disabled={summativeLocked}
                  style={{
                    ...btnPrimary, width: 'auto', padding: '8px 20px',
                    background: summativeLocked ? '#334155' : '#10b981',
                    cursor: summativeLocked ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => !summativeLocked && openAssessment(a, 'Summative')}
                >
                  {usProgress?.summativeCompleted ? 'View / Re-submit →' : 'Open →'}
                </button>
              </div>
            ))}

            {!assessments.formative?.length && !assessments.summative?.length && (
              <p style={{ color: '#64748b' }}>No assessments found for this unit standard.</p>
            )}
          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>Loading assessments…</p>
        )}
      </div>
    );
  }

  // ── render: unit standard list ───────────────────────────────────────────
  return (
    <div>
      <h2 style={{ color: '#fff', marginTop: 0 }}>📝 My Assessments</h2>
      {loading ? (
        <p style={{ color: '#94a3b8' }}>Loading…</p>
      ) : qualifications.length === 0 ? (
        <p style={{ color: '#64748b' }}>No unit standards found. Contact your facilitator.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {qualifications.map((us: any, index: number) => {
            const unlocked = isUSUnlocked(index);
            const p = getProgress(us.id);
            const done = !!(p?.formativeCompleted && p?.summativeCompleted);

            return (
              <div
                key={us.id}
                onClick={() => unlocked && openUnitStandard(us)}
                style={{
                  ...cardStyle,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.45,
                  borderColor: done ? '#10b981' : unlocked ? '#334155' : '#1e293b',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {unlocked ? '' : '🔒 '}{us.unitStandardName}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 13 }}>
                      ID: {us.unitStandardId} · Credits: {us.credits} · Level: {us.level}
                    </div>
                    {us.qualificationName && (
                      <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{us.qualificationName}</div>
                    )}
                  </div>
                  {/* Status badge */}
                  <span style={{
                    marginLeft: 12, flexShrink: 0,
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: done ? '#10b98120' : unlocked ? '#0EA5E920' : '#33415540',
                    color: done ? '#10b981' : unlocked ? '#0EA5E9' : '#64748b',
                    border: `1px solid ${done ? '#10b981' : unlocked ? '#0EA5E9' : '#475569'}`,
                  }}>
                    {done ? '✓ Complete' : unlocked ? (index === 0 ? 'Start here' : 'Unlocked') : 'Locked'}
                  </span>
                </div>

                {/* Mini progress bar */}
                {unlocked && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 12,
                      background: p?.formativeCompleted ? '#10b98130' : '#33415560',
                      color: p?.formativeCompleted ? '#10b981' : '#64748b',
                    }}>
                      {p?.formativeCompleted ? '✓' : '○'} Formative
                    </span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 12,
                      background: p?.summativeCompleted ? '#10b98130' : '#33415560',
                      color: p?.summativeCompleted ? '#10b981' : '#64748b',
                    }}>
                      {p?.summativeCompleted ? '✓' : '○'} Summative
                    </span>
                  </div>
                )}

                {unlocked && !done && (
                  <div style={{ color: '#0EA5E9', fontSize: 13, marginTop: 8 }}>
                    Click to open assessments →
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Notices (read-only for learner) ─────────────────────────────────────────
function LearnerNotices({ token, user }: { token: string; user: LearnerUser }) {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/Announcements/learner/${user.id}`, token)
      .then(r => r.json())
      .then(data => setNotices(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id, token]);

  const priorityColor = (p: string) =>
    p === 'Urgent' ? '#ef4444' : p === 'Important' ? '#f59e0b' : '#0EA5E9';
  const priorityEmoji = (p: string) =>
    p === 'Urgent' ? '🚨' : p === 'Important' ? '⚠️' : '📢';

  return (
    <div>
      <h2 style={{ color: '#fff', marginTop: 0 }}>📢 Notice Board</h2>
      <div style={{ ...cardStyle, background: '#12172a', border: '1px solid #ec489933', marginBottom: 24 }}>
        <p style={{ color: '#f9a8d4', margin: 0, fontSize: 13 }}>
          Notices posted by your teacher appear here. You are also notified via WhatsApp and email when a new notice is posted.
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Loading…</p>
      ) : notices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p style={{ color: '#94a3b8', fontWeight: 600 }}>No notices yet</p>
          <p style={{ color: '#64748b', fontSize: 13 }}>Your teacher hasn't posted any notices yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {notices.map((n: any) => {
            const color = priorityColor(n.priority ?? 'Normal');
            return (
              <div key={n.id} style={{
                ...cardStyle,
                borderColor: `${color}55`,
                borderLeftWidth: 4,
                borderLeftColor: color,
                padding: 0,
                overflow: 'hidden',
              }}>
                {/* coloured top bar */}
                <div style={{ height: 3, background: color }} />
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{priorityEmoji(n.priority ?? 'Normal')}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{n.title}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                          background: `${color}22`, color, border: `1px solid ${color}55`,
                          textTransform: 'uppercase',
                        }}>{n.priority ?? 'Normal'}</span>
                      </div>
                      <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                        {n.className} · {n.teacherName} · {new Date(n.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Remedial Assessment ──────────────────────────────────────────────────────
function LearnerRemedial({ token, user }: { token: string; user: LearnerUser }) {
  // Progress rows where remedial is required but not yet completed
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Selected remedial item → questions / answer flow
  const [selected, setSelected] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  // ── load remedial items ───────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/api/LearnerAssessmentAnswers/learner/${user.id}/progress`, token);
        if (!res.ok) return;
        const progress: any[] = await res.json();
        // Keep only rows flagged for remedial but not yet completed
        setItems(progress.filter(p => p.remedialRequired && !p.remedialCompleted));
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, [user.id, token]);

  // ── open a remedial session ───────────────────────────────────────────────
  async function openRemedial(item: any) {
    setSelected(item); setMsg(''); setAnswers({});
    // Load summative questions for the relevant unit standard (remedial re-uses summative Qs)
    const res = await apiFetch(
      `/api/Assessments/summative/unit-standard/${item.projectQualificationUnitStandardId}`,
      token,
    );
    if (!res.ok) { setMsg('❌ Could not load remedial questions.'); return; }
    const assessments: any[] = await res.json();
    if (!assessments.length) { setMsg('❌ No summative assessment found for this unit standard.'); return; }
    const qRes = await apiFetch(`/api/Assessments/summative/${assessments[0].id}/questions`, token);
    if (qRes.ok) setQuestions(await qRes.json());
  }

  // ── submit remedial answers ───────────────────────────────────────────────
  async function submitRemedial() {
    if (!selected) return;
    setSubmitting(true); setMsg('');
    try {
      for (const q of questions) {
        const text = answers[q.id];
        if (!text?.trim()) continue;
        const fd = new FormData();
        fd.append('LearnerId', user.id.toString());
        fd.append('AssessmentId', selected.summativeAssessmentId?.toString() ?? '0');
        fd.append('AssessmentType', 'Summative');
        fd.append('QuestionId', q.id.toString());
        fd.append('QuestionNumber', q.questionNumber.toString());
        fd.append('IsRemedial', 'true');
        fd.append('ProjectQualificationUnitStandardId', selected.projectQualificationUnitStandardId.toString());
        const blob = new Blob([text], { type: 'text/plain' });
        fd.append('ScannedDocument', blob, `remedial_q${q.questionNumber}.txt`);
        const res = await fetch(`${API}/api/LearnerAssessmentAnswers/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: res.statusText }));
          throw new Error(err.message ?? `Upload failed for Q${q.questionNumber}`);
        }
      }
      setMsg('✅ Remedial answers submitted! Your assessor will review them shortly.');
      // Refresh list
      const progRes = await apiFetch(`/api/LearnerAssessmentAnswers/learner/${user.id}/progress`, token);
      if (progRes.ok) {
        const prog: any[] = await progRes.json();
        setItems(prog.filter(p => p.remedialRequired && !p.remedialCompleted));
      }
      setSelected(null); setQuestions([]); setAnswers({});
    } catch (e: any) {
      setMsg(`❌ ${e.message ?? 'Submission failed'}`);
    } finally { setSubmitting(false); }
  }

  // ── answer view ───────────────────────────────────────────────────────────
  if (selected && questions.length > 0) {
    return (
      <div>
        <button style={btnBack} onClick={() => { setSelected(null); setQuestions([]); setMsg(''); }}>
          ← Back to Remedial List
        </button>
        <h2 style={{ color: '#f59e0b', marginBottom: 4 }}>🔁 Remedial Assessment</h2>
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
          Unit Standard ID: {selected.projectQualificationUnitStandardId}
        </p>
        <div style={{ ...cardStyle, background: '#2d1f00', border: '1px solid #f59e0b44', marginBottom: 20 }}>
          <p style={{ color: '#fcd34d', margin: 0, fontSize: 13 }}>
            ⚠️ Your assessor has flagged this unit standard for remediation. Answer the questions below
            to demonstrate your competency. Your assessor will review and mark you competent once satisfied.
          </p>
        </div>
        {questions.map((q: any) => (
          <div key={q.id} style={{ ...cardStyle, marginBottom: 16, border: '1px solid #f59e0b44' }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#fcd34d' }}>
              Q{q.questionNumber}: {q.questionText}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>
              {q.allocatedMarks} mark{q.allocatedMarks !== 1 ? 's' : ''}
            </div>
            <textarea
              style={{ ...inputStyle, height: 100, resize: 'vertical' }}
              placeholder="Type your remedial answer here…"
              value={answers[q.id] ?? ''}
              onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
            />
          </div>
        ))}
        {msg && <p style={{ color: msg.startsWith('✅') ? '#10b981' : '#f87171', marginBottom: 12 }}>{msg}</p>}
        <button
          style={{ ...btnPrimary, background: '#f59e0b' }}
          disabled={submitting}
          onClick={submitRemedial}
        >
          {submitting ? 'Submitting…' : '📤 Submit Remedial Answers'}
        </button>
      </div>
    );
  }

  // ── list view ─────────────────────────────────────────────────────────────
  return (
    <div>
      <h2 style={{ color: '#fff', marginTop: 0 }}>🔁 Remedial Assessments</h2>
      <div style={{ ...cardStyle, background: '#1a1400', border: '1px solid #f59e0b33', marginBottom: 24 }}>
        <p style={{ color: '#fcd34d', margin: 0, fontSize: 13 }}>
          Remedial assessments are assigned when your assessor determines you need to redo
          part of a summative assessment. Once you submit your remedial answers, your assessor
          will review them and update your competency status.
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Loading…</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p style={{ color: '#10b981', fontWeight: 600 }}>No remedial assessments required</p>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            Your assessor has not flagged any unit standards for remediation.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((item: any) => (
            <div key={item.id} style={{ ...cardStyle, border: '1px solid #f59e0b55' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#fcd34d', marginBottom: 4 }}>
                    🔁 Remedial Required
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>
                    Unit Standard ID: {item.projectQualificationUnitStandardId}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 12,
                      background: item.formativeCompleted ? '#10b98130' : '#33415560',
                      color: item.formativeCompleted ? '#10b981' : '#64748b',
                    }}>
                      {item.formativeCompleted ? '✓' : '○'} Formative
                    </span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 12,
                      background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b44',
                    }}>
                      ⚠ Summative — Remedial Needed
                    </span>
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b',
                }}>Pending</span>
              </div>
              <button
                style={{ ...btnPrimary, background: '#f59e0b', marginTop: 16, width: 'auto', padding: '8px 24px' }}
                onClick={() => openRemedial(item)}
              >
                Start Remedial →
              </button>
            </div>
          ))}
        </div>
      )}
      {msg && <p style={{ color: '#f87171', marginTop: 12 }}>{msg}</p>}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155',
};
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155',
  borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', marginBottom: 0,
};
const labelStyle: React.CSSProperties = {
  display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 6, fontWeight: 500,
};
const btnPrimary: React.CSSProperties = {
  width: '100%', background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 8,
  padding: '12px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8,
  padding: '8px 16px', cursor: 'pointer', fontSize: 13,
};
const btnBack: React.CSSProperties = {
  background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8,
  padding: '6px 14px', cursor: 'pointer', marginBottom: 16, fontSize: 14,
};

// ─── Learner Attendance History ──────────────────────────────────────────────
const MONTHS_ATT = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function LearnerAttendance({ token, user }: { token: string; user: LearnerUser }) {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => { loadData(); }, [year, month]);

  async function loadData() {
    setLoading(true); setError('');
    try {
      const res = await apiFetch(`/api/AttendanceTracking/learner/${user.id}/calendar?year=${year}&month=${month}`, token);
      if (res.ok) setData(await res.json());
      else setError('No attendance data found for this period.');
    } catch { setError('Failed to load attendance data.'); }
    setLoading(false);
  }

  async function downloadPdf() {
    const res = await apiFetch(`/api/AttendanceTracking/learner/${user.id}/calendar/pdf?year=${year}&month=${month}`, token);
    if (res.ok) {
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Attendance_${year}_${String(month).padStart(2,'0')}.pdf`;
      a.click();
    } else { alert('Failed to generate PDF'); }
  }

  const today = new Date(); today.setHours(0,0,0,0);

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ color:'#e2e8f0', margin:0, fontSize:22 }}>📅 Attendance History</h2>
          <p style={{ color:'#94a3b8', margin:'4px 0 0', fontSize:14 }}>View your attendance record by month</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <select value={month} onChange={e=>setMonth(+e.target.value)}
            style={{ backgroundColor:'#1e293b',color:'white',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',fontSize:14 }}>
            {MONTHS_ATT.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(+e.target.value)}
            style={{ backgroundColor:'#1e293b',color:'white',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',fontSize:14 }}>
            {Array.from({length:5},(_,i)=>now.getFullYear()-2+i).map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={downloadPdf} disabled={!data}
            style={{ backgroundColor:'#0EA5E9',color:'white',border:'none',borderRadius:6,padding:'7px 16px',cursor:'pointer',fontSize:14,opacity:data?1:0.5 }}>
            ⬇ Download PDF
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:40, color:'#94a3b8' }}><div className="spinner-border text-primary"></div><p>Loading...</p></div>}
      {error && <div style={{ textAlign:'center', padding:40, color:'#ef4444' }}>{error}</div>}

      {data && !loading && (
        <>
          {/* Stats cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
            {[
              { label:'Expected', value:data.expectedAttendance, color:'#06b6d4', icon:'📋' },
              { label:'Present', value:data.actualAttendance, color:'#10b981', icon:'✅' },
              { label:'Absent', value:data.daysAbsent, color:'#ef4444', icon:'❌' },
              { label:'Late', value:data.lateDays, color:'#f59e0b', icon:'⏰' },
              { label:'Attendance Rate', value:`${data.attendanceRate?.toFixed(1)}%`, color:'#3b82f6', icon:'📊' },
              { label:'Contact Hours', value:`${data.totalContactHours?.toFixed(1)}h`, color:'#8b5cf6', icon:'⏱️' },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ backgroundColor:'#1e293b', borderRadius:10, padding:'14px 16px', borderLeft:`4px solid ${color}` }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                <div style={{ fontWeight:700, fontSize:22, color }}>{value}</div>
                <div style={{ color:'#94a3b8', fontSize:12 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ backgroundColor:'#1e293b', borderRadius:10, padding:16, marginBottom:20 }}>
            <div style={{ fontWeight:700, color:'#e2e8f0', marginBottom:12, fontSize:16 }}>
              {MONTHS_ATT[data.month-1]} {data.year}
            </div>
            {/* Day headers */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>(
                <div key={d} style={{ backgroundColor:'#0EA5E9', color:'white', textAlign:'center', padding:'6px 4px', borderRadius:5, fontSize:12, fontWeight:700 }}>{d}</div>
              ))}
            </div>
            {/* Calendar weeks */}
            {(() => {
              const firstDay = new Date(data.year, data.month-1, 1);
              let off = firstDay.getDay(); off = off===0?6:off-1;
              const cells: any[] = [...Array(off).fill(null), ...data.calendarDays];
              while (cells.length % 7 !== 0) cells.push(null);
              const weeks: any[][] = [];
              for (let i=0; i<cells.length; i+=7) weeks.push(cells.slice(i,i+7));
              return weeks.map((wk,wi) => (
                <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
                  {wk.map((day,di) => {
                    if (!day) return <div key={`e${wi}${di}`} style={{ minHeight:70, backgroundColor:'#0f172a', borderRadius:5 }}/>;
                    const dt = new Date(data.year, data.month-1, day.day);
                    const fut = dt > today;
                    const absent = day.status==='Absent'||(day.status==='No Record'&&!fut&&!day.isWeekend);
                    let bg='#0f172a', border='#334155', tc='#64748b', lbl='';
                    if (day.isWeekend) { bg='#0a0f1a'; border='#1e293b'; tc='#475569'; lbl='WKD'; }
                    else if (day.status==='Present') { bg='#064e3b'; border='#10b981'; tc='#6ee7b7'; lbl='✅ Present'; }
                    else if (absent) { bg='#7f1d1d'; border='#ef4444'; tc='#fca5a5'; lbl='❌ Absent'; }
                    else if (day.status==='Late') { bg='#78350f'; border='#f59e0b'; tc='#fcd34d'; lbl='⏰ Late'; }
                    else if (fut) { tc='#64748b'; lbl='Upcoming'; }
                    return (
                      <div key={day.date} style={{ backgroundColor:bg, border:`1px solid ${border}`, borderRadius:5, minHeight:70, padding:6 }}>
                        <div style={{ fontWeight:700, fontSize:13, color:'white', marginBottom:3 }}>{day.day}</div>
                        <div style={{ fontSize:10, color:tc, fontWeight:600 }}>{lbl}</div>
                        {(day.status==='Present'||day.status==='Late') && day.clockInTime && day.clockOutTime && (
                          <div style={{ fontSize:9, color:tc, marginTop:2, lineHeight:1.4 }}>
                            {new Date(day.clockInTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                            {' - '}
                            {new Date(day.clockOutTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                            {day.contactHours > 0 && <div style={{ color:'#93c5fd' }}>{day.contactHours}h</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>

          {/* Legend */}
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:20, fontSize:12, color:'#94a3b8' }}>
            {[['#064e3b','#10b981','Present'],['#7f1d1d','#ef4444','Absent'],['#78350f','#f59e0b','Late'],['#0f172a','#334155','Upcoming'],['#0a0f1a','#1e293b','Weekend']].map(([bg,br,lb])=>(
              <div key={lb} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:14, height:14, backgroundColor:bg, border:`1px solid ${br}`, borderRadius:3 }}></div>
                <span>{lb}</span>
              </div>
            ))}
          </div>

          {/* Project info */}
          {data.projectName && (
            <div style={{ backgroundColor:'#1e293b', borderRadius:10, padding:16, border:'1px solid #334155' }}>
              <div style={{ fontWeight:700, color:'#0EA5E9', marginBottom:10, fontSize:14 }}>📁 Project Information</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10, fontSize:13 }}>
                {[['Project',data.projectName],['Site',data.siteName],['Class',data.className],['Facilitator',data.teacherName],['Province',data.province],['Pathway',data.pathway]].filter(([,v])=>v).map(([l,v])=>(
                  <div key={String(l)}>
                    <span style={{ color:'#94a3b8' }}>{l}: </span>
                    <span style={{ color:'white', fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
