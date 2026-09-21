import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, UserCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function AuthPage({ onAuthSuccess, showToast }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('APPLICANT');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please provide both email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        showToast('Successfully logged in!', 'success');
      } else {
        await register(email, password, role);
        showToast('Account registered successfully!', 'success');
      }
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (targetRole) => {
    if (targetRole === 'APPLICANT') {
      setEmail('borrower.demo@example.com');
      setPassword('password12345');
      setRole('APPLICANT');
    } else {
      setEmail('credit.analyst@example.com');
      setPassword('password12345');
      setRole('ANALYST');
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px 32px',
          position: 'relative',
        }}
      >
        {/* Glow Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Shield size={28} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            {isLogin ? 'Welcome to Finalyse' : 'Create an Account'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {isLogin
              ? 'Access the dynamic alternative risk assessment engine'
              : 'Empowering financial inclusion with verifiable AI'}
          </p>
        </div>

        {/* Tab switch */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              background: isLogin ? 'var(--primary)' : 'transparent',
              color: isLogin ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              background: !isLogin ? 'var(--primary)' : 'transparent',
              color: !isLogin ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <span>Email Address</span>
              <Mail size={14} color="var(--text-dim)" />
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>Password</span>
              <Lock size={14} color="var(--text-dim)" />
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">
                <span>Account Role</span>
                <UserCheck size={14} color="var(--text-dim)" />
              </label>
              <select
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="APPLICANT">Applicant / Borrower</option>
                <option value="ANALYST">Credit Risk Analyst</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '10px' }}
          >
            {loading ? (
              'Authenticating...'
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Fill Demo Credentials */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Sparkles size={14} color="#818cf8" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Developer Quick-Fill Demo Personas
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleQuickFill('APPLICANT')}
              style={{ fontSize: '0.75rem' }}
            >
              Applicant Persona
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleQuickFill('ANALYST')}
              style={{ fontSize: '0.75rem' }}
            >
              Credit Analyst
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
