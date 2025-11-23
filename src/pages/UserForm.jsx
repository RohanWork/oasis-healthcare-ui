import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const { hasRole, selectedOrganization, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  // Check if current user is SYSTEM_ADMIN - verify role from user object
  const isSystemAdmin = hasRole('ROLE_SYSTEM_ADMIN') || 
    user?.roles?.some(r => r.roleName === 'ROLE_SYSTEM_ADMIN' || r.roleName === 'SYSTEM_ADMIN');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Clear organizationIds if SYSTEM_ADMIN is creating a new user (prevent auto-assignment)
  useEffect(() => {
    if (!isEditMode && user) {
      const userIsSystemAdmin = hasRole('ROLE_SYSTEM_ADMIN') || 
        user?.roles?.some(r => r.roleName === 'ROLE_SYSTEM_ADMIN' || r.roleName === 'SYSTEM_ADMIN');
      if (userIsSystemAdmin && formData.organizationIds.length > 0) {
        // Clear any auto-assigned organizations for SYSTEM_ADMIN
        setFormData(prev => ({
          ...prev,
          organizationIds: []
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isEditMode]);

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
      let response;
      // Double-check if user is SYSTEM_ADMIN - wait for user to be available
      const userIsSystemAdmin = user && (hasRole('ROLE_SYSTEM_ADMIN') || 
        user?.roles?.some(r => r.roleName === 'ROLE_SYSTEM_ADMIN' || r.roleName === 'SYSTEM_ADMIN'));
      
      if (userIsSystemAdmin) {
        // SYSTEM_ADMIN can see all organizations - NO auto-assignment
        response = await organizationAPI.getAll();
        const orgs = response.data || [];
        setOrganizations(orgs);
        // Explicitly ensure organizationIds is empty for SYSTEM_ADMIN creating new users
        if (!isEditMode) {
          setFormData(prev => ({
            ...prev,
            organizationIds: [] // Clear any pre-existing values
          }));
        }
      } else if (user) {
        // Only auto-assign if user is loaded and confirmed to be ORG_ADMIN
        // ORG_ADMIN can only see their own organization - auto-assign it
        response = await organizationAPI.getMyOrganizations();
        const orgs = response.data || [];
        setOrganizations(orgs);
        
        // Auto-assign for ORG_ADMIN creating a new user
        if (!isEditMode && orgs.length > 0) {
          const orgToAssign = orgs[0] || selectedOrganization;
          if (orgToAssign) {
            setFormData(prev => ({
              ...prev,
              organizationIds: [orgToAssign.id]
            }));
          }
        }
      } else {
        // User not loaded yet - just load organizations without auto-assigning
        // Try SYSTEM_ADMIN endpoint first (will fail if not SYSTEM_ADMIN, then try ORG_ADMIN)
        try {
          response = await organizationAPI.getAll();
          const orgs = response.data || [];
          setOrganizations(orgs);
          // Don't auto-assign until we know the user's role
        } catch (sysAdminError) {
          // If SYSTEM_ADMIN endpoint fails, try ORG_ADMIN endpoint
          if (sysAdminError.response?.status === 403) {
            response = await organizationAPI.getMyOrganizations();
            const orgs = response.data || [];
            setOrganizations(orgs);
            // Don't auto-assign until user is confirmed
          } else {
            throw sysAdminError;
          }
        }
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      const userIsSystemAdmin = user && (hasRole('ROLE_SYSTEM_ADMIN') || 
        user?.roles?.some(r => r.roleName === 'ROLE_SYSTEM_ADMIN' || r.roleName === 'SYSTEM_ADMIN'));
      if (userIsSystemAdmin || error.response?.status !== 403) {
        toast.error('Failed to load organizations');
      }
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
    if (formData.roleIds.length === 0) errors.push('At least one role is required');
    // For SYSTEM_ADMIN creating users, organization assignment is optional but recommended
    // For ORG_ADMIN, organization is auto-assigned, so we don't need to validate
    if (isSystemAdmin && formData.organizationIds.length === 0) {
      // Check if any selected role requires organization (like ORG_ADMIN)
      const selectedRoles = roles.filter(r => formData.roleIds.includes(r.id));
      const requiresOrg = selectedRoles.some(r => r.roleName === 'ROLE_ORG_ADMIN');
      if (requiresOrg) {
        errors.push('Organization assignment is required for Organization Admin role');
      }
    }
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
              <label>
                Organizations 
                {(() => {
                  const userIsSystemAdmin = hasRole('ROLE_SYSTEM_ADMIN') || 
                    user?.roles?.some(r => r.roleName === 'ROLE_SYSTEM_ADMIN' || r.roleName === 'SYSTEM_ADMIN');
                  if (!userIsSystemAdmin && !isEditMode) {
                    return ' (Auto-assigned to your organization)';
                  }
                  if (userIsSystemAdmin && !isEditMode) {
                    return <span style={{fontSize: '0.875rem', fontWeight: 'normal', color: '#6b7280'}}> * Required for Organization Admin role</span>;
                  }
                  return null;
                })()}
              </label>
              <div className="multi-select-container">
                {organizations.length > 0 ? (
                  organizations.map(org => {
                    const isChecked = formData.organizationIds.includes(org.id);
                    // Check if current user is SYSTEM_ADMIN
                    const userIsSystemAdmin = hasRole('ROLE_SYSTEM_ADMIN') || 
                      user?.roles?.some(r => r.roleName === 'ROLE_SYSTEM_ADMIN' || r.roleName === 'SYSTEM_ADMIN');
                    // Only disable for ORG_ADMIN creating new users (not for SYSTEM_ADMIN)
                    const isDisabled = !userIsSystemAdmin && !isEditMode;
                    return (
                      <label 
                        key={org.id} 
                        className="checkbox-label" 
                        style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                        onClick={(e) => {
                          // Prevent label click from triggering if disabled
                          if (isDisabled) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (!isDisabled) {
                              handleMultiSelect('organizationIds', org.id);
                            }
                          }}
                          disabled={isDisabled}
                          style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                        />
                        <span>
                          {org.organizationName}
                          {!userIsSystemAdmin && !isEditMode && isChecked && (
                            <span style={{fontSize: '0.75rem', color: '#6b7280', marginLeft: '8px'}}>(Auto-assigned)</span>
                          )}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-muted">No organizations available</p>
                )}
              </div>
              {(() => {
                const userIsSystemAdmin = hasRole('ROLE_SYSTEM_ADMIN') || 
                  user?.roles?.some(r => r.roleName === 'ROLE_SYSTEM_ADMIN' || r.roleName === 'SYSTEM_ADMIN');
                if (!userIsSystemAdmin && !isEditMode && formData.organizationIds.length > 0) {
                  return (
                    <p style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '4px'}}>
                      As an Organization Admin, users are automatically assigned to your organization.
                    </p>
                  );
                }
                if (userIsSystemAdmin && !isEditMode) {
                  return (
                    <p style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '4px'}}>
                      Select one or more organizations to assign to this user. Organization Admin role requires at least one organization.
                    </p>
                  );
                }
                return null;
              })()}
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

