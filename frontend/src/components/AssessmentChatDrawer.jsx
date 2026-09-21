import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'How was my 0–100 Alternative Risk Score calculated?',
  'What actionable steps can I take to improve my score?',
  'How does my debt-to-income (DTI) ratio impact my evaluation?',
  'Why was alternative cash flow data used instead of a credit bureau score?',
];

export default function AssessmentChatDrawer({ applicationId, showToast }) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content:
        'Hello! I am your **Finalyse AI Credit Assistant**. I have analyzed your alternative risk assessment and cash-flow data. Feel free to ask me questions about your score, positive drivers, risk factors, or how to improve your financial profile.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isSending) return;

    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessages = [...messages, { role: 'user', content: text, timestamp: userTimestamp }];
    setMessages(newMessages);
    setInputValue('');
    setIsSending(true);

    // Prepare history for backend
    const history = newMessages
      .filter((m) => m.role === 'user' || m.role === 'model')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await api.sendChatMessage(applicationId, {
        message: text,
        history: history.slice(-6), // Send last 3 exchanges
      });

      const assistantTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: res.reply,
          provider: res.provider,
          timestamp: assistantTimestamp,
        },
      ]);
    } catch (err) {
      if (showToast) {
        showToast(err.message || 'Failed to send message', 'error');
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content:
            'I encountered an issue connecting to the underwriting intelligence engine. Please try asking your question again in a moment.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'model',
        content:
          'Conversation reset. How else can I assist you with your alternative credit profile?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to render simple markdown formatting (bold, bullet points)
  const renderMessageContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bullet point
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const bulletText = line.trim().substring(2);
        return (
          <li key={idx} style={{ marginBottom: '4px' }}>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(bulletText) }} />
          </li>
        );
      }
      // Numbered point
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} style={{ marginBottom: '6px', paddingLeft: '4px' }}>
            <strong>{numMatch[1]}. </strong>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(numMatch[2]) }} />
          </div>
        );
      }
      // Section header
      if (line.trim().startsWith('### ') || line.trim().startsWith('## ')) {
        const headerText = line.trim().replace(/^#+\s+/, '');
        return (
          <div key={idx} style={{ fontWeight: 700, color: 'var(--cyan)', marginTop: '8px', marginBottom: '4px' }}>
            {headerText}
          </div>
        );
      }
      // Divider
      if (line.trim() === '---') {
        return <hr key={idx} style={{ borderColor: 'var(--border-subtle)', margin: '8px 0' }} />;
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} style={{ height: '6px' }} />;
      }
      // Normal paragraph
      return (
        <p key={idx} style={{ margin: '0 0 6px 0', lineHeight: 1.55 }}>
          <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
        </p>
      );
    });
  };

  const formatInlineMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="color:var(--cyan);background:rgba(6,182,212,0.1);padding:1px 4px;border-radius:4px;">$1</code>');
  };

  return (
    <div
      className="glass-card"
      style={{
        border: '1px solid rgba(99, 102, 241, 0.28)',
        background: 'linear-gradient(180deg, rgba(13, 19, 34, 0.95) 0%, rgba(8, 12, 20, 0.98) 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Header bar with toggle */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid var(--border-subtle)' : 'none',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Bot size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                AI Credit Advisor Chat
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--emerald)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                Online
              </span>
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
              Ask follow-up questions about your alternative risk evaluation and credit factors
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isOpen && (
            <button
              className="btn btn-sm btn-outline"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              onClick={(e) => {
                e.stopPropagation();
                clearChat();
              }}
              title="Clear conversation"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          )}
          <button
            className="btn btn-sm btn-outline"
            style={{ padding: '6px', borderRadius: '50%' }}
            title={isOpen ? 'Collapse Chat' : 'Expand Chat'}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded chat window */}
      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '420px' }}>
          {/* Suggested Prompts Banner */}
          <div
            style={{
              padding: '10px 16px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles size={13} color="var(--cyan)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', flexShrink: 0 }}>
              Suggested:
            </span>
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isSending}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '4px 10px',
                  fontSize: '0.725rem',
                  color: 'var(--text-muted)',
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isSending) {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div
            ref={messagesContainerRef}
            style={{
              flex: 1,
              padding: '16px 20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    gap: '10px',
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(6, 182, 212, 0.2)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--cyan)',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <Bot size={15} />
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '12px 16px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isUser
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.35) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isUser
                        ? '1px solid rgba(99, 102, 241, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: isUser ? '#ffffff' : 'var(--text-main)',
                      }}
                    >
                      {isUser ? msg.content : renderMessageContent(msg.content)}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '4px',
                        fontSize: '0.65rem',
                        color: 'var(--text-dim)',
                      }}
                    >
                      {msg.provider && (
                        <span>via {msg.provider === 'gemini' ? 'Gemini 3.1' : msg.provider}</span>
                      )}
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  {isUser && (
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.25)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <User size={15} />
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(6, 182, 212, 0.2)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--cyan)',
                  }}
                >
                  <Bot size={15} />
                </div>
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                  }}
                >
                  <RefreshCw size={14} className="spin" style={{ color: 'var(--cyan)' }} />
                  <span>Gemini is formulating grounded advice...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <input
              type="text"
              placeholder="Ask a question about your alternative risk score or financial factors..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isSending}
              style={{ padding: '9px 16px' }}
            >
              <Send size={14} />
              <span>Send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
