import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getOasisAssessment,
  createOasisAssessment,
  updateOasisAssessment,
  autoSaveOasisAssessment,
  submitOasisForQA
} from '../services/oasisAPI';
import { patientAPI } from '../services/patientAPI';
import './OasisForm.css';

const OasisForm = () => {
  const { id, patientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState(null);
  const [activeSection, setActiveSection] = useState('section1');
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimerRef = useRef(null);

  // Form data state
  const [formData, setFormData] = useState({
    patientId: patientId,
    assessmentType: 'SOC',
    assessmentDate: new Date().toISOString().split('T')[0],
    
    // Section 1: Administrative
    m0010CmsCertNumber: '',
    m0014BranchState: '',
    m0016BranchId: '',
    m0018Npi: '',
    m0020PatientId: '',
    m0030SocDate: '',
    m0032RocDate: '',
    m0063MedicareNumber: '',
    m0064Ssn: '',
    m0065MedicaidNumber: '',
    m0069Gender: '',
    m0140RaceEthnicity: '',
    
    // Section 2: Patient History & Diagnoses
    m1000InpatientFacility: '',
    m1005InpatientDischargeDate: '',
    m1011InpatientDiagnosis: '',
    m1017DiagnosisChange: '',
    m1021PrimaryDiagnosisIcd: '',
    m1021PrimaryDiagnosisDesc: '',
    m1023OtherDiagnosis1Icd: '',
    m1023OtherDiagnosis2Icd: '',
    m1023OtherDiagnosis3Icd: '',
    m1023OtherDiagnosis4Icd: '',
    m1023OtherDiagnosis5Icd: '',
    m1028ActiveDiagnoses: '',
    
    // Section 3: Living Arrangements
    m1100LivingSituation: '',
    
    // Section 4: Sensory Status
    m1200Vision: '',
    m1242Hearing: '',
    
    // Section 5: Integumentary Status
    m1306PressureUlcer: '',
    m1307OldestStage2Date: '',
    m1308Stage1Count: '',
    m1308Stage2Count: '',
    m1308Stage3Count: '',
    m1308Stage4Count: '',
    m1308UnstageableCount: '',
    m1320PressureUlcerStatus: '',
    m1330StasisUlcer: '',
    m1332StasisUlcerCount: '',
    m1334StasisUlcerStatus: '',
    m1340SurgicalWound: '',
    m1342SurgicalWoundStatus: '',
    
    // Section 6: Respiratory Status
    m1400Dyspnea: '',
    m1410RespiratoryTreatments: '',
    
    // Section 7: Cardiac Status
    m1500HeartFailureSymptoms: '',
    
    // Section 8: Elimination Status
    m1600UtiTreatment: '',
    m1610UrinaryIncontinence: '',
    m1615IncontinenceTiming: '',
    m1620BowelIncontinence: '',
    m1630Ostomy: '',
    
    // Section 9: Neurological/Emotional/Behavioral
    m1700CognitiveFunctioning: '',
    m1710WhenConfused: '',
    m1720WhenAnxious: '',
    m1730DepressionScreening: '',
    m1740PsychiatricSymptoms: '',
    m1745DisruptiveBehaviorFreq: '',
    
    // Section 15: Patient Mood (PHQ-2 to PHQ-9)
    d0150Phq2Interest: '',
    d0150Phq2Depressed: '',
    d0150Phq9Q3: '',
    d0150Phq9Q4: '',
    d0150Phq9Q5: '',
    d0150Phq9Q6: '',
    d0150Phq9Q7: '',
    d0150Phq9Q8: '',
    d0150Phq9Q9: '',
    d0160Phq9TotalScore: null,
    
    // Section 11: Medications
    m2001DrugRegimenReview: '',
    m2003MedicationFollowup: '',
    m2005MedicationIntervention: '',
    m2010HighRiskDrugEducation: '',
    m2015DrugEducationIntervention: '',
    m2020OralMedicationManagement: '',
    m2030InjectableMedicationMgmt: '',
    m2040PriorMedicationMgmt: '',
    
    // Section 13: Emergent Care
    m2310EmergentCare: '',
    m2410EmergentCareReason: '',
    
    // Section 14: COVID-19 Vaccination
    o0350CovidVaccination: '',
    
    // Section 16: Immunization
    m1041InfluenzaVaccinePeriod: '',
    m1046InfluenzaVaccineReceived: '',
    m1051PneumococcalVaccine: '',
  });

  // Section definitions with functional names
  const sections = [
    { id: 'section1', name: 'Administrative & Demographic', icon: '📋' },
    { id: 'section2', name: 'Patient History & Diagnoses', icon: '🏥' },
    { id: 'section3', name: 'Living Arrangements', icon: '🏠' },
    { id: 'section4', name: 'Sensory Status', icon: '👁️' },
    { id: 'section5', name: 'Integumentary Status', icon: '🩹' },
    { id: 'section6', name: 'Respiratory Status', icon: '🫁' },
    { id: 'section7', name: 'Cardiac Status', icon: '❤️' },
    { id: 'section8', name: 'Elimination Status', icon: '🚽' },
    { id: 'section9', name: 'Neurological/Emotional/Behavioral', icon: '🧠' },
    { id: 'section10', name: 'Functional Abilities (ADL/IADL)', icon: '🚶' },
    { id: 'section11', name: 'Medications', icon: '💊' },
    { id: 'section12', name: 'Care Management', icon: '🤝' },
    { id: 'section13', name: 'Emergent Care', icon: '🚑' },
    { id: 'section14', name: 'COVID-19 Vaccination', icon: '💉' },
    { id: 'section15', name: 'Patient Mood Assessment (PHQ)', icon: '😊' },
    { id: 'section16', name: 'Immunization', icon: '💉' },
    { id: 'section17', name: 'Discharge Planning', icon: '🏁' },
  ];

  // Calculate completion percentage
  const calculateCompletion = () => {
    const totalFields = Object.keys(formData).length;
    const filledFields = Object.values(formData).filter(val => 
      val !== '' && val !== null && val !== undefined
    ).length;
    return Math.round((filledFields / totalFields) * 100);
  };

  // Skip logic calculations
  const shouldSkipM1005 = () => formData.m1000InpatientFacility === 'NA';
  const shouldSkipPressureUlcerDetails = () => formData.m1306PressureUlcer === '0';
  const shouldSkipStasisUlcerDetails = () => formData.m1330StasisUlcer === '0';
  const shouldSkipSurgicalWoundDetails = () => formData.m1340SurgicalWound === '0';
  const shouldSkipIncontinenceTiming = () => formData.m1610UrinaryIncontinence === '0';
  const shouldSkipEmergentCareReason = () => formData.m2310EmergentCare === '0';
  
  const calculatePhq2Score = () => {
    const interest = parseInt(formData.d0150Phq2Interest) || 0;
    const depressed = parseInt(formData.d0150Phq2Depressed) || 0;
    return interest + depressed;
  };
  
  const shouldSkipPhq9 = () => calculatePhq2Score() < 3;

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load patient data
        const patientResponse = await patientAPI.getById(patientId);
        setPatient(patientResponse.data);
        
        // If editing existing assessment, load it
        if (id) {
          const assessmentData = await getOasisAssessment(id);
          setFormData(assessmentData);
          setLastSaved(assessmentData.lastAutoSaved);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, patientId]);

  // Auto-save timer (15 seconds)
  useEffect(() => {
    if (id && !loading) {
      autoSaveTimerRef.current = setInterval(() => {
        handleAutoSave();
      }, 15000); // 15 seconds
      
      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [id, formData, loading]);

  // Auto-save function
  const handleAutoSave = async () => {
    if (!id) return; // Don't auto-save if not yet created
    
    try {
      const result = await autoSaveOasisAssessment(id, formData);
      setLastSaved(new Date());
      console.log('Auto-saved successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Manual save
  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (id) {
        // Update existing
        const result = await updateOasisAssessment(id, formData);
        setLastSaved(new Date());
        alert('Assessment saved successfully!');
      } else {
        // Create new
        const result = await createOasisAssessment(formData);
        alert('Assessment created successfully!');
        navigate(`/oasis/edit/${result.id}/${patientId}`);
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      console.error('Full error response:', JSON.stringify(error.response?.data, null, 2));
      
      let errorMessage = 'Error saving assessment';
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.keys(errors).map(field => `${field}: ${errors[field]}`).join('\n');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = `${error.response.data.error}: ${error.response.data.message || 'Validation failed'}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Submit for QA
  const handleSubmit = async () => {
    if (!id) {
      alert('Please save the assessment first');
      return;
    }
    
    const completion = calculateCompletion();
    if (completion < 100) {
      alert(`Assessment is only ${completion}% complete. Please complete all required fields before submitting.`);
      return;
    }
    
    if (window.confirm('Are you sure you want to submit this assessment for QA review?')) {
      try {
        await submitOasisForQA(id);
        alert('Assessment submitted for QA review successfully!');
        navigate('/oasis/list');
      } catch (error) {
        console.error('Error submitting assessment:', error);
        alert('Error submitting assessment: ' + error.message);
      }
    }
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Apply skip logic - clear skipped fields
      if (field === 'm1000InpatientFacility' && value === 'NA') {
        updated.m1005InpatientDischargeDate = '';
      }
      
      if (field === 'm1306PressureUlcer' && value === '0') {
        updated.m1307OldestStage2Date = '';
        updated.m1308Stage1Count = '';
        updated.m1308Stage2Count = '';
        updated.m1308Stage3Count = '';
        updated.m1308Stage4Count = '';
        updated.m1308UnstageableCount = '';
        updated.m1320PressureUlcerStatus = '';
      }
      
      if (field === 'm1330StasisUlcer' && value === '0') {
        updated.m1332StasisUlcerCount = '';
        updated.m1334StasisUlcerStatus = '';
      }
      
      if (field === 'm1340SurgicalWound' && value === '0') {
        updated.m1342SurgicalWoundStatus = '';
      }
      
      if (field === 'm1610UrinaryIncontinence' && value === '0') {
        updated.m1615IncontinenceTiming = '';
      }
      
      if (field === 'm2310EmergentCare' && value === '0') {
        updated.m2410EmergentCareReason = '';
      }
      
      // PHQ-2 to PHQ-9 skip logic
      if (field === 'd0150Phq2Interest' || field === 'd0150Phq2Depressed') {
        const interest = field === 'd0150Phq2Interest' ? parseInt(value) || 0 : parseInt(updated.d0150Phq2Interest) || 0;
        const depressed = field === 'd0150Phq2Depressed' ? parseInt(value) || 0 : parseInt(updated.d0150Phq2Depressed) || 0;
        
        if ((interest + depressed) < 3) {
          // Clear PHQ-9 fields
          updated.d0150Phq9Q3 = '';
          updated.d0150Phq9Q4 = '';
          updated.d0150Phq9Q5 = '';
          updated.d0150Phq9Q6 = '';
          updated.d0150Phq9Q7 = '';
          updated.d0150Phq9Q8 = '';
          updated.d0150Phq9Q9 = '';
          updated.d0160Phq9TotalScore = null;
        }
      }
      
      return updated;
    });
  };

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return 'Never';
    const date = new Date(lastSaved);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'section1':
        return renderSection1();
      case 'section2':
        return renderSection2();
      case 'section3':
        return renderSection3();
      case 'section4':
        return renderSection4();
      case 'section5':
        return renderSection5();
      case 'section6':
        return renderSection6();
      case 'section7':
        return renderSection7();
      case 'section8':
        return renderSection8();
      case 'section9':
        return renderSection9();
      case 'section11':
        return renderSection11();
      case 'section13':
        return renderSection13();
      case 'section14':
        return renderSection14();
      case 'section15':
        return renderSection15();
      case 'section16':
        return renderSection16();
      default:
        return <div className="section-placeholder">Section under construction</div>;
    }
  };

  // Section 1: Administrative & Demographic
  const renderSection1 = () => (
    <div className="form-section">
      <h2>Section 1: Administrative & Demographic</h2>
      
      <div className="form-row">
        <div className="form-group">
          <label>M0010 - CMS Certification Number</label>
          <input
            type="text"
            value={formData.m0010CmsCertNumber}
            onChange={(e) => handleInputChange('m0010CmsCertNumber', e.target.value)}
            maxLength="12"
          />
        </div>
        
        <div className="form-group">
          <label>M0014 - Branch State</label>
          <input
            type="text"
            value={formData.m0014BranchState}
            onChange={(e) => handleInputChange('m0014BranchState', e.target.value)}
            maxLength="2"
            placeholder="e.g., CA, NY"
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>M0016 - Branch ID</label>
          <input
            type="text"
            value={formData.m0016BranchId}
            onChange={(e) => handleInputChange('m0016BranchId', e.target.value)}
            maxLength="10"
          />
        </div>
        
        <div className="form-group">
          <label>M0018 - National Provider Identifier (NPI)</label>
          <input
            type="text"
            value={formData.m0018Npi}
            onChange={(e) => handleInputChange('m0018Npi', e.target.value)}
            maxLength="10"
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>M0020 - Patient ID Number</label>
          <input
            type="text"
            value={formData.m0020PatientId}
            onChange={(e) => handleInputChange('m0020PatientId', e.target.value)}
            maxLength="20"
          />
        </div>
        
        <div className="form-group">
          <label>M0030 - Start of Care Date</label>
          <input
            type="date"
            value={formData.m0030SocDate}
            onChange={(e) => handleInputChange('m0030SocDate', e.target.value)}
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>M0063 - Medicare Number</label>
          <input
            type="text"
            value={formData.m0063MedicareNumber}
            onChange={(e) => handleInputChange('m0063MedicareNumber', e.target.value)}
            maxLength="20"
          />
        </div>
        
        <div className="form-group">
          <label>M0064 - Social Security Number</label>
          <input
            type="text"
            value={formData.m0064Ssn}
            onChange={(e) => handleInputChange('m0064Ssn', e.target.value)}
            maxLength="11"
            placeholder="XXX-XX-XXXX"
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>M0065 - Medicaid Number</label>
          <input
            type="text"
            value={formData.m0065MedicaidNumber}
            onChange={(e) => handleInputChange('m0065MedicaidNumber', e.target.value)}
            maxLength="20"
          />
        </div>
        
        <div className="form-group">
          <label>M0069 - Gender</label>
          <select
            value={formData.m0069Gender}
            onChange={(e) => handleInputChange('m0069Gender', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label>M0140 - Race/Ethnicity</label>
        <select
          value={formData.m0140RaceEthnicity}
          onChange={(e) => handleInputChange('m0140RaceEthnicity', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="HISPANIC">Hispanic or Latino</option>
          <option value="WHITE">White</option>
          <option value="BLACK">Black or African American</option>
          <option value="ASIAN">Asian</option>
          <option value="NATIVE">American Indian or Alaska Native</option>
          <option value="PACIFIC">Native Hawaiian or Pacific Islander</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
    </div>
  );

  // Section 2: Patient History & Diagnoses
  const renderSection2 = () => (
    <div className="form-section">
      <h2>Section 2: Patient History & Diagnoses</h2>
      
      <div className="form-group">
        <label>M1000 - Inpatient Facility Discharge (past 14 days)</label>
        <select
          value={formData.m1000InpatientFacility}
          onChange={(e) => handleInputChange('m1000InpatientFacility', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="1">Long-term nursing facility</option>
          <option value="2">Short-term general hospital</option>
          <option value="3">Inpatient rehabilitation facility</option>
          <option value="4">Psychiatric hospital or unit</option>
          <option value="5">Other (specify)</option>
          <option value="NA">Patient not discharged from inpatient facility</option>
          <option value="UK">Unknown</option>
        </select>
      </div>
      
      {!shouldSkipM1005() && (
        <div className="form-group">
          <label>M1005 - Inpatient Discharge Date</label>
          <input
            type="date"
            value={formData.m1005InpatientDischargeDate}
            onChange={(e) => handleInputChange('m1005InpatientDischargeDate', e.target.value)}
          />
        </div>
      )}
      
      {shouldSkipM1005() && (
        <div className="skip-indicator">
          <span className="skip-badge">⏭️ SKIPPED</span>
          <span>M1005 is skipped because patient was not discharged from inpatient facility</span>
        </div>
      )}
      
      <div className="form-group">
        <label>M1011 - Inpatient Diagnoses</label>
        <textarea
          value={formData.m1011InpatientDiagnosis}
          onChange={(e) => handleInputChange('m1011InpatientDiagnosis', e.target.value)}
          rows="3"
          placeholder="Enter diagnoses from inpatient stay..."
        />
      </div>
      
      <div className="form-group">
        <label>M1021 - Primary Diagnosis (ICD-10)</label>
        <input
          type="text"
          value={formData.m1021PrimaryDiagnosisIcd}
          onChange={(e) => handleInputChange('m1021PrimaryDiagnosisIcd', e.target.value)}
          placeholder="e.g., I50.9"
          maxLength="10"
        />
      </div>
      
      <div className="form-group">
        <label>M1021 - Primary Diagnosis Description</label>
        <input
          type="text"
          value={formData.m1021PrimaryDiagnosisDesc}
          onChange={(e) => handleInputChange('m1021PrimaryDiagnosisDesc', e.target.value)}
          placeholder="e.g., Heart failure, unspecified"
        />
      </div>
      
      <h3>M1023 - Other Diagnoses</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Diagnosis 2 (ICD-10)</label>
          <input
            type="text"
            value={formData.m1023OtherDiagnosis1Icd}
            onChange={(e) => handleInputChange('m1023OtherDiagnosis1Icd', e.target.value)}
            maxLength="10"
          />
        </div>
        
        <div className="form-group">
          <label>Diagnosis 3 (ICD-10)</label>
          <input
            type="text"
            value={formData.m1023OtherDiagnosis2Icd}
            onChange={(e) => handleInputChange('m1023OtherDiagnosis2Icd', e.target.value)}
            maxLength="10"
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Diagnosis 4 (ICD-10)</label>
          <input
            type="text"
            value={formData.m1023OtherDiagnosis3Icd}
            onChange={(e) => handleInputChange('m1023OtherDiagnosis3Icd', e.target.value)}
            maxLength="10"
          />
        </div>
        
        <div className="form-group">
          <label>Diagnosis 5 (ICD-10)</label>
          <input
            type="text"
            value={formData.m1023OtherDiagnosis4Icd}
            onChange={(e) => handleInputChange('m1023OtherDiagnosis4Icd', e.target.value)}
            maxLength="10"
          />
        </div>
      </div>
    </div>
  );

  // Section 3: Living Arrangements
  const renderSection3 = () => (
    <div className="form-section">
      <h2>Section 3: Living Arrangements</h2>
      
      <div className="form-group">
        <label>M1100 - Patient Living Situation</label>
        <select
          value={formData.m1100LivingSituation}
          onChange={(e) => handleInputChange('m1100LivingSituation', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="01">Patient lives alone</option>
          <option value="02">Patient lives with other person(s) in the home</option>
          <option value="03">Patient lives in congregate situation</option>
          <option value="04">Patient lives in assisted living facility</option>
          <option value="05">Patient lives in nursing home</option>
        </select>
      </div>
    </div>
  );

  // Section 4: Sensory Status
  const renderSection4 = () => (
    <div className="form-section">
      <h2>Section 4: Sensory Status</h2>
      
      <div className="form-group">
        <label>M1200 - Vision (with corrective lenses if used)</label>
        <select
          value={formData.m1200Vision}
          onChange={(e) => handleInputChange('m1200Vision', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">Normal vision</option>
          <option value="1">Partially impaired</option>
          <option value="2">Severely impaired</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>M1242 - Hearing (with hearing aid if used)</label>
        <select
          value={formData.m1242Hearing}
          onChange={(e) => handleInputChange('m1242Hearing', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">Adequate</option>
          <option value="1">Minimal difficulty</option>
          <option value="2">Moderate difficulty</option>
          <option value="3">Severe difficulty</option>
          <option value="4">Unable to hear</option>
        </select>
      </div>
    </div>
  );

  // Section 5: Integumentary Status
  const renderSection5 = () => (
    <div className="form-section">
      <h2>Section 5: Integumentary Status</h2>
      
      <div className="form-group">
        <label>M1306 - Does this patient have at least one Pressure Ulcer/Injury?</label>
        <select
          value={formData.m1306PressureUlcer}
          onChange={(e) => handleInputChange('m1306PressureUlcer', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
      </div>
      
      {!shouldSkipPressureUlcerDetails() && formData.m1306PressureUlcer === '1' && (
        <>
          <div className="form-group">
            <label>M1307 - Oldest Stage 2 Pressure Ulcer Date</label>
            <input
              type="date"
              value={formData.m1307OldestStage2Date}
              onChange={(e) => handleInputChange('m1307OldestStage2Date', e.target.value)}
            />
          </div>
          
          <h3>M1308 - Current Number of Pressure Ulcers at Each Stage</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Stage 1</label>
              <input
                type="number"
                value={formData.m1308Stage1Count}
                onChange={(e) => handleInputChange('m1308Stage1Count', e.target.value)}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Stage 2</label>
              <input
                type="number"
                value={formData.m1308Stage2Count}
                onChange={(e) => handleInputChange('m1308Stage2Count', e.target.value)}
                min="0"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Stage 3</label>
              <input
                type="number"
                value={formData.m1308Stage3Count}
                onChange={(e) => handleInputChange('m1308Stage3Count', e.target.value)}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Stage 4</label>
              <input
                type="number"
                value={formData.m1308Stage4Count}
                onChange={(e) => handleInputChange('m1308Stage4Count', e.target.value)}
                min="0"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>M1320 - Status of Most Problematic Pressure Ulcer</label>
            <select
              value={formData.m1320PressureUlcerStatus}
              onChange={(e) => handleInputChange('m1320PressureUlcerStatus', e.target.value)}
            >
              <option value="">Select...</option>
              <option value="01">Newly epithelialized</option>
              <option value="02">Fully granulating</option>
              <option value="03">Early/partial granulation</option>
              <option value="04">Not healing</option>
            </select>
          </div>
        </>
      )}
      
      {shouldSkipPressureUlcerDetails() && (
        <div className="skip-indicator">
          <span className="skip-badge">⏭️ SKIPPED</span>
          <span>Pressure ulcer details are skipped because patient has no pressure ulcers</span>
        </div>
      )}
      
      <div className="form-group">
        <label>M1330 - Does this patient have a Stasis Ulcer?</label>
        <select
          value={formData.m1330StasisUlcer}
          onChange={(e) => handleInputChange('m1330StasisUlcer', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
      </div>
      
      {!shouldSkipStasisUlcerDetails() && formData.m1330StasisUlcer === '1' && (
        <>
          <div className="form-group">
            <label>M1332 - Number of Stasis Ulcers</label>
            <input
              type="number"
              value={formData.m1332StasisUlcerCount}
              onChange={(e) => handleInputChange('m1332StasisUlcerCount', e.target.value)}
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label>M1334 - Status of Most Problematic Stasis Ulcer</label>
            <select
              value={formData.m1334StasisUlcerStatus}
              onChange={(e) => handleInputChange('m1334StasisUlcerStatus', e.target.value)}
            >
              <option value="">Select...</option>
              <option value="01">Newly epithelialized</option>
              <option value="02">Fully granulating</option>
              <option value="03">Early/partial granulation</option>
              <option value="04">Not healing</option>
            </select>
          </div>
        </>
      )}
      
      {shouldSkipStasisUlcerDetails() && (
        <div className="skip-indicator">
          <span className="skip-badge">⏭️ SKIPPED</span>
          <span>Stasis ulcer details are skipped because patient has no stasis ulcers</span>
        </div>
      )}
      
      <div className="form-group">
        <label>M1340 - Does this patient have a Surgical Wound?</label>
        <select
          value={formData.m1340SurgicalWound}
          onChange={(e) => handleInputChange('m1340SurgicalWound', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
      </div>
      
      {!shouldSkipSurgicalWoundDetails() && formData.m1340SurgicalWound === '1' && (
        <div className="form-group">
          <label>M1342 - Status of Most Problematic Surgical Wound</label>
          <select
            value={formData.m1342SurgicalWoundStatus}
            onChange={(e) => handleInputChange('m1342SurgicalWoundStatus', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="01">Newly epithelialized</option>
            <option value="02">Fully granulating</option>
            <option value="03">Early/partial granulation</option>
            <option value="04">Not healing</option>
          </select>
        </div>
      )}
      
      {shouldSkipSurgicalWoundDetails() && (
        <div className="skip-indicator">
          <span className="skip-badge">⏭️ SKIPPED</span>
          <span>Surgical wound details are skipped because patient has no surgical wounds</span>
        </div>
      )}
    </div>
  );

  // Section 6: Respiratory Status
  const renderSection6 = () => (
    <div className="form-section">
      <h2>Section 6: Respiratory Status</h2>
      
      <div className="form-group">
        <label>M1400 - When is the patient dyspneic or noticeably Short of Breath?</label>
        <select
          value={formData.m1400Dyspnea}
          onChange={(e) => handleInputChange('m1400Dyspnea', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">Never, patient is not short of breath</option>
          <option value="1">When walking more than 20 feet</option>
          <option value="2">With moderate exertion</option>
          <option value="3">With minimal exertion</option>
          <option value="4">At rest</option>
        </select>
      </div>
    </div>
  );

  // Section 7: Cardiac Status
  const renderSection7 = () => (
    <div className="form-section">
      <h2>Section 7: Cardiac Status</h2>
      
      <div className="form-group">
        <label>M1500 - Symptoms in Heart Failure Patients</label>
        <textarea
          value={formData.m1500HeartFailureSymptoms}
          onChange={(e) => handleInputChange('m1500HeartFailureSymptoms', e.target.value)}
          rows="3"
          placeholder="Describe symptoms..."
        />
      </div>
    </div>
  );

  // Section 8: Elimination Status
  const renderSection8 = () => (
    <div className="form-section">
      <h2>Section 8: Elimination Status</h2>
      
      <div className="form-group">
        <label>M1610 - Urinary Incontinence or Urinary Catheter Presence</label>
        <select
          value={formData.m1610UrinaryIncontinence}
          onChange={(e) => handleInputChange('m1610UrinaryIncontinence', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No incontinence or catheter</option>
          <option value="1">Patient is incontinent</option>
          <option value="2">Patient requires a urinary catheter</option>
        </select>
      </div>
      
      {!shouldSkipIncontinenceTiming() && formData.m1610UrinaryIncontinence === '1' && (
        <div className="form-group">
          <label>M1615 - When does Urinary Incontinence occur?</label>
          <select
            value={formData.m1615IncontinenceTiming}
            onChange={(e) => handleInputChange('m1615IncontinenceTiming', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="0">Timed-voiding defers incontinence</option>
            <option value="1">During the night only</option>
            <option value="2">During the day and night</option>
          </select>
        </div>
      )}
      
      {shouldSkipIncontinenceTiming() && (
        <div className="skip-indicator">
          <span className="skip-badge">⏭️ SKIPPED</span>
          <span>Incontinence timing is skipped because patient is continent</span>
        </div>
      )}
      
      <div className="form-group">
        <label>M1620 - Bowel Incontinence Frequency</label>
        <select
          value={formData.m1620BowelIncontinence}
          onChange={(e) => handleInputChange('m1620BowelIncontinence', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">Very rarely or never</option>
          <option value="1">Less than once weekly</option>
          <option value="2">One to three times weekly</option>
          <option value="3">Four to six times weekly</option>
          <option value="4">On a daily basis</option>
          <option value="5">More often than once daily</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>M1630 - Ostomy for Bowel Elimination</label>
        <select
          value={formData.m1630Ostomy}
          onChange={(e) => handleInputChange('m1630Ostomy', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">Patient does not have an ostomy</option>
          <option value="1">Patient has an ostomy</option>
        </select>
      </div>
    </div>
  );

  // Section 9: Neurological/Emotional/Behavioral
  const renderSection9 = () => (
    <div className="form-section">
      <h2>Section 9: Neurological/Emotional/Behavioral Status</h2>
      
      <div className="form-group">
        <label>M1700 - Cognitive Functioning</label>
        <select
          value={formData.m1700CognitiveFunctioning}
          onChange={(e) => handleInputChange('m1700CognitiveFunctioning', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">Alert/oriented, able to focus</option>
          <option value="1">Requires prompting</option>
          <option value="2">Requires assistance and some direction</option>
          <option value="3">Requires considerable assistance</option>
          <option value="4">Totally dependent</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>M1710 - When Confused</label>
        <select
          value={formData.m1710WhenConfused}
          onChange={(e) => handleInputChange('m1710WhenConfused', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">Never</option>
          <option value="1">In new or complex situations only</option>
          <option value="2">On awakening or at night only</option>
          <option value="3">During the day and evening</option>
          <option value="4">Constantly</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>M1720 - When Anxious</label>
        <select
          value={formData.m1720WhenAnxious}
          onChange={(e) => handleInputChange('m1720WhenAnxious', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">None of the time</option>
          <option value="1">Less often than daily</option>
          <option value="2">Daily, but not constantly</option>
          <option value="3">All of the time</option>
        </select>
      </div>
    </div>
  );

  // Section 11: Medications
  const renderSection11 = () => (
    <div className="form-section">
      <h2>Section 11: Medications</h2>
      
      <div className="form-group">
        <label>M2001 - Drug Regimen Review</label>
        <select
          value={formData.m2001DrugRegimenReview}
          onChange={(e) => handleInputChange('m2001DrugRegimenReview', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
          <option value="NA">Not Applicable</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>M2020 - Management of Oral Medications</label>
        <select
          value={formData.m2020OralMedicationManagement}
          onChange={(e) => handleInputChange('m2020OralMedicationManagement', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">Able to independently take correct medication</option>
          <option value="1">Able to take medication if prepared</option>
          <option value="2">Unable to take medication unless administered</option>
          <option value="3">Not Applicable - No oral medications</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>M2030 - Management of Injectable Medications</label>
        <select
          value={formData.m2030InjectableMedicationMgmt}
          onChange={(e) => handleInputChange('m2030InjectableMedicationMgmt', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">Able to independently take correct medication</option>
          <option value="1">Able to take medication if prepared</option>
          <option value="2">Unable to take medication unless administered</option>
          <option value="NA">Not Applicable - No injectable medications</option>
        </select>
      </div>
    </div>
  );

  // Section 13: Emergent Care
  const renderSection13 = () => (
    <div className="form-section">
      <h2>Section 13: Emergent Care</h2>
      
      <div className="form-group">
        <label>M2310 - Emergent Care</label>
        <select
          value={formData.m2310EmergentCare}
          onChange={(e) => handleInputChange('m2310EmergentCare', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No emergent care</option>
          <option value="1">Yes, used hospital emergency department</option>
          <option value="2">Yes, admitted to hospital</option>
        </select>
      </div>
      
      {!shouldSkipEmergentCareReason() && formData.m2310EmergentCare !== '0' && formData.m2310EmergentCare !== '' && (
        <div className="form-group">
          <label>M2410 - Reason for Emergent Care</label>
          <textarea
            value={formData.m2410EmergentCareReason}
            onChange={(e) => handleInputChange('m2410EmergentCareReason', e.target.value)}
            rows="3"
            placeholder="Describe reason for emergent care..."
          />
        </div>
      )}
      
      {shouldSkipEmergentCareReason() && (
        <div className="skip-indicator">
          <span className="skip-badge">⏭️ SKIPPED</span>
          <span>Emergent care reason is skipped because patient had no emergent care</span>
        </div>
      )}
    </div>
  );

  // Section 14: COVID-19 Vaccination
  const renderSection14 = () => (
    <div className="form-section">
      <h2>Section 14: COVID-19 Vaccination (NEW in OASIS-E1)</h2>
      
      <div className="form-group">
        <label>O0350 - COVID-19 Vaccination Status</label>
        <select
          value={formData.o0350CovidVaccination}
          onChange={(e) => handleInputChange('o0350CovidVaccination', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No, patient has not received COVID-19 vaccination</option>
          <option value="1">Yes, patient has received partial vaccination</option>
          <option value="2">Yes, patient has received full vaccination</option>
          <option value="9">Unable to determine</option>
        </select>
      </div>
      
      <div className="info-box">
        <strong>ℹ️ NEW ITEM:</strong> This is a new item added in OASIS-E1 to track COVID-19 vaccination status.
      </div>
    </div>
  );

  // Section 15: Patient Mood Assessment (PHQ-2 to PHQ-9)
  const renderSection15 = () => {
    const phq2Score = calculatePhq2Score();
    const showPhq9 = !shouldSkipPhq9();
    
    return (
      <div className="form-section">
        <h2>Section 15: Patient Mood Assessment (PHQ-2/PHQ-9)</h2>
        
        <h3>PHQ-2 Screening Questions</h3>
        <p className="section-instructions">
          Over the last 2 weeks, how often have you been bothered by the following problems?
        </p>
        
        <div className="form-group">
          <label>D0150A - Little interest or pleasure in doing things</label>
          <select
            value={formData.d0150Phq2Interest}
            onChange={(e) => handleInputChange('d0150Phq2Interest', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="0">Not at all</option>
            <option value="1">Several days</option>
            <option value="2">More than half the days</option>
            <option value="3">Nearly every day</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>D0150B - Feeling down, depressed, or hopeless</label>
          <select
            value={formData.d0150Phq2Depressed}
            onChange={(e) => handleInputChange('d0150Phq2Depressed', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="0">Not at all</option>
            <option value="1">Several days</option>
            <option value="2">More than half the days</option>
            <option value="3">Nearly every day</option>
          </select>
        </div>
        
        <div className="phq-score-box">
          <strong>PHQ-2 Score: {phq2Score}</strong>
          {phq2Score >= 3 && <span className="score-warning"> ⚠️ Score ≥ 3: Complete full PHQ-9</span>}
          {phq2Score < 3 && phq2Score > 0 && <span className="score-ok"> ✓ Score &lt; 3: PHQ-9 not required</span>}
        </div>
        
        {showPhq9 && (
          <>
            <h3>PHQ-9 Full Assessment</h3>
            <p className="section-instructions">
              Continue with remaining PHQ-9 questions (PHQ-2 score ≥ 3)
            </p>
            
            <div className="form-group">
              <label>D0150C - Trouble falling or staying asleep, or sleeping too much</label>
              <select
                value={formData.d0150Phq9Q3}
                onChange={(e) => handleInputChange('d0150Phq9Q3', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="0">Not at all</option>
                <option value="1">Several days</option>
                <option value="2">More than half the days</option>
                <option value="3">Nearly every day</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>D0150D - Feeling tired or having little energy</label>
              <select
                value={formData.d0150Phq9Q4}
                onChange={(e) => handleInputChange('d0150Phq9Q4', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="0">Not at all</option>
                <option value="1">Several days</option>
                <option value="2">More than half the days</option>
                <option value="3">Nearly every day</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>D0150E - Poor appetite or overeating</label>
              <select
                value={formData.d0150Phq9Q5}
                onChange={(e) => handleInputChange('d0150Phq9Q5', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="0">Not at all</option>
                <option value="1">Several days</option>
                <option value="2">More than half the days</option>
                <option value="3">Nearly every day</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>D0150F - Feeling bad about yourself</label>
              <select
                value={formData.d0150Phq9Q6}
                onChange={(e) => handleInputChange('d0150Phq9Q6', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="0">Not at all</option>
                <option value="1">Several days</option>
                <option value="2">More than half the days</option>
                <option value="3">Nearly every day</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>D0150G - Trouble concentrating</label>
              <select
                value={formData.d0150Phq9Q7}
                onChange={(e) => handleInputChange('d0150Phq9Q7', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="0">Not at all</option>
                <option value="1">Several days</option>
                <option value="2">More than half the days</option>
                <option value="3">Nearly every day</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>D0150H - Moving or speaking slowly or being fidgety</label>
              <select
                value={formData.d0150Phq9Q8}
                onChange={(e) => handleInputChange('d0150Phq9Q8', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="0">Not at all</option>
                <option value="1">Several days</option>
                <option value="2">More than half the days</option>
                <option value="3">Nearly every day</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>D0150I - Thoughts of self-harm</label>
              <select
                value={formData.d0150Phq9Q9}
                onChange={(e) => handleInputChange('d0150Phq9Q9', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="0">Not at all</option>
                <option value="1">Several days</option>
                <option value="2">More than half the days</option>
                <option value="3">Nearly every day</option>
              </select>
            </div>
          </>
        )}
        
        {!showPhq9 && phq2Score > 0 && (
          <div className="skip-indicator">
            <span className="skip-badge">⏭️ SKIPPED</span>
            <span>PHQ-9 questions are skipped because PHQ-2 score is less than 3</span>
          </div>
        )}
      </div>
    );
  };

  // Section 16: Immunization
  const renderSection16 = () => (
    <div className="form-section">
      <h2>Section 16: Immunization</h2>
      
      <div className="form-group">
        <label>M1041 - Influenza Vaccine Data Collection Period</label>
        <select
          value={formData.m1041InfluenzaVaccinePeriod}
          onChange={(e) => handleInputChange('m1041InfluenzaVaccinePeriod', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>M1046 - Influenza Vaccine Received</label>
        <select
          value={formData.m1046InfluenzaVaccineReceived}
          onChange={(e) => handleInputChange('m1046InfluenzaVaccineReceived', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>M1051 - Pneumococcal Vaccine Ever Received</label>
        <select
          value={formData.m1051PneumococcalVaccine}
          onChange={(e) => handleInputChange('m1051PneumococcalVaccine', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
          <option value="2">Unknown</option>
        </select>
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading OASIS assessment...</div>;
  }

  return (
    <div className="oasis-form-container">
      {/* Header */}
      <div className="oasis-header">
        <div className="header-content">
          <h1>OASIS-E1 Assessment</h1>
          {patient && (
            <div className="patient-info">
              <strong>{patient.firstName} {patient.lastName}</strong>
              <span>DOB: {patient.dateOfBirth}</span>
              <span>MRN: {patient.mrn}</span>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${calculateCompletion()}%` }}
            ></div>
          </div>
          <span className="progress-text">{calculateCompletion()}% Complete</span>
        </div>
        
        {/* Auto-save Status */}
        <div className="autosave-status">
          <span className="autosave-icon">💾</span>
          <span>Last saved at {formatLastSaved()}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="oasis-content">
        {/* Left Navigation */}
        <div className="oasis-nav">
          <h3>Sections</h3>
          <ul className="section-list">
            {sections.map(section => (
              <li 
                key={section.id}
                className={activeSection === section.id ? 'active' : ''}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="section-icon">{section.icon}</span>
                <span className="section-name">{section.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Content Area */}
        <div className="oasis-form-content">
          {renderSectionContent()}
          
          {/* Action Buttons */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/patients')}
            >
              Cancel
            </button>
            
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            
            {id && (
              <button 
                type="button" 
                className="btn btn-success"
                onClick={handleSubmit}
              >
                Submit for QA
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OasisForm;

