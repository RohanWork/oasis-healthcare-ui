import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskAPI } from '../services/taskAPI';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  Calendar, CheckCircle, XCircle, Clock, AlertCircle, 
  RefreshCw, Filter, User, MapPin, Edit, Trash2, FileText
} from 'lucide-react';
import './TaskList.css';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'ALL',
    type: 'ALL',
    dateFilter: 'ALL'
  });
  
  const navigate = useNavigate();
  const { hasPermission, hasRole } = useAuth();

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await taskAPI.getMyTasks();
      setTasks(response.data);
      toast.success('Tasks loaded successfully!');
    } catch (err) {
      console.error('Error loading tasks:', err);
      if (err.code === 'ERR_NETWORK') {
        toast.warn('Backend is down. Please start the backend server.');
      } else {
        toast.error('Failed to load tasks.');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Status filter
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // Type filter
    if (filters.type !== 'ALL') {
      filtered = filtered.filter(t => t.taskType.includes(filters.type));
    }

    // Date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filters.dateFilter === 'TODAY') {
      filtered = filtered.filter(t => t.isDueToday);
    } else if (filters.dateFilter === 'OVERDUE') {
      filtered = filtered.filter(t => t.isOverdue);
    } else if (filters.dateFilter === 'UPCOMING') {
      filtered = filtered.filter(t => {
        const taskDate = new Date(t.scheduledDate);
        return taskDate > today && !t.isOverdue;
      });
    }

    setFilteredTasks(filtered);
  };

  const handleReschedule = async (id) => {
    const newDate = prompt('Enter new date (YYYY-MM-DD):');
    const reason = prompt('Reason for rescheduling:');
    
    if (newDate && reason) {
      try {
        await taskAPI.reschedule(id, newDate, reason);
        toast.success('Task rescheduled successfully!');
        loadTasks();
      } catch (err) {
        console.error('Error rescheduling task:', err);
        toast.error('Failed to reschedule task.');
      }
    }
  };

  const handleComplete = async (id) => {
    const notes = prompt('Completion notes (optional):');
    
    try {
      await taskAPI.complete(id, notes || '');
      toast.success('Task marked as completed!');
      loadTasks();
    } catch (err) {
      console.error('Error completing task:', err);
      toast.error('Failed to complete task.');
    }
  };

  const handleCancel = async (id) => {
    const reason = prompt('Reason for cancellation:');
    
    if (reason && window.confirm('Are you sure you want to cancel this task?')) {
      try {
        await taskAPI.cancel(id, reason);
        toast.success('Task cancelled successfully!');
        loadTasks();
      } catch (err) {
        console.error('Error cancelling task:', err);
        toast.error('Failed to cancel task.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.delete(id);
        toast.success('Task deleted successfully!');
        loadTasks();
      } catch (err) {
        console.error('Error deleting task:', err);
        toast.error('Failed to delete task.');
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'SCHEDULED': 'status-scheduled',
      'COMPLETED_PENDING_QA': 'status-pending',
      'COMPLETED': 'status-completed',
      'CANCELLED': 'status-cancelled',
      'RESCHEDULED': 'status-rescheduled',
      'MISSED': 'status-missed',
      'IN_PROGRESS': 'status-in-progress'
    };
    return statusMap[status] || 'status-default';
  };

  const getPriorityIcon = (priority, isUrgent) => {
    if (isUrgent) return <AlertCircle size={16} className="icon-urgent" />;
    if (priority === 'HIGH') return <AlertCircle size={16} className="icon-high" />;
    return <Clock size={16} className="icon-normal" />;
  };

  if (loading) {
    return <div className="loading-spinner">Loading tasks...</div>;
  }

  return (
    <div className="task-list-container">
        <div className="header-actions">
        <h1 className="list-title">My Tasks & Schedule</h1>
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={loadTasks}>
            <RefreshCw size={18} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/tasks/calendar')}>
            <Calendar size={18} /> Calendar View
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="filter-select"
          >
            <option value="ALL">All</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED_PENDING_QA">Pending QA</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="MISSED">Missed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type:</label>
          <select 
            value={filters.type} 
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="filter-select"
          >
            <option value="ALL">All</option>
            <option value="RN">RN Visits</option>
            <option value="PT">PT Visits</option>
            <option value="OT">OT Visits</option>
            <option value="ST">ST Visits</option>
            <option value="HHA">HHA Visits</option>
            <option value="OASIS">OASIS</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date:</label>
          <select 
            value={filters.dateFilter} 
            onChange={(e) => setFilters({...filters, dateFilter: e.target.value})}
            className="filter-select"
          >
            <option value="ALL">All</option>
            <option value="TODAY">Today</option>
            <option value="OVERDUE">Overdue</option>
            <option value="UPCOMING">Upcoming</option>
          </select>
        </div>
      </div>

      {/* Task Summary Stats */}
      <div className="task-stats">
        <div className="stat-card">
          <Clock size={24} />
          <div>
            <h3>{tasks.filter(t => t.isDueToday).length}</h3>
            <p>Due Today</p>
                  </div>
                    </div>
        <div className="stat-card stat-overdue">
          <AlertCircle size={24} />
          <div>
            <h3>{tasks.filter(t => t.isOverdue).length}</h3>
            <p>Overdue</p>
                      </div>
                    </div>
        <div className="stat-card stat-completed">
          <CheckCircle size={24} />
          <div>
            <h3>{tasks.filter(t => t.status.includes('COMPLETED')).length}</h3>
            <p>Completed</p>
                  </div>
                </div>
        <div className="stat-card">
          <Calendar size={24} />
          <div>
            <h3>{tasks.filter(t => t.status === 'SCHEDULED').length}</h3>
            <p>Scheduled</p>
          </div>
            </div>
          </div>

      {/* Task Cards */}
      {filteredTasks.length === 0 ? (
        <div className="no-records">No tasks found.</div>
      ) : (
        <div className="task-cards-grid">
          {filteredTasks.map((task) => (
                <div 
                  key={task.id} 
              className={`task-card ${getStatusBadgeClass(task.status)} ${task.isOverdue ? 'overdue-card' : ''}`}
              onClick={() => navigate(`/tasks/${task.id}`)}
              style={{ cursor: 'pointer' }}
                >
                  <div className="task-card-header">
                <div className="task-header-left">
                  {getPriorityIcon(task.priority, task.isUrgent)}
                    <h3>{task.title}</h3>
                </div>
                <span className={`status-badge ${getStatusBadgeClass(task.status)}`}>
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <div className="task-card-body">
                <div className="task-info-row">
                      <User size={16} />
                      <span>{task.patientName}</span>
                    </div>
                <div className="task-info-row">
                  <Calendar size={16} />
                  <span>
                    {new Date(task.scheduledDate).toLocaleDateString()} 
                    {task.scheduledStartTime && ` - ${task.scheduledStartTime}`}
                  </span>
                </div>
                {task.visitLocation && (
                  <div className="task-info-row">
                        <MapPin size={16} />
                    <span className="task-location">{task.visitLocation}</span>
                      </div>
                    )}
                {task.specialInstructions && (
                  <div className="task-special-instructions">
                    <strong>Instructions:</strong> {task.specialInstructions}
                      </div>
                    )}
                  </div>

              <div className="task-card-actions" onClick={(e) => e.stopPropagation()}>
                {/* Document Visit button for visit tasks */}
                {(task.taskType?.includes('VISIT') || task.taskType?.includes('RN') || task.taskType?.includes('PT') || task.taskType?.includes('OT') || task.taskType?.includes('ST') || task.taskType?.includes('HHA')) && (
                  <button 
                    className="btn-icon btn-primary" 
                    onClick={() => navigate(`/visit-notes/new?taskId=${task.id}`)}
                    title="Document Visit"
                  >
                    <FileText size={18} />
                  </button>
                )}
                {task.canBeEdited && (
                  <>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleReschedule(task.id)}
                      title="Reschedule"
                    >
                      <Calendar size={18} />
                    </button>
                    <button 
                      className="btn-icon btn-complete" 
                      onClick={() => handleComplete(task.id)}
                      title="Complete"
                    >
                      <CheckCircle size={18} />
                    </button>
                  </>
                )}
                {task.canBeCancelled && (
                  <button 
                    className="btn-icon btn-cancel" 
                    onClick={() => handleCancel(task.id)}
                    title="Cancel"
                  >
                    <XCircle size={18} />
                  </button>
                )}
                {(hasPermission('TASK_DELETE') || hasRole('SYSTEM_ADMIN')) && (
                  <button 
                    className="btn-icon btn-delete" 
                    onClick={() => handleDelete(task.id)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
    </div>
  );
};

export default TaskList;
