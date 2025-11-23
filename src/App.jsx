import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import SelectOrganization from './pages/SelectOrganization';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import PatientForm from './pages/PatientForm';
import OasisForm from './pages/OasisForm';
import OasisFormComplete from './pages/OasisFormComplete';
import OasisQAReview from './pages/OasisQAReview';
import PlanOfCareList from './pages/PlanOfCareList';
import PlanOfCareDetail from './pages/PlanOfCareDetail';
import PlanOfCareForm from './pages/PlanOfCareForm';
import TaskCalendar from './pages/TaskCalendar';
import TaskList from './pages/TaskList';
import ScheduleCenter from './pages/ScheduleCenter';
import VisitNoteList from './pages/VisitNoteList';
import VisitNoteForm from './pages/VisitNoteForm';
import TaskDetail from './pages/TaskDetail';
import TaskForm from './pages/TaskForm';
import UserList from './pages/UserList';
import UserForm from './pages/UserForm';
import UserDetail from './pages/UserDetail';
import OrganizationList from './pages/OrganizationList';
import OrganizationForm from './pages/OrganizationForm';
import OrganizationDetail from './pages/OrganizationDetail';
import UnifiedQAReview from './pages/UnifiedQAReview';
import BillingClaimList from './pages/BillingClaimList';
import BillingClaimForm from './pages/BillingClaimForm';
import BillingClaimDetail from './pages/BillingClaimDetail';
import EpisodeDetail from './pages/EpisodeDetail';
import ReferralList from './pages/ReferralList';
import ReferralForm from './pages/ReferralForm';
import ReferralDetail from './pages/ReferralDetail';
import Reports from './pages/Reports';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/select-organization" 
            element={
              <ProtectedRoute requireOrganization={false}>
                <SelectOrganization />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Patient Routes */}
          <Route 
            path="/patients" 
            element={
              <ProtectedRoute>
                <PatientList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patients/new" 
            element={
              <ProtectedRoute showBackButton backPath="/patients" backLabel="Back to Patients">
                <PatientForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patients/:id/edit" 
            element={
              <ProtectedRoute showBackButton backPath="/patients" backLabel="Back to Patients">
                <PatientForm />
              </ProtectedRoute>
            } 
          />
          
          {/* Referral Routes */}
          <Route 
            path="/referrals" 
            element={
              <ProtectedRoute>
                <ReferralList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/referrals/new" 
            element={
              <ProtectedRoute showBackButton backPath="/referrals" backLabel="Back to Referrals">
                <ReferralForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/referrals/:id" 
            element={
              <ProtectedRoute showBackButton backPath="/referrals" backLabel="Back to Referrals">
                <ReferralDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/referrals/:id/edit" 
            element={
              <ProtectedRoute showBackButton backPath="/referrals" backLabel="Back to Referrals">
                <ReferralForm />
              </ProtectedRoute>
            } 
          />
          
          {/* OASIS Routes - Complete OASIS-E1 Form */}
          <Route 
            path="/oasis-complete/new" 
            element={
              <ProtectedRoute>
                <OasisFormComplete />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/oasis-complete/:id" 
            element={
              <ProtectedRoute>
                <OasisFormComplete />
              </ProtectedRoute>
            } 
          />
          
          {/* Legacy OASIS Routes (keep for backward compatibility) */}
          <Route 
            path="/oasis/new/:patientId" 
            element={
              <ProtectedRoute showBackButton backPath="/patients" backLabel="Back to Patients">
                <OasisForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/oasis/edit/:id/:patientId" 
            element={
              <ProtectedRoute showBackButton backPath="/patients" backLabel="Back to Patients">
                <OasisForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/oasis/qa-review" 
            element={
              <ProtectedRoute>
                <OasisQAReview />
              </ProtectedRoute>
            } 
          />
          
          {/* Plan of Care Routes */}
          <Route 
            path="/plan-of-care" 
            element={
              <ProtectedRoute>
                <PlanOfCareList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/plan-of-care/new" 
            element={
              <ProtectedRoute showBackButton backPath="/plan-of-care" backLabel="Back to Plans of Care">
                <PlanOfCareForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/plan-of-care/:id" 
            element={
              <ProtectedRoute showBackButton backPath="/plan-of-care" backLabel="Back to Plans of Care">
                <PlanOfCareDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/plan-of-care/edit/:id" 
            element={
              <ProtectedRoute showBackButton backPath="/plan-of-care" backLabel="Back to Plans of Care">
                <PlanOfCareForm />
              </ProtectedRoute>
            } 
          />
          
          {/* Task/Calendar Routes */}
          <Route 
            path="/tasks" 
            element={
              <ProtectedRoute>
                <TaskList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tasks/new" 
            element={
              <ProtectedRoute showBackButton backPath="/tasks" backLabel="Back to Tasks">
                <TaskForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tasks/:id" 
            element={
              <ProtectedRoute showBackButton backPath="/tasks" backLabel="Back to Tasks">
                <TaskDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tasks/:id/edit" 
            element={
              <ProtectedRoute showBackButton backPath="/tasks" backLabel="Back to Tasks">
                <TaskForm />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <TaskCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule-center"
            element={
              <ProtectedRoute>
                <ScheduleCenter />
              </ProtectedRoute>
            }
          />
          
          {/* Visit Note Routes */}
          <Route
            path="/visit-notes"
            element={
              <ProtectedRoute>
                <VisitNoteList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visit-notes/new"
            element={
              <ProtectedRoute showBackButton backPath="/visit-notes" backLabel="Back to Visit Notes">
                <VisitNoteForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visit-notes/:id"
            element={
              <ProtectedRoute showBackButton backPath="/visit-notes" backLabel="Back to Visit Notes">
                <VisitNoteForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visit-notes/:id/edit"
            element={
              <ProtectedRoute showBackButton backPath="/visit-notes" backLabel="Back to Visit Notes">
                <VisitNoteForm />
              </ProtectedRoute>
            }
          />
          
          {/* User Management Routes */}
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/new"
            element={
              <ProtectedRoute showBackButton backPath="/users" backLabel="Back to Users">
                <UserForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <ProtectedRoute showBackButton backPath="/users" backLabel="Back to Users">
                <UserDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id/edit"
            element={
              <ProtectedRoute showBackButton backPath="/users" backLabel="Back to Users">
                <UserForm />
              </ProtectedRoute>
            }
          />
          
          {/* Organization Management Routes - SYSTEM_ADMIN can access without selecting organization */}
          <Route
            path="/organizations"
            element={
              <ProtectedRoute requireOrganization={false}>
                <OrganizationList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizations/new"
            element={
              <ProtectedRoute requireOrganization={false} showBackButton backPath="/organizations" backLabel="Back to Organizations">
                <OrganizationForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizations/:id"
            element={
              <ProtectedRoute requireOrganization={false} showBackButton backPath="/organizations" backLabel="Back to Organizations">
                <OrganizationDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizations/:id/edit"
            element={
              <ProtectedRoute requireOrganization={false} showBackButton backPath="/organizations" backLabel="Back to Organizations">
                <OrganizationForm />
              </ProtectedRoute>
            }
          />
          
          {/* QA Review Routes */}
          <Route
            path="/qa-review"
            element={
              <ProtectedRoute>
                <UnifiedQAReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/oasis/qa-review"
            element={
              <ProtectedRoute>
                <UnifiedQAReview />
              </ProtectedRoute>
            }
          />
          
          {/* Billing Routes */}
          <Route
            path="/billing/claims"
            element={
              <ProtectedRoute>
                <BillingClaimList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/claims/new"
            element={
              <ProtectedRoute showBackButton backPath="/billing/claims" backLabel="Back to Billing Claims">
                <BillingClaimForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/claims/:id"
            element={
              <ProtectedRoute showBackButton backPath="/billing/claims" backLabel="Back to Billing Claims">
                <BillingClaimDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/claims/:id/edit"
            element={
              <ProtectedRoute showBackButton backPath="/billing/claims" backLabel="Back to Billing Claims">
                <BillingClaimForm />
              </ProtectedRoute>
            }
          />
          
          {/* Episode Routes */}
          <Route
            path="/episodes/:id"
            element={
              <ProtectedRoute showBackButton backPath="/dashboard" backLabel="Back">
                <EpisodeDetail />
              </ProtectedRoute>
            }
          />
          
          {/* Reports Routes */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          style={{ zIndex: 9999 }}
          toastStyle={{ zIndex: 9999 }}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
