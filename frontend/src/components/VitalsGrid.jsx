import React from 'react';
import { Heart, Activity, Droplets, Wind, Moon } from 'lucide-react';

export default function VitalsGrid({ latestVitals, onOpenLogModal }) {
  const hr = latestVitals?.heart_rate ?? 72;
  const sys = latestVitals?.blood_pressure_sys ?? 118;
  const dia = latestVitals?.blood_pressure_dia ?? 78;
  const glucose = latestVitals?.blood_glucose ?? 95.5;
  const spo2 = latestVitals?.oxygen_level ?? 98;
  const sleep = latestVitals?.sleep_hours ?? 7.5;

  return (
    <section aria-label="Patient Real-time Vitals" id="vitals-dashboard-section">
      <div className="section-header">
        <h2 className="section-title">
          <Activity className="section-title-icon" size={22} />
          Real-Time Biomarkers & Vitals
        </h2>
        <button 
          id="btn-quick-log-inline"
          className="btn-secondary" 
          onClick={onOpenLogModal}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
        >
          + Add New Reading
        </button>
      </div>

      <div className="vitals-grid">
        {/* Heart Rate */}
        <article className="vital-card" id="card-heart-rate">
          <div className="vital-header">
            <div className="vital-icon-wrap icon-heart">
              <Heart size={20} />
            </div>
            <span className="vital-trend">-3 BPM</span>
          </div>
          <div className="vital-label">Resting Heart Rate</div>
          <div className="vital-value-wrap">
            <span className="vital-value">{hr}</span>
            <span className="vital-unit">BPM</span>
          </div>
          {/* Animated SVG ECG line */}
          <div style={{ height: '24px', width: '100%', margin: '6px 0 10px' }}>
            <svg viewBox="0 0 100 25" style={{ width: '100%', height: '100%', stroke: '#fb7185', fill: 'none', strokeWidth: 2 }}>
              <path className="ecg-line" d="M0,12 L20,12 L25,3 L30,22 L35,12 L50,12 L55,4 L60,20 L65,12 L100,12" />
            </svg>
          </div>
          <div className="vital-footer">
            <span className="vital-status-tag">Normal Sinus Rhythm</span>
            <span>Target: 60-80</span>
          </div>
        </article>

        {/* Blood Pressure */}
        <article className="vital-card" id="card-blood-pressure">
          <div className="vital-header">
            <div className="vital-icon-wrap icon-bp">
              <Activity size={20} />
            </div>
            <span className="vital-trend neutral">Stable</span>
          </div>
          <div className="vital-label">Blood Pressure</div>
          <div className="vital-value-wrap">
            <span className="vital-value">{sys}/{dia}</span>
            <span className="vital-unit">mmHg</span>
          </div>
          <div className="vital-footer">
            <span className="vital-status-tag">Optimal (Stage 0)</span>
            <span>Norm: &lt;120/80</span>
          </div>
        </article>

        {/* Blood Glucose */}
        <article className="vital-card" id="card-blood-glucose">
          <div className="vital-header">
            <div className="vital-icon-wrap icon-glucose">
              <Droplets size={20} />
            </div>
            <span className="vital-trend">+1.2%</span>
          </div>
          <div className="vital-label">Fasting Glucose</div>
          <div className="vital-value-wrap">
            <span className="vital-value">{glucose}</span>
            <span className="vital-unit">mg/dL</span>
          </div>
          <div className="vital-footer">
            <span className="vital-status-tag">Euglycemic</span>
            <span>Target: 70-99</span>
          </div>
        </article>

        {/* Blood Oxygen SpO2 */}
        <article className="vital-card" id="card-oxygen-level">
          <div className="vital-header">
            <div className="vital-icon-wrap icon-oxygen">
              <Wind size={20} />
            </div>
            <span className="vital-trend">Optimal</span>
          </div>
          <div className="vital-label">Blood Oxygen (SpO2)</div>
          <div className="vital-value-wrap">
            <span className="vital-value">{spo2}</span>
            <span className="vital-unit">%</span>
          </div>
          <div className="vital-footer">
            <span className="vital-status-tag">Target Reached</span>
            <span>Normal: 95-100%</span>
          </div>
        </article>

        {/* Sleep Hours */}
        <article className="vital-card" id="card-sleep-duration">
          <div className="vital-header">
            <div className="vital-icon-wrap icon-sleep">
              <Moon size={20} />
            </div>
            <span className="vital-trend">+45m</span>
          </div>
          <div className="vital-label">Sleep Duration</div>
          <div className="vital-value-wrap">
            <span className="vital-value">{sleep}</span>
            <span className="vital-unit">hours</span>
          </div>
          <div className="vital-footer">
            <span className="vital-status-tag">Deep Recovery</span>
            <span>Goal: 7-9h</span>
          </div>
        </article>
      </div>
    </section>
  );
}
