import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { taskAPI } from '../services/taskAPI';
import { toast } from 'react-toastify';
import { 
  Edit, ArrowLeft, Calendar, User, MapPin, Clock, 
  CheckCircle, XCircle, AlertCircle, FileText
} from 'lucide-react';
import './TaskDetail.css';

const TaskDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getById(id);
      setTask(response.data);
    } catch (error) {
      console.error('Error loading task:', error);
      toast.error('Failed to load task');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = () => {
    navigate(`/tasks/${id}/reschedule`);
  };

  const handleComplete = async () => {
    const notes = window.prompt('Enter completion notes (optional):');
    try {
      await taskAPI.complete(id, notes || '');
      toast.success('Task marked as completed');
      loadTask();
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt('Enter cancellation reason:');
    if (reason) {
      try {
        await taskAPI.cancel(id, reason);
        toast.success('Task cancelled');
        loadTask();
      } catch (error) {
        toast.error('Failed to cancel task');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      SCHEDULED: { className: 'status-scheduled', label: 'Scheduled', icon: Calendar },
      IN_PROGRESS: { className: 'status-in-progress', label: 'In Progress', icon: Clock },
      COMPLETED_PENDING_QA: { className: 'status-pending-qa', label: 'Pending QA', icon: AlertCircle },
      QA_APPROVED: { className: 'status-approved', label: 'QA Approved', icon: CheckCircle },
      CANCELLED: { className: 'status-cancelled', label: 'Cancelled', icon: XCircle },
      RESCHEDULED: { className: 'status-rescheduled', label: 'Rescheduled', icon: Calendar },
      MISSED: { className: 'status-missed', label: 'Missed', icon: XCircle },
      NO_SHOW: { className: 'status-no-show', label: 'No Show', icon: XCircle },
    };
    const config = statusConfig[status] || { className: 'status-default', label: status, icon: FileText };
    const Icon = config.icon;
    return (
      <span className={`status-badge ${config.className}`}>
        <Icon size={14} />
        <span>{config.label}</span>
      </span>
    );
  };

  const getPriorityBadge = (priority, isUrgent) => {
    if (isUrgent) {
      return <span className="priority-badge priority-urgent">URGENT</span>;
    }
    const priorityConfig = {
      LOW: { className: 'priority-low', label: 'Low' },
      NORMAL: { className: 'priority-normal', label: 'Normal' },
      HIGH: { className: 'priority-high', label: 'High' },
      URGENT: { className: 'priority-urgent', label: 'Urgent' },
    };
    const config = priorityConfig[priority] || { className: 'priority-normal', label: priority || 'Normal' };
    return <span className={`priority-badge ${config.className}`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="task-detail-container">
        <div className="loading">Loading task...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-container">
        <div className="error">Task not found</div>
      </div>
    );
  }

  return (
    <div className="task-detail-container">
      <div className="detail-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/tasks')}>
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1>{task.title}</h1>
            <div className="header-meta">
              <span>{getStatusBadge(task.status)}</span>
              {getPriorityBadge(task.priority, task.isUrgent)}
              {task.taskNumber && <span>Task #: {task.taskNumber}</span>}
            </div>
          </div>
        </div>
        <div className="header-actions">
          {task.canBeEdited && (
            <button className="btn btn-primary" onClick={() => navigate(`/tasks/${id}/edit`)}>
              <Edit size={18} />
              Edit
            </button>
          )}
          {task.canBeEdited && (
            <button className="btn btn-secondary" onClick={handleReschedule}>
              <Calendar size={18} />
              Reschedule
            </button>
          )}
          {task.status === 'SCHEDULED' || task.status === 'IN_PROGRESS' ? (
            <button className="btn btn-success" onClick={handleComplete}>
              <CheckCircle size={18} />
              Complete
            </button>
          ) : null}
          {task.canBeCancelled && (
            <button className="btn btn-danger" onClick={handleCancel}>
              <XCircle size={18} />
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="detail-content">
        {/* Basic Information */}
        <div className="detail-section">
          <h2><FileText size={20} /> Basic Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Patient</label>
              <div>{task.patientName || 'N/A'}</div>
            </div>
            <div className="info-item">
              <label>Episode</label>
              <div>{task.episodeNumber || 'N/A'}</div>
            </div>
            {task.pocNumber && (
              <div className="info-item">
                <label>Plan of Care</label>
                <div>{task.pocNumber}</div>
              </div>
            )}
            <div className="info-item">
              <label>Task Type</label>
              <div>{task.taskType || 'N/A'}</div>
            </div>
            {task.assignedToName && (
              <div className="info-item">
                <label>Assigned To</label>
                <div>{task.assignedToName}</div>
              </div>
            )}
            <div className="info-item">
              <label>Status</label>
              <div>{getStatusBadge(task.status)}</div>
            </div>
          </div>
          {task.description && (
            <div className="info-item full-width">
              <label>Description</label>
              <div>{task.description}</div>
            </div>
          )}
        </div>

        {/* Scheduling Information */}
        <div className="detail-section">
          <h2><Calendar size={20} /> Scheduling</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Scheduled Date</label>
              <div>{task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            {task.scheduledStartTime && (
              <div className="info-item">
                <label>Start Time</label>
                <div>{task.scheduledStartTime}</div>
              </div>
            )}
            {task.scheduledEndTime && (
              <div className="info-item">
                <label>End Time</label>
                <div>{task.scheduledEndTime}</div>
              </div>
            )}
            {task.estimatedDurationMinutes && (
              <div className="info-item">
                <label>Estimated Duration</label>
                <div>{task.estimatedDurationMinutes} minutes</div>
              </div>
            )}
            {task.isOverdue && (
              <div className="info-item">
                <label>Status</label>
                <div className="overdue-badge">OVERDUE</div>
              </div>
            )}
            {task.isDueToday && (
              <div className="info-item">
                <label>Status</label>
                <div className="due-today-badge">DUE TODAY</div>
              </div>
            )}
          </div>
        </div>

        {/* Actual Time Tracking */}
        {(task.actualStartTime || task.actualEndTime || task.actualDurationMinutes) && (
          <div className="detail-section">
            <h2><Clock size={20} /> Actual Time</h2>
            <div className="info-grid">
              {task.actualStartTime && (
                <div className="info-item">
                  <label>Actual Start Time</label>
                  <div>{new Date(task.actualStartTime).toLocaleString()}</div>
                </div>
              )}
              {task.actualEndTime && (
                <div className="info-item">
                  <label>Actual End Time</label>
                  <div>{new Date(task.actualEndTime).toLocaleString()}</div>
                </div>
              )}
              {task.actualDurationMinutes && (
                <div className="info-item">
                  <label>Actual Duration</label>
                  <div>{task.actualDurationMinutes} minutes</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visit Details */}
        {(task.visitLocation || task.travelTimeMinutes || task.mileage) && (
          <div className="detail-section">
            <h2><MapPin size={20} /> Visit Details</h2>
            <div className="info-grid">
              {task.visitLocation && (
                <div className="info-item full-width">
                  <label>Visit Location</label>
                  <div>{task.visitLocation}</div>
                </div>
              )}
              {task.travelTimeMinutes && (
                <div className="info-item">
                  <label>Travel Time</label>
                  <div>{task.travelTimeMinutes} minutes</div>
                </div>
              )}
              {task.mileage && (
                <div className="info-item">
                  <label>Mileage</label>
                  <div>{task.mileage} miles</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completion Information */}
        {task.completedByName && (
          <div className="detail-section">
            <h2><CheckCircle size={20} /> Completion</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Completed By</label>
                <div>{task.completedByName}</div>
              </div>
              {task.completedAt && (
                <div className="info-item">
                  <label>Completed At</label>
                  <div>{new Date(task.completedAt).toLocaleString()}</div>
                </div>
              )}
              {task.completionNotes && (
                <div className="info-item full-width">
                  <label>Completion Notes</label>
                  <div>{task.completionNotes}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QA Review */}
        {task.needsQAReview && (
          <div className="detail-section">
            <h2><AlertCircle size={20} /> QA Review</h2>
            <div className="info-grid">
              {task.qaReviewedByName && (
                <div className="info-item">
                  <label>Reviewed By</label>
                  <div>{task.qaReviewedByName}</div>
                </div>
              )}
              {task.qaReviewedAt && (
                <div className="info-item">
                  <label>Reviewed At</label>
                  <div>{new Date(task.qaReviewedAt).toLocaleString()}</div>
                </div>
              )}
              {task.qaStatus && (
                <div className="info-item">
                  <label>QA Status</label>
                  <div>{task.qaStatus}</div>
                </div>
              )}
              {task.qaComments && (
                <div className="info-item full-width">
                  <label>QA Comments</label>
                  <div>{task.qaComments}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cancellation Information */}
        {task.cancelledByName && (
          <div className="detail-section">
            <h2><XCircle size={20} /> Cancellation</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Cancelled By</label>
                <div>{task.cancelledByName}</div>
              </div>
              {task.cancelledAt && (
                <div className="info-item">
                  <label>Cancelled At</label>
                  <div>{new Date(task.cancelledAt).toLocaleString()}</div>
                </div>
              )}
              {task.cancellationReason && (
                <div className="info-item full-width">
                  <label>Cancellation Reason</label>
                  <div>{task.cancellationReason}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Information */}
        {(task.specialInstructions || task.patientAvailability || task.notes) && (
          <div className="detail-section">
            <h2><FileText size={20} /> Additional Information</h2>
            <div className="info-grid">
              {task.specialInstructions && (
                <div className="info-item full-width">
                  <label>Special Instructions</label>
                  <div>{task.specialInstructions}</div>
                </div>
              )}
              {task.patientAvailability && (
                <div className="info-item full-width">
                  <label>Patient Availability</label>
                  <div>{task.patientAvailability}</div>
                </div>
              )}
              {task.notes && (
                <div className="info-item full-width">
                  <label>Notes</label>
                  <div>{task.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Billing Information */}
        {task.isBillable && (
          <div className="detail-section">
            <h2><FileText size={20} /> Billing</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Billable</label>
                <div>{task.isBillable ? 'Yes' : 'No'}</div>
              </div>
              {task.billingCode && (
                <div className="info-item">
                  <label>Billing Code</label>
                  <div>{task.billingCode}</div>
                </div>
              )}
              {task.billingUnits && (
                <div className="info-item">
                  <label>Billing Units</label>
                  <div>{task.billingUnits}</div>
                </div>
              )}
              <div className="info-item">
                <label>Billed</label>
                <div>{task.billed ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetail;

