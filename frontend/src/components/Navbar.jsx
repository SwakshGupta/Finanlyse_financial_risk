import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, LogOut, PlusCircle, Layers, Activity } from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, logout, backendHealthy } = useAuth();

  return (
    <header className="glass-panel" style={{ margin: '16px 20px 0', padding: '14px 24px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <div
          onClick={() => setActivePage('applications')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
            }}
          >
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
                Finalyse
              </span>
              <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 700 }}>
                ML v1.0
              </span>
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 500 }}>
              AI Financial Inclusion Platform
            </div>
          </div>
        </div>

        {/* Navigation & Health */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {/* Health Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                color: backendHealthy ? 'var(--emerald)' : 'var(--rose)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: backendHealthy ? 'var(--emerald-surface)' : 'var(--rose-surface)',
                border: `1px solid ${backendHealthy ? 'var(--emerald-border)' : 'var(--rose-border)'}`,
              }}
              title={backendHealthy ? 'Backend & ML services online' : 'Backend connection disconnected'}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: backendHealthy ? 'var(--emerald)' : 'var(--rose)',
                  boxShadow: backendHealthy ? '0 0 8px var(--emerald)' : 'none',
                }}
              />
              {backendHealthy ? 'Services Online' : 'Services Offline'}
            </div>

            {/* Nav links */}
            <button
              className={`btn btn-sm ${activePage === 'new-app' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActivePage('new-app')}
            >
              <PlusCircle size={15} />
              <span>New Assessment</span>
            </button>

            <button
              className={`btn btn-sm ${activePage === 'applications' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActivePage('applications')}
            >
              <Layers size={15} />
              <span>Applications</span>
            </button>

            {/* User Profile Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: user.role === 'ANALYST' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: user.role === 'ANALYST' ? 'var(--cyan)' : 'var(--primary)',
                }}
              >
                <User size={14} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {user.email.split('@')[0]}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: user.role === 'ANALYST' ? 'var(--cyan)' : '#a5b4fc',
                    textTransform: 'uppercase',
                  }}
                >
                  {user.role}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              className="btn btn-sm btn-outline"
              onClick={logout}
              title="Sign Out"
              style={{ padding: '8px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Underwriting Portal</span>
          </div>
        )}
      </div>
    </header>
  );
}
