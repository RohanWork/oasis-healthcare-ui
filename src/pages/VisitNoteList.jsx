import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { visitNoteAPI } from '../services/visitNoteAPI';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  Plus, Eye, Edit, Filter, Calendar, User, FileText,
  CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react';
import './VisitNoteList.css';

const VisitNoteList = () => {
  const navigate = useNavigate();
  const { hasPermission, hasRole } = useAuth();
  
  const [visitNotes, setVisitNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'ALL',
    visitType: 'ALL',
    dateFilter: 'ALL'
  });

  useEffect(() => {
    loadVisitNotes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [visitNotes, filters]);

  const loadVisitNotes = async () => {
    setLoading(true);
    try {
      const response = await visitNoteAPI.getAll();
      setVisitNotes(response.data || []);
    } catch (error) {
      console.error('Error loading visit notes:', error);
      toast.error('Failed to load visit notes');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...visitNotes];

    if (filters.status !== 'ALL') {
      filtered = filtered.filter(note => note.status === filters.status);
    }

    if (filters.visitType !== 'ALL') {
      filtered = filtered.filter(note => note.visitType === filters.visitType);
    }

    if (filters.dateFilter === 'TODAY') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(note => note.visitDate === today);
    } else if (filters.dateFilter === 'THIS_WEEK') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(note => new Date(note.visitDate) >= weekAgo);
    }

    setFilteredNotes(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { className: 'status-draft', label: 'Draft', icon: FileText },
      SUBMITTED: { className: 'status-submitted', label: 'Pending QA', icon: Clock },
      APPROVED: { className: 'status-approved', label: 'Approved', icon: CheckCircle },
      REJECTED: { className: 'status-rejected', label: 'Rejected', icon: XCircle },
      RETURNED: { className: 'status-returned', label: 'Returned', icon: AlertCircle },
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

  const getVisitTypeLabel = (visitType) => {
    const labels = {
      RN_VISIT: 'RN Visit',
      PT_VISIT: 'PT Visit',
      OT_VISIT: 'OT Visit',
      ST_VISIT: 'ST Visit',
      HHA_VISIT: 'HHA Visit',
    };
    return labels[visitType] || visitType;
  };

  if (loading) {
    return (
      <div className="visit-note-list-container">
        <div className="loading">Loading visit notes...</div>
      </div>
    );
  }

  return (
    <div className="visit-note-list-container">
      <div className="list-header">
        <h1>Visit Notes</h1>
        {(hasPermission('VISIT_CREATE') || hasRole('SYSTEM_ADMIN') || hasRole('RN') || hasRole('PT') || hasRole('OT') || hasRole('ST') || hasRole('HHA')) && (
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/visit-notes/new')}
          >
            <Plus size={20} />
            New Visit Note
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Pending QA</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Visit Type</label>
          <select
            value={filters.visitType}
            onChange={(e) => setFilters({ ...filters, visitType: e.target.value })}
          >
            <option value="ALL">All Types</option>
            <option value="RN_VISIT">RN Visit</option>
            <option value="PT_VISIT">PT Visit</option>
            <option value="OT_VISIT">OT Visit</option>
            <option value="ST_VISIT">ST Visit</option>
            <option value="HHA_VISIT">HHA Visit</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date</label>
          <select
            value={filters.dateFilter}
            onChange={(e) => setFilters({ ...filters, dateFilter: e.target.value })}
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This Week</option>
          </select>
        </div>
      </div>

      {/* Visit Notes List */}
      <div className="visit-notes-grid">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No visit notes found</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className="visit-note-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{getVisitTypeLabel(note.visitType)}</h3>
                  {getStatusBadge(note.status)}
                </div>
                <div className="card-actions">
                  <button
                    className="icon-btn"
                    onClick={() => navigate(`/visit-notes/${note.id}`)}
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  {note.status === 'DRAFT' || note.status === 'RETURNED' ? (
                    <button
                      className="icon-btn"
                      onClick={() => navigate(`/visit-notes/${note.id}/edit`)}
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <User size={16} />
                  <span>{note.patientName || 'Unknown Patient'}</span>
                </div>
                <div className="info-row">
                  <Calendar size={16} />
                  <span>{new Date(note.visitDate).toLocaleDateString()}</span>
                </div>
                {note.clinicianName && (
                  <div className="info-row">
                    <User size={16} />
                    <span>Clinician: {note.clinicianName}</span>
                  </div>
                )}
                {note.visitDurationMinutes && (
                  <div className="info-row">
                    <Clock size={16} />
                    <span>Duration: {note.visitDurationMinutes} minutes</span>
                  </div>
                )}
              </div>

              {note.chiefComplaint && (
                <div className="card-footer">
                  <p className="truncate">{note.chiefComplaint}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VisitNoteList;

