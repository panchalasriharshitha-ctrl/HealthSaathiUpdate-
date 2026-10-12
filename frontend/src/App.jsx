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
import AuthModal from './components/AuthModal';
import { checkBackendHealth, fetchVitals } from './services/api';
import { supabase } from './services/supabase';
import { getTranslation } from './utils/translations';
import { Shield, Sparkles, RefreshCw, Download, Watch, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState(() => localStorage.getItem('healthsaathi_lang') || 'en');
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    setTimeout(() => setToastMessage(''), 3000);
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

  // Auth session check
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setUser(data.session.user);
        } else {
          // Check local guest demo user
          const demo = localStorage.getItem('healthsaathi_demo_user');
          if (demo) setUser(JSON.parse(demo));
        }
      } catch (err) {
        console.warn('Auth session check notice:', err);
      }
    };
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
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
    loadData();
    const interval = setInterval(async () => {
      const health = await checkBackendHealth();
      setBackendHealth(health);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

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
    await supabase.auth.signOut();
    localStorage.removeItem('healthsaathi_demo_user');
    setUser(null);
    showToast('Signed out successfully.');
  };

  const latestVitals = vitalsList[0] || {
    heart_rate: 72,
    blood_pressure_sys: 118,
    blood_pressure_dia: 78,
    blood_glucose: 95.5,
    oxygen_level: 98,
    sleep_hours: 7.5
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="app-container">
      {/* Toast Banner */}
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
        onSelectTab={setActiveTab}
        backendHealth={backendHealth}
        onOpenLogModal={() => setIsLogModalOpen(true)}
        currentLang={lang}
        onSelectLang={handleLanguageChange}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
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

                <MedicationTracker />

                {/* Quick Action Tools */}
                <section className="card-container" id="quick-action-tools">
                  <div className="section-header">
                    <h3 className="section-title" style={{ fontSize: '1.15rem' }}>
                      <Sparkles className="section-title-icon" size={18} />
                      {t('quick_tools_title', 'Health Tools & Actions')}
                    </h3>
                    <button
                      className="btn-secondary"
                      onClick={loadData}
                      disabled={isRefreshing}
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
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
                      onClick={() => showToast(`Generating Clinical Health Summary PDF for ${userName}...`)}
                    >
                      <Download size={16} />
                      <span>{t('btn_export_pdf', 'Export Report')}</span>
                    </button>

                    <button
                      className="btn-secondary"
                      style={{ justifyContent: 'center' }}
                      onClick={() => showToast('Smartwatch sync complete: Heart rate & SpO2 live stream updated!')}
                    >
                      <Watch size={16} />
                      <span>{t('btn_smartwatch', 'Sync Smartwatch')}</span>
                    </button>

                    <button
                      className="btn-secondary"
                      style={{
                        justifyContent: 'center',
                        borderColor: 'rgba(244, 63, 94, 0.4)',
                        color: '#fda4af'
                      }}
                      onClick={() =>
                        alert(
                          'EMERGENCY SOS DISPATCHED: Ready to contact local emergency response (112 / 108 / 911) and share real-time GPS & vital signs telemetry with your emergency contacts.'
                        )
                      }
                    >
                      <Shield size={16} />
                      <span>{t('btn_emergency', 'Emergency SOS (112)')}</span>
                    </button>
                  </div>
                </section>
              </div>

              {/* Right Column: AI Health Copilot Assistant */}
              <div className="dashboard-right-col">
                <CopilotChat lang={lang} user={user} />
              </div>
            </div>
          </>
        )}

        {/* VIEW 2: SYMPTOM CHECKER */}
        {activeTab === 'symptoms' && (
          <SymptomChecker
            lang={lang}
            onSaveToHistory={handleSaveSymptomToHistory}
            onNavigateToAppointments={() => setActiveTab('appointments')}
          />
        )}

        {/* VIEW 3: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <AppointmentsManager
            appointments={appointments}
            onBookAppointment={handleBookAppointment}
            onCancelAppointment={handleCancelAppointment}
            lang={lang}
          />
        )}

        {/* VIEW 4: MEDICINES */}
        {activeTab === 'medicines' && (
          <div className="view-panel">
            <MedicationTracker />
          </div>
        )}

        {/* VIEW 5: HEALTH HISTORY */}
        {activeTab === 'history' && (
          <HealthHistory
            records={healthHistory}
            onDeleteRecord={handleDeleteHistoryRecord}
            onClearHistory={handleClearHistory}
            lang={lang}
          />
        )}

        {/* VIEW 6: DEDICATED AI ASSISTANT */}
        {activeTab === 'assistant' && (
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <CopilotChat lang={lang} user={user} />
          </div>
        )}
      </main>

      {/* Modals */}
      <LogVitalsModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onVitalsLogged={handleVitalsLogged}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(authedUser) => {
          setUser(authedUser);
          showToast(`Welcome, ${authedUser.user_metadata?.name || 'User'}!`);
        }}
        lang={lang}
      />
    </div>
  );
}
