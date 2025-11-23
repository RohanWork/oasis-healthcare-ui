import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { referralAPI } from '../services/referralAPI';
import { toast } from 'react-toastify';
import { Save, X, ArrowLeft } from 'lucide-react';
import './ReferralForm.css';

const ReferralForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Referral Information
    referralNumber: '',
    referralDate: new Date().toISOString().split('T')[0],
    referralSource: '',
    referralSourceContact: '',
    referralSourcePhone: '',
    referralSourceEmail: '',
    referralSourceFax: '',
    referralSourceAddress: '',
    referralSourceCity: '',
    referralSourceState: '',
    referralSourceZip: '',
    
    // Patient Demographics
    patientFirstName: '',
    patientMiddleName: '',
    patientLastName: '',
    patientDateOfBirth: '',
    patientGender: 'MALE',
    patientSsn: '',
    patientMaritalStatus: 'SINGLE',
    patientRace: '',
    patientEthnicity: '',
    patientLanguage: 'English',
    
    // Patient Contact
    patientPhoneNumber: '',
    patientMobileNumber: '',
    patientEmail: '',
    
    // Patient Address
    patientAddressLine1: '',
    patientAddressLine2: '',
    patientCity: '',
    patientState: '',
    patientZipCode: '',
    patientCounty: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    
    // Insurance/Payer Information
    primaryInsurance: '',
    primaryInsuranceId: '',
    primaryInsuranceGroup: '',
    primaryInsurancePhone: '',
    secondaryInsurance: '',
    secondaryInsuranceId: '',
    secondaryInsuranceGroup: '',
    medicaidNumber: '',
    medicareNumber: '',
    
    // Physician Information
    primaryPhysicianName: '',
    primaryPhysicianNpi: '',
    primaryPhysicianPhone: '',
    primaryPhysicianFax: '',
    primaryPhysicianAddress: '',
    primaryPhysicianCity: '',
    primaryPhysicianState: '',
    primaryPhysicianZip: '',
    referringPhysicianName: '',
    referringPhysicianNpi: '',
    referringPhysicianPhone: '',
    
    // Diagnosis Information
    primaryDiagnosis: '',
    primaryDiagnosisIcd10: '',
    primaryDiagnosisDescription: '',
    secondaryDiagnosis1: '',
    secondaryDiagnosis1Icd10: '',
    secondaryDiagnosis2: '',
    secondaryDiagnosis2Icd10: '',
    secondaryDiagnosis3: '',
    secondaryDiagnosis3Icd10: '',
    
    // Service Information
    serviceRequested: '',
    serviceStartDate: '',
    expectedFrequency: '',
    expectedDuration: '',
    specialInstructions: '',
    
    // Clinical Information
    allergies: '',
    currentMedications: '',
    medicalHistory: '',
    functionalLimitations: '',
    equipmentNeeds: '',
    
    // Status
    status: 'PENDING',
    notes: '',
  });

  useEffect(() => {
    if (isEditMode) {
      loadReferral();
    }
  }, [id]);

  const loadReferral = async () => {
    try {
      setLoading(true);
      const response = await referralAPI.getById(id);
      const referral = response.data;
      
      // Format dates for input fields
      setFormData({
        ...referral,
        referralDate: referral.referralDate ? referral.referralDate.split('T')[0] : '',
        patientDateOfBirth: referral.patientDateOfBirth ? referral.patientDateOfBirth.split('T')[0] : '',
        serviceStartDate: referral.serviceStartDate ? referral.serviceStartDate.split('T')[0] : '',
      });
    } catch (error) {
      console.error('Error loading referral:', error);
      toast.error('Failed to load referral');
      navigate('/referrals');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      if (isEditMode) {
        await referralAPI.update(id, formData);
        toast.success('Referral updated successfully');
      } else {
        await referralAPI.create(formData);
        toast.success('Referral created successfully');
      }
      navigate('/referrals');
    } catch (error) {
      console.error('Error saving referral:', error);
      toast.error(error.response?.data?.message || 'Failed to save referral');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="referral-form-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="referral-form-container">
      <div className="referral-form-header">
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/referrals')}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <h1>{isEditMode ? 'Edit Referral' : 'New Referral'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="referral-form">
        {/* Referral Information Section */}
        <div className="form-section">
          <h2>Referral Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Referral Number</label>
              <input
                type="text"
                value={formData.referralNumber}
                onChange={(e) => handleInputChange('referralNumber', e.target.value)}
                placeholder="Auto-generated if empty"
              />
            </div>
            <div className="form-group">
              <label>Referral Date *</label>
              <input
                type="date"
                value={formData.referralDate}
                onChange={(e) => handleInputChange('referralDate', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="PENDING">Pending</option>
                <option value="ADMITTED">Admitted</option>
                <option value="DECLINED">Declined</option>
              </select>
            </div>
          </div>
        </div>

        {/* Referral Source Section */}
        <div className="form-section">
          <h2>Referral Source</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Referral Source *</label>
              <input
                type="text"
                value={formData.referralSource}
                onChange={(e) => handleInputChange('referralSource', e.target.value)}
                placeholder="Hospital, Physician, etc."
                required
              />
            </div>
            <div className="form-group">
              <label>Contact Name</label>
              <input
                type="text"
                value={formData.referralSourceContact}
                onChange={(e) => handleInputChange('referralSourceContact', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.referralSourcePhone}
                onChange={(e) => handleInputChange('referralSourcePhone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.referralSourceEmail}
                onChange={(e) => handleInputChange('referralSourceEmail', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Fax</label>
              <input
                type="tel"
                value={formData.referralSourceFax}
                onChange={(e) => handleInputChange('referralSourceFax', e.target.value)}
              />
            </div>
            <div className="form-group full-width">
              <label>Address</label>
              <input
                type="text"
                value={formData.referralSourceAddress}
                onChange={(e) => handleInputChange('referralSourceAddress', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.referralSourceCity}
                onChange={(e) => handleInputChange('referralSourceCity', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                value={formData.referralSourceState}
                onChange={(e) => handleInputChange('referralSourceState', e.target.value)}
                maxLength={2}
              />
            </div>
            <div className="form-group">
              <label>Zip Code</label>
              <input
                type="text"
                value={formData.referralSourceZip}
                onChange={(e) => handleInputChange('referralSourceZip', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Patient Demographics Section */}
        <div className="form-section">
          <h2>Patient Demographics</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                value={formData.patientFirstName}
                onChange={(e) => handleInputChange('patientFirstName', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Middle Name</label>
              <input
                type="text"
                value={formData.patientMiddleName}
                onChange={(e) => handleInputChange('patientMiddleName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                value={formData.patientLastName}
                onChange={(e) => handleInputChange('patientLastName', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                value={formData.patientDateOfBirth}
                onChange={(e) => handleInputChange('patientDateOfBirth', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Gender *</label>
              <select
                value={formData.patientGender}
                onChange={(e) => handleInputChange('patientGender', e.target.value)}
                required
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>SSN</label>
              <input
                type="text"
                value={formData.patientSsn}
                onChange={(e) => handleInputChange('patientSsn', e.target.value)}
                placeholder="XXX-XX-XXXX"
              />
            </div>
            <div className="form-group">
              <label>Marital Status</label>
              <select
                value={formData.patientMaritalStatus}
                onChange={(e) => handleInputChange('patientMaritalStatus', e.target.value)}
              >
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
                <option value="SEPARATED">Separated</option>
              </select>
            </div>
            <div className="form-group">
              <label>Language</label>
              <input
                type="text"
                value={formData.patientLanguage}
                onChange={(e) => handleInputChange('patientLanguage', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Patient Contact Section */}
        <div className="form-section">
          <h2>Patient Contact Information</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Address Line 1</label>
              <input
                type="text"
                value={formData.patientAddressLine1}
                onChange={(e) => handleInputChange('patientAddressLine1', e.target.value)}
              />
            </div>
            <div className="form-group full-width">
              <label>Address Line 2</label>
              <input
                type="text"
                value={formData.patientAddressLine2}
                onChange={(e) => handleInputChange('patientAddressLine2', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.patientCity}
                onChange={(e) => handleInputChange('patientCity', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                value={formData.patientState}
                onChange={(e) => handleInputChange('patientState', e.target.value)}
                maxLength={2}
              />
            </div>
            <div className="form-group">
              <label>Zip Code</label>
              <input
                type="text"
                value={formData.patientZipCode}
                onChange={(e) => handleInputChange('patientZipCode', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>County</label>
              <input
                type="text"
                value={formData.patientCounty}
                onChange={(e) => handleInputChange('patientCounty', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={formData.patientPhoneNumber}
                onChange={(e) => handleInputChange('patientPhoneNumber', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                value={formData.patientMobileNumber}
                onChange={(e) => handleInputChange('patientMobileNumber', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.patientEmail}
                onChange={(e) => handleInputChange('patientEmail', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="form-section">
          <h2>Emergency Contact</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Contact Name</label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Relationship</label>
              <input
                type="text"
                value={formData.emergencyContactRelationship}
                onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Insurance/Payer Section */}
        <div className="form-section">
          <h2>Insurance/Payer Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Primary Insurance</label>
              <input
                type="text"
                value={formData.primaryInsurance}
                onChange={(e) => handleInputChange('primaryInsurance', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Primary Insurance ID</label>
              <input
                type="text"
                value={formData.primaryInsuranceId}
                onChange={(e) => handleInputChange('primaryInsuranceId', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Medicare Number</label>
              <input
                type="text"
                value={formData.medicareNumber}
                onChange={(e) => handleInputChange('medicareNumber', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Medicaid Number</label>
              <input
                type="text"
                value={formData.medicaidNumber}
                onChange={(e) => handleInputChange('medicaidNumber', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Secondary Insurance</label>
              <input
                type="text"
                value={formData.secondaryInsurance}
                onChange={(e) => handleInputChange('secondaryInsurance', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Secondary Insurance ID</label>
              <input
                type="text"
                value={formData.secondaryInsuranceId}
                onChange={(e) => handleInputChange('secondaryInsuranceId', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Physician Information Section */}
        <div className="form-section">
          <h2>Physician Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Primary Physician Name</label>
              <input
                type="text"
                value={formData.primaryPhysicianName}
                onChange={(e) => handleInputChange('primaryPhysicianName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Primary Physician NPI</label>
              <input
                type="text"
                value={formData.primaryPhysicianNpi}
                onChange={(e) => handleInputChange('primaryPhysicianNpi', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Primary Physician Phone</label>
              <input
                type="tel"
                value={formData.primaryPhysicianPhone}
                onChange={(e) => handleInputChange('primaryPhysicianPhone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Referring Physician Name</label>
              <input
                type="text"
                value={formData.referringPhysicianName}
                onChange={(e) => handleInputChange('referringPhysicianName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Referring Physician NPI</label>
              <input
                type="text"
                value={formData.referringPhysicianNpi}
                onChange={(e) => handleInputChange('referringPhysicianNpi', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Referring Physician Phone</label>
              <input
                type="tel"
                value={formData.referringPhysicianPhone}
                onChange={(e) => handleInputChange('referringPhysicianPhone', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Diagnosis Information Section */}
        <div className="form-section">
          <h2>Diagnosis Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Primary Diagnosis</label>
              <input
                type="text"
                value={formData.primaryDiagnosis}
                onChange={(e) => handleInputChange('primaryDiagnosis', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Primary Diagnosis ICD-10</label>
              <input
                type="text"
                value={formData.primaryDiagnosisIcd10}
                onChange={(e) => handleInputChange('primaryDiagnosisIcd10', e.target.value)}
              />
            </div>
            <div className="form-group full-width">
              <label>Primary Diagnosis Description</label>
              <textarea
                value={formData.primaryDiagnosisDescription}
                onChange={(e) => handleInputChange('primaryDiagnosisDescription', e.target.value)}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Secondary Diagnosis 1</label>
              <input
                type="text"
                value={formData.secondaryDiagnosis1}
                onChange={(e) => handleInputChange('secondaryDiagnosis1', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Secondary Diagnosis 1 ICD-10</label>
              <input
                type="text"
                value={formData.secondaryDiagnosis1Icd10}
                onChange={(e) => handleInputChange('secondaryDiagnosis1Icd10', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Secondary Diagnosis 2</label>
              <input
                type="text"
                value={formData.secondaryDiagnosis2}
                onChange={(e) => handleInputChange('secondaryDiagnosis2', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Secondary Diagnosis 2 ICD-10</label>
              <input
                type="text"
                value={formData.secondaryDiagnosis2Icd10}
                onChange={(e) => handleInputChange('secondaryDiagnosis2Icd10', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Secondary Diagnosis 3</label>
              <input
                type="text"
                value={formData.secondaryDiagnosis3}
                onChange={(e) => handleInputChange('secondaryDiagnosis3', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Secondary Diagnosis 3 ICD-10</label>
              <input
                type="text"
                value={formData.secondaryDiagnosis3Icd10}
                onChange={(e) => handleInputChange('secondaryDiagnosis3Icd10', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Service Information Section */}
        <div className="form-section">
          <h2>Service Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Service Requested</label>
              <select
                value={formData.serviceRequested}
                onChange={(e) => handleInputChange('serviceRequested', e.target.value)}
              >
                <option value="">Select Service</option>
                <option value="HOME_HEALTH">Home Health</option>
                <option value="HOSPICE">Hospice</option>
                <option value="PERSONAL_CARE">Personal Care</option>
                <option value="THERAPY">Therapy</option>
              </select>
            </div>
            <div className="form-group">
              <label>Service Start Date</label>
              <input
                type="date"
                value={formData.serviceStartDate}
                onChange={(e) => handleInputChange('serviceStartDate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Expected Frequency</label>
              <input
                type="text"
                value={formData.expectedFrequency}
                onChange={(e) => handleInputChange('expectedFrequency', e.target.value)}
                placeholder="e.g., 3x/week"
              />
            </div>
            <div className="form-group">
              <label>Expected Duration</label>
              <input
                type="text"
                value={formData.expectedDuration}
                onChange={(e) => handleInputChange('expectedDuration', e.target.value)}
                placeholder="e.g., 60 days"
              />
            </div>
            <div className="form-group full-width">
              <label>Special Instructions</label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Clinical Information Section */}
        <div className="form-section">
          <h2>Clinical Information</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Allergies</label>
              <textarea
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                rows={2}
              />
            </div>
            <div className="form-group full-width">
              <label>Current Medications</label>
              <textarea
                value={formData.currentMedications}
                onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                rows={3}
              />
            </div>
            <div className="form-group full-width">
              <label>Medical History</label>
              <textarea
                value={formData.medicalHistory}
                onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                rows={3}
              />
            </div>
            <div className="form-group full-width">
              <label>Functional Limitations</label>
              <textarea
                value={formData.functionalLimitations}
                onChange={(e) => handleInputChange('functionalLimitations', e.target.value)}
                rows={2}
              />
            </div>
            <div className="form-group full-width">
              <label>Equipment Needs</label>
              <textarea
                value={formData.equipmentNeeds}
                onChange={(e) => handleInputChange('equipmentNeeds', e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="form-section">
          <h2>Additional Notes</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                placeholder="Additional notes or comments..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/referrals')}
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
            {loading ? 'Saving...' : 'Save Referral'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReferralForm;

