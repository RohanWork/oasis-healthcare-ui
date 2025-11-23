import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { episodeAPI } from '../services/patientAPI';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Edit, ArrowLeft, Calendar, User, FileText, CheckCircle, XCircle, Archive, RefreshCw, Clock } from 'lucide-react';
import './EpisodeDetail.css';

const EpisodeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission, hasRole } = useAuth();
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRecertifyModal, setShowRecertifyModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [recertifyData, setRecertifyData] = useState({
    newCertificationStartDate: '',
    certificationPeriod: 60,
  });
  const [dischargeData, setDischargeData] = useState({
    dischargeReason: '',
    dischargeDisposition: '',
  });

  useEffect(() => {
    loadEpisode();
  }, [id]);

  const loadEpisode = async () => {
    try {
      setLoading(true);
      const response = await episodeAPI.getById(id);
      setEpisode(response.data);
    } catch (error) {
      console.error('Error loading episode:', error);
      toast.error('Failed to load episode');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleRecertify = async () => {
    if (!recertifyData.newCertificationStartDate) {
      toast.error('Please select a certification start date');
      return;
    }

    try {
      const response = await episodeAPI.recertify(id, recertifyData.newCertificationStartDate, recertifyData.certificationPeriod);
      toast.success('Episode recertified successfully! New episode created.');
      setShowRecertifyModal(false);
      navigate(`/episodes/${response.data.id}`);
    } catch (error) {
      console.error('Error recertifying episode:', error);
      toast.error(error.response?.data?.message || 'Failed to recertify episode');
    }
  };

  const handleDischarge = async () => {
    if (!dischargeData.dischargeReason || !dischargeData.dischargeDisposition) {
      toast.error('Please provide discharge reason and disposition');
      return;
    }

    try {
      await episodeAPI.discharge(id, dischargeData.dischargeReason, dischargeData.dischargeDisposition);
      toast.success('Episode discharged successfully');
      setShowDischargeModal(false);
      loadEpisode();
    } catch (error) {
      console.error('Error discharging episode:', error);
      toast.error(error.response?.data?.message || 'Failed to discharge episode');
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this episode?')) {
      return;
    }

    try {
      await episodeAPI.archive(id);
      toast.success('Episode archived successfully');
      loadEpisode();
    } catch (error) {
      console.error('Error archiving episode:', error);
      toast.error(error.response?.data?.message || 'Failed to archive episode');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { className: 'status-active', label: 'Active', icon: CheckCircle },
      PENDING: { className: 'status-pending', label: 'Pending', icon: Clock },
      COMPLETED: { className: 'status-completed', label: 'Completed', icon: CheckCircle },
      CANCELLED: { className: 'status-cancelled', label: 'Cancelled', icon: XCircle },
      ON_HOLD: { className: 'status-on-hold', label: 'On Hold', icon: Clock },
      ARCHIVED: { className: 'status-archived', label: 'Archived', icon: Archive },
    };
    const config = statusConfig[status] || { className: 'status-default', label: status, icon: FileText };
    const Icon = config.icon;
    return (
      <span className={`status-badge ${config.className}`}>
        <Icon size={14} />
        <span>{config.label}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="episode-detail-container">
        <div className="loading">Loading episode...</div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="episode-detail-container">
        <div className="error">Episode not found</div>
      </div>
    );
  }

  return (
    <div className="episode-detail-container">
      <div className="detail-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1>Episode {episode.episodeNumber}</h1>
            <div className="header-meta">
              <span>{getStatusBadge(episode.status)}</span>
              <span>{episode.episodeType}</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          {episode.status === 'ACTIVE' && (hasPermission('EPISODE_UPDATE') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN') || hasRole('CLINICAL_MANAGER')) && (
            <>
              <button className="btn btn-primary" onClick={() => setShowRecertifyModal(true)}>
                <RefreshCw size={18} />
                Recertify
              </button>
              <button className="btn btn-warning" onClick={() => setShowDischargeModal(true)}>
                <XCircle size={18} />
                Discharge
              </button>
            </>
          )}
          {(episode.status === 'COMPLETED' || episode.status === 'CANCELLED') && (hasPermission('EPISODE_UPDATE') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN')) && (
            <button className="btn btn-secondary" onClick={handleArchive}>
              <Archive size={18} />
              Archive
            </button>
          )}
        </div>
      </div>

      <div className="detail-content">
        {/* Basic Information */}
        <div className="detail-section">
          <h2><FileText size={20} /> Basic Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Episode Number</label>
              <div>{episode.episodeNumber}</div>
            </div>
            <div className="info-item">
              <label>Patient</label>
              <div>{episode.patientName}</div>
            </div>
            <div className="info-item">
              <label>Episode Type</label>
              <div>{episode.episodeType}</div>
            </div>
            <div className="info-item">
              <label>Status</label>
              <div>{getStatusBadge(episode.status)}</div>
            </div>
            <div className="info-item">
              <label>Start Date</label>
              <div>{new Date(episode.startDate).toLocaleDateString()}</div>
            </div>
            {episode.endDate && (
              <div className="info-item">
                <label>End Date</label>
                <div>{new Date(episode.endDate).toLocaleDateString()}</div>
              </div>
            )}
            <div className="info-item">
              <label>Certification Start</label>
              <div>{new Date(episode.certificationStartDate).toLocaleDateString()}</div>
            </div>
            <div className="info-item">
              <label>Certification End</label>
              <div>{new Date(episode.certificationEndDate).toLocaleDateString()}</div>
            </div>
            <div className="info-item">
              <label>Certification Period</label>
              <div>{episode.certificationPeriod} days</div>
            </div>
            {episode.remainingDays !== null && (
              <div className="info-item">
                <label>Remaining Days</label>
                <div className={episode.isCertificationExpiringSoon ? 'expiring-soon' : ''}>
                  {episode.remainingDays} days
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Care Team */}
        {(episode.primaryNurseName || episode.caseManagerName || episode.primaryTherapistName) && (
          <div className="detail-section">
            <h2><User size={20} /> Care Team</h2>
            <div className="info-grid">
              {episode.primaryNurseName && (
                <div className="info-item">
                  <label>Primary Nurse</label>
                  <div>{episode.primaryNurseName}</div>
                </div>
              )}
              {episode.caseManagerName && (
                <div className="info-item">
                  <label>Case Manager</label>
                  <div>{episode.caseManagerName}</div>
                </div>
              )}
              {episode.primaryTherapistName && (
                <div className="info-item">
                  <label>Primary Therapist</label>
                  <div>{episode.primaryTherapistName}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Discharge Information */}
        {episode.dischargeReason && (
          <div className="detail-section">
            <h2>Discharge Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Discharge Reason</label>
                <div>{episode.dischargeReason}</div>
              </div>
              {episode.dischargeDisposition && (
                <div className="info-item">
                  <label>Discharge Disposition</label>
                  <div>{episode.dischargeDisposition}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recertify Modal */}
      {showRecertifyModal && (
        <div className="modal-overlay" onClick={() => setShowRecertifyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Recertify Episode</h3>
            <div className="form-group">
              <label>New Certification Start Date *</label>
              <input
                type="date"
                value={recertifyData.newCertificationStartDate}
                onChange={(e) => setRecertifyData({ ...recertifyData, newCertificationStartDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Certification Period (days)</label>
              <input
                type="number"
                value={recertifyData.certificationPeriod}
                onChange={(e) => setRecertifyData({ ...recertifyData, certificationPeriod: parseInt(e.target.value) || 60 })}
                min="1"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowRecertifyModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleRecertify}>
                Recertify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discharge Modal */}
      {showDischargeModal && (
        <div className="modal-overlay" onClick={() => setShowDischargeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Discharge Episode</h3>
            <div className="form-group">
              <label>Discharge Reason *</label>
              <textarea
                value={dischargeData.dischargeReason}
                onChange={(e) => setDischargeData({ ...dischargeData, dischargeReason: e.target.value })}
                required
                rows="3"
                placeholder="Reason for discharge"
              />
            </div>
            <div className="form-group">
              <label>Discharge Disposition *</label>
              <select
                value={dischargeData.dischargeDisposition}
                onChange={(e) => setDischargeData({ ...dischargeData, dischargeDisposition: e.target.value })}
                required
              >
                <option value="">Select Disposition</option>
                <option value="HOME">Home</option>
                <option value="HOSPITAL">Hospital</option>
                <option value="SNF">Skilled Nursing Facility</option>
                <option value="REHAB">Rehabilitation Facility</option>
                <option value="DECEASED">Deceased</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDischargeModal(false)}>
                Cancel
              </button>
              <button className="btn btn-warning" onClick={handleDischarge}>
                Discharge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EpisodeDetail;

