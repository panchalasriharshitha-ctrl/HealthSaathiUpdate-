import React from 'react';
import { Bell, CheckCheck, Trash2, Calendar, Activity, Pill, AlertTriangle } from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onMarkOneRead,
  lang = 'en',
}) {
  if (!isOpen) return null;

  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const getIcon = (type) => {
    switch (type) {
      case 'appointment':
        return <Calendar size={16} color="#38bdf8" />;
      case 'vital':
        return <Activity size={16} color="#34d399" />;
      case 'medication':
        return <Pill size={16} color="#a78bfa" />;
      case 'emergency':
        return <AlertTriangle size={16} color="#f43f5e" />;
      default:
        return <Bell size={16} color="#06b6d4" />;
    }
  };

  return (
    <div className="notif-dropdown" id="notification-center-dropdown">
      <div className="notif-header">
        <h4>{t('notifications_title', 'Notifications & Alerts')}</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          {notifications.length > 0 && (
            <>
              <button
                className="btn-secondary"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                onClick={onMarkAllAsRead}
                title={t('mark_all_read', 'Mark all as read')}
              >
                <CheckCheck size={13} />
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                onClick={onClearAll}
                title={t('clear_notifications', 'Clear all')}
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
            {t('no_notifications', 'No new notifications')}
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`notif-item ${!item.read ? 'unread' : ''}`}
              onClick={() => onMarkOneRead && onMarkOneRead(item.id)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ marginTop: '2px' }}>{getIcon(item.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: item.read ? '#94a3b8' : 'white', fontSize: '0.82rem' }}>
                    {item.title}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{item.time}</span>
                </div>
                <p style={{ margin: '3px 0 0', color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.3 }}>
                  {item.message}
                </p>
              </div>
              {!item.read && <div className="notif-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
