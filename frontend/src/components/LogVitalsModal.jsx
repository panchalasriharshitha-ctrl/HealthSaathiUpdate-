import React, { useState } from 'react';
import { X, Heart, Activity, Droplets, Wind, Moon, CheckCircle } from 'lucide-react';
import { logNewVitals } from '../services/api';

export default function LogVitalsModal({ isOpen, onClose, onVitalsLogged }) {
  const [formData, setFormData] = useState({
    heart_rate: 74,
    blood_pressure_sys: 120,
    blood_pressure_dia: 80,
    blood_glucose: 96,
    oxygen_level: 99,
    sleep_hours: 8.0,
    notes: 'Afternoon post-activity measurement'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'notes' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const saved = await logNewVitals(formData);
      setSuccessMsg(true);
      setTimeout(() => {
        onVitalsLogged(saved);
        setSuccessMsg(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to log vitals:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" id="log-vitals-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Log New Vitals Reading</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {successMsg ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
            <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Vitals Recorded Successfully!</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Stored securely in your SQLite local database.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="heart_rate">Heart Rate (BPM)</label>
                  <input
                    id="heart_rate"
                    name="heart_rate"
                    type="number"
                    min="30"
                    max="220"
                    className="form-input"
                    value={formData.heart_rate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="oxygen_level">Oxygen SpO2 (%)</label>
                  <input
                    id="oxygen_level"
                    name="oxygen_level"
                    type="number"
                    min="60"
                    max="100"
                    className="form-input"
                    value={formData.oxygen_level}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="blood_pressure_sys">Systolic BP (mmHg)</label>
                  <input
                    id="blood_pressure_sys"
                    name="blood_pressure_sys"
                    type="number"
                    min="60"
                    max="250"
                    className="form-input"
                    value={formData.blood_pressure_sys}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="blood_pressure_dia">Diastolic BP (mmHg)</label>
                  <input
                    id="blood_pressure_dia"
                    name="blood_pressure_dia"
                    type="number"
                    min="40"
                    max="150"
                    className="form-input"
                    value={formData.blood_pressure_dia}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="blood_glucose">Blood Glucose (mg/dL)</label>
                  <input
                    id="blood_glucose"
                    name="blood_glucose"
                    type="number"
                    step="0.1"
                    min="40"
                    max="450"
                    className="form-input"
                    value={formData.blood_glucose}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sleep_hours">Sleep (Hours)</label>
                  <input
                    id="sleep_hours"
                    name="sleep_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    className="form-input"
                    value={formData.sleep_hours}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Clinical / Personal Notes</label>
                <input
                  id="notes"
                  name="notes"
                  type="text"
                  placeholder="e.g., Felt energetic after hydration, light cardio done"
                  className="form-input"
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
                id="submit-vitals-btn"
              >
                {isSubmitting ? 'Saving to SQLite...' : 'Save Vitals'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
