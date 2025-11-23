import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userAPI } from '../services/userAPI';
import { roleAPI } from '../services/roleAPI';
import { organizationAPI } from '../services/organizationAPI';
import { toast } from 'react-toastify';
import { Save, X, User } from 'lucide-react';
import './UserForm.css';

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    middleName: '',
    phoneNumber: '',
    mobileNumber: '',
    dateOfBirth: '',
    licenseNumber: '',
    licenseState: '',
    licenseExpiry: '',
    npiNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    isEmailVerified: false,
    isLocked: false,
    isActive: true,
    roleIds: [],
    organizationIds: [],
  });

  useEffect(() => {
    loadRoles();
    loadOrganizations();
    if (isEditMode) {
      loadUser();
    }
  }, [id]);

  const loadRoles = async () => {
    try {
      const response = await roleAPI.getAll();
      setRoles(response.data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await organizationAPI.getAll();
      setOrganizations(response.data || []);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getById(id);
      const user = response.data;
      
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Don't load password
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName || '',
        phoneNumber: user.phoneNumber || '',
        mobileNumber: user.mobileNumber || '',
        dateOfBirth: user.dateOfBirth || '',
        licenseNumber: user.licenseNumber || '',
        licenseState: user.licenseState || '',
        licenseExpiry: user.licenseExpiry || '',
        npiNumber: user.npiNumber || '',
        addressLine1: user.addressLine1 || '',
        addressLine2: user.addressLine2 || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        isEmailVerified: user.isEmailVerified || false,
        isLocked: user.isLocked || false,
        isActive: user.isActive !== undefined ? user.isActive : true,
        roleIds: user.roles ? user.roles.map(r => r.id) : [],
        organizationIds: user.organizations ? user.organizations.map(o => o.id) : [],
      });
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Failed to load user');
      navigate('/users');
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

  const handleMultiSelect = (name, value) => {
    setFormData(prev => {
      const currentValues = prev[name] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [name]: newValues };
    });
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.username?.trim()) errors.push('Username is required');
    if (!formData.email?.trim()) errors.push('Email is required');
    if (!formData.firstName?.trim()) errors.push('First name is required');
    if (!formData.lastName?.trim()) errors.push('Last name is required');
    if (!isEditMode && !formData.password?.trim()) errors.push('Password is required');
    if (formData.password && formData.password.length < 8) errors.push('Password must be at least 8 characters');
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
      const dataToSend = {
        ...formData,
        password: formData.password || undefined, // Only send password if provided
        roleIds: formData.roleIds.length > 0 ? formData.roleIds : undefined,
        organizationIds: formData.organizationIds.length > 0 ? formData.organizationIds : undefined,
      };

      if (isEditMode) {
        await userAPI.update(id, dataToSend);
        toast.success('User updated successfully');
      } else {
        await userAPI.create(dataToSend);
        toast.success('User created successfully');
      }
      navigate('/users');
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save user';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.username) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="user-form-container">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit User' : 'New User'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="user-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={isEditMode}
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Password {!isEditMode && '*'}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!isEditMode}
                placeholder={isEditMode ? "Leave blank to keep current password" : ""}
              />
            </div>
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth || ''}
                onChange={handleChange}
              />
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
              <label>Mobile Number</label>
              <input
                type="text"
                name="mobileNumber"
                value={formData.mobileNumber || ''}
                onChange={handleChange}
              />
            </div>
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
          </div>
        </div>

        {/* Professional Information */}
        <div className="form-section">
          <h3>Professional Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>License Number</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>License State</label>
              <input
                type="text"
                name="licenseState"
                value={formData.licenseState || ''}
                onChange={handleChange}
                maxLength="2"
              />
            </div>
            <div className="form-group">
              <label>License Expiry</label>
              <input
                type="date"
                name="licenseExpiry"
                value={formData.licenseExpiry || ''}
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
          </div>
        </div>

        {/* Roles and Organizations */}
        <div className="form-section">
          <h3>Roles and Organizations</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Roles</label>
              <div className="multi-select-container">
                {roles.map(role => (
                  <label key={role.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.roleIds.includes(role.id)}
                      onChange={() => handleMultiSelect('roleIds', role.id)}
                    />
                    <span>{role.displayName || role.roleName?.replace('ROLE_', '')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group full-width">
              <label>Organizations</label>
              <div className="multi-select-container">
                {organizations.map(org => (
                  <label key={org.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.organizationIds.includes(org.id)}
                      onChange={() => handleMultiSelect('organizationIds', org.id)}
                    />
                    <span>{org.organizationName}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="form-section">
          <h3>Status</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                Active
              </label>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isLocked"
                  checked={formData.isLocked}
                  onChange={handleChange}
                />
                Locked
              </label>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isEmailVerified"
                  checked={formData.isEmailVerified}
                  onChange={handleChange}
                />
                Email Verified
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/users')}
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
            {loading ? 'Saving...' : 'Save User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;

