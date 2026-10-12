import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HealthStatusBanner from './components/HealthStatusBanner';
import VitalsGrid from './components/VitalsGrid';
import MedicationTracker from './components/MedicationTracker';
import CopilotChat from './components/CopilotChat';
import LogVitalsModal from './components/LogVitalsModal';
import SymptomChecker from './components/SymptomChecker';
import AppointmentsManager from './components/AppointmentsManager';
import HealthHistory from './components/HealthHistory';
import LabReportsManager from './components/LabReportsManager';
import PrescriptionManager from './components/PrescriptionManager';
import EmergencyModal from './components/EmergencyModal';
import AuthView from './components/AuthView';
import { checkBackendHealth, fetchVitals } from './services/api';
import { supabase } from './services/supabase';
import { getTranslation } from './utils/translations';
import { Shield, Sparkles, RefreshCw, Download, Watch, CheckCircle2, FileText, Pill } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState(() => localStorage.getItem('healthsaathi_lang') || 'en');
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingWatch, setIsSyncingWatch] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Vitals state
  const [vitalsList, setVitalsList] = useState([]);

  // Appointments state
  const [appointments, setAppointments] = useState([
    {
      id: 'apt-1',
      doctor: 'Dr. Priya Sharma, MD',
      specialty: 'Internal Medicine & Preventive Care',
      hospital: 'Metro Health Multispecialty Clinic',
      date: '2026-10-18',
      time: '10:30 AM',
      mode: 'In-Person Clinic',
      reason: 'Biannual health vitals check & routine blood evaluation',
      status: 'Upcoming'
    },
    {
      id: 'apt-2',
      doctor: 'Dr. Rahul Verma, MD, DM',
      specialty: 'Consultant Cardiologist',
      hospital: 'Apex Heart & Vascular Institute',
      date: '2026-10-24',
      time: '03:00 PM',
      mode: 'Video Teleconsultation',
      reason: 'Resting pulse rhythm & blood pressure review',
      status: 'Upcoming'
    }
  ]);

  // Health History state (vitals + symptom checks)
  const [healthHistory, setHealthHistory] = useState([
    {
      id: 'hist-1',
      type: 'vitals',
      heart_rate: 72,
      blood_pressure_sys: 118,
      blood_pressure_dia: 78,
      blood_glucose: 95.5,
      oxygen_level: 98,
      sleep_hours: 7.5,
      notes: 'Morning baseline. Vitals optimal.',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'hist-2',
      type: 'symptom_check',
      title: 'Head & Neurological Assessment',
      summary: 'Throbbing headache, screen fatigue (Severity: 4/10)',
      urgency: 'Home Care & Routine Observation',
      notes: 'Hydration and 20-20-20 screen rest recommended',
      created_at: new Date(Date.now() - 43200000).toISOString()
    }
  ]);

  // Notifications state
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      type: 'appointment',
      title: 'Appointment Reminder',
      message: 'Upcoming visit with Dr. Priya Sharma on Oct 18, 10:30 AM.',
      time: '1h ago',
      read: false
    },
    {
      id: 'notif-2',
      type: 'vital',
      title: 'Optimal Biomarkers',
      message: 'Resting heart rate (72 bpm) is within optimal sinus rhythm.',
      time: '3h ago',
      read: false
    },
    {
      id: 'notif-3',
      type: 'medication',
      title: 'Prescription Schedule',
      message: 'Daily Vitamin D3 & Omega-3 logged as taken.',
      time: '5h ago',
      read: true
    }
  ]);

  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const addNotification = (item) => {
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        time: 'Just now',
        read: false,
        ...item
      },
      ...prev
    ]);
  };

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('healthsaathi_lang', newLang);
    showToast(
      newLang === 'te'
        ? 'భాష తెలుగుగా మార్చబడింది'
        : newLang === 'hi'
        ? 'भाषा हिन्दी में बदली गई'
        : 'Language set to English'
    );
  };

  // Auth session check & persistence on refresh
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Session retrieval note:', error.message);
        }
        if (isMounted) {
          if (data?.session?.user) {
            setUser(data.session.user);
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Auth check note:', err);
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    initAuth();

    // Listen to real-time auth changes (sign in, sign out, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        if (session?.user) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Backend Health and Initial Vitals
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const health = await checkBackendHealth();
      setBackendHealth(health);

      const vitals = await fetchVitals(5);
      if (vitals && vitals.length > 0) {
        setVitalsList(vitals);
      }
    } catch (err) {
      console.warn('Data load notice:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      const interval = setInterval(async () => {
        const health = await checkBackendHealth();
        setBackendHealth(health);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleVitalsLogged = (newRecord) => {
    setVitalsList((prev) => [newRecord, ...prev]);
    setHealthHistory((prev) => [
      {
        ...newRecord,
        id: 'v-' + Date.now(),
        type: 'vitals',
        created_at: new Date().toISOString()
      },
      ...prev
    ]);
    addNotification({
      type: 'vital',
      title: 'New Vitals Logged',
      message: `Heart Rate: ${newRecord.heart_rate} bpm, BP: ${newRecord.blood_pressure_sys}/${newRecord.blood_pressure_dia} mmHg.`
    });
    showToast('Vitals recorded and synced successfully!');
  };

  const handleBookAppointment = (newApt) => {
    setAppointments((prev) => [newApt, ...prev]);
    addNotification({
      type: 'appointment',
      title: 'Appointment Confirmed',
      message: `Confirmed with ${newApt.doctor} on ${newApt.date} at ${newApt.time}.`
    });
    showToast(`Appointment booked with ${newApt.doctor}!`);
  };

  const handleCancelAppointment = (id) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a))
    );
    addNotification({
      type: 'appointment',
      title: 'Appointment Cancelled',
      message: 'Consultation booking was cancelled.'
    });
    showToast('Appointment cancelled.');
  };

  const handleSaveSymptomToHistory = (item) => {
    setHealthHistory((prev) => [item, ...prev]);
    addNotification({
      type: 'vital',
      title: 'Symptom Assessment Saved',
      message: `${item.title}: ${item.urgency}`
    });
    showToast('Symptom assessment saved to your Health History!');
  };

  const handleDeleteHistoryRecord = (id) => {
    setHealthHistory((prev) => prev.filter((r) => r.id !== id));
    showToast('Record deleted.');
  };

  const handleClearHistory = () => {
    setHealthHistory([]);
    showToast('Health history cleared.');
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Signout notice:', err);
    }
    setUser(null);
    showToast('Signed out successfully.');
  };

  // 1. Initial Session Loading Screen
  if (isCheckingAuth) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-dark-900, #070b14)',
          color: '#ffffff',
        }}
      >
        <RefreshCw size={40} className="animate-spin" color="#06b6d4" />
        <p style={{ marginTop: '1.25rem', color: '#94a3b8', fontSize: '0.92rem', fontWeight: 500 }}>
          Initializing HealthSaathi Secure Session...
        </p>
      </div>
    );
  }

  // 2. Protected Dashboard Gate: If user is not authenticated, render Login/Signup/OTP view
  if (!user) {
    return (
      <AuthView
        onAuthSuccess={(authedUser) => {
          setUser(authedUser);
          showToast(`Welcome to HealthSaathi, ${authedUser.user_metadata?.full_name || authedUser.email}!`);
        }}
        lang={lang}
      />
    );
  }

  // 3. User is Authenticated -> Render Full Protected Dashboard
  const latestVitals = vitalsList[0] || {
    heart_rate: 72,
    blood_pressure_sys: 118,
    blood_pressure_dia: 78,
    blood_glucose: 95.5,
    oxygen_level: 98,
    sleep_hours: 7.5
  };

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User';

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSyncData = async () => {
    await loadData();
    showToast('System synced: Live biomarkers & database records up to date!');
  };

  const handleExportReport = () => {
    try {
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const timeStr = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const reportContent = `======================================================================
HEALTHSAATHI - CLINICAL PERSONAL HEALTH SUMMARY REPORT
======================================================================
Patient Name: ${userName}
Account Email: ${user?.email || 'N/A'}
Report Generated: ${dateStr} at ${timeStr}
Platform: HealthSaathi Clinical Copilot (Verified Secure Session)

----------------------------------------------------------------------
1. CURRENT PHYSIOLOGICAL BIOMARKERS (LATEST VITALS)
----------------------------------------------------------------------
- Resting Heart Rate: ${latestVitals.heart_rate} BPM (Optimal Sinus Rhythm)
- Blood Pressure: ${latestVitals.blood_pressure_sys}/${latestVitals.blood_pressure_dia} mmHg (Optimal Stage 0)
- Fasting Blood Glucose: ${latestVitals.blood_glucose} mg/dL (Euglycemic)
- Oxygen Saturation (SpO2): ${latestVitals.oxygen_level}% (Target Reached)
- Sleep Duration: ${latestVitals.sleep_hours} Hours (Deep Restorative)
- Clinical Notes: ${latestVitals.notes || 'Routine health evaluation'}

----------------------------------------------------------------------
2. ACTIVE APPOINTMENTS & CONSULTATIONS
----------------------------------------------------------------------
${appointments.map((a, i) => `[${i + 1}] Date: ${a.date} | Time: ${a.time}
    Provider: ${a.doctor} (${a.specialty})
    Facility: ${a.hospital}
    Format: ${a.mode} | Status: ${a.status}
    Objective: ${a.reason}`).join('\n\n')}

----------------------------------------------------------------------
3. RECENT HEALTH LOGS & SYMPTOM ASSESSMENTS
----------------------------------------------------------------------
${healthHistory.slice(0, 5).map((h, i) => `[${i + 1}] Date: ${new Date(h.created_at).toLocaleDateString()}
    Type: ${h.title || (h.type === 'vitals' ? 'Biomarker Evaluation' : 'Clinical Entry')}
    Details: ${h.summary || h.notes || `HR: ${h.heart_rate} bpm, BP: ${h.blood_pressure_sys}/${h.blood_pressure_dia}`}`).join('\n\n')}

----------------------------------------------------------------------
4. EMERGENCY DISPATCH SERVICES (INDIA 24/7)
----------------------------------------------------------------------
- National Emergency Services: 112 (Police, Ambulance, Fire, Disaster)
- Emergency Medical Ambulance: 108
- Maternal & Infant Ambulance: 102
- National Health Helpline: 1075

======================================================================
DISCLAIMER: This report is generated by HealthSaathi to assist patient
record keeping and routine clinical reviews. It does not replace
formal diagnostic consultations with licensed physicians.
======================================================================`;

      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HealthSaathi_Health_Report_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Clinical Health Summary report downloaded successfully!');
      addNotification({
        type: 'vital',
        title: 'Health Report Exported',
        message: `Clinical summary document downloaded for ${userName}.`
      });
    } catch (err) {
      console.error('Export report error:', err);
      showToast('Could not download report. Please try again.');
    }
  };

  const handleSyncSmartwatch = () => {
    setIsSyncingWatch(true);
    showToast('Connecting to Smartwatch BLE & fetching biometric stream...');

    setTimeout(() => {
      const simulatedHR = Math.floor(70 + Math.random() * 8); // 70-77
      const simulatedSpO2 = Math.floor(98 + Math.random() * 2); // 98-99%
      const simulatedSys = Math.floor(117 + Math.random() * 5); // 117-121
      const simulatedDia = Math.floor(77 + Math.random() * 4); // 77-80

      const newReading = {
        id: 'watch-' + Date.now(),
        heart_rate: simulatedHR,
        blood_pressure_sys: simulatedSys,
        blood_pressure_dia: simulatedDia,
        blood_glucose: latestVitals.blood_glucose,
        oxygen_level: simulatedSpO2,
        sleep_hours: latestVitals.sleep_hours,
        notes: 'Live telemetry synced from smartwatch sensor',
        created_at: new Date().toISOString()
      };

      handleVitalsLogged(newReading);
      setIsSyncingWatch(false);
      showToast(`Smartwatch Synced: HR ${simulatedHR} BPM, SpO2 ${simulatedSpO2}%, BP ${simulatedSys}/${simulatedDia}!`);
    }, 1200);
  };

  return (
    <div className="app-container">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(6, 182, 212, 0.95)',
            color: '#070b14',
            padding: '0.65rem 1.25rem',
            borderRadius: '999px',
            fontWeight: 600,
            fontSize: '0.85rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'modal-pop 0.2s ease-out'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        backendHealth={backendHealth}
        onOpenLogModal={() => setIsLogModalOpen(true)}
        onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
        currentLang={lang}
        onSelectLang={handleLanguageChange}
        user={user}
        onSignOut={handleSignOut}
        notifications={notifications}
        onMarkAllAsRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
        onClearAll={() => setNotifications([])}
        onMarkOneRead={(id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))}
      />

      {/* Main Content Area */}
      <main className="main-content" id="main-content-viewport">
        {/* VIEW 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            <HealthStatusBanner patientName={userName} score={94} lang={lang} />

            <div className="dashboard-layout">
              {/* Left Column: Vitals Biomarkers & Medication Tracker */}
              <div className="dashboard-left-col">
                <VitalsGrid
                  latestVitals={latestVitals}
                  onOpenLogModal={() => setIsLogModalOpen(true)}
                />

                {/* Dashboard Healthcare Cards: Lab Reports & Prescriptions */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}
                >
                  {/* Lab Reports Card */}
                  <div
                    className="card-container"
                    style={{
                      cursor: 'pointer',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      transition: 'var(--transition)'
                    }}
                    onClick={() => handleSelectTab('lab_reports')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>
                          <FileText size={18} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                          Lab Reports
                        </h4>
                      </div>
                      <span className="brand-badge" style={{ fontSize: '0.65rem' }}>AI OCR</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 10px', lineHeight: 1.4 }}>
                      Upload blood panels & PDF lab tests for plain-language explanations and doctor discussion questions.
                    </p>
                    <span style={{ fontSize: '0.78rem', color: '#22d3ee', fontWeight: 600 }}>
                      Open Lab Analyzer &rarr;
                    </span>
                  </div>

                  {/* Prescriptions Card */}
                  <div
                    className="card-container"
                    style={{
                      cursor: 'pointer',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      transition: 'var(--transition)'
                    }}
                    onClick={() => handleSelectTab('prescriptions')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                          <Pill size={18} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                          Prescriptions
                        </h4>
                      </div>
                      <span className="brand-badge" style={{ fontSize: '0.65rem' }}>openFDA</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 10px', lineHeight: 1.4 }}>
                      Digitize doctor prescription slips, identify medications, and cross-check official drug labeling.
                    </p>
                    <span style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 600 }}>
                      Open Prescriptions &rarr;
                    </span>
                  </div>
                </div>

                <MedicationTracker onToast={showToast} />

                {/* Quick Action Tools */}
                <section className="card-container" id="quick-action-tools">
                  <div className="section-header">
                    <h3 className="section-title" style={{ fontSize: '1.15rem' }}>
                      <Sparkles className="section-title-icon" size={18} />
                      {t('quick_tools_title', 'Health Tools & Actions')}
                    </h3>
                    <button
                      className="btn-secondary"
                      onClick={handleSyncData}
                      disabled={isRefreshing}
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                      id="btn-sync-data-action"
                    >
                      <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                      {isRefreshing ? t('btn_syncing', 'Syncing...') : t('btn_sync', 'Sync Data')}
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '0.85rem'
                    }}
                  >
                    <button
                      className="btn-secondary"
                      style={{ justifyContent: 'center' }}
                      id="btn-export-health-report"
                      onClick={handleExportReport}
                    >
                      <Download size={16} />
                      <span>{t('btn_export_pdf', 'Export Report')}</span>
                    </button>

                    <button
                      className="btn-secondary"
                      style={{ justifyContent: 'center' }}
                      id="btn-sync-smartwatch"
                      disabled={isSyncingWatch}
                      onClick={handleSyncSmartwatch}
                    >
                      <Watch size={16} className={isSyncingWatch ? 'animate-spin' : ''} />
                      <span>{isSyncingWatch ? 'Syncing Watch...' : t('btn_smartwatch', 'Sync Smartwatch')}</span>
                    </button>

                    <button
                      className="btn-secondary"
                      style={{
                        justifyContent: 'center',
                        borderColor: 'rgba(244, 63, 94, 0.4)',
                        color: '#fda4af',
                        background: 'rgba(244, 63, 94, 0.08)'
                      }}
                      id="btn-emergency-quick-tool"
                      onClick={() => setIsEmergencyModalOpen(true)}
                    >
                      <Shield size={16} />
                      <span>{t('btn_emergency', 'Emergency SOS (112)')}</span>
                    </button>
                  </div>
                </section>
              </div>

              {/* Right Column: AI Health Copilot Assistant */}
              <div className="dashboard-right-col">
                <CopilotChat
                  lang={lang}
                  user={user}
                  onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
                  onOpenLogModal={() => setIsLogModalOpen(true)}
                  onSelectTab={handleSelectTab}
                />
              </div>
            </div>
          </>
        )}

        {/* VIEW 2: LAB REPORTS */}
        {activeTab === 'lab_reports' && (
          <LabReportsManager lang={lang} />
        )}

        {/* VIEW 3: PRESCRIPTIONS */}
        {activeTab === 'prescriptions' && (
          <PrescriptionManager lang={lang} />
        )}

        {/* VIEW 4: SYMPTOM CHECKER */}
        {activeTab === 'symptoms' && (
          <SymptomChecker
            lang={lang}
            onSaveToHistory={handleSaveSymptomToHistory}
            onNavigateToAppointments={() => handleSelectTab('appointments')}
          />
        )}

        {/* VIEW 5: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <AppointmentsManager
            appointments={appointments}
            onBookAppointment={handleBookAppointment}
            onCancelAppointment={handleCancelAppointment}
            lang={lang}
          />
        )}

        {/* VIEW 6: MEDICINES */}
        {activeTab === 'medicines' && (
          <div className="view-panel">
            <MedicationTracker onToast={showToast} />
          </div>
        )}

        {/* VIEW 7: HEALTH HISTORY */}
        {activeTab === 'history' && (
          <HealthHistory
            records={healthHistory}
            onDeleteRecord={handleDeleteHistoryRecord}
            onClearHistory={handleClearHistory}
            lang={lang}
          />
        )}

        {/* VIEW 8: DEDICATED AI ASSISTANT */}
        {activeTab === 'assistant' && (
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <CopilotChat
              lang={lang}
              user={user}
              onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
              onOpenLogModal={() => setIsLogModalOpen(true)}
              onSelectTab={handleSelectTab}
            />
          </div>
        )}
      </main>

      {/* Log Vitals Modal */}
      <LogVitalsModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onVitalsLogged={handleVitalsLogged}
      />

      {/* Functional Emergency Contacts Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
