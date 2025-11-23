import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPendingQAReviews } from '../services/oasisAPI';
import { getOasisAssessment } from '../services/oasisAPI';
import { reviewOasisAssessment } from '../services/oasisAPI';
import { visitNoteAPI } from '../services/visitNoteAPI';
import { taskAPI } from '../services/taskAPI';
import { toast } from 'react-toastify';
import { Shield, FileText, ClipboardList, CheckCircle, XCircle, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import './UnifiedQAReview.css';

const UnifiedQAReview = () => {
  const navigate = useNavigate();
  const { hasRole, hasPermission } = useAuth();
  
  // Check if user has access to QA Review
  const hasQAAccess = hasPermission('OASIS_APPROVE') || 
                      hasPermission('VISIT_APPROVE') || 
                      hasRole('ROLE_SYSTEM_ADMIN') || 
                      hasRole('ROLE_QA_NURSE') || 
                      hasRole('ROLE_CLINICAL_MANAGER') ||
                      hasRole('ROLE_ORG_ADMIN') ||
                      hasRole('SYSTEM_ADMIN') ||
                      hasRole('QA_NURSE') ||
                      hasRole('CLINICAL_MANAGER') ||
                      hasRole('ORG_ADMIN');
  
  // Check if user is RN (should not have access)
  const isRN = hasRole('ROLE_RN') || hasRole('RN');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OASIS'); // 'OASIS', 'VISIT_NOTES', or 'TASKS'
  const [oasisReviews, setOasisReviews] = useState([]);
  const [visitNoteReviews, setVisitNoteReviews] = useState([]);
  const [taskReviews, setTaskReviews] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemType, setItemType] = useState(null); // 'OASIS', 'VISIT_NOTE', or 'TASK'
  const [reviewAction, setReviewAction] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Redirect RN users away from QA Review page
    if (isRN) {
      toast.info('RN users cannot access QA Review. Check your Dashboard for rejected assessments with QA comments.');
      navigate('/dashboard');
      return;
    }
    
    // Check if user has access
    if (!hasQAAccess) {
      toast.error('You do not have permission to access QA Review');
      navigate('/dashboard');
      return;
    }
    
    loadPendingReviews();
  }, [isRN, hasQAAccess, navigate]);

  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      const [oasisData, visitNotesData, tasksData] = await Promise.all([
        getPendingQAReviews().catch((err) => {
          console.error('Error loading OASIS pending reviews:', err);
          if (err.response?.status === 403) {
            toast.error('You do not have permission to access QA reviews');
          } else {
            toast.error('Failed to load OASIS pending reviews');
          }
          return [];
        }),
        visitNoteAPI.getPendingQAReview().catch((err) => {
          console.error('Error loading visit note pending reviews:', err);
          if (err.response?.status === 403) {
            // Don't show duplicate error if already shown for OASIS
            if (err.response?.status !== 403) {
              toast.error('You do not have permission to access QA reviews');
            }
          } else {
            toast.error('Failed to load visit note pending reviews');
          }
          return [];
        }),
        taskAPI.getPendingQAReview().catch((err) => {
          console.error('Error loading task pending reviews:', err);
          if (err.response?.status === 403) {
            // Don't show duplicate error
          } else {
            toast.error('Failed to load task pending reviews');
          }
          return [];
        })
      ]);
      // Ensure we always have arrays
      setOasisReviews(Array.isArray(oasisData) ? oasisData : []);
      setVisitNoteReviews(Array.isArray(visitNotesData) ? visitNotesData : []);
      setTaskReviews(Array.isArray(tasksData?.data || tasksData) ? (tasksData?.data || tasksData) : []);
    } catch (error) {
      console.error('Error loading pending reviews:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to access QA reviews');
      } else {
        toast.error('Failed to load pending reviews');
      }
      // Ensure arrays are set even on error
      setOasisReviews([]);
      setVisitNoteReviews([]);
      setTaskReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = async (item, type) => {
    try {
      if (type === 'OASIS') {
        const assessment = await getOasisAssessment(item.id);
        setSelectedItem(assessment);
        setItemType('OASIS');
      } else if (type === 'TASK' || type === 'TASKS') {
        const task = await taskAPI.getById(item.id);
        setSelectedItem(task.data || task);
        setItemType('TASK');
      } else {
        setSelectedItem(item);
        setItemType('VISIT_NOTE');
      }
      setReviewAction('');
      setComments('');
    } catch (error) {
      console.error('Error loading item:', error);
      toast.error('Failed to load item details');
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewAction) {
      toast.error('Please select an action (Approve or Return for Correction)');
      return;
    }

    if (reviewAction === 'RETURN' && !comments.trim()) {
      toast.error('Please provide comments when returning for correction');
      return;
    }

    try {
      setSubmitting(true);
      
      if (itemType === 'OASIS') {
        await reviewOasisAssessment({
          assessmentId: selectedItem.id,
          action: reviewAction === 'APPROVE' ? 'APPROVE' : 'REJECT',
          comments: comments
        });
        toast.success(`OASIS assessment ${reviewAction === 'APPROVE' ? 'approved' : 'rejected'} successfully`);
      } else if (itemType === 'TASK') {
        if (reviewAction === 'APPROVE') {
          await taskAPI.approveTask(selectedItem.id);
          toast.success('Task approved successfully');
        } else {
          await taskAPI.rejectTask(selectedItem.id, comments);
          toast.success('Task returned for correction');
        }
      } else {
        if (reviewAction === 'APPROVE') {
          await visitNoteAPI.approve(selectedItem.id, comments);
          toast.success('Visit note approved successfully');
        } else {
          await visitNoteAPI.returnForCorrection(selectedItem.id, comments);
          toast.success('Visit note returned for correction');
        }
      }
      
      await loadPendingReviews();
      setSelectedItem(null);
      setItemType(null);
      setReviewAction('');
      setComments('');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Ensure currentReviews is always an array
  const getCurrentReviews = () => {
    if (activeTab === 'OASIS') return oasisReviews;
    if (activeTab === 'VISIT_NOTES') return visitNoteReviews;
    if (activeTab === 'TASKS') return taskReviews;
    return [];
  };
  const currentReviews = Array.isArray(getCurrentReviews()) ? getCurrentReviews() : [];

  // Check access before rendering
  if (!hasQAAccess || isRN) {
    return (
      <div className="unified-qa-container">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>Access Denied</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px', maxWidth: '500px' }}>
            You do not have permission to access the QA Review page. Only QA Nurses, Clinical Managers, and Organization Administrators can review and approve assessments.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="unified-qa-container">
        <div className="loading">Loading QA reviews...</div>
      </div>
    );
  }

  return (
    <div className="unified-qa-container">
      <div className="qa-header">
        <h1><Shield size={24} /> QA Review Dashboard</h1>
        <button className="btn btn-secondary" onClick={loadPendingReviews}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="qa-tabs">
        <button
          className={`tab ${activeTab === 'OASIS' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('OASIS');
            setSelectedItem(null);
            setItemType(null);
          }}
        >
          <FileText size={18} />
          OASIS Assessments ({oasisReviews.length})
        </button>
        <button
          className={`tab ${activeTab === 'VISIT_NOTES' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('VISIT_NOTES');
            setSelectedItem(null);
            setItemType(null);
          }}
        >
          <ClipboardList size={18} />
          Visit Notes ({visitNoteReviews.length})
        </button>
        <button
          className={`tab ${activeTab === 'TASKS' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('TASKS');
            setSelectedItem(null);
            setItemType(null);
          }}
        >
          <Calendar size={18} />
          Tasks ({taskReviews.length})
        </button>
      </div>

      <div className="qa-content">
        {/* Left Panel - Pending Reviews List */}
        <div className="qa-list-panel">
          <div className="panel-header">
            <h2>Pending Reviews ({currentReviews.length})</h2>
          </div>

          {currentReviews.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✅</span>
              <p>No pending {activeTab === 'OASIS' ? 'OASIS' : activeTab === 'VISIT_NOTES' ? 'visit note' : 'task'} reviews</p>
            </div>
          ) : (
            <div className="review-list">
              {currentReviews.map((item) => (
                <div
                  key={item.id}
                  className={`review-item ${selectedItem?.id === item.id ? 'active' : ''}`}
                  onClick={() => handleSelectItem(item, activeTab)}
                >
                  <div className="review-item-header">
                    <strong>{item.patientName || item.patient?.fullName || 'Unknown Patient'}</strong>
                    <span className="type-badge">
                      {activeTab === 'OASIS' ? item.assessmentType : activeTab === 'VISIT_NOTES' ? item.visitType : item.taskType}
                    </span>
                  </div>
                  <div className="review-item-details">
                    <span>📅 {formatDate(activeTab === 'OASIS' ? item.assessmentDate : activeTab === 'VISIT_NOTES' ? item.visitDate : item.scheduledDate)}</span>
                    {(activeTab === 'OASIS' ? item.clinicianName : activeTab === 'VISIT_NOTES' ? item.clinicianName : item.assignedTo?.fullName) && (
                      <span>👤 {activeTab === 'OASIS' ? item.clinicianName : activeTab === 'VISIT_NOTES' ? item.clinicianName : item.assignedTo?.fullName}</span>
                    )}
                  </div>
                  <div className="review-item-footer">
                    <span className="submitted-info">
                      {activeTab === 'TASKS' ? `Completed ${formatDateTime(item.completedAt)}` : `Submitted ${formatDateTime(activeTab === 'OASIS' ? item.submittedAt : item.submittedAt)}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Item Details & Review Form */}
        <div className="qa-detail-panel">
          {!selectedItem ? (
            <div className="empty-state">
              <span className="empty-icon">👈</span>
              <p>Select an item to review</p>
            </div>
          ) : (
            <div className="item-detail">
              <div className="detail-header">
                <h2>
                  {itemType === 'OASIS' ? 'OASIS Assessment' : itemType === 'TASK' ? 'Task' : 'Visit Note'} Details
                </h2>
                <span className={`status-badge status-${selectedItem.status?.toLowerCase() || 'pending'}`}>
                  {selectedItem.status || 'PENDING'}
                </span>
              </div>

              <div className="detail-section">
                <h3>Patient Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Patient Name:</label>
                    <span>{selectedItem.patientName || selectedItem.patient?.fullName || 'N/A'}</span>
                  </div>
                  {itemType === 'OASIS' ? (
                    <>
                      <div className="info-item">
                        <label>Assessment Type:</label>
                        <span>{selectedItem.assessmentType || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Assessment Date:</label>
                        <span>{formatDate(selectedItem.assessmentDate)}</span>
                      </div>
                      {selectedItem.completionPercentage && (
                        <div className="info-item">
                          <label>Completion:</label>
                          <span>{selectedItem.completionPercentage}%</span>
                        </div>
                      )}
                    </>
                  ) : itemType === 'TASK' ? (
                    <>
                      <div className="info-item">
                        <label>Task Type:</label>
                        <span>{selectedItem.taskType || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Task Title:</label>
                        <span>{selectedItem.title || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Scheduled Date:</label>
                        <span>{formatDate(selectedItem.scheduledDate)}</span>
                      </div>
                      <div className="info-item">
                        <label>Assigned To:</label>
                        <span>{selectedItem.assignedTo?.fullName || 'N/A'}</span>
                      </div>
                      {selectedItem.completedAt && (
                        <div className="info-item">
                          <label>Completed At:</label>
                          <span>{formatDateTime(selectedItem.completedAt)}</span>
                        </div>
                      )}
                      {selectedItem.completionNotes && (
                        <div className="info-item">
                          <label>Completion Notes:</label>
                          <span>{selectedItem.completionNotes}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="info-item">
                        <label>Visit Type:</label>
                        <span>{selectedItem.visitType || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Visit Date:</label>
                        <span>{formatDate(selectedItem.visitDate)}</span>
                      </div>
                      {selectedItem.visitDurationMinutes && (
                        <div className="info-item">
                          <label>Duration:</label>
                          <span>{selectedItem.visitDurationMinutes} minutes</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {itemType !== 'TASK' && (
                <div className="detail-section">
                  <h3>Submission Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Submitted By:</label>
                      <span>{selectedItem.submittedByName || selectedItem.submittedBy || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Submitted At:</label>
                      <span>{formatDateTime(selectedItem.submittedAt)}</span>
                    </div>
                    {selectedItem.clinicianName && (
                      <div className="info-item">
                        <label>Clinician:</label>
                        <span>{selectedItem.clinicianName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {itemType === 'VISIT_NOTE' && selectedItem.chiefComplaint && (
                <div className="detail-section">
                  <h3>Chief Complaint</h3>
                  <p>{selectedItem.chiefComplaint}</p>
                </div>
              )}

              {itemType === 'TASK' && selectedItem.description && (
                <div className="detail-section">
                  <h3>Task Description</h3>
                  <p>{selectedItem.description}</p>
                </div>
              )}

              <div className="detail-section">
                {itemType === 'OASIS' ? (
                  <button
                    className="btn btn-view"
                    onClick={() => navigate(`/oasis-complete/${selectedItem.id}`)}
                  >
                    📋 View Full Assessment
                  </button>
                ) : itemType === 'TASK' ? (
                  <button
                    className="btn btn-view"
                    onClick={() => navigate(`/schedule-center?patientId=${selectedItem.patient?.id || selectedItem.patientId}`)}
                  >
                    📋 View Task Details
                  </button>
                ) : (
                  <button
                    className="btn btn-view"
                    onClick={() => navigate(`/visit-notes/${selectedItem.id}`)}
                  >
                    📋 View Full Visit Note
                  </button>
                )}
              </div>

              <div className="review-form">
                <h3>QA Review Decision</h3>

                <div className="action-buttons">
                  <button
                    className={`action-btn approve-btn ${reviewAction === 'APPROVE' ? 'active' : ''}`}
                    onClick={() => setReviewAction('APPROVE')}
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>
                  <button
                    className={`action-btn return-btn ${reviewAction === 'RETURN' ? 'active' : ''}`}
                    onClick={() => setReviewAction('RETURN')}
                  >
                    <XCircle size={18} />
                    Return for Correction
                  </button>
                </div>

                <div className="form-group">
                  <label>
                    Comments {reviewAction === 'RETURN' && <span className="required">*</span>}
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows="5"
                    placeholder={reviewAction === 'RETURN' ? 'Please provide detailed feedback for corrections...' : 'Optional: Add any comments or notes...'}
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedItem(null);
                      setItemType(null);
                      setReviewAction('');
                      setComments('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmitReview}
                    disabled={!reviewAction || submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedQAReview;

