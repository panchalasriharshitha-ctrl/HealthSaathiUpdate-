import React, { useState, useEffect } from 'react';
import { Pill, Check, Clock, Plus, Trash2, RotateCcw, CheckCheck, X } from 'lucide-react';

const DEFAULT_MEDS = [
  { id: 1, name: 'Vitamin D3 & K2', dose: '5000 IU • With Breakfast', time: '08:00 AM', completed: false },
  { id: 2, name: 'Omega-3 EPA/DHA', dose: '1200 mg • Post-Meal', time: '01:00 PM', completed: false },
  { id: 3, name: 'Magnesium Glycinate', dose: '300 mg • 30m Prior to Sleep', time: '09:30 PM', completed: false },
  { id: 4, name: 'CoQ10 Ubiquinol', dose: '100 mg • Heart Health Support', time: '10:00 AM', completed: false },
];

export default function MedicationTracker({ onToast }) {
  const [meds, setMeds] = useState(() => {
    try {
      const saved = localStorage.getItem('healthsaathi_patient_meds') || localStorage.getItem('medimate_patient_meds');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed reading meds from storage:', e);
    }
    return DEFAULT_MEDS;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedTime, setNewMedTime] = useState('08:00 AM');

  const saveMeds = (updatedList) => {
    setMeds(updatedList);
    try {
      localStorage.setItem('healthsaathi_patient_meds', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Storage save notice:', e);
    }
  };

  const toggleMed = (id) => {
    const target = meds.find((m) => m.id === id);
    const nextCompleted = !target?.completed;
    const updated = meds.map((med) =>
      med.id === id ? { ...med, completed: nextCompleted } : med
    );
    saveMeds(updated);

    if (onToast && target) {
      onToast(
        nextCompleted
          ? `✓ Marked "${target.name}" as taken!`
          : `Unmarked "${target.name}" for today`
      );
    }
  };

  const handleMarkAllTaken = () => {
    const updated = meds.map((m) => ({ ...m, completed: true }));
    saveMeds(updated);
    if (onToast) onToast('All medications marked as taken for today!');
  };

  const handleResetAll = () => {
    const updated = meds.map((m) => ({ ...m, completed: false }));
    saveMeds(updated);
    if (onToast) onToast('Daily regimen reset to 0.');
  };

  const handleDeleteMed = (id, name) => {
    const updated = meds.filter((m) => m.id !== id);
    saveMeds(updated);
    if (onToast) onToast(`Removed "${name}" from schedule.`);
  };

  const handleAddMedSubmit = (e) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newMed = {
      id: Date.now(),
      name: newMedName.trim(),
      dose: newMedDose.trim() || '1 Dose • As Prescribed',
      time: newMedTime || '09:00 AM',
      completed: false
    };

    const updated = [...meds, newMed];
    saveMeds(updated);
    setNewMedName('');
    setNewMedDose('');
    setIsAddModalOpen(false);
    if (onToast) onToast(`Added "${newMed.name}" to prescription regimen!`);
  };

  const takenCount = meds.filter((m) => m.completed).length;
  const adherencePercent = meds.length > 0 ? Math.round((takenCount / meds.length) * 100) : 0;

  return (
    <section className="card-container" aria-label="Medications Schedule" id="medications-tracker-section">
      <div className="section-header" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <h2 className="section-title">
          <Pill className="section-title-icon" size={20} />
          Today's Regimen & Prescriptions
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.82rem',
              color: adherencePercent === 100 ? '#34d399' : adherencePercent > 0 ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-glass)'
            }}
          >
            {takenCount} of {meds.length} Taken ({adherencePercent}%)
          </span>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
            title="Add New Medication"
          >
            <Plus size={14} />
            <span>Add Med</span>
          </button>
        </div>
      </div>

      {/* Adherence Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${adherencePercent}%`,
            background:
              adherencePercent === 100
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #06b6d4, #3b82f6)',
            borderRadius: '999px',
            transition: 'width 0.4s ease-out'
          }}
        />
      </div>

      {/* Medication List */}
      <div className="meds-list">
        {meds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
            No medications currently scheduled. Click "+ Add Med" to add your daily doses.
          </div>
        ) : (
          meds.map((med) => (
            <div
              key={med.id}
              className={`med-item ${med.completed ? 'completed' : ''}`}
              id={`med-item-${med.id}`}
              style={{
                transition: 'all 0.2s ease',
                border: med.completed
                  ? '1px solid rgba(16, 185, 129, 0.35)'
                  : '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div className="med-info">
                <div
                  className="med-icon-box"
                  style={{
                    background: med.completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: med.completed ? '#34d399' : '#94a3b8'
                  }}
                >
                  <Pill size={18} />
                </div>
                <div>
                  <div className="med-name" style={{ color: med.completed ? '#cbd5e1' : '#ffffff' }}>
                    {med.name}
                  </div>
                  <div className="med-dose">{med.dose}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    color: '#64748b'
                  }}
                >
                  <Clock size={13} />
                  <span>{med.time}</span>
                </div>

                <button
                  id={`btn-toggle-med-${med.id}`}
                  className={`med-status-btn ${med.completed ? 'checked' : ''}`}
                  onClick={() => toggleMed(med.id)}
                  aria-label={med.completed ? `Mark ${med.name} untaken` : `Mark ${med.name} taken`}
                >
                  {med.completed ? (
                    <>
                      <Check size={14} /> Taken
                    </>
                  ) : (
                    'Mark Taken'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteMed(med.id, med.name)}
                  title="Remove from regimen"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Bulk Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <button
          type="button"
          className="btn-secondary"
          onClick={handleResetAll}
          style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem' }}
          title="Reset all to untaken for a new day"
        >
          <RotateCcw size={12} />
          <span>Reset Day</span>
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleMarkAllTaken}
          style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem', color: '#34d399' }}
          title="Mark all medications taken at once"
        >
          <CheckCheck size={12} />
          <span>Mark All Taken</span>
        </button>
      </div>

      {/* Add Medication Modal */}
      {isAddModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          style={{ zIndex: 99999 }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="modal-card"
            style={{ maxWidth: '420px', animation: 'modal-pop 0.2s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-glass)',
                paddingBottom: '0.75rem'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>Add Prescription Medication</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMedSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Medication Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Metformin 500mg, Atorvastatin"
                    className="form-input"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Dosage & Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 1 tablet • With Dinner"
                    className="form-input"
                    value={newMedDose}
                    onChange={(e) => setNewMedDose(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Schedule Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 08:30 PM"
                    className="form-input"
                    value={newMedTime}
                    onChange={(e) => setNewMedTime(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
