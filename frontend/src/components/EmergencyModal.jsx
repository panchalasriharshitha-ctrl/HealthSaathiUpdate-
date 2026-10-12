import React, { useState } from 'react';
import {
  PhoneCall,
  ShieldAlert,
  X,
  Copy,
  Check,
  AlertTriangle,
  PhoneForwarded,
  Info,
  UserCheck
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function EmergencyModal({ isOpen, onClose, lang = 'en' }) {
  const [copiedNumber, setCopiedNumber] = useState(null);
  const [customIceName, setCustomIceName] = useState(() => localStorage.getItem('healthsaathi_ice_name') || localStorage.getItem('medimate_ice_name') || '');
  const [customIcePhone, setCustomIcePhone] = useState(() => localStorage.getItem('healthsaathi_ice_phone') || localStorage.getItem('medimate_ice_phone') || '');
  const [isEditingIce, setIsEditingIce] = useState(false);

  if (!isOpen) return null;

  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const emergencyServices = [
    {
      id: 'general-112',
      number: '112',
      title: '112 - National Emergency Services',
      subtitle: 'All-in-one Emergency: Police, Ambulance, Fire & Disaster (India)',
      badge: 'Primary Emergency',
      color: '#f43f5e',
      isPrimary: true
    },
    {
      id: 'medical-108',
      number: '108',
      title: '108 - Emergency Medical Ambulance',
      subtitle: 'Free Emergency Ambulance & Paramedic Response (State Govt / MoHFW)',
      badge: 'Ambulance & Paramedic',
      color: '#ef4444'
    },
    {
      id: 'maternal-102',
      number: '102',
      title: '102 - Pregnant Women & Infant Ambulance',
      subtitle: 'Specialized Maternal & Neonatal Emergency Transport (Janani Shishu)',
      badge: 'Maternal Transport',
      color: '#ec4899'
    },
    {
      id: 'helpline-1075',
      number: '1075',
      title: '1075 - National Health Helpline',
      subtitle: 'Toll-free Medical Information & Health Emergency Advisory',
      badge: 'Govt Health Helpline',
      color: '#06b6d4'
    }
  ];

  const handleCopy = (num) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  const handleSaveIce = (e) => {
    e.preventDefault();
    localStorage.setItem('healthsaathi_ice_name', customIceName.trim());
    localStorage.setItem('healthsaathi_ice_phone', customIcePhone.trim());
    setIsEditingIce(false);
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      style={{ zIndex: 99999 }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '580px',
          border: '1px solid rgba(244, 63, 94, 0.45)',
          boxShadow: '0 25px 60px rgba(244, 63, 94, 0.25), 0 0 1px 1px rgba(244, 63, 94, 0.3)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f43f5e',
                border: '1px solid rgba(244, 63, 94, 0.3)'
              }}
            >
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2
                id="emergency-modal-title"
                style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}
              >
                {t('emergency_modal_title', 'Emergency Contacts & Services')}
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#fda4af', margin: '2px 0 0 0' }}>
                {t('emergency_modal_subtitle', 'Immediate 24/7 National Emergency Telephony (India)')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Emergency Modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Telephony Disclaimer Banner */}
        <div
          style={{
            margin: '1.1rem 0',
            padding: '0.85rem 1rem',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '12px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start'
          }}
        >
          <Info size={18} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.45 }}>
            <strong style={{ color: '#fca5a5' }}>
              Important Device Telephony Notice:
            </strong>{' '}
            Web browsers cannot automatically place emergency calls or dispatch emergency services.
            Tapping <strong>Call Now</strong> will open your phone or device dialer with the number pre-filled.
            On desktop computers, you can copy the number or place the call via your linked phone application (e.g., Windows Phone Link, FaceTime).
          </div>
        </div>

        {/* Confirmation Step (if user clicked call on desktop) */}
        {confirmCallTarget && (
          <div
            style={{
              marginBottom: '1.2rem',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              animation: 'modal-pop 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontWeight: 700, fontSize: '0.9rem' }}>
              <AlertTriangle size={18} />
              <span>Confirm Initiation: Call {confirmCallTarget.number}?</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: '6px 0 12px' }}>
              You are about to launch your device dialer for <strong>{confirmCallTarget.title}</strong>. Please ensure you are prepared to describe your location and symptoms clearly to the emergency operator.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={`tel:${confirmCallTarget.number}`}
                id={`btn-confirm-call-${confirmCallTarget.number}`}
                className="btn-primary"
                style={{
                  background: '#e11d48',
                  borderColor: '#f43f5e',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  padding: '0.5rem 1.1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => {
                  handleCopy(confirmCallTarget.number);
                  setTimeout(() => setConfirmCallTarget(null), 1800);
                }}
              >
                <PhoneForwarded size={16} />
                <span>Launch Device Dialer ({confirmCallTarget.number})</span>
              </a>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.82rem' }}
                onClick={() => setConfirmCallTarget(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Emergency Services Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto' }}>
          {emergencyServices.map((service) => (
            <div
              key={service.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                background: service.isPrimary ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: service.isPrimary ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: service.color, letterSpacing: '0.5px' }}>
                    {service.number}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'rgba(244, 63, 94, 0.2)',
                      color: '#fca5a5'
                    }}
                  >
                    {service.badge}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                  {service.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  {service.subtitle}
                </div>
              </div>

              {/* Action Buttons: Functional tel: Link + Copy */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleCopy(service.number)}
                  title={`Copy ${service.number} to clipboard`}
                  aria-label={`Copy ${service.number} to clipboard`}
                  className="btn-secondary"
                  style={{
                    padding: '0.45rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: copiedNumber === service.number ? '#34d399' : '#94a3b8'
                  }}
                >
                  {copiedNumber === service.number ? <Check size={16} /> : <Copy size={16} />}
                </button>

                <a
                  href={`tel:${service.number}`}
                  id={`btn-call-emergency-${service.number}`}
                  aria-label={`Call ${service.number} now`}
                  onClick={(e) => {
                    // On desktop, prompt confirmation step before opening telephony
                    if (window.innerWidth > 768) {
                      e.preventDefault();
                      setConfirmCallTarget(service);
                    }
                  }}
                  className="btn-primary"
                  style={{
                    background: service.isPrimary ? '#e11d48' : '#be123c',
                    borderColor: service.color,
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <PhoneCall size={14} />
                  <span>Call {service.number}</span>
                </a>
              </div>
            </div>
          ))}

          {/* Personal ICE Contact Section */}
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'rgba(6, 182, 212, 0.05)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: '12px',
              marginTop: '0.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22d3ee', fontWeight: 600, fontSize: '0.85rem' }}>
                <UserCheck size={16} />
                <span>Personal In-Case-of-Emergency (ICE) Contact</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingIce(!isEditingIce)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isEditingIce ? 'Cancel' : (customIcePhone ? 'Edit' : '+ Add Contact')}
              </button>
            </div>

            {isEditingIce ? (
              <form onSubmit={handleSaveIce} style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Contact Name (e.g., Dr. Sharma, Spouse, Parent)"
                  value={customIceName}
                  onChange={(e) => setCustomIceName(e.target.value)}
                  className="copilot-input"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number (e.g., +91 98765 43210)"
                  value={customIcePhone}
                  onChange={(e) => setCustomIcePhone(e.target.value)}
                  className="copilot-input"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                    Save Contact
                  </button>
                </div>
              </form>
            ) : customIcePhone ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                    {customIceName || 'Personal Contact'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{customIcePhone}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(customIcePhone)}
                    aria-label="Copy ICE number"
                    className="btn-secondary"
                    style={{ padding: '0.4rem', borderRadius: '8px' }}
                  >
                    {copiedNumber === customIcePhone ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  </button>
                  <a
                    href={`tel:${customIcePhone}`}
                    aria-label={`Call ${customIceName}`}
                    className="btn-primary"
                    style={{
                      background: '#0284c7',
                      borderColor: '#0ea5e9',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.78rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <PhoneCall size={13} />
                    <span>Call ICE</span>
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                No personal emergency contact configured. Click "+ Add Contact" to save your primary emergency contact number.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
