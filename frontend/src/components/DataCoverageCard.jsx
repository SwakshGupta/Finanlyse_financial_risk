import React from 'react';
import { Database, Calendar, Check, Info, Cpu } from 'lucide-react';

export default function DataCoverageCard({ dataCoverage, model }) {
  const sources = dataCoverage?.dataSources || ['MANUAL_INPUT'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      {/* Data Coverage & Inclusion Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--cyan-glow)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan)',
            }}
          >
            <Database size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Data Coverage & Inclusion</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Underwriting inputs and longitudinal observation
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Financial Profile</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={14} /> Available
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Bureau File Status</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '3px 8px', borderRadius: '4px' }}>
              Alternative Ingestion Active (Thin-File)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Observation Horizon
            </span>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {dataCoverage?.observationMonths || 24} Months
              <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                TEMPORAL
              </span>
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Connected Sources
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {sources.map((s, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#a5b4fc',
                    fontWeight: 600,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Model Transparency & Governance Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Cpu size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Model Governance & Integrity</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Authoritative ML inference architecture
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.825rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Model Architecture</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{model?.algorithm || 'LOGISTIC_REGRESSION'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Model Version</span>
            <span style={{ fontWeight: 600, color: '#818cf8', fontFamily: 'monospace' }}>{model?.version || 'logistic_regression_v2.0.0'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Feature Catalog</span>
            <span style={{ fontWeight: 600, color: '#06b6d4', fontFamily: 'monospace' }}>
              {model?.featureSetVersion ? `${model.featureSetVersion} (20 Features)` : 'feature_set_v2 (20 Features)'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span style={{ color: 'var(--text-muted)' }}>Training Baseline</span>
            <span style={{ fontWeight: 600, color: 'var(--emerald)' }}>24-Month Temporal Cohorts (v2)</span>
          </div>

          <div
            style={{
              marginTop: '10px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
            }}
          >
            <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              <strong>Fair Lending & Explainability Guarantee:</strong> All numerical risk scores and default probabilities are generated strictly by statistical model weights over 24-month longitudinal financial behavior. No arbitrary or fabricated bureau metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
