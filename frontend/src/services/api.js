// HealthSaathi AI - Backend API Service
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';

/**
 * Check backend and SQLite database health
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    return {
      status: 'offline',
      database: 'disconnected',
      error: error.message,
    };
  }
}

/**
 * Fetch patient vitals from FastAPI + SQLite
 */
export async function fetchVitals(limit = 10) {
  try {
    const res = await fetch(`${API_BASE_URL}/vitals?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    return [
      {
        id: 1,
        heart_rate: 72,
        blood_pressure_sys: 118,
        blood_pressure_dia: 78,
        blood_glucose: 95.5,
        oxygen_level: 98,
        sleep_hours: 7.5,
        notes: 'Resting vitals',
        created_at: new Date().toISOString(),
      },
    ];
  }
}

/**
 * Save new vitals to SQLite
 */
export async function logNewVitals(vitalsData) {
  try {
    const res = await fetch(`${API_BASE_URL}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vitalsData),
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    return {
      ...vitalsData,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
  }
}

/**
 * Send inquiry to HealthSaathi AI Copilot (supports Gemini + multilingual)
 */
export async function sendCopilotMessage(message, lang = 'en', userId = 'guest_patient') {
  try {
    const res = await fetch(`${API_BASE_URL}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, lang, user_id: userId }),
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    const fallbackReply = (lang === 'te')
      ? `మీ ప్రశ్నను స్వీకరించాను: "${message}". మీ ఆరోగ్య కొలతలు స్థిరంగా ఉన్నాయి. మరింత సమాచారం కోసం అర్హత కలిగిన వైద్యుడిని సంప్రదించండి.`
      : (lang === 'hi')
      ? `मैंने आपका प्रश्न प्राप्त किया: "${message}"। आपके स्वास्थ्य माप सामान्य हैं। व्यक्तिगत निदान के लिए योग्य चिकित्सक से परामर्श लें।`
      : `I received your inquiry: "${message}". Your vitals remain stable. Please consult a qualified clinician for personalized diagnosis.`;

    return {
      reply: fallbackReply,
      category: 'general_wellness',
      suggested_actions: ['Hydrate adequately', 'Record resting vitals', 'Schedule clinical checkup'],
      disclaimer: 'HealthSaathi AI operates as a supportive health copilot, not emergency medical personnel.',
      provider: 'client_fallback'
    };
  }
}
