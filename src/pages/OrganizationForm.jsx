import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { organizationAPI } from '../services/organizationAPI';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Save, X } from 'lucide-react';
import './OrganizationForm.css';

const OrganizationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasRole } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationCode: '',
    organizationName: '',
    legalName: '',
    taxId: '',
    npiNumber: '',
    phoneNumber: '',
    faxNumber: '',
    email: '',
    website: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    organizationType: 'CORPORATE',
    subscriptionTier: 'BASIC',
    isTenantActive: true,
  });

  useEffect(() => {
    if (!hasRole('SYSTEM_ADMIN')) {
      navigate('/dashboard');
      return;
    }
    if (isEditMode) {
      loadOrganization();
    }
  }, [id]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const response = await organizationAPI.getById(id);
      const org = response.data;
      
      setFormData({
        organizationCode: org.organizationCode || '',
        organizationName: org.organizationName || '',
        legalName: org.legalName || '',
        taxId: org.taxId || '',
        npiNumber: org.npiNumber || '',
        phoneNumber: org.phoneNumber || '',
        faxNumber: org.faxNumber || '',
        email: org.email || '',
        website: org.website || '',
        addressLine1: org.addressLine1 || '',
        addressLine2: org.addressLine2 || '',
        city: org.city || '',
        state: org.state || '',
        zipCode: org.zipCode || '',
      country: org.country || 'USA',
      organizationType: org.organizationType || 'CORPORATE',
      subscriptionTier: org.subscriptionTier || 'BASIC',
      isTenantActive: org.isTenantActive !== undefined ? org.isTenantActive : true,
      });
    } catch (error) {
      console.error('Error loading organization:', error);
      toast.error('Failed to load organization');
      navigate('/organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value === '' ? null : value)
    }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.organizationCode?.trim()) errors.push('Organization code is required');
    if (!formData.organizationName?.trim()) errors.push('Organization name is required');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await organizationAPI.update(id, formData);
        toast.success('Organization updated successfully');
      } else {
        await organizationAPI.create(formData);
        toast.success('Organization created successfully');
      }
      navigate('/organizations');
    } catch (error) {
      console.error('Error saving organization:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.values(errors).forEach(errorMsg => {
          toast.error(errorMsg);
        });
      } else {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save organization';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('SYSTEM_ADMIN')) {
    return null;
  }

  if (loading && !formData.organizationCode) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="organization-form-container">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Organization' : 'New Organization'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="organization-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Organization Code *</label>
              <input
                type="text"
                name="organizationCode"
                value={formData.organizationCode}
                onChange={handleChange}
                required
                disabled={isEditMode}
              />
            </div>
            <div className="form-group">
              <label>Organization Name *</label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Legal Name</label>
              <input
                type="text"
                name="legalName"
                value={formData.legalName || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Tax ID</label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>NPI Number</label>
              <input
                type="text"
                name="npiNumber"
                value={formData.npiNumber || ''}
                onChange={handleChange}
                maxLength="10"
              />
            </div>
            <div className="form-group">
              <label>Organization Type</label>
              <select
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
                required
              >
                <option value="CORPORATE">Corporate</option>
                <option value="BRANCH">Branch</option>
                <option value="REGIONAL">Regional</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Fax Number</label>
              <input
                type="text"
                name="faxNumber"
                value={formData.faxNumber || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="form-section">
          <h3>Address</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Address Line 1</label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1 || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group full-width">
              <label>Address Line 2</label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2 || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state || ''}
                onChange={handleChange}
                maxLength="2"
                placeholder="e.g., CA"
              />
            </div>
            <div className="form-group">
              <label>Zip Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="form-section">
          <h3>Status</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Subscription Tier</label>
              <select
                name="subscriptionTier"
                value={formData.subscriptionTier}
                onChange={handleChange}
                required
              >
                <option value="BASIC">Basic</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isTenantActive"
                  checked={formData.isTenantActive}
                  onChange={handleChange}
                />
                Active
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/organizations')}
            disabled={loading}
          >
            <X size={18} />
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Organization'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationForm;

