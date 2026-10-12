import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { getTranslation } from '../utils/translations';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, lang = 'en' }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: name.trim() || email.split('@')[0] },
          },
        });
        if (error) throw error;
        setSuccessMsg(isSupabaseConfigured ? 'Account created! Please check your email for confirmation.' : 'Demo account created successfully!');
        if (data?.user) {
          setTimeout(() => {
            onAuthSuccess(data.user);
            onClose();
          }, 800);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setSuccessMsg('Signed in successfully!');
        if (data?.user) {
          setTimeout(() => {
            onAuthSuccess(data.user);
            onClose();
          }, 600);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser = {
      id: 'guest_patient',
      email: 'alex.morgan@healthsaathi.local',
      user_metadata: { name: 'Alex Morgan' },
    };
    localStorage.setItem('healthsaathi_demo_user', JSON.stringify(guestUser));
    onAuthSuccess(guestUser);
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" id="auth-modal">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#06b6d4" />
            <h3 style={{ fontSize: '1.1rem' }}>{t('auth_title', 'HealthSaathi AI Account')}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
          >
            {t('tab_signin', 'Sign In')}
          </button>
          <button
            type="button"
            className={`auth-tab ${isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
          >
            {t('tab_signup', 'Create Account')}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ gap: '1rem' }}>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
              {isSupabaseConfigured 
                ? 'Secured with Supabase Auth & Row Level Security (RLS).' 
                : 'Demo mode active. Provide credentials or click Continue as Guest below.'}
            </p>

            {errorMsg && (
              <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#6ee7b7', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {isSignUp && (
              <div className="form-group">
                <label htmlFor="auth-name">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.4rem' }}
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <User size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-email">{t('email_label', 'Email Address')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-email"
                  type="email"
                  required
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.4rem' }}
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">{t('password_label', 'Password')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.4rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ justifyContent: 'center', width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading 
                ? 'Processing...' 
                : isSignUp 
                ? t('btn_signup', 'Create Account') 
                : t('btn_signin', 'Sign In')}
            </button>

            <div style={{ textAlign: 'center', position: 'relative', margin: '0.5rem 0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#0c1222', padding: '0 8px' }}>
                OR
              </span>
            </div>

            <button
              type="button"
              className="btn-secondary"
              style={{ justifyContent: 'center', width: '100%' }}
              onClick={handleGuestLogin}
            >
              {t('btn_continue_guest', 'Continue as Demo Guest')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
