import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldAlert,
  RotateCcw,
  PhoneCall,
  ExternalLink,
  Key
} from 'lucide-react';
import { sendCopilotMessage } from '../services/api';
import { getTranslation } from '../utils/translations';

export default function CopilotChat({
  lang = 'en',
  user,
  onOpenEmergencyModal,
  onOpenLogModal,
  onSelectTab
}) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const initialWelcomeText = (lang === 'te')
    ? "నమస్కారం! నేను మీ హెల్త్ సాథి AI సహాయకుడిని. మీ ఆరోగ్యం, లక్షణాలు, లేదా ఆహారపు అలవాట్లపై నేను మీకు ఎలా సహాయపడగలను?"
    : (lang === 'hi')
    ? "नमस्ते! मैं आपका हेल्थ साथी AI सहायक हूँ। आपके स्वास्थ्य, लक्षण, या दिनचर्या के बारे में मैं आपकी क्या मदद कर सकता हूँ?"
    : "Hello! I am your HealthSaathi Clinical Copilot. I can assist you with understanding symptoms, biomarker interpretations, visit preparation, and general health education. How can I help you today?";

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'copilot',
      text: initialWelcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'welcome',
      suggested_actions: ['Log new vitals', 'Check symptoms', 'Doctor visit prep']
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    t('quick_prompt_1', 'I have a throbbing headache'),
    t('quick_prompt_2', 'Evaluate my heart rate and BP'),
    t('quick_prompt_3', 'Tips for deep regenerative sleep'),
    t('quick_prompt_4', 'How to manage blood sugar spikes')
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (messageToSend) => {
    const query = messageToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setLastQuery(query);

    try {
      // Build safe conversation history (last 4 messages, text only, no raw PII)
      const recentHistory = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await sendCopilotMessage(query, lang, user?.id || 'guest_patient', recentHistory);

      const botReply = {
        id: Date.now() + 1,
        sender: 'copilot',
        text: response.reply,
        category: response.category,
        suggested_actions: response.suggested_actions || [],
        disclaimer: response.disclaimer,
        is_emergency: response.is_emergency,
        provider: response.provider,
        config_notice: response.config_notice,
        error_message: response.error_message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'copilot',
          text: (lang === 'te')
            ? "సర్వర్ తో కనెక్ట్ కావడంలో అంతరాయం ఏర్పడింది. దయచేసి స్థానిక మార్గదర్శకాలను పాటించండి."
            : (lang === 'hi')
            ? "सर्वर से जुड़ने में समस्या आई है। कृपया कुछ समय बाद पुनः प्रयास करें।"
            : "I experienced a network delay contacting the AI backend. Please verify your connection or retry.",
          error_message: err.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (act) => {
    const lower = (act || '').toLowerCase();
    if (lower.includes('vital') || lower.includes('reading') || lower.includes('log new')) {
      if (onOpenLogModal) {
        onOpenLogModal();
        return;
      }
    }
    if (lower.includes('symptom')) {
      if (onSelectTab) {
        onSelectTab('symptoms');
        return;
      }
    }
    if (lower.includes('doctor') || lower.includes('visit') || lower.includes('prep') || lower.includes('appointment')) {
      if (onSelectTab) {
        onSelectTab('appointments');
        return;
      }
    }
    if (lower.includes('medicine') || lower.includes('prescription')) {
      if (onSelectTab) {
        onSelectTab('prescriptions');
        return;
      }
    }
    if (lower.includes('emergency') || lower.includes('112') || lower.includes('108')) {
      if (onOpenEmergencyModal) {
        onOpenEmergencyModal();
        return;
      }
    }
    handleSend(act);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="copilot-panel" aria-label="AI Health Copilot Assistant" id="copilot-chat-container">
      {/* Header */}
      <div className="copilot-panel-header">
        <div className="copilot-title-box">
          <div className="copilot-avatar-glow">
            <Bot size={22} />
          </div>
          <div className="copilot-meta">
            <h2>{t('copilot_title', 'HealthSaathi AI Assistant')}</h2>
            <p>{t('copilot_status', 'Active • Clinical Guidance Engine')}</p>
          </div>
        </div>
        <span className="brand-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={11} />
          <span>OpenAI API</span>
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="copilot-messages" id="chat-messages-scroll-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.sender}`}>
            <div
              className="message-bubble"
              style={
                msg.is_emergency
                  ? { borderColor: '#f43f5e', background: 'rgba(244, 63, 94, 0.12)' }
                  : {}
              }
            >
              {/* Emergency Banner */}
              {msg.is_emergency && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    background: 'rgba(244, 63, 94, 0.25)',
                    border: '1px solid #f43f5e',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fca5a5', fontWeight: 700, fontSize: '0.82rem' }}>
                    <ShieldAlert size={16} />
                    <span>URGENT EMERGENCY ALERT</span>
                  </div>
                  {onOpenEmergencyModal && (
                    <button
                      onClick={onOpenEmergencyModal}
                      className="btn-primary"
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.72rem',
                        background: '#e11d48',
                        borderColor: '#f43f5e'
                      }}
                    >
                      <PhoneCall size={12} />
                      <span>Call 112</span>
                    </button>
                  )}
                </div>
              )}

              {/* Configuration Notice if API key missing */}
              {msg.config_notice && (
                <div
                  style={{
                    marginBottom: '8px',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    fontSize: '0.76rem',
                    color: '#fde68a',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'flex-start'
                  }}
                >
                  <Key size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Configuration Tip: </strong>
                    To connect live OpenAI intelligence, add <code>OPENAI_API_KEY=sk-...</code> into <code>backend/.env</code> and restart the server. (Currently responding via verified clinical safety triage).
                  </div>
                </div>
              )}

              {/* Message Content */}
              <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>

              {/* Suggested Actions */}
              {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                <div className="suggested-actions-box">
                  <div className="action-pill-title">Recommended Next Steps:</div>
                  <div className="action-pill-list">
                    {msg.suggested_actions.map((act, idx) => (
                      <span
                        key={idx}
                        className="action-pill"
                        style={msg.is_emergency ? { borderColor: 'rgba(244,63,94,0.5)', color: '#fca5a5' } : {}}
                        onClick={() => handleActionClick(act)}
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              {msg.disclaimer && (
                <div className="disclaimer-text">
                  <AlertCircle size={10} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                  {msg.disclaimer}
                </div>
              )}

              {/* Footer with Timestamp and Retry Option */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <div className="message-time">{msg.timestamp}</div>
                {msg.sender === 'copilot' && msg.id !== 1 && (
                  <button
                    type="button"
                    onClick={() => handleSend(lastQuery)}
                    title="Retry this request"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '0.7rem'
                    }}
                  >
                    <RotateCcw size={11} />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="message-row copilot">
            <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 className="animate-spin" size={16} color="#06b6d4" />
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                HealthSaathi AI is synthesizing clinical recommendations...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="quick-prompts-bar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            className="prompt-chip"
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        className="copilot-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          id="copilot-user-input"
          type="text"
          className="copilot-input"
          placeholder={t('copilot_input_placeholder', 'Ask about symptoms, vitals, medications, or visit prep...')}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          id="btn-copilot-submit"
          type="submit"
          className="send-btn"
          disabled={!inputText.trim() || isLoading}
          title="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </aside>
  );
}
