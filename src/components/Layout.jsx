import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import { ChevronLeft } from 'lucide-react';
import './Layout.css';

const Layout = ({ children, showBackButton = false, backPath = null, backLabel = 'Back' }) => {
  return (
    <div className="app-layout">
      <Navigation />
      <main className="page-content">
        {showBackButton && backPath && (
          <BackButton path={backPath} label={backLabel} />
        )}
        {children}
      </main>
    </div>
  );
};

const BackButton = ({ path, label }) => {
  const navigate = useNavigate();
  
  return (
    <button 
      className="back-button"
      onClick={() => navigate(path)}
    >
      <ChevronLeft size={18} />
      {label}
    </button>
  );
};

export default Layout;

