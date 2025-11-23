import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  FileText, 
  Calendar, 
  DollarSign, 
  Shield
} from 'lucide-react';
import { patientAPI } from '../services/patientAPI';
import './Dashboard.css';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activePatients: 0,
    pendingPatients: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await patientAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };


  const quickStats = [
    { 
      icon: Users, 
      label: 'Active Patients', 
      value: stats.activePatients || '0', 
      color: '#3b82f6',
      onClick: () => navigate('/patients')
    },
    { 
      icon: Users, 
      label: 'Pending Intake', 
      value: stats.pendingPatients || '0', 
      color: '#f59e0b',
      onClick: () => navigate('/patients')
    },
    { 
      icon: FileText, 
      label: 'Pending OASIS QA', 
      value: '0', 
      color: '#10b981',
      onClick: () => navigate('/oasis/qa-review')
    },
    { 
      icon: Calendar, 
      label: 'Today\'s Visits', 
      value: '0', 
      color: '#8b5cf6',
      comingSoon: true
    },
  ];

  const quickActions = [
    { 
      title: 'Patient Intake', 
      description: 'Add new patient and create referral',
      icon: Users,
      color: '#3b82f6',
      available: hasRole('INTAKE_COORDINATOR') || hasRole('ORG_ADMIN') || hasRole('SYSTEM_ADMIN'),
      onClick: () => navigate('/patients/new')
    },
    { 
      title: 'View Patients', 
      description: 'View and manage patient records',
      icon: Users,
      color: '#10b981',
      available: true,
      onClick: () => navigate('/patients')
    },
    { 
      title: 'OASIS Assessment', 
      description: 'Complete OASIS-E1 documentation',
      icon: FileText,
      color: '#10b981',
      available: hasRole('RN') || hasRole('PT') || hasRole('ORG_ADMIN') || hasRole('SYSTEM_ADMIN'),
      onClick: () => navigate('/patients')
    },
    { 
      title: 'QA Review', 
      description: 'Review and approve OASIS assessments',
      icon: Shield,
      color: '#8b5cf6',
      available: hasRole('QA_REVIEWER') || hasRole('ORG_ADMIN') || hasRole('SYSTEM_ADMIN'),
      onClick: () => navigate('/oasis/qa-review')
    },
    { 
      title: 'Schedule Visit', 
      description: 'Schedule patient visits',
      icon: Calendar,
      color: '#f59e0b',
      available: hasRole('SCHEDULER') || hasRole('ORG_ADMIN') || hasRole('SYSTEM_ADMIN'),
      comingSoon: true
    },
    { 
      title: 'Billing', 
      description: 'Process claims and billing',
      icon: DollarSign,
      color: '#8b5cf6',
      available: hasRole('BILLING_SPECIALIST') || hasRole('ORG_ADMIN') || hasRole('SYSTEM_ADMIN'),
      comingSoon: true
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Welcome Section */}
          <section className="welcome-section">
            <h2 className="section-title">Welcome back, {user?.firstName || user?.username}!</h2>
            <p className="section-subtitle">
              Here's what's happening with your home health care operations today.
            </p>
          </section>

          {/* Quick Stats */}
          <section className="stats-section">
            <div className="stats-grid">
              {quickStats.map((stat, index) => (
                <div 
                  key={index} 
                  className={`stat-card ${stat.onClick && !stat.comingSoon ? 'clickable' : ''}`}
                  onClick={stat.onClick && !stat.comingSoon ? stat.onClick : undefined}
                >
                  <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                    <stat.icon size={24} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">{stat.label}</p>
                    <p className="stat-value">{stat.value}</p>
                  </div>
                  {stat.comingSoon && (
                    <span className="coming-soon-badge-small">Soon</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="actions-section">
            <h3 className="section-title">Quick Actions</h3>
            <div className="actions-grid">
              {quickActions.filter(action => action.available).map((action, index) => (
                <div 
                  key={index} 
                  className={`action-card ${action.comingSoon ? 'coming-soon' : ''}`}
                  onClick={() => !action.comingSoon && action.onClick && action.onClick()}
                >
                  <div className="action-icon" style={{ backgroundColor: `${action.color}15`, color: action.color }}>
                    <action.icon size={28} />
                  </div>
                  <h4 className="action-title">{action.title}</h4>
                  <p className="action-description">{action.description}</p>
                  {action.comingSoon && (
                    <span className="coming-soon-badge">Coming Soon</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Phase Information */}
          <section className="info-section">
            <div className="info-card">
              <h3 className="info-title">🎉 Phase 2 - OASIS Assessment Complete!</h3>
              <p className="info-text">
                OASIS-E1 Assessment module is now fully functional! Complete comprehensive assessments 
                with auto-save, skip logic, and QA workflow.
              </p>
              <div className="info-features">
                <div className="feature-item">✅ OASIS-E1 Form (17 Sections)</div>
                <div className="feature-item">✅ Auto-save Every 15 Seconds</div>
                <div className="feature-item">✅ Dynamic Skip Logic</div>
                <div className="feature-item">✅ Progress Tracking</div>
                <div className="feature-item">✅ QA Workflow (Submit/Approve/Reject)</div>
                <div className="feature-item">✅ Section-wise Navigation</div>
              </div>
              <p className="info-next">
                <strong>Next Phase:</strong> Plan of Care (POC) Generation
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
