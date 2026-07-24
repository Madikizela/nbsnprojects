import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientForm from './ClientForm';
import PersonalInfoForm from './PersonalInfoForm';
import nbsnLogo from '../assets/nbsn-logo.png';

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
          <div className="container-fluid">
            <div className="card text-white mb-4 border-0 shadow-lg" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', backdropFilter: 'blur(10px)'}}>
              <div className="card-body p-4">
                <h2 className="card-title h3 mb-2">Client Management 🏢</h2>
                <p className="card-text opacity-90">Manage your clients and their information</p>
              </div>
            </div>
            
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="h4 mb-0 text-white">Client Operations</h3>
              <button 
                onClick={() => setActiveSection('add-client')}
                className="btn btn-success d-flex align-items-center shadow-lg hover-lift"
                style={{background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', border: 'none', transform: 'translateY(0)', transition: 'all 0.3s ease'}}
              >
                <svg className="me-2" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                </svg>
                Add New Client
              </button>
            </div>
            
            <div className="row g-4">
              <div className="col-md-6">
                <div className="card h-100 shadow-lg border-0" style={{background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)'}}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4 className="card-title h5 text-white">View All Clients</h4>
                      <div className="p-3 rounded-circle" style={{background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)'}}>
                        <svg width="24" height="24" fill="white" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                        </svg>
                      </div>
                    </div>
                    <p className="card-text text-white opacity-75 mb-3">Browse and manage all registered clients in the system.</p>
                    <button 
                      onClick={() => setActiveSection('view-clients')}
                      className="btn btn-primary w-100 shadow"
                      style={{background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)', border: 'none'}}
                    >
                      View Client List
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card h-100 shadow-lg border-0" style={{background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)'}}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4 className="card-title h5 text-white">Client Statistics</h4>
                      <div className="p-3 rounded-circle" style={{background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'}}>
                        <svg width="24" height="24" fill="white" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="d-flex flex-column gap-3">
                      <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{background: 'rgba(255, 255, 255, 0.1)'}}>
                        <span className="text-white opacity-75">Total Clients:</span>
                        <span className="fw-bold text-white fs-5">24</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{background: 'rgba(40, 167, 69, 0.2)'}}>
                        <span className="text-white opacity-75">Active Clients:</span>
                        <span className="fw-bold text-success fs-5">22</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{background: 'rgba(0, 123, 255, 0.2)'}}>
                        <span className="text-white opacity-75">New This Month:</span>
                        <span className="fw-bold text-primary fs-5">3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'add-client':
        return (
          <div className="container-fluid">
            <div className="card bg-success text-white mb-4">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="card-title h3 mb-2">Add New Client ➕</h2>
                    <p className="card-text">Register a new client in the system</p>
                  </div>
                  <button 
                    onClick={() => setActiveSection('clients')}
                    className="btn btn-light btn-sm d-flex align-items-center"
                  >
                    <svg className="me-2" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
                    </svg>
                    Back to Clients
                  </button>
                </div>
              </div>
            </div>
            
            <ClientForm
              onCancel={() => setActiveSection('clients')}
              onSubmit={async (data) => {
                try {
                  // Here you would typically make an API call to save the client
                  console.log('Client data:', data);
                  // For now, just show success and go back to clients
                  alert('Client added successfully!');
                  setActiveSection('clients');
                } catch (error) {
                  console.error('Error adding client:', error);
                  alert('Error adding client. Please try again.');
                }
              }}
            />
          </div>
        );
      case 'view-clients':
        return (
          <div className="container-fluid">
            <div className="card bg-primary text-white mb-4">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="card-title h3 mb-2">Client Directory 📋</h2>
                    <p className="card-text">View and manage all registered clients</p>
                  </div>
                  <button
                    onClick={() => setActiveSection('clients')}
                    className="btn btn-light btn-sm d-flex align-items-center"
                  >
                    <svg className="me-2" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
                    </svg>
                    Back to Clients
                  </button>
                </div>
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="card-title h5 mb-0">All Clients</h3>
                  <button className="btn btn-primary btn-sm" onClick={fetchClients}>
                    🔄 Refresh
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                {clientsLoading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Client Name</th>
                        <th>Contact Person</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
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
                              <td><div className="fw-medium">{client.name}</div></td>
                              <td className="text-muted">{client.contactPerson || '—'}</td>
                              <td className="text-muted">{client.email || '—'}</td>
                              <td className="text-muted">{client.phoneNumber || '—'}</td>
                              <td>
                                <span className={`badge ${client.status === 'Active' || client.status === '1' ? 'bg-success' : 'bg-secondary'}`}>
                                  {client.status === '1' ? 'Active' : client.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => resendCredentials(client.id)}
                                  disabled={resendingId === client.id}
                                  title="Reset password and resend login credentials to client"
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
                                  <div className={`alert ${resendMessage.type === 'success' ? 'alert-success' : 'alert-danger'} mb-0 py-2`}
                                    style={{ whiteSpace: 'pre-line' }}>
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

              <div className="card-footer bg-light">
                <p className="text-muted mb-0">
                  {clients.length} client{clients.length !== 1 ? 's' : ''} registered
                </p>
              </div>
            </div>
          </div>
        );
      case 'sdp':
        return (
          <div className="container-fluid">
            <div className="card text-white mb-4 border-0 shadow-lg" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', backdropFilter: 'blur(10px)'}}>
              <div className="card-body p-4">
                <h2 className="card-title h3 mb-2">SDP Management 🎓</h2>
                <p className="card-text opacity-90">Manage Skills Development Providers</p>
              </div>
            </div>
            
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="h4 mb-0 text-white">SDP Operations</h3>
              <button 
                onClick={() => navigate('/sdp-dashboard')}
                className="btn btn-primary d-flex align-items-center shadow-lg hover-lift"
                style={{background: 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)', border: 'none', transform: 'translateY(0)', transition: 'all 0.3s ease'}}
              >
                <svg className="me-2" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                </svg>
                Open SDP Dashboard
              </button>
            </div>
            
            <div className="row g-4">
              <div className="col-md-6">
                <div className="card h-100 shadow-lg border-0" style={{background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)'}}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4 className="card-title h5 text-white">Manage SDPs</h4>
                      <span className="badge bg-primary">Active</span>
                    </div>
                    <p className="card-text text-white-50 mb-3">View, edit, and manage all Skills Development Providers in the system.</p>
                    <button 
                      onClick={() => navigate('/sdp-dashboard')}
                      className="btn btn-outline-light btn-sm"
                    >
                      View All SDPs
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card h-100 shadow-lg border-0" style={{background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)'}}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4 className="card-title h5 text-white">Add New SDP</h4>
                      <span className="badge bg-success">Create</span>
                    </div>
                    <p className="card-text text-white-50 mb-3">Register new Skills Development Providers to expand your network.</p>
                    <button 
                      onClick={() => navigate('/sdp-dashboard')}
                      className="btn btn-outline-light btn-sm"
                    >
                      Add SDP
                    </button>
                  </div>
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
        .hover-lift:hover {
          transform: translateY(-2px) !important;
        }
      `}} />
      <div className="min-vh-100 w-100 d-flex flex-column" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Bootstrap Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark shadow-lg flex-shrink-0" style={{background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.2)'}}>
        <div className="container-fluid">
          <div className="navbar-brand d-flex align-items-center">
            <img 
              src={nbsnLogo} 
              alt="NBSN Logo" 
              width="40" 
              height="40" 
              className="me-3"
              style={{objectFit: 'contain', borderRadius: '4px'}}
            />
            <h1 className="h3 mb-0 fw-bold text-white">
              NBSN
            </h1>
          </div>
          <div className="d-flex align-items-center">
            <div className="dropdown me-3">
              <button className="btn btn-light dropdown-toggle d-flex align-items-center" type="button" data-bs-toggle="dropdown" style={{background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)', color: 'white'}}>
                <div className="bg-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: '32px', height: '32px'}}>
                  <span className="text-primary small fw-bold">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                {user?.firstName} {user?.lastName}
              </button>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#" onClick={() => setActiveSection('profile')}>Profile</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item text-danger" href="#" onClick={handleLogout}>Logout</a></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid flex-grow-1 d-flex p-0" style={{minHeight: 'calc(100vh - 76px)'}}>
        <div className="row w-100 g-0 flex-grow-1">
          {/* Bootstrap Sidebar */}
          <div className="col-md-3 col-lg-2 d-flex">
            <div className="shadow-lg w-100" style={{background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderRight: '1px solid rgba(255, 255, 255, 0.2)'}}>
              <div className="p-3">
                <nav className="nav flex-column">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`nav-link btn text-start border-0 rounded-3 mb-3 d-flex align-items-center transition-all ${
                        activeSection === item.id
                          ? 'btn-primary'
                          : 'text-white'
                      }`}
                      style={activeSection === item.id 
                        ? { backgroundColor: '#0d6efd', color: 'white', transform: 'translateX(5px)', boxShadow: '0 4px 15px rgba(13, 110, 253, 0.4)' } 
                        : { background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }
                      }
                    >
                      <span className="me-3 fs-5">{item.icon}</span>
                      <span className="fw-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Bootstrap Main Content */}
          <div className="col-md-9 col-lg-10 d-flex">
            <div className="p-4 w-100" style={{background: 'rgba(255, 255, 255, 0.05)', borderRadius: '20px', margin: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', maxHeight: 'calc(100vh - 116px)', overflowY: 'auto'}}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;