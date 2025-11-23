import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patientAPI } from '../services/patientAPI';
import { taskAPI } from '../services/taskAPI';
import { episodeAPI } from '../services/patientAPI';
import { getOasisAssessmentsByPatient } from '../services/oasisCompleteAPI';
import { visitNoteAPI } from '../services/visitNoteAPI';
import { toast } from 'react-toastify';
import { 
  Plus, Search, Filter, Eye, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, MoreVertical, Printer, DollarSign,
  FileText, User, Clock, CheckCircle, XCircle, AlertCircle,
  Edit, Calendar
} from 'lucide-react';
import './ScheduleCenter.css';

const ScheduleCenter = () => {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  
  // State for patients
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    branch: 'ALL',
    status: 'ACTIVE',
    payer: 'ALL',
    search: ''
  });
  
  // Tasks and calendar
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [oasisAssessments, setOasisAssessments] = useState([]); // For calendar display
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('episode-manager');
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  // Dropdown menu state
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, filters]);

  useEffect(() => {
    if (selectedPatient && selectedEpisode) {
      loadTasks();
      loadOasisAssessments();
    }
  }, [selectedPatient, selectedEpisode]);

  useEffect(() => {
    filterTasks();
  }, [tasks]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await patientAPI.getAll();
      setPatients(response.data);
      // Don't auto-select first patient - user must explicitly select a patient
      // Tasks will only load when a patient is selected
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const loadEpisodesForPatient = async (patientId) => {
    try {
      const response = await episodeAPI.getByPatient(patientId);
      if (response.data && response.data.length > 0) {
        // Get the most recent active episode
        const activeEpisode = response.data.find(ep => ep.status === 'ACTIVE') || response.data[0];
        setSelectedEpisode(activeEpisode);
      }
    } catch (error) {
      console.error('Error loading episodes:', error);
    }
  };

  const loadTasks = async () => {
    if (!selectedPatient || !selectedEpisode) return;
    
    setLoadingTasks(true);
    try {
      // For RN role, get only tasks assigned to current user
      // For other roles, get all tasks for the patient
      // Handle both string roles and object roles (with roleName property)
      const isRN = user?.roles?.some(r => {
        const roleName = typeof r === 'string' ? r : (r?.roleName || '');
        return roleName.includes('RN') || roleName === 'ROLE_RN' || roleName === 'RN';
      });
      let response;
      
      if (isRN) {
        // Get tasks assigned to current user
        response = await taskAPI.getMyTasks();
        // Filter by patient and episode
        const episodeTasks = response.data.filter(task => 
          task.patientId === selectedPatient.id && 
          task.episodeId === selectedEpisode.id
        );
        setTasks(episodeTasks);
      } else {
        // Get all tasks for the patient
        response = await taskAPI.getByPatient(selectedPatient.id);
        // Filter tasks for the selected episode
        const episodeTasks = response.data.filter(task => 
          task.episodeId === selectedEpisode.id
        );
        setTasks(episodeTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadOasisAssessments = async () => {
    if (!selectedPatient) return;
    
    try {
      const assessments = await getOasisAssessmentsByPatient(selectedPatient.id);
      // Filter by episode if selectedEpisode exists
      const episodeAssessments = selectedEpisode 
        ? assessments.filter(a => a.episodeId === selectedEpisode.id)
        : assessments;
      setOasisAssessments(episodeAssessments);
    } catch (error) {
      console.error('Error loading OASIS assessments:', error);
      // Don't show error toast - OASIS assessments are optional for calendar
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    // Filter by search
    if (filters.search) {
      filtered = filtered.filter(patient =>
        patient.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
        patient.lastName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        patient.firstName?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filter by status
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(patient => patient.status === filters.status);
    }

    // Sort by last name, then first name
    filtered.sort((a, b) => {
      const lastNameA = (a.lastName || '').toUpperCase();
      const lastNameB = (b.lastName || '').toUpperCase();
      if (lastNameA !== lastNameB) {
        return lastNameA.localeCompare(lastNameB);
      }
      const firstNameA = (a.firstName || '').toUpperCase();
      const firstNameB = (b.firstName || '').toUpperCase();
      return firstNameA.localeCompare(firstNameB);
    });

    setFilteredPatients(filtered);
  };

  const filterTasks = () => {
    setFilteredTasks([...tasks].sort((a, b) => {
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      return dateB - dateA; // Most recent first
    }));
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    loadEpisodesForPatient(patient.id);
  };

  const getTaskStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'green';
      case 'SCHEDULED':
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'purple';
      case 'MISSED':
      case 'CANCELLED':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Check if a task is missed (scheduled in the past but not completed)
  const isTaskMissed = (task) => {
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      return false;
    }
    const taskDate = new Date(task.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  const getCalendarDateStatus = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(task => {
      const taskDate = new Date(task.scheduledDate).toISOString().split('T')[0];
      return taskDate === dateStr;
    });

    // Check for completed OASIS assessments on this date
    const dayOasis = oasisAssessments.filter(assessment => {
      if (assessment.status === 'COMPLETED' && assessment.assessmentDate) {
        const assessmentDate = new Date(assessment.assessmentDate).toISOString().split('T')[0];
        return assessmentDate === dateStr;
      }
      return false;
    });

    if (dayTasks.length === 0) {
      // If no tasks but has completed OASIS, show green
      if (dayOasis.length > 0) {
        return 'green';
      }
      return null;
    }

    // Check for missed tasks (highest priority - red)
    const missedTasks = dayTasks.filter(task => 
      task.status === 'MISSED' || isTaskMissed(task)
    );
    if (missedTasks.length > 0) {
      return 'red';
    }

    // Check for cancelled tasks (red)
    const cancelledTasks = dayTasks.filter(task => task.status === 'CANCELLED');
    if (cancelledTasks.length > 0 && dayTasks.every(t => t.status === 'CANCELLED')) {
      return 'red';
    }

    // Check if all tasks are completed (green)
    const allCompleted = dayTasks.every(task => task.status === 'COMPLETED');
    if (allCompleted) {
      return 'green';
    }

    // If there are completed OASIS assessments along with tasks, prioritize green
    if (dayOasis.length > 0) {
      return 'green';
    }

    // If there are pending/scheduled tasks (purple)
    const hasPendingTasks = dayTasks.some(task => 
      task.status === 'SCHEDULED' || 
      task.status === 'PENDING' || 
      task.status === 'IN_PROGRESS'
    );
    if (hasPendingTasks) {
      return 'purple';
    }

    // Default: if multiple tasks with mixed statuses, show purple
    if (dayTasks.length > 1) {
      return 'purple';
    }
    
    // Single task - use its status color
    const task = dayTasks[0];
    return getTaskStatusColor(task.status);
  };

  const renderCalendar = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const status = getCalendarDateStatus(date);
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.scheduledDate).toISOString().split('T')[0];
        return taskDate === date.toISOString().split('T')[0];
      });
      const dayOasis = oasisAssessments.filter(assessment => {
        if (assessment.status === 'COMPLETED' && assessment.assessmentDate) {
          const assessmentDate = new Date(assessment.assessmentDate).toISOString().split('T')[0];
          return assessmentDate === date.toISOString().split('T')[0];
        }
        return false;
      });

      days.push(
        <div
          key={day}
          className={`calendar-day ${status ? `status-${status}` : ''}`}
          title={
            dayOasis.length > 0 
              ? `${dayOasis.length} completed OASIS, ${dayTasks.length} task(s)`
              : dayTasks.length > 0 
                ? `${dayTasks.length} task(s)` 
                : ''
          }
        >
          <span className="day-number">{day}</span>
          {(dayTasks.length + dayOasis.length) > 1 && (
            <span className="task-count">{dayTasks.length + dayOasis.length}</span>
          )}
        </div>
      );
    }

    return days;
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getStatusBadge = (status) => {
    const statusUpper = status?.toUpperCase();
    let className = 'status-badge';
    let icon = null;

    switch (statusUpper) {
      case 'COMPLETED':
        className += ' status-completed';
        icon = <CheckCircle size={14} />;
        break;
      case 'SCHEDULED':
      case 'PENDING':
        className += ' status-scheduled';
        icon = <Clock size={14} />;
        break;
      case 'MISSED':
      case 'CANCELLED':
        className += ' status-missed';
        icon = <XCircle size={14} />;
        break;
      case 'IN_PROGRESS':
        className += ' status-in-progress';
        icon = <AlertCircle size={14} />;
        break;
      default:
        className += ' status-default';
    }

    return (
      <span className={className}>
        {icon}
        <span>{status || 'Unknown'}</span>
      </span>
    );
  };

  // ===== TASK ACTION HANDLERS =====
  
  const handleViewTask = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleStartTask = async (task) => {
    try {
      await taskAPI.start(task.id);
      toast.success('Task started successfully');
      loadTasks();
    } catch (error) {
      console.error('Error starting task:', error);
      toast.error(error.response?.data?.message || 'Failed to start task');
    }
  };

  const handleCompleteTask = async (task) => {
    try {
      await taskAPI.complete(task.id, 'Task completed from Schedule Center');
      toast.success('Task completed successfully');
      loadTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error(error.response?.data?.message || 'Failed to complete task');
    }
  };

  const handleOpenOasis = async (task) => {
    try {
      // Check if OASIS assessment already exists for this episode
      const assessments = await getOasisAssessmentsByPatient(selectedPatient.id);
      
      // Find assessment for this specific episode
      // Check for any assessment (DRAFT, SUBMITTED, APPROVED, REJECTED, COMPLETED)
      const taskEpisodeId = parseInt(task.episodeId);
      const episodeAssessment = assessments.find(a => {
        const aEpisodeId = a.episodeId || (a.episode && a.episode.id);
        const aEpisodeIdNum = typeof aEpisodeId === 'string' ? parseInt(aEpisodeId) : aEpisodeId;
        return aEpisodeIdNum === taskEpisodeId;
      });
      
      console.log('Looking for assessment with episodeId:', taskEpisodeId);
      console.log('Available assessments:', assessments.map(a => ({ 
        id: a.id, 
        status: a.status, 
        episodeId: a.episodeId || (a.episode && a.episode.id) 
      })));

      if (episodeAssessment) {
        // Navigate to existing assessment using the working route format
        console.log('Found existing OASIS assessment:', episodeAssessment.id, episodeAssessment.status);
        // Use the old form route format that works: /oasis/edit/:id/:patientId
        navigate(`/oasis/edit/${episodeAssessment.id}/${selectedPatient.id}`);
      } else {
        // No existing assessment found, use old form route for new assessment
        console.log('No existing OASIS assessment found, creating new one');
        toast.info('Creating new OASIS assessment...');
        // Use the old form route: /oasis/new/:patientId
        navigate(`/oasis/new/${selectedPatient.id}`);
      }
    } catch (error) {
      console.error('Error opening OASIS:', error);
      toast.error('Failed to open OASIS assessment');
      // On error, still navigate to create new assessment
      navigate(`/oasis-complete/new?episodeId=${task.episodeId}&patientId=${selectedPatient.id}&taskId=${task.id}`);
    }
  };

  const handleDocumentVisit = async (task) => {
    try {
      // Check if visit note already exists for this task
      try {
        const response = await visitNoteAPI.getByTaskId(task.id);
        if (response.data && response.data.id) {
          // Navigate to existing visit note
          navigate(`/visit-notes/${response.data.id}`);
          return;
        }
      } catch (error) {
        // Visit note doesn't exist (404 is expected), proceed to create new one
        if (error.response?.status !== 404) {
          console.error('Error checking for existing visit note:', error);
        }
      }

      // Navigate to create new visit note
      navigate(`/visit-notes/new/${task.id}`);
    } catch (error) {
      console.error('Error documenting visit:', error);
      toast.error('Failed to open visit note');
    }
  };

  const handlePrintTask = (task) => {
    // Open print dialog with task details
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Task Details - ${task.taskNumber || task.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .task-detail { margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Task Details</h1>
          <div class="task-detail"><span class="label">Task Number:</span> ${task.taskNumber || 'N/A'}</div>
          <div class="task-detail"><span class="label">Title:</span> ${task.title}</div>
          <div class="task-detail"><span class="label">Patient:</span> ${selectedPatient?.fullName || selectedPatient?.lastName + ', ' + selectedPatient?.firstName}</div>
          <div class="task-detail"><span class="label">Scheduled Date:</span> ${task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : 'N/A'}</div>
          <div class="task-detail"><span class="label">Assigned To:</span> ${task.assignedToName || task.assignedTo || 'Unassigned'}</div>
          <div class="task-detail"><span class="label">Status:</span> ${task.status}</div>
          <div class="task-detail"><span class="label">Priority:</span> ${task.priority || 'N/A'}</div>
          <div class="task-detail"><span class="label">Task Type:</span> ${task.taskType || 'N/A'}</div>
          ${task.description ? `<div class="task-detail"><span class="label">Description:</span> ${task.description}</div>` : ''}
          <div class="task-detail"><span class="label">Printed:</span> ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleRescheduleTask = async (task) => {
    const newDate = prompt('Enter new date (YYYY-MM-DD):', 
      task.scheduledDate ? new Date(task.scheduledDate).toISOString().split('T')[0] : '');
    
    if (!newDate) return;

    try {
      await taskAPI.reschedule(task.id, newDate, 'Rescheduled from Schedule Center');
      toast.success('Task rescheduled successfully');
      loadTasks();
      setOpenDropdown(null);
    } catch (error) {
      console.error('Error rescheduling task:', error);
      toast.error(error.response?.data?.message || 'Failed to reschedule task');
    }
  };

  const handleCancelTask = async (task) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    if (!window.confirm('Are you sure you want to cancel this task?')) return;

    try {
      await taskAPI.cancel(task.id, reason);
      toast.success('Task cancelled successfully');
      loadTasks();
      setOpenDropdown(null);
    } catch (error) {
      console.error('Error cancelling task:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel task');
    }
  };

  const handleEditTask = (taskId) => {
    navigate(`/tasks/${taskId}/edit`);
    setOpenDropdown(null);
  };

  const handleViewBilling = (task) => {
    // Navigate to billing claims for this episode
    navigate(`/billing?episodeId=${task.episodeId}`);
    setOpenDropdown(null);
  };

  const toggleDropdown = (taskId) => {
    setOpenDropdown(openDropdown === taskId ? null : taskId);
  };

  if (loading) {
    return (
      <div className="schedule-center-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const month1 = new Date(currentDate);
  const month2 = new Date(currentDate);
  month2.setMonth(month2.getMonth() + 1);

  return (
    <div className="schedule-center-container">
      {/* Left Sidebar */}
      <div className="schedule-sidebar">
        <button 
          className="btn btn-primary btn-block sidebar-btn"
          onClick={() => navigate('/patients/new')}
        >
          <Plus size={18} />
          Add New Patient
        </button>

        <div className="sidebar-filters">
          <div className="filter-group">
            <label>Branch</label>
            <select
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
            >
              <option value="ALL">All</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active Patients</option>
              <option value="PENDING">Pending</option>
              <option value="DISCHARGED">Discharged</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Payer</label>
            <select
              value={filters.payer}
              onChange={(e) => setFilters({ ...filters, payer: e.target.value })}
            >
              <option value="ALL">All</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Find</label>
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search patients..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="patient-list-container">
          <table className="patient-list-table">
            <thead>
              <tr>
                <th>Last Name</th>
                <th>First Name</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className={selectedPatient?.id === patient.id ? 'selected' : ''}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <td>{patient.lastName?.toUpperCase() || ''}</td>
                  <td>{patient.firstName || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button 
          className="btn btn-primary btn-block sidebar-btn"
          onClick={() => selectedPatient && navigate(`/patients/${selectedPatient.id}`)}
          disabled={!selectedPatient}
        >
          <Eye size={18} />
          View Patient Chart
        </button>
      </div>

      {/* Main Content */}
      <div className="schedule-main-content">
        {/* Tabs */}
        <div className="schedule-tabs">
          <button
            className={activeTab === 'episode-manager' ? 'active' : ''}
            onClick={() => setActiveTab('episode-manager')}
          >
            Episode Manager
          </button>
          <button
            className={activeTab === 'schedule-manager' ? 'active' : ''}
            onClick={() => setActiveTab('schedule-manager')}
          >
            Schedule Manager
          </button>
          <button
            className={activeTab === 'authorizations' ? 'active' : ''}
            onClick={() => setActiveTab('authorizations')}
          >
            Authorizations
          </button>
          <button
            className={activeTab === '30-day-calendar' ? 'active' : ''}
            onClick={() => setActiveTab('30-day-calendar')}
          >
            30-Day Calendar
          </button>
          <button
            className={activeTab === 'billing-log' ? 'active' : ''}
            onClick={() => setActiveTab('billing-log')}
          >
            Billing Period Activity Log
          </button>
        </div>

        {/* Patient Context */}
        {selectedPatient && selectedEpisode && (
          <div className="patient-context">
            <div className="patient-info">
              <h3>
                {selectedPatient.lastName?.toUpperCase()}, {selectedPatient.firstName}{' '}
                {selectedEpisode.startDate && selectedEpisode.certificationEndDate && (
                  <span className="date-range">
                    {new Date(selectedEpisode.startDate).toLocaleDateString('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                      year: 'numeric'
                    })}{' '}
                    -{' '}
                    {new Date(selectedEpisode.certificationEndDate).toLocaleDateString('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </h3>
            </div>
            <div className="patient-actions">
              <button className="btn btn-secondary">
                Actions <ChevronRight size={16} />
              </button>
              <button className="btn btn-secondary">
                <ChevronLeft size={16} /> Previous Episode
              </button>
            </div>
          </div>
        )}

        {/* Calendars */}
        {activeTab === 'episode-manager' && (
          <div className="calendars-section">
            <div className="calendars-container">
              <div className="calendar-month">
                <div className="calendar-header">
                  <button onClick={() => navigateMonth(-1)} className="calendar-nav">
                    <ChevronLeft size={20} />
                  </button>
                  <h4>{getMonthName(month1)}</h4>
                </div>
                <div className="calendar-grid">
                  <div className="calendar-weekdays">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="weekday">{day}</div>
                    ))}
                  </div>
                  <div className="calendar-days">
                    {renderCalendar(month1)}
                  </div>
                </div>
              </div>

              <div className="calendar-month">
                <div className="calendar-header">
                  <h4>{getMonthName(month2)}</h4>
                  <button onClick={() => navigateMonth(1)} className="calendar-nav">
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="calendar-grid">
                  <div className="calendar-weekdays">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="weekday">{day}</div>
                    ))}
                  </div>
                  <div className="calendar-days">
                    {renderCalendar(month2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Color Legend */}
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-color status-green"></div>
                <span>Completed</span>
              </div>
              <div className="legend-item">
                <div className="legend-color status-purple"></div>
                <span>Pending/Scheduled</span>
              </div>
              <div className="legend-item">
                <div className="legend-color status-red"></div>
                <span>Missed</span>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="tasks-section">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Scheduled Date</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingTasks ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    <div className="spinner-small"></div>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    No tasks found for this episode
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="task-name">{task.title}</td>
                    <td>
                      {task.scheduledDate
                        ? new Date(task.scheduledDate).toLocaleDateString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : '-'}
                    </td>
                    <td>
                      {task.assignedToName || task.assignedTo || 'Unassigned'}
                    </td>
                    <td>{getStatusBadge(task.status)}</td>
                    <td>
                      <div className="task-actions" ref={dropdownRef}>
                        <button 
                          className="icon-btn" 
                          title="View Task Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTask(task.id);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        
                        {/* Start Task Button */}
                        {(task.status === 'SCHEDULED' || task.status === 'PENDING') && (
                          <button 
                            className="icon-btn" 
                            title="Start Task"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartTask(task);
                            }}
                          >
                            <Clock size={16} />
                          </button>
                        )}
                        
                        {/* Complete Task Button */}
                        {task.status === 'IN_PROGRESS' && (
                          <button 
                            className="icon-btn" 
                            title="Complete Task"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteTask(task);
                            }}
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        
                        {/* Document Visit Button (for visit tasks) */}
                        {(task.taskType === 'RN_VISIT' || task.taskType === 'PT_VISIT' || 
                          task.taskType === 'OT_VISIT' || task.taskType === 'ST_VISIT' || 
                          task.taskType === 'HHA_VISIT') && 
                          (task.status === 'SCHEDULED' || task.status === 'IN_PROGRESS') && (
                          <button 
                            className="icon-btn" 
                            title="Document Visit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDocumentVisit(task);
                            }}
                          >
                            <FileText size={16} />
                          </button>
                        )}
                        
                        {/* Open OASIS Assessment Button */}
                        {task.taskType === 'OASIS_ASSESSMENT' && (
                          <button 
                            className="icon-btn" 
                            title="Open OASIS Assessment"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenOasis(task);
                            }}
                          >
                            <FileText size={16} />
                          </button>
                        )}
                        
                        {/* Print Button */}
                        <button 
                          className="icon-btn" 
                          title="Print Task"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintTask(task);
                          }}
                        >
                          <Printer size={16} />
                        </button>
                        
                        {/* More Options Dropdown */}
                        <div className="dropdown-container">
                          <button 
                            className={`icon-btn ${openDropdown === task.id ? 'active' : ''}`}
                            title="More Options"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(task.id);
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {openDropdown === task.id && (
                            <div className="dropdown-menu">
                              <button 
                                className="dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTask(task.id);
                                }}
                              >
                                <Edit size={14} />
                                Edit Task
                              </button>
                              
                              {(task.status === 'SCHEDULED' || task.status === 'PENDING') && (
                                <button 
                                  className="dropdown-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRescheduleTask(task);
                                  }}
                                >
                                  <Calendar size={14} />
                                  Reschedule
                                </button>
                              )}
                              
                              {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                                <button 
                                  className="dropdown-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelTask(task);
                                  }}
                                >
                                  <XCircle size={14} />
                                  Cancel Task
                                </button>
                              )}
                              
                              <button 
                                className="dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewBilling(task);
                                }}
                              >
                                <DollarSign size={14} />
                                View Billing
                              </button>
                              
                              <div className="dropdown-divider"></div>
                              
                              <button 
                                className="dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewTask(task.id);
                                }}
                              >
                                <Eye size={14} />
                                View Details
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCenter;

