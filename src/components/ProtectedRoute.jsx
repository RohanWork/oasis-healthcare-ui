import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

const ProtectedRoute = ({ children, requireOrganization = true, showBackButton = false, backPath = null, backLabel = 'Back' }) => {
  const { isAuthenticated, selectedOrganization, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // SYSTEM_ADMIN can access pages without selecting an organization
  const isSystemAdmin = hasRole('SYSTEM_ADMIN');
  
  if (requireOrganization && !selectedOrganization && !isSystemAdmin) {
    return <Navigate to="/select-organization" replace />;
  }

  return (
    <Layout showBackButton={showBackButton} backPath={backPath} backLabel={backLabel}>
      {children}
    </Layout>
  );
};

export default ProtectedRoute;

