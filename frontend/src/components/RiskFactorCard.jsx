import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function RiskFactorCard({ factors }) {
  const positiveFactors = factors?.positive || [];
  const negativeFactors = factors?.negative || [];

  const formatFeatureName = (name) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      {/* Positive Drivers Column */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--emerald-surface)',
              border: '1px solid var(--emerald-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--emerald)',
            }}
          >
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Positive Risk Drivers</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Behaviors lowering estimated default probability
            </span>
          </div>
        </div>

        {positiveFactors.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No prominent positive drivers detected
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {positiveFactors.map((f, idx) => {
              const impactPct = Math.min(100, Math.round((f.contribution || 0.3) * 100));
              return (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="var(--emerald)" />
                      {formatFeatureName(f.feature)}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald)', background: 'var(--emerald-surface)', padding: '2px 8px', borderRadius: '4px' }}>
                      +{impactPct}% Impact
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '8px' }}>
                    {f.impact || `Positive contribution to creditworthiness based on ${formatFeatureName(f.feature)}.`}
                  </p>

                  {/* Magnitude Bar */}
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${impactPct}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Negative Drivers Column */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--rose-surface)',
              border: '1px solid var(--rose-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--rose)',
            }}
          >
            <TrendingDown size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Risk Elevation Drivers</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Factors increasing estimated default risk
            </span>
          </div>
        </div>

        {negativeFactors.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No prominent negative risk factors identified
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {negativeFactors.map((f, idx) => {
              const impactPct = Math.min(100, Math.round((f.contribution || 0.4) * 100));
              return (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} color="var(--rose)" />
                      {formatFeatureName(f.feature)}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--rose)', background: 'var(--rose-surface)', padding: '2px 8px', borderRadius: '4px' }}>
                      -{impactPct}% Impact
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '8px' }}>
                    {f.impact || `Elevates estimated default risk according to feature ${formatFeatureName(f.feature)}.`}
                  </p>

                  {/* Magnitude Bar */}
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${impactPct}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #f43f5e 0%, #f59e0b 100%)',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
