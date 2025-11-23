import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patientAPI } from '../services/patientAPI';
import { Users, Plus, Search, Filter, Eye, Edit, Trash2, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import './PatientList.css';

const PatientList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stats, setStats] = useState({ activePatients: 0, pendingPatients: 0 });

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load patients and stats in parallel
        const [patientsResponse, statsResponse] = await Promise.allSettled([
          patientAPI.getAll(),
          patientAPI.getStats()
        ]);

        // Only update state if component is still mounted
        if (!isMounted) return;

        if (patientsResponse.status === 'fulfilled') {
          setPatients(patientsResponse.value.data);
        } else {
          const error = patientsResponse.reason;
          if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            // Backend is down - show warning toast
            console.warn('Backend server is not available. Please start the backend server.');
            toast.warn('Cannot connect to server. Please ensure the backend is running.', {
              autoClose: 5000
            });
          } else {
            console.error('Error loading patients:', error);
            const errorMessage = error.response?.data?.message || 'Failed to load patients';
            toast.error(errorMessage);
          }
        }

        if (statsResponse.status === 'fulfilled') {
          setStats(statsResponse.value.data);
        } else {
          const error = statsResponse.reason;
          if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            // Already shown warning for patients, don't duplicate
            console.warn('Backend server is not available.');
          } else {
            console.error('Error loading stats:', error);
            // Don't show toast for stats errors as they're less critical
          }
        }
      } catch (error) {
        if (!isMounted) return;
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          console.warn('Backend server is not available. Please start the backend server.');
          toast.warn('Cannot connect to server. Please ensure the backend is running.', {
            autoClose: 5000
          });
        } else {
          console.error('Error loading data:', error);
          const errorMessage = error.response?.data?.message || 'Failed to load data';
          toast.error(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Cleanup function to cancel requests and prevent state updates
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, statusFilter]);

  const filterPatients = () => {
    let filtered = [...patients];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    setFilteredPatients(filtered);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    try {
      await patientAPI.delete(id);
      toast.success('Patient deleted successfully');
      loadPatients();
      loadStats();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Failed to delete patient');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'status-badge status-active';
      case 'PENDING': return 'status-badge status-pending';
      case 'DISCHARGED': return 'status-badge status-discharged';
      case 'DECEASED': return 'status-badge status-deceased';
      case 'TRANSFERRED': return 'status-badge status-transferred';
      default: return 'status-badge';
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-left">
          <Users size={32} className="page-icon" />
          <div>
            <h1 className="page-title">Patient Management</h1>
            <p className="page-subtitle">Manage patient records and information</p>
          </div>
        </div>
        {hasPermission('PATIENT_CREATE') && (
          <button className="btn btn-primary" onClick={() => navigate('/patients/new')}>
            <Plus size={20} />
            Add New Patient
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#3b82f615', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Patients</p>
            <p className="stat-value">{stats.activePatients}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f59e0b15', color: '#f59e0b' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Pending Intake</p>
            <p className="stat-value">{stats.pendingPatients}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#10b98115', color: '#10b981' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Patients</p>
            <p className="stat-value">{patients.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or MRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <Filter size={20} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="DISCHARGED">Discharged</option>
            <option value="DECEASED">Deceased</option>
            <option value="TRANSFERRED">Transferred</option>
          </select>
        </div>
      </div>

      {/* Patient List */}
      <div className="card">
        {filteredPatients.length === 0 ? (
          <div className="empty-state">
            <Users size={64} />
            <h3>No patients found</h3>
            <p>
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first patient'}
            </p>
            {hasPermission('PATIENT_CREATE') && (
              <button className="btn btn-primary" onClick={() => navigate('/patients/new')}>
                <Plus size={20} />
                Add Patient
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>MRN</th>
                  <th>Patient Name</th>
                  <th>Date of Birth</th>
                  <th>Age</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Admission Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="font-mono">{patient.medicalRecordNumber}</td>
                    <td className="font-semibold">{patient.fullName}</td>
                    <td>{new Date(patient.dateOfBirth).toLocaleDateString()}</td>
                    <td>{patient.age}</td>
                    <td>{patient.phoneNumber || patient.mobileNumber || '-'}</td>
                    <td>
                      <span className={getStatusBadgeClass(patient.status)}>
                        {patient.status}
                      </span>
                    </td>
                    <td>
                      {patient.admissionDate
                        ? new Date(patient.admissionDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {hasPermission('PATIENT_READ') && (
                          <button
                            className="btn-icon btn-icon-primary"
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        {hasPermission('PATIENT_UPDATE') && (
                          <button
                            className="btn-icon btn-icon-secondary"
                            onClick={() => navigate(`/patients/${patient.id}/edit`)}
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        <button
                          className="btn-icon btn-icon-success"
                          onClick={() => navigate(`/oasis/new/${patient.id}`)}
                          title="Create OASIS Assessment"
                        >
                          <FileText size={18} />
                        </button>
                        {hasPermission('PATIENT_DELETE') && (
                          <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => handleDelete(patient.id)}
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
    </div>
  );
};

export default PatientList;

