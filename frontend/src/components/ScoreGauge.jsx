import React, { useEffect, useState } from 'react';

export default function ScoreGauge({ score = 75, defaultProbability = 0.08, riskBand = 'LOW' }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  // SVG circular arc dimensions
  const size = 240;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 260 degree arc
  const arcDegree = 250;
  const arcLength = (arcDegree / 360) * circumference;
  const strokeDashoffset = arcLength - (Math.min(100, Math.max(0, animatedScore)) / 100) * arcLength;

  // Determine styling theme from Risk Band
  let color = 'var(--emerald)';
  let glowColor = 'var(--emerald-glow)';
  let bandLabel = 'LOW RISK';
  let bandClass = 'badge-low';

  if (riskBand === 'HIGH' || score < 50) {
    color = 'var(--rose)';
    glowColor = 'var(--rose-glow)';
    bandLabel = 'HIGH RISK';
    bandClass = 'badge-high';
  } else if (riskBand === 'MODERATE' || score < 75) {
    color = 'var(--amber)';
    glowColor = 'var(--amber-glow)';
    bandLabel = 'MODERATE RISK';
    bandClass = 'badge-moderate';
  }

  const defaultPct = (defaultProbability * 100).toFixed(1);

  return (
    <div
      className="glass-card"
      style={{
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow orb */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: glowColor,
          filter: 'blur(50px)',
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', width: `${size}px`, height: `${size * 0.85}px` }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(145deg)', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="60%" stopColor={color} />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>

        {/* Center metrics */}
        <div
          style={{
            position: 'absolute',
            top: '44%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.725rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Alternative Score
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '-4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '3.75rem',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1,
              }}
            >
              {animatedScore}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-dim)', marginLeft: '4px', fontWeight: 600 }}>
              /100
            </span>
          </div>

          <div style={{ marginTop: '8px' }}>
            <span className={`badge ${bandClass}`} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
              {bandLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Probability footnote */}
      <div
        style={{
          marginTop: '12px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Default Probability:</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: color }}>
          {defaultPct}%
        </span>
      </div>
    </div>
  );
}
