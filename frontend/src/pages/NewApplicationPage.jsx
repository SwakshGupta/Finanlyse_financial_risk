import React, { useState } from 'react';
import api from '../services/api';
import confetti from 'canvas-confetti';
import {
  User,
  Briefcase,
  Phone,
  FileSpreadsheet,
  Zap,
  SlidersHorizontal,
  Check,
  ArrowRight,
  TrendingUp,
  Percent,
  Wallet,
  Sparkles,
} from 'lucide-react';

export default function NewApplicationPage({ onAssessmentComplete, showToast }) {
  const [applicant, setApplicant] = useState({
    fullName: 'Arjun Verma',
    phone: '+919876543210',
    employmentType: 'GIG_WORKER',
  });

  const [consentGranted, setConsentGranted] = useState(true);
  const [ingestionMode, setIngestionMode] = useState('SYNTHETIC'); // 'SYNTHETIC' | 'MANUAL' | 'CSV'

  // Synthetic preset selection
  const [selectedPreset, setSelectedPreset] = useState('THIN_FILE_GIG_WORKER');

  // Manual Profile State
  const [manualProfile, setManualProfile] = useState({
    monthlyIncome: 42000,
    monthlyExpenses: 22000,
    monthlyEmi: 3500,
    averageBalance: 14000,
  });

  // CSV State
  const [csvContent, setCsvContent] = useState(`date,amount,direction,category,description
2026-03-01,42000,CREDIT,INCOME,Platform Weekly Earnings
2026-03-05,12000,DEBIT,EXPENSE,Grocery and Living
2026-03-10,3500,DEBIT,EMI,Two-Wheeler Loan EMI
2026-03-15,4000,DEBIT,UTILITY,Electricity & Mobile
2026-03-20,42000,CREDIT,INCOME,Platform Weekly Earnings
2026-03-25,10000,DEBIT,EXPENSE,Rent Payment`);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [createdApplicationId, setCreatedApplicationId] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);

  // Calculate live preview metrics for manual inputs
  const previewSurplus = manualProfile.monthlyIncome - manualProfile.monthlyExpenses - manualProfile.monthlyEmi;
  const previewDti = manualProfile.monthlyIncome > 0
    ? ((manualProfile.monthlyEmi / manualProfile.monthlyIncome) * 100).toFixed(1)
    : 0;
  const previewSavingsRate = manualProfile.monthlyIncome > 0
    ? (((manualProfile.monthlyIncome - manualProfile.monthlyExpenses) / manualProfile.monthlyIncome) * 100).toFixed(1)
    : 0;

  // Step 1: Create Application
  const handleCreateApplication = async (e) => {
    e.preventDefault();
    if (!consentGranted) {
      showToast('Mandatory underwriting consent is required to proceed.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        applicant: {
          fullName: applicant.fullName,
          phone: applicant.phone,
          employmentType: applicant.employmentType,
        },
        consent: [
          {
            purpose: 'UNDERWRITING',
            granted: true,
            version: '1.0',
            dataSources: [ingestionMode === 'SYNTHETIC' ? 'SYNTHETIC_DATA' : ingestionMode === 'CSV' ? 'CSV_UPLOAD' : 'MANUAL_INPUT'],
          },
        ],
        dataSource: ingestionMode === 'SYNTHETIC' ? 'SYNTHETIC' : 'MANUAL_INPUT',
      };

      const app = await api.createApplication(payload);
      setCreatedApplicationId(app.id);
      showToast(`Application created: ${app.id}`, 'success');
      setStep(2);
    } catch (err) {
      showToast(err.message || 'Failed to create application', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Ingest Financial Data
  const handleIngestFinancialData = async () => {
    if (!createdApplicationId) return;

    setLoading(true);
    try {
      if (ingestionMode === 'SYNTHETIC') {
        await api.ingestSyntheticPreset(createdApplicationId, selectedPreset);
        showToast(`Loaded ${selectedPreset} preset into application`, 'success');
      } else if (ingestionMode === 'MANUAL') {
        await api.submitFinancialProfile(createdApplicationId, {
          monthlyIncome: Number(manualProfile.monthlyIncome),
          monthlyExpenses: Number(manualProfile.monthlyExpenses),
          monthlyEmi: Number(manualProfile.monthlyEmi),
          averageBalance: Number(manualProfile.averageBalance),
          currency: 'INR',
        });
        showToast('Financial profile saved successfully', 'success');
      } else if (ingestionMode === 'CSV') {
        await api.uploadCsvTransactions(createdApplicationId, csvContent);
        showToast('CSV statements processed successfully', 'success');
      }

      // Fetch computed canonical summary
      const summary = await api.getFinancialSummary(createdApplicationId);
      setFinancialSummary(summary);
      setStep(3);
    } catch (err) {
      showToast(err.message || 'Failed to ingest financial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Run Assessment
  const handleRunAssessment = async () => {
    if (!createdApplicationId) return;

    setLoading(true);
    try {
      const assessmentResult = await api.runAssessment(createdApplicationId);
      showToast('Risk assessment computed by ML service!', 'success');

      // Celebration confetti for completed assessment
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#06b6d4', '#f59e0b'],
      });

      if (onAssessmentComplete) {
        onAssessmentComplete(assessmentResult);
      }
    } catch (err) {
      showToast(err.message || 'Failed to run risk assessment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1 className="page-title" style={{ justifyContent: 'center' }}>
          New Underwriting Assessment
        </h1>
        <p className="page-subtitle">
          Intake consented alternative behavioral data for thin-file & underserved applicants
        </p>
      </div>

      {/* Progress Steps Indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '36px',
        }}
      >
        {[
          { num: 1, label: 'Applicant Profile' },
          { num: 2, label: 'Financial Data' },
          { num: 3, label: 'Assess & Predict' },
        ].map((s) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step === s.num ? 'var(--primary)' : step > s.num ? 'var(--emerald)' : 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: step === s.num ? '0 0 15px var(--primary-glow)' : 'none',
              }}
            >
              {step > s.num ? <Check size={16} /> : s.num}
            </div>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: step >= s.num ? 'var(--text-main)' : 'var(--text-dim)',
              }}
            >
              {s.label}
            </span>
            {s.num < 3 && (
              <div style={{ width: '40px', height: '2px', background: step > s.num ? 'var(--emerald)' : 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: Applicant Profile & Underwriting Consent */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Applicant Information</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Basic borrower profile & consented inclusion parameters
              </span>
            </div>
          </div>

          <form onSubmit={handleCreateApplication}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">
                  <span>Full Legal Name</span>
                  <User size={14} color="var(--text-dim)" />
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={applicant.fullName}
                  onChange={(e) => setApplicant({ ...applicant, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Phone Number</span>
                  <Phone size={14} color="var(--text-dim)" />
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={applicant.phone}
                  onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label className="form-label">
                <span>Employment & Income Segment</span>
                <Briefcase size={14} color="var(--text-dim)" />
              </label>
              <select
                className="form-control"
                value={applicant.employmentType}
                onChange={(e) => setApplicant({ ...applicant, employmentType: e.target.value })}
              >
                <option value="GIG_WORKER">Gig Economy Worker (Platform / Delivery Partner)</option>
                <option value="SALARIED">New-to-Credit Salaried Professional</option>
                <option value="SELF_EMPLOYED">Self-Employed Micro-Entrepreneur / Merchant</option>
                <option value="CONTRACT">Contract Worker / Freelancer</option>
              </select>
            </div>

            {/* Mandatory Fair Lending Consent */}
            <div
              style={{
                marginTop: '24px',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
              }}
            >
              <input
                type="checkbox"
                id="consentCheck"
                checked={consentGranted}
                onChange={(e) => setConsentGranted(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '3px', accentColor: 'var(--primary)' }}
              />
              <label htmlFor="consentCheck" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer', lineHeight: 1.5 }}>
                <strong>Explicit Underwriting & Alternative Data Consent:</strong> I authorize the platform to analyze my consented cash flow, transaction regularity, and alternative financial behaviors for the purpose of credit risk assessment under fair lending standards.
              </label>
            </div>

            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <span>{loading ? 'Creating...' : 'Continue to Financial Ingestion'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Financial Data Ingestion (Synthetic Presets, Manual, or CSV) */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Financial Data Ingestion</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Application ID: <code style={{ color: 'var(--cyan)' }}>{createdApplicationId}</code>
              </span>
            </div>

            {/* Ingestion Mode Tabs */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(0,0,0,0.3)',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setIngestionMode('SYNTHETIC')}
                style={{
                  background: ingestionMode === 'SYNTHETIC' ? 'var(--primary)' : 'transparent',
                  color: ingestionMode === 'SYNTHETIC' ? '#fff' : 'var(--text-muted)',
                }}
              >
                <Zap size={14} /> Synthetic Presets
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setIngestionMode('MANUAL')}
                style={{
                  background: ingestionMode === 'MANUAL' ? 'var(--primary)' : 'transparent',
                  color: ingestionMode === 'MANUAL' ? '#fff' : 'var(--text-muted)',
                }}
              >
                <SlidersHorizontal size={14} /> Manual Form
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setIngestionMode('CSV')}
                style={{
                  background: ingestionMode === 'CSV' ? 'var(--primary)' : 'transparent',
                  color: ingestionMode === 'CSV' ? '#fff' : 'var(--text-muted)',
                }}
              >
                <FileSpreadsheet size={14} /> Statement CSV
              </button>
            </div>
          </div>

          {/* Mode A: Synthetic Personas */}
          {ingestionMode === 'SYNTHETIC' && (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Select a calibrated financial persona to test alternative underwriting models without manual data entry:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {[
                  {
                    id: 'THIN_FILE_GIG_WORKER',
                    title: 'Gig Delivery Partner',
                    income: '₹38,000 / mo',
                    badge: 'Thin-File Active',
                    description: 'Weekly delivery payouts, moderate fuel/vehicle expenses, zero traditional bureau track record.',
                  },
                  {
                    id: 'NEW_TO_CREDIT_SALARIED',
                    title: 'Junior IT Associate',
                    income: '₹55,000 / mo',
                    badge: 'New to Credit',
                    description: 'Direct corporate payroll deposits, low debt ratio, disciplined digital savings rate.',
                  },
                  {
                    id: 'MICRO_ENTREPRENEUR',
                    title: 'Kirana Store Merchant',
                    income: '₹68,000 / mo',
                    badge: 'Alternative UPI',
                    description: 'Daily QR merchant credits, steady inventory turnover, no formal commercial loan history.',
                  },
                ].map((preset) => {
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id)}
                      style={{
                        padding: '18px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>{preset.title}</span>
                        <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>{preset.badge}</span>
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--cyan)', fontWeight: 600, marginBottom: '6px' }}>
                        Est. Inflow: {preset.income}
                      </div>
                      <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {preset.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode B: Manual Entry */}
          {ingestionMode === 'MANUAL' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                <div className="form-group">
                  <label className="form-label">Monthly Gross Inflow (INR)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={manualProfile.monthlyIncome}
                    onChange={(e) => setManualProfile({ ...manualProfile, monthlyIncome: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Living Expenses (INR)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={manualProfile.monthlyExpenses}
                    onChange={(e) => setManualProfile({ ...manualProfile, monthlyExpenses: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Existing Monthly Loan/EMI Obligations (INR)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={manualProfile.monthlyEmi}
                    onChange={(e) => setManualProfile({ ...manualProfile, monthlyEmi: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Average Account Balance (INR)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={manualProfile.averageBalance}
                    onChange={(e) => setManualProfile({ ...manualProfile, averageBalance: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Real-time Derived Canonical Indicators Preview */}
              <div
                style={{
                  marginTop: '18px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Net Cash Surplus</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: previewSurplus >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                    ₹{previewSurplus.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Debt-to-Income</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: Number(previewDti) > 40 ? 'var(--rose)' : 'var(--cyan)' }}>
                    {previewDti}%
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Savings Rate</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--emerald)' }}>
                    {previewSavingsRate}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode C: CSV Upload */}
          {ingestionMode === 'CSV' && (
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>
                Bank Statement CSV Content (date, amount, direction, category, description)
              </label>
              <textarea
                className="form-control"
                rows={8}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.825rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Rows with CREDIT increase income; DEBIT with category EMI indicate existing debt obligations.
              </span>
            </div>
          )}

          <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button type="button" className="btn btn-primary" onClick={handleIngestFinancialData} disabled={loading}>
              <span>{loading ? 'Processing Data...' : 'Verify & Continue'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Verification & Assessment Trigger */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Sparkles size={28} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Financial Ingestion Complete</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '8px auto 24px' }}>
            Canonical metrics computed successfully. The application is verified and ready for authoritative ML risk scoring.
          </p>

          {/* Canonical Metric Pills */}
          {financialSummary && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
                maxWidth: '700px',
                margin: '0 auto 32px',
                textAlign: 'left',
              }}
            >
              <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Monthly Inflow</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>₹{Number(financialSummary.monthlyIncome).toLocaleString()}</div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Net Cash Surplus</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--emerald)' }}>₹{Number(financialSummary.cashFlowSurplus).toLocaleString()}</div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Debt Burden (DTI)</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--cyan)' }}>{(Number(financialSummary.debtToIncome) * 100).toFixed(1)}%</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
              Adjust Data
            </button>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleRunAssessment}
              disabled={loading}
              style={{ padding: '16px 36px', fontSize: '1.05rem' }}
            >
              <Zap size={20} />
              <span>{loading ? 'Executing ML Inference...' : 'Run Alternative Risk Assessment'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
