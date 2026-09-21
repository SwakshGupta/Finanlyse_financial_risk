import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Cpu,
  HelpCircle,
} from 'lucide-react';

export default function AIExplanationCard({ applicationId, initialExplanation, showToast }) {
  const [explanation, setExplanation] = useState(initialExplanation || null);
  const [loading, setLoading] = useState(!initialExplanation);
  const [regenerating, setRegenerating] = useState(false);

  // Fetch explanation if not passed initially
  useEffect(() => {
    if (!initialExplanation && applicationId) {
      fetchExplanation();
    }
  }, [applicationId, initialExplanation]);

  const fetchExplanation = async () => {
    setLoading(true);
    try {
      const data = await api.getExplanation(applicationId);
      setExplanation(data);
    } catch (err) {
      // Explanation might not exist yet or still processing
      console.warn('Could not fetch explanation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const data = await api.generateExplanation(applicationId, { forceRegenerate: true });
      setExplanation(data);
      if (showToast) {
        showToast('AI Risk Narrative regenerated successfully', 'success');
      }
    } catch (err) {
      if (showToast) {
        showToast(err.message || 'Failed to regenerate explanation', 'error');
      }
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
        <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', color: 'var(--cyan)' }} />
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Generating grounded underwriting narrative with Gemini 3.1 Flash-Lite...
        </div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
        <Sparkles size={28} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>AI Explanation Not Generated Yet</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '16px' }}>
          Generate a grounded, regulator-ready risk narrative interpreting this score.
        </p>
        <button className="btn btn-primary btn-sm" onClick={handleRegenerate} disabled={regenerating}>
          <Sparkles size={14} />
          <span>{regenerating ? 'Generating...' : 'Generate AI Risk Narrative'}</span>
        </button>
      </div>
    );
  }

  const {
    provider,
    model,
    promptVersion,
    summary,
    positiveFactors = [],
    riskFactors = [],
    dataLimitations = [],
    disclaimer,
    fallbackUsed,
    generatedAt,
  } = explanation;

  const isGemini = provider?.toLowerCase() === 'gemini';
  const isFallback = fallbackUsed || provider === 'fallback';

  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Recent';

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px 28px',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        background: 'linear-gradient(180deg, rgba(13, 19, 34, 0.85) 0%, rgba(8, 12, 20, 0.95) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow accent */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: isFallback ? 'rgba(245, 158, 11, 0.15)' : 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isFallback ? 'var(--amber)' : 'var(--cyan)',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Risk Narrative & Underwriting Guidance</h3>
              {isFallback ? (
                <span className="badge badge-moderate" style={{ fontSize: '0.65rem' }}>
                  Deterministic Fallback
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--cyan)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    textTransform: 'uppercase',
                  }}
                >
                  Grounded AI Engine
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Model: <code style={{ color: '#a5b4fc' }}>{model || 'gemini-3.1-flash-lite'}</code> • Prompt:{' '}
              <code style={{ color: 'var(--cyan)' }}>{promptVersion}</code> • Generated: {formattedDate}
            </div>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={handleRegenerate}
          disabled={regenerating}
          title="Regenerate grounded explanation with LLM"
        >
          <RefreshCw size={13} className={regenerating ? 'spin' : ''} />
          <span>{regenerating ? 'Regenerating...' : 'Regenerate Narrative'}</span>
        </button>
      </div>

      {/* Executive Summary Callout */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          marginBottom: '22px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <ShieldCheck size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '4px' }}>
              Executive Underwriting Synthesis
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#f1f5f9', margin: 0 }}>
              {summary}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Strengths vs Risks */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Positive Factors */}
        <div
          style={{
            padding: '16px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.04)',
            border: '1px solid rgba(16, 185, 129, 0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CheckCircle2 size={16} color="var(--emerald)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--emerald)' }}>
              Positive Credit Drivers
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {positiveFactors.map((factor, idx) => (
              <li key={idx} style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {factor}
              </li>
            ))}
          </ul>
        </div>

        {/* Risk Vulnerabilities */}
        <div
          style={{
            padding: '16px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.04)',
            border: '1px solid rgba(244, 63, 94, 0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={16} color="var(--rose)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--rose)' }}>
              Identified Risk Vulnerabilities
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {riskFactors.map((factor, idx) => (
              <li key={idx} style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Data Scope & Limitations */}
      {dataLimitations.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Info size={14} color="var(--text-dim)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Alternative Data Scope & Boundaries:
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {dataLimitations.map((lim, idx) => (
              <li key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lim}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Regulatory Fair Lending Disclaimer */}
      <div
        style={{
          fontSize: '0.7rem',
          color: 'var(--text-dim)',
          fontStyle: 'italic',
          lineHeight: 1.4,
          paddingTop: '10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {disclaimer ||
          'This explanation describes mathematical model factors and available alternative cash-flow data; it is not a lending decision or binding commitment.'}
      </div>
    </div>
  );
}
