import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { taskAPI } from '../services/taskAPI';
import { patientAPI, episodeAPI } from '../services/patientAPI';
import { userAPI } from '../services/userAPI';
import { planOfCareAPI } from '../services/planOfCareAPI';
import { toast } from 'react-toastify';
import { Save, X, Calendar, User, MapPin } from 'lucide-react';
import './TaskForm.css';

const TaskForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const episodeId = searchParams.get('episodeId');
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [pocs, setPocs] = useState([]);
  const [clinicians, setClinicians] = useState([]);
  const [formData, setFormData] = useState({
    patientId: patientId ? parseInt(patientId) : null,
    episodeId: episodeId ? parseInt(episodeId) : null,
    planOfCareId: null,
    assignedToId: null,
    taskType: 'RN_VISIT',
    title: '',
    description: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledStartTime: '',
    scheduledEndTime: '',
    estimatedDurationMinutes: '',
    status: 'SCHEDULED',
    priority: 'NORMAL',
    isUrgent: false,
    visitLocation: '',
    specialInstructions: '',
    patientAvailability: '',
    notes: '',
    isBillable: false,
    billingCode: '',
  });

  useEffect(() => {
    loadPatients();
    loadClinicians();
    if (formData.patientId) {
      loadEpisodes(formData.patientId);
      loadPOCs(formData.patientId);
    }
    if (isEditMode) {
      loadTask();
    }
  }, [id]);

  useEffect(() => {
    if (formData.patientId) {
      loadEpisodes(formData.patientId);
      loadPOCs(formData.patientId);
    }
  }, [formData.patientId]);

  const loadPatients = async () => {
    try {
      const response = await patientAPI.getAll();
      setPatients(response.data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadEpisodes = async (patientId) => {
    try {
      const response = await episodeAPI.getByPatient(patientId);
      setEpisodes(response.data || []);
    } catch (error) {
      console.error('Error loading episodes:', error);
    }
  };

  const loadPOCs = async (patientId) => {
    try {
      const data = await planOfCareAPI.getByPatient(patientId);
      setPocs(data || []);
    } catch (error) {
      console.error('Error loading POCs:', error);
    }
  };

  const loadClinicians = async () => {
    try {
      const response = await userAPI.getClinicians();
      setClinicians(response.data || []);
    } catch (error) {
      console.error('Error loading clinicians:', error);
    }
  };

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getById(id);
      const task = response.data;
      
      setFormData({
        patientId: task.patientId,
        episodeId: task.episodeId,
        planOfCareId: task.planOfCareId || null,
        assignedToId: task.assignedToId || null,
        taskType: task.taskType || 'RN_VISIT',
        title: task.title || '',
        description: task.description || '',
        scheduledDate: task.scheduledDate || '',
        scheduledStartTime: task.scheduledStartTime || '',
        scheduledEndTime: task.scheduledEndTime || '',
        estimatedDurationMinutes: task.estimatedDurationMinutes || '',
        status: task.status || 'SCHEDULED',
        priority: task.priority || 'NORMAL',
        isUrgent: task.isUrgent || false,
        visitLocation: task.visitLocation || '',
        specialInstructions: task.specialInstructions || '',
        patientAvailability: task.patientAvailability || '',
        notes: task.notes || '',
        isBillable: task.isBillable || false,
        billingCode: task.billingCode || '',
      });
    } catch (error) {
      console.error('Error loading task:', error);
      toast.error('Failed to load task');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value === '' ? null : value)
    }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.patientId) errors.push('Patient is required');
    if (!formData.episodeId) errors.push('Episode is required');
    if (!formData.taskType) errors.push('Task type is required');
    if (!formData.title?.trim()) errors.push('Title is required');
    if (!formData.scheduledDate) errors.push('Scheduled date is required');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        estimatedDurationMinutes: formData.estimatedDurationMinutes ? parseInt(formData.estimatedDurationMinutes) : null,
        planOfCareId: formData.planOfCareId || null,
        assignedToId: formData.assignedToId || null,
      };

      if (isEditMode) {
        await taskAPI.update(id, dataToSend);
        toast.success('Task updated successfully');
      } else {
        await taskAPI.create(dataToSend);
        toast.success('Task created successfully');
      }
      navigate('/tasks');
    } catch (error) {
      console.error('Error saving task:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save task';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.patientId) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="task-form-container">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Task' : 'New Task'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="task-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Patient *</label>
              <select
                name="patientId"
                value={formData.patientId || ''}
                onChange={handleChange}
                required
                disabled={isEditMode}
              >
                <option value="">Select Patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Episode *</label>
              <select
                name="episodeId"
                value={formData.episodeId || ''}
                onChange={handleChange}
                required
                disabled={isEditMode || !formData.patientId}
              >
                <option value="">Select Episode</option>
                {episodes.map(episode => (
                  <option key={episode.id} value={episode.id}>
                    {episode.episodeNumber} - {episode.episodeType}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Plan of Care</label>
              <select
                name="planOfCareId"
                value={formData.planOfCareId || ''}
                onChange={handleChange}
                disabled={!formData.patientId}
              >
                <option value="">Select POC (Optional)</option>
                {pocs.map(poc => (
                  <option key={poc.id} value={poc.id}>
                    {poc.pocNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Task Type *</label>
              <select
                name="taskType"
                value={formData.taskType}
                onChange={handleChange}
                required
              >
                <option value="RN_VISIT">RN Visit</option>
                <option value="PT_VISIT">PT Visit</option>
                <option value="OT_VISIT">OT Visit</option>
                <option value="ST_VISIT">ST Visit</option>
                <option value="HHA_VISIT">HHA Visit</option>
                <option value="MSW_VISIT">MSW Visit</option>
                <option value="SUPERVISORY_VISIT">Supervisory Visit</option>
                <option value="OASIS_ASSESSMENT">OASIS Assessment</option>
                <option value="OASIS_RECERT">OASIS Recert</option>
                <option value="OASIS_DISCHARGE">OASIS Discharge</option>
                <option value="PHYSICIAN_ORDER_RENEWAL">Physician Order Renewal</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., RN Visit - Wound Care"
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows="3"
                placeholder="Task description"
              />
            </div>

            <div className="form-group">
              <label>Assigned To</label>
              <select
                name="assignedToId"
                value={formData.assignedToId || ''}
                onChange={handleChange}
              >
                <option value="">Unassigned</option>
                {clinicians.map(clinician => (
                  <option key={clinician.id} value={clinician.id}>
                    {clinician.firstName} {clinician.lastName} ({clinician.roles?.[0]?.roleName?.replace('ROLE_', '') || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div className="form-section">
          <h3>Scheduling</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Scheduled Date *</label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                name="scheduledStartTime"
                value={formData.scheduledStartTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                name="scheduledEndTime"
                value={formData.scheduledEndTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Estimated Duration (minutes)</label>
              <input
                type="number"
                name="estimatedDurationMinutes"
                value={formData.estimatedDurationMinutes}
                onChange={handleChange}
                min="1"
                placeholder="60"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED_PENDING_QA">Completed - Pending QA</option>
                <option value="QA_APPROVED">QA Approved</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="MISSED">Missed</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isUrgent"
                  checked={formData.isUrgent}
                  onChange={handleChange}
                />
                Urgent
              </label>
            </div>
          </div>
        </div>

        {/* Visit Details */}
        <div className="form-section">
          <h3>Visit Details</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Visit Location</label>
              <input
                type="text"
                name="visitLocation"
                value={formData.visitLocation || ''}
                onChange={handleChange}
                placeholder="Patient's home address"
              />
            </div>

            <div className="form-group full-width">
              <label>Special Instructions</label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions || ''}
                onChange={handleChange}
                rows="3"
                placeholder="Special instructions for the visit"
              />
            </div>

            <div className="form-group full-width">
              <label>Patient Availability</label>
              <textarea
                name="patientAvailability"
                value={formData.patientAvailability || ''}
                onChange={handleChange}
                rows="2"
                placeholder="e.g., Not available before 10 AM"
              />
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="form-section">
          <h3>Billing</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isBillable"
                  checked={formData.isBillable}
                  onChange={handleChange}
                />
                Billable
              </label>
            </div>

            {formData.isBillable && (
              <div className="form-group">
                <label>Billing Code</label>
                <input
                  type="text"
                  name="billingCode"
                  value={formData.billingCode || ''}
                  onChange={handleChange}
                  placeholder="CPT/HCPCS code"
                />
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <h3>Additional Information</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows="3"
                placeholder="Additional notes"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/tasks')}
            disabled={loading}
          >
            <X size={18} />
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;

