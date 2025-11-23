import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { organizationAPI } from '../services/organizationAPI';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Edit, ArrowLeft, Building2, Mail, Phone, MapPin } from 'lucide-react';
import './OrganizationDetail.css';

const OrganizationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasRole('SYSTEM_ADMIN') && !hasRole('ORG_ADMIN')) {
      navigate('/dashboard');
      return;
    }
    loadOrganization();
  }, [id]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const response = await organizationAPI.getById(id);
      setOrganization(response.data);
    } catch (error) {
      console.error('Error loading organization:', error);
      toast.error('Failed to load organization');
      navigate('/organizations');
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('SYSTEM_ADMIN') && !hasRole('ORG_ADMIN')) {
    return null;
  }

  if (loading) {
    return (
      <div className="organization-detail-container">
        <div className="loading">Loading organization...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="organization-detail-container">
        <div className="error">Organization not found</div>
      </div>
    );
  }

  return (
    <div className="organization-detail-container">
      <div className="detail-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/organizations')}>
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1>{organization.organizationName}</h1>
            <div className="header-meta">
              <span><Building2 size={16} /> {organization.organizationCode}</span>
              {organization.organizationType && <span>Type: {organization.organizationType}</span>}
            </div>
          </div>
        </div>
        {hasRole('SYSTEM_ADMIN') && (
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => navigate(`/organizations/${id}/edit`)}>
              <Edit size={18} />
              Edit
            </button>
          </div>
        )}
      </div>

      <div className="detail-content">
        {/* Basic Information */}
        <div className="detail-section">
          <h2><Building2 size={20} /> Basic Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Organization Code</label>
              <div>{organization.organizationCode}</div>
            </div>
            <div className="info-item">
              <label>Organization Name</label>
              <div>{organization.organizationName}</div>
            </div>
            {organization.legalName && (
              <div className="info-item">
                <label>Legal Name</label>
                <div>{organization.legalName}</div>
              </div>
            )}
            {organization.taxId && (
              <div className="info-item">
                <label>Tax ID</label>
                <div>{organization.taxId}</div>
              </div>
            )}
            {organization.npiNumber && (
              <div className="info-item">
                <label>NPI Number</label>
                <div>{organization.npiNumber}</div>
              </div>
            )}
            {organization.organizationType && (
              <div className="info-item">
                <label>Organization Type</label>
                <div>{organization.organizationType}</div>
              </div>
            )}
            <div className="info-item">
              <label>Status</label>
              <div>
                <span className={`status-badge ${organization.isTenantActive ? 'status-active' : 'status-inactive'}`}>
                  {organization.isTenantActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        {(organization.email || organization.phoneNumber || organization.faxNumber) && (
          <div className="detail-section">
            <h2><Phone size={20} /> Contact Information</h2>
            <div className="info-grid">
              {organization.email && (
                <div className="info-item">
                  <label>Email</label>
                  <div>
                    <Mail size={14} />
                    <span>{organization.email}</span>
                  </div>
                </div>
              )}
              {organization.phoneNumber && (
                <div className="info-item">
                  <label>Phone Number</label>
                  <div>
                    <Phone size={14} />
                    <span>{organization.phoneNumber}</span>
                  </div>
                </div>
              )}
              {organization.faxNumber && (
                <div className="info-item">
                  <label>Fax Number</label>
                  <div>{organization.faxNumber}</div>
                </div>
              )}
              {organization.website && (
                <div className="info-item">
                  <label>Website</label>
                  <div>
                    <a href={organization.website} target="_blank" rel="noopener noreferrer">
                      {organization.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Address */}
        {(organization.addressLine1 || organization.city) && (
          <div className="detail-section">
            <h2><MapPin size={20} /> Address</h2>
            <div className="info-grid">
              {organization.addressLine1 && (
                <div className="info-item full-width">
                  <label>Address</label>
                  <div>
                    {organization.addressLine1}
                    {organization.addressLine2 && <><br />{organization.addressLine2}</>}
                    {(organization.city || organization.state || organization.zipCode) && (
                      <><br />{[organization.city, organization.state, organization.zipCode].filter(Boolean).join(', ')}</>
                    )}
                    {organization.country && <><br />{organization.country}</>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subscription */}
        {organization.subscriptionTier && (
          <div className="detail-section">
            <h2>Subscription</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Subscription Tier</label>
                <div>{organization.subscriptionTier}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationDetail;

