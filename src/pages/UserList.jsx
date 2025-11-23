import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/userAPI';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Plus, Eye, Edit, Trash2, User, Shield, Mail, Phone } from 'lucide-react';
import './UserList.css';

const UserList = () => {
  const navigate = useNavigate();
  const { hasPermission, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAll();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id) => {
    navigate(`/users/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/users/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.delete(id);
        toast.success('User deleted successfully');
        loadUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  if (loading) {
    return (
      <div className="user-list-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-list-container">
      <div className="list-header">
        <h1>Users</h1>
        {(hasPermission('USER_CREATE') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN')) && (
          <button className="btn btn-primary" onClick={() => navigate('/users/new')}>
            <Plus size={20} />
            New User
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <User size={48} />
          <p>No users found</p>
          {(hasPermission('USER_CREATE') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN')) && (
            <button className="btn btn-primary" onClick={() => navigate('/users/new')}>
              Create New User
            </button>
          )}
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Roles</th>
                <th>Organizations</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-name-cell">
                      <User size={16} />
                      <span>{user.fullName || `${user.firstName} ${user.lastName}`}</span>
                    </div>
                  </td>
                  <td>{user.username}</td>
                  <td>
                    <div className="email-cell">
                      <Mail size={14} />
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td>
                    {user.phoneNumber && (
                      <div className="phone-cell">
                        <Phone size={14} />
                        <span>{user.phoneNumber}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="roles-cell">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role, idx) => (
                          <span key={idx} className="role-badge">
                            {role.displayName || role.roleName?.replace('ROLE_', '')}
                          </span>
                        ))
                      ) : (
                        <span className="no-roles">No roles</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="orgs-cell">
                      {user.organizations && user.organizations.length > 0 ? (
                        user.organizations.map((org, idx) => (
                          <span key={idx} className="org-badge">
                            {org.organizationName}
                          </span>
                        ))
                      ) : (
                        <span className="no-orgs">No organizations</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="status-cell">
                      {user.isActive ? (
                        <span className="status-badge status-active">Active</span>
                      ) : (
                        <span className="status-badge status-inactive">Inactive</span>
                      )}
                      {user.isLocked && (
                        <span className="status-badge status-locked">Locked</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => handleView(user.id)}
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      {(hasPermission('USER_UPDATE') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN')) && (
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(user.id)}
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {(hasPermission('USER_DELETE') || hasRole('SYSTEM_ADMIN')) && (
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(user.id)}
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

export default UserList;

