import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, DollarSign, Activity } from 'lucide-react';

/**
 * IncomeTrendCard
 * Renders a crisp, responsive 24-month temporal income history SVG chart.
 * Features:
 * - 24-month monthly gross inflow progression
 * - Baseline trendline comparing earliest 3M vs latest 3M average
 * - Interactive hover tooltips for exact month values
 * - Statistical summary chips (Min, Max, 24M Average, Momentum)
 */
export default function IncomeTrendCard({ incomeHistory = [], trajectoryInsights = {}, incomeTrend3m = 0 }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // If no history is provided, generate a fallback or show empty state
  const data = Array.isArray(incomeHistory) && incomeHistory.length > 0
    ? incomeHistory
    : Array.from({ length: 24 }, (_, i) => ({
        month: `M-${24 - i}`,
        amount: 40000 + Math.sin(i / 2) * 3000,
        label: `Month ${i + 1}`,
      }));

  const amounts = data.map((d) => Number(d.amount) || 0);
  const minVal = Math.min(...amounts);
  const maxVal = Math.max(...amounts);
  const avgVal = amounts.length > 0 ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length) : 0;
  
  // Padding for chart bounds
  const range = maxVal - minVal || 10000;
  const chartMin = Math.max(0, minVal - range * 0.15);
  const chartMax = maxVal + range * 0.15;
  const chartRange = chartMax - chartMin || 1;

  // SVG dimensions
  const svgWidth = 720;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 25;
  const padBottom = 35;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Coordinate mapper
  const points = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * chartW;
    const y = padTop + chartH - ((Number(d.amount) - chartMin) / chartRange) * chartH;
    return { ...d, x, y, index: i };
  });

  // SVG Path strings
  const linePath = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},${padTop + chartH} L ${points[0].x},${padTop + chartH} Z`
    : '';

  // Trend computation
  const trendPct = typeof trajectoryInsights?.trendPercentage === 'number'
    ? trajectoryInsights.trendPercentage
    : Number((incomeTrend3m * 100).toFixed(1));

  let TrendIcon = Minus;
  let trendColor = 'var(--text-muted)';
  let trendBadgeBg = 'rgba(148, 163, 184, 0.1)';
  let trendText = 'Stable';

  if (trendPct > 1.5) {
    TrendIcon = TrendingUp;
    trendColor = 'var(--emerald)';
    trendBadgeBg = 'rgba(16, 185, 129, 0.12)';
    trendText = `Improving (+${trendPct}%)`;
  } else if (trendPct < -1.5) {
    TrendIcon = TrendingDown;
    trendColor = 'var(--rose)';
    trendBadgeBg = 'rgba(244, 63, 94, 0.12)';
    trendText = `Declining (${trendPct}%)`;
  } else {
    trendText = `Stable (${trendPct > 0 ? '+' : ''}${trendPct}%)`;
  }

  // Earliest 3M vs Latest 3M Averages
  const early3M = amounts.slice(0, 3);
  const late3M = amounts.slice(-3);
  const avgEarly3M = early3M.length > 0 ? Math.round(early3M.reduce((a, b) => a + b, 0) / early3M.length) : 0;
  const avgLate3M = late3M.length > 0 ? Math.round(late3M.reduce((a, b) => a + b, 0) / late3M.length) : 0;

  return (
    <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Activity size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                24-Month Temporal Inflow Trend
              </h3>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.12)',
                  color: 'var(--cyan)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                }}
              >
                24M HORIZON
              </span>
            </div>
            <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Consented month-by-month gross inflow trajectory and 3-month momentum comparison
            </p>
          </div>
        </div>

        {/* Trend Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: trendBadgeBg,
            border: `1px solid ${trendColor}40`,
            color: trendColor,
            fontWeight: 700,
            fontSize: '0.8rem',
          }}
        >
          <TrendIcon size={15} />
          <span>{trendText}</span>
        </div>
      </div>

      {/* SVG Responsive Chart */}
      <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: '550px' }}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="85%" stopColor="#6366f1" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="incomeLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padTop + chartH * ratio;
            const val = Math.round(chartMax - ratio * chartRange);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="monospace"
                >
                  ₹{(val / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#incomeAreaGrad)" />

          {/* Main Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#incomeLineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Earliest 3M Average reference dashed line */}
          {points.length >= 3 && (
            <line
              x1={points[0].x}
              y1={padTop + chartH - ((avgEarly3M - chartMin) / chartRange) * chartH}
              x2={points[2].x}
              y2={padTop + chartH - ((avgEarly3M - chartMin) / chartRange) * chartH}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          )}

          {/* Latest 3M Average reference dashed line */}
          {points.length >= 24 && (
            <line
              x1={points[21].x}
              y1={padTop + chartH - ((avgLate3M - chartMin) / chartRange) * chartH}
              x2={points[23].x}
              y2={padTop + chartH - ((avgLate3M - chartMin) / chartRange) * chartH}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          )}

          {/* Data Points and interactive hover targets */}
          {points.map((pt, idx) => {
            const isHovered = hoveredPoint?.index === idx;
            // Show label every 3-4 months to avoid clutter
            const showMonthLabel = idx === 0 || idx === 5 || idx === 11 || idx === 17 || idx === 23;

            return (
              <g key={idx}>
                {/* Visual Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 2.5}
                  fill={isHovered ? '#ffffff' : '#818cf8'}
                  stroke="#1e1b4b"
                  strokeWidth="2"
                  style={{ transition: 'r 0.15s ease' }}
                />

                {/* X-axis Month Label */}
                {showMonthLabel && (
                  <text
                    x={pt.x}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    fontSize="9"
                    fill="var(--text-dim)"
                    fontFamily="monospace"
                  >
                    {pt.label ? pt.label.split(' ')[0] : `M${idx + 1}`}
                  </text>
                )}

                {/* Invisible larger hit target for mouse hover */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={12}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(pt)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip when hovered */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              top: `${Math.max(10, (hoveredPoint.y / svgHeight) * 100 - 18)}%`,
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              transform: 'translate(-50%, -100%)',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(99, 102, 241, 0.5)',
              borderRadius: '8px',
              padding: '6px 10px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
              pointerEvents: 'none',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {hoveredPoint.label || hoveredPoint.month}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cyan)' }}>
              ₹{Number(hoveredPoint.amount).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Statistical Summary Chips */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
        }}
      >
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>
            24M Monthly Average
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
            ₹{avgVal.toLocaleString()}
          </span>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>
            Historical Peak (Max)
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--emerald)' }}>
            ₹{maxVal.toLocaleString()}
          </span>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>
            Historical Floor (Min)
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--rose)' }}>
            ₹{minVal.toLocaleString()}
          </span>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>
            Earliest vs Latest 3M
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cyan)' }}>
            ₹{(avgEarly3M / 1000).toFixed(0)}k → ₹{(avgLate3M / 1000).toFixed(0)}k
          </span>
        </div>
      </div>
    </div>
  );
}
