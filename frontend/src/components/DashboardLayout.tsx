import React, { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '../styles/theme';
import logoImage from '../assets/nbsn-logo.png';

interface DashboardLayoutProps {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
  };
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabs?: Array<{ id: string; label: string; icon?: string }>;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  user,
  activeTab,
  onTabChange,
  tabs = []
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      backgroundColor: theme.background 
    }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        backgroundColor: theme.sidebarBg,
        color: theme.sidebarText,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: theme.shadow.lg,
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto'
      }}>
        {/* Logo Section */}
        <div style={{
          padding: theme.spacing.lg,
          borderBottom: `1px solid ${theme.sidebarHover}`,
          textAlign: 'center'
        }}>
          <img 
            src={logoImage} 
            alt="Logo" 
            style={{ 
              width: '80px', 
              height: '80px', 
              objectFit: 'contain',
              borderRadius: theme.borderRadius.lg,
              marginBottom: theme.spacing.sm
            }} 
          />
          <h5 style={{ 
            margin: 0, 
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#ffffff'
          }}>
            SkillHub
          </h5>
          <p style={{ 
            margin: 0, 
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.8)',
            marginTop: '4px'
          }}>
            Skills Development Portal
          </p>
        </div>

        {/* Navigation Tabs */}
        {tabs.length > 0 && (
          <nav style={{ flex: 1, padding: theme.spacing.md }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  marginBottom: theme.spacing.sm,
                  backgroundColor: activeTab === tab.id ? theme.sidebarActive : 'transparent',
                  color: activeTab === tab.id ? theme.sidebarActiveText : theme.sidebarText,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: theme.transition.fast,
                  fontSize: '0.95rem',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = theme.sidebarHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {tab.icon && <span>{tab.icon}</span>}
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        {/* User Info & Logout */}
        <div style={{
          padding: theme.spacing.lg,
          borderTop: `1px solid ${theme.sidebarHover}`,
          marginTop: 'auto'
        }}>
          <div style={{ marginBottom: theme.spacing.md }}>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: 600,
              marginBottom: '4px'
            }}>
              {user.name}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: theme.textMuted 
            }}>
              {user.email}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: theme.primaryLight,
              marginTop: '4px',
              fontWeight: 500
            }}>
              {user.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: theme.danger,
              color: 'white',
              border: 'none',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: theme.transition.fast
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.buttonDangerHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.danger}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        marginLeft: '260px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: theme.headerBg,
          borderBottom: `1px solid ${theme.headerBorder}`,
          padding: `${theme.spacing.md} ${theme.spacing.xl}`,
          boxShadow: theme.shadow.sm,
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h4 style={{ 
              margin: 0,
              color: theme.textPrimary,
              fontSize: '1.5rem',
              fontWeight: 600
            }}>
              {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
            </h4>
            <div style={{
              fontSize: '0.9rem',
              color: theme.textSecondary
            }}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main style={{
          flex: 1,
          padding: theme.spacing.xl,
          overflowY: 'auto'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
