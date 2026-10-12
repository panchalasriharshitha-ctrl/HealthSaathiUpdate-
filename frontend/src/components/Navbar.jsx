import React, { useState } from 'react';
import {
  HeartPulse,
  Activity,
  Bell,
  LogOut,
  LogIn,
  Calendar,
  Stethoscope,
  Pill,
  History,
  Bot,
  LayoutDashboard,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import NotificationCenter from './NotificationCenter';

export default function Navbar({
  activeTab = 'dashboard',
  onSelectTab,
  backendHealth,
  onOpenLogModal,
  onOpenEmergencyModal,
  currentLang = 'en',
  onSelectLang,
  user,
  onOpenAuthModal,
  onSignOut,
  notifications = [],
  onMarkAllAsRead,
  onClearAll,
  onMarkOneRead
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const t = (key, fallback) => getTranslation(currentLang, key, fallback);
  const isHealthy = backendHealth?.status === 'healthy' || backendHealth?.status === 'OK' || backendHealth?.status === 'ok';
  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: t('nav_dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'lab_reports', label: t('nav_lab_reports', 'Lab Reports'), icon: FileText },
    { id: 'prescriptions', label: t('nav_prescriptions', 'Prescriptions'), icon: Pill },
    { id: 'symptoms', label: t('nav_symptoms', 'Symptom Checker'), icon: Stethoscope },
    { id: 'appointments', label: t('nav_appointments', 'Appointments'), icon: Calendar },
    { id: 'medicines', label: t('nav_medicines', 'Medications'), icon: Pill },
    { id: 'history', label: t('nav_history', 'Health History'), icon: History },
    { id: 'assistant', label: t('nav_assistant', 'AI Assistant'), icon: Bot },
  ];

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    t('nav_guest', 'Patient');

  const userInitials = String(userName || 'Patient')
    .trim()
    .split(/\s+/)
    .map((n) => n[0] || '')
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'P';

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        {/* Top Row: Brand & Controls */}
        <div className="navbar-top-row">
          {/* Brand */}
          <div
            className="nav-brand"
            id="brand-header"
            onClick={() => onSelectTab && onSelectTab('dashboard')}
          >
            <div className="brand-icon-box">
              <HeartPulse size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="brand-title">{t('brand_title', 'HealthSaathi')}</span>
                <span className="brand-badge">PRO</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                {t('brand_subtitle', 'Intelligent Personal Health Copilot')}
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="nav-controls">
            {/* Language Selector */}
            <div className="lang-selector" title="Select Interface Language">
              <button
                className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
                onClick={() => onSelectLang('en')}
              >
                EN
              </button>
              <button
                className={`lang-btn ${currentLang === 'te' ? 'active' : ''}`}
                onClick={() => onSelectLang('te')}
              >
                తెలుగు
              </button>
              <button
                className={`lang-btn ${currentLang === 'hi' ? 'active' : ''}`}
                onClick={() => onSelectLang('hi')}
              >
                हिन्दी
              </button>
            </div>

            {/* Backend Connection Indicator */}
            <div
              id="system-status-indicator"
              className={`status-pill ${isHealthy ? 'online' : 'offline'}`}
              title={`API Status: ${backendHealth?.status || 'checking'}`}
            >
              <span className="status-dot" />
              <span>{isHealthy ? t('backend_connected', 'System Online') : t('backend_connecting', 'Connecting...')}</span>
            </div>

            {/* Quick Log Vitals Button */}
            <button
              id="nav-log-vitals-btn"
              className="btn-primary"
              onClick={onOpenLogModal}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            >
              <Activity size={15} />
              <span>{t('nav_log_vitals', '+ Log Vitals')}</span>
            </button>

            {/* Emergency SOS Button */}
            <button
              id="nav-emergency-sos-btn"
              className="btn-primary"
              onClick={onOpenEmergencyModal}
              title="Emergency Services (112 / 108)"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#fda4af',
                borderColor: 'rgba(244, 63, 94, 0.45)',
                boxShadow: '0 0 15px rgba(244, 63, 94, 0.18)'
              }}
            >
              <ShieldAlert size={15} color="#f43f5e" />
              <span>Emergency 112</span>
            </button>

            {/* Notifications Center */}
            <div className="notif-wrapper">
              <button
                id="notif-bell-btn"
                className="notif-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              <NotificationCenter
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                onMarkAllAsRead={() => {
                  onMarkAllAsRead && onMarkAllAsRead();
                }}
                onClearAll={() => {
                  onClearAll && onClearAll();
                  setShowNotifications(false);
                }}
                onMarkOneRead={onMarkOneRead}
                lang={currentLang}
              />
            </div>

            {/* Authenticated User Profile & Logout */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  className="user-profile-badge"
                  id="patient-profile-chip"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title="Account Settings"
                >
                  <div className="profile-avatar">{userInitials || 'HS'}</div>
                  <div className="profile-meta">
                    <span className="profile-name">{userName}</span>
                    <span className="profile-sub">{user.email || 'Verified'}</span>
                  </div>
                </div>

                {/* Explicit Direct Logout Button */}
                <button
                  className="btn-secondary"
                  id="btn-logout-nav"
                  onClick={onSignOut}
                  title="End Supabase Session & Log Out"
                  style={{
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#fda4af',
                    borderColor: 'rgba(244, 63, 94, 0.3)',
                  }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                className="btn-secondary"
                onClick={onOpenAuthModal}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              >
                <LogIn size={15} />
                <span>{t('nav_sign_in', 'Sign In')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Subnav Row: Full-width Accessible Navigation Tabs Bar */}
        <div className="navbar-subnav-row">
          <nav className="nav-tabs-bar" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectTab && onSelectTab(item.id)}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
