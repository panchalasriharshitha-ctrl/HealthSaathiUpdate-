import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  XCircle,
  AlertCircle,
  Plus,
  Stethoscope
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

const VERIFIED_DOCTORS = [
  {
    id: 'doc-1',
    name: 'Dr. Priya Sharma, MD',
    specialty: 'Internal Medicine & Preventive Care',
    hospital: 'Metro Health Multispecialty Clinic',
    experience: '12 years exp',
    avatar: 'PS',
    availableSlots: ['09:30 AM', '11:00 AM', '02:30 PM', '04:30 PM']
  },
  {
    id: 'doc-2',
    name: 'Dr. Rahul Verma, MD, DM',
    specialty: 'Consultant Cardiologist',
    hospital: 'Apex Heart & Vascular Institute',
    experience: '16 years exp',
    avatar: 'RV',
    availableSlots: ['10:00 AM', '12:30 PM', '03:00 PM', '05:00 PM']
  },
  {
    id: 'doc-3',
    name: 'Dr. Ananya Iyer, MD',
    specialty: 'Neurology & Headache Specialist',
    hospital: 'Care Neuroscience Centre',
    experience: '9 years exp',
    avatar: 'AI',
    availableSlots: ['10:30 AM', '01:00 PM', '03:30 PM']
  },
  {
    id: 'doc-4',
    name: 'Dr. Rajesh Kulkarni, MD',
    specialty: 'Endocrinologist (Diabetes & Thyroid)',
    hospital: 'Horizon Endocrine Centre',
    experience: '14 years exp',
    avatar: 'RK',
    availableSlots: ['11:30 AM', '02:00 PM', '04:00 PM', '06:00 PM']
  }
];

export default function AppointmentsManager({
  appointments,
  onBookAppointment,
  onCancelAppointment,
  lang = 'en'
}) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(VERIFIED_DOCTORS[0].id);
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState(VERIFIED_DOCTORS[0].availableSlots[0]);
  const [mode, setMode] = useState('in_person');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const selectedDoctor = VERIFIED_DOCTORS.find((d) => d.id === selectedDoctorId) || VERIFIED_DOCTORS[0];

  const handleDoctorChange = (docId) => {
    setSelectedDoctorId(docId);
    const doc = VERIFIED_DOCTORS.find((d) => d.id === docId);
    if (doc && doc.availableSlots.length > 0) {
      setSelectedSlot(doc.availableSlots[0]);
    }
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedDate) {
      setErrorMsg('Please select a valid consultation date.');
      return;
    }

    const newAppointment = {
      id: 'apt-' + Date.now(),
      doctor: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      hospital: selectedDoctor.hospital,
      date: selectedDate,
      time: selectedSlot,
      mode: mode === 'in_person' ? 'In-Person Clinic' : 'Video Teleconsultation',
      reason: reason.trim() || 'General Health Consultation',
      status: 'Upcoming',
      created_at: new Date().toISOString()
    };

    onBookAppointment && onBookAppointment(newAppointment);
    setIsBookingOpen(false);
    setReason('');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="view-panel" id="appointments-manager-panel">
      <div className="view-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>
            <Calendar size={28} color="#06b6d4" />
            <span>{t('appointments_title', 'Doctor Appointments')}</span>
          </h2>
          <p>{t('appointments_subtitle', 'Schedule consultations with verified medical professionals.')}</p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setIsBookingOpen(!isBookingOpen)}
          id="btn-open-book-modal"
        >
          <Plus size={16} />
          <span>{t('btn_book_appt', 'Book New Appointment')}</span>
        </button>
      </div>

      {/* Booking Form Card */}
      {isBookingOpen && (
        <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--cyan-glow)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.15rem' }}>
            Schedule Consultation with Verified Specialist
          </h3>

          {errorMsg && (
            <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleBookingSubmit}>
            {/* Doctor Selection */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>{t('doctor_label', 'Select Specialist:')}</label>
              <div className="option-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                {VERIFIED_DOCTORS.map((doc) => (
                  <div
                    key={doc.id}
                    className={`option-card ${selectedDoctorId === doc.id ? 'selected' : ''}`}
                    onClick={() => handleDoctorChange(doc.id)}
                  >
                    <div className="profile-avatar" style={{ flexShrink: 0 }}>{doc.avatar}</div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.88rem', color: 'white' }}>{doc.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'block' }}>{doc.specialty}</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{doc.hospital}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date, Time & Mode */}
            <div className="form-row" style={{ marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label htmlFor="appointment-date">{t('date_label', 'Consultation Date')}</label>
                <input
                  id="appointment-date"
                  type="date"
                  min={todayStr}
                  required
                  className="form-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="appointment-time">{t('time_label', 'Available Slot')}</label>
                <select
                  id="appointment-time"
                  className="form-input"
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                >
                  {selectedDoctor.availableSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label>{t('mode_label', 'Consultation Mode')}</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'white', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="consultation_mode"
                      value="in_person"
                      checked={mode === 'in_person'}
                      onChange={() => setMode('in_person')}
                    />
                    <MapPin size={15} color="#10b981" />
                    <span>{t('mode_inperson', 'In-Person Clinic')}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'white', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="consultation_mode"
                      value="video"
                      checked={mode === 'video'}
                      onChange={() => setMode('video')}
                    />
                    <Video size={15} color="#06b6d4" />
                    <span>{t('mode_video', 'Video Teleconsultation')}</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="appointment-reason">Chief Complaint / Reason for Visit</label>
                <input
                  id="appointment-reason"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Follow-up on blood pressure and headache assessment"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn-primary">
                Confirm & Book Appointment
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsBookingOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {appointments.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
            <Calendar size={42} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h4>No appointments scheduled</h4>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Click "Book New Appointment" to select a verified doctor and reserve a time slot.
            </p>
          </div>
        ) : (
          appointments.map((apt) => {
            const isCancelled = apt.status === 'Cancelled';
            return (
              <div
                key={apt.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  opacity: isCancelled ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: 'var(--radius-md)',
                      background: isCancelled ? 'rgba(255,255,255,0.05)' : 'rgba(6, 182, 212, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCancelled ? '#64748b' : '#38bdf8'
                    }}
                  >
                    <Stethoscope size={22} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.98rem', color: 'white' }}>{apt.doctor}</strong>
                      <span
                        className="status-pill"
                        style={{
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          background: isCancelled ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          borderColor: isCancelled ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                          color: isCancelled ? '#fda4af' : '#6ee7b7'
                        }}
                      >
                        {apt.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '2px' }}>
                      {apt.specialty} • {apt.hospital}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> {apt.date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {apt.time}
                      </span>
                      <span>• {apt.mode}</span>
                    </div>
                  </div>
                </div>

                {!isCancelled && (
                  <div>
                    <button
                      className="btn-danger-outline"
                      onClick={() => onCancelAppointment && onCancelAppointment(apt.id)}
                    >
                      <XCircle size={14} />
                      <span>{t('btn_cancel_appt', 'Cancel Appointment')}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
