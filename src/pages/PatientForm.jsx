import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientAPI } from '../services/patientAPI';
import { userAPI } from '../services/userAPI';
import { User, Save, X, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import './PatientForm.css';

const PatientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [clinicians, setClinicians] = useState([]);
  const [loadingClinicians, setLoadingClinicians] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    ssn: '',
    maritalStatus: 'SINGLE',
    race: '',
    ethnicity: '',
    language: 'English',
    
    // Contact Information
    phoneNumber: '',
    mobileNumber: '',
    email: '',
    
    // Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    county: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    
    // Physician Information
    primaryPhysicianName: '',
    primaryPhysicianPhone: '',
    primaryPhysicianNpi: '',
    
    // Referral Information
    referralSource: '',
    referralDate: '',
    referralDiagnosis: '',
    
    // Admission Information
    admissionDate: '',
    admittingClinicianId: null,
    
    // Status
    status: 'PENDING',
    statusReason: '',
    
    // Clinical Information
    allergies: '',
    medications: '',
    medicalHistory: '',
    specialInstructions: '',
  });

  useEffect(() => {
    loadClinicians();
    if (isEditMode) {
      loadPatient();
    }
  }, [id]);

  const loadClinicians = async () => {
    try {
      setLoadingClinicians(true);
      const response = await userAPI.getClinicians();
      setClinicians(response.data || []);
    } catch (error) {
      console.error('Error loading clinicians:', error);
      // Don't show error toast - this is not critical for form submission
    } finally {
      setLoadingClinicians(false);
    }
  };

  const loadPatient = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getById(id);
      const patient = response.data;
      
      // Format dates for input fields
      setFormData({
        ...patient,
        dateOfBirth: patient.dateOfBirth || '',
        referralDate: patient.referralDate || '',
        admissionDate: patient.admissionDate || '',
      });
    } catch (error) {
      console.error('Error loading patient:', error);
      toast.error('Failed to load patient');
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  // Format phone numbers as XXX-XXX-XXXX (exactly 10 digits)
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    // Only format if we have exactly 10 digits
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    if (cleaned.length <= 10) return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    // If more than 10 digits, truncate to 10
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Format SSN as XXX-XX-XXXX
  const formatSSN = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
  };

  // Format NPI (exactly 10 digits, no formatting)
  const formatNPI = (value) => {
    const cleaned = value.replace(/\D/g, '');
    // NPI must be exactly 10 digits
    return cleaned.slice(0, 10);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Auto-format phone numbers
    if (name === 'phoneNumber' || name === 'mobileNumber' || name === 'emergencyContactPhone' || name === 'primaryPhysicianPhone') {
      formattedValue = formatPhoneNumber(value);
    }

    // Auto-format SSN
    if (name === 'ssn') {
      formattedValue = formatSSN(value);
    }

    // Auto-format NPI (exactly 10 digits)
    if (name === 'primaryPhysicianNpi') {
      formattedValue = formatNPI(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.firstName?.trim()) errors.push('First name is required');
    if (!formData.lastName?.trim()) errors.push('Last name is required');
    if (!formData.dateOfBirth) errors.push('Date of birth is required');
    if (!formData.addressLine1?.trim()) errors.push('Address is required');
    if (!formData.city?.trim()) errors.push('City is required');
    if (!formData.state?.trim()) errors.push('State is required');
    if (!formData.zipCode?.trim()) errors.push('Zip code is required');
    if (!formData.status) errors.push('Status is required');

    // Validate phone numbers (if provided, must be exactly 10 digits in format XXX-XXX-XXXX)
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      errors.push('Phone number must be exactly 10 digits in format XXX-XXX-XXXX');
    }
    if (formData.mobileNumber && !phoneRegex.test(formData.mobileNumber)) {
      errors.push('Mobile number must be exactly 10 digits in format XXX-XXX-XXXX');
    }
    if (formData.emergencyContactPhone && !phoneRegex.test(formData.emergencyContactPhone)) {
      errors.push('Emergency contact phone must be exactly 10 digits in format XXX-XXX-XXXX');
    }
    if (formData.primaryPhysicianPhone && !phoneRegex.test(formData.primaryPhysicianPhone)) {
      errors.push('Primary physician phone must be exactly 10 digits in format XXX-XXX-XXXX');
    }

    // Validate NPI (if provided, must be exactly 10 digits)
    if (formData.primaryPhysicianNpi && formData.primaryPhysicianNpi.replace(/\D/g, '').length !== 10) {
      errors.push('NPI Number must be exactly 10 digits');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);

    try {
      // Prepare data - remove empty strings for optional fields
      const dataToSend = { ...formData };
      
      // Convert empty strings to null for optional fields
      // Keep required fields as-is (they should have values)
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '') {
          // Optional fields can be null
          dataToSend[key] = null;
        }
      });
      
      // Clean up incomplete phone numbers (less than 10 digits) - set to null
      const phoneFields = ['phoneNumber', 'mobileNumber', 'emergencyContactPhone', 'primaryPhysicianPhone'];
      phoneFields.forEach(field => {
        if (dataToSend[field]) {
          const digitsOnly = dataToSend[field].replace(/\D/g, '');
          if (digitsOnly.length < 10) {
            // Incomplete phone number - set to null
            dataToSend[field] = null;
          }
        }
      });
      
      // Ensure dates are in correct format (YYYY-MM-DD)
      // HTML date inputs already provide this format, but double-check
      if (dataToSend.dateOfBirth && dataToSend.dateOfBirth.length === 10) {
        // Already in YYYY-MM-DD format from date input
      }
      
      console.log('Sending patient data:', JSON.stringify(dataToSend, null, 2));

      if (isEditMode) {
        await patientAPI.update(id, dataToSend);
        toast.success('Patient updated successfully');
      } else {
        await patientAPI.create(dataToSend);
        
        // Show success notification with OASIS task info
        toast.success(
          <div>
            <strong>Patient created successfully! 🎉</strong>
            <br />
            <small>Initial episode and OASIS assessment task have been created automatically.</small>
            <br />
            <small>Next step: Start OASIS Assessment (SOC)</small>
          </div>,
          {
            autoClose: 5000,
            position: "top-right",
          }
        );
      }
      navigate('/patients');
    } catch (error) {
      console.error('Error saving patient:', error);
      console.error('Full error response:', JSON.stringify(error.response?.data, null, 2));
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(field => {
          // Convert field names to user-friendly labels
          const fieldLabel = field
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
          toast.error(`${fieldLabel}: ${errors[field]}`);
        });
      } else if (error.response?.data?.message) {
        // Show user-friendly error message from backend
        toast.error(error.response.data.message);
      } else if (error.response?.data?.error) {
        toast.error(`${error.response.data.error}: ${error.response.data.message || 'Validation failed'}`);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save patient. Please check all required fields and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="page-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-left">
          <User size={32} className="page-icon" />
          <div>
            <h1 className="page-title">
              {isEditMode ? 'Edit Patient' : 'Add New Patient'}
            </h1>
            <p className="page-subtitle">
              {isEditMode ? 'Update patient information' : 'Enter patient details'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="patient-form">
        {/* Personal Information */}
        <div className="form-section">
          <h2 className="section-title">Personal Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="form-input"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">SSN</label>
              <input
                type="text"
                name="ssn"
                value={formData.ssn}
                onChange={handleChange}
                className="form-input"
                placeholder="XXX-XX-XXXX"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Marital Status</label>
              <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleChange}
                className="form-input"
              >
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Language</label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h2 className="section-title">Contact Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="XXX-XXX-XXXX"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="XXX-XXX-XXXX"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="form-section">
          <h2 className="section-title">Address</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">Address Line 1 *</label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Address Line 2</label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="form-input"
                maxLength="2"
                placeholder="NY"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Zip Code *</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="form-input"
                placeholder="XXXXX"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">County</label>
              <input
                type="text"
                name="county"
                value={formData.county}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="form-section">
          <h2 className="section-title">Emergency Contact</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Contact Name</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Relationship</label>
              <input
                type="text"
                name="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                className="form-input"
                placeholder="XXX-XXX-XXXX"
              />
            </div>
          </div>
        </div>

        {/* Physician Information */}
        <div className="form-section">
          <h2 className="section-title">Primary Physician</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Physician Name</label>
              <input
                type="text"
                name="primaryPhysicianName"
                value={formData.primaryPhysicianName}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="primaryPhysicianPhone"
                value={formData.primaryPhysicianPhone}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">NPI Number</label>
              <input
                type="text"
                name="primaryPhysicianNpi"
                value={formData.primaryPhysicianNpi}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Referral Information */}
        <div className="form-section">
          <h2 className="section-title">Referral Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Referral Source</label>
              <input
                type="text"
                name="referralSource"
                value={formData.referralSource}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Referral Date</label>
              <input
                type="date"
                name="referralDate"
                value={formData.referralDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Referral Diagnosis</label>
              <textarea
                name="referralDiagnosis"
                value={formData.referralDiagnosis}
                onChange={handleChange}
                className="form-input"
                rows="2"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="form-section">
          <h2 className="section-title">Status</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="DISCHARGED">Discharged</option>
                <option value="DECEASED">Deceased</option>
                <option value="TRANSFERRED">Transferred</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Admission Date</label>
              <input
                type="date"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Admitting Clinician (RN/PT/OT)</label>
              <select
                name="admittingClinicianId"
                value={formData.admittingClinicianId || ''}
                onChange={(e) => setFormData({ ...formData, admittingClinicianId: e.target.value ? parseInt(e.target.value) : null })}
                className="form-input"
              >
                <option value="">Select Clinician...</option>
                {loadingClinicians ? (
                  <option disabled>Loading clinicians...</option>
                ) : (
                  clinicians.map((clinician) => {
                    const roleNames = clinician.roles?.map(r => r.roleName || r.displayName).join(', ') || 'Clinician';
                    return (
                      <option key={clinician.id} value={clinician.id}>
                        {clinician.fullName || `${clinician.firstName} ${clinician.lastName}`} ({roleNames})
                      </option>
                    );
                  })
                )}
              </select>
              {clinicians.length === 0 && !loadingClinicians && (
                <small className="form-hint">No clinicians found in this organization. Please create RN/PT/OT users first.</small>
              )}
            </div>

            <div className="form-group full-width">
              <label className="form-label">Status Reason</label>
              <textarea
                name="statusReason"
                value={formData.statusReason}
                onChange={handleChange}
                className="form-input"
                rows="2"
              />
            </div>
          </div>
        </div>

        {/* Clinical Information */}
        <div className="form-section">
          <h2 className="section-title">Clinical Information</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">Allergies</label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                className="form-input"
                rows="2"
                placeholder="List any known allergies..."
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Current Medications</label>
              <textarea
                name="medications"
                value={formData.medications}
                onChange={handleChange}
                className="form-input"
                rows="3"
                placeholder="List current medications..."
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Medical History</label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleChange}
                className="form-input"
                rows="3"
                placeholder="Brief medical history..."
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Special Instructions</label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                className="form-input"
                rows="2"
                placeholder="Any special instructions or notes..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/patients')}
            disabled={loading}
          >
            <X size={20} />
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                {isEditMode ? 'Update Patient' : 'Create Patient'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;

