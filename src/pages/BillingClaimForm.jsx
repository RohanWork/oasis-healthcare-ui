import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { billingAPI } from '../services/billingAPI';
import { patientAPI, episodeAPI } from '../services/patientAPI';
import { visitNoteAPI } from '../services/visitNoteAPI';
import { taskAPI } from '../services/taskAPI';
import { insuranceAPI } from '../services/insuranceAPI';
import { toast } from 'react-toastify';
import { Save, X, DollarSign } from 'lucide-react';
import './BillingClaimForm.css';

const BillingClaimForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const episodeId = searchParams.get('episodeId');
  const visitNoteId = searchParams.get('visitNoteId');
  const taskId = searchParams.get('taskId');
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [formData, setFormData] = useState({
    patientId: patientId ? parseInt(patientId) : null,
    episodeId: episodeId ? parseInt(episodeId) : null,
    visitNoteId: visitNoteId ? parseInt(visitNoteId) : null,
    taskId: taskId ? parseInt(taskId) : null,
    claimType: 'FINAL',
    billingDate: new Date().toISOString().split('T')[0],
    serviceDate: new Date().toISOString().split('T')[0],
    serviceEndDate: '',
    serviceCode: '',
    serviceDescription: '',
    units: '',
    unitRate: '',
    insuranceId: null,
    insuranceClaimNumber: '',
    status: 'DRAFT',
    patientResponsibility: '',
    adjustmentAmount: '',
    adjustmentReason: '',
    notes: '',
  });

  useEffect(() => {
    loadPatients();
    if (formData.patientId) {
      loadEpisodes(formData.patientId);
      loadInsurances(formData.patientId);
    }
    if (visitNoteId) {
      loadVisitNoteData(visitNoteId);
    }
    if (taskId) {
      loadTaskData(taskId);
    }
    if (isEditMode) {
      loadClaim();
    }
  }, [id, visitNoteId, taskId]);

  useEffect(() => {
    if (formData.patientId) {
      loadEpisodes(formData.patientId);
      loadInsurances(formData.patientId);
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

  const loadInsurances = async (patientId) => {
    try {
      const response = await insuranceAPI.getByPatient(patientId);
      setInsurances(response.data || []);
      if (response.data && response.data.length > 0) {
        const primary = response.data.find(i => i.insuranceType === 'PRIMARY') || response.data[0];
        setFormData(prev => ({ ...prev, insuranceId: primary.id }));
      }
    } catch (error) {
      console.error('Error loading insurances:', error);
    }
  };

  const loadVisitNoteData = async (visitNoteId) => {
    try {
      const visitNote = await visitNoteAPI.getById(visitNoteId);
      setFormData(prev => ({
        ...prev,
        patientId: visitNote.patientId,
        episodeId: visitNote.episodeId,
        serviceDate: visitNote.visitDate || prev.serviceDate,
        serviceCode: 'G0151', // Default for home health visit
        units: visitNote.visitDurationMinutes ? Math.ceil(visitNote.visitDurationMinutes / 15) : '',
      }));
    } catch (error) {
      console.error('Error loading visit note:', error);
    }
  };

  const loadTaskData = async (taskId) => {
    try {
      const task = await taskAPI.getById(taskId);
      setFormData(prev => ({
        ...prev,
        patientId: task.patientId,
        episodeId: task.episodeId,
        serviceDate: task.scheduledDate || prev.serviceDate,
        serviceCode: task.billingCode || 'G0151',
        units: task.billingUnits || '',
      }));
    } catch (error) {
      console.error('Error loading task:', error);
    }
  };

  const loadClaim = async () => {
    try {
      setLoading(true);
      const response = await billingAPI.getClaimById(id);
      const claim = response.data;
      
      setFormData({
        patientId: claim.patientId,
        episodeId: claim.episodeId,
        visitNoteId: claim.visitNoteId,
        taskId: claim.taskId,
        claimType: claim.claimType,
        billingDate: claim.billingDate || '',
        serviceDate: claim.serviceDate || '',
        serviceEndDate: claim.serviceEndDate || '',
        serviceCode: claim.serviceCode || '',
        serviceDescription: claim.serviceDescription || '',
        units: claim.units || '',
        unitRate: claim.unitRate ? claim.unitRate.toString() : '',
        insuranceId: claim.insuranceId,
        insuranceClaimNumber: claim.insuranceClaimNumber || '',
        status: claim.status || 'DRAFT',
        patientResponsibility: claim.patientResponsibility ? claim.patientResponsibility.toString() : '',
        adjustmentAmount: claim.adjustmentAmount ? claim.adjustmentAmount.toString() : '',
        adjustmentReason: claim.adjustmentReason || '',
        notes: claim.notes || '',
      });
    } catch (error) {
      console.error('Error loading claim:', error);
      toast.error('Failed to load billing claim');
      navigate('/billing/claims');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));

    // Auto-calculate total if units or rate changes
    if (name === 'units' || name === 'unitRate') {
      const units = name === 'units' ? (value ? parseFloat(value) : 0) : (formData.units ? parseFloat(formData.units) : 0);
      const rate = name === 'unitRate' ? (value ? parseFloat(value) : 0) : (formData.unitRate ? parseFloat(formData.unitRate) : 0);
      // Total will be calculated on backend
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.patientId) errors.push('Patient is required');
    if (!formData.episodeId) errors.push('Episode is required');
    if (!formData.claimType) errors.push('Claim type is required');
    if (!formData.billingDate) errors.push('Billing date is required');
    if (!formData.serviceDate) errors.push('Service date is required');
    if (!formData.serviceCode?.trim()) errors.push('Service code is required');
    if (!formData.units) errors.push('Units is required');
    if (!formData.unitRate) errors.push('Unit rate is required');
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
        units: formData.units ? parseInt(formData.units) : null,
        unitRate: formData.unitRate ? parseFloat(formData.unitRate) : null,
        patientResponsibility: formData.patientResponsibility ? parseFloat(formData.patientResponsibility) : null,
        adjustmentAmount: formData.adjustmentAmount ? parseFloat(formData.adjustmentAmount) : null,
        visitNoteId: formData.visitNoteId || null,
        taskId: formData.taskId || null,
        insuranceId: formData.insuranceId || null,
      };

      if (isEditMode) {
        await billingAPI.updateClaim(id, dataToSend);
        toast.success('Billing claim updated successfully');
      } else {
        await billingAPI.createClaim(dataToSend);
        toast.success('Billing claim created successfully');
      }
      navigate('/billing/claims');
    } catch (error) {
      console.error('Error saving billing claim:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save billing claim';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.patientId) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="billing-claim-form-container">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Billing Claim' : 'New Billing Claim'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="billing-claim-form">
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
                disabled={isEditMode || Boolean(patientId)}
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
                disabled={isEditMode || Boolean(episodeId) || !formData.patientId}
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
              <label>Claim Type *</label>
              <select
                name="claimType"
                value={formData.claimType}
                onChange={handleChange}
                required
              >
                <option value="RAP">RAP (Request for Anticipated Payment)</option>
                <option value="FINAL">Final Claim</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>

            <div className="form-group">
              <label>Billing Date *</label>
              <input
                type="date"
                name="billingDate"
                value={formData.billingDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Service Information */}
        <div className="form-section">
          <h3>Service Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Service Date *</label>
              <input
                type="date"
                name="serviceDate"
                value={formData.serviceDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Service End Date</label>
              <input
                type="date"
                name="serviceEndDate"
                value={formData.serviceEndDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Service Code (CPT/HCPCS) *</label>
              <input
                type="text"
                name="serviceCode"
                value={formData.serviceCode}
                onChange={handleChange}
                required
                placeholder="e.g., G0151"
              />
            </div>

            <div className="form-group">
              <label>Service Description</label>
              <input
                type="text"
                name="serviceDescription"
                value={formData.serviceDescription}
                onChange={handleChange}
                placeholder="Service description"
              />
            </div>

            <div className="form-group">
              <label>Units (15-min increments) *</label>
              <input
                type="number"
                name="units"
                value={formData.units}
                onChange={handleChange}
                required
                min="1"
                placeholder="1"
              />
            </div>

            <div className="form-group">
              <label>Unit Rate ($) *</label>
              <input
                type="number"
                name="unitRate"
                value={formData.unitRate}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        <div className="form-section">
          <h3>Insurance Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Insurance</label>
              <select
                name="insuranceId"
                value={formData.insuranceId || ''}
                onChange={handleChange}
                disabled={!formData.patientId}
              >
                <option value="">Select Insurance</option>
                {insurances.map(insurance => (
                  <option key={insurance.id} value={insurance.id}>
                    {insurance.insuranceCompany} - {insurance.insuranceType}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Insurance Claim Number</label>
              <input
                type="text"
                name="insuranceClaimNumber"
                value={formData.insuranceClaimNumber || ''}
                onChange={handleChange}
                placeholder="Insurance claim number"
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="form-section">
          <h3>Financial Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Patient Responsibility ($)</label>
              <input
                type="number"
                name="patientResponsibility"
                value={formData.patientResponsibility}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Adjustment Amount ($)</label>
              <input
                type="number"
                name="adjustmentAmount"
                value={formData.adjustmentAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group full-width">
              <label>Adjustment Reason</label>
              <input
                type="text"
                name="adjustmentReason"
                value={formData.adjustmentReason || ''}
                onChange={handleChange}
                placeholder="Reason for adjustment"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <h3>Additional Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="PAID">Paid</option>
                <option value="DENIED">Denied</option>
                <option value="ADJUSTED">Adjusted</option>
                <option value="VOIDED">Voided</option>
              </select>
            </div>

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
            onClick={() => navigate('/billing/claims')}
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
            {loading ? 'Saving...' : 'Save Claim'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BillingClaimForm;

