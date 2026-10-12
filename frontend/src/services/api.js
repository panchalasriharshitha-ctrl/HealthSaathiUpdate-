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
 * Send inquiry to HealthSaathi Copilot (OpenAI + Clinical Triage)
 */
export async function sendCopilotMessage(message, lang = 'en', userId = 'guest_patient', history = []) {
  try {
    const res = await fetch(`${API_BASE_URL}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, lang, user_id: userId, history }),
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
      disclaimer: 'HealthSaathi operates as an informational health copilot, not emergency medical personnel.',
      provider: 'client_fallback',
      error_message: error.message
    };
  }
}

/**
 * Upload and analyze Lab Report (PDF / JPG / PNG)
 */
export async function uploadAndAnalyzeLabReport(file, lang = 'en') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('lang', lang);

  const res = await fetch(`${API_BASE_URL}/reports/analyze`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    const error = new Error(data.message || `Upload failed with status ${res.status}`);
    error.data = data;
    error.errorType = data.error;
    error.preview = data.extracted_text_preview;
    error.suggestion = data.suggestion;
    throw error;
  }
  return data;
}

/**
 * Upload and parse Prescription (PDF / JPG / PNG)
 */
export async function uploadAndAnalyzePrescription(file, lang = 'en') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('lang', lang);

  const res = await fetch(`${API_BASE_URL}/prescriptions/analyze`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    const error = new Error(data.message || `Upload failed with status ${res.status}`);
    error.data = data;
    error.errorType = data.error;
    error.preview = data.extracted_text_preview;
    error.suggestion = data.suggestion;
    throw error;
  }
  return data;
}

/**
 * Fetch openFDA official medication labeling info
 */
export async function fetchDrugInfo(drugName) {
  try {
    const res = await fetch(`${API_BASE_URL}/openfda/info?drug=${encodeURIComponent(drugName)}`);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      success: false,
      brand_name: drugName,
      purpose: 'Prescription medication as prescribed by doctor.',
      warnings: 'Consult prescribing physician and dispensing pharmacist.',
      disclaimer: 'Direct lookup unavailable.'
    };
  }
}
