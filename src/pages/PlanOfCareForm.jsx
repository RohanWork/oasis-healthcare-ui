import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { planOfCareAPI } from '../services/planOfCareAPI';
import { patientAPI } from '../services/patientAPI';
import { episodeAPI } from '../services/patientAPI';
import { toast } from 'react-toastify';
import { Save, X, Plus, Trash2, FileText, User, Calendar } from 'lucide-react';
import './PlanOfCareForm.css';

const PlanOfCareForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const oasisId = searchParams.get('oasisId');
  const patientId = searchParams.get('patientId');
  const episodeId = searchParams.get('episodeId');
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [formData, setFormData] = useState({
    patientId: patientId ? parseInt(patientId) : null,
    episodeId: episodeId ? parseInt(episodeId) : null,
    oasisAssessmentId: oasisId ? parseInt(oasisId) : null,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    certificationPeriodDays: 60,
    
    // Diagnosis
    primaryDiagnosisCode: '',
    primaryDiagnosisDescription: '',
    secondaryDiagnosisCode: '',
    secondaryDiagnosisDescription: '',
    otherDiagnoses: '',
    
    // Clinical info
    functionalLimitations: '',
    safetyMeasures: '',
    nutritionalRequirements: '',
    medicationList: '',
    medicationManagementNeeded: false,
    
    // Status
    status: 'DRAFT',
    statusReason: '',
    
    // Physician
    physicianName: '',
    physicianPhone: '',
    physicianSignatureRequired: false,
    physicianSignedDate: '',
    physicianSignatureObtained: false,
    
    // Additional
    specialInstructions: '',
    dmeEquipment: '',
    notes: '',
    
    // Collections
    frequencies: [],
    interventions: [],
    goals: [],
    physicianOrders: [],
  });

  useEffect(() => {
    loadPatients();
    if (formData.patientId) {
      loadEpisodes(formData.patientId);
    }
    if (isEditMode) {
      loadPOC();
    } else if (oasisId) {
      generateFromOASIS();
    }
  }, [id, oasisId]);

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

  const loadPOC = async () => {
    try {
      setLoading(true);
      const data = await planOfCareAPI.getById(id);
      
      // Format dates for form inputs
      setFormData({
        ...data,
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        physicianSignedDate: data.physicianSignedDate || '',
        frequencies: data.frequencies || [],
        interventions: data.interventions || [],
        goals: data.goals || [],
        physicianOrders: data.physicianOrders || [],
      });
    } catch (error) {
      console.error('Error loading POC:', error);
      toast.error('Failed to load Plan of Care');
      navigate('/plan-of-care');
    } finally {
      setLoading(false);
    }
  };

  const generateFromOASIS = async () => {
    try {
      setLoading(true);
      const data = await planOfCareAPI.generateFromOASIS(oasisId);
      toast.success('Plan of Care generated from OASIS');
      
      // Format dates for form inputs
      setFormData({
        ...data,
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        physicianSignedDate: data.physicianSignedDate || '',
        frequencies: data.frequencies || [],
        interventions: data.interventions || [],
        goals: data.goals || [],
        physicianOrders: data.physicianOrders || [],
      });
    } catch (error) {
      console.error('Error generating POC from OASIS:', error);
      toast.error('Failed to generate Plan of Care from OASIS');
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

    // Load episodes when patient changes
    if (name === 'patientId' && value) {
      loadEpisodes(parseInt(value));
    }
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    setFormData(prev => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value === '' ? null : value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addArrayItem = (arrayName, defaultItem) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], { ...defaultItem }]
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const calculateTotalVisits = (visitsPerWeek, numberOfWeeks) => {
    if (visitsPerWeek && numberOfWeeks) {
      return visitsPerWeek * numberOfWeeks;
    }
    return null;
  };

  const handleFrequencyChange = (index, field, value) => {
    handleArrayChange('frequencies', index, field, value);
    
    // Auto-calculate total visits
    if (field === 'visitsPerWeek' || field === 'numberOfWeeks') {
      const freq = formData.frequencies[index];
      const visitsPerWeek = field === 'visitsPerWeek' ? parseInt(value) || 0 : (freq.visitsPerWeek || 0);
      const numberOfWeeks = field === 'numberOfWeeks' ? parseInt(value) || 0 : (freq.numberOfWeeks || 0);
      const totalVisits = calculateTotalVisits(visitsPerWeek, numberOfWeeks);
      if (totalVisits) {
        handleArrayChange('frequencies', index, 'totalVisits', totalVisits);
      }
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.patientId) errors.push('Patient is required');
    if (!formData.episodeId) errors.push('Episode is required');
    if (!formData.startDate) errors.push('Start date is required');
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
      // Prepare data - convert empty strings to null
      const dataToSend = {
        ...formData,
        certificationPeriodDays: formData.certificationPeriodDays ? parseInt(formData.certificationPeriodDays) : null,
        physicianSignedDate: formData.physicianSignedDate || null,
        endDate: formData.endDate || null,
      };

      if (isEditMode) {
        await planOfCareAPI.update(id, dataToSend);
        toast.success('Plan of Care updated successfully');
      } else {
        await planOfCareAPI.create(dataToSend);
        toast.success('Plan of Care created successfully');
      }
      navigate('/plan-of-care');
    } catch (error) {
      console.error('Error saving POC:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save Plan of Care';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!isEditMode) {
      toast.error('Please save the Plan of Care first');
      return;
    }

    try {
      await planOfCareAPI.submitForApproval(id);
      toast.success('Plan of Care submitted for approval');
      navigate('/plan-of-care');
    } catch (error) {
      toast.error('Failed to submit Plan of Care for approval');
    }
  };

  if (loading && !formData.patientId) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="poc-form-container">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Plan of Care' : 'New Plan of Care'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="poc-form">
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
                    {patient.firstName} {patient.lastName} (DOB: {new Date(patient.dateOfBirth).toLocaleDateString()})
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
              <label>Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Certification Period (days)</label>
              <input
                type="number"
                name="certificationPeriodDays"
                value={formData.certificationPeriodDays || 60}
                onChange={handleChange}
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Diagnosis Information */}
        <div className="form-section">
          <h3>Diagnosis Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Primary Diagnosis Code</label>
              <input
                type="text"
                name="primaryDiagnosisCode"
                value={formData.primaryDiagnosisCode || ''}
                onChange={handleChange}
                placeholder="e.g., I10"
              />
            </div>
            <div className="form-group full-width">
              <label>Primary Diagnosis Description</label>
              <input
                type="text"
                name="primaryDiagnosisDescription"
                value={formData.primaryDiagnosisDescription || ''}
                onChange={handleChange}
                placeholder="Essential (primary) hypertension"
              />
            </div>
            <div className="form-group">
              <label>Secondary Diagnosis Code</label>
              <input
                type="text"
                name="secondaryDiagnosisCode"
                value={formData.secondaryDiagnosisCode || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group full-width">
              <label>Secondary Diagnosis Description</label>
              <input
                type="text"
                name="secondaryDiagnosisDescription"
                value={formData.secondaryDiagnosisDescription || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group full-width">
              <label>Other Diagnoses</label>
              <textarea
                name="otherDiagnoses"
                value={formData.otherDiagnoses || ''}
                onChange={handleChange}
                rows="3"
                placeholder="Additional diagnoses (comma-separated or JSON)"
              />
            </div>
          </div>
        </div>

        {/* Visit Frequencies */}
        <div className="form-section">
          <div className="section-header">
            <h3>Visit Frequencies</h3>
            <button
              type="button"
              className="btn-add"
              onClick={() => addArrayItem('frequencies', {
                disciplineType: 'RN',
                visitsPerWeek: null,
                numberOfWeeks: null,
                totalVisits: null,
                status: 'PLANNED',
                isActive: true,
              })}
            >
              <Plus size={18} />
              Add Frequency
            </button>
          </div>
          {formData.frequencies.map((freq, index) => (
            <div key={index} className="array-item-card">
              <div className="array-item-header">
                <h4>Frequency #{index + 1}</h4>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeArrayItem('frequencies', index)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Discipline *</label>
                  <select
                    value={freq.disciplineType || ''}
                    onChange={(e) => handleFrequencyChange(index, 'disciplineType', e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="RN">RN</option>
                    <option value="PT">PT</option>
                    <option value="OT">OT</option>
                    <option value="ST">ST</option>
                    <option value="HHA">HHA</option>
                    <option value="MSW">MSW</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Visits per Week</label>
                  <input
                    type="number"
                    value={freq.visitsPerWeek || ''}
                    onChange={(e) => handleFrequencyChange(index, 'visitsPerWeek', e.target.value)}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Number of Weeks</label>
                  <input
                    type="number"
                    value={freq.numberOfWeeks || ''}
                    onChange={(e) => handleFrequencyChange(index, 'numberOfWeeks', e.target.value)}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Total Visits</label>
                  <input
                    type="number"
                    value={freq.totalVisits || ''}
                    readOnly
                    placeholder="Auto-calculated"
                  />
                </div>
                <div className="form-group">
                  <label>Frequency Code</label>
                  <input
                    type="text"
                    value={freq.frequencyCode || ''}
                    onChange={(e) => handleArrayChange('frequencies', index, 'frequencyCode', e.target.value)}
                    placeholder="e.g., 3W3"
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Minutes per Visit</label>
                  <input
                    type="number"
                    value={freq.estimatedMinutesPerVisit || ''}
                    onChange={(e) => handleArrayChange('frequencies', index, 'estimatedMinutesPerVisit', e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interventions */}
        <div className="form-section">
          <div className="section-header">
            <h3>Interventions</h3>
            <button
              type="button"
              className="btn-add"
              onClick={() => addArrayItem('interventions', {
                interventionDescription: '',
                status: 'ACTIVE',
                isActive: true,
              })}
            >
              <Plus size={18} />
              Add Intervention
            </button>
          </div>
          {formData.interventions.map((intervention, index) => (
            <div key={index} className="array-item-card">
              <div className="array-item-header">
                <h4>Intervention #{index + 1}</h4>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeArrayItem('interventions', index)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Description *</label>
                  <textarea
                    value={intervention.interventionDescription || ''}
                    onChange={(e) => handleArrayChange('interventions', index, 'interventionDescription', e.target.value)}
                    rows="3"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={intervention.interventionCategory || ''}
                    onChange={(e) => handleArrayChange('interventions', index, 'interventionCategory', e.target.value)}
                    placeholder="e.g., Medication Management"
                  />
                </div>
                <div className="form-group">
                  <label>Responsible Discipline</label>
                  <select
                    value={intervention.responsibleDiscipline || ''}
                    onChange={(e) => handleArrayChange('interventions', index, 'responsibleDiscipline', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="RN">RN</option>
                    <option value="PT">PT</option>
                    <option value="OT">OT</option>
                    <option value="ST">ST</option>
                    <option value="HHA">HHA</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Frequency</label>
                  <input
                    type="text"
                    value={intervention.frequency || ''}
                    onChange={(e) => handleArrayChange('interventions', index, 'frequency', e.target.value)}
                    placeholder="e.g., Daily, 3x per week"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Goals */}
        <div className="form-section">
          <div className="section-header">
            <h3>Goals</h3>
            <button
              type="button"
              className="btn-add"
              onClick={() => addArrayItem('goals', {
                goalDescription: '',
                goalType: 'SHORT_TERM',
                status: 'ACTIVE',
                isActive: true,
              })}
            >
              <Plus size={18} />
              Add Goal
            </button>
          </div>
          {formData.goals.map((goal, index) => (
            <div key={index} className="array-item-card">
              <div className="array-item-header">
                <h4>Goal #{index + 1}</h4>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeArrayItem('goals', index)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Goal Description *</label>
                  <textarea
                    value={goal.goalDescription || ''}
                    onChange={(e) => handleArrayChange('goals', index, 'goalDescription', e.target.value)}
                    rows="3"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Goal Type</label>
                  <select
                    value={goal.goalType || ''}
                    onChange={(e) => handleArrayChange('goals', index, 'goalType', e.target.value)}
                  >
                    <option value="SHORT_TERM">Short Term</option>
                    <option value="LONG_TERM">Long Term</option>
                    <option value="DISCHARGE">Discharge</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={goal.goalCategory || ''}
                    onChange={(e) => handleArrayChange('goals', index, 'goalCategory', e.target.value)}
                    placeholder="e.g., Mobility"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Measurable Outcome</label>
                  <input
                    type="text"
                    value={goal.measurableOutcome || ''}
                    onChange={(e) => handleArrayChange('goals', index, 'measurableOutcome', e.target.value)}
                    placeholder="e.g., Patient will ambulate 50 feet independently"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Physician Orders */}
        <div className="form-section">
          <div className="section-header">
            <h3>Physician Orders</h3>
            <button
              type="button"
              className="btn-add"
              onClick={() => addArrayItem('physicianOrders', {
                orderType: 'SKILLED_NURSING',
                orderDescription: '',
                status: 'ACTIVE',
                isActive: true,
              })}
            >
              <Plus size={18} />
              Add Order
            </button>
          </div>
          {formData.physicianOrders.map((order, index) => (
            <div key={index} className="array-item-card">
              <div className="array-item-header">
                <h4>Order #{index + 1}</h4>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeArrayItem('physicianOrders', index)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Order Type *</label>
                  <select
                    value={order.orderType || ''}
                    onChange={(e) => handleArrayChange('physicianOrders', index, 'orderType', e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="SKILLED_NURSING">Skilled Nursing</option>
                    <option value="PHYSICAL_THERAPY">Physical Therapy</option>
                    <option value="OCCUPATIONAL_THERAPY">Occupational Therapy</option>
                    <option value="SPEECH_THERAPY">Speech Therapy</option>
                    <option value="HOME_HEALTH_AIDE">Home Health Aide</option>
                    <option value="DME">DME</option>
                    <option value="MEDICATION">Medication</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Order Description *</label>
                  <textarea
                    value={order.orderDescription || ''}
                    onChange={(e) => handleArrayChange('physicianOrders', index, 'orderDescription', e.target.value)}
                    rows="3"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Discipline</label>
                  <select
                    value={order.discipline || ''}
                    onChange={(e) => handleArrayChange('physicianOrders', index, 'discipline', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="RN">RN</option>
                    <option value="PT">PT</option>
                    <option value="OT">OT</option>
                    <option value="ST">ST</option>
                    <option value="HHA">HHA</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Frequency</label>
                  <input
                    type="text"
                    value={order.frequency || ''}
                    onChange={(e) => handleArrayChange('physicianOrders', index, 'frequency', e.target.value)}
                    placeholder="e.g., 3x per week"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Clinical Information */}
        <div className="form-section">
          <h3>Clinical Information</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Functional Limitations</label>
              <textarea
                name="functionalLimitations"
                value={formData.functionalLimitations || ''}
                onChange={handleChange}
                rows="3"
              />
            </div>
            <div className="form-group full-width">
              <label>Safety Measures</label>
              <textarea
                name="safetyMeasures"
                value={formData.safetyMeasures || ''}
                onChange={handleChange}
                rows="3"
              />
            </div>
            <div className="form-group full-width">
              <label>Medication List</label>
              <textarea
                name="medicationList"
                value={formData.medicationList || ''}
                onChange={handleChange}
                rows="4"
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="medicationManagementNeeded"
                  checked={formData.medicationManagementNeeded}
                  onChange={handleChange}
                />
                Medication Management Needed
              </label>
            </div>
          </div>
        </div>

        {/* Physician Information */}
        <div className="form-section">
          <h3>Physician Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Physician Name</label>
              <input
                type="text"
                name="physicianName"
                value={formData.physicianName || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Physician Phone</label>
              <input
                type="text"
                name="physicianPhone"
                value={formData.physicianPhone || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="physicianSignatureRequired"
                  checked={formData.physicianSignatureRequired}
                  onChange={handleChange}
                />
                Signature Required
              </label>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="physicianSignatureObtained"
                  checked={formData.physicianSignatureObtained}
                  onChange={handleChange}
                />
                Signature Obtained
              </label>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <h3>Additional Information</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Special Instructions</label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions || ''}
                onChange={handleChange}
                rows="3"
              />
            </div>
            <div className="form-group full-width">
              <label>DME Equipment</label>
              <textarea
                name="dmeEquipment"
                value={formData.dmeEquipment || ''}
                onChange={handleChange}
                rows="2"
              />
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/plan-of-care')}
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
            {loading ? 'Saving...' : 'Save Plan of Care'}
          </button>
          {isEditMode && formData.status === 'DRAFT' && (
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSubmitForApproval}
              disabled={loading}
            >
              <FileText size={18} />
              Submit for Approval
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PlanOfCareForm;

