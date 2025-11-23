import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getOasisAssessment,
  createOasisAssessment,
  updateOasisAssessment,
  autoSaveOasisAssessment,
  submitOasisForQA,
  getOasisAssessmentsByPatient
} from '../services/oasisAPI';
import { patientAPI, episodeAPI } from '../services/patientAPI';
import { planOfCareAPI } from '../services/planOfCareAPI';
import { Shield, X, Plus, Trash2 } from 'lucide-react';
import './OasisForm.css';
import './OasisFormComplete.css'; // Import POC modal styles

const OasisForm = () => {
  const { id, patientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState(null);
  const [activeSection, setActiveSection] = useState('section1');
  const [lastSaved, setLastSaved] = useState(null);
  const [assessmentStatus, setAssessmentStatus] = useState(null); // Track assessment status
  const [qaComments, setQaComments] = useState(null); // QA comments for REJECTED assessments
  const [reviewedBy, setReviewedBy] = useState(null); // QA reviewer name
  const [reviewedAt, setReviewedAt] = useState(null); // QA review date
  const autoSaveTimerRef = useRef(null);
  
  // POC Modal state
  const [showPOCModal, setShowPOCModal] = useState(false);
  const [pocFormData, setPocFormData] = useState({
    patientId: patientId ? parseInt(patientId) : null,
    episodeId: null,
    oasisAssessmentId: null,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    certificationPeriodDays: 60,
    primaryDiagnosisCode: '',
    primaryDiagnosisDescription: '',
    secondaryDiagnosisCode: '',
    secondaryDiagnosisDescription: '',
    otherDiagnoses: '',
    functionalLimitations: '',
    safetyMeasures: '',
    nutritionalRequirements: '',
    medicationList: '',
    medicationManagementNeeded: false,
    status: 'DRAFT',
    statusReason: '',
    physicianName: '',
    physicianPhone: '',
    physicianSignatureRequired: false,
    physicianSignedDate: '',
    physicianSignatureObtained: false,
    specialInstructions: '',
    dmeEquipment: '',
    notes: '',
    frequencies: [],
    interventions: [],
    goals: [],
    physicianOrders: [],
  });
  const [pocPatients, setPocPatients] = useState([]);
  const [pocEpisodes, setPocEpisodes] = useState([]);
  const [submittingPOC, setSubmittingPOC] = useState(false);
  
  // Check if assessment is read-only
  const isReadOnly = assessmentStatus === 'APPROVED' || assessmentStatus === 'COMPLETED' || assessmentStatus === 'LOCKED';

  // Form data state
  const [formData, setFormData] = useState({
    patientId: patientId ? (typeof patientId === 'string' ? parseInt(patientId, 10) : patientId) : null,
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
    
    // Section 10: Functional Abilities (GG Items)
    gg0100PriorFunctioning: null,
    gg0110PriorDeviceUse: null,
    gg0130SelfCare: null,
    gg0170Mobility: null,
    
    // Section 12: Care Management
    m2102AssistanceTypes: null,
    m2110AssistanceFrequency: '',
    
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
    
    // Section 17: Discharge Planning
    m2401InterventionSynopsis: null,
    m2410DischargeTo: '',
    m2420DischargeDisposition: '',
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

  // Calculate completion percentage (accounting for skipped fields)
  const calculateCompletion = () => {
    // Define all relevant fields that should be counted for completion
    // Exclude metadata fields like id, patientName, status, etc.
    // Note: Some fields are truly optional (like other diagnosis 2-5) and won't count against completion
    const relevantFields = [
      // Section 1
      'm0010CmsCertNumber', 'm0014BranchState', 'm0016BranchId', 'm0018Npi', 'm0020PatientId',
      'm0030SocDate', 'm0032RocDate', 'm0063MedicareNumber', 'm0064Ssn', 'm0065MedicaidNumber',
      'm0069Gender', 'm0140RaceEthnicity',
      // Section 2
      'm1000InpatientFacility', 'm1005InpatientDischargeDate', 'm1011InpatientDiagnosis',
      'm1017DiagnosisChange', 'm1021PrimaryDiagnosisIcd', 'm1021PrimaryDiagnosisDesc',
      'm1023OtherDiagnosis1Icd', 'm1023OtherDiagnosis2Icd', 'm1023OtherDiagnosis3Icd',
      'm1023OtherDiagnosis4Icd', 'm1023OtherDiagnosis5Icd', 'm1028ActiveDiagnoses',
      // Section 3
      'm1100LivingSituation',
      // Section 4
      'm1200Vision', 'm1242Hearing',
      // Section 5
      'm1306PressureUlcer', 'm1307OldestStage2Date', 'm1308Stage1Count', 'm1308Stage2Count',
      'm1308Stage3Count', 'm1308Stage4Count', 'm1308UnstageableCount', 'm1320PressureUlcerStatus',
      'm1330StasisUlcer', 'm1332StasisUlcerCount', 'm1334StasisUlcerStatus',
      'm1340SurgicalWound', 'm1342SurgicalWoundStatus',
      // Section 6
      'm1400Dyspnea', 'm1410RespiratoryTreatments',
      // Section 7
      'm1500HeartFailureSymptoms',
      // Section 8
      'm1600UtiTreatment', 'm1610UrinaryIncontinence', 'm1615IncontinenceTiming',
      'm1620BowelIncontinence', 'm1630Ostomy',
      // Section 9
      'm1700CognitiveFunctioning', 'm1710WhenConfused', 'm1720WhenAnxious',
      'm1730DepressionScreening', 'm1740PsychiatricSymptoms', 'm1745DisruptiveBehaviorFreq',
      // Section 10 (GG Items - count as filled if object exists and has data)
      'gg0100PriorFunctioning', 'gg0110PriorDeviceUse', 'gg0130SelfCare', 'gg0170Mobility',
      // Section 11
      'm2001DrugRegimenReview', 'm2003MedicationFollowup', 'm2005MedicationIntervention',
      'm2010HighRiskDrugEducation', 'm2015DrugEducationIntervention', 'm2020OralMedicationManagement',
      'm2030InjectableMedicationMgmt', 'm2040PriorMedicationMgmt',
      // Section 12
      'm2102AssistanceTypes', 'm2110AssistanceFrequency',
      // Section 13
      'm2310EmergentCare', 'm2410EmergentCareReason',
      // Section 14
      'o0350CovidVaccination',
      // Section 15
      'd0150Phq2Interest', 'd0150Phq2Depressed', 'd0150Phq9Q3', 'd0150Phq9Q4', 'd0150Phq9Q5',
      'd0150Phq9Q6', 'd0150Phq9Q7', 'd0150Phq9Q8', 'd0150Phq9Q9', 'd0160Phq9TotalScore',
      // Section 16
      'm1041InfluenzaVaccinePeriod', 'm1046InfluenzaVaccineReceived', 'm1051PneumococcalVaccine',
      // Section 17
      'm2401InterventionSynopsis', 'm2410DischargeTo', 'm2420DischargeDisposition'
    ];
    
    // Fields that are truly optional and shouldn't count against completion
    // These are fields that can legitimately be left empty
    const optionalFields = [
      'm0032RocDate', // Only required for ROC assessments
      'm1023OtherDiagnosis2Icd', 'm1023OtherDiagnosis3Icd', 'm1023OtherDiagnosis4Icd', 'm1023OtherDiagnosis5Icd', // Optional additional diagnoses
      'm1017DiagnosisChange', // Optional
      'm1028ActiveDiagnoses', // Optional
      'm2401InterventionSynopsis', // Optional summary field
      'm2410DischargeTo', 'm2420DischargeDisposition' // Only for discharge assessments
    ];

    // Calculate which fields should be skipped based on skip logic
    const skippedFields = [];
    
    // M1005: Skip if M1000 = "NA"
    if (formData.m1000InpatientFacility === 'NA') {
      skippedFields.push('m1005InpatientDischargeDate');
    }
    
    // M1307-M1320: Skip if M1306 = "0" (no pressure ulcers)
    if (formData.m1306PressureUlcer === '0') {
      skippedFields.push('m1307OldestStage2Date', 'm1308Stage1Count', 'm1308Stage2Count',
                         'm1308Stage3Count', 'm1308Stage4Count', 'm1308UnstageableCount', 'm1320PressureUlcerStatus');
    }
    
    // M1332-M1334: Skip if M1330 = "0" (no stasis ulcers)
    if (formData.m1330StasisUlcer === '0') {
      skippedFields.push('m1332StasisUlcerCount', 'm1334StasisUlcerStatus');
    }
    
    // M1342: Skip if M1340 = "0" (no surgical wound)
    if (formData.m1340SurgicalWound === '0') {
      skippedFields.push('m1342SurgicalWoundStatus');
    }
    
    // M1615: Skip if M1610 = "0" (continent)
    if (formData.m1610UrinaryIncontinence === '0') {
      skippedFields.push('m1615IncontinenceTiming');
    }
    
    // M2410: Skip if M2310 = "0" (no emergent care)
    if (formData.m2310EmergentCare === '0') {
      skippedFields.push('m2410EmergentCareReason');
    }
    
    // PHQ-9: Skip if PHQ-2 score < 3
    if (shouldSkipPhq9()) {
      skippedFields.push('d0150Phq9Q3', 'd0150Phq9Q4', 'd0150Phq9Q5', 'd0150Phq9Q6',
                         'd0150Phq9Q7', 'd0150Phq9Q8', 'd0150Phq9Q9', 'd0160Phq9TotalScore');
    }

    // Count filled fields (excluding skipped ones and optional ones, which will be counted separately)
    let filledCount = 0;
    const mapFields = ['gg0100PriorFunctioning', 'gg0110PriorDeviceUse', 'gg0130SelfCare', 'gg0170Mobility',
                       'm2102AssistanceTypes', 'm2401InterventionSynopsis'];
    
    // Filter out optional fields from the count
    const requiredFields = relevantFields.filter(field => !optionalFields.includes(field));
    
    requiredFields.forEach(field => {
      // Skip if this field should be skipped (we'll count skipped fields separately)
      if (skippedFields.includes(field)) {
        return;
      }
      
      const value = formData[field];
      
      // Check if field is filled
      if (mapFields.includes(field)) {
        // For Map/Object fields, check if object exists and has at least one property with a value
        if (value && typeof value === 'object') {
          const keys = Object.keys(value);
          // Check if at least one property has a non-empty value
          const hasValue = keys.some(key => {
            const val = value[key];
            return val !== '' && val !== null && val !== undefined;
          });
          if (hasValue) {
            filledCount++;
          }
        }
      } else if (value !== '' && value !== null && value !== undefined) {
        filledCount++;
      }
    });

    // Total required fields = required fields (excluding optional ones)
    const totalRequiredFields = requiredFields.length;
    
    // Skipped fields count as "complete" (they're intentionally skipped)
    const skippedCount = skippedFields.filter(field => requiredFields.includes(field)).length;
    
    // Completion = (filled fields + skipped fields) / total required fields * 100
    // This means: (fields we filled + fields we skipped) / all required fields
    const completedFields = filledCount + skippedCount;
    
    if (totalRequiredFields === 0) return 100;
    
    const completion = Math.round((completedFields / totalRequiredFields) * 100);
    
    // Debug logging to see what's missing
    if (completion < 100) {
      const missingFields = [];
      const mapFields = ['gg0100PriorFunctioning', 'gg0110PriorDeviceUse', 'gg0130SelfCare', 'gg0170Mobility',
                         'm2102AssistanceTypes', 'm2401InterventionSynopsis'];
      
      requiredFields.forEach(field => {
        if (skippedFields.includes(field)) return;
        const value = formData[field];
        let isFilled = false;
        
        if (mapFields.includes(field)) {
          if (value && typeof value === 'object') {
            const keys = Object.keys(value);
            isFilled = keys.some(key => {
              const val = value[key];
              return val !== '' && val !== null && val !== undefined;
            });
          }
        } else {
          isFilled = value !== '' && value !== null && value !== undefined;
        }
        
        if (!isFilled) {
          missingFields.push(field);
        }
      });
      
      console.log('=== OASIS Completion Debug ===');
      console.log('Completion:', completion + '%');
      console.log('Filled:', filledCount, '| Skipped:', skippedCount, '| Total Required:', totalRequiredFields);
      console.log('Completed (filled + skipped):', completedFields);
      console.log('Optional fields excluded:', optionalFields.length);
      console.log('Missing required fields (' + missingFields.length + '):', missingFields);
      console.log('==============================');
    }
    
    return Math.min(100, completion);
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

  // Helper function to get safe string value for input fields (prevents null values)
  const getInputValue = (value) => {
    return value === null || value === undefined ? '' : String(value);
  };

  // Helper function to normalize form data (convert null to empty string)
  const normalizeFormData = (data) => {
    const normalized = { ...data };
    // Map fields that should remain as objects
    const mapFields = ['gg0100PriorFunctioning', 'gg0110PriorDeviceUse', 'gg0130SelfCare', 'gg0170Mobility', 
                       'm2102AssistanceTypes', 'm2401InterventionSynopsis', 'sectionCompletion', 'skippedFields'];
    
    // Convert all null/undefined values to empty strings for string fields
    Object.keys(normalized).forEach(key => {
      const value = normalized[key];
      
      // Keep Map/Object fields as objects (or null)
      if (mapFields.includes(key)) {
        if (value === null || value === undefined) {
          normalized[key] = null;
        } else if (typeof value === 'string') {
          // Try to parse JSON string
          try {
            normalized[key] = JSON.parse(value);
          } catch {
            normalized[key] = null;
          }
        }
        // Otherwise keep as is (already an object)
      } else if (value === null || value === undefined) {
        // Only keep null for specific numeric fields that should remain null
        if (key === 'd0160Phq9TotalScore' && value === null) {
          // Keep null for this numeric field
        } else {
          normalized[key] = '';
        }
      }
    });
    return normalized;
  };

  // Helper function to prepare request data (filter out read-only fields)
  const prepareRequestData = (data) => {
    // Fields that should be included in the request
    const requestFields = [
      'patientId', 'episodeId', 'assessmentType', 'assessmentReason', 'assessmentDate',
      'clinicianId', 'sectionCompletion', 'skippedFields',
      // Section 1
      'm0010CmsCertNumber', 'm0014BranchState', 'm0016BranchId', 'm0018Npi', 'm0020PatientId',
      'm0030SocDate', 'm0032RocDate', 'm0063MedicareNumber', 'm0064Ssn', 'm0065MedicaidNumber',
      'm0069Gender', 'm0140RaceEthnicity',
      // Section 2
      'm1000InpatientFacility', 'm1005InpatientDischargeDate', 'm1011InpatientDiagnosis',
      'm1017DiagnosisChange', 'm1021PrimaryDiagnosisIcd', 'm1021PrimaryDiagnosisDesc',
      'm1023OtherDiagnosis1Icd', 'm1023OtherDiagnosis2Icd', 'm1023OtherDiagnosis3Icd',
      'm1023OtherDiagnosis4Icd', 'm1023OtherDiagnosis5Icd', 'm1028ActiveDiagnoses',
      // Section 3
      'm1100LivingSituation',
      // Section 4
      'm1200Vision', 'm1242Hearing',
      // Section 5
      'm1306PressureUlcer', 'm1307OldestStage2Date', 'm1308Stage1Count', 'm1308Stage2Count',
      'm1308Stage3Count', 'm1308Stage4Count', 'm1308UnstageableCount', 'm1320PressureUlcerStatus',
      'm1330StasisUlcer', 'm1332StasisUlcerCount', 'm1334StasisUlcerStatus',
      'm1340SurgicalWound', 'm1342SurgicalWoundStatus',
      // Section 6
      'm1400Dyspnea', 'm1410RespiratoryTreatments',
      // Section 7
      'm1500HeartFailureSymptoms',
      // Section 8
      'm1600UtiTreatment', 'm1610UrinaryIncontinence', 'm1615IncontinenceTiming',
      'm1620BowelIncontinence', 'm1630Ostomy',
      // Section 9
      'm1700CognitiveFunctioning', 'm1710WhenConfused', 'm1720WhenAnxious',
      'm1730DepressionScreening', 'm1740PsychiatricSymptoms', 'm1745DisruptiveBehaviorFreq',
      // Section 10 (GG Items)
      'gg0100PriorFunctioning', 'gg0110PriorDeviceUse', 'gg0130SelfCare', 'gg0170Mobility',
      // Section 11
      'm2001DrugRegimenReview', 'm2003MedicationFollowup', 'm2005MedicationIntervention',
      'm2010HighRiskDrugEducation', 'm2015DrugEducationIntervention', 'm2020OralMedicationManagement',
      'm2030InjectableMedicationMgmt', 'm2040PriorMedicationMgmt',
      // Section 12
      'm2102AssistanceTypes', 'm2110AssistanceFrequency',
      // Section 13
      'm2310EmergentCare', 'm2410EmergentCareReason',
      // Section 14
      'o0350CovidVaccination',
      // Section 15
      'd0150Phq2Interest', 'd0150Phq2Depressed', 'd0150Phq9Q3', 'd0150Phq9Q4', 'd0150Phq9Q5',
      'd0150Phq9Q6', 'd0150Phq9Q7', 'd0150Phq9Q8', 'd0150Phq9Q9', 'd0160Phq9TotalScore',
      // Section 16
      'm1041InfluenzaVaccinePeriod', 'm1046InfluenzaVaccineReceived', 'm1051PneumococcalVaccine',
      // Section 17
      'm2401InterventionSynopsis', 'm2410DischargeTo', 'm2420DischargeDisposition'
    ];

    // Filter data to only include request fields
    const requestData = {};
    requestFields.forEach(field => {
      if (data.hasOwnProperty(field)) {
        let value = data[field];
        
        // Handle Long fields (patientId, episodeId, clinicianId)
        if (field === 'patientId') {
          // Convert to number if it's a string
          if (typeof value === 'string' && value !== '') {
            value = parseInt(value, 10);
          }
          requestData[field] = value;
        } else if (field === 'episodeId' || field === 'clinicianId') {
          // Convert empty strings to null for optional Long fields
          if (value === '' || value === null || value === undefined) {
            requestData[field] = null;
          } else if (typeof value === 'string') {
            // Convert string to number
            requestData[field] = parseInt(value, 10);
          } else {
            requestData[field] = value;
          }
        }
        // Handle date fields - convert empty strings to null
        else if (field.includes('Date') && field !== 'assessmentDate') {
          if (value === '' || value === null || value === undefined) {
            requestData[field] = null;
          } else {
            requestData[field] = value;
          }
        }
        // Handle Integer fields (Count fields, d0160Phq9TotalScore)
        else if (field.includes('Count') || field === 'd0160Phq9TotalScore') {
          if (value === '' || value === null || value === undefined) {
            requestData[field] = null;
          } else if (typeof value === 'string') {
            // Convert string to number
            const numValue = parseInt(value, 10);
            requestData[field] = isNaN(numValue) ? null : numValue;
          } else {
            requestData[field] = value;
          }
        }
        // Handle Map/Object fields (sectionCompletion, skippedFields, GG items, etc.)
        else if (field === 'sectionCompletion' || field === 'skippedFields' || 
                 field === 'gg0100PriorFunctioning' || field === 'gg0110PriorDeviceUse' ||
                 field === 'gg0130SelfCare' || field === 'gg0170Mobility' ||
                 field === 'm2102AssistanceTypes' || field === 'm2401InterventionSynopsis') {
          // Keep as is if it's an object/array, otherwise set to null
          if (value === '' || value === null || value === undefined) {
            requestData[field] = null;
          } else if (typeof value === 'string') {
            // Try to parse JSON string
            try {
              requestData[field] = JSON.parse(value);
            } catch {
              requestData[field] = null;
            }
          } else {
            requestData[field] = value;
          }
        }
        // Handle string fields - keep empty strings as empty strings
        else {
          if (value === null || value === undefined) {
            requestData[field] = '';
          } else {
            requestData[field] = value;
          }
        }
      }
    });

    return requestData;
  };

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
          const normalizedData = normalizeFormData(assessmentData);
          // Ensure patientId is a number
          if (normalizedData.patientId && typeof normalizedData.patientId === 'string') {
            normalizedData.patientId = parseInt(normalizedData.patientId, 10);
          }
          setFormData(normalizedData);
          setLastSaved(assessmentData.lastAutoSaved);
          
          // Store assessment status for read-only mode
          if (assessmentData.status) {
            setAssessmentStatus(assessmentData.status);
          }
          
          // Store QA comments and review info for REJECTED assessments
          if (assessmentData.qaComments) {
            setQaComments(assessmentData.qaComments);
          }
          if (assessmentData.reviewedByName) {
            setReviewedBy(assessmentData.reviewedByName);
          }
          if (assessmentData.reviewedAt) {
            setReviewedAt(assessmentData.reviewedAt);
          }
        } else {
          // No ID provided - check if there's an existing assessment for this patient
          try {
            const assessments = await getOasisAssessmentsByPatient(patientId);
            
            // Priority: DRAFT > SUBMITTED > APPROVED > REJECTED (most recent first)
            const sortedAssessments = assessments.sort((a, b) => {
              const dateA = new Date(a.lastAutoSaved || a.submittedAt || a.createdAt || 0);
              const dateB = new Date(b.lastAutoSaved || b.submittedAt || b.createdAt || 0);
              return dateB - dateA;
            });
            
            // Find the most recent assessment that can be edited (DRAFT or REJECTED)
            const editableAssessment = sortedAssessments.find(a => 
              a.status === 'DRAFT' || a.status === 'REJECTED'
            );
            
            if (editableAssessment) {
              // Redirect to edit the existing editable assessment
              console.log('Found existing editable assessment, redirecting to edit:', editableAssessment.id, editableAssessment.status);
              navigate(`/oasis/edit/${editableAssessment.id}/${patientId}`, { replace: true });
              return;
            }
            
            // If no editable assessment, check for most recent assessment (for viewing)
            const mostRecentAssessment = sortedAssessments[0];
            if (mostRecentAssessment) {
              console.log('Found existing assessment (read-only), redirecting to view:', mostRecentAssessment.id, mostRecentAssessment.status);
              navigate(`/oasis/edit/${mostRecentAssessment.id}/${patientId}`, { replace: true });
              return;
            }
          } catch (error) {
            // If we can't fetch assessments, continue with creating a new one
            console.warn('Could not check for existing assessments:', error);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, patientId, navigate]);

  // Auto-save timer (15 seconds) - only for editable assessments
  useEffect(() => {
    if (id && !loading && !isReadOnly) {
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
      const requestData = prepareRequestData(formData);
      console.log('Auto-saving with filtered data:', Object.keys(requestData).length, 'fields');
      const result = await autoSaveOasisAssessment(id, requestData);
      setLastSaved(new Date());
      console.log('Auto-saved successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
      console.error('Request data sent:', JSON.stringify(prepareRequestData(formData), null, 2));
    }
  };

  // Manual save
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const requestData = prepareRequestData(formData);
      
      if (id) {
        // Update existing
        const result = await updateOasisAssessment(id, requestData);
        setLastSaved(new Date());
        alert('Assessment saved successfully!');
      } else {
        // Create new
        const result = await createOasisAssessment(requestData);
        if (result && result.id) {
        alert('Assessment created successfully!');
          navigate(`/oasis/edit/${result.id}/${patientId}`, { replace: true });
        } else {
          alert('Assessment created but could not retrieve ID. Please refresh the page.');
          console.error('Create response missing ID:', result);
        }
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

  // Submit for QA - show POC modal first
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

    // Pre-populate POC form with OASIS data
    setPocFormData(prev => ({
      ...prev,
      patientId: formData.patientId || patientId,
      episodeId: prev.episodeId,
      oasisAssessmentId: id ? parseInt(id) : null,
      primaryDiagnosisCode: formData.m1021PrimaryDiagnosisIcd || '',
      primaryDiagnosisDescription: formData.m1021PrimaryDiagnosisDesc || '',
      startDate: formData.assessmentDate || new Date().toISOString().split('T')[0],
    }));

    // Show POC creation modal
    console.log('Opening POC modal for OASIS ID:', id);
    setShowPOCModal(true);
  };

  // Load POC patients and episodes when modal opens
  useEffect(() => {
    if (showPOCModal) {
      loadPOCPatients();
      if (pocFormData.patientId) {
        loadPOCEpisodes(pocFormData.patientId);
      }
    }
  }, [showPOCModal]);

  const loadPOCPatients = async () => {
    try {
      const response = await patientAPI.getAll();
      setPocPatients(response.data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadPOCEpisodes = async (patientId) => {
    try {
      const response = await episodeAPI.getByPatient(patientId);
      setPocEpisodes(response.data || []);
    } catch (error) {
      console.error('Error loading episodes:', error);
    }
  };

  // Handle POC form changes
  const handlePOCChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPocFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value === '' ? null : value)
    }));

    if (name === 'patientId' && value) {
      loadPOCEpisodes(parseInt(value));
    }
  };

  // Submit both OASIS and POC for QA
  const handleSubmitOASISAndPOC = async () => {
    if (!pocFormData.frequencies || pocFormData.frequencies.length === 0) {
      alert('Please add at least one visit frequency to the Plan of Care.');
      return;
    }

    try {
      setSubmittingPOC(true);
      const oasisId = id;

      // Step 1: Save OASIS first (if needed)
      const requestData = prepareRequestData(formData);
      await updateOasisAssessment(oasisId, requestData);

      // Step 2: Prepare POC data
      const pocDataToSend = {
        ...pocFormData,
        patientId: typeof pocFormData.patientId === 'string' ? parseInt(pocFormData.patientId) : pocFormData.patientId,
        episodeId: typeof pocFormData.episodeId === 'string' ? parseInt(pocFormData.episodeId) : pocFormData.episodeId,
        oasisAssessmentId: oasisId ? parseInt(oasisId) : null,
        status: 'DRAFT',
        certificationPeriodDays: pocFormData.certificationPeriodDays ? parseInt(pocFormData.certificationPeriodDays) : 60,
        frequencies: pocFormData.frequencies ? pocFormData.frequencies.map(freq => ({
          ...freq,
          visitsPerWeek: typeof freq.visitsPerWeek === 'string' ? parseInt(freq.visitsPerWeek) : freq.visitsPerWeek,
          numberOfWeeks: typeof freq.numberOfWeeks === 'string' ? parseInt(freq.numberOfWeeks) : freq.numberOfWeeks,
          totalVisits: typeof freq.totalVisits === 'string' ? parseInt(freq.totalVisits) : freq.totalVisits,
          estimatedMinutesPerVisit: typeof freq.estimatedMinutesPerVisit === 'string' ? parseInt(freq.estimatedMinutesPerVisit) : freq.estimatedMinutesPerVisit,
        })) : [],
      };

      // Step 3: Create POC
      console.log('Creating POC...');
      const createdPOC = await planOfCareAPI.create(pocDataToSend);
      console.log('POC created with ID:', createdPOC.id);
      
      // Step 4: Submit POC for approval
      console.log('Submitting POC for approval...');
      await planOfCareAPI.submitForApproval(createdPOC.id);
      console.log('POC submitted for approval');
      
      // Step 5: Submit OASIS for QA
      console.log('Submitting OASIS for QA...');
      await submitOasisForQA(oasisId);
      console.log('OASIS submitted for QA');
      
      alert('OASIS and Plan of Care submitted successfully for QA review!');
      setShowPOCModal(false);
      navigate('/oasis/list');
    } catch (error) {
      console.error('Error submitting OASIS and POC:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      alert('Failed to submit: ' + errorMessage);
    } finally {
      setSubmittingPOC(false);
    }
  };

  // Submit only OASIS (skip POC)
  const handleSubmitOASISOnly = async () => {
    if (!window.confirm('Submit OASIS without Plan of Care? You can create POC later.')) {
      return;
    }

    try {
      setSaving(true);
      const requestData = prepareRequestData(formData);
      await updateOasisAssessment(id, requestData);
      await submitOasisForQA(id);
      alert('Assessment submitted for QA review!');
      setShowPOCModal(false);
      navigate('/oasis/list');
    } catch (error) {
      console.error('Error submitting for QA:', error);
      alert('Failed to submit for QA: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // POC array helper functions
  const handlePOCArrayChange = (arrayName, index, field, value) => {
    setPocFormData(prev => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value === '' ? null : value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addPOCArrayItem = (arrayName, defaultItem) => {
    setPocFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], { ...defaultItem }]
    }));
  };

  const removePOCArrayItem = (arrayName, index) => {
    setPocFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    // Prevent changes if read-only
    if (isReadOnly) {
      return;
    }
    setFormData(prev => {
      // Normalize value: convert null/undefined to empty string
      const normalizedValue = (value === null || value === undefined) ? '' : value;
      const updated = { ...prev, [field]: normalizedValue };
      
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
      case 'section10':
        return renderSection10();
      case 'section11':
        return renderSection11();
      case 'section12':
        return renderSection12();
      case 'section13':
        return renderSection13();
      case 'section14':
        return renderSection14();
      case 'section15':
        return renderSection15();
      case 'section16':
        return renderSection16();
      case 'section17':
        return renderSection17();
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
            value={getInputValue(formData.m0010CmsCertNumber)}
            onChange={(e) => handleInputChange('m0010CmsCertNumber', e.target.value)}
            maxLength="12"
          />
        </div>
        
        <div className="form-group">
          <label>M0014 - Branch State</label>
          <input
            type="text"
            value={getInputValue(formData.m0014BranchState)}
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
            value={getInputValue(formData.m0016BranchId)}
            onChange={(e) => handleInputChange('m0016BranchId', e.target.value)}
            maxLength="10"
          />
        </div>
        
        <div className="form-group">
          <label>M0018 - National Provider Identifier (NPI)</label>
          <input
            type="text"
            value={getInputValue(formData.m0018Npi)}
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
            value={getInputValue(formData.m0020PatientId)}
            onChange={(e) => handleInputChange('m0020PatientId', e.target.value)}
            maxLength="20"
          />
        </div>
        
        <div className="form-group">
          <label>M0030 - Start of Care Date</label>
          <input
            type="date"
            value={getInputValue(formData.m0030SocDate)}
            onChange={(e) => handleInputChange('m0030SocDate', e.target.value)}
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>M0063 - Medicare Number</label>
          <input
            type="text"
            value={getInputValue(formData.m0063MedicareNumber)}
            onChange={(e) => handleInputChange('m0063MedicareNumber', e.target.value)}
            maxLength="20"
          />
        </div>
        
        <div className="form-group">
          <label>M0064 - Social Security Number</label>
          <input
            type="text"
            value={getInputValue(formData.m0064Ssn)}
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
            value={getInputValue(formData.m0065MedicaidNumber)}
            onChange={(e) => handleInputChange('m0065MedicaidNumber', e.target.value)}
            maxLength="20"
          />
        </div>
        
        <div className="form-group">
          <label>M0069 - Gender</label>
          <select
            value={getInputValue(formData.m0069Gender)}
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
          value={getInputValue(formData.m0140RaceEthnicity)}
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
          value={getInputValue(formData.m1000InpatientFacility)}
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
            value={getInputValue(formData.m1005InpatientDischargeDate)}
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
          value={getInputValue(formData.m1011InpatientDiagnosis)}
          onChange={(e) => handleInputChange('m1011InpatientDiagnosis', e.target.value)}
          rows="3"
          placeholder="Enter diagnoses from inpatient stay..."
        />
      </div>
      
      <div className="form-group">
        <label>M1021 - Primary Diagnosis (ICD-10)</label>
        <input
          type="text"
          value={getInputValue(formData.m1021PrimaryDiagnosisIcd)}
          onChange={(e) => handleInputChange('m1021PrimaryDiagnosisIcd', e.target.value)}
          placeholder="e.g., I50.9"
          maxLength="10"
        />
      </div>
      
      <div className="form-group">
        <label>M1021 - Primary Diagnosis Description</label>
        <input
          type="text"
          value={getInputValue(formData.m1021PrimaryDiagnosisDesc)}
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
            value={getInputValue(formData.m1023OtherDiagnosis1Icd)}
            onChange={(e) => handleInputChange('m1023OtherDiagnosis1Icd', e.target.value)}
            maxLength="10"
          />
        </div>
        
        <div className="form-group">
          <label>Diagnosis 3 (ICD-10)</label>
          <input
            type="text"
            value={getInputValue(formData.m1023OtherDiagnosis2Icd)}
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
            value={getInputValue(formData.m1023OtherDiagnosis3Icd)}
            onChange={(e) => handleInputChange('m1023OtherDiagnosis3Icd', e.target.value)}
            maxLength="10"
          />
        </div>
        
        <div className="form-group">
          <label>Diagnosis 5 (ICD-10)</label>
          <input
            type="text"
            value={getInputValue(formData.m1023OtherDiagnosis4Icd)}
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
          value={getInputValue(formData.m1100LivingSituation)}
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
          value={getInputValue(formData.m1200Vision)}
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
          value={getInputValue(formData.m1242Hearing)}
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
          value={getInputValue(formData.m1306PressureUlcer)}
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
              value={getInputValue(formData.m1307OldestStage2Date)}
              onChange={(e) => handleInputChange('m1307OldestStage2Date', e.target.value)}
            />
          </div>
          
          <h3>M1308 - Current Number of Pressure Ulcers at Each Stage</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Stage 1</label>
              <input
                type="number"
                value={getInputValue(formData.m1308Stage1Count)}
                onChange={(e) => handleInputChange('m1308Stage1Count', e.target.value)}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Stage 2</label>
              <input
                type="number"
                value={getInputValue(formData.m1308Stage2Count)}
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
                value={getInputValue(formData.m1308Stage3Count)}
                onChange={(e) => handleInputChange('m1308Stage3Count', e.target.value)}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Stage 4</label>
              <input
                type="number"
                value={getInputValue(formData.m1308Stage4Count)}
                onChange={(e) => handleInputChange('m1308Stage4Count', e.target.value)}
                min="0"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>M1320 - Status of Most Problematic Pressure Ulcer</label>
            <select
              value={getInputValue(formData.m1320PressureUlcerStatus)}
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
          value={getInputValue(formData.m1330StasisUlcer)}
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
              value={getInputValue(formData.m1332StasisUlcerCount)}
              onChange={(e) => handleInputChange('m1332StasisUlcerCount', e.target.value)}
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label>M1334 - Status of Most Problematic Stasis Ulcer</label>
            <select
              value={getInputValue(formData.m1334StasisUlcerStatus)}
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
          value={getInputValue(formData.m1340SurgicalWound)}
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
            value={getInputValue(formData.m1342SurgicalWoundStatus)}
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
          value={getInputValue(formData.m1400Dyspnea)}
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

      <div className="form-group">
        <label>M1410 - Respiratory Treatments Used at Home</label>
        <p className="field-description">Does the patient use any respiratory treatments at home?</p>
        <select
          value={getInputValue(formData.m1410RespiratoryTreatments)}
          onChange={(e) => handleInputChange('m1410RespiratoryTreatments', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
          <option value="NA">Not applicable</option>
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
          value={getInputValue(formData.m1500HeartFailureSymptoms)}
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
        <label>M1600 - UTI Treatment</label>
        <p className="field-description">Has the patient received treatment for a urinary tract infection (UTI) in the past 14 days?</p>
        <select
          value={getInputValue(formData.m1600UtiTreatment)}
          onChange={(e) => handleInputChange('m1600UtiTreatment', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
          <option value="NA">Not applicable</option>
        </select>
      </div>

      <div className="form-group">
        <label>M1610 - Urinary Incontinence or Urinary Catheter Presence</label>
        <select
          value={getInputValue(formData.m1610UrinaryIncontinence)}
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
            value={getInputValue(formData.m1615IncontinenceTiming)}
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
          value={getInputValue(formData.m1620BowelIncontinence)}
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
          value={getInputValue(formData.m1630Ostomy)}
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
          value={getInputValue(formData.m1700CognitiveFunctioning)}
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
          value={getInputValue(formData.m1710WhenConfused)}
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
          value={getInputValue(formData.m1720WhenAnxious)}
          onChange={(e) => handleInputChange('m1720WhenAnxious', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">None of the time</option>
          <option value="1">Less often than daily</option>
          <option value="2">Daily, but not constantly</option>
          <option value="3">All of the time</option>
        </select>
      </div>

      <div className="form-group">
        <label>M1730 - Depression Screening</label>
        <p className="field-description">Has the patient been screened for depression?</p>
        <select
          value={getInputValue(formData.m1730DepressionScreening)}
          onChange={(e) => handleInputChange('m1730DepressionScreening', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
          <option value="NA">Not Applicable</option>
        </select>
      </div>

      <div className="form-group">
        <label>M1740 - Psychiatric Symptoms</label>
        <p className="field-description">Does the patient exhibit any psychiatric symptoms?</p>
        <select
          value={getInputValue(formData.m1740PsychiatricSymptoms)}
          onChange={(e) => handleInputChange('m1740PsychiatricSymptoms', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
          <option value="NA">Not Applicable</option>
        </select>
      </div>

      <div className="form-group">
        <label>M1745 - Disruptive Behavior Frequency</label>
        <p className="field-description">How often does the patient exhibit disruptive behaviors?</p>
        <select
          value={getInputValue(formData.m1745DisruptiveBehaviorFreq)}
          onChange={(e) => handleInputChange('m1745DisruptiveBehaviorFreq', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">Never</option>
          <option value="1">Less than once a month</option>
          <option value="2">Once a month</option>
          <option value="3">Several times a month</option>
          <option value="4">Several times a week</option>
          <option value="5">Daily</option>
          <option value="NA">Not Applicable</option>
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
        <p className="field-description">Was a drug regimen review completed since the last OASIS assessment?</p>
        <select
          value={getInputValue(formData.m2001DrugRegimenReview)}
          onChange={(e) => handleInputChange('m2001DrugRegimenReview', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
          <option value="NA">Not Applicable</option>
        </select>
      </div>

      <div className="form-group">
        <label>M2003 - Medication Follow-up</label>
        <p className="field-description">Was there a follow-up on medication issues identified in the drug regimen review?</p>
        <select
          value={getInputValue(formData.m2003MedicationFollowup)}
          onChange={(e) => handleInputChange('m2003MedicationFollowup', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
          <option value="NA">Not Applicable</option>
        </select>
      </div>

      <div className="form-group">
        <label>M2005 - Medication Intervention</label>
        <p className="field-description">Was any intervention made regarding identified medication issues?</p>
        <select
          value={getInputValue(formData.m2005MedicationIntervention)}
          onChange={(e) => handleInputChange('m2005MedicationIntervention', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
          <option value="NA">Not Applicable</option>
        </select>
      </div>

      <div className="form-group">
        <label>M2010 - High-Risk Drug Education</label>
        <p className="field-description">Was patient/caregiver educated about high-risk medications?</p>
        <select
          value={getInputValue(formData.m2010HighRiskDrugEducation)}
          onChange={(e) => handleInputChange('m2010HighRiskDrugEducation', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
          <option value="NA">Not Applicable</option>
        </select>
      </div>

      <div className="form-group">
        <label>M2015 - Drug Education Intervention</label>
        <p className="field-description">Was any drug education intervention provided?</p>
        <select
          value={getInputValue(formData.m2015DrugEducationIntervention)}
          onChange={(e) => handleInputChange('m2015DrugEducationIntervention', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
          <option value="NA">Not Applicable</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>M2020 - Management of Oral Medications</label>
        <p className="field-description">What was the patient's ability to manage oral medications?</p>
        <select
          value={getInputValue(formData.m2020OralMedicationManagement)}
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
        <p className="field-description">What was the patient's ability to manage injectable medications?</p>
        <select
          value={getInputValue(formData.m2030InjectableMedicationMgmt)}
          onChange={(e) => handleInputChange('m2030InjectableMedicationMgmt', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">Able to independently take correct medication</option>
          <option value="1">Able to take medication if prepared</option>
          <option value="2">Unable to take medication unless administered</option>
          <option value="NA">Not Applicable - No injectable medications</option>
        </select>
      </div>

      <div className="form-group">
        <label>M2040 - Prior Medication Management</label>
        <p className="field-description">What was the patient's ability to manage medications prior to the current illness, exacerbation, or injury?</p>
        <select
          value={getInputValue(formData.m2040PriorMedicationMgmt)}
          onChange={(e) => handleInputChange('m2040PriorMedicationMgmt', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="0">Able to independently take correct medication</option>
          <option value="1">Able to take medication if prepared</option>
          <option value="2">Unable to take medication unless administered</option>
          <option value="3">Not Applicable - No medications</option>
          <option value="NA">Not assessed</option>
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
          value={getInputValue(formData.m2310EmergentCare)}
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
            value={getInputValue(formData.m2410EmergentCareReason)}
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
          value={getInputValue(formData.o0350CovidVaccination)}
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
            value={getInputValue(formData.d0150Phq2Interest)}
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
            value={getInputValue(formData.d0150Phq2Depressed)}
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
                value={getInputValue(formData.d0150Phq9Q3)}
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
                value={getInputValue(formData.d0150Phq9Q4)}
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
                value={getInputValue(formData.d0150Phq9Q5)}
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
                value={getInputValue(formData.d0150Phq9Q6)}
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
                value={getInputValue(formData.d0150Phq9Q7)}
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
                value={getInputValue(formData.d0150Phq9Q8)}
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
                value={getInputValue(formData.d0150Phq9Q9)}
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

  // Section 10: Functional Abilities (GG Items)
  const renderSection10 = () => {
    // Helper to handle GG item changes (these are Map fields)
    const handleGGItemChange = (field, subField, value) => {
      setFormData(prev => {
        const currentValue = prev[field] || {};
        return {
          ...prev,
          [field]: {
            ...currentValue,
            [subField]: value
          }
        };
      });
    };

    const getGGValue = (field, subField) => {
      const fieldData = formData[field];
      if (!fieldData || typeof fieldData !== 'object') return '';
      return fieldData[subField] || '';
    };

    return (
      <div className="form-section">
        <h2>Section 10: Functional Abilities (GG Items)</h2>
        <p className="section-description">
          These items assess the patient's functional abilities and limitations in activities of daily living (ADL) and mobility.
        </p>
        
        <div className="form-group">
          <label>GG0100 - Prior Functioning: Everyday Activities</label>
          <p className="field-description">How well did the patient perform activities of daily living (ADL) and instrumental activities of daily living (IADL) prior to the current illness, exacerbation, or injury?</p>
          <select
            value={getGGValue('gg0100PriorFunctioning', 'overall')}
            onChange={(e) => handleGGItemChange('gg0100PriorFunctioning', 'overall', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="06">Independent - Patient completed all activities independently</option>
            <option value="05">Setup or clean-up assistance only</option>
            <option value="04">Supervision or touching assistance</option>
            <option value="03">Partial/moderate assistance</option>
            <option value="02">Substantial/maximal assistance</option>
            <option value="01">Dependent</option>
            <option value="88">Not applicable</option>
            <option value="NA">Not assessed</option>
          </select>
        </div>

        <div className="form-group">
          <label>GG0110 - Prior Device Use</label>
          <p className="field-description">Did the patient use any assistive devices or equipment prior to the current illness, exacerbation, or injury?</p>
          <select
            value={getGGValue('gg0110PriorDeviceUse', 'devices')}
            onChange={(e) => handleGGItemChange('gg0110PriorDeviceUse', 'devices', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="0">No</option>
            <option value="1">Yes</option>
            <option value="NA">Not assessed</option>
          </select>
        </div>

        <div className="form-group">
          <label>GG0130 - Self-Care</label>
          <p className="field-description">What was the patient's usual performance with self-care activities at discharge or during the last 3 days of the home health stay?</p>
          <select
            value={getGGValue('gg0130SelfCare', 'performance')}
            onChange={(e) => handleGGItemChange('gg0130SelfCare', 'performance', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="06">Independent - Patient completed all activities independently</option>
            <option value="05">Setup or clean-up assistance only</option>
            <option value="04">Supervision or touching assistance</option>
            <option value="03">Partial/moderate assistance</option>
            <option value="02">Substantial/maximal assistance</option>
            <option value="01">Dependent</option>
            <option value="07">Patient refused</option>
            <option value="09">Not applicable</option>
            <option value="88">Not assessed</option>
          </select>
        </div>

        <div className="form-group">
          <label>GG0170 - Mobility</label>
          <p className="field-description">What was the patient's usual performance with mobility activities at discharge or during the last 3 days of the home health stay?</p>
          <select
            value={getGGValue('gg0170Mobility', 'performance')}
            onChange={(e) => handleGGItemChange('gg0170Mobility', 'performance', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="06">Independent - Patient completed all activities independently</option>
            <option value="05">Setup or clean-up assistance only</option>
            <option value="04">Supervision or touching assistance</option>
            <option value="03">Partial/moderate assistance</option>
            <option value="02">Substantial/maximal assistance</option>
            <option value="01">Dependent</option>
            <option value="07">Patient refused</option>
            <option value="09">Not applicable</option>
            <option value="88">Not assessed</option>
          </select>
        </div>
      </div>
    );
  };

  // Section 12: Care Management
  const renderSection12 = () => {
    // Helper to handle assistance types (Map field)
    const handleAssistanceTypeChange = (type, value) => {
      setFormData(prev => {
        const currentTypes = prev.m2102AssistanceTypes || {};
        const updated = { ...currentTypes };
        if (value) {
          updated[type] = true;
        } else {
          delete updated[type];
        }
        return {
          ...prev,
          m2102AssistanceTypes: Object.keys(updated).length > 0 ? updated : null
        };
      });
    };

    const getAssistanceType = (type) => {
      const types = formData.m2102AssistanceTypes;
      if (!types || typeof types !== 'object') return false;
      return types[type] === true;
    };

    return (
      <div className="form-section">
        <h2>Section 12: Care Management</h2>
        
        <div className="form-group">
          <label>M2102 - Types of Assistance Received</label>
          <p className="field-description">Select all types of assistance the patient received during the assessment period:</p>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={getAssistanceType('personalCare')}
                onChange={(e) => handleAssistanceTypeChange('personalCare', e.target.checked)}
              />
              <span>Personal Care Assistance</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={getAssistanceType('household')}
                onChange={(e) => handleAssistanceTypeChange('household', e.target.checked)}
              />
              <span>Household Assistance</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={getAssistanceType('medical')}
                onChange={(e) => handleAssistanceTypeChange('medical', e.target.checked)}
              />
              <span>Medical/Nursing Assistance</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={getAssistanceType('therapy')}
                onChange={(e) => handleAssistanceTypeChange('therapy', e.target.checked)}
              />
              <span>Therapy Services</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={getAssistanceType('social')}
                onChange={(e) => handleAssistanceTypeChange('social', e.target.checked)}
              />
              <span>Social Work Services</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>M2110 - Frequency of Assistance</label>
          <p className="field-description">How often did the patient receive assistance during the assessment period?</p>
          <select
            value={getInputValue(formData.m2110AssistanceFrequency)}
            onChange={(e) => handleInputChange('m2110AssistanceFrequency', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="0">No assistance received</option>
            <option value="1">Less than daily</option>
            <option value="2">Daily</option>
            <option value="3">Multiple times per day</option>
            <option value="4">Continuous/24-hour care</option>
            <option value="NA">Not applicable</option>
          </select>
        </div>
      </div>
    );
  };

  // Section 17: Discharge Planning
  const renderSection17 = () => {
    // Helper to handle intervention synopsis (Map field)
    const handleInterventionChange = (field, value) => {
      setFormData(prev => {
        const current = prev.m2401InterventionSynopsis || {};
        return {
          ...prev,
          m2401InterventionSynopsis: {
            ...current,
            [field]: value
          }
        };
      });
    };

    const getInterventionValue = (field) => {
      const synopsis = formData.m2401InterventionSynopsis;
      if (!synopsis || typeof synopsis !== 'object') return '';
      return synopsis[field] || '';
    };

    return (
      <div className="form-section">
        <h2>Section 17: Discharge Planning</h2>
        
        <div className="form-group">
          <label>M2401 - Intervention Synopsis</label>
          <p className="field-description">Summary of interventions provided during the home health stay:</p>
          <div className="form-row">
            <div className="form-group">
              <label>Primary Intervention Focus</label>
              <input
                type="text"
                value={getInterventionValue('primaryFocus')}
                onChange={(e) => handleInterventionChange('primaryFocus', e.target.value)}
                placeholder="e.g., Wound care, Medication management"
              />
            </div>
            <div className="form-group">
              <label>Key Interventions</label>
              <textarea
                value={getInterventionValue('keyInterventions')}
                onChange={(e) => handleInterventionChange('keyInterventions', e.target.value)}
                rows="3"
                placeholder="Describe key interventions provided..."
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>M2410 - Discharge To</label>
          <p className="field-description">Where is the patient being discharged to?</p>
          <select
            value={getInputValue(formData.m2410DischargeTo)}
            onChange={(e) => handleInputChange('m2410DischargeTo', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="01">Home or self-care (routine discharge)</option>
            <option value="02">Home with home health services</option>
            <option value="03">Hospice - home</option>
            <option value="04">Hospice - medical facility</option>
            <option value="05">Discharged/transferred to a short-term general hospital</option>
            <option value="06">Discharged/transferred to a skilled nursing facility</option>
            <option value="07">Discharged/transferred to an intermediate care facility</option>
            <option value="08">Discharged/transferred to another type of institution</option>
            <option value="09">Left against medical advice</option>
            <option value="20">Expired</option>
            <option value="50">Discharged/transferred to another home health agency</option>
            <option value="NA">Not applicable</option>
          </select>
        </div>

        <div className="form-group">
          <label>M2420 - Discharge Disposition</label>
          <p className="field-description">What is the primary reason for discharge?</p>
          <select
            value={getInputValue(formData.m2420DischargeDisposition)}
            onChange={(e) => handleInputChange('m2420DischargeDisposition', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="01">Discharged to home or self-care</option>
            <option value="02">Discharged/transferred to another facility for inpatient care</option>
            <option value="03">Discharged/transferred to another facility for outpatient care</option>
            <option value="04">Discharged/transferred to another home health agency</option>
            <option value="05">Discharged/transferred to hospice</option>
            <option value="06">Patient expired</option>
            <option value="07">Discharged against medical advice</option>
            <option value="08">Discharged to home under care of organized home health service organization</option>
            <option value="09">Discharged/transferred to a court/law enforcement</option>
            <option value="20">Discharged/transferred to a psychiatric hospital</option>
            <option value="30">Still a patient</option>
            <option value="40">Discharged/transferred within this institution to a hospital-based Medicare approved swing bed</option>
            <option value="41">Discharged/transferred to a hospital-based Medicare approved swing bed in another institution</option>
            <option value="42">Discharged/transferred to a nursing facility certified under Medicaid but not certified under Medicare</option>
            <option value="43">Discharged/transferred to a psychiatric distinct part unit of a hospital</option>
            <option value="50">Discharged/transferred to a Critical Access Hospital (CAH)</option>
            <option value="NA">Not applicable</option>
          </select>
        </div>
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
          value={getInputValue(formData.m1041InfluenzaVaccinePeriod)}
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
          value={getInputValue(formData.m1046InfluenzaVaccineReceived)}
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
          value={getInputValue(formData.m1051PneumococcalVaccine)}
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
          {assessmentStatus && (
            <span className={`status-badge status-${assessmentStatus.toLowerCase()}`} style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginLeft: '12px',
              backgroundColor: assessmentStatus === 'APPROVED' || assessmentStatus === 'COMPLETED' ? '#10b981' : 
                             assessmentStatus === 'SUBMITTED' ? '#3b82f6' :
                             assessmentStatus === 'DRAFT' ? '#6b7280' :
                             assessmentStatus === 'REJECTED' ? '#ef4444' : '#f59e0b',
              color: 'white'
            }}>
              {assessmentStatus}
            </span>
          )}
          {isReadOnly && (
            <span style={{ marginLeft: '8px', color: '#6b7280', fontSize: '0.875rem' }}>
              (Read-Only)
            </span>
          )}
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
            
            {!isReadOnly && (
              <>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                
                {id && assessmentStatus !== 'SUBMITTED' && assessmentStatus !== 'APPROVED' && (
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={handleSubmit}
                    disabled={assessmentStatus === 'SUBMITTED'}
                  >
                    Submit for QA
                  </button>
                )}
              </>
            )}
            {isReadOnly && (
              <div style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', borderRadius: '4px', color: '#6b7280' }}>
                This assessment is {assessmentStatus} and cannot be edited.
              </div>
            )}
          </div>
          
          {/* QA Comments Section - Show for REJECTED assessments */}
          {assessmentStatus === 'REJECTED' && qaComments && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              backgroundColor: '#fef2f2',
              border: '2px solid #ef4444',
              borderRadius: '8px',
              borderLeft: '6px solid #ef4444'
            }}>
              <h3 style={{ 
                color: '#dc2626', 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Shield size={20} />
                QA Review Comments - Returned for Correction
              </h3>
              {reviewedBy && (
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '8px' }}>
                  Reviewed by: <strong>{reviewedBy}</strong>
                  {reviewedAt && ` on ${new Date(reviewedAt).toLocaleString()}`}
                </p>
              )}
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #fecaca',
                color: '#1f2937',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6'
              }}>
                {qaComments}
              </div>
              <p style={{ 
                color: '#dc2626', 
                fontSize: '0.875rem', 
                marginTop: '12px',
                fontStyle: 'italic'
              }}>
                Please review the comments above and make the necessary corrections before resubmitting.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* POC Creation Modal */}
      {showPOCModal && (
        <div className="modal-overlay" onClick={() => setShowPOCModal(false)}>
          <div className="modal-content poc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Plan of Care</h2>
              <button className="modal-close" onClick={() => setShowPOCModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body poc-form-content">
              <p className="poc-modal-info" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px', color: '#1976d2' }}>
                <strong>📋 Plan of Care Required</strong><br />
                Please complete the Plan of Care details below. Both OASIS and POC will be submitted together for QA review.
              </p>

              {/* Basic Information */}
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Patient *</label>
                    <select
                      name="patientId"
                      value={pocFormData.patientId || ''}
                      onChange={handlePOCChange}
                      required
                    >
                      <option value="">Select Patient</option>
                      {pocPatients.map(patient => (
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
                      value={pocFormData.episodeId || ''}
                      onChange={handlePOCChange}
                      required
                      disabled={!pocFormData.patientId}
                    >
                      <option value="">Select Episode</option>
                      {pocEpisodes.map(episode => (
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
                      value={pocFormData.startDate}
                      onChange={handlePOCChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Certification Period (days)</label>
                    <input
                      type="number"
                      name="certificationPeriodDays"
                      value={pocFormData.certificationPeriodDays || 60}
                      onChange={handlePOCChange}
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
                      value={pocFormData.primaryDiagnosisCode || ''}
                      onChange={handlePOCChange}
                      placeholder="e.g., I10"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Primary Diagnosis Description</label>
                    <input
                      type="text"
                      name="primaryDiagnosisDescription"
                      value={pocFormData.primaryDiagnosisDescription || ''}
                      onChange={handlePOCChange}
                    />
                  </div>
                </div>
              </div>

              {/* Visit Frequencies */}
              <div className="form-section">
                <div className="section-header">
                  <h3>Visit Frequencies *</h3>
                  <button
                    type="button"
                    className="btn-add"
                    onClick={() => addPOCArrayItem('frequencies', {
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
                {pocFormData.frequencies.length === 0 && (
                  <p className="form-hint">Please add at least one visit frequency</p>
                )}
                {pocFormData.frequencies.map((freq, index) => (
                  <div key={index} className="array-item-card">
                    <div className="array-item-header">
                      <h4>Frequency #{index + 1}</h4>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removePOCArrayItem('frequencies', index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Discipline *</label>
                        <select
                          value={freq.disciplineType || ''}
                          onChange={(e) => handlePOCArrayChange('frequencies', index, 'disciplineType', e.target.value)}
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
                        <label>Visits per Week *</label>
                        <input
                          type="number"
                          value={freq.visitsPerWeek || ''}
                          onChange={(e) => {
                            handlePOCArrayChange('frequencies', index, 'visitsPerWeek', e.target.value);
                            // Auto-calculate total visits
                            const visitsPerWeek = parseInt(e.target.value) || 0;
                            const numberOfWeeks = freq.numberOfWeeks || 0;
                            if (visitsPerWeek && numberOfWeeks) {
                              handlePOCArrayChange('frequencies', index, 'totalVisits', visitsPerWeek * numberOfWeeks);
                            }
                          }}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Number of Weeks *</label>
                        <input
                          type="number"
                          value={freq.numberOfWeeks || ''}
                          onChange={(e) => {
                            handlePOCArrayChange('frequencies', index, 'numberOfWeeks', e.target.value);
                            // Auto-calculate total visits
                            const visitsPerWeek = freq.visitsPerWeek || 0;
                            const numberOfWeeks = parseInt(e.target.value) || 0;
                            if (visitsPerWeek && numberOfWeeks) {
                              handlePOCArrayChange('frequencies', index, 'totalVisits', visitsPerWeek * numberOfWeeks);
                            }
                          }}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Total Visits</label>
                        <input
                          type="number"
                          value={freq.totalVisits || ''}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowPOCModal(false)}
                disabled={submittingPOC}
              >
                Cancel
              </button>
              <button 
                className="btn-secondary" 
                onClick={handleSubmitOASISOnly}
                disabled={submittingPOC || saving}
              >
                Submit OASIS Only
              </button>
              <button 
                className="btn-success" 
                onClick={handleSubmitOASISAndPOC}
                disabled={submittingPOC || saving || !pocFormData.frequencies || pocFormData.frequencies.length === 0}
              >
                {submittingPOC ? 'Submitting...' : 'Submit OASIS & POC for QA Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OasisForm;

