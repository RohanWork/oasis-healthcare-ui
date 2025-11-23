import React, { useState, useEffect } from 'react';
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
  // Start with sidebar open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return window.innerWidth >= 1024;
  });

  // Declare role checks first
  const isSystemAdmin = hasRole('SYSTEM_ADMIN');
  const isOrgAdmin = hasRole('ORG_ADMIN');
  const isRN = hasRole('RN');

  // Update body class when sidebar state changes (not for RN role)
  useEffect(() => {
    if (isRN) {
      // RN role doesn't have sidebar, so always remove the class
      document.body.classList.remove('sidebar-open');
      return;
    }
    
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [sidebarOpen, isRN]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Navbar items for SYSTEM_ADMIN, ORG_ADMIN, and RN
  const navbarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: Home,
      available: isSystemAdmin || isOrgAdmin || isRN,
    },
    {
      id: 'patients',
      label: 'Patients',
      path: '/patients',
      icon: Users,
      available: isOrgAdmin || isRN,
    },
    {
      id: 'schedule-center',
      label: 'Schedule Center',
      path: '/schedule-center',
      icon: Calendar,
      available: isRN,
    },
    {
      id: 'qa-review',
      label: 'QA Review',
      path: '/qa-review',
      icon: Shield,
      available: isOrgAdmin,
    },
    {
      id: 'billing',
      label: 'Billing',
      path: '/billing/claims',
      icon: DollarSign,
      available: isOrgAdmin,
    },
  ].filter(item => item.available);
  
  // Sidebar items - for ORG_ADMIN: User Management, Schedule Calendar
  const navigationItems = [
    {
      id: 'users',
      label: 'User Management',
      path: '/users',
      icon: UserIcon,
      available: hasPermission('USER_READ') || hasRole('SYSTEM_ADMIN') || hasRole('ORG_ADMIN'),
    },
    {
      id: 'schedule-center',
      label: 'Schedule Calendar',
      path: '/schedule-center',
      icon: Calendar,
      available: isOrgAdmin,
    },
    // Other items for non-ORG_ADMIN users
    {
      id: 'patients',
      label: 'Patients',
      path: '/patients',
      icon: Users,
      available: !isSystemAdmin && !isOrgAdmin && (hasPermission('PATIENT_READ') || hasRole('ORG_ADMIN')),
    },
    {
      id: 'plan-of-care',
      label: 'Plan of Care',
      path: '/plan-of-care',
      icon: ClipboardList,
      available: !isSystemAdmin && !isOrgAdmin && (hasPermission('POC_READ') || hasRole('ORG_ADMIN')),
    },
    {
      id: 'tasks',
      label: 'My Tasks',
      path: '/tasks',
      icon: Calendar,
      available: !isSystemAdmin && !isOrgAdmin && (hasPermission('TASK_READ') || hasRole('ORG_ADMIN') || hasRole('CLINICAL_MANAGER') || hasRole('RN') || hasRole('PT') || hasRole('OT') || hasRole('ST') || hasRole('HHA') || hasRole('SCHEDULER')),
    },
    {
      id: 'calendar',
      label: 'Calendar',
      path: '/calendar',
      icon: Calendar,
      available: !isSystemAdmin && !isOrgAdmin && (hasPermission('TASK_READ') || hasRole('ORG_ADMIN') || hasRole('CLINICAL_MANAGER') || hasRole('RN') || hasRole('PT') || hasRole('OT') || hasRole('ST') || hasRole('HHA') || hasRole('SCHEDULER')),
    },
    {
      id: 'visit-notes',
      label: 'Visit Notes',
      path: '/visit-notes',
      icon: FileText,
      available: !isSystemAdmin && !isOrgAdmin && (hasPermission('VISIT_READ') || hasRole('ORG_ADMIN') || hasRole('CLINICAL_MANAGER') || hasRole('RN') || hasRole('PT') || hasRole('OT') || hasRole('ST') || hasRole('HHA') || hasRole('QA_NURSE')),
    },
    {
      id: 'qa-review',
      label: 'QA Review',
      path: '/qa-review',
      icon: Shield,
      available: !isSystemAdmin && !isOrgAdmin && (hasPermission('OASIS_APPROVE') || hasPermission('VISIT_APPROVE') || hasRole('ORG_ADMIN') || hasRole('CLINICAL_MANAGER') || hasRole('QA_NURSE')),
    },
    {
      id: 'billing',
      label: 'Billing',
      path: '/billing/claims',
      icon: DollarSign,
      available: !isSystemAdmin && !isOrgAdmin && (hasPermission('BILLING_READ') || hasRole('BILLING_SPECIALIST') || hasRole('ORG_ADMIN')),
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
            {/* Hide menu toggle for RN role (no sidebar) */}
            {!isRN && (
              <button 
                className="menu-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>
            )}
            <div className="navbar-logo">
              <FileText size={24} className="logo-icon" />
              <span className="logo-text">OASIS</span>
            </div>
            {/* Navbar items for SYSTEM_ADMIN, ORG_ADMIN, and RN */}
            {navbarItems.map((item) => (
              <button
                key={item.id}
                className={`navbar-btn ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}
            {!isSystemAdmin && !isOrgAdmin && !isRN && (
              <div className="navbar-org">
                <Building2 size={16} />
                <span>{selectedOrganization?.organizationName || 'No Organization'}</span>
              </div>
            )}
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

      {/* Sidebar Navigation - Hidden for RN role */}
      {!isRN && (
        <>
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
              className="sidebar-overlay visible"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </>
      )}
    </>
  );
};

export default Navigation;

