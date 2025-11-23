import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { referralAPI } from '../services/referralAPI';
import { toast } from 'react-toastify';
import { Plus, Search, Eye, Edit, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';
import './ReferralList.css';

const ReferralList = () => {
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState([]);
  const [filteredReferrals, setFilteredReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadReferrals();
  }, []);

  useEffect(() => {
    filterReferrals();
  }, [referrals, searchTerm, statusFilter]);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const response = await referralAPI.getAll();
      setReferrals(response.data || []);
    } catch (error) {
      console.error('Error loading referrals:', error);
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const filterReferrals = () => {
    let filtered = [...referrals];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(referral =>
        referral.patientFirstName?.toLowerCase().includes(searchLower) ||
        referral.patientLastName?.toLowerCase().includes(searchLower) ||
        referral.referralSource?.toLowerCase().includes(searchLower) ||
        referral.referralNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(referral => referral.status === statusFilter);
    }

    setFilteredReferrals(filtered);
  };

  const handleAdmit = async (referralId) => {
    try {
      // Navigate to patient form with referral data prepopulated
      navigate(`/patients/new?referralId=${referralId}`);
    } catch (error) {
      console.error('Error admitting referral:', error);
      toast.error('Failed to admit referral');
    }
  };

  const handleDelete = async (referralId) => {
    if (!window.confirm('Are you sure you want to delete this referral?')) {
      return;
    }

    try {
      await referralAPI.delete(referralId);
      toast.success('Referral deleted successfully');
      loadReferrals();
    } catch (error) {
      console.error('Error deleting referral:', error);
      toast.error('Failed to delete referral');
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <span className="status-badge status-pending"><Clock size={14} /> Pending</span>;
      case 'ADMITTED':
        return <span className="status-badge status-admitted"><CheckCircle size={14} /> Admitted</span>;
      case 'DECLINED':
        return <span className="status-badge status-declined"><XCircle size={14} /> Declined</span>;
      default:
        return <span className="status-badge status-pending">{status || 'Pending'}</span>;
    }
  };

  if (loading) {
    return (
      <div className="referral-list-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="referral-list-container">
      <div className="referral-list-header">
        <h1>Referral Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/referrals/new')}
        >
          <Plus size={18} />
          New Referral
        </button>
      </div>

      <div className="referral-list-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search referrals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ADMITTED">Admitted</option>
          <option value="DECLINED">Declined</option>
        </select>
      </div>

      <div className="referral-list-table-container">
        <table className="referral-list-table">
          <thead>
            <tr>
              <th>Referral #</th>
              <th>Patient Name</th>
              <th>Referral Source</th>
              <th>Referral Date</th>
              <th>Primary Diagnosis</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReferrals.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  No referrals found
                </td>
              </tr>
            ) : (
              filteredReferrals.map((referral) => (
                <tr key={referral.id}>
                  <td>{referral.referralNumber || `REF-${referral.id}`}</td>
                  <td>
                    {referral.patientLastName}, {referral.patientFirstName}
                  </td>
                  <td>{referral.referralSource || '-'}</td>
                  <td>
                    {referral.referralDate
                      ? new Date(referral.referralDate).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>{referral.primaryDiagnosis || '-'}</td>
                  <td>{getStatusBadge(referral.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="icon-btn"
                        title="View Details"
                        onClick={() => navigate(`/referrals/${referral.id}`)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        title="Edit"
                        onClick={() => navigate(`/referrals/${referral.id}/edit`)}
                      >
                        <Edit size={16} />
                      </button>
                      {referral.status === 'PENDING' && (
                        <button
                          className="icon-btn btn-admit"
                          title="Admit"
                          onClick={() => handleAdmit(referral.id)}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button
                        className="icon-btn btn-delete"
                        title="Delete"
                        onClick={() => handleDelete(referral.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReferralList;

