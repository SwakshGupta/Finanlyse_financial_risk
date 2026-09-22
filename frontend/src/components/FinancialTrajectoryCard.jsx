import React from 'react';
import {
  Compass,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  ShieldCheck,
  Zap,
  Smartphone,
  CalendarCheck,
  Layers,
  Banknote,
} from 'lucide-react';

/**
 * FinancialTrajectoryCard
 * Highlights the 5 core V2 temporal behavioral dimensions:
 * 1. 3-Month Income Momentum (income_trend_3m)
 * 2. Negative Cashflow Months count over 24-month horizon (negative_cashflow_months)
 * 3. Liquidity Floor Ratio (minimum_balance_ratio)
 * 4. Utility Payment Consistency (utility_payment_consistency)
 * 5. Digital Transaction Ratio (digital_transaction_ratio)
 * Plus explicit non-debt recurring obligations vs EMI separation.
 */
export default function FinancialTrajectoryCard({ financialSummary = {}, trajectoryInsights = {} }) {
  const summary = financialSummary || {};
  const insights = trajectoryInsights || summary.trajectoryInsights || {};

  // 1. Income Trend
  const trendPct = typeof insights.trendPercentage === 'number'
    ? insights.trendPercentage
    : typeof summary.incomeTrend3m === 'number'
    ? Number((summary.incomeTrend3m * 100).toFixed(1))
    : 0;

  let TrendIcon = Minus;
  let trendColor = 'var(--text-muted)';
  let trendStatus = 'Stable Horizon';

  if (trendPct > 1.5) {
    TrendIcon = TrendingUp;
    trendColor = 'var(--emerald)';
    trendStatus = 'Positive Expansion';
  } else if (trendPct < -1.5) {
    TrendIcon = TrendingDown;
    trendColor = 'var(--rose)';
    trendStatus = 'Contraction Detected';
  }

  // 2. Negative Cashflow Months
  const negMonths = typeof summary.negativeCashflowMonths === 'number'
    ? summary.negativeCashflowMonths
    : (insights.negativeCashflowMonths ?? 0);
  const totalMonths = summary.observationMonths || insights.totalObservedMonths || 24;

  let cashflowColor = 'var(--emerald)';
  let cashflowBadge = 'Resilient Cashflow';
  let CashflowIcon = ShieldCheck;

  if (negMonths >= 3) {
    cashflowColor = 'var(--rose)';
    cashflowBadge = 'High Strain Frequency';
    CashflowIcon = AlertCircle;
  } else if (negMonths >= 1) {
    cashflowColor = 'var(--amber)';
    cashflowBadge = 'Occasional Deficit';
    CashflowIcon = AlertCircle;
  }

  // 3. Minimum Balance Ratio
  const minBalRatio = typeof summary.minimumBalanceRatio === 'number'
    ? summary.minimumBalanceRatio
    : (insights.minimumBalanceRatio ?? 0.35);
  const minBalPct = (minBalRatio * 100).toFixed(0);

  // 4. Utility Payment Consistency
  const utilConsistency = typeof summary.utilityPaymentConsistency === 'number'
    ? (summary.utilityPaymentConsistency > 1 ? summary.utilityPaymentConsistency : summary.utilityPaymentConsistency * 100).toFixed(0)
    : (insights.utilityPaymentConsistency ?? 95);

  // 5. Digital Velocity Ratio
  const digitalRatio = typeof summary.digitalTransactionRatio === 'number'
    ? (summary.digitalTransactionRatio > 1 ? summary.digitalTransactionRatio : summary.digitalTransactionRatio * 100).toFixed(0)
    : (insights.digitalTransactionRatio ?? 90);

  // Non-Debt Recurring Obligations vs EMI
  const nonDebt = Number(summary.nonDebtRecurringObligations || summary.recurringObligationAmount || 0);
  const monthlyEmi = Number(summary.monthlyEmi || 0);

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan)',
            }}
          >
            <Compass size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Financial Trajectory & Behavioral Health
            </h3>
            <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
              24-Month longitudinal cashflow patterns & alternative stability indicators
            </span>
          </div>
        </div>
      </div>

      {/* Trajectory Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {/* Metric 1: 3-Month Income Momentum */}
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                3-Month Momentum
              </span>
              <TrendIcon size={16} color={trendColor} />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: trendColor }}>
              {trendPct > 0 ? `+${trendPct}%` : `${trendPct}%`}
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Recent 3M vs early history: <strong style={{ color: trendColor }}>{trendStatus}</strong>
          </div>
        </div>

        {/* Metric 2: Negative Cashflow Months */}
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Deficit Months
              </span>
              <CashflowIcon size={16} color={cashflowColor} />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: cashflowColor }}>
              {negMonths} <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>/ {totalMonths} Mo</span>
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Liquidity stress: <strong style={{ color: cashflowColor }}>{cashflowBadge}</strong>
          </div>
        </div>

        {/* Metric 3: Liquidity Floor Ratio */}
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Liquidity Floor Buffer
              </span>
              <ShieldCheck size={16} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
              {minBalPct}%
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Min-to-Average balance floor retention
          </div>
        </div>

        {/* Metric 4: Utility Payment Consistency */}
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Utility Regularity
              </span>
              <CalendarCheck size={16} color="var(--emerald)" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--emerald)' }}>
              {utilConsistency}%
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            On-time telco, power, and recurring utility bills
          </div>
        </div>

        {/* Metric 5: Digital Velocity Ratio */}
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Digital Footprint
              </span>
              <Smartphone size={16} color="var(--cyan)" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--cyan)' }}>
              {digitalRatio}%
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Share of verifiable UPI / card cashflows
          </div>
        </div>
      </div>

      {/* Explicit Commitment Architecture (No double-counting debt vs non-debt) */}
      <div
        style={{
          marginTop: '16px',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99, 102, 241, 0.05)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={18} color="var(--primary)" />
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
              Obligation Architecture Separation
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Strict isolation of existing debt EMIs from non-debt living commitments prevents double-counting.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Monthly Loan EMI
            </span>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
              ₹{monthlyEmi.toLocaleString()}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Non-Debt Recurring
            </span>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--cyan)' }}>
              ₹{nonDebt.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
