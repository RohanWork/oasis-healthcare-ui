import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData);
      
      if (result.success) {
        if (result.requiresOrganizationSelection) {
          navigate('/select-organization', { state: { organizations: result.organizations } });
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <Activity size={48} className="logo-icon" />
          </div>
          <h1 className="login-title">OASIS Home Health Care</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="usernameOrEmail" className="form-label">
              Username or Email
            </label>
            <div className="input-with-icon">
              <User size={18} className="input-icon input-icon-left" />
              <input
                type="text"
                id="usernameOrEmail"
                name="usernameOrEmail"
                className="form-input"
                placeholder="Enter your username or email"
                value={formData.usernameOrEmail}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon input-icon-left" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="form-input form-input-with-toggle"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff size={18} className="toggle-icon" />
                ) : (
                  <Eye size={18} className="toggle-icon" />
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="demo-credentials">
            <p className="demo-title">Demo Credentials:</p>
            <div className="demo-list">
              <div className="demo-item">
                <strong>System Admin:</strong> admin / Admin@123
              </div>
              <div className="demo-item">
                <strong>Organization Admin:</strong> org.admin / OrgAdmin@123
              </div>
              <div className="demo-item">
                <strong>Intake Coordinator:</strong> intake.coordinator / Intake@123
              </div>
              <div className="demo-item">
                <strong>RN (Registered Nurse):</strong> rn.johnson / RN@123
              </div>
              <div className="demo-item">
                <strong>QA Nurse:</strong> qa.nurse / QANurse@123
              </div>
              <div className="demo-item">
                <strong>Clinical Manager:</strong> clinical.manager / Clinical@123
              </div>
              <div className="demo-item">
                <strong>PT (Physical Therapist):</strong> pt.therapist / PT@123
              </div>
              <div className="demo-item">
                <strong>Scheduler:</strong> scheduler / Scheduler@123
              </div>
              <div className="demo-item">
                <strong>Billing Specialist:</strong> billing / Billing@123
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="login-background">
        <div className="background-shape shape-1"></div>
        <div className="background-shape shape-2"></div>
        <div className="background-shape shape-3"></div>
      </div>
    </div>
  );
};

export default Login;

