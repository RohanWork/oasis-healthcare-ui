import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Users,
  FileText,
  Calendar,
  DollarSign,
  Shield,
  LogOut,
  User as UserIcon,
  Building2,
  Menu,
  X,
  ChevronLeft,
  ClipboardList
} from 'lucide-react';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, selectedOrganization, logout, hasRole, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: Home,
      available: true,
    },
    {
      id: 'patients',
      label: 'Patients',
      path: '/patients',
      icon: Users,
      available: hasPermission('PATIENT_READ') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN'),
    },
    {
      id: 'plan-of-care',
      label: 'Plan of Care',
      path: '/plan-of-care',
      icon: ClipboardList,
      available: hasPermission('POC_READ') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN'),
    },
    {
      id: 'tasks',
      label: 'My Tasks',
      path: '/tasks',
      icon: Calendar,
      available: hasPermission('TASK_READ') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN') || hasRole('CLINICAL_MANAGER') || hasRole('RN') || hasRole('PT') || hasRole('OT') || hasRole('ST') || hasRole('HHA') || hasRole('SCHEDULER'),
    },
    {
      id: 'calendar',
      label: 'Calendar',
      path: '/calendar',
      icon: Calendar,
      available: hasPermission('TASK_READ') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN') || hasRole('CLINICAL_MANAGER') || hasRole('RN') || hasRole('PT') || hasRole('OT') || hasRole('ST') || hasRole('HHA') || hasRole('SCHEDULER'),
    },
    {
      id: 'schedule-center',
      label: 'Schedule Center',
      path: '/schedule-center',
      icon: Calendar,
      available: hasRole('RN') || hasRole('PT') || hasRole('OT') || hasRole('CLINICAL_MANAGER') || hasRole('SCHEDULER') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN'),
    },
    {
      id: 'visit-notes',
      label: 'Visit Notes',
      path: '/visit-notes',
      icon: FileText,
      available: hasPermission('VISIT_READ') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN') || hasRole('CLINICAL_MANAGER') || hasRole('RN') || hasRole('PT') || hasRole('OT') || hasRole('ST') || hasRole('HHA') || hasRole('QA_NURSE'),
    },
    {
      id: 'qa-review',
      label: 'QA Review',
      path: '/qa-review',
      icon: Shield,
      available: hasPermission('OASIS_APPROVE') || hasPermission('VISIT_APPROVE') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN') || hasRole('CLINICAL_MANAGER') || hasRole('QA_NURSE'),
    },
    {
      id: 'billing',
      label: 'Billing',
      path: '/billing/claims',
      icon: DollarSign,
      available: hasPermission('BILLING_READ') || hasRole('SYSTEM_ADMIN') || hasRole('BILLING_SPECIALIST') || hasRole('ORG_ADMIN'),
    },
    {
      id: 'users',
      label: 'User Management',
      path: '/users',
      icon: UserIcon,
      available: hasPermission('USER_READ') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN'),
    },
    {
      id: 'organizations',
      label: 'Organizations',
      path: '/organizations',
      icon: Building2,
      available: hasRole('SYSTEM_ADMIN'),
    },
  ].filter(item => item.available);

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="navbar-content">
          <div className="navbar-left">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
            <div className="navbar-logo">
              <FileText size={24} className="logo-icon" />
              <span className="logo-text">OASIS</span>
            </div>
            <div className="navbar-org">
              <Building2 size={16} />
              <span>{selectedOrganization?.organizationName || 'No Organization'}</span>
            </div>
          </div>
          
          <div className="navbar-right">
            <div className="navbar-user">
              <UserIcon size={18} />
              <div className="user-details">
                <span className="user-name">{user?.fullName || user?.username}</span>
                <span className="user-role">
                  {user?.roles?.[0]?.displayName || user?.roles?.[0]?.roleName}
                </span>
              </div>
            </div>
            <button className="btn-logout" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Navigation</h2>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${isActive(item.path) ? 'active' : ''} ${item.comingSoon ? 'coming-soon' : ''}`}
              onClick={() => {
                if (!item.comingSoon) {
                  navigate(item.path);
                  setSidebarOpen(false);
                }
              }}
              disabled={item.comingSoon}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.comingSoon && <span className="coming-soon-badge">Soon</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Navigation;

