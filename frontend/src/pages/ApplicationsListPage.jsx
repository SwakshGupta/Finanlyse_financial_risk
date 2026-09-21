import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  PlusCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  Search,
  RefreshCw,
  Zap,
} from 'lucide-react';

export default function ApplicationsListPage({ onSelectApplication, onNewApplication, showToast }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await api.listApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message || 'Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filtered = applications.filter((app) => {
    const term = searchTerm.toLowerCase();
    const name = app.applicant?.fullName?.toLowerCase() || '';
    const id = app.id?.toLowerCase() || '';
    return name.includes(term) || id.includes(term);
  });

  return (
    <div className="app-container">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Underwriting Applications</h1>
          <p className="page-subtitle">
            {user?.role === 'ANALYST'
              ? 'Institutional Credit Queue — Review and audit all submitted loan files'
              : 'Your submitted alternative credit assessments'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchApplications}
            disabled={loading}
            title="Refresh application list"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={onNewApplication}>
            <PlusCircle size={14} />
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Search size={16} color="var(--text-dim)" />
        <input
          type="text"
          placeholder="Search by applicant name or application ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            outline: 'none',
            fontSize: '0.9rem',
            width: '100%',
          }}
        />
      </div>

      {/* Application Table / Card List */}
      {loading ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
          <div>Loading credit applications...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Layers size={36} color="var(--text-dim)" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Applications Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', marginBottom: '20px' }}>
            {searchTerm ? 'No results matched your search term.' : 'Get started by running your first alternative risk assessment.'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={onNewApplication}>
            <PlusCircle size={14} />
            <span>Create Application</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((app) => {
            const isAssessed = app.status === 'ASSESSED';
            const dateStr = app.createdAt
              ? new Date(app.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent';

            return (
              <div
                key={app.id}
                className="glass-card"
                onClick={() => onSelectApplication(app.id, isAssessed)}
                style={{
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: isAssessed ? 'var(--emerald-surface)' : 'rgba(99, 102, 241, 0.15)',
                      border: `1px solid ${isAssessed ? 'var(--emerald-border)' : 'rgba(99, 102, 241, 0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isAssessed ? 'var(--emerald)' : 'var(--primary)',
                    }}
                  >
                    {isAssessed ? <CheckCircle2 size={22} /> : <User size={22} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                        {app.applicant?.fullName || 'Anonymous Applicant'}
                      </span>
                      <span
                        className={`badge ${
                          isAssessed ? 'badge-low' : 'badge-neutral'
                        }`}
                        style={{ fontSize: '0.65rem' }}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                      <span>ID: <code style={{ color: 'var(--cyan)' }}>{app.id}</code></span>
                      <span>•</span>
                      <span>{app.applicant?.employmentType || 'Undisclosed Segment'}</span>
                      <span>•</span>
                      <span><Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />{dateStr}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    className={`btn btn-sm ${isAssessed ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ pointerEvents: 'none' }}
                  >
                    {isAssessed ? (
                      <>
                        <span>View Risk Report</span>
                        <ChevronRight size={14} />
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        <span>Assess</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
