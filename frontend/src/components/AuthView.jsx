import React, { useState, useEffect, useRef } from 'react';
import {
  HeartPulse,
  Mail,
  Lock,
  User,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  ChevronLeft,
  Info,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  setRuntimeSupabaseConfig,
  testSupabaseConnection
} from '../services/supabase';

export default function AuthView({ onAuthSuccess, _lang = 'en' }) {
  // Modes: 'login' | 'signup' | 'otp' | 'forgot_password' | 'reset_password'
  const [mode, setMode] = useState('login');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 6-box OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Diagnostic Test State
  const [diagInfo, setDiagInfo] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const runConnectionCheck = async () => {
    setTestingConnection(true);
    try {
      const res = await testSupabaseConnection();
      setDiagInfo(res);
      if (res.ok) {
        setSuccessMsg(`Supabase Auth Connection verified: 200 OK (${res.endpoint})`);
      } else {
        setErrorMsg(`Supabase test failed: ${res.error || 'Connection error'}`);
      }
    } catch (err) {
      setDiagInfo({ ok: false, error: err.message });
      setErrorMsg(`Supabase test error: ${err.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  // Resend OTP Cooldown timer (60s)
  const [resendCooldown, setResendCooldown] = useState(0);

  // OTP context: 'signup' or 'recovery'
  const [otpType, setOtpType] = useState('signup');

  // Quick setup modal for Supabase credentials if not configured in .env
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configUrl, setConfigUrl] = useState(SUPABASE_URL || '');
  const [configKey, setConfigKey] = useState(SUPABASE_ANON_KEY || '');

  // Flag when user tried to sign up with an already-registered email
  const [accountAlreadyExists, setAccountAlreadyExists] = useState(false);

  // Handle cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Reset errors when switching modes or set new messages directly
  const switchMode = (newMode, { error = '', success = '' } = {}) => {
    setErrorMsg(error);
    setSuccessMsg(success);
    setAccountAlreadyExists(false);
    setMode(newMode);
    if (newMode === 'otp') {
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  // ---------------------------------------------------------------------------
  // 1. SIGNUP SUBMIT -> Trigger Supabase verification email
  // ---------------------------------------------------------------------------
  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg(
        'Supabase is not configured yet. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env to enable live email delivery.'
      );
      setShowConfigModal(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      console.log('[Supabase signUp response]', {
        data,
        error,
        status: error?.status,
        code: error?.code,
        message: error?.message,
      });

      if (error) {
        throw error;
      }

      // Check if user is already confirmed (e.g. email confirmations disabled in Supabase)
      if (data?.session && data?.user?.email_confirmed_at) {
        setSuccessMsg('Account created and verified! Redirecting to dashboard...');
        setTimeout(() => onAuthSuccess(data.user), 800);
        return;
      }

      // Supabase Anti-Enumeration Detection:
      // When data.user.identities is empty (user already exists), Supabase sends NO email!
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        console.warn('SignUp anti-enumeration: account already exists with identities: []');
        setAccountAlreadyExists(true);
        setErrorMsg("This email is already registered. Sign in, or use Forgot Password if you can't remember your password.");
        return;
      }

      // Normal flow: Supabase created the user and dispatched confirmation OTP
      setOtpType('signup');
      switchMode('otp', {
        success: `Verification code dispatched to ${email.trim()}! Please check your inbox and spam folder.`,
      });
    } catch (err) {
      console.error('SignUp Error Details:', {
        message: err.message,
        status: err.status,
        code: err.code,
        name: err.name,
        raw: err,
      });
      const errCode = (err.code || '').toLowerCase();
      const errMsg = (err.message || '').toLowerCase();

      if (err.status === 429 || errCode === 'over_email_send_rate_limit' || errMsg.includes('rate limit')) {
        setErrorMsg(
          `Rate limit exceeded (429): ${err.message || 'Supabase email send rate limit exceeded. Please wait a few minutes before trying again or configure Custom SMTP.'}`
        );
      } else if (errCode === 'email_address_not_authorized' || errMsg.includes('not authorized')) {
        setErrorMsg(
          `Email address not authorized: ${err.message}. Default Supabase mailer only sends to team member emails. Please configure Custom SMTP in your Supabase Dashboard.`
        );
      } else if (errCode === 'unexpected_failure' || errMsg.includes('unexpected_failure')) {
        setErrorMsg(`Supabase Auth failure: ${err.message}`);
      } else if (err.status === 500 || errMsg.includes('error sending confirmation email')) {
        setErrorMsg(
          'Supabase SMTP Delivery Error (500): Failed to send confirmation email. Please configure Custom SMTP in your Supabase Dashboard (Project Settings > Authentication > SMTP) and verify your Confirm Signup template contains {{ .Token }}.'
        );
      } else if (errMsg.includes('user already registered')) {
        setErrorMsg("This email is already registered. Sign in, or use Forgot Password if you can't remember your password.");
      } else {
        setErrorMsg(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. LOGIN SUBMIT
  // ---------------------------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg(
        'Supabase is not configured yet. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.'
      );
      setShowConfigModal(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // If email is not confirmed, redirect user to OTP verification
        if (
          error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('not verified')
        ) {
          setOtpType('signup');
          // Attempt to resend OTP
          const resendResult = await supabase.auth.resend({ type: 'signup', email: email.trim() });
          console.log('[Supabase login-unconfirmed resend response]', {
            data: resendResult.data,
            error: resendResult.error,
            status: resendResult.error?.status,
            code: resendResult.error?.code,
            message: resendResult.error?.message,
          });
          if (!resendResult.error) {
            setResendCooldown(60);
          }
          switchMode('otp', {
            error: 'Your email has not been verified yet. We have sent a verification code to your email.',
          });
          return;
        }
        throw error;
      }

      if (!data?.user) {
        throw new Error('Authentication succeeded but no user record was returned.');
      }

      setSuccessMsg('Login successful! Redirecting to your dashboard...');
      setTimeout(() => onAuthSuccess(data.user), 600);
    } catch (err) {
      console.error('Login Error Details:', {
        message: err.message,
        status: err.status,
        code: err.code,
        name: err.name,
        raw: err,
      });
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMsg('Invalid email or password. Please verify and try again.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. OTP VERIFICATION SUBMIT (6 Digits)
  // ---------------------------------------------------------------------------
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const token = otp.join('').trim();
    if (token.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase is not configured yet.');
      return;
    }

    setLoading(true);
    try {
      // 1. Primary verification: use type: 'signup' for new signups, or 'recovery' for password reset
      const primaryType = otpType === 'recovery' ? 'recovery' : 'signup';
      let verifyResult = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token,
        type: primaryType,
      });

      console.log('[Supabase verifyOtp primary response]', {
        type: primaryType,
        data: verifyResult.data,
        error: verifyResult.error,
        status: verifyResult.error?.status,
        code: verifyResult.error?.code,
        message: verifyResult.error?.message,
      });

      // 2. If 'signup' type fails, try 'email' fallback in case Supabase OTP magic code is configured
      if (verifyResult.error && primaryType === 'signup') {
        const emailFallback = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: token,
          type: 'email',
        });
        console.log('[Supabase verifyOtp email fallback response]', {
          data: emailFallback.data,
          error: emailFallback.error,
          status: emailFallback.error?.status,
          code: emailFallback.error?.code,
          message: emailFallback.error?.message,
        });
        if (!emailFallback.error) {
          verifyResult = emailFallback;
        }
      }

      if (verifyResult.error) {
        throw verifyResult.error;
      }

      const activeUser = verifyResult.data?.user || (await supabase.auth.getSession()).data?.session?.user;

      if (otpType === 'recovery') {
        switchMode('reset_password', {
          success: 'Recovery code verified! Please set your new password.',
        });
        return;
      }

      setSuccessMsg('Email verified successfully! Accessing your HealthSaathi dashboard...');
      setTimeout(() => {
        onAuthSuccess(activeUser || { email: email.trim() });
      }, 700);
    } catch (err) {
      console.error('Verify OTP Error Details:', {
        message: err.message,
        status: err.status,
        code: err.code,
        name: err.name,
        raw: err,
      });
      const errMsg = (err.message || '').toLowerCase();
      const errCode = (err.code || '').toLowerCase();

      if (err.status === 429 || errCode === 'over_email_send_rate_limit' || errMsg.includes('rate limit')) {
        setErrorMsg(`Rate limit exceeded (429): ${err.message || 'Too many verification attempts. Please wait a few moments before trying again.'}`);
      } else if (errMsg.includes('expired')) {
        setErrorMsg('The verification code has expired. Please click "Resend OTP" to request a new code.');
      } else if (errMsg.includes('invalid') || err.status === 403 || err.status === 400) {
        setErrorMsg('Invalid verification code. Please check the 6 digits and try again, or click "Resend OTP".');
      } else {
        setErrorMsg(err.message || 'Verification failed. Please check the code and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. RESEND OTP (supabase.auth.resend with conditional 60s Cooldown)
  // ---------------------------------------------------------------------------
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const resendPayload = {
        type: otpType === 'recovery' ? 'recovery' : 'signup',
        email: email.trim(),
      };
      const { data, error } = await supabase.auth.resend(resendPayload);

      console.log('[Supabase resend response]', {
        data,
        error,
        status: error?.status,
        code: error?.code,
        message: error?.message,
      });

      if (error) throw error;

      // Only start 60s cooldown AFTER a successful call
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
      setSuccessMsg(`A new 6-digit verification code was dispatched to ${email.trim()}. Please check inbox & spam.`);
    } catch (err) {
      console.error('Resend OTP Error Details:', {
        message: err.message,
        status: err.status,
        code: err.code,
        name: err.name,
        raw: err,
      });
      const errCode = (err.code || '').toLowerCase();
      const errMsg = (err.message || '').toLowerCase();

      if (err.status === 429 || errCode === 'over_email_send_rate_limit' || errMsg.includes('rate limit')) {
        setErrorMsg(
          `Email rate limit exceeded (429): ${err.message || 'Supabase limits how often emails can be dispatched. Please wait for the cooldown timer before requesting another code.'}`
        );
      } else if (errCode === 'email_address_not_authorized' || errMsg.includes('not authorized')) {
        setErrorMsg(`Email address not authorized: ${err.message}. Default mailer only delivers to project members.`);
      } else if (errCode === 'unexpected_failure' || errMsg.includes('unexpected_failure')) {
        setErrorMsg(`Supabase Auth failure: ${err.message}`);
      } else if (err.status === 500 || errMsg.includes('error sending confirmation email')) {
        setErrorMsg(
          'Supabase Mailer Error (500): Failed to dispatch resend email. Please configure Custom SMTP in your Supabase Dashboard.'
        );
      } else {
        setErrorMsg(err.message || 'Failed to resend verification code. Please wait and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. FORGOT PASSWORD SUBMIT
  // ---------------------------------------------------------------------------
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter your account email.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim());

      console.log('[Supabase resetPasswordForEmail response]', {
        data,
        error,
        status: error?.status,
        code: error?.code,
        message: error?.message,
      });

      if (error) throw error;

      setOtpType('recovery');
      setResendCooldown(60);
      switchMode('otp', {
        success: `Password recovery code sent to ${email.trim()}. Please check your email.`,
      });
    } catch (err) {
      console.error('Forgot Password Error Details:', {
        message: err.message,
        status: err.status,
        code: err.code,
        name: err.name,
        raw: err,
      });
      const errCode = (err.code || '').toLowerCase();
      const errMsg = (err.message || '').toLowerCase();

      if (err.status === 429 || errCode === 'over_email_send_rate_limit' || errMsg.includes('rate limit')) {
        setErrorMsg(`Rate limit exceeded (429): ${err.message}`);
      } else if (errCode === 'email_address_not_authorized' || errMsg.includes('not authorized')) {
        setErrorMsg(`Email address not authorized: ${err.message}. Default mailer only delivers to project members.`);
      } else if (errCode === 'unexpected_failure' || errMsg.includes('unexpected_failure')) {
        setErrorMsg(`Supabase Auth failure: ${err.message}`);
      } else {
        setErrorMsg(err.message || 'Could not send reset code. Please verify email.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 6. UPDATE PASSWORD (AFTER RECOVERY OTP)
  // ---------------------------------------------------------------------------
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMsg('Password updated successfully! Redirecting...');
      setTimeout(() => onAuthSuccess(data.user), 800);
    } catch (err) {
      console.error('Update Password Error:', err);
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // OTP INPUT NAVIGATION HELPERS (6 Box Auto-Advance, Backspace, Paste)
  // ---------------------------------------------------------------------------
  const handleOtpChange = (index, value) => {
    // Take only the last typed character and ensure it's a digit
    const cleaned = value.replace(/\D/g, '');
    const char = cleaned.slice(-1);

    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    // If character typed and not the last box, advance focus
    if (char && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Current box empty: jump to previous box and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    const digits = pasteData.replace(/\D/g, '').slice(0, 6).split('');

    if (digits.length > 0) {
      const newOtp = ['', '', '', '', '', ''];
      digits.forEach((d, idx) => {
        newOtp[idx] = d;
      });
      setOtp(newOtp);

      const focusIdx = Math.min(digits.length, 5);
      otpRefs.current[focusIdx]?.focus();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.45)',
            marginBottom: '0.85rem',
          }}
        >
          <HeartPulse size={30} color="#ffffff" />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display, sans-serif)',
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: 0,
            background: 'linear-gradient(135deg, #ffffff 40%, #22d3ee 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          HealthSaathi
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Intelligent Personal Health Copilot • Clinical Intelligence
        </p>
      </div>

      {/* Main Glassmorphic Auth Card */}
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(12, 18, 34, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(6, 182, 212, 0.12)',
          borderRadius: '24px',
          overflow: 'hidden',
        }}
      >
        {/* Supabase Missing Config Notice Badge */}
        {!isSupabaseConfigured && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#fde68a',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
              <span>Supabase credentials needed for live Email OTP</span>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              style={{
                background: 'rgba(245, 158, 11, 0.25)',
                border: '1px solid #f59e0b',
                color: '#fef3c7',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Setup Keys
            </button>
          </div>
        )}

        {/* Supabase Connection Test & Status Indicator */}
        {isSupabaseConfigured && (
          <div
            style={{
              background: 'rgba(6, 182, 212, 0.07)',
              borderBottom: '1px solid rgba(6, 182, 212, 0.14)',
              padding: '0.5rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#94a3b8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: diagInfo?.ok === false ? '#ef4444' : '#10b981',
                  display: 'inline-block',
                  boxShadow: diagInfo?.ok === false ? '0 0 6px #ef4444' : '0 0 6px #10b981',
                }}
              />
              <span>
                {diagInfo
                  ? diagInfo.ok
                    ? 'Supabase Auth Active (200 OK)'
                    : `Check Failed: ${diagInfo.error}`
                  : 'Supabase Auth Client Ready'}
              </span>
            </div>
            <button
              type="button"
              onClick={runConnectionCheck}
              disabled={testingConnection}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#22d3ee',
                fontSize: '0.72rem',
                cursor: 'pointer',
                padding: '2px 6px',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              {testingConnection ? 'Checking...' : 'Run Connection Test'}
            </button>
          </div>
        )}

        {/* Tab Switcher (Visible on Login & Signup) */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="auth-tabs" style={{ display: 'flex' }}>
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Create Account
            </button>
          </div>
        )}

        <div style={{ padding: '1.75rem' }}>
          {/* Status Banners */}
          {errorMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                borderRadius: '10px',
                color: '#fca5a5',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '1.25rem',
                lineHeight: 1.4,
              }}
            >
              <AlertCircle size={16} color="#f43f5e" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div>{errorMsg}</div>
                {accountAlreadyExists && (
                  <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      style={{
                        background: '#06b6d4',
                        color: '#080d1a',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Sign In with this Email &rarr;
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setAccountAlreadyExists(false);
                        setOtpType('signup');
                        const resendRes = await supabase.auth.resend({ type: 'signup', email: email.trim() });
                        if (!resendRes.error) {
                          setResendCooldown(60);
                          switchMode('otp', {
                            success: `A verification code was dispatched to ${email.trim()}. Please check your inbox and spam folder.`,
                          });
                        } else {
                          switchMode('otp', {
                            error: resendRes.error.message || 'Could not dispatch code. Check SMTP settings in Supabase.',
                          });
                        }
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        borderRadius: '6px',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Resend Verification OTP
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '10px',
                color: '#6ee7b7',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '1.25rem',
                lineHeight: 1.4,
              }}
            >
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>{successMsg}</div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* MODE: SIGNUP                                                  */}
          {/* ------------------------------------------------------------- */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="signup-name">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="signup-name"
                      type="text"
                      required
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '2.4rem' }}
                      placeholder="e.g. Dr. Alex Morgan"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                    <User size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="signup-email">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="signup-email"
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
                  <label htmlFor="signup-password">Password (min 6 characters)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '10px',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                  By continuing, a secure one-time verification code (OTP) will be dispatched to your email address.
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ justifyContent: 'center', width: '100%', padding: '0.75rem' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account & Verify OTP</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ------------------------------------------------------------- */}
          {/* MODE: LOGIN                                                   */}
          {/* ------------------------------------------------------------- */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="login-email">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="login-email"
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="login-password">Password</label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot_password')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#22d3ee',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '10px',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ justifyContent: 'center', width: '100%', padding: '0.75rem' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to HealthSaathi</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ------------------------------------------------------------- */}
          {/* MODE: 6-DIGIT EMAIL OTP VERIFICATION                          */}
          {/* ------------------------------------------------------------- */}
          {mode === 'otp' && (
            <div>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  padding: 0,
                }}
              >
                <ChevronLeft size={16} />
                <span>Back to Email</span>
              </button>

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: '#22d3ee',
                    marginBottom: '0.5rem',
                  }}
                >
                  <KeyRound size={22} />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff', margin: '0 0 0.35rem' }}>
                  Verify Email OTP
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Enter the 6-digit confirmation code dispatched to:
                  <br />
                  <strong style={{ color: '#22d3ee' }}>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp}>
                {/* 6 Box Inputs */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                  }}
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      style={{
                        width: '46px',
                        height: '54px',
                        textAlign: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: digit
                          ? '1.5px solid #22d3ee'
                          : '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                        outline: 'none',
                        boxShadow: digit ? '0 0 12px rgba(6, 182, 212, 0.25)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ justifyContent: 'center', width: '100%', padding: '0.75rem' }}
                  disabled={loading || otp.join('').length !== 6}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Access Dashboard</span>
                      <ShieldCheck size={16} />
                    </>
                  )}
                </button>

                {/* Resend OTP Button with Cooldown */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '1.25rem',
                    fontSize: '0.8rem',
                    color: '#94a3b8',
                  }}
                >
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: resendCooldown > 0 ? '#64748b' : '#22d3ee',
                      cursor: resendCooldown > 0 ? 'default' : 'pointer',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>

                {/* Secondary navigation on OTP screen */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginTop: '0.75rem',
                    fontSize: '0.78rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#22d3ee',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                      textDecoration: 'underline',
                    }}
                  >
                    Sign In with Password instead
                  </button>
                  <span style={{ color: '#475569' }}>•</span>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Change Email
                  </button>
                </div>

                {/* Email Delivery Troubleshooting Guide */}
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    lineHeight: 1.45,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22d3ee', fontWeight: 600, marginBottom: '6px' }}>
                    <Info size={14} />
                    <span>Why the email is not arriving & How to fix it:</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                    <li style={{ marginBottom: '4px' }}>
                      <strong style={{ color: '#38bdf8' }}>Instant Access (No waiting):</strong> In your open Supabase tab &rarr; <strong>Authentication</strong> &rarr; <strong>Users</strong> &rarr; find your email &rarr; click <strong>...</strong> &rarr; click <strong>Confirm Email</strong>. Then click <em>Sign In with Password</em> above!
                    </li>
                    <li style={{ marginBottom: '4px' }}>Check your Gmail <strong>Spam</strong> and <strong>Promotions</strong> folders.</li>
                    <li style={{ marginBottom: '4px' }}>In Supabase &rarr; <strong>Email Templates</strong> &rarr; <strong>Confirm signup</strong>: ensure body contains <code>&#123;&#123; .Token &#125;&#125;</code>.</li>
                    <li>Supabase built-in mailer is rate-limited (3/hr) and restricted. Configure <strong>Custom SMTP</strong> in Supabase (Project Settings &rarr; Authentication &rarr; SMTP) for permanent live delivery.</li>
                  </ul>
                </div>
              </form>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* MODE: FORGOT PASSWORD                                         */}
          {/* ------------------------------------------------------------- */}
          {mode === 'forgot_password' && (
            <div>
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  padding: 0,
                }}
              >
                <ChevronLeft size={16} />
                <span>Back to Sign In</span>
              </button>

              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                Reset Your Password
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                Enter your email address and we will dispatch a password recovery code.
              </p>

              <form onSubmit={handleForgotPassword}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="reset-email">Account Email</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="reset-email"
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

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ justifyContent: 'center', width: '100%', padding: '0.75rem' }}
                  disabled={loading}
                >
                  {loading ? 'Sending Recovery Code...' : 'Send Recovery Code'}
                </button>
              </form>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* MODE: RESET PASSWORD (NEW PASSWORD INPUT)                     */}
          {/* ------------------------------------------------------------- */}
          {mode === 'reset_password' && (
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                Create New Password
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                Your code was verified. Set your new HealthSaathi account password below.
              </p>

              <form onSubmit={handleUpdatePassword}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="new-password">New Password (min 6 characters)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ justifyContent: 'center', width: '100%', padding: '0.75rem' }}
                  disabled={loading}
                >
                  {loading ? 'Updating Password...' : 'Save Password & Sign In'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Supabase Connection Setup Modal Drawer */}
      {showConfigModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="#22d3ee" />
                <h3 style={{ fontSize: '1.05rem' }}>Supabase Configuration</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowConfigModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{ gap: '1rem', fontSize: '0.85rem' }}>
              <p style={{ color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                To send real Email OTP codes, add your Supabase credentials into{' '}
                <code style={{ color: '#22d3ee' }}>frontend/.env</code>:
              </p>

              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#cbd5e1',
                }}
              >
                VITE_SUPABASE_URL=https://your-project.supabase.co
                <br />
                VITE_SUPABASE_ANON_KEY=your_anon_key_here
              </div>

              <div className="form-group">
                <label>Or enter here for instant testing in this session:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://xyzcompany.supabase.co"
                  value={configUrl}
                  onChange={(e) => setConfigUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Supabase Anon / Public Key:</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                  value={configKey}
                  onChange={(e) => setConfigKey(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{ justifyContent: 'center' }}
                onClick={() => {
                  if (configUrl && configKey) {
                    setRuntimeSupabaseConfig(configUrl, configKey);
                  } else {
                    alert('Please enter both Project URL and Anon Key');
                  }
                }}
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
        HealthSaathi AI Health Intelligence • Clinical Grade Privacy
      </div>
    </div>
  );
}
