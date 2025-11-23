import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  FileText, 
  Calendar, 
  DollarSign, 
  Shield,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ClipboardList,
  Stethoscope,
  ArrowRight
} from 'lucide-react';
import { patientAPI } from '../services/patientAPI';
import { getMyRejectedAssessments as getMyRejectedAssessmentsOld } from '../services/oasisAPI';
import { getMyRejectedAssessments as getMyRejectedAssessmentsComplete } from '../services/oasisCompleteAPI';
import { taskAPI } from '../services/taskAPI';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activePatients: 0,
    pendingPatients: 0,
  });
  const [rejectedAssessments, setRejectedAssessments] = useState([]);
  const [loadingRejected, setLoadingRejected] = useState(false);
  
  // RN-specific stats
  const [rnStats, setRnStats] = useState({
    assignedPatients: 0,
    todayTasks: 0,
    upcomingTasks: 0,
    completedToday: 0,
    overdueTasks: 0,
    pendingOASIS: 0,
    pendingPOC: 0,
  });
  const [todayTasks, setTodayTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check user roles
  const isRN = hasRole('RN') || hasRole('ROLE_RN');
  const isPT = hasRole('PT') || hasRole('ROLE_PT');
  const hasQAAccess = hasRole('QA_NURSE') || 
                      hasRole('ROLE_QA_NURSE') || 
                      hasRole('CLINICAL_MANAGER') || 
                      hasRole('ROLE_CLINICAL_MANAGER') ||
                      hasRole('ORG_ADMIN') || 
                      hasRole('ROLE_ORG_ADMIN') ||
                      hasRole('SYSTEM_ADMIN') || 
                      hasRole('ROLE_SYSTEM_ADMIN');

  useEffect(() => {
    loadStats();
    // Load rejected assessments for RN/PT users
    if (isRN || isPT) {
      loadRejectedAssessments();
    }
    // Load RN-specific data
    if (isRN) {
      loadRNDashboardData();
    }
  }, [user, isRN, isPT]);

  const loadStats = async () => {
    try {
      const response = await patientAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRejectedAssessments = async () => {
    try {
      setLoadingRejected(true);
      // Load rejected assessments from both old and new OASIS forms
      const [oldAssessments, completeAssessments] = await Promise.all([
        getMyRejectedAssessmentsOld().catch(() => []),
        getMyRejectedAssessmentsComplete().catch(() => [])
      ]);
      
      // Combine both arrays and ensure they're arrays
      const oldArray = Array.isArray(oldAssessments) ? oldAssessments : [];
      const completeArray = Array.isArray(completeAssessments) ? completeAssessments : [];
      
      // Combine and deduplicate by ID (in case same assessment exists in both)
      const allAssessments = [...oldArray, ...completeArray];
      const uniqueAssessments = allAssessments.filter((assessment, index, self) =>
        index === self.findIndex(a => a.id === assessment.id)
      );
      
      setRejectedAssessments(uniqueAssessments);
    } catch (error) {
      console.error('Error loading rejected assessments:', error);
      // Don't show error toast - this is optional information
      setRejectedAssessments([]);
    } finally {
      setLoadingRejected(false);
    }
  };

  const loadRNDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      // Load all RN tasks
      const [myTasksResponse, overdueResponse, todayTasksResponse] = await Promise.all([
        taskAPI.getMyTasks().catch(() => ({ data: [] })),
        taskAPI.getOverdue().catch(() => ({ data: [] })),
        taskAPI.getDueToday().catch(() => ({ data: [] })),
      ]);

      const allTasks = myTasksResponse.data || [];
      const overdue = overdueResponse.data || [];
      const todayTasks = todayTasksResponse.data || [];

      // Filter upcoming tasks (next 7 days)
      const upcoming = allTasks.filter(task => {
        if (!task.scheduledDate) return false;
        const taskDate = new Date(task.scheduledDate).toISOString().split('T')[0];
        return taskDate > today && taskDate <= nextWeekStr && 
               task.status !== 'COMPLETED' && 
               task.status !== 'CANCELLED';
      });

      // Count completed tasks today
      const completedToday = allTasks.filter(task => {
        if (task.status !== 'COMPLETED' || !task.completedAt) return false;
        const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
        return completedDate === today;
      }).length;

      // Load assigned patients
      const patientsResponse = await patientAPI.getAll().catch(() => ({ data: [] }));
      const assignedPatients = (patientsResponse.data || []).filter(p => 
        p.admittingClinicianId === user?.id || p.status === 'ACTIVE'
      );

      setRnStats({
        assignedPatients: assignedPatients.length,
        todayTasks: todayTasks.length,
        upcomingTasks: upcoming.length,
        completedToday: completedToday,
        overdueTasks: overdue.length,
        pendingOASIS: 0, // Will be loaded separately if needed
        pendingPOC: 0, // Will be loaded separately if needed
      });

      setTodayTasks(todayTasks.slice(0, 5));
      setUpcomingTasks(upcoming.slice(0, 5));
      setOverdueTasks(overdue.slice(0, 5));
    } catch (error) {
      console.error('Error loading RN dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };


  // RN-specific dashboard cards
  const rnDashboardCards = [
    { 
      icon: Users, 
      label: 'My Patients', 
      value: rnStats.assignedPatients, 
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      onClick: () => navigate('/patients'),
      description: 'Assigned to me'
    },
    { 
      icon: Calendar, 
      label: 'Today\'s Tasks', 
      value: rnStats.todayTasks, 
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      onClick: () => navigate('/schedule-center'),
      description: 'Scheduled for today'
    },
    { 
      icon: Clock, 
      label: 'Upcoming', 
      value: rnStats.upcomingTasks, 
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      onClick: () => navigate('/schedule-center'),
      description: 'Next 7 days'
    },
    { 
      icon: CheckCircle2, 
      label: 'Completed Today', 
      value: rnStats.completedToday, 
      color: '#8b5cf6',
      bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      onClick: () => navigate('/schedule-center'),
      description: 'Tasks finished'
    },
    { 
      icon: XCircle, 
      label: 'Overdue', 
      value: rnStats.overdueTasks, 
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      onClick: () => navigate('/schedule-center'),
      description: 'Requires attention',
      urgent: rnStats.overdueTasks > 0
    },
    { 
      icon: FileText, 
      label: 'Pending OASIS', 
      value: rnStats.pendingOASIS, 
      color: '#06b6d4',
      bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      onClick: () => navigate('/patients'),
      description: 'Draft assessments'
    },
  ];

  // Default stats for non-RN users
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
    // Only show "Pending OASIS QA" for users with QA access (not RN/PT)
    ...(hasQAAccess ? [{
      icon: FileText, 
      label: 'Pending OASIS QA', 
      value: '0', 
      color: '#10b981',
      onClick: () => navigate('/oasis/qa-review')
    }] : []),
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

          {/* Quick Stats - RN Dashboard */}
          {isRN ? (
            <>
              <section className="stats-section">
                <div className="rn-stats-grid">
                  {rnDashboardCards.map((card, index) => (
                    <div 
                      key={index} 
                      className={`rn-stat-card ${card.urgent ? 'urgent' : ''}`}
                      onClick={card.onClick}
                      style={{ background: card.bgGradient }}
                    >
                      <div className="rn-stat-icon">
                        <card.icon size={28} color="white" />
                      </div>
                      <div className="rn-stat-content">
                        <p className="rn-stat-label">{card.label}</p>
                        <p className="rn-stat-value">{card.value}</p>
                        <p className="rn-stat-description">{card.description}</p>
                      </div>
                      {card.urgent && (
                        <div className="urgent-badge">
                          <AlertCircle size={16} />
                        </div>
                      )}
                      <div className="rn-stat-arrow">
                        <ArrowRight size={20} color="rgba(255,255,255,0.7)" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Today's Tasks List */}
              {todayTasks.length > 0 && (
                <section className="tasks-section">
                  <div className="section-header-with-action">
                    <h3 className="section-title">Today's Tasks</h3>
                    <button className="view-all-btn" onClick={() => navigate('/schedule-center')}>
                      View All <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="tasks-list">
                    {todayTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="task-item"
                        onClick={() => navigate(`/schedule-center?patientId=${task.patientId}`)}
                      >
                        <div className="task-item-icon">
                          <Stethoscope size={20} />
                        </div>
                        <div className="task-item-content">
                          <div className="task-item-header">
                            <strong>{task.title || 'Visit'}</strong>
                            <span className={`task-status-badge status-${task.status?.toLowerCase()}`}>
                              {task.status}
                            </span>
                          </div>
                          <p className="task-item-patient">
                            {task.patient?.firstName} {task.patient?.lastName}
                          </p>
                          {task.scheduledTime && (
                            <p className="task-item-time">
                              <Clock size={14} /> {new Date(task.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Overdue Tasks Alert */}
              {overdueTasks.length > 0 && (
                <section className="tasks-section">
                  <div className="section-header-with-action">
                    <h3 className="section-title urgent-title">
                      <AlertCircle size={20} /> Overdue Tasks
                    </h3>
                    <button className="view-all-btn" onClick={() => navigate('/schedule-center')}>
                      View All <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="tasks-list overdue-list">
                    {overdueTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="task-item overdue-item"
                        onClick={() => navigate(`/schedule-center?patientId=${task.patientId}`)}
                      >
                        <div className="task-item-icon urgent-icon">
                          <AlertCircle size={20} />
                        </div>
                        <div className="task-item-content">
                          <div className="task-item-header">
                            <strong>{task.title || 'Visit'}</strong>
                            <span className="task-status-badge status-overdue">OVERDUE</span>
                          </div>
                          <p className="task-item-patient">
                            {task.patient?.firstName} {task.patient?.lastName}
                          </p>
                          {task.scheduledDate && (
                            <p className="task-item-time overdue-time">
                              Was due: {new Date(task.scheduledDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Upcoming Tasks */}
              {upcomingTasks.length > 0 && (
                <section className="tasks-section">
                  <div className="section-header-with-action">
                    <h3 className="section-title">Upcoming This Week</h3>
                    <button className="view-all-btn" onClick={() => navigate('/schedule-center')}>
                      View All <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="tasks-list">
                    {upcomingTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="task-item"
                        onClick={() => navigate(`/schedule-center?patientId=${task.patientId}`)}
                      >
                        <div className="task-item-icon">
                          <Calendar size={20} />
                        </div>
                        <div className="task-item-content">
                          <div className="task-item-header">
                            <strong>{task.title || 'Visit'}</strong>
                            <span className={`task-status-badge status-${task.status?.toLowerCase()}`}>
                              {task.status}
                            </span>
                          </div>
                          <p className="task-item-patient">
                            {task.patient?.firstName} {task.patient?.lastName}
                          </p>
                          {task.scheduledDate && (
                            <p className="task-item-time">
                              <Calendar size={14} /> {new Date(task.scheduledDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
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
          )}

          {/* Rejected Assessments Alert for RN/PT */}
          {((isRN || isPT) && rejectedAssessments.length > 0) && (
            <section className="alert-section">
              <div className="alert-card rejected-alert">
                <div className="alert-header">
                  <AlertCircle size={24} color="#ef4444" />
                  <h3 className="alert-title">OASIS Assessments Returned for Review</h3>
                  <span className="alert-badge">{rejectedAssessments.length}</span>
                </div>
                <p className="alert-message">
                  You have {rejectedAssessments.length} OASIS assessment{rejectedAssessments.length > 1 ? 's' : ''} that {rejectedAssessments.length > 1 ? 'were' : 'was'} returned by QA with comments. Please review and make corrections.
                </p>
                <div className="alert-actions">
                  {rejectedAssessments.slice(0, 3).map((assessment) => {
                    // Always use the old form route format that works: /oasis/edit/:id/:patientId
                    // The old form can handle both old and new assessments
                    const navigatePath = `/oasis/edit/${assessment.id}/${assessment.patientId}`;
                    
                    return (
                      <div 
                        key={assessment.id} 
                        className="alert-item"
                        onClick={() => navigate(navigatePath)}
                      >
                        <div className="alert-item-info">
                          <strong>{assessment.patientName || 'Unknown Patient'}</strong>
                          <span className="alert-item-date">
                            {assessment.assessmentDate ? new Date(assessment.assessmentDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        {assessment.qaComments && (
                          <div className="alert-item-comment">
                            <em>"{assessment.qaComments.substring(0, 60)}{assessment.qaComments.length > 60 ? '...' : ''}"</em>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {rejectedAssessments.length > 3 && (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate('/patients')}
                    >
                      View All Rejected Assessments
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

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
