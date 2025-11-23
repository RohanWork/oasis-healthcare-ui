import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingQAReviews } from '../services/oasisAPI';
import { getOasisAssessment } from '../services/oasisAPI';
import { reviewOasisAssessment } from '../services/oasisAPI';
import { visitNoteAPI } from '../services/visitNoteAPI';
import { toast } from 'react-toastify';
import { Shield, FileText, ClipboardList, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import './UnifiedQAReview.css';

const UnifiedQAReview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OASIS'); // 'OASIS' or 'VISIT_NOTES'
  const [oasisReviews, setOasisReviews] = useState([]);
  const [visitNoteReviews, setVisitNoteReviews] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemType, setItemType] = useState(null); // 'OASIS' or 'VISIT_NOTE'
  const [reviewAction, setReviewAction] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPendingReviews();
  }, []);

  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      const [oasisData, visitNotesData] = await Promise.all([
        getPendingQAReviews().catch((err) => {
          console.error('Error loading OASIS pending reviews:', err);
          return [];
        }),
        visitNoteAPI.getPendingQAReview().catch((err) => {
          console.error('Error loading visit note pending reviews:', err);
          return [];
        })
      ]);
      // Ensure we always have arrays
      setOasisReviews(Array.isArray(oasisData) ? oasisData : []);
      setVisitNoteReviews(Array.isArray(visitNotesData) ? visitNotesData : []);
    } catch (error) {
      console.error('Error loading pending reviews:', error);
      toast.error('Failed to load pending reviews');
      // Ensure arrays are set even on error
      setOasisReviews([]);
      setVisitNoteReviews([]);
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
  const currentReviews = Array.isArray(activeTab === 'OASIS' ? oasisReviews : visitNoteReviews) 
    ? (activeTab === 'OASIS' ? oasisReviews : visitNoteReviews)
    : [];

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
              <p>No pending {activeTab === 'OASIS' ? 'OASIS' : 'visit note'} reviews</p>
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
                    <strong>{item.patientName || 'Unknown Patient'}</strong>
                    <span className="type-badge">
                      {activeTab === 'OASIS' ? item.assessmentType : item.visitType}
                    </span>
                  </div>
                  <div className="review-item-details">
                    <span>📅 {formatDate(activeTab === 'OASIS' ? item.assessmentDate : item.visitDate)}</span>
                    {(activeTab === 'OASIS' ? item.clinicianName : item.clinicianName) && (
                      <span>👤 {activeTab === 'OASIS' ? item.clinicianName : item.clinicianName}</span>
                    )}
                  </div>
                  <div className="review-item-footer">
                    <span className="submitted-info">
                      Submitted {formatDateTime(activeTab === 'OASIS' ? item.submittedAt : item.submittedAt)}
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
                  {itemType === 'OASIS' ? 'OASIS Assessment' : 'Visit Note'} Details
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
                    <span>{selectedItem.patientName || 'N/A'}</span>
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

              {itemType === 'VISIT_NOTE' && selectedItem.chiefComplaint && (
                <div className="detail-section">
                  <h3>Chief Complaint</h3>
                  <p>{selectedItem.chiefComplaint}</p>
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

