import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { visitNoteAPI } from '../services/visitNoteAPI';
import { taskAPI } from '../services/taskAPI';
import { patientAPI } from '../services/patientAPI';
import { toast } from 'react-toastify';
import { Save, X, Clock, MapPin, User, Calendar, FileText } from 'lucide-react';
import './VisitNoteForm.css';

const VisitNoteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState(null);
  const [patient, setPatient] = useState(null);
  const [formData, setFormData] = useState({
    taskId: null,
    patientId: null,
    episodeId: null,
    visitType: 'RN_VISIT',
    visitDate: new Date().toISOString().split('T')[0],
    visitStartTime: '',
    visitEndTime: '',
    visitDurationMinutes: null,
    
    // Clinical Documentation
    chiefComplaint: '',
    vitalSigns: '', // JSON string - will be parsed/stringified
    assessmentFindings: '',
    interventionsProvided: '',
    patientResponse: '',
    teachingProvided: '',
    followUpPlan: '',
    nextVisitDate: '',
    
    // Travel Information
    mileage: '',
    travelTimeMinutes: '',
    
    // Status
    status: 'DRAFT',
    
    // Additional Information
    specialNotes: '',
    physicianContacted: false,
    physicianContactReason: '',
  });

  const [vitalSignsData, setVitalSignsData] = useState({
    systolicBP: '',
    diastolicBP: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    painLevel: '',
    weight: '',
  });

  useEffect(() => {
    if (taskId) {
      loadTask();
    } else if (isEditMode) {
      loadVisitNote();
    }
  }, [taskId, id]);

  useEffect(() => {
    // Update vital signs JSON when vitalSignsData changes
    const vitalSignsJson = JSON.stringify(vitalSignsData);
    setFormData(prev => ({ ...prev, vitalSigns: vitalSignsJson }));
  }, [vitalSignsData]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getById(taskId);
      const taskData = response.data;
      setTask(taskData);
      
      // Load patient
      const patientResponse = await patientAPI.getById(taskData.patientId);
      setPatient(patientResponse.data);
      
      // Pre-fill form with task data
      setFormData(prev => ({
        ...prev,
        taskId: taskData.id,
        patientId: taskData.patientId,
        episodeId: taskData.episodeId,
        visitType: getVisitTypeFromTaskType(taskData.taskType),
        visitDate: taskData.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledStartTime: taskData.scheduledStartTime || '',
      }));
      
      // Check if visit note already exists
      try {
        const visitNoteResponse = await visitNoteAPI.getByTaskId(taskId);
        const visitNote = visitNoteResponse.data;
        navigate(`/visit-notes/${visitNote.id}/edit`);
      } catch (error) {
        // Visit note doesn't exist yet, continue with new form
      }
    } catch (error) {
      console.error('Error loading task:', error);
      toast.error('Failed to load task information');
    } finally {
      setLoading(false);
    }
  };

  const loadVisitNote = async () => {
    try {
      setLoading(true);
      const response = await visitNoteAPI.getById(id);
      const visitNote = response.data;
      
      // Load task and patient
      if (visitNote.taskId) {
        const taskResponse = await taskAPI.getById(visitNote.taskId);
        setTask(taskResponse.data);
      }
      if (visitNote.patientId) {
        const patientResponse = await patientAPI.getById(visitNote.patientId);
        setPatient(patientResponse.data);
      }
      
      // Parse vital signs JSON
      if (visitNote.vitalSigns) {
        try {
          const parsed = JSON.parse(visitNote.vitalSigns);
          setVitalSignsData(parsed);
        } catch (e) {
          // Invalid JSON, keep empty
        }
      }
      
      // Format dates and times for form
      setFormData({
        taskId: visitNote.taskId,
        patientId: visitNote.patientId,
        episodeId: visitNote.episodeId,
        visitType: visitNote.visitType,
        visitDate: visitNote.visitDate || '',
        visitStartTime: visitNote.visitStartTime || '',
        visitEndTime: visitNote.visitEndTime || '',
        visitDurationMinutes: visitNote.visitDurationMinutes,
        chiefComplaint: visitNote.chiefComplaint || '',
        assessmentFindings: visitNote.assessmentFindings || '',
        interventionsProvided: visitNote.interventionsProvided || '',
        patientResponse: visitNote.patientResponse || '',
        teachingProvided: visitNote.teachingProvided || '',
        followUpPlan: visitNote.followUpPlan || '',
        nextVisitDate: visitNote.nextVisitDate || '',
        mileage: visitNote.mileage || '',
        travelTimeMinutes: visitNote.travelTimeMinutes || '',
        status: visitNote.status || 'DRAFT',
        specialNotes: visitNote.specialNotes || '',
        physicianContacted: visitNote.physicianContacted || false,
        physicianContactReason: visitNote.physicianContactReason || '',
        vitalSigns: visitNote.vitalSigns || '',
      });
    } catch (error) {
      console.error('Error loading visit note:', error);
      toast.error('Failed to load visit note');
    } finally {
      setLoading(false);
    }
  };

  const getVisitTypeFromTaskType = (taskType) => {
    if (taskType?.includes('RN')) return 'RN_VISIT';
    if (taskType?.includes('PT')) return 'PT_VISIT';
    if (taskType?.includes('OT')) return 'OT_VISIT';
    if (taskType?.includes('ST')) return 'ST_VISIT';
    if (taskType?.includes('HHA')) return 'HHA_VISIT';
    return 'RN_VISIT';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVitalSignChange = (e) => {
    const { name, value } = e.target;
    setVitalSignsData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateDuration = () => {
    if (formData.visitStartTime && formData.visitEndTime) {
      const start = new Date(`2000-01-01T${formData.visitStartTime}`);
      const end = new Date(`2000-01-01T${formData.visitEndTime}`);
      const diffMinutes = Math.round((end - start) / (1000 * 60));
      if (diffMinutes > 0) {
        setFormData(prev => ({ ...prev, visitDurationMinutes: diffMinutes }));
      }
    }
  };

  useEffect(() => {
    calculateDuration();
  }, [formData.visitStartTime, formData.visitEndTime]);

  const validateForm = () => {
    const errors = [];
    if (!formData.taskId) errors.push('Task is required');
    if (!formData.visitDate) errors.push('Visit date is required');
    if (!formData.visitType) errors.push('Visit type is required');
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
      const submitData = {
        ...formData,
        mileage: formData.mileage ? parseFloat(formData.mileage) : null,
        travelTimeMinutes: formData.travelTimeMinutes ? parseInt(formData.travelTimeMinutes) : null,
        visitDurationMinutes: formData.visitDurationMinutes || null,
        nextVisitDate: formData.nextVisitDate || null,
      };

      if (isEditMode) {
        await visitNoteAPI.update(id, submitData);
        toast.success('Visit note updated successfully');
      } else {
        await visitNoteAPI.create(submitData);
        toast.success('Visit note created successfully');
        navigate(`/tasks/${formData.taskId}`);
      }
    } catch (error) {
      console.error('Error saving visit note:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save visit note';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForQA = async () => {
    if (!isEditMode) {
      toast.error('Please save the visit note first');
      return;
    }

    try {
      await visitNoteAPI.submitForQA(id);
      toast.success('Visit note submitted for QA review');
      navigate('/visit-notes');
    } catch (error) {
      console.error('Error submitting visit note:', error);
      toast.error('Failed to submit visit note for QA');
    }
  };

  if (loading && !task && !patient) {
    return <div className="loading">Loading...</div>;
  }

  const visitTypeLabels = {
    RN_VISIT: 'RN Visit',
    PT_VISIT: 'Physical Therapy Visit',
    OT_VISIT: 'Occupational Therapy Visit',
    ST_VISIT: 'Speech Therapy Visit',
    HHA_VISIT: 'Home Health Aide Visit',
  };

  return (
    <div className="visit-note-form-container">
      <div className="form-header">
        <h2>
          {isEditMode ? 'Edit Visit Note' : 'New Visit Note'}
          {task && ` - ${task.title}`}
        </h2>
        {patient && (
          <div className="patient-info">
            <User size={16} />
            <span>{patient.firstName} {patient.lastName}</span>
            {patient.dateOfBirth && (
              <span>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="visit-note-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Visit Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Visit Type *</label>
              <select
                name="visitType"
                value={formData.visitType}
                onChange={handleChange}
                required
                disabled={isEditMode}
              >
                <option value="RN_VISIT">RN Visit</option>
                <option value="PT_VISIT">Physical Therapy Visit</option>
                <option value="OT_VISIT">Occupational Therapy Visit</option>
                <option value="ST_VISIT">Speech Therapy Visit</option>
                <option value="HHA_VISIT">Home Health Aide Visit</option>
              </select>
            </div>

            <div className="form-group">
              <label>Visit Date *</label>
              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                name="visitStartTime"
                value={formData.visitStartTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                name="visitEndTime"
                value={formData.visitEndTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                name="visitDurationMinutes"
                value={formData.visitDurationMinutes || ''}
                onChange={handleChange}
                readOnly
                placeholder="Auto-calculated"
              />
            </div>
          </div>
        </div>

        {/* Vital Signs (for RN visits) */}
        {(formData.visitType === 'RN_VISIT' || formData.visitType === 'HHA_VISIT') && (
          <div className="form-section">
            <h3>Vital Signs</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Blood Pressure (Systolic)</label>
                <input
                  type="number"
                  name="systolicBP"
                  value={vitalSignsData.systolicBP}
                  onChange={handleVitalSignChange}
                  placeholder="120"
                />
              </div>
              <div className="form-group">
                <label>Blood Pressure (Diastolic)</label>
                <input
                  type="number"
                  name="diastolicBP"
                  value={vitalSignsData.diastolicBP}
                  onChange={handleVitalSignChange}
                  placeholder="80"
                />
              </div>
              <div className="form-group">
                <label>Heart Rate (bpm)</label>
                <input
                  type="number"
                  name="heartRate"
                  value={vitalSignsData.heartRate}
                  onChange={handleVitalSignChange}
                  placeholder="72"
                />
              </div>
              <div className="form-group">
                <label>Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={vitalSignsData.temperature}
                  onChange={handleVitalSignChange}
                  placeholder="98.6"
                />
              </div>
              <div className="form-group">
                <label>Respiratory Rate</label>
                <input
                  type="number"
                  name="respiratoryRate"
                  value={vitalSignsData.respiratoryRate}
                  onChange={handleVitalSignChange}
                  placeholder="16"
                />
              </div>
              <div className="form-group">
                <label>O2 Saturation (%)</label>
                <input
                  type="number"
                  name="oxygenSaturation"
                  value={vitalSignsData.oxygenSaturation}
                  onChange={handleVitalSignChange}
                  placeholder="98"
                />
              </div>
              <div className="form-group">
                <label>Pain Level (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  name="painLevel"
                  value={vitalSignsData.painLevel}
                  onChange={handleVitalSignChange}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={vitalSignsData.weight}
                  onChange={handleVitalSignChange}
                  placeholder="150"
                />
              </div>
            </div>
          </div>
        )}

        {/* Clinical Documentation */}
        <div className="form-section">
          <h3>Clinical Documentation</h3>
          <div className="form-group">
            <label>Chief Complaint</label>
            <textarea
              name="chiefComplaint"
              value={formData.chiefComplaint}
              onChange={handleChange}
              rows="3"
              placeholder="Patient's primary concern or reason for visit"
            />
          </div>

          <div className="form-group">
            <label>Assessment Findings</label>
            <textarea
              name="assessmentFindings"
              value={formData.assessmentFindings}
              onChange={handleChange}
              rows="5"
              placeholder="Document your clinical assessment findings"
            />
          </div>

          <div className="form-group">
            <label>Interventions Provided</label>
            <textarea
              name="interventionsProvided"
              value={formData.interventionsProvided}
              onChange={handleChange}
              rows="5"
              placeholder="Describe the interventions, treatments, or services provided"
            />
          </div>

          <div className="form-group">
            <label>Patient Response</label>
            <textarea
              name="patientResponse"
              value={formData.patientResponse}
              onChange={handleChange}
              rows="3"
              placeholder="How did the patient respond to the interventions?"
            />
          </div>

          <div className="form-group">
            <label>Teaching Provided</label>
            <textarea
              name="teachingProvided"
              value={formData.teachingProvided}
              onChange={handleChange}
              rows="3"
              placeholder="Patient/caregiver education provided during visit"
            />
          </div>

          <div className="form-group">
            <label>Follow-up Plan</label>
            <textarea
              name="followUpPlan"
              value={formData.followUpPlan}
              onChange={handleChange}
              rows="3"
              placeholder="Plan for next visit or follow-up care"
            />
          </div>

          <div className="form-group">
            <label>Next Visit Date</label>
            <input
              type="date"
              name="nextVisitDate"
              value={formData.nextVisitDate}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Travel Information */}
        <div className="form-section">
          <h3>Travel Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Mileage</label>
              <input
                type="number"
                step="0.1"
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                placeholder="0.0"
              />
            </div>
            <div className="form-group">
              <label>Travel Time (minutes)</label>
              <input
                type="number"
                name="travelTimeMinutes"
                value={formData.travelTimeMinutes}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <h3>Additional Information</h3>
          <div className="form-group">
            <label>Special Notes</label>
            <textarea
              name="specialNotes"
              value={formData.specialNotes}
              onChange={handleChange}
              rows="3"
              placeholder="Any additional notes or observations"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="physicianContacted"
                checked={formData.physicianContacted}
                onChange={handleChange}
              />
              Physician Contacted
            </label>
          </div>

          {formData.physicianContacted && (
            <div className="form-group">
              <label>Physician Contact Reason</label>
              <textarea
                name="physicianContactReason"
                value={formData.physicianContactReason}
                onChange={handleChange}
                rows="2"
                placeholder="Reason for contacting physician"
              />
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
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
            {loading ? 'Saving...' : 'Save Visit Note'}
          </button>
          {isEditMode && formData.status === 'DRAFT' && (
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSubmitForQA}
              disabled={loading}
            >
              <FileText size={18} />
              Submit for QA Review
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default VisitNoteForm;

