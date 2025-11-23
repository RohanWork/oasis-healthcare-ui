import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { billingAPI } from '../services/billingAPI';
import { toast } from 'react-toastify';
import { Edit, ArrowLeft, DollarSign, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import './BillingClaimDetail.css';

const BillingClaimDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClaim();
  }, [id]);

  const loadClaim = async () => {
    try {
      setLoading(true);
      const response = await billingAPI.getClaimById(id);
      setClaim(response.data);
    } catch (error) {
      console.error('Error loading billing claim:', error);
      toast.error('Failed to load billing claim');
      navigate('/billing/claims');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    const paidAmount = window.prompt('Enter paid amount:');
    if (paidAmount && !isNaN(paidAmount)) {
      try {
        await billingAPI.markAsPaid(id, parseFloat(paidAmount));
        toast.success('Claim marked as paid');
        loadClaim();
      } catch (error) {
        toast.error('Failed to mark claim as paid');
      }
    }
  };

  const handleMarkAsDenied = async () => {
    const denialReason = window.prompt('Enter denial reason:');
    if (denialReason) {
      try {
        await billingAPI.markAsDenied(id, denialReason);
        toast.success('Claim marked as denied');
        loadClaim();
      } catch (error) {
        toast.error('Failed to mark claim as denied');
      }
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { className: 'status-draft', label: 'Draft', icon: Clock },
      SUBMITTED: { className: 'status-submitted', label: 'Submitted', icon: Clock },
      PAID: { className: 'status-paid', label: 'Paid', icon: CheckCircle },
      DENIED: { className: 'status-denied', label: 'Denied', icon: XCircle },
      ADJUSTED: { className: 'status-adjusted', label: 'Adjusted', icon: DollarSign },
      VOIDED: { className: 'status-voided', label: 'Voided', icon: XCircle },
    };
    const config = statusConfig[status] || { className: 'status-default', label: status, icon: DollarSign };
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
      <div className="billing-claim-detail-container">
        <div className="loading">Loading billing claim...</div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="billing-claim-detail-container">
        <div className="error">Billing claim not found</div>
      </div>
    );
  }

  return (
    <div className="billing-claim-detail-container">
      <div className="detail-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/billing/claims')}>
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1>Claim {claim.claimNumber}</h1>
            <div className="header-meta">
              <span>{getStatusBadge(claim.status)}</span>
              <span>{claim.claimType}</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          {claim.canBeEdited && (
            <button className="btn btn-primary" onClick={() => navigate(`/billing/claims/${id}/edit`)}>
              <Edit size={18} />
              Edit
            </button>
          )}
          {claim.status === 'SUBMITTED' && (
            <>
              <button className="btn btn-success" onClick={handleMarkAsPaid}>
                <CheckCircle size={18} />
                Mark as Paid
              </button>
              <button className="btn btn-danger" onClick={handleMarkAsDenied}>
                <XCircle size={18} />
                Mark as Denied
              </button>
            </>
          )}
        </div>
      </div>

      <div className="detail-content">
        {/* Basic Information */}
        <div className="detail-section">
          <h2><FileText size={20} /> Basic Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Claim Number</label>
              <div>{claim.claimNumber}</div>
            </div>
            <div className="info-item">
              <label>Patient</label>
              <div>{claim.patientName}</div>
            </div>
            <div className="info-item">
              <label>Episode</label>
              <div>{claim.episodeNumber}</div>
            </div>
            <div className="info-item">
              <label>Claim Type</label>
              <div>{claim.claimType}</div>
            </div>
            <div className="info-item">
              <label>Status</label>
              <div>{getStatusBadge(claim.status)}</div>
            </div>
          </div>
        </div>

        {/* Service Information */}
        <div className="detail-section">
          <h2><DollarSign size={20} /> Service Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Billing Date</label>
              <div>{new Date(claim.billingDate).toLocaleDateString()}</div>
            </div>
            <div className="info-item">
              <label>Service Date</label>
              <div>{new Date(claim.serviceDate).toLocaleDateString()}</div>
            </div>
            {claim.serviceEndDate && (
              <div className="info-item">
                <label>Service End Date</label>
                <div>{new Date(claim.serviceEndDate).toLocaleDateString()}</div>
              </div>
            )}
            <div className="info-item">
              <label>Service Code</label>
              <div>{claim.serviceCode}</div>
            </div>
            {claim.serviceDescription && (
              <div className="info-item">
                <label>Service Description</label>
                <div>{claim.serviceDescription}</div>
              </div>
            )}
            <div className="info-item">
              <label>Units</label>
              <div>{claim.units}</div>
            </div>
            <div className="info-item">
              <label>Unit Rate</label>
              <div>{formatCurrency(claim.unitRate)}</div>
            </div>
            <div className="info-item">
              <label>Total Charge</label>
              <div className="amount-large">{formatCurrency(claim.totalCharge)}</div>
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        {claim.insuranceName && (
          <div className="detail-section">
            <h2>Insurance Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Insurance</label>
                <div>{claim.insuranceName}</div>
              </div>
              {claim.insuranceClaimNumber && (
                <div className="info-item">
                  <label>Insurance Claim Number</label>
                  <div>{claim.insuranceClaimNumber}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Financial Information */}
        <div className="detail-section">
          <h2><DollarSign size={20} /> Financial Information</h2>
          <div className="info-grid">
            {claim.paidAmount && (
              <div className="info-item">
                <label>Paid Amount</label>
                <div className="amount-large">{formatCurrency(claim.paidAmount)}</div>
              </div>
            )}
            {claim.insurancePayment && (
              <div className="info-item">
                <label>Insurance Payment</label>
                <div>{formatCurrency(claim.insurancePayment)}</div>
              </div>
            )}
            {claim.patientResponsibility && (
              <div className="info-item">
                <label>Patient Responsibility</label>
                <div>{formatCurrency(claim.patientResponsibility)}</div>
              </div>
            )}
            {claim.adjustmentAmount && (
              <div className="info-item">
                <label>Adjustment Amount</label>
                <div>{formatCurrency(claim.adjustmentAmount)}</div>
              </div>
            )}
            {claim.adjustmentReason && (
              <div className="info-item full-width">
                <label>Adjustment Reason</label>
                <div>{claim.adjustmentReason}</div>
              </div>
            )}
            <div className="info-item">
              <label>Outstanding Balance</label>
              <div className="amount-large">{formatCurrency(claim.outstandingBalance)}</div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {(claim.paidDate || claim.deniedDate) && (
          <div className="detail-section">
            <h2>Payment Information</h2>
            <div className="info-grid">
              {claim.paidDate && (
                <div className="info-item">
                  <label>Paid Date</label>
                  <div>{new Date(claim.paidDate).toLocaleDateString()}</div>
                </div>
              )}
              {claim.deniedDate && (
                <div className="info-item">
                  <label>Denied Date</label>
                  <div>{new Date(claim.deniedDate).toLocaleDateString()}</div>
                </div>
              )}
              {claim.denialReason && (
                <div className="info-item full-width">
                  <label>Denial Reason</label>
                  <div>{claim.denialReason}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Information */}
        {claim.notes && (
          <div className="detail-section">
            <h2>Additional Information</h2>
            <div className="info-grid">
              <div className="info-item full-width">
                <label>Notes</label>
                <div>{claim.notes}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingClaimDetail;

