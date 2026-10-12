import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, AlertTriangle, AlertCircle, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { sendCopilotMessage } from '../services/api';
import { getTranslation } from '../utils/translations';

export default function CopilotChat({ lang = 'en', user }) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const initialWelcomeText = (lang === 'te')
    ? "నమస్కారం! నేను మీ హెల్త్ సాథి AI సహాయకుడిని. మీ ఆరోగ్యం, లక్షణాలు, లేదా ఆహారపు అలవాట్లపై నేను మీకు ఎలా సహాయపడగలను?"
    : (lang === 'hi')
    ? "नमस्ते! मैं आपका हेल्थ साथी AI सहायक हूँ। आपके स्वास्थ्य, लक्षण, या दिनचर्या के बारे में मैं आपकी क्या मदद कर सकता हूँ?"
    : "Hello! I am your HealthSaathi AI Copilot. I've synced your latest resting vitals. What symptoms, medications, or wellness questions can I assist you with right now?";

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

    try {
      const response = await sendCopilotMessage(query, lang, user?.id);
      const botReply = {
        id: Date.now() + 1,
        sender: 'copilot',
        text: response.reply,
        category: response.category,
        suggested_actions: response.suggested_actions || [],
        disclaimer: response.disclaimer,
        is_emergency: response.is_emergency,
        provider: response.provider,
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
            : "I experienced a temporary network delay contacting the AI engine, but your health data remains protected in your local database.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="copilot-panel" aria-label="AI Health Copilot Assistant" id="copilot-chat-container">
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
        <span className="brand-badge">{t('copilot_badge', 'FastAPI + Gemini AI')}</span>
      </div>

      <div className="copilot-messages" id="chat-messages-scroll-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.sender}`}>
            <div className="message-bubble" style={msg.is_emergency ? { borderColor: '#f43f5e', background: 'rgba(244,63,94,0.1)' } : {}}>
              {msg.is_emergency && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px' }}>
                  <ShieldAlert size={16} />
                  <span>URGENT EMERGENCY ALERT</span>
                </div>
              )}

              <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>

              {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                <div className="suggested-actions-box">
                  <div className="action-pill-title">Recommended Next Steps:</div>
                  <div className="action-pill-list">
                    {msg.suggested_actions.map((act, idx) => (
                      <span
                        key={idx}
                        className="action-pill"
                        style={msg.is_emergency ? { borderColor: 'rgba(244,63,94,0.5)', color: '#fca5a5' } : {}}
                        onClick={() => handleSend(act)}
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {msg.disclaimer && (
                <div className="disclaimer-text">
                  <AlertCircle size={10} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                  {msg.disclaimer}
                </div>
              )}

              <div className="message-time">{msg.timestamp}</div>
            </div>
          </div>
        ))}

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

      {/* Input Field */}
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
