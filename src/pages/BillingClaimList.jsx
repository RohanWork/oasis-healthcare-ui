import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingAPI } from '../services/billingAPI';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Plus, Eye, Edit, Trash2, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import './BillingClaimList.css';

const BillingClaimList = () => {
  const navigate = useNavigate();
  const { hasPermission, hasRole } = useAuth();
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'ALL',
    claimType: 'ALL',
  });

  useEffect(() => {
    loadClaims();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [claims, filters]);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const response = await billingAPI.getAllClaims();
      setClaims(response.data || []);
    } catch (error) {
      console.error('Error loading billing claims:', error);
      toast.error('Failed to load billing claims');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...claims];

    if (filters.status !== 'ALL') {
      filtered = filtered.filter(claim => claim.status === filters.status);
    }

    if (filters.claimType !== 'ALL') {
      filtered = filtered.filter(claim => claim.claimType === filters.claimType);
    }

    setFilteredClaims(filtered);
  };

  const handleView = (id) => {
    navigate(`/billing/claims/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/billing/claims/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this billing claim?')) {
      try {
        await billingAPI.deleteClaim(id);
        toast.success('Billing claim deleted successfully');
        loadClaims();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete billing claim');
      }
    }
  };

  const handleSubmit = async (id) => {
    if (window.confirm('Are you sure you want to submit this claim for processing?')) {
      try {
        await billingAPI.submitClaim(id);
        toast.success('Claim submitted successfully');
        loadClaims();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to submit claim');
      }
    }
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

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loading) {
    return (
      <div className="billing-claim-list-container">
        <div className="loading">Loading billing claims...</div>
      </div>
    );
  }

  return (
    <div className="billing-claim-list-container">
      <div className="list-header">
        <h1>Billing Claims</h1>
        {(hasPermission('BILLING_CREATE') || hasRole('SYSTEM_ADMIN') || hasRole('BILLING_SPECIALIST')) && (
          <button className="btn btn-primary" onClick={() => navigate('/billing/claims/new')}>
            <Plus size={20} />
            New Claim
          </button>
        )}
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="filter-select"
          >
            <option value="ALL">All</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PAID">Paid</option>
            <option value="DENIED">Denied</option>
            <option value="ADJUSTED">Adjusted</option>
            <option value="VOIDED">Voided</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Claim Type:</label>
          <select
            value={filters.claimType}
            onChange={(e) => setFilters({ ...filters, claimType: e.target.value })}
            className="filter-select"
          >
            <option value="ALL">All</option>
            <option value="RAP">RAP</option>
            <option value="FINAL">Final</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>
      </div>

      {filteredClaims.length === 0 ? (
        <div className="empty-state">
          <DollarSign size={48} />
          <p>No billing claims found</p>
        </div>
      ) : (
        <div className="claims-table-container">
          <table className="claims-table">
            <thead>
              <tr>
                <th>Claim Number</th>
                <th>Patient</th>
                <th>Service Date</th>
                <th>Service Code</th>
                <th>Units</th>
                <th>Total Charge</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((claim) => (
                <tr key={claim.id}>
                  <td>
                    <strong>{claim.claimNumber}</strong>
                    <div className="claim-type">{claim.claimType}</div>
                  </td>
                  <td>{claim.patientName}</td>
                  <td>{new Date(claim.serviceDate).toLocaleDateString()}</td>
                  <td>{claim.serviceCode}</td>
                  <td>{claim.units}</td>
                  <td className="amount-cell">{formatCurrency(claim.totalCharge)}</td>
                  <td>{getStatusBadge(claim.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => handleView(claim.id)}
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      {claim.canBeEdited && (hasPermission('BILLING_UPDATE') || hasRole('SYSTEM_ADMIN') || hasRole('BILLING_SPECIALIST')) && (
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(claim.id)}
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {claim.status === 'DRAFT' && (hasPermission('BILLING_UPDATE') || hasRole('SYSTEM_ADMIN') || hasRole('BILLING_SPECIALIST')) && (
                        <button
                          className="btn-icon btn-submit"
                          onClick={() => handleSubmit(claim.id)}
                          title="Submit"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {claim.canBeEdited && (hasPermission('BILLING_DELETE') || hasRole('SYSTEM_ADMIN')) && (
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(claim.id)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BillingClaimList;

