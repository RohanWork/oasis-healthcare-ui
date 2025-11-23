import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    const storedOrg = localStorage.getItem('selectedOrganization');
    const storedPermissions = localStorage.getItem('permissions');
    const storedOrganizations = localStorage.getItem('organizations');

    if (token && storedUser) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp > currentTime) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          
          if (storedOrg) {
            setSelectedOrganization(JSON.parse(storedOrg));
          }
          
          if (storedPermissions) {
            setPermissions(JSON.parse(storedPermissions));
          }
          
          if (storedOrganizations) {
            setOrganizations(JSON.parse(storedOrganizations));
          }
        } else {
          // Token expired
          logout();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { accessToken, refreshToken, userId, username, email, fullName, roles, organizations: userOrgs } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Store user info
      const userData = { userId, username, email, fullName, roles };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      // Store organizations in both state and localStorage
      setOrganizations(userOrgs);
      localStorage.setItem('organizations', JSON.stringify(userOrgs));

      return { success: true, requiresOrganizationSelection: userOrgs.length > 0, organizations: userOrgs };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const selectOrganization = async (organizationId) => {
    try {
      // Ensure we're sending only the ID value, not an object
      const orgId = typeof organizationId === 'object' ? organizationId?.id || organizationId?.organizationId : organizationId;
      const response = await authAPI.selectOrganization(orgId);
      const { accessToken, selectedOrganization: org, permissions: userPermissions } = response.data;

      // Update token with organization context
      localStorage.setItem('accessToken', accessToken);
      
      // Store selected organization
      localStorage.setItem('selectedOrganization', JSON.stringify(org));
      setSelectedOrganization(org);

      // Store permissions
      localStorage.setItem('permissions', JSON.stringify(userPermissions));
      setPermissions(userPermissions);

      return { success: true };
    } catch (error) {
      // Safely log error without circular reference issues
      console.error('Organization selection error:', error);
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data?.error 
        || error?.message 
        || `Failed to select organization. Status: ${error?.response?.status || 'Unknown'}`;
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = () => {
    try {
      authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all stored data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedOrganization');
      localStorage.removeItem('permissions');
      localStorage.removeItem('organizations');
      
      setUser(null);
      setOrganizations([]);
      setSelectedOrganization(null);
      setPermissions([]);
      setIsAuthenticated(false);
    }
  };

  const hasPermission = (permissionName) => {
    return permissions.some(p => p.permissionName === permissionName);
  };

  const hasRole = (roleName) => {
    return user?.roles?.some(r => r.roleName === roleName) || false;
  };

  const value = {
    user,
    organizations,
    selectedOrganization,
    permissions,
    loading,
    isAuthenticated,
    login,
    logout,
    selectOrganization,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

