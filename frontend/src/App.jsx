import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import NewApplicationPage from './pages/NewApplicationPage';
import AssessmentDashboardPage from './pages/AssessmentDashboardPage';
import ApplicationsListPage from './pages/ApplicationsListPage';
import api from './services/api';
import { CheckCircle, AlertCircle, Info, RefreshCw } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('applications'); // 'applications' | 'new-app' | 'assessment'
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleAssessmentComplete = (assessmentData) => {
    setCurrentAssessment(assessmentData);
    setActivePage('assessment');
  };

  const handleSelectApplication = async (applicationId, isAssessed) => {
    if (isAssessed) {
      try {
        const assessmentData = await api.getAssessment(applicationId);
        setCurrentAssessment(assessmentData);
        setActivePage('assessment');
      } catch (err) {
        showToast(err.message || 'Failed to load assessment', 'error');
      }
    } else {
      // Navigate to assessment flow for this app
      setActivePage('new-app');
      showToast('Please submit financial data to assess this application', 'info');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <RefreshCw size={36} color="var(--primary)" className="spin" />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading Finalyse Platform...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar activePage="auth" setActivePage={() => {}} />
        <AuthPage onAuthSuccess={() => setActivePage('applications')} showToast={showToast} />
        {renderToasts(toasts)}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main style={{ flex: 1, padding: '10px 0 40px' }}>
        {activePage === 'applications' && (
          <ApplicationsListPage
            onSelectApplication={handleSelectApplication}
            onNewApplication={() => setActivePage('new-app')}
            showToast={showToast}
          />
        )}

        {activePage === 'new-app' && (
          <NewApplicationPage
            onAssessmentComplete={handleAssessmentComplete}
            showToast={showToast}
          />
        )}

        {activePage === 'assessment' && (
          <AssessmentDashboardPage
            assessment={currentAssessment}
            onNewAssessment={() => setActivePage('new-app')}
            onViewApplications={() => setActivePage('applications')}
            showToast={showToast}
          />
        )}
      </main>

      {/* Global Toast Container */}
      {renderToasts(toasts)}
    </div>
  );
}

function renderToasts(toasts) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let Icon = Info;
        let toastClass = 'toast-info';
        if (toast.type === 'success') {
          Icon = CheckCircle;
          toastClass = 'toast-success';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          toastClass = 'toast-error';
        }

        return (
          <div key={toast.id} className={`toast ${toastClass}`}>
            <Icon size={18} style={{ flexShrink: 0 }} />
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
