/**
 * SkillHub Professional Color Theme
 * Sky Blue & White - Clean and Professional
 */

export const theme = {
  // Primary Brand Colors - Sky Blue
  primary: '#4facfe',        // Sky blue - main brand color
  primaryDark: '#3a8fd9',    // Darker sky blue for hover states
  primaryLight: '#87ceeb',   // Lighter sky blue for backgrounds
  
  // Secondary Colors
  secondary: '#00b4d8',      // Bright blue - accent color
  secondaryLight: '#90e0ef', // Light blue
  
  // Neutral Colors
  background: '#f8f9fa',     // Very light gray background
  surface: '#ffffff',        // Pure white surface/cards
  border: '#e3f2fd',         // Very light blue border
  
  // Text Colors
  textPrimary: '#212529',    // Dark text
  textSecondary: '#6c757d',  // Gray text
  textMuted: '#adb5bd',      // Muted text
  
  // Status Colors
  success: '#28a745',        // Green
  successLight: '#d4edda',   // Light green background
  warning: '#ffc107',        // Yellow
  warningLight: '#fff3cd',   // Light yellow background
  danger: '#dc3545',         // Red
  dangerLight: '#f8d7da',    // Light red background
  info: '#4facfe',           // Sky blue (same as primary)
  infoLight: '#e3f2fd',      // Very light blue background
  
  // Sidebar Colors - Sky Blue Theme
  sidebarBg: '#4facfe',      // Sky blue
  sidebarText: '#ffffff',    // White text
  sidebarHover: '#3a8fd9',   // Darker sky blue hover
  sidebarActive: '#ffffff',  // White active item
  sidebarActiveText: '#4facfe', // Sky blue text for active
  
  // Header Colors
  headerBg: '#ffffff',       // White header
  headerBorder: '#e3f2fd',   // Light blue border
  
  // Card Colors
  cardBg: '#4facfe',         // Sky blue cards
  cardBorder: '#3a8fd9',     // Darker sky blue border
  cardShadow: '0 2px 8px rgba(0, 0, 0, 0.15)', // Darker shadow for contrast
  
  // Button Colors
  buttonPrimary: '#4facfe',
  buttonPrimaryHover: '#3a8fd9',
  buttonSecondary: '#6c757d',
  buttonSecondaryHover: '#5a6268',
  buttonSuccess: '#28a745',
  buttonSuccessHover: '#218838',
  buttonDanger: '#dc3545',
  buttonDangerHover: '#c82333',
  
  // Gradient (for special elements)
  gradient: 'linear-gradient(135deg, #4facfe 0%, #00b4d8 100%)',
  gradientLight: 'linear-gradient(135deg, #87ceeb 0%, #90e0ef 100%)',
  
  // Spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    xxl: '3rem',     // 48px
  },
  
  // Border Radius
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    round: '50%',    // Circle
  },
  
  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 2px 4px rgba(0,0,0,0.08)',
    lg: '0 4px 8px rgba(0,0,0,0.12)',
    xl: '0 8px 16px rgba(0,0,0,0.15)',
  },
  
  // Transitions
  transition: {
    fast: '150ms ease',
    normal: '300ms ease',
    slow: '500ms ease',
  },
};

// Helper function to get status color
export const getStatusColor = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    active: theme.success,
    completed: theme.success,
    pending: theme.warning,
    'in-progress': theme.info,
    inactive: theme.textMuted,
    cancelled: theme.danger,
    failed: theme.danger,
  };
  
  return statusMap[status.toLowerCase()] || theme.textSecondary;
};

// Helper function to get status background color
export const getStatusBgColor = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    active: theme.successLight,
    completed: theme.successLight,
    pending: theme.warningLight,
    'in-progress': theme.infoLight,
    inactive: theme.border,
    cancelled: theme.dangerLight,
    failed: theme.dangerLight,
  };
  
  return statusMap[status.toLowerCase()] || theme.background;
};

export default theme;
