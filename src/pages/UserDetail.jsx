import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userAPI } from '../services/userAPI';
import { toast } from 'react-toastify';
import { Edit, ArrowLeft, User, Mail, Phone, MapPin, Shield, Building2 } from 'lucide-react';
import './UserDetail.css';

const UserDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getById(id);
      setUser(response.data);
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Failed to load user');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="user-detail-container">
        <div className="loading">Loading user...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-detail-container">
        <div className="error">User not found</div>
      </div>
    );
  }

  return (
    <div className="user-detail-container">
      <div className="detail-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/users')}>
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1>{user.fullName || `${user.firstName} ${user.lastName}`}</h1>
            <div className="header-meta">
              <span><User size={16} /> {user.username}</span>
              <span><Mail size={16} /> {user.email}</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate(`/users/${id}/edit`)}>
            <Edit size={18} />
            Edit
          </button>
        </div>
      </div>

      <div className="detail-content">
        {/* Basic Information */}
        <div className="detail-section">
          <h2><User size={20} /> Basic Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Username</label>
              <div>{user.username}</div>
            </div>
            <div className="info-item">
              <label>Email</label>
              <div>{user.email}</div>
            </div>
            <div className="info-item">
              <label>First Name</label>
              <div>{user.firstName}</div>
            </div>
            <div className="info-item">
              <label>Last Name</label>
              <div>{user.lastName}</div>
            </div>
            {user.middleName && (
              <div className="info-item">
                <label>Middle Name</label>
                <div>{user.middleName}</div>
              </div>
            )}
            {user.dateOfBirth && (
              <div className="info-item">
                <label>Date of Birth</label>
                <div>{new Date(user.dateOfBirth).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        {(user.phoneNumber || user.mobileNumber || user.addressLine1) && (
          <div className="detail-section">
            <h2><Phone size={20} /> Contact Information</h2>
            <div className="info-grid">
              {user.phoneNumber && (
                <div className="info-item">
                  <label>Phone Number</label>
                  <div>{user.phoneNumber}</div>
                </div>
              )}
              {user.mobileNumber && (
                <div className="info-item">
                  <label>Mobile Number</label>
                  <div>{user.mobileNumber}</div>
                </div>
              )}
              {user.addressLine1 && (
                <div className="info-item full-width">
                  <label>Address</label>
                  <div>
                    {user.addressLine1}
                    {user.addressLine2 && <><br />{user.addressLine2}</>}
                    {(user.city || user.state || user.zipCode) && (
                      <><br />{[user.city, user.state, user.zipCode].filter(Boolean).join(', ')}</>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Professional Information */}
        {(user.licenseNumber || user.npiNumber) && (
          <div className="detail-section">
            <h2><Shield size={20} /> Professional Information</h2>
            <div className="info-grid">
              {user.licenseNumber && (
                <div className="info-item">
                  <label>License Number</label>
                  <div>{user.licenseNumber}</div>
                </div>
              )}
              {user.licenseState && (
                <div className="info-item">
                  <label>License State</label>
                  <div>{user.licenseState}</div>
                </div>
              )}
              {user.licenseExpiry && (
                <div className="info-item">
                  <label>License Expiry</label>
                  <div>{new Date(user.licenseExpiry).toLocaleDateString()}</div>
                </div>
              )}
              {user.npiNumber && (
                <div className="info-item">
                  <label>NPI Number</label>
                  <div>{user.npiNumber}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Roles */}
        {user.roles && user.roles.length > 0 && (
          <div className="detail-section">
            <h2><Shield size={20} /> Roles</h2>
            <div className="roles-list">
              {user.roles.map((role, idx) => (
                <div key={idx} className="role-card">
                  <h4>{role.displayName || role.roleName?.replace('ROLE_', '')}</h4>
                  {role.description && <p>{role.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organizations */}
        {user.organizations && user.organizations.length > 0 && (
          <div className="detail-section">
            <h2><Building2 size={20} /> Organizations</h2>
            <div className="orgs-list">
              {user.organizations.map((org, idx) => (
                <div key={idx} className="org-card">
                  <h4>{org.organizationName}</h4>
                  {org.organizationCode && <p>Code: {org.organizationCode}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="detail-section">
          <h2>Status</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Active</label>
              <div>
                <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            {user.isLocked && (
              <div className="info-item">
                <label>Locked</label>
                <div>
                  <span className="status-badge status-locked">Locked</span>
                </div>
              </div>
            )}
            {user.isEmailVerified && (
              <div className="info-item">
                <label>Email Verified</label>
                <div>
                  <span className="status-badge status-active">Verified</span>
                </div>
              </div>
            )}
            {user.lastLogin && (
              <div className="info-item">
                <label>Last Login</label>
                <div>{new Date(user.lastLogin).toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;

