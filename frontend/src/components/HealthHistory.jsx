import React, { useState } from 'react';
import {
  History,
  Trash2,
  Activity,
  Stethoscope,
  Filter,
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function HealthHistory({
  records = [],
  onDeleteRecord,
  onClearHistory,
  lang = 'en'
}) {
  const [filterType, setFilterType] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const filteredRecords = records.filter((rec) => {
    if (filterType === 'vitals') return rec.type === 'vitals' || rec.heart_rate !== undefined;
    if (filterType === 'symptoms') return rec.type === 'symptom_check';
    return true;
  });

  return (
    <div className="view-panel" id="health-history-panel">
      <div className="view-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>
            <History size={28} color="#06b6d4" />
            <span>{t('history_title', 'Your Health History & Vitals Log')}</span>
          </h2>
          <p>{t('history_subtitle', 'Private records stored securely for your personal healthcare track.')}</p>
        </div>

        {records.length > 0 && (
          <div>
            {!confirmClear ? (
              <button
                className="btn-danger-outline"
                onClick={() => setConfirmClear(true)}
              >
                <Trash2 size={15} />
                <span>{t('btn_clear_all', 'Clear All Records')}</span>
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#fca5a5' }}>Confirm delete all?</span>
                <button
                  className="btn-danger-outline"
                  style={{ background: '#f43f5e', color: 'white' }}
                  onClick={() => {
                    onClearHistory && onClearHistory();
                    setConfirmClear(false);
                  }}
                >
                  Yes, Clear
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          className={`btn-secondary ${filterType === 'all' ? 'active' : ''}`}
          style={{
            padding: '0.4rem 0.85rem',
            fontSize: '0.78rem',
            background: filterType === 'all' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.05)',
            borderColor: filterType === 'all' ? 'var(--cyan-500)' : 'var(--border-glass)'
          }}
          onClick={() => setFilterType('all')}
        >
          All Records ({records.length})
        </button>

        <button
          className={`btn-secondary ${filterType === 'vitals' ? 'active' : ''}`}
          style={{
            padding: '0.4rem 0.85rem',
            fontSize: '0.78rem',
            background: filterType === 'vitals' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.05)',
            borderColor: filterType === 'vitals' ? 'var(--cyan-500)' : 'var(--border-glass)'
          }}
          onClick={() => setFilterType('vitals')}
        >
          <Activity size={13} />
          <span>Vitals Logs</span>
        </button>

        <button
          className={`btn-secondary ${filterType === 'symptoms' ? 'active' : ''}`}
          style={{
            padding: '0.4rem 0.85rem',
            fontSize: '0.78rem',
            background: filterType === 'symptoms' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.05)',
            borderColor: filterType === 'symptoms' ? 'var(--cyan-500)' : 'var(--border-glass)'
          }}
          onClick={() => setFilterType('symptoms')}
        >
          <Stethoscope size={13} />
          <span>Symptom Checks</span>
        </button>
      </div>

      {/* Table / List */}
      <div className="data-table-wrapper">
        {filteredRecords.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
            <History size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p>{t('no_records', 'No health records found yet. Log vitals or save symptom checks to start tracking.')}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Details & Measurements</th>
                <th>Clinical Notes / Summary</th>
                <th>Date & Time</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((item) => {
                const isVitals = item.type === 'vitals' || item.heart_rate !== undefined;
                return (
                  <tr key={item.id}>
                    <td>
                      <span
                        className="status-pill"
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          background: isVitals ? 'rgba(6, 182, 212, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                          borderColor: isVitals ? 'rgba(6, 182, 212, 0.3)' : 'rgba(139, 92, 246, 0.3)',
                          color: isVitals ? '#7dd3fc' : '#c4b5fd'
                        }}
                      >
                        {isVitals ? 'Vitals Log' : 'Symptom Check'}
                      </span>
                    </td>

                    <td>
                      {isVitals ? (
                        <div style={{ fontSize: '0.82rem' }}>
                          <strong>HR:</strong> {item.heart_rate ?? '--'} bpm |{' '}
                          <strong>BP:</strong> {item.blood_pressure_sys ?? '--'}/{item.blood_pressure_dia ?? '--'} mmHg |{' '}
                          <strong>Glu:</strong> {item.blood_glucose ?? '--'} mg/dL |{' '}
                          <strong>SpO2:</strong> {item.oxygen_level ?? '--'}%
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.82rem' }}>
                          <strong>{item.title}</strong>
                          <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{item.summary}</div>
                        </div>
                      )}
                    </td>

                    <td style={{ color: '#94a3b8', fontSize: '0.8rem', maxWidth: '240px' }}>
                      {item.notes || item.urgency || 'Routine health log'}
                    </td>

                    <td style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {new Date(item.created_at || item.date || Date.now()).toLocaleString()}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-danger-outline"
                        onClick={() => onDeleteRecord && onDeleteRecord(item.id)}
                        title="Delete record"
                      >
                        <Trash2 size={13} />
                        <span>{t('btn_delete_record', 'Delete')}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#64748b' }}>
        <ShieldCheck size={14} color="#10b981" />
        <span>Protected by Row Level Security (RLS). Records are scoped exclusively to your user ID.</span>
      </div>
    </div>
  );
}
