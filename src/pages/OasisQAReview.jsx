import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPendingQAReviews,
  getOasisAssessment,
  reviewOasisAssessment
} from '../services/oasisAPI';
import { toast } from 'react-toastify';
import './OasisQAReview.css';

const OasisQAReview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPendingReviews();
  }, []);

  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      const data = await getPendingQAReviews();
      setPendingReviews(data || []);
    } catch (error) {
      console.error('Error loading pending reviews:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to load pending QA reviews. Please check your permissions and try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAssessment = async (assessmentId) => {
    try {
      const assessment = await getOasisAssessment(assessmentId);
      setSelectedAssessment(assessment);
      setReviewAction('');
      setComments('');
    } catch (error) {
      console.error('Error loading assessment:', error);
      alert('Error loading assessment: ' + error.message);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewAction) {
      alert('Please select an action (Approve or Reject)');
      return;
    }

    if (reviewAction === 'REJECT' && !comments.trim()) {
      alert('Please provide comments when rejecting an assessment');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${reviewAction.toLowerCase()} this assessment?`)) {
      return;
    }

    try {
      setSubmitting(true);
      await reviewOasisAssessment({
        assessmentId: selectedAssessment.id,
        action: reviewAction,
        comments: comments
      });

      alert(`Assessment ${reviewAction.toLowerCase()}d successfully!`);
      
      // Reload pending reviews
      await loadPendingReviews();
      setSelectedAssessment(null);
      setReviewAction('');
      setComments('');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading QA reviews...</div>;
  }

  return (
    <div className="qa-review-container">
      <div className="qa-header">
        <h1>OASIS QA Review</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>

      <div className="qa-content">
        {/* Left Panel - Pending Reviews List */}
        <div className="qa-list-panel">
          <div className="panel-header">
            <h2>Pending Reviews ({pendingReviews.length})</h2>
            <button className="btn-refresh" onClick={loadPendingReviews}>
              🔄 Refresh
            </button>
          </div>

          {pendingReviews.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✅</span>
              <p>No pending reviews</p>
              <span className="empty-subtitle">All assessments have been reviewed!</span>
            </div>
          ) : (
            <div className="review-list">
              {pendingReviews.map((assessment) => (
                <div
                  key={assessment.id}
                  className={`review-item ${selectedAssessment?.id === assessment.id ? 'active' : ''}`}
                  onClick={() => handleSelectAssessment(assessment.id)}
                >
                  <div className="review-item-header">
                    <strong>{assessment.patientName}</strong>
                    <span className="assessment-type-badge">{assessment.assessmentType}</span>
                  </div>
                  <div className="review-item-details">
                    <span>📅 {formatDate(assessment.assessmentDate)}</span>
                    <span>👤 {assessment.clinicianName}</span>
                  </div>
                  <div className="review-item-footer">
                    <span className="submitted-info">
                      Submitted {formatDateTime(assessment.submittedAt)}
                    </span>
                    <span className="completion-badge">{assessment.completionPercentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Assessment Details & Review Form */}
        <div className="qa-detail-panel">
          {!selectedAssessment ? (
            <div className="empty-state">
              <span className="empty-icon">👈</span>
              <p>Select an assessment to review</p>
            </div>
          ) : (
            <div className="assessment-detail">
              <div className="detail-header">
                <h2>Assessment Details</h2>
                <span className={`status-badge status-${selectedAssessment.status.toLowerCase()}`}>
                  {selectedAssessment.status}
                </span>
              </div>

              <div className="detail-section">
                <h3>Patient Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Patient Name:</label>
                    <span>{selectedAssessment.patientName}</span>
                  </div>
                  <div className="info-item">
                    <label>Assessment Type:</label>
                    <span>{selectedAssessment.assessmentType}</span>
                  </div>
                  <div className="info-item">
                    <label>Assessment Date:</label>
                    <span>{formatDate(selectedAssessment.assessmentDate)}</span>
                  </div>
                  <div className="info-item">
                    <label>Completion:</label>
                    <span>{selectedAssessment.completionPercentage}%</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Submission Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Submitted By:</label>
                    <span>{selectedAssessment.submittedByName}</span>
                  </div>
                  <div className="info-item">
                    <label>Submitted At:</label>
                    <span>{formatDateTime(selectedAssessment.submittedAt)}</span>
                  </div>
                  <div className="info-item">
                    <label>Clinician:</label>
                    <span>{selectedAssessment.clinicianName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Last Auto-Saved:</label>
                    <span>{formatDateTime(selectedAssessment.lastAutoSaved)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Assessment Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <label>Primary Diagnosis:</label>
                    <span>{selectedAssessment.m1021PrimaryDiagnosisIcd || 'N/A'} - {selectedAssessment.m1021PrimaryDiagnosisDesc || 'N/A'}</span>
                  </div>
                  <div className="summary-item">
                    <label>Gender:</label>
                    <span>{selectedAssessment.m0069Gender === 'M' ? 'Male' : selectedAssessment.m0069Gender === 'F' ? 'Female' : 'N/A'}</span>
                  </div>
                  <div className="summary-item">
                    <label>Living Situation:</label>
                    <span>{selectedAssessment.m1100LivingSituation || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <button
                  className="btn btn-view"
                  onClick={() => navigate(`/oasis/edit/${selectedAssessment.id}/${selectedAssessment.patientId}`)}
                >
                  📋 View Full Assessment
                </button>
              </div>

              <div className="review-form">
                <h3>QA Review Decision</h3>

                <div className="action-buttons">
                  <button
                    className={`action-btn approve-btn ${reviewAction === 'APPROVE' ? 'active' : ''}`}
                    onClick={() => setReviewAction('APPROVE')}
                  >
                    ✅ Approve
                  </button>
                  <button
                    className={`action-btn reject-btn ${reviewAction === 'REJECT' ? 'active' : ''}`}
                    onClick={() => setReviewAction('REJECT')}
                  >
                    ❌ Reject
                  </button>
                </div>

                <div className="form-group">
                  <label>
                    Comments {reviewAction === 'REJECT' && <span className="required">*</span>}
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows="5"
                    placeholder={reviewAction === 'REJECT' ? 'Please provide detailed feedback for corrections...' : 'Optional: Add any comments or notes...'}
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedAssessment(null);
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

export default OasisQAReview;

