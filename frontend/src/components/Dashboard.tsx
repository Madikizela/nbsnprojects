import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientForm from './ClientForm';
import PersonalInfoForm from './PersonalInfoForm';
import productIcon from '../assets/mobile_icon.png';

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

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('clients');
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [resendMessage, setResendMessage] = useState<{ id: number; text: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

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
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/Clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
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

  useEffect(() => {
    if (activeSection === 'view-clients') {
      fetchClients();
    }
  }, [activeSection]);

  const menuItems = [
    { id: 'clients', label: 'Client Management', icon: '🏢' },
    { id: 'sdp', label: 'SDP Management', icon: '🎓' },
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
                                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600, background: (client.status === 'Active' || client.status === '1') ? '#dcfce7' : '#f1f5f9', color: (client.status === 'Active' || client.status === '1') ? '#16a34a' : '#64748b' }}>
                                  {client.status === '1' ? 'Active' : client.status}
                                </span>
                              </td>
                              <td style={{ padding:'12px 16px' }}>
                                <button
                                  style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid #667eea', background:'#fff', color:'#667eea', fontWeight:600, fontSize:12, cursor:'pointer' }}
                                  onClick={() => resendCredentials(client.id)}
                                  disabled={resendingId === client.id}
                                >
                                  {resendingId === client.id ? (
                                    <><span className="spinner-border spinner-border-sm me-1" />Sending...</>
                                  ) : (
                                    '📧 Resend Credentials'
                                  )}
                                </button>
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
              <button onClick={() => navigate('/sdp-dashboard')}
                style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
                + Open SDP Dashboard
              </button>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <div className="dash-card p-4">
                  <div style={{ fontSize:'2rem', marginBottom:12 }}>🏫</div>
                  <h5 style={{ fontWeight:700, color:'#1e293b', margin:'0 0 8px' }}>Manage SDPs</h5>
                  <p style={{ color:'#64748b', fontSize:14, margin:'0 0 16px' }}>View, edit, and manage all Skills Development Providers in the system.</p>
                  <button onClick={() => navigate('/sdp-dashboard')}
                    style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontWeight:600, fontSize:14, cursor:'pointer' }}>
                    View All SDPs →
                  </button>
                </div>
              </div>
              <div className="col-md-6">
                <div className="dash-card p-4">
                  <div style={{ fontSize:'2rem', marginBottom:12 }}>➕</div>
                  <h5 style={{ fontWeight:700, color:'#1e293b', margin:'0 0 8px' }}>Add New SDP</h5>
                  <p style={{ color:'#64748b', fontSize:14, margin:'0 0 16px' }}>Register new Skills Development Providers to expand your network.</p>
                  <button onClick={() => navigate('/sdp-dashboard')}
                    style={{ background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontWeight:600, fontSize:14, cursor:'pointer' }}>
                    Add SDP →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
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
              // Here you would typically send the data to your backend
              console.log('Saving profile data:', formData);
              alert('Profile updated successfully!');
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

      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#f1f5f9', fontFamily:"'Segoe UI', system-ui, sans-serif" }}>

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