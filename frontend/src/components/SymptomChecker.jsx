import React, { useState } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Calendar,
  Save,
  RotateCcw,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

const BODY_CATEGORIES = [
  {
    id: 'head',
    name: 'Head & Neurological',
    name_te: 'తలనొప్పి & నరాల సంబంధిత',
    name_hi: 'सिरदर्द और तंत्रिका संबंधी',
    icon: '🧠',
    symptoms: ['Throbbing headache', 'Dizziness / Lightheadedness', 'Vision blurring', 'Sensitivity to light']
  },
  {
    id: 'chest',
    name: 'Chest & Respiratory',
    name_te: 'ఛాతీ & శ్వాస సంబంధిత',
    name_hi: 'छाती और श्वसन संबंधी',
    icon: '🫁',
    symptoms: ['Shortness of breath', 'Dry or persistent cough', 'Chest tightness or discomfort', 'Wheezing']
  },
  {
    id: 'digestive',
    name: 'Digestive & Abdominal',
    name_te: 'జీర్ణకోశ & కడుపు సంబంధిత',
    name_hi: 'पाचन और पेट संबंधी',
    icon: '🍎',
    symptoms: ['Nausea or vomiting', 'Abdominal cramps', 'Acid reflux / Heartburn', 'Loss of appetite']
  },
  {
    id: 'musculoskeletal',
    name: 'Muscles & Joints',
    name_te: 'కండరాలు & కీళ్ల నొప్పులు',
    name_hi: 'मांसपेशियां और जोड़',
    icon: '🦴',
    symptoms: ['Joint swelling / stiffness', 'Lower back pain', 'Muscle fatigue', 'Neck strain']
  },
  {
    id: 'general',
    name: 'General Wellness & Fever',
    name_te: 'సాధారణ అస్వస్థత & జ్వరం',
    name_hi: 'सामान्य अस्वस्थता और बुखार',
    icon: '🌡️',
    symptoms: ['Elevated temperature (>100°F)', 'Chills or shivering', 'Extreme lethargy', 'Dehydration']
  }
];

export default function SymptomChecker({
  lang = 'en',
  onSaveToHistory,
  onNavigateToAppointments
}) {
  const [selectedCategory, setSelectedCategory] = useState(BODY_CATEGORIES[0].id);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severity, setSeverity] = useState(4);
  const [duration, setDuration] = useState('1-3 days');
  const [hasRedFlags, setHasRedFlags] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [result, setResult] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const activeCategory = BODY_CATEGORIES.find((c) => c.id === selectedCategory) || BODY_CATEGORIES[0];

  const toggleSymptom = (sym) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleAssess = (e) => {
    e.preventDefault();
    setIsSaved(false);

    const isEmergency = hasRedFlags || severity >= 9;
    const isUrgent = severity >= 7 && !isEmergency;

    let urgencyLevel = 'Routine Consultation';
    let urgencyColor = '#38bdf8';
    let guidance = '';
    let prepQuestions = [];

    if (isEmergency) {
      urgencyLevel = 'Urgent / Emergency Care';
      urgencyColor = '#f43f5e';
      guidance = (lang === 'te')
        ? 'తీవ్రమైన లక్షణాలు లేదా ఎరుపు హెచ్చరికలు గుర్తించబడ్డాయి. దయచేసి వెంటనే సమీప అత్యవసర ఆసుపత్రిని సంప్రదించండి లేదా 112/108 కు కాల్ చేయండి.'
        : (lang === 'hi')
        ? 'गंभीर लक्षण अथवा आपातकालीन संकेत पाए गए हैं। कृपया तुरंत नजदीकी अस्पताल के आपातकालीन विभाग में जाएं या 112/108 पर संपर्क करें।'
        : 'Emergency red-flag indicators detected. Please seek immediate evaluation at an Emergency Department or dial 112 / 108 / 911.';
      prepQuestions = [
        'When exactly did the acute symptoms begin?',
        'Are there any previous cardiovascular or pulmonary conditions?',
        'What current prescription medications are being taken?'
      ];
    } else if (isUrgent) {
      urgencyLevel = 'Prompt Clinic Visit (within 24 hours)';
      urgencyColor = '#f59e0b';
      guidance = (lang === 'te')
        ? 'లక్షణాలు అధికంగా ఉన్నాయి. రాబోయే 24 గంటల్లో అర్హత కలిగిన వైద్యుడిని కలవాలని సూచించబడింది.'
        : (lang === 'hi')
        ? 'लक्षण मध्यम से तीव्र हैं। अगले 24 घंटों में डॉक्टर से परामर्श लेने की सलाह दी जाती है।'
        : 'Symptoms are moderately high. We recommend scheduling a formal evaluation with a clinician within 24 hours.';
      prepQuestions = [
        'Has any over-the-counter medicine provided temporary relief?',
        'Have symptoms progressively worsened with physical activity?'
      ];
    } else {
      urgencyLevel = 'Home Care & Routine Observation';
      urgencyColor = '#10b981';
      guidance = (lang === 'te')
        ? 'లక్షణాలు స్వల్పంగా ఉన్నాయి. విశ్రాంతి తీసుకోండి, పుష్కలంగా నీరు త్రాగండి మరియు లక్షణాలు కొనసాగితే వైద్యుడిని సంప్రదించండి.'
        : (lang === 'hi')
        ? 'लक्षण हल्के प्रतीत होते हैं। पर्याप्त विश्राम लें, पानी पीते रहें और यदि समस्या बनी रहे तो चिकित्सक से संपर्क करें।'
        : 'Symptoms appear mild. Prioritize hydration, restorative rest, and schedule a routine checkup if symptoms persist beyond a few days.';
      prepQuestions = [
        'What lifestyle factors or stressors may have triggered this episode?',
        'Are there any dietary or sleep adjustments recommended?'
      ];
    }

    setResult({
      category: activeCategory.name,
      symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : ['Unspecified discomfort'],
      severity,
      duration,
      urgencyLevel,
      urgencyColor,
      isEmergency,
      guidance,
      prepQuestions,
      timestamp: new Date().toLocaleString()
    });
  };

  const handleSave = () => {
    if (!result) return;
    const historyItem = {
      id: Date.now(),
      type: 'symptom_check',
      title: `${result.category} Assessment`,
      summary: `${result.symptoms.join(', ')} (Severity: ${result.severity}/10)`,
      urgency: result.urgencyLevel,
      notes: additionalNotes,
      date: new Date().toISOString()
    };
    onSaveToHistory && onSaveToHistory(historyItem);
    setIsSaved(true);
  };

  const resetForm = () => {
    setSelectedSymptoms([]);
    setSeverity(4);
    setDuration('1-3 days');
    setHasRedFlags(false);
    setAdditionalNotes('');
    setResult(null);
    setIsSaved(false);
  };

  return (
    <div className="view-panel" id="symptom-checker-panel">
      <div className="view-header">
        <h2>
          <Stethoscope size={28} color="#06b6d4" />
          <span>{t('symptom_checker_title', 'Interactive Symptom Assessment')}</span>
        </h2>
        <p>{t('symptom_checker_subtitle', 'Structured questions to organize symptoms and prepare for doctor visits.')}</p>
      </div>

      {!result ? (
        <form onSubmit={handleAssess}>
          {/* Step 1: Body Area */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
              {t('step_category', '1. Select Primary Body Area')}
            </label>
            <div className="option-grid">
              {BODY_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className={`option-card ${selectedCategory === cat.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSymptoms([]);
                  }}
                >
                  <div className="option-icon" style={{ fontSize: '1.25rem' }}>{cat.icon}</div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.88rem', color: 'white' }}>
                      {lang === 'te' ? cat.name_te : lang === 'hi' ? cat.name_hi : cat.name}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {cat.symptoms.length} symptoms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Specific Symptoms Checklist */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', display: 'block', marginBottom: '0.65rem' }}>
              2. Specific Symptoms Experienced (Select all that apply):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              {activeCategory.symptoms.map((sym) => {
                const isChecked = selectedSymptoms.includes(sym);
                return (
                  <button
                    type="button"
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    className="btn-secondary"
                    style={{
                      background: isChecked ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.04)',
                      borderColor: isChecked ? 'var(--cyan-500)' : 'var(--border-glass)',
                      color: isChecked ? '#bae6fd' : '#cbd5e1',
                      fontSize: '0.82rem'
                    }}
                  >
                    {isChecked ? '✓ ' : '+ '}
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Severity & Duration */}
          <div className="form-row" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label htmlFor="symptom-severity">
                {t('severity_label', 'Symptom Severity (1 = Mild, 10 = Severe):')} <strong>{severity} / 10</strong>
              </label>
              <input
                id="symptom-severity"
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                style={{ width: '100%', accentColor: severity > 7 ? '#f43f5e' : '#06b6d4', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                <span>1 - Mild Discomfort</span>
                <span>5 - Moderate</span>
                <span>10 - Unbearable</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="symptom-duration">{t('duration_label', 'Duration:')}</label>
              <select
                id="symptom-duration"
                className="form-input"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="Less than 24 hours">Less than 24 hours</option>
                <option value="1-3 days">1 to 3 days</option>
                <option value="4-7 days">4 to 7 days</option>
                <option value="Over 2 weeks">Over 2 weeks</option>
              </select>
            </div>
          </div>

          {/* Step 4: Red Flag Screening */}
          <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fda4af', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem' }}>
              <ShieldAlert size={18} />
              <span>Emergency Screening Checklist</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 0.75rem' }}>
              Do you have crushing chest pain, sudden numbness/paralysis on one side, severe breathing obstruction, or uncontrolled bleeding?
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#fca5a5', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasRedFlags}
                onChange={(e) => setHasRedFlags(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#f43f5e' }}
              />
              <span>Yes, I am experiencing one or more of these acute emergency symptoms.</span>
            </label>
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="additional-symptom-notes">Additional Notes or Context (Optional):</label>
            <input
              id="additional-symptom-notes"
              type="text"
              className="form-input"
              placeholder="e.g. Symptoms triggered after vigorous workout or after dairy intake"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '0.75rem 1.75rem', fontSize: '0.92rem' }}
          >
            <span>{t('btn_assess', 'Analyze Symptoms with AI')}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      ) : (
        /* Results View */
        <div>
          <div className={`triage-alert-box ${result.isEmergency ? 'emergency' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {result.isEmergency ? <AlertTriangle size={22} color="#f43f5e" /> : <CheckCircle2 size={22} color="#10b981" />}
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem' }}>
                  Recommendation: <span style={{ color: result.urgencyColor }}>{result.urgencyLevel}</span>
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{result.timestamp}</span>
            </div>

            <p style={{ color: '#e2e8f0', fontSize: '0.92rem', lineHeight: 1.5, marginTop: '0.65rem' }}>
              {result.guidance}
            </p>

            <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Reported Symptoms:</div>
              <div style={{ fontWeight: 600, color: '#bae6fd', fontSize: '0.88rem' }}>
                {result.symptoms.join(', ')} • Severity: {result.severity}/10 • Duration: {result.duration}
              </div>
            </div>

            {/* Preparation questions for clinician */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', marginBottom: '0.4rem' }}>
                Key Questions to Discuss With Your Doctor:
              </div>
              <ul style={{ paddingLeft: '1.25rem', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.6 }}>
                {result.prepQuestions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginTop: '1.5rem' }}>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={isSaved}
            >
              <Save size={16} />
              <span>{isSaved ? 'Saved to Health History ✓' : 'Save to My Health History'}</span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => onNavigateToAppointments && onNavigateToAppointments()}
            >
              <Calendar size={16} />
              <span>Schedule Doctor Consultation</span>
            </button>

            <button
              className="btn-secondary"
              onClick={resetForm}
            >
              <RotateCcw size={16} />
              <span>{t('btn_reset', 'Start New Assessment')}</span>
            </button>
          </div>

          <p style={{ marginTop: '1.5rem', fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic' }}>
            <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
            {t('disclaimer', 'HealthSaathi provides informational wellness support, not definitive medical diagnoses. Always consult a licensed clinician for treatment.')}
          </p>
        </div>
      )}
    </div>
  );
}
