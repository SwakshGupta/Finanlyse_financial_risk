import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function WhatIfSimulator({ applicationId, baselineAssessment, showToast }) {
  // Financial profile state loaded from baseline or defaults
  const [baselineFinancials, setBaselineFinancials] = useState({
    monthlyIncome: 45000,
    monthlyExpenses: 24000,
    monthlyEmi: 4500,
    averageBalance: 15000,
  });

  // Slider overrides state
  const [overrides, setOverrides] = useState({
    monthlyIncome: 45000,
    monthlyExpenses: 24000,
    monthlyEmi: 4500,
    averageBalance: 15000,
  });

  const [isLoadingFinancials, setIsLoadingFinancials] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  // Fetch initial baseline financial profile
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const summary = await api.getFinancialSummary(applicationId);
        if (isMounted && summary) {
          const init = {
            monthlyIncome: Math.round(summary.monthlyIncome || 45000),
            monthlyExpenses: Math.round(summary.monthlyExpenses || 24000),
            monthlyEmi: Math.round(summary.monthlyEmi || 4500),
            averageBalance: Math.round(summary.averageBalance || 15000),
          };
          setBaselineFinancials(init);
          setOverrides(init);
        }
      } catch (err) {
        // Fallback gracefully to reasonable baseline defaults if API unreachable
        console.warn('Could not load financial summary for what-if; using baseline defaults', err);
      } finally {
        if (isMounted) setIsLoadingFinancials(false);
      }
    };

    if (applicationId) {
      loadProfile();
    }
    return () => {
      isMounted = false;
    };
  }, [applicationId]);

  // Derived live ratios before running ML re-inference
  const liveIncome = Number(overrides.monthlyIncome) || 0;
  const liveExpenses = Number(overrides.monthlyExpenses) || 0;
  const liveEmi = Number(overrides.monthlyEmi) || 0;
  const liveSurplus = Math.round(liveIncome - liveExpenses - liveEmi);
  const liveDti = liveIncome > 0 ? ((liveEmi / liveIncome) * 100).toFixed(1) : 0;
  const liveSavingsRate = liveIncome > 0 ? ((Math.max(0, liveSurplus) / liveIncome) * 100).toFixed(1) : 0;

  const baselineIncome = Number(baselineFinancials.monthlyIncome) || 0;
  const baselineExpenses = Number(baselineFinancials.monthlyExpenses) || 0;
  const baselineEmi = Number(baselineFinancials.monthlyEmi) || 0;
  const baselineSurplus = Math.round(baselineIncome - baselineExpenses - baselineEmi);
  const baselineDti = baselineIncome > 0 ? ((baselineEmi / baselineIncome) * 100).toFixed(1) : 0;

  // Handle slider / number changes
  const handleValueChange = (field, value) => {
    const num = Math.max(0, Number(value));
    setOverrides((prev) => ({ ...prev, [field]: num }));
  };

  // Quick adjustment presets
  const applyPreset = (presetType) => {
    switch (presetType) {
      case 'INCOME_BOOST_20':
        setOverrides((prev) => ({
          ...prev,
          monthlyIncome: Math.round(baselineFinancials.monthlyIncome * 1.2),
        }));
        break;
      case 'DEBT_REDUCTION_50':
        setOverrides((prev) => ({
          ...prev,
          monthlyEmi: Math.round(baselineFinancials.monthlyEmi * 0.5),
        }));
        break;
      case 'EXPENSE_TRIM_15':
        setOverrides((prev) => ({
          ...prev,
          monthlyExpenses: Math.round(baselineFinancials.monthlyExpenses * 0.85),
        }));
        break;
      case 'SAVINGS_BUFFER_BOOST':
        setOverrides((prev) => ({
          ...prev,
          averageBalance: Math.round(baselineFinancials.averageBalance + 25000),
        }));
        break;
      default:
        break;
    }
  };

  // Reset to baseline
  const handleReset = () => {
    setOverrides(baselineFinancials);
    setSimulationResult(null);
    if (showToast) {
      showToast('Scenario parameters reset to verified baseline values', 'info');
    }
  };

  // Run simulation via backend ML service
  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await api.runWhatIfScenario(applicationId, { overrides });
      setSimulationResult(res);
      if (showToast) {
        showToast('What-If simulation computed successfully!', 'success');
      }
    } catch (err) {
      if (showToast) {
        showToast(err.message || 'Failed to compute scenario simulation', 'error');
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const baselineScore =
    simulationResult?.baseline?.riskScore ?? baselineAssessment?.riskScore ?? 50;
  const scenarioScore = simulationResult?.scenario?.riskScore;
  const scoreDelta = scenarioScore !== undefined ? scenarioScore - baselineScore : 0;
  const baselineProb = (
    (simulationResult?.baseline?.defaultProbability ??
      baselineAssessment?.defaultProbability ??
      0.15) * 100
  ).toFixed(1);
  const scenarioProb =
    simulationResult?.scenario?.defaultProbability !== undefined
      ? (simulationResult.scenario.defaultProbability * 100).toFixed(1)
      : null;
  const probDelta = scenarioProb !== null ? (scenarioProb - baselineProb).toFixed(1) : null;

  return (
    <div
      className="glass-card"
      style={{
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        border: '1px solid rgba(99, 102, 241, 0.28)',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.85) 0%, rgba(13, 19, 34, 0.95) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow backdrop accent */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan)',
            }}
          >
            <SlidersHorizontal size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                What-If Scenario Simulator & Sensitivity Lab
              </h2>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                Phase 8 Counterfactual
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '4px', margin: 0 }}>
              Simulate cash-flow adjustments (income growth, expense reduction, or debt restructuring) to observe immediate score impact.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.725rem',
              color: 'var(--emerald)',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '4px 10px',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <ShieldCheck size={14} />
            <span>Authoritative Baseline Preserved</span>
          </span>
        </div>
      </div>

      {/* Quick Adjustment Presets */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Quick Scenario Presets:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', padding: '5px 12px', background: 'rgba(255, 255, 255, 0.03)' }}
            onClick={() => applyPreset('INCOME_BOOST_20')}
          >
            <TrendingUp size={13} style={{ color: 'var(--emerald)' }} />
            <span>+20% Gig Inflows</span>
          </button>
          <button
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', padding: '5px 12px', background: 'rgba(255, 255, 255, 0.03)' }}
            onClick={() => applyPreset('DEBT_REDUCTION_50')}
          >
            <TrendingDown size={13} style={{ color: 'var(--cyan)' }} />
            <span>-50% Debt EMI (Refinanced)</span>
          </button>
          <button
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', padding: '5px 12px', background: 'rgba(255, 255, 255, 0.03)' }}
            onClick={() => applyPreset('EXPENSE_TRIM_15')}
          >
            <TrendingDown size={13} style={{ color: 'var(--indigo)' }} />
            <span>-15% Living Expenses</span>
          </button>
          <button
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', padding: '5px 12px', background: 'rgba(255, 255, 255, 0.03)' }}
            onClick={() => applyPreset('SAVINGS_BUFFER_BOOST')}
          >
            <Sparkles size={13} style={{ color: 'var(--amber)' }} />
            <span>+₹25k Liquidity Buffer</span>
          </button>
        </div>
      </div>

      {/* Interactive Controls Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          background: 'rgba(0, 0, 0, 0.22)',
          padding: '20px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Parameter 1: Monthly Income */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Monthly Income (₹)
            </label>
            <input
              type="number"
              min="0"
              max="250000"
              step="1000"
              value={overrides.monthlyIncome}
              onChange={(e) => handleValueChange('monthlyIncome', e.target.value)}
              style={{
                width: '100px',
                padding: '4px 8px',
                fontSize: '0.85rem',
                textAlign: 'right',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
              }}
            />
          </div>
          <input
            type="range"
            min="10000"
            max="150000"
            step="1000"
            value={overrides.monthlyIncome}
            onChange={(e) => handleValueChange('monthlyIncome', e.target.value)}
            style={{ accentColor: 'var(--emerald)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            <span>₹10,000</span>
            <span>Baseline: ₹{baselineFinancials.monthlyIncome.toLocaleString('en-IN')}</span>
            <span>₹1,50,000</span>
          </div>
        </div>

        {/* Parameter 2: Monthly Expenses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Monthly Living Expenses (₹)
            </label>
            <input
              type="number"
              min="0"
              max="200000"
              step="500"
              value={overrides.monthlyExpenses}
              onChange={(e) => handleValueChange('monthlyExpenses', e.target.value)}
              style={{
                width: '100px',
                padding: '4px 8px',
                fontSize: '0.85rem',
                textAlign: 'right',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
              }}
            />
          </div>
          <input
            type="range"
            min="5000"
            max="100000"
            step="500"
            value={overrides.monthlyExpenses}
            onChange={(e) => handleValueChange('monthlyExpenses', e.target.value)}
            style={{ accentColor: 'var(--indigo)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            <span>₹5,000</span>
            <span>Baseline: ₹{baselineFinancials.monthlyExpenses.toLocaleString('en-IN')}</span>
            <span>₹1,00,000</span>
          </div>
        </div>

        {/* Parameter 3: Monthly Debt (EMI) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Committed Debt / EMI (₹)
            </label>
            <input
              type="number"
              min="0"
              max="100000"
              step="500"
              value={overrides.monthlyEmi}
              onChange={(e) => handleValueChange('monthlyEmi', e.target.value)}
              style={{
                width: '100px',
                padding: '4px 8px',
                fontSize: '0.85rem',
                textAlign: 'right',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
              }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="50000"
            step="500"
            value={overrides.monthlyEmi}
            onChange={(e) => handleValueChange('monthlyEmi', e.target.value)}
            style={{ accentColor: 'var(--rose)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            <span>₹0 (Debt-Free)</span>
            <span>Baseline: ₹{baselineFinancials.monthlyEmi.toLocaleString('en-IN')}</span>
            <span>₹50,000</span>
          </div>
        </div>

        {/* Parameter 4: Average Daily Balance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Average Daily Balance (₹)
            </label>
            <input
              type="number"
              min="0"
              max="200000"
              step="1000"
              value={overrides.averageBalance}
              onChange={(e) => handleValueChange('averageBalance', e.target.value)}
              style={{
                width: '100px',
                padding: '4px 8px',
                fontSize: '0.85rem',
                textAlign: 'right',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
              }}
            />
          </div>
          <input
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={overrides.averageBalance}
            onChange={(e) => handleValueChange('averageBalance', e.target.value)}
            style={{ accentColor: 'var(--cyan)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            <span>₹1,000</span>
            <span>Baseline: ₹{baselineFinancials.averageBalance.toLocaleString('en-IN')}</span>
            <span>₹1,00,000</span>
          </div>
        </div>
      </div>

      {/* Live Ratio Previews before simulation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '14px 18px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Projected Net Surplus</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: liveSurplus >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
            ₹{liveSurplus.toLocaleString('en-IN')}{' '}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              ({liveSurplus - baselineSurplus >= 0 ? '+' : ''}₹{(liveSurplus - baselineSurplus).toLocaleString('en-IN')})
            </span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Projected DTI Ratio</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: Number(liveDti) <= 35 ? 'var(--emerald)' : 'var(--amber)' }}>
            {liveDti}%{' '}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              (Baseline: {baselineDti}%)
            </span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Projected Savings Margin</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cyan)' }}>
            {liveSavingsRate}%
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
        <button
          className="btn btn-outline"
          onClick={handleReset}
          disabled={isSimulating}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <RotateCcw size={14} />
          <span>Reset to Baseline</span>
        </button>

        <button
          className="btn btn-primary"
          onClick={handleSimulate}
          disabled={isSimulating}
          style={{ padding: '8px 22px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isSimulating ? (
            <>
              <span className="spin">⚡</span>
              <span>Re-inferencing ML Model...</span>
            </>
          ) : (
            <>
              <Zap size={15} />
              <span>Simulate Scenario Score</span>
            </>
          )}
        </button>
      </div>

      {/* Simulation Results Section */}
      {simulationResult && (
        <div
          style={{
            marginTop: '8px',
            padding: '20px',
            borderRadius: 'var(--radius)',
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--cyan)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Counterfactual Simulation Outcome
              </h3>
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
              Scenario ID: <code style={{ color: 'var(--cyan)' }}>{simulationResult.scenarioId}</code>
            </span>
          </div>

          {/* Score Comparison Hero Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Baseline Card */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Official Baseline
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff' }}>
                  {baselineScore}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/100</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Default Probability: <strong>{baselineProb}%</strong> ({baselineAssessment?.riskBand || 'BASELINE'} Risk)
              </div>
            </div>

            {/* Simulated Score Card */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                  Simulated Scenario
                </div>
                {/* Score Delta Pill */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: scoreDelta >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                    color: scoreDelta >= 0 ? 'var(--emerald)' : 'var(--rose)',
                    border: scoreDelta >= 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(244, 63, 94, 0.4)',
                  }}
                >
                  {scoreDelta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} pts</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--cyan)' }}>
                  {scenarioScore}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/100</span>
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--cyan)',
                  }}
                >
                  {simulationResult.scenario?.riskBand} RISK
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Default Probability: <strong>{scenarioProb}%</strong>{' '}
                <span style={{ color: Number(probDelta) <= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                  ({Number(probDelta) <= 0 ? '' : '+'}{probDelta}%)
                </span>
              </div>
            </div>
          </div>

          {/* Underwriting Narrative Callout */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 0, 0, 0.3)',
              borderLeft: '3px solid var(--cyan)',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              lineHeight: 1.55,
            }}
          >
            <strong>Underwriting Impact Analysis: </strong>
            <span dangerouslySetInnerHTML={{
              __html: simulationResult.explanation
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }} />
          </div>

          {/* Changed Features Breakdown Table */}
          {simulationResult.changedFactors && simulationResult.changedFactors.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Feature Vector Parameter Deltas:
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                      <th style={{ padding: '6px 10px' }}>Financial Metric</th>
                      <th style={{ padding: '6px 10px' }}>Baseline</th>
                      <th style={{ padding: '6px 10px' }}>Simulated</th>
                      <th style={{ padding: '6px 10px' }}>Net Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationResult.changedFactors.map((c, idx) => {
                      const isMoney =
                        c.feature.toLowerCase().includes('income') ||
                        c.feature.toLowerCase().includes('expenses') ||
                        c.feature.toLowerCase().includes('emi') ||
                        c.feature.toLowerCase().includes('balance') ||
                        c.feature.toLowerCase().includes('surplus');
                      const prefix = isMoney ? '₹' : '';
                      const isPercent = c.feature.toLowerCase().includes('debttoincome');
                      const suffix = isPercent ? '%' : '';

                      const beforeDisplay = isPercent ? (c.before * 100).toFixed(1) : c.before.toLocaleString('en-IN');
                      const afterDisplay = isPercent ? (c.after * 100).toFixed(1) : c.after.toLocaleString('en-IN');

                      const diff = c.after - c.before;
                      const diffDisplay = isPercent ? (diff * 100).toFixed(1) : diff.toLocaleString('en-IN');

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#ffffff' }}>
                            {c.feature}
                          </td>
                          <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                            {prefix}{beforeDisplay}{suffix}
                          </td>
                          <td style={{ padding: '8px 10px', color: 'var(--cyan)', fontWeight: 600 }}>
                            {prefix}{afterDisplay}{suffix}
                          </td>
                          <td style={{ padding: '8px 10px', color: diff >= 0 ? 'var(--emerald)' : 'var(--amber)' }}>
                            {diff >= 0 ? '+' : ''}{prefix}{diffDisplay}{suffix}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
