import React, { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[HealthSaathi React Crash]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#070b14',
          color: '#f8fafc',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <h2 style={{ color: '#22d3ee', margin: '0 0 0.75rem', fontSize: '1.4rem' }}>HealthSaathi Notice</h2>
            <p style={{ color: '#fca5a5', fontSize: '0.88rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              {this.state.error?.message || 'A client session issue occurred.'}
            </p>
            <button
              onClick={() => {
                window.location.reload();
              }}
              style={{
                background: '#06b6d4',
                color: '#070b14',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.4rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
