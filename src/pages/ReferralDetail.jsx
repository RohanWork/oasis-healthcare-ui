import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { referralAPI } from '../services/referralAPI';
import { toast } from 'react-toastify';
import { ArrowLeft, Edit, CheckCircle } from 'lucide-react';
import './ReferralDetail.css';

const ReferralDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [referral, setReferral] = useState(null);

  useEffect(() => {
    loadReferral();
  }, [id]);

  const loadReferral = async () => {
    try {
      setLoading(true);
      const response = await referralAPI.getById(id);
      setReferral(response.data);
    } catch (error) {
      console.error('Error loading referral:', error);
      toast.error('Failed to load referral');
      navigate('/referrals');
    } finally {
      setLoading(false);
    }
  };

  const handleAdmit = async () => {
    try {
      navigate(`/patients/new?referralId=${id}`);
    } catch (error) {
      console.error('Error admitting referral:', error);
      toast.error('Failed to admit referral');
    }
  };

  if (loading) {
    return (
      <div className="referral-detail-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="referral-detail-container">
        <p>Referral not found</p>
      </div>
    );
  }

  return (
    <div className="referral-detail-container">
      <div className="referral-detail-header">
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/referrals')}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <h1>Referral Details</h1>
        <div className="header-actions">
          {referral.status === 'PENDING' && (
            <button
              className="btn btn-primary"
              onClick={handleAdmit}
            >
              <CheckCircle size={18} />
              Admit Patient
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/referrals/${id}/edit`)}
          >
            <Edit size={18} />
            Edit
          </button>
        </div>
      </div>

      <div className="referral-detail-content">
        {/* Referral Information */}
        <div className="detail-section">
          <h2>Referral Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Referral Number</label>
              <span>{referral.referralNumber || `REF-${referral.id}`}</span>
            </div>
            <div className="detail-item">
              <label>Referral Date</label>
              <span>
                {referral.referralDate
                  ? new Date(referral.referralDate).toLocaleDateString()
                  : '-'}
              </span>
            </div>
            <div className="detail-item">
              <label>Status</label>
              <span className={`status-badge status-${referral.status?.toLowerCase()}`}>
                {referral.status || 'Pending'}
              </span>
            </div>
            <div className="detail-item">
              <label>Referral Source</label>
              <span>{referral.referralSource || '-'}</span>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="detail-section">
          <h2>Patient Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Name</label>
              <span>
                {referral.patientLastName}, {referral.patientFirstName}{' '}
                {referral.patientMiddleName}
              </span>
            </div>
            <div className="detail-item">
              <label>Date of Birth</label>
              <span>
                {referral.patientDateOfBirth
                  ? new Date(referral.patientDateOfBirth).toLocaleDateString()
                  : '-'}
              </span>
            </div>
            <div className="detail-item">
              <label>Gender</label>
              <span>{referral.patientGender || '-'}</span>
            </div>
            <div className="detail-item">
              <label>SSN</label>
              <span>{referral.patientSsn || '-'}</span>
            </div>
            <div className="detail-item full-width">
              <label>Address</label>
              <span>
                {referral.patientAddressLine1 || ''}
                {referral.patientAddressLine2 ? `, ${referral.patientAddressLine2}` : ''}
                {referral.patientCity ? `, ${referral.patientCity}` : ''}
                {referral.patientState ? `, ${referral.patientState}` : ''}{' '}
                {referral.patientZipCode || ''}
              </span>
            </div>
            <div className="detail-item">
              <label>Phone</label>
              <span>{referral.patientPhoneNumber || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Mobile</label>
              <span>{referral.patientMobileNumber || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Email</label>
              <span>{referral.patientEmail || '-'}</span>
            </div>
          </div>
        </div>

        {/* Diagnosis Information */}
        <div className="detail-section">
          <h2>Diagnosis Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Primary Diagnosis</label>
              <span>{referral.primaryDiagnosis || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Primary Diagnosis ICD-10</label>
              <span>{referral.primaryDiagnosisIcd10 || '-'}</span>
            </div>
            <div className="detail-item full-width">
              <label>Primary Diagnosis Description</label>
              <span>{referral.primaryDiagnosisDescription || '-'}</span>
            </div>
          </div>
        </div>

        {/* Service Information */}
        <div className="detail-section">
          <h2>Service Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Service Requested</label>
              <span>{referral.serviceRequested || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Service Start Date</label>
              <span>
                {referral.serviceStartDate
                  ? new Date(referral.serviceStartDate).toLocaleDateString()
                  : '-'}
              </span>
            </div>
            <div className="detail-item">
              <label>Expected Frequency</label>
              <span>{referral.expectedFrequency || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Expected Duration</label>
              <span>{referral.expectedDuration || '-'}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {referral.notes && (
          <div className="detail-section">
            <h2>Notes</h2>
            <p>{referral.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralDetail;

