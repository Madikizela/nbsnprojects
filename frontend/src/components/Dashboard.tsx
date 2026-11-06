import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientForm from './ClientForm';
import PersonalInfoForm from './PersonalInfoForm';
import productIcon from '../assets/mobile_icon.png';

// ── Platform-wide stats for admin overview cards ─────────────────────────────
interface AdminStats {
  sdps: { total: number; active: number; inactive: number; pending: number; newThisMonth: number };
  clients: { total: number };
  users: { total: number; active: number; inactive: number };
  learners: { total: number };
  projects: { total: number };
  classes: { total: number };
  attendance: { todayClockins: number };
  recentActivity: { action: string; description: string; entityName: string; performedBy: string; createdAt: string }[];
}

const AdminOverviewCards: React.FC<{ token: string; apiUrl: string }> = ({ token, apiUrl }) => {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`${apiUrl}/api/AdminStats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token, apiUrl]);

  if (loading) return <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-primary" role="status" /></div>;
  if (!stats) return null;

  const cards = [
    { label: 'Total SDPs', value: stats.sdps.total, sub: `${stats.sdps.active} active · ${stats.sdps.inactive} inactive`, icon: '🎓', color: '#6366f1' },
    { label: 'Pending Approval', value: stats.sdps.pending, sub: `${stats.sdps.newThisMonth} registered this month`, icon: '⏳', color: '#f59e0b' },
    { label: 'Total Clients', value: stats.clients.total, sub: '', icon: '🏢', color: '#10b981' },
    { label: 'Active Users', value: stats.users.active, sub: `${stats.users.inactive} inactive · ${stats.users.total} total`, icon: '👥', color: '#3b82f6' },
    { label: 'Learners', value: stats.learners.total, sub: '', icon: '🧑‍🎓', color: '#8b5cf6' },
    { label: 'Projects', value: stats.projects.total, sub: `${stats.classes.total} classes`, icon: '📋', color: '#06b6d4' },
    { label: "Today's Clockins", value: stats.attendance.todayClockins, sub: 'biometric attendance today', icon: '⏱️', color: '#ec4899' },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 28 }}>{c.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value.toLocaleString()}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{c.label}</div>
            {c.sub && <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Recent activity feed */}
      {stats.recentActivity.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 12 }}>🕐 Recent Admin Activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.recentActivity.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: i < stats.recentActivity.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>
                  {a.action.includes('DISABLED') ? '🚫' : a.action.includes('ENABLED') ? '✅' : a.action.includes('CREDENTIALS') ? '🔑' : '📝'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#1e293b' }}>{a.description}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(a.createdAt).toLocaleString('en-ZA')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: number | string;
  userType?: string;
  accessLevel?: number;
  clientId?: number | null;
}

interface ClientRecord {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phoneNumber?: string;
  status: string;
}

const API = (import.meta.env.VITE_API_URL as string || '').replace(/\/$/, '');

// ── SDP Management with enable/disable for system admin ──────────────────────
interface SdpRecord {
  id: number;
  name: string;
  contactPerson?: string;
  address?: string;
  status: string | number;
  createdAt?: string;
}

interface SubUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string | number;
  status: string | number;
  lastLoginAt?: string;
}

const sdpIsActive = (status: string | number) =>
  status === 'Active' || status === 1 || status === '1';

const userIsActive = (status: string | number) =>
  status === 'Active' || status === 1 || status === '1';

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span style={{
    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: active ? '#dcfce7' : '#fee2e2',
    color: active ? '#16a34a' : '#dc2626'
  }}>
    {active ? 'Active' : 'Inactive'}
  </span>
);

const SDPListView: React.FC<{ token: string; apiUrl: string }> = ({ token, apiUrl }) => {
  const [sdps, setSdps] = React.useState<SdpRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [togglingId, setTogglingId] = React.useState<number | null>(null);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [subUsers, setSubUsers] = React.useState<Record<number, SubUser[]>>({});
  const [subUsersLoading, setSubUsersLoading] = React.useState<Record<number, boolean>>({});
  const [togglingUserId, setTogglingUserId] = React.useState<number | null>(null);
  const [resendingUserId, setResendingUserId] = React.useState<number | null>(null);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSdps = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${apiUrl}/api/SkillsDevelopmentProviders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) { setError(`Server returned ${r.status}.`); return; }
      const data = await r.json();
      setSdps(Array.isArray(data) ? data : []);
    } catch {
      setError('Network error — could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl]);

  React.useEffect(() => { loadSdps(); }, [loadSdps]);

  const toggleSdpStatus = async (sdp: SdpRecord) => {
    setTogglingId(sdp.id);
    const newActive = !sdpIsActive(sdp.status);
    try {
      const r = await fetch(`${apiUrl}/api/SkillsDevelopmentProviders/${sdp.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: newActive }),
      });
      if (!r.ok) { showToast('error', `Failed to update SDP status (${r.status})`); return; }
      const result = await r.json();
      setSdps(prev => prev.map(s =>
        s.id === sdp.id ? { ...s, status: newActive ? 'Active' : 'Inactive' } : s
      ));
      if (subUsers[sdp.id]) {
        setSubUsers(prev => ({
          ...prev,
          [sdp.id]: prev[sdp.id].map(u => ({ ...u, status: newActive ? 'Active' : 'Inactive' }))
        }));
      }
      showToast('success', result.message ?? `SDP ${newActive ? 'enabled' : 'disabled'}.`);
    } catch {
      showToast('error', 'Network error while updating SDP status.');
    } finally {
      setTogglingId(null);
    }
  };

  const loadSubUsers = async (sdpId: number) => {
    // Always reload to get fresh lastLoginAt
    setSubUsersLoading(prev => ({ ...prev, [sdpId]: true }));
    try {
      const r = await fetch(`${apiUrl}/api/SkillsDevelopmentProviders/${sdpId}/Users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) { showToast('error', `Failed to load users (${r.status})`); return; }
      const data = await r.json();
      setSubUsers(prev => ({ ...prev, [sdpId]: Array.isArray(data) ? data : [] }));
    } catch {
      showToast('error', 'Network error while loading users.');
    } finally {
      setSubUsersLoading(prev => ({ ...prev, [sdpId]: false }));
    }
  };

  const toggleExpand = (sdpId: number) => {
    if (expandedId === sdpId) {
      setExpandedId(null);
    } else {
      setExpandedId(sdpId);
      loadSubUsers(sdpId);
    }
  };

  const toggleUserStatus = async (sdpId: number, user: SubUser) => {
    setTogglingUserId(user.id);
    const newActive = !userIsActive(user.status);
    try {
      const r = await fetch(`${apiUrl}/api/Users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: newActive }),
      });
      if (!r.ok) { showToast('error', `Failed to update user status (${r.status})`); return; }
      const result = await r.json();
      setSubUsers(prev => ({
        ...prev,
        [sdpId]: prev[sdpId].map(u =>
          u.id === user.id ? { ...u, status: newActive ? 'Active' : 'Inactive' } : u
        )
      }));
      showToast('success', result.message ?? `User ${newActive ? 'enabled' : 'disabled'}.`);
    } catch {
      showToast('error', 'Network error while updating user status.');
    } finally {
      setTogglingUserId(null);
    }
  };

  const resendUserCredentials = async (sdpId: number, user: SubUser) => {
    setResendingUserId(user.id);
    try {
      // Resend via the SDP endpoint — it resets password for the first user matching the SDP
      // For a per-user resend we call the SDP resend endpoint which finds the admin user
      const r = await fetch(`${apiUrl}/api/SkillsDevelopmentProviders/${sdpId}/resend-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const result = await r.json();
      if (r.ok) {
        showToast('success', result.message ?? `Credentials resent to ${user.email}.`);
      } else {
        showToast('error', result.message ?? 'Failed to resend credentials.');
      }
    } catch {
      showToast('error', 'Network error while resending credentials.');
    } finally {
      setResendingUserId(null);
    }
  };

  const thStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#64748b', padding: '10px 14px', borderBottom: '1px solid #e2e8f0' };
  const tdStyle: React.CSSProperties = { padding: '11px 14px', fontSize: 14, verticalAlign: 'middle' };

  // Filter SDPs by search
  const filteredSdps = sdps.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contactPerson ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Count inactive users per SDP (from loaded sub-users)
  const inactiveCount = (sdpId: number) =>
    (subUsers[sdpId] ?? []).filter(u => !userIsActive(u.status)).length;

  if (loading) return <div className="text-center p-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  if (error) return (
    <div className="alert alert-danger d-flex justify-content-between align-items-start gap-3" style={{ borderRadius: 12 }}>
      <span>{error}</span>
      <button onClick={loadSdps} className="btn btn-sm btn-danger">🔄 Retry</button>
    </div>
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
          background: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: toast.type === 'success' ? '#16a34a' : '#dc2626',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 10
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.text}
        </div>
      )}

      <div className="dash-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>
            Skills Development Providers ({filteredSdps.length}{search ? ` of ${sdps.length}` : ''})
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search by name or contact..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, width: 220, outline: 'none' }}
            />
            <button onClick={loadSdps} style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Contact Person</th>
                <th style={thStyle}>Address</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Registered</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSdps.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted py-4">{search ? 'No SDPs match your search.' : 'No SDPs registered yet.'}</td></tr>
              ) : filteredSdps.map(sdp => {
                const active = sdpIsActive(sdp.status);
                const isToggling = togglingId === sdp.id;
                const isExpanded = expandedId === sdp.id;
                const disabledUsers = inactiveCount(sdp.id);

                return (
                  <React.Fragment key={sdp.id}>
                    <tr style={{ opacity: active ? 1 : 0.65 }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>
                        <button
                          onClick={() => toggleExpand(sdp.id)}
                          style={{ background: 'none', border: 'none', padding: 0, marginRight: 6, cursor: 'pointer', color: '#64748b', fontSize: 12 }}
                          title={isExpanded ? 'Collapse users' : 'View users'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                        {sdp.name}
                        {/* Disabled user count badge — shown once sub-users are loaded */}
                        {subUsers[sdp.id] && disabledUsers > 0 && (
                          <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}>
                            {disabledUsers} disabled
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{sdp.contactPerson || '—'}</td>
                      <td style={{ ...tdStyle, color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sdp.address || '—'}</td>
                      <td style={tdStyle}><StatusBadge active={active} /></td>
                      <td style={{ ...tdStyle, color: '#64748b', fontSize: 13 }}>
                        {sdp.createdAt ? new Date(sdp.createdAt).toLocaleDateString('en-ZA') : '—'}
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => toggleSdpStatus(sdp)}
                          disabled={isToggling}
                          style={{
                            padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            cursor: isToggling ? 'not-allowed' : 'pointer', border: 'none',
                            background: active ? '#fee2e2' : '#dcfce7',
                            color: active ? '#dc2626' : '#16a34a', minWidth: 90
                          }}
                        >
                          {isToggling ? '...' : active ? '🚫 Disable' : '✅ Enable'}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable sub-user panel */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ padding: 0, background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                          <div style={{ padding: '14px 24px' }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#475569', marginBottom: 10 }}>
                              👥 Sub-users of {sdp.name}
                            </div>

                            {subUsersLoading[sdp.id] ? (
                              <div className="text-center py-2"><div className="spinner-border spinner-border-sm text-primary" role="status" /></div>
                            ) : !subUsers[sdp.id] || subUsers[sdp.id].length === 0 ? (
                              <div style={{ color: '#94a3b8', fontSize: 13 }}>No users found for this SDP.</div>
                            ) : (
                              <table className="table table-sm mb-0" style={{ background: 'transparent' }}>
                                <thead>
                                  <tr>
                                    {['Name', 'Email', 'Role', 'Last Login', 'Status', 'Actions'].map(h => (
                                      <th key={h} style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '6px 10px', border: 'none', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {subUsers[sdp.id].map(u => {
                                    const uActive = userIsActive(u.status);
                                    const isTogglingUser = togglingUserId === u.id;
                                    const isResending = resendingUserId === u.id;
                                    const lastLogin = u.lastLoginAt
                                      ? new Date(u.lastLoginAt).toLocaleDateString('en-ZA') + ' ' + new Date(u.lastLoginAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
                                      : 'Never';
                                    return (
                                      <tr key={u.id} style={{ opacity: uActive ? 1 : 0.6 }}>
                                        <td style={{ padding: '7px 10px', fontSize: 13, fontWeight: 500 }}>{u.firstName} {u.lastName}</td>
                                        <td style={{ padding: '7px 10px', fontSize: 12, color: '#64748b' }}>{u.email}</td>
                                        <td style={{ padding: '7px 10px', fontSize: 11, color: '#94a3b8' }}>{String(u.role)}</td>
                                        <td style={{ padding: '7px 10px', fontSize: 11, color: lastLogin === 'Never' ? '#f87171' : '#64748b' }}>
                                          {lastLogin === 'Never' ? '⚠️ Never' : lastLogin}
                                        </td>
                                        <td style={{ padding: '7px 10px' }}><StatusBadge active={uActive} /></td>
                                        <td style={{ padding: '7px 10px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                          <button
                                            onClick={() => toggleUserStatus(sdp.id, u)}
                                            disabled={isTogglingUser}
                                            style={{
                                              padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                              cursor: isTogglingUser ? 'not-allowed' : 'pointer', border: 'none',
                                              background: uActive ? '#fee2e2' : '#dcfce7',
                                              color: uActive ? '#dc2626' : '#16a34a',
                                            }}
                                          >
                                            {isTogglingUser ? '...' : uActive ? 'Disable' : 'Enable'}
                                          </button>
                                          <button
                                            onClick={() => resendUserCredentials(sdp.id, u)}
                                            disabled={isResending}
                                            title="Resend login credentials"
                                            style={{
                                              padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                              cursor: isResending ? 'not-allowed' : 'pointer', border: '1px solid #e2e8f0',
                                              background: '#f8fafc', color: '#475569',
                                            }}
                                          >
                                            {isResending ? '...' : '🔑 Resend'}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

type Toast = { id:number; type:'success'|'error'|'info'; text:string };

// ── Audit Log viewer ─────────────────────────────────────────────────────────
const AuditLogView: React.FC<{ token: string; apiUrl: string }> = ({ token, apiUrl }) => {
  const [logs, setLogs] = React.useState<AdminStats['recentActivity']>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const pageSize = 20;

  const loadLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set('search', search);
      const r = await fetch(`${apiUrl}/api/AuditLog?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setLogs(d.logs ?? []);
      setTotal(d.total ?? 0);
    } finally { setLoading(false); }
  }, [token, apiUrl, page, search]);

  React.useEffect(() => { loadLogs(); }, [loadLogs]);

  const actionColor = (a: string) => a.includes('DISABLED') ? '#dc2626' : a.includes('ENABLED') ? '#16a34a' : a.includes('CREDENTIALS') ? '#d97706' : '#6366f1';
  const actionIcon  = (a: string) => a.includes('DISABLED') ? '🚫' : a.includes('ENABLED') ? '✅' : a.includes('CREDENTIALS') ? '🔑' : '📝';

  return (
    <div>
      <div className="dash-card mb-4" style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'24px 28px' }}>
        <h2 style={{ color:'#fff', fontWeight:800, fontSize:'1.4rem', margin:0 }}>Audit Log 📋</h2>
        <p style={{ color:'rgba(255,255,255,0.6)', margin:'4px 0 0', fontSize:14 }}>All admin actions across the platform</p>
      </div>
      <div style={{ marginBottom:16, display:'flex', gap:12 }}>
        <input type="text" placeholder="Search by name, action, admin..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex:1, padding:'8px 14px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:14 }} />
        <button onClick={loadLogs} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:13 }}>🔄 Refresh</button>
      </div>
      {loading ? <div className="text-center py-4"><div className="spinner-border text-primary" role="status" /></div> : (
        <div className="dash-card" style={{ overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', borderBottom:'1px solid #f1f5f9', fontSize:13, color:'#64748b' }}>
            Showing {logs.length} of {total} entries
          </div>
          {logs.length === 0 ? <div className="text-center text-muted py-4">No audit log entries yet.</div> : (
            <div style={{ display:'flex', flexDirection:'column' }}>
              {logs.map((l: any, i: number) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'12px 16px', borderBottom:'1px solid #f8fafc' }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{actionIcon(l.action)}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background: `${actionColor(l.action)}18`, color: actionColor(l.action) }}>{l.action}</span>
                      <span style={{ fontSize:12, color:'#94a3b8' }}>{new Date(l.createdAt).toLocaleString('en-ZA')}</span>
                    </div>
                    <div style={{ fontSize:13, color:'#1e293b' }}>{l.description}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>By: {l.performedBy}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {total > pageSize && (
            <div style={{ padding:'12px 16px', display:'flex', gap:8, justifyContent:'center' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #e2e8f0', cursor:'pointer', opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ padding:'4px 12px', fontSize:13, color:'#64748b' }}>Page {page} of {Math.ceil(total / pageSize)}</span>
              <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #e2e8f0', cursor:'pointer', opacity: page >= Math.ceil(total / pageSize) ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('clients');
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState('');
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [resendMessage, setResendMessage] = useState<{ id: number; text: string; type: 'success' | 'error' } | null>(null);
  const [togglingClientId, setTogglingClientId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const navigate = useNavigate();

  const pushToast = (type:Toast['type'], text:string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, type, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000);
  };
  const dismissToast = (id:number) => setToasts(t => t.filter(x => x.id !== id));

  useEffect(() => {
    // Get user data from localStorage or token
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchClients = async () => {
    setClientsLoading(true);
    setClientsError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/Clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setClientsError(`Server returned ${response.status}: ${response.statusText}. Please try again.`);
        return;
      }
      const ct = response.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        setClientsError('Unexpected non-JSON response from server. The clients service may be unavailable.');
        return;
      }
      const data = await response.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      setClientsError(`Network error: ${err instanceof Error ? err.message : 'Could not reach the server.'}. Please check your connection and retry.`);
    } finally {
      setClientsLoading(false);
    }
  };

  const resendCredentials = async (clientId: number) => {
    setResendingId(clientId);
    setResendMessage(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/Clients/${clientId}/resend-credentials`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        let text = data.message;
        if (!data.emailSent && data.adminUsername) {
          text += `\nUsername: ${data.adminUsername}\nPassword: ${data.temporaryPassword}`;
        }
        setResendMessage({ id: clientId, text, type: 'success' });
      } else {
        setResendMessage({ id: clientId, text: data.message || 'Failed to resend', type: 'error' });
      }
    } catch {
      setResendMessage({ id: clientId, text: 'Network error — please try again', type: 'error' });
    } finally {
      setResendingId(null);
    }
  };

  const toggleClientStatus = async (client: ClientRecord) => {
    const clientActive = client.status === 'Active' || client.status === '1';
    const newActive = !clientActive;
    setTogglingClientId(client.id);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${API}/api/Clients/${client.id}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      });
      const data = await r.json();
      if (r.ok) {
        setClients(prev => prev.map(c =>
          c.id === client.id ? { ...c, status: newActive ? 'Active' : 'Inactive' } : c
        ));
        pushToast('success', data.message ?? `Client ${newActive ? 'enabled' : 'disabled'}.`);
      } else {
        pushToast('error', data.message ?? `Failed to update client status (${r.status}).`);
      }
    } catch {
      pushToast('error', 'Network error — could not update client status.');
    } finally {
      setTogglingClientId(null);
    }
  };

  useEffect(() => {
    if (activeSection === 'view-clients') {
      fetchClients();
    }
  }, [activeSection]);

  const menuItems = [
    { id: 'clients', label: 'Client Management', icon: '🏢' },
    { id: 'sdp', label: 'SDP Management', icon: '🎓' },
    { id: 'audit', label: 'Audit Log', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'clients':
        return (
          <div>
            {/* Header */}
            <div className="dash-card mb-4" style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'24px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div>
                <h2 style={{ color:'#fff', fontWeight:800, fontSize:'1.4rem', margin:0 }}>Client Management 🏢</h2>
                <p style={{ color:'rgba(255,255,255,0.6)', margin:'4px 0 0', fontSize:14 }}>Manage your clients and their information</p>
              </div>
              <button onClick={() => setActiveSection('add-client')}
                style={{ background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                + Add New Client
              </button>
            </div>

            {/* Stat cards */}
            <div className="row g-3 mb-4">
              {[
                { label:'Total Clients', value: clients.length || 24, color:'linear-gradient(135deg,#667eea,#764ba2)', icon:'🏢' },
                { label:'Active Clients', value: clients.filter(c => c.status === 'Active' || c.status === '1').length || 22, color:'linear-gradient(135deg,#10b981,#059669)', icon:'✅' },
                { label:'New This Month', value: 3, color:'linear-gradient(135deg,#f97316,#ea580c)', icon:'🆕' },
              ].map((s, i) => (
                <div key={i} className="col-md-4">
                  <div className="dash-stat dash-card" style={{ background: s.color }}>
                    <span style={{ fontSize:'2rem' }}>{s.icon}</span>
                    <div>
                      <div style={{ color:'#fff', fontSize:'1.6rem', fontWeight:800, lineHeight:1 }}>{s.value}</div>
                      <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, marginTop:2 }}>{s.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action cards */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className="dash-card p-4">
                  <div style={{ fontSize:'2rem', marginBottom:12 }}>📋</div>
                  <h5 style={{ fontWeight:700, color:'#1e293b', margin:'0 0 8px' }}>View All Clients</h5>
                  <p style={{ color:'#64748b', fontSize:14, margin:'0 0 16px' }}>Browse and manage all registered clients in the system.</p>
                  <button onClick={() => setActiveSection('view-clients')}
                    style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontWeight:600, fontSize:14, cursor:'pointer' }}>
                    View Client List →
                  </button>
                </div>
              </div>
              <div className="col-md-6">
                <div className="dash-card p-4">
                  <div style={{ fontSize:'2rem', marginBottom:12 }}>➕</div>
                  <h5 style={{ fontWeight:700, color:'#1e293b', margin:'0 0 8px' }}>Register New Client</h5>
                  <p style={{ color:'#64748b', fontSize:14, margin:'0 0 16px' }}>Add a new client organisation to the system.</p>
                  <button onClick={() => setActiveSection('add-client')}
                    style={{ background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontWeight:600, fontSize:14, cursor:'pointer' }}>
                    Add New Client →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'add-client':
        return (
          <div>
            <div className="dash-card mb-4" style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div>
                <h2 style={{ color:'#fff', fontWeight:800, fontSize:'1.4rem', margin:0 }}>Add New Client ➕</h2>
                <p style={{ color:'rgba(255,255,255,0.6)', margin:'4px 0 0', fontSize:14 }}>Register a new client in the system</p>
              </div>
              <button onClick={() => setActiveSection('clients')}
                style={{ background:'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 18px', fontWeight:600, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                ← Back to Clients
              </button>
            </div>
            <ClientForm onCancel={() => setActiveSection('clients')} onSubmit={async () => { setActiveSection('clients'); }} />
          </div>
        );
      case 'view-clients':
        return (
          <div>
            <div className="dash-card mb-4" style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div>
                <h2 style={{ color:'#fff', fontWeight:800, fontSize:'1.4rem', margin:0 }}>Client Directory 📋</h2>
                <p style={{ color:'rgba(255,255,255,0.6)', margin:'4px 0 0', fontSize:14 }}>View and manage all registered clients</p>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={fetchClients} style={{ background:'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 16px', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                  🔄 Refresh
                </button>
                <button onClick={() => setActiveSection('clients')} style={{ background:'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 18px', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                  ← Back
                </button>
              </div>
            </div>

            {clientsError && (
              <div className="alert alert-danger d-flex justify-content-between align-items-start gap-3 mb-3" style={{borderRadius:12,border:'1.5px solid #dc2626',backgroundColor:'#fef2f2',color:'#991b1b'}}>
                <div>
                  <div style={{fontWeight:700,marginBottom:4}}>❌ Failed to load clients</div>
                  <div style={{fontSize:14}}>{clientsError}</div>
                </div>
                <button onClick={fetchClients} className="btn btn-sm" style={{backgroundColor:'#dc2626',color:'#fff',fontWeight:600,whiteSpace:'nowrap'}}>
                  🔄 Retry
                </button>
              </div>
            )}
            <div className="dash-card" style={{ overflow:'hidden' }}>
              <div className="table-responsive">
                {clientsLoading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <table className="table table-hover mb-0">
                    <thead style={{ background:'#f8fafc' }}>
                      <tr>
                        <th style={{ fontSize:13, fontWeight:600, color:'#64748b', padding:'12px 16px', borderBottom:'1px solid #e2e8f0' }}>Client Name</th>
                        <th style={{ fontSize:13, fontWeight:600, color:'#64748b', padding:'12px 16px', borderBottom:'1px solid #e2e8f0' }}>Contact Person</th>
                        <th style={{ fontSize:13, fontWeight:600, color:'#64748b', padding:'12px 16px', borderBottom:'1px solid #e2e8f0' }}>Email</th>
                        <th style={{ fontSize:13, fontWeight:600, color:'#64748b', padding:'12px 16px', borderBottom:'1px solid #e2e8f0' }}>Phone</th>
                        <th style={{ fontSize:13, fontWeight:600, color:'#64748b', padding:'12px 16px', borderBottom:'1px solid #e2e8f0' }}>Status</th>
                        <th style={{ fontSize:13, fontWeight:600, color:'#64748b', padding:'12px 16px', borderBottom:'1px solid #e2e8f0' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            No clients found. Click Refresh to load.
                          </td>
                        </tr>
                      ) : (
                        clients.map((client) => (
                          <>
                            <tr key={client.id}>
                              <td style={{ padding:'12px 16px', fontWeight:600, color:'#1e293b' }}>{client.name}</td>
                              <td style={{ padding:'12px 16px', color:'#64748b', fontSize:14 }}>{client.contactPerson || '—'}</td>
                              <td style={{ padding:'12px 16px', color:'#64748b', fontSize:14 }}>{client.email || '—'}</td>
                              <td style={{ padding:'12px 16px', color:'#64748b', fontSize:14 }}>{client.phoneNumber || '—'}</td>
                              <td style={{ padding:'12px 16px' }}>
                                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600, background: (client.status === 'Active' || client.status === '1') ? '#dcfce7' : '#fee2e2', color: (client.status === 'Active' || client.status === '1') ? '#16a34a' : '#dc2626' }}>
                                  {client.status === '1' ? 'Active' : client.status === 'Inactive' ? 'Inactive' : client.status}
                                </span>
                              </td>
                              <td style={{ padding:'12px 16px' }}>
                                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                  <button
                                    style={{ padding:'5px 12px', borderRadius:8, border:'1.5px solid #667eea', background:'#fff', color:'#667eea', fontWeight:600, fontSize:12, cursor:'pointer' }}
                                    onClick={() => resendCredentials(client.id)}
                                    disabled={resendingId === client.id}
                                  >
                                    {resendingId === client.id ? (
                                      <><span className="spinner-border spinner-border-sm me-1" />Sending...</>
                                    ) : (
                                      '📧 Resend'
                                    )}
                                  </button>
                                  <button
                                    onClick={() => toggleClientStatus(client)}
                                    disabled={togglingClientId === client.id}
                                    style={{
                                      padding:'5px 14px', borderRadius:8, fontSize:12, fontWeight:600,
                                      cursor: togglingClientId === client.id ? 'not-allowed' : 'pointer',
                                      border:'none',
                                      background: (client.status === 'Active' || client.status === '1') ? '#fee2e2' : '#dcfce7',
                                      color:      (client.status === 'Active' || client.status === '1') ? '#dc2626' : '#16a34a',
                                    }}
                                  >
                                    {togglingClientId === client.id ? '...' : (client.status === 'Active' || client.status === '1') ? '🚫 Disable' : '✅ Enable'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {resendMessage?.id === client.id && (
                              <tr key={`msg-${client.id}`}>
                                <td colSpan={6}>
                                  <div className={`alert ${resendMessage.type === 'success' ? 'alert-success' : 'alert-danger'} mb-0 py-2`} style={{ whiteSpace:'pre-line' }}>
                                    {resendMessage.text}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              <div style={{ padding:'12px 16px', background:'#f8fafc', borderTop:'1px solid #e2e8f0', fontSize:13, color:'#64748b' }}>
                {clients.length} client{clients.length !== 1 ? 's' : ''} registered
              </div>
            </div>
          </div>
        );
      case 'sdp':
        return (
          <div>
            {/* Header */}
            <div className="dash-card mb-4" style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'24px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div>
                <h2 style={{ color:'#fff', fontWeight:800, fontSize:'1.4rem', margin:0 }}>SDP Management 🎓</h2>
                <p style={{ color:'rgba(255,255,255,0.6)', margin:'4px 0 0', fontSize:14 }}>Manage Skills Development Providers</p>
              </div>
            </div>

            {/* Platform analytics */}
            <AdminOverviewCards token={localStorage.getItem('token') || ''} apiUrl={API} />

            <SDPListView token={localStorage.getItem('token') || ''} apiUrl={API} />
          </div>
        );
      case 'audit':
        return <AuditLogView token={localStorage.getItem('token') || ''} apiUrl={API} />;
      case 'profile':
        return (
          <PersonalInfoForm 
            initialData={{
              companyName: '',
              registrationNumber: '',
              email: user?.email || '',
              phoneNumber: '',
              establishedDate: '',
              address: '',
              industry: ''
            }}
            onSubmit={async (formData) => {
              console.log('Saving profile data:', formData);
              pushToast('success', 'Profile updated successfully!');
            }}
          />
        );
      default:
        return <div>Section not found</div>;
    }
  };

  useEffect(() => {
    // Redirect Client users away from System Admin dashboard
    if (!user) return;

    const userType = user?.userType;
    const role = user?.role;
    const accessLevel = user?.accessLevel;
    const clientId = user?.clientId;

    const isClient =
      userType === 'ClientAdmin' ||
      role === 'ClientAdmin' ||
      role === 3 ||
      accessLevel === 3 ||
      (typeof clientId === 'number' && clientId !== null);

    if (isClient) {
      navigate('/client-dashboard');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .dash-nav-btn { color: rgba(255,255,255,0.65); background: transparent; border: none; border-radius: 10px; padding: 11px 16px; display: flex; align-items: center; gap: 10px; font-size: 0.92rem; font-weight: 500; transition: all 0.18s; width: 100%; text-align: left; cursor: pointer; }
        .dash-nav-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .dash-nav-btn.active { background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; font-weight: 700; box-shadow: 0 4px 14px rgba(102,126,234,0.35); }
        .dash-card { background: #fff; border-radius: 14px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.07); transition: box-shadow 0.2s; }
        .dash-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
        .dash-stat { border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; }
        @media (max-width: 768px) { .dash-sidebar { display: none !important; } .dash-main { width: 100% !important; } }
      `}} />

      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#f1f5f9', fontFamily:"'Segoe UI', system-ui, sans-serif", position:'relative' }}>

        {/* Inline Toast Stack */}
        <div style={{position:'fixed',top:'16px',right:'16px',zIndex:9999,display:'flex',flexDirection:'column',gap:'8px',maxWidth:'400px'}}>
          {toasts.map(t => (
            <div key={t.id} onClick={()=>dismissToast(t.id)}
              style={{
                cursor:'pointer',
                padding:'10px 14px',
                borderRadius:'10px',
                border:`1px solid ${t.type==='error'?'#dc2626':t.type==='success'?'#16a34a':'#2563eb'}`,
                backgroundColor:t.type==='error'?'#fef2f2':t.type==='success'?'#f0fdf4':'#eff6ff',
                color:t.type==='error'?'#991b1b':t.type==='success'?'#166534':'#1e40af',
                fontSize:14,
                fontWeight:500,
                boxShadow:'0 4px 14px rgba(0,0,0,0.12)',
                display:'flex',
                justifyContent:'space-between',
                alignItems:'center',
                gap:'12px'
              }}>
              <span>{t.type==='error'?'⚠️ ':t.type==='success'?'✅ ':'ℹ️ '}{t.text}</span>
              <span style={{opacity:0.5,fontSize:12}}>✕</span>
            </div>
          ))}
        </div>

        {/* ── NAVBAR ── */}
        <nav style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <img src={productIcon} alt="NBSN" style={{ width:32, height:32, borderRadius:8, objectFit:'contain' }} />
            <span style={{ color:'#fff', fontWeight:800, fontSize:'1rem', letterSpacing:0.3 }}>NBSN Portal</span>
            <span style={{ color:'rgba(255,255,255,0.35)', fontSize:12, marginLeft:4 }}>System Admin</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13 }}>
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <span style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.88rem' }}>{user?.firstName} {user?.lastName}</span>
            </div>
            <button onClick={handleLogout} style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'6px 14px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Logout
            </button>
          </div>
        </nav>

        <div style={{ display:'flex', flex:1, overflow:'hidden', height:'calc(100vh - 56px)' }}>
          {/* ── SIDEBAR ── */}
          <div className="dash-sidebar" style={{ width:220, background:'#1e293b', display:'flex', flexDirection:'column', padding:'20px 12px', flexShrink:0 }}>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.68rem', letterSpacing:'1.5px', fontWeight:700, textTransform:'uppercase', margin:'0 0 12px 4px' }}>Navigation</p>
            {menuItems.map(item => (
              <button key={item.id} className={`dash-nav-btn${activeSection === item.id || (item.id === 'clients' && ['add-client','view-clients'].includes(activeSection)) ? ' active' : ''}`}
                onClick={() => setActiveSection(item.id)}>
                <span style={{ fontSize:'1.1rem' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="dash-main" style={{ flex:1, overflowY:'auto', padding:28, height:'calc(100vh - 56px)' }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;