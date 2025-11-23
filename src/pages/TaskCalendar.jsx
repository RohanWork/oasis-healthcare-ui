import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { taskAPI } from '../services/taskAPI';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  List, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, Clock, CheckCircle, XCircle,
  AlertCircle, PlayCircle, User, MapPin, Phone
} from 'lucide-react';
import './TaskCalendar.css';

const localizer = momentLocalizer(moment);

const TaskCalendar = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month'); // month, week, day, agenda
  const [date, setDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [filters, setFilters] = useState({
    showScheduled: true,
    showInProgress: true,
    showCompleted: true,
    showCancelled: false,
    showMissed: true,
    showPending: true,
  });

  const navigate = useNavigate();
  const { hasPermission, hasRole } = useAuth();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await taskAPI.getMyTasks();
      setTasks(response.data);
      toast.success('Calendar loaded successfully!');
    } catch (err) {
      console.error('Error loading tasks:', err);
      if (err.code === 'ERR_NETWORK') {
        toast.warn('Backend is down. Please start the backend server.');
      } else {
        toast.error('Failed to load calendar.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Convert tasks to calendar events
  const events = useMemo(() => {
    return tasks
      .filter(task => {
        // Apply status filters
        if (!filters.showScheduled && task.status === 'SCHEDULED') return false;
        if (!filters.showInProgress && task.status === 'IN_PROGRESS') return false;
        if (!filters.showCompleted && (task.status === 'COMPLETED' || task.status === 'COMPLETED_PENDING_QA')) return false;
        if (!filters.showCancelled && task.status === 'CANCELLED') return false;
        if (!filters.showMissed && task.status === 'MISSED') return false;
        if (!filters.showPending && task.status === 'COMPLETED_PENDING_QA') return false;
        return true;
      })
      .map(task => {
        const startDate = new Date(task.scheduledDate);
        const endDate = new Date(task.scheduledDate);
        
        // Set time if available
        if (task.scheduledStartTime) {
          const [hours, minutes] = task.scheduledStartTime.split(':');
          startDate.setHours(parseInt(hours), parseInt(minutes));
        } else {
          startDate.setHours(9, 0); // Default 9 AM
        }
        
        if (task.scheduledEndTime) {
          const [hours, minutes] = task.scheduledEndTime.split(':');
          endDate.setHours(parseInt(hours), parseInt(minutes));
    } else {
          endDate.setHours(startDate.getHours() + 1, startDate.getMinutes()); // Default 1 hour
        }

        return {
          id: task.id,
          title: task.title,
          start: startDate,
          end: endDate,
          resource: task, // Store full task data
          status: task.status,
        };
      });
  }, [tasks, filters]);

  // Event style getter - color code by status
  const eventStyleGetter = (event) => {
    let backgroundColor = '#3498db'; // Default blue
    let borderColor = '#2980b9';
    let color = 'white';

    switch (event.status) {
      case 'SCHEDULED':
        backgroundColor = '#3498db'; // Blue
        borderColor = '#2980b9';
        break;
      case 'IN_PROGRESS':
        backgroundColor = '#9b59b6'; // Purple
        borderColor = '#8e44ad';
        break;
      case 'COMPLETED':
        backgroundColor = '#27ae60'; // Green
        borderColor = '#229954';
        break;
      case 'COMPLETED_PENDING_QA':
        backgroundColor = '#f39c12'; // Orange
        borderColor = '#e67e22';
        break;
      case 'CANCELLED':
        backgroundColor = '#95a5a6'; // Gray
        borderColor = '#7f8c8d';
        break;
      case 'RESCHEDULED':
        backgroundColor = '#f39c12'; // Orange
        borderColor = '#e67e22';
        break;
      case 'MISSED':
        backgroundColor = '#e74c3c'; // Red
        borderColor = '#c0392b';
        break;
      default:
        backgroundColor = '#3498db';
        borderColor = '#2980b9';
    }

    // Overdue indicator
    if (event.resource.isOverdue && event.status === 'SCHEDULED') {
      backgroundColor = '#e74c3c';
      borderColor = '#c0392b';
    }

    return {
      style: {
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        color,
        borderRadius: '4px',
        opacity: 0.9,
        display: 'block',
        fontSize: '0.85rem',
        padding: '2px 5px',
      }
    };
  };

  // Handle event click
  const handleSelectEvent = (event) => {
    setSelectedTask(event.resource);
    setShowTaskModal(true);
  };

  // Handle slot selection (create new task)
  const handleSelectSlot = (slotInfo) => {
    if (hasPermission('TASK_CREATE') || hasRole('SYSTEM_ADMIN')) {
      const createTask = window.confirm(`Create a new task for ${moment(slotInfo.start).format('MMM DD, YYYY')}?`);
      if (createTask) {
        // Navigate to task creation (you can implement this later)
        toast.info('Task creation form coming soon!');
      }
    }
  };

  // Quick actions from modal
  const handleReschedule = async () => {
    const newDate = prompt('Enter new date (YYYY-MM-DD):', moment(selectedTask.scheduledDate).format('YYYY-MM-DD'));
    const reason = prompt('Reason for rescheduling:');
    
    if (newDate && reason) {
      try {
        await taskAPI.reschedule(selectedTask.id, newDate, reason);
        toast.success('Task rescheduled successfully!');
        setShowTaskModal(false);
        loadTasks();
      } catch (err) {
        console.error('Error rescheduling task:', err);
        toast.error('Failed to reschedule task.');
      }
    }
  };

  const handleComplete = async () => {
    const notes = prompt('Completion notes (optional):');
    
    try {
      await taskAPI.complete(selectedTask.id, notes || '');
      toast.success('Task marked as completed!');
      setShowTaskModal(false);
      loadTasks();
    } catch (err) {
      console.error('Error completing task:', err);
      toast.error('Failed to complete task.');
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Reason for cancellation:');
    
    if (reason && window.confirm('Are you sure you want to cancel this task?')) {
      try {
        await taskAPI.cancel(selectedTask.id, reason);
        toast.success('Task cancelled successfully!');
        setShowTaskModal(false);
        loadTasks();
      } catch (err) {
        console.error('Error cancelling task:', err);
        toast.error('Failed to cancel task.');
      }
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return <Clock className="status-icon icon-scheduled" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="status-icon icon-in-progress" />;
      case 'COMPLETED':
        return <CheckCircle className="status-icon icon-completed" />;
      case 'COMPLETED_PENDING_QA':
        return <AlertCircle className="status-icon icon-pending" />;
      case 'CANCELLED':
        return <XCircle className="status-icon icon-cancelled" />;
      case 'MISSED':
        return <AlertCircle className="status-icon icon-missed" />;
      case 'RESCHEDULED':
        return <CalendarIcon className="status-icon icon-rescheduled" />;
      default:
        return <Clock className="status-icon" />;
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading calendar...</div>;
  }

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <h1 className="calendar-title">
          <CalendarIcon size={28} /> Task Calendar
        </h1>
        <div className="calendar-actions">
          <button className="btn btn-secondary" onClick={loadTasks}>
            <RefreshCw size={18} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/tasks')}>
            <List size={18} /> List View
          </button>
        </div>
      </div>

      {/* Filters & Legend */}
      <div className="calendar-controls">
        <div className="calendar-filters">
          <div className="filter-title">
            <Filter size={16} /> Show:
          </div>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.showScheduled}
              onChange={(e) => setFilters({...filters, showScheduled: e.target.checked})}
            />
            <span className="status-dot status-scheduled"></span>
            Scheduled ({tasks.filter(t => t.status === 'SCHEDULED').length})
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.showInProgress}
              onChange={(e) => setFilters({...filters, showInProgress: e.target.checked})}
            />
            <span className="status-dot status-in-progress"></span>
            In Progress ({tasks.filter(t => t.status === 'IN_PROGRESS').length})
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.showCompleted}
              onChange={(e) => setFilters({...filters, showCompleted: e.target.checked})}
            />
            <span className="status-dot status-completed"></span>
            Completed ({tasks.filter(t => t.status === 'COMPLETED').length})
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.showPending}
              onChange={(e) => setFilters({...filters, showPending: e.target.checked})}
            />
            <span className="status-dot status-pending"></span>
            Pending QA ({tasks.filter(t => t.status === 'COMPLETED_PENDING_QA').length})
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.showMissed}
              onChange={(e) => setFilters({...filters, showMissed: e.target.checked})}
            />
            <span className="status-dot status-missed"></span>
            Missed ({tasks.filter(t => t.status === 'MISSED').length})
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.showCancelled}
              onChange={(e) => setFilters({...filters, showCancelled: e.target.checked})}
            />
            <span className="status-dot status-cancelled"></span>
            Cancelled ({tasks.filter(t => t.status === 'CANCELLED').length})
          </label>
        </div>
      </div>

      {/* Calendar */}
      <div className="calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          popup
          views={['month', 'week', 'day', 'agenda']}
          step={30}
          showMultiDayTimes
          defaultDate={new Date()}
        />
      </div>

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                {getStatusIcon(selectedTask.status)}
                <h2>{selectedTask.title}</h2>
              </div>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>
                <XCircle size={24} />
          </button>
        </div>

            <div className="modal-body">
              <div className="task-detail-row">
                <strong>Status:</strong>
                <span className={`status-badge status-${selectedTask.status.toLowerCase()}`}>
                  {selectedTask.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="task-detail-row">
                <User size={18} />
                <div>
                  <strong>Patient:</strong> {selectedTask.patientName}
                </div>
        </div>

              <div className="task-detail-row">
                <CalendarIcon size={18} />
                <div>
                  <strong>Date:</strong> {moment(selectedTask.scheduledDate).format('MMM DD, YYYY')}
                  {selectedTask.scheduledStartTime && ` at ${selectedTask.scheduledStartTime}`}
        </div>
      </div>

              {selectedTask.visitLocation && (
                <div className="task-detail-row">
                  <MapPin size={18} />
                  <div>
                    <strong>Location:</strong> {selectedTask.visitLocation}
                  </div>
                </div>
              )}

              {selectedTask.assignedToName && (
                <div className="task-detail-row">
                  <User size={18} />
                  <div>
                    <strong>Assigned To:</strong> {selectedTask.assignedToName}
                  </div>
                </div>
              )}

              {selectedTask.specialInstructions && (
                <div className="task-special-instructions">
                  <strong>Special Instructions:</strong>
                  <p>{selectedTask.specialInstructions}</p>
                </div>
              )}

              {selectedTask.description && (
                <div className="task-description">
                  <strong>Description:</strong>
                  <p>{selectedTask.description}</p>
                </div>
              )}

              {selectedTask.isOverdue && (
                <div className="task-overdue-warning">
                  <AlertCircle size={18} />
                  <span>This task is overdue!</span>
                </div>
              )}
            </div>

            <div className="modal-actions">
              {selectedTask.canBeEdited && (
                <>
                  <button className="btn btn-secondary" onClick={handleReschedule}>
                    <CalendarIcon size={18} /> Reschedule
                  </button>
                  <button className="btn btn-success" onClick={handleComplete}>
                    <CheckCircle size={18} /> Complete
                  </button>
                </>
              )}
              {selectedTask.canBeCancelled && (
                <button className="btn btn-danger" onClick={handleCancel}>
                  <XCircle size={18} /> Cancel
                </button>
              )}
              <button className="btn btn-primary" onClick={() => setShowTaskModal(false)}>
                Close
              </button>
            </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default TaskCalendar;
