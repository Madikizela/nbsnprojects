import React, { useState } from 'react';
import { EmailIcon, CheckCircleIcon, ExclamationCircleIcon } from './CustomIcons';
import { apiCall } from '../utils/api';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setError('');
    
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('ForgotPassword: Sending request for email:', email);
      const response = await apiCall('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      console.log('ForgotPassword: Response status:', response.status);

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const text = await response.text();
        console.log('ForgotPassword: Error response text:', text);
        let message = 'Failed to send reset email. Please try again.';
        try {
          const errorData = JSON.parse(text);
          message = errorData?.message || message;
          if (errorData?.details || errorData?.error) {
            message += `\nDetails: ${errorData.details || errorData.error}`;
          }
        } catch (e) {
          message = `Server Error (${response.status}): ${text.substring(0, 100)}...`;
        }
        setError(message);
      }
    } catch (error: any) {
      console.error('ForgotPassword: Fetch error:', error);
      setError(`Network error: ${error.message || 'Please check your connection and try again.'}`);
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
  };

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    border: 'none',
    width: '100%',
    maxWidth: '400px',
    margin: '0 20px'
  };

  const inputStyle = {
    borderRadius: '12px',
    padding: '12px 16px 12px 45px',
    border: '2px solid #e9ecef',
    fontSize: '16px',
    width: '100%'
  };

  const buttonStyle = {
    borderRadius: '12px',
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    width: '100%',
    border: 'none',
    cursor: 'pointer'
  };

  if (isSubmitted) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ marginBottom: '20px' }}>
                <CheckCircleIcon size={64} color="#28a745" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '15px' }}>
                Check Your Email
              </h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                If you don't see the email, check your spam folder or try again with a different email address.
              </p>
            </div>
            
            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                ...buttonStyle,
                backgroundColor: 'transparent',
                color: '#007bff',
                border: '2px solid #007bff'
              }}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '15px' }}>
              Reset Password
            </h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <ExclamationCircleIcon size={16} className="me-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600', 
                color: '#333' 
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '12px',
                  transform: 'translateY(-50%)',
                  zIndex: 1
                }}>
                  <EmailIcon size={16} color="#666" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isLoading}
                  style={{
                    ...inputStyle,
                    borderColor: emailError ? '#dc3545' : email && !emailError ? '#28a745' : '#e9ecef'
                  }}
                />
                {email && !emailError && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: '12px',
                    transform: 'translateY(-50%)'
                  }}>
                    <CheckCircleIcon size={16} color="#28a745" />
                  </div>
                )}
                {emailError && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: '12px',
                    transform: 'translateY(-50%)'
                  }}>
                    <ExclamationCircleIcon size={16} color="#dc3545" />
                  </div>
                )}
              </div>
              {emailError && (
                <div style={{
                color: '#dc3545',
                fontSize: '14px',
                marginTop: '5px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <ExclamationCircleIcon size={14} className="me-1" />
                {emailError}
              </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <button
                type="submit"
                disabled={isLoading || !email || !!emailError}
                style={{
                  ...buttonStyle,
                  backgroundColor: isLoading || !email || !!emailError ? '#ccc' : '#007bff',
                  color: 'white',
                  cursor: isLoading || !email || !!emailError ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={onBackToLogin}
                disabled={isLoading}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#007bff',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

