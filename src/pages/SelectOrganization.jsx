import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizationAPI } from '../services/organizationAPI';
import { Building2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import './SelectOrganization.css';

const SelectOrganization = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectOrganization, organizations: authOrganizations, user, hasRole } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // For SYSTEM_ADMIN, fetch all organizations; otherwise use assigned organizations
  useEffect(() => {
    const loadOrganizations = async () => {
      if (hasRole('SYSTEM_ADMIN')) {
        // SYSTEM_ADMIN can select any organization
        setLoadingOrgs(true);
        try {
          const response = await organizationAPI.getAll();
          setOrganizations(response.data || []);
        } catch (error) {
          console.error('Error loading organizations:', error);
          // Fallback to assigned organizations if API fails
          setOrganizations(location.state?.organizations || authOrganizations || []);
        } finally {
          setLoadingOrgs(false);
        }
      } else {
        // Other users use their assigned organizations
        setOrganizations(location.state?.organizations || authOrganizations || []);
      }
    };

    loadOrganizations();
  }, [hasRole, location.state, authOrganizations]);

  // Auto-select if only one organization (especially for ORG_ADMIN)
  useEffect(() => {
    if (organizations && organizations.length === 1 && !selectedOrgId && !loading && !loadingOrgs) {
      const singleOrg = organizations[0];
      setSelectedOrgId(singleOrg.id);
      // Auto-select and proceed if only one organization
      handleSelectOrganizationAuto(singleOrg.id);
    }
  }, [organizations, loadingOrgs]);

  const handleSelectOrganizationAuto = async (orgId) => {
    setError('');
    setLoading(true);

    try {
      const result = await selectOrganization(orgId);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleSelectOrganization = async (orgId = null) => {
    const orgToSelect = orgId || selectedOrgId;
    
    // Validate that we have an organization ID
    if (!orgToSelect && orgToSelect !== 0) {
      setError('Please select an organization');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await selectOrganization(orgToSelect);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Failed to select organization');
      }
    } catch (err) {
      console.error('Error selecting organization:', err);
      setError(err?.message || err?.response?.data?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="select-org-container">
      <div className="select-org-card">
        <div className="select-org-header">
          <Building2 size={48} className="header-icon" />
          <h1 className="select-org-title">Select Organization</h1>
          <p className="select-org-subtitle">
            Choose the organization you want to work with
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="organizations-list">
          {loadingOrgs ? (
            <div className="loading-state">
              <div className="spinner-small"></div>
              <p>Loading organizations...</p>
            </div>
          ) : organizations && organizations.length > 0 ? (
            organizations.map((org) => (
              <div
                key={org.id}
                className={`organization-card ${selectedOrgId === org.id ? 'selected' : ''}`}
                onClick={() => {
                  if (org.id != null) {
                    setSelectedOrgId(org.id);
                  } else {
                    setError('Invalid organization: missing ID');
                  }
                }}
              >
                <div className="org-card-content">
                  <div className="org-icon">
                    <Building2 size={24} />
                  </div>
                  <div className="org-details">
                    <h3 className="org-name">{org.organizationName}</h3>
                    <p className="org-code">{org.organizationCode}</p>
                    {org.city && org.state && (
                      <p className="org-location">
                        {org.city}, {org.state}
                      </p>
                    )}
                    {org.organizationType && (
                      <span className="org-type-badge">{org.organizationType}</span>
                    )}
                  </div>
                </div>
                {selectedOrgId === org.id && (
                  <div className="org-selected-indicator">
                    <CheckCircle size={24} />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-organizations">
              <AlertCircle size={48} />
              <p>No organizations available</p>
              {hasRole('SYSTEM_ADMIN') && (
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  As a System Administrator, you can create an organization from the{' '}
                  <button
                    onClick={() => navigate('/organizations')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6366f1',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 'inherit'
                    }}
                  >
                    Organizations
                  </button>{' '}
                  page.
                </p>
              )}
            </div>
          )}
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={(e) => {
            e.preventDefault();
            handleSelectOrganization();
          }}
          disabled={!selectedOrgId || loading}
        >
          {loading ? (
            <>
              <div className="spinner-small"></div>
              Loading...
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SelectOrganization;

