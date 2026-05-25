import React, { ReactNode, CSSProperties } from 'react';
import theme from '../styles/theme';

interface DashboardCardProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  headerAction?: ReactNode;
  noPadding?: boolean;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  icon,
  children,
  className = '',
  style = {},
  headerAction,
  noPadding = false
}) => {
  return (
    <div 
      className={`card ${className}`}
      style={{
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: theme.borderRadius.lg,
        boxShadow: theme.cardShadow,
        overflow: 'hidden',
        ...style
      }}
    >
      {(title || headerAction) && (
        <div style={{
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          borderBottom: `1px solid ${theme.border}`,
          backgroundColor: theme.surface,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            {title && (
              <h5 style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 600,
                color: theme.textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm
              }}>
                {icon && <span>{icon}</span>}
                {title}
              </h5>
            )}
            {subtitle && (
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '0.85rem',
                color: theme.textSecondary
              }}>
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div style={{
        padding: noPadding ? 0 : theme.spacing.lg
      }}>
        {children}
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  subtitle,
  trend
}) => {
  const colorMap = {
    primary: theme.primary,
    success: theme.success,
    warning: theme.warning,
    danger: theme.danger,
    info: theme.info
  };

  const bgColorMap = {
    primary: theme.primaryLight + '20',
    success: theme.successLight,
    warning: theme.warningLight,
    danger: theme.dangerLight,
    info: theme.infoLight
  };

  return (
    <div style={{
      backgroundColor: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      boxShadow: theme.cardShadow,
      transition: theme.transition.normal,
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = theme.shadow.lg;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = theme.cardShadow;
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.85rem',
            color: theme.textSecondary,
            marginBottom: theme.spacing.sm,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: theme.textPrimary,
            marginBottom: theme.spacing.xs
          }}>
            {value}
          </div>
          {subtitle && (
            <div style={{
              fontSize: '0.8rem',
              color: theme.textMuted
            }}>
              {subtitle}
            </div>
          )}
          {trend && (
            <div style={{
              fontSize: '0.8rem',
              color: trend.isPositive ? theme.success : theme.danger,
              marginTop: theme.spacing.xs,
              fontWeight: 500
            }}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: theme.borderRadius.lg,
          backgroundColor: bgColorMap[color],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem'
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
