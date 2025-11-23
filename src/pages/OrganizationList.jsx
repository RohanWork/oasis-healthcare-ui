import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizationAPI } from '../services/organizationAPI';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Plus, Eye, Edit, Trash2, Building2, Mail, Phone } from 'lucide-react';
import './OrganizationList.css';

const OrganizationList = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasRole('SYSTEM_ADMIN')) {
      loadOrganizations();
    } else {
      setLoading(false);
    }
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await organizationAPI.getAll();
      setOrganizations(response.data || []);
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id) => {
    navigate(`/organizations/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/organizations/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this organization?')) {
      try {
        await organizationAPI.delete(id);
        toast.success('Organization deleted successfully');
        loadOrganizations();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete organization');
      }
    }
  };

  if (!hasRole('SYSTEM_ADMIN')) {
    return (
      <div className="organization-list-container">
        <div className="error">Access denied. Only SYSTEM_ADMIN can manage organizations.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="organization-list-container">
        <div className="loading">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="organization-list-container">
      <div className="list-header">
        <h1>Organizations</h1>
        <button className="btn btn-primary" onClick={() => navigate('/organizations/new')}>
          <Plus size={20} />
          New Organization
        </button>
      </div>

      {organizations.length === 0 ? (
        <div className="empty-state">
          <Building2 size={48} />
          <p>No organizations found</p>
          <button className="btn btn-primary" onClick={() => navigate('/organizations/new')}>
            Create New Organization
          </button>
        </div>
      ) : (
        <div className="organizations-table-container">
          <table className="organizations-table">
            <thead>
              <tr>
                <th>Organization Name</th>
                <th>Code</th>
                <th>NPI</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td>
                    <div className="org-name-cell">
                      <Building2 size={16} />
                      <span>{org.organizationName}</span>
                    </div>
                  </td>
                  <td>{org.organizationCode || 'N/A'}</td>
                  <td>{org.npiNumber || 'N/A'}</td>
                  <td>
                    <div className="contact-cell">
                      {org.email && (
                        <div className="contact-item">
                          <Mail size={14} />
                          <span>{org.email}</span>
                        </div>
                      )}
                      {org.phoneNumber && (
                        <div className="contact-item">
                          <Phone size={14} />
                          <span>{org.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {org.city && org.state && (
                      <span>{org.city}, {org.state}</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${org.isTenantActive ? 'status-active' : 'status-inactive'}`}>
                      {org.isTenantActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => handleView(org.id)}
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(org.id)}
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(org.id)}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
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

export default OrganizationList;

