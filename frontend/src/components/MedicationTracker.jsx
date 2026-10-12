import React, { useState } from 'react';
import { Pill, Check, Clock, Plus } from 'lucide-react';

export default function MedicationTracker() {
  const [meds, setMeds] = useState([
    { id: 1, name: 'Vitamin D3 & K2', dose: '5000 IU • With Breakfast', time: '08:00 AM', completed: true },
    { id: 2, name: 'Omega-3 EPA/DHA', dose: '1200 mg • Post-Meal', time: '01:00 PM', completed: true },
    { id: 3, name: 'Magnesium Glycinate', dose: '300 mg • 30m Prior to Sleep', time: '09:30 PM', completed: false },
    { id: 4, name: 'CoQ10 Ubiquinol', dose: '100 mg • Heart Health Support', time: '10:00 AM', completed: true },
  ]);

  const toggleMed = (id) => {
    setMeds((prev) =>
      prev.map((med) => (med.id === id ? { ...med, completed: !med.completed } : med))
    );
  };

  return (
    <section className="card-container" aria-label="Medications Schedule" id="medications-tracker-section">
      <div className="section-header">
        <h2 className="section-title">
          <Pill className="section-title-icon" size={20} />
          Today's Regimen & Prescriptions
        </h2>
        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
          {meds.filter((m) => m.completed).length} of {meds.length} Taken
        </span>
      </div>

      <div className="meds-list">
        {meds.map((med) => (
          <div
            key={med.id}
            className={`med-item ${med.completed ? 'completed' : ''}`}
            id={`med-item-${med.id}`}
          >
            <div className="med-info">
              <div className="med-icon-box">
                <Pill size={18} />
              </div>
              <div>
                <div className="med-name">{med.name}</div>
                <div className="med-dose">{med.dose}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#64748b' }}>
                <Clock size={13} />
                <span>{med.time}</span>
              </div>
              <button
                className={`med-status-btn ${med.completed ? 'checked' : ''}`}
                onClick={() => toggleMed(med.id)}
              >
                {med.completed ? (
                  <>
                    <Check size={14} /> Taken
                  </>
                ) : (
                  'Mark Taken'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
