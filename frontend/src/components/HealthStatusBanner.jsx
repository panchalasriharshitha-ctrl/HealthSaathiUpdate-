import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function HealthStatusBanner({ patientName = "User", score = 94, lang = "en" }) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 
    ? t("greeting_morning", "Good morning")
    : hour < 17 
    ? t("greeting_afternoon", "Good afternoon")
    : t("greeting_evening", "Good evening");

  return (
    <section className="hero-banner" aria-label="Health Overview Banner" id="hero-status-section">
      <div className="hero-grid">
        <div className="hero-title-group">
          <h1>{greeting}, {patientName} 👋</h1>
          <p className="hero-subtitle">
            {t("hero_description", "HealthSaathi AI continuously synthesizes your circadian rhythms, cardiovascular data, and metabolic markers to keep you proactive and prepared.")}
          </p>

          <div className="copilot-insight-pill" id="copilot-daily-insight">
            <Sparkles className="copilot-insight-icon" size={18} />
            <div>
              <strong>{t("ai_daily_insight_title", "AI Daily Insight:")}</strong>{" "}
              {t("ai_daily_insight_body", "Resting heart rate is in optimal sinus rhythm. Hydration target: 2.2L today.")}
            </div>
          </div>
        </div>

        <div className="hero-stats-panel" id="hero-ai-score-card">
          <div className="score-circle">
            <div className="score-inner">
              <span className="score-value">{score}</span>
              <span className="score-label">INDEX</span>
            </div>
          </div>
          <div className="score-details">
            <h3>{t("wellness_score", "Wellness Score")}</h3>
            <p>
              <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              {t("optimal_balance", "Optimal Vital Balance")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

