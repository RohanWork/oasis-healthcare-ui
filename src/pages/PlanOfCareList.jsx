import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { planOfCareAPI } from '../services/planOfCareAPI';
import { toast } from 'react-toastify';
import { Plus, Eye, Edit, Trash2, Check, X, FileText } from 'lucide-react';
import './PlanOfCareList.css';

const PlanOfCareList = () => {
  const navigate = useNavigate();
  const [pocs, setPocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    loadPOCs();
  }, []);

  const loadPOCs = async () => {
    try {
      setLoading(true);
      const data = await planOfCareAPI.getAll();
      setPocs(data);
    } catch (error) {
      console.error('Error loading Plans of Care:', error);
      toast.error('Failed to load Plans of Care');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id) => {
    navigate(`/plan-of-care/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/plan-of-care/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this Plan of Care?')) {
      try {
        await planOfCareAPI.delete(id);
        toast.success('Plan of Care deleted successfully');
        loadPOCs();
      } catch (error) {
        console.error('Error deleting POC:', error);
        toast.error(error.response?.data?.message || 'Failed to delete Plan of Care');
      }
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm('Are you sure you want to approve this Plan of Care?')) {
      try {
        await planOfCareAPI.approve(id);
        toast.success('Plan of Care approved successfully');
        loadPOCs();
      } catch (error) {
        console.error('Error approving POC:', error);
        toast.error(error.response?.data?.message || 'Failed to approve Plan of Care');
      }
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        await planOfCareAPI.reject(id, reason);
        toast.success('Plan of Care rejected');
        loadPOCs();
      } catch (error) {
        console.error('Error rejecting POC:', error);
        toast.error(error.response?.data?.message || 'Failed to reject Plan of Care');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { className: 'status-draft', label: 'Draft' },
      PENDING_APPROVAL: { className: 'status-pending', label: 'Pending Approval' },
      APPROVED: { className: 'status-approved', label: 'Approved' },
      REJECTED: { className: 'status-rejected', label: 'Rejected' },
      ACTIVE: { className: 'status-active', label: 'Active' },
      COMPLETED: { className: 'status-completed', label: 'Completed' }
    };

    const config = statusConfig[status] || { className: '', label: status };
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const filteredPOCs = filterStatus === 'ALL' 
    ? pocs 
    : pocs.filter(poc => poc.status === filterStatus);

  return (
    <div className="poc-list-container">
      <div className="poc-list-header">
        <h1>Plans of Care</h1>
        <button className="btn-primary" onClick={() => navigate('/plan-of-care/new')}>
          <Plus size={20} />
          New Plan of Care
        </button>
      </div>

      <div className="poc-filters">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading Plans of Care...</div>
      ) : filteredPOCs.length === 0 ? (
        <div className="no-data">
          <FileText size={48} />
          <p>No Plans of Care found</p>
          <button className="btn-primary" onClick={() => navigate('/plan-of-care/new')}>
            Create New Plan of Care
          </button>
        </div>
      ) : (
        <div className="poc-table-container">
          <table className="poc-table">
            <thead>
              <tr>
                <th>POC Number</th>
                <th>Patient</th>
                <th>Episode</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Diagnoses</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOCs.map((poc) => (
                <tr key={poc.id}>
                  <td>{poc.pocNumber}</td>
                  <td>{poc.patientName}</td>
                  <td>{poc.episodeNumber}</td>
                  <td>{new Date(poc.startDate).toLocaleDateString()}</td>
                  <td>{poc.endDate ? new Date(poc.endDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{getStatusBadge(poc.status)}</td>
                  <td>
                    <div className="diagnosis-cell">
                      {poc.primaryDiagnosisCode && (
                        <span className="diagnosis-badge">{poc.primaryDiagnosisCode}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-view" 
                        onClick={() => handleView(poc.id)}
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {(poc.status === 'DRAFT' || poc.status === 'REJECTED') && (
                        <button 
                          className="btn-icon btn-edit" 
                          onClick={() => handleEdit(poc.id)}
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      
                      {poc.status === 'PENDING_APPROVAL' && (
                        <>
                          <button 
                            className="btn-icon btn-approve" 
                            onClick={() => handleApprove(poc.id)}
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            className="btn-icon btn-reject" 
                            onClick={() => handleReject(poc.id)}
                            title="Reject"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                      
                      {(poc.status === 'DRAFT' || poc.status === 'REJECTED') && (
                        <button 
                          className="btn-icon btn-delete" 
                          onClick={() => handleDelete(poc.id)}
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

export default PlanOfCareList;

