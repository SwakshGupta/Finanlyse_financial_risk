import React from 'react';
import ScoreGauge from '../components/ScoreGauge';
import RiskFactorCard from '../components/RiskFactorCard';
import DataCoverageCard from '../components/DataCoverageCard';
import AIExplanationCard from '../components/AIExplanationCard';
import AssessmentChatDrawer from '../components/AssessmentChatDrawer';
import { ArrowLeft, CheckCircle, AlertTriangle, AlertCircle, PlusCircle, Layers, FileText } from 'lucide-react';

export default function AssessmentDashboardPage({ assessment, onNewAssessment, onViewApplications, showToast }) {
  if (!assessment) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2>No Assessment Loaded</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '24px' }}>
          Please select an application or run a new risk evaluation.
        </p>
        <button className="btn btn-primary" onClick={onNewAssessment}>
          <PlusCircle size={16} />
          <span>Start Assessment</span>
        </button>
      </div>
    );
  }

  const {
    assessmentId,
    applicationId,
    riskScore,
    defaultProbability,
    riskBand,
    model,
    factors,
    dataCoverage,
    assessedAt,
  } = assessment;

  // Determine recommendation card based on Risk Band
  let recTitle = 'Recommended for Underwriting Approval';
  let recDesc =
    'Applicant demonstrates resilient digital cash flows, consistent surplus margins, and low leverage burden. Qualifies for standard alternative credit facilities.';
  let recClass = 'toast-success';
  let RecIcon = CheckCircle;
  let recColor = 'var(--emerald)';

  if (riskBand === 'HIGH' || riskScore < 50) {
    recTitle = 'High Risk — Analyst Discretionary Review Advised';
    recDesc =
      'Elevated debt obligations or past cash flow volatility identified. Recommend lower exposure limits, escrow mechanisms, or guarantor requirement.';
    recClass = 'toast-error';
    RecIcon = AlertCircle;
    recColor = 'var(--rose)';
  } else if (riskBand === 'MODERATE' || riskScore < 75) {
    recTitle = 'Conditionally Approved with Monitoring';
    recDesc =
      'Balanced cash flows with moderate debt commitments. Recommended for introductory credit line with continuous transaction monitoring.';
    recClass = 'toast-info';
    RecIcon = AlertTriangle;
    recColor = 'var(--amber)';
  }

  const formattedDate = assessedAt
    ? new Date(assessedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Just now';

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Dashboard Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-sm btn-outline"
              onClick={onViewApplications}
              style={{ padding: '6px 10px' }}
              title="Back to applications"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Risk Assessment Report</h1>
            <span className="badge badge-low" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              ASSESSED
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Application: <code style={{ color: 'var(--cyan)' }}>{applicationId}</code> • Assessment ID: <code style={{ color: 'var(--text-dim)' }}>{assessmentId}</code> • {formattedDate}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={onViewApplications}>
            <Layers size={14} />
            <span>All Applications</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={onNewAssessment}>
            <PlusCircle size={14} />
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {/* Hero Section: Gauge & Underwriting Recommendation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        <ScoreGauge score={riskScore} defaultProbability={defaultProbability} riskBand={riskBand} />

        {/* Underwriting Recommendation Card */}
        <div
          className="glass-card"
          style={{
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `rgba(${riskBand === 'HIGH' ? '244, 63, 94' : riskBand === 'MODERATE' ? '245, 158, 11' : '16, 185, 129'}, 0.15)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: recColor,
                }}
              >
                <RecIcon size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Underwriting Recommendation
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                  {recTitle}
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '8px' }}>
              {recDesc}
            </p>
          </div>

          <div
            style={{
              marginTop: '20px',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Alternative Scoring Model
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                {model?.name || 'Logistic Regression Alternative Risk Baseline'}
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', fontFamily: 'monospace' }}>
              {model?.version || 'v1.0.0'}
            </span>
          </div>
        </div>
      </div>

      {/* Grounded AI Underwriting Narrative (Gemini / Provider-Agnostic) */}
      <AIExplanationCard
        applicationId={applicationId}
        initialExplanation={assessment.explanation}
        showToast={showToast}
      />

      {/* Interactive AI Credit Advisor Chat */}
      <AssessmentChatDrawer
        applicationId={applicationId}
        showToast={showToast}
      />

      {/* Model-Derived Positive & Negative Drivers */}
      <div>
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Explainable Risk Drivers</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Mathematical factor contributions calculated directly from logistic regression weights
          </p>
        </div>
        <RiskFactorCard factors={factors} />
      </div>

      {/* Data Coverage & Model Governance */}
      <div>
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Inclusion & Architecture Audit</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Data inputs verification and regulatory fair-lending governance
          </p>
        </div>
        <DataCoverageCard dataCoverage={dataCoverage} model={model} />
      </div>
    </div>
  );
}
