/**
 * Complete OASIS-E1 API Service
 * Handles all 300+ fields from official CMS OASIS-E1 document
 */
import api from './api';

const OASIS_BASE_URL = '/oasis-complete';

/**
 * Create new OASIS assessment
 */
export const createOasisAssessment = async (assessmentData) => {
  const response = await api.post(OASIS_BASE_URL, assessmentData);
  return response.data;
};

/**
 * Update existing OASIS assessment
 */
export const updateOasisAssessment = async (id, assessmentData) => {
  const response = await api.put(`${OASIS_BASE_URL}/${id}`, assessmentData);
  return response.data;
};

/**
 * Auto-save OASIS assessment (called every 15 seconds)
 */
export const autoSaveOasisAssessment = async (id, assessmentData) => {
  const response = await api.post(`${OASIS_BASE_URL}/${id}/auto-save`, assessmentData);
  return response.data;
};

/**
 * Get OASIS assessment by ID
 */
export const getOasisAssessment = async (id) => {
  const response = await api.get(`${OASIS_BASE_URL}/${id}`);
  return response.data;
};

/**
 * Get all OASIS assessments for a patient
 */
export const getOasisAssessmentsByPatient = async (patientId) => {
  const response = await api.get(`${OASIS_BASE_URL}/patient/${patientId}`);
  return response.data;
};

/**
 * Get my rejected assessments (for RN/PT users)
 */
export const getMyRejectedAssessments = async () => {
  const response = await api.get(`${OASIS_BASE_URL}/my/rejected`);
  return response.data;
};

/**
 * Submit OASIS assessment for QA review
 */
export const submitOasisForQA = async (id) => {
  const response = await api.post(`${OASIS_BASE_URL}/${id}/submit`);
  return response.data;
};

/**
 * QA Review - Approve or Reject
 */
export const reviewOasisAssessment = async (reviewData) => {
  const response = await api.post(`${OASIS_BASE_URL}/qa/review`, reviewData);
  return response.data;
};

/**
 * Delete OASIS assessment
 */
export const deleteOasisAssessment = async (id) => {
  await api.delete(`${OASIS_BASE_URL}/${id}`);
};

/**
 * Calculate which fields should be skipped based on skip logic
 */
export const calculateSkippedFields = (formData) => {
  const skipped = [];

  // M1005: Skip if M1000 = "NA"
  if (formData.m1000InpatientFacility === 'NA') {
    skipped.push('m1005InpatientDischargeDate');
  }

  // M1307-M1324: Skip if M1306 = "0" (no pressure ulcers)
  if (formData.m1306PressureUlcer === '0') {
    skipped.push(
      'm1307OldestStage2Date',
      'm1308Stage1Count',
      'm1308Stage2Count',
      'm1308Stage3Count',
      'm1308Stage4Count',
      'm1311UnstageableDressing',
      'm1311UnstageableSlough',
      'm1311UnstageableDeepTissue',
      'm1322Stage3Count',
      'm1322Stage4Count',
      'm1324ProblematicStage',
      'm1320PressureUlcerStatus'
    );
  }

  // M1332-M1334: Skip if M1330 = "0" (no stasis ulcers)
  if (formData.m1330StasisUlcer === '0') {
    skipped.push('m1332StasisUlcerCount', 'm1334StasisUlcerStatus');
  }

  // M1342: Skip if M1340 = "0" (no surgical wound)
  if (formData.m1340SurgicalWound === '0') {
    skipped.push('m1342SurgicalWoundStatus');
  }

  // M1615: Skip if M1610 = "0" (continent)
  if (formData.m1610UrinaryIncontinence === '0') {
    skipped.push('m1615IncontinenceTiming');
  }

  // M2410: Skip if M2310 = "0" (no emergent care)
  if (formData.m2310EmergentCare === '0') {
    skipped.push('m2410EmergentCareReason');
  }

  // GG Discharge columns: Skip at admission (SOC/ROC)
  if (formData.assessmentType === 'SOC' || formData.assessmentType === 'ROC') {
    // Skip all discharge columns in GG0130 and GG0170
    skipped.push(
      'gg0130aEatingDischarge',
      'gg0130bOralDischarge',
      'gg0130cToiletingDischarge',
      'gg0130eShowerDischarge',
      'gg0130fUpperDressDischarge',
      'gg0130gLowerDressDischarge',
      'gg0130hFootwearDischarge',
      'gg0170aRollDischarge',
      'gg0170bSitLyingDischarge',
      'gg0170cLyingSitDischarge',
      'gg0170dSitStandDischarge',
      'gg0170eTransferDischarge',
      'gg0170fToiletDischarge',
      'gg0170gCarDischarge',
      'gg0170iWalk10Discharge',
      'gg0170jWalk50Discharge',
      'gg0170kWalk150Discharge',
      'gg0170lWalkUnevenDischarge',
      'gg0170mStep1Discharge',
      'gg0170nStep4Discharge',
      'gg0170oStep12Discharge',
      'gg0170pPickupDischarge',
      'gg0170qWheel50Discharge',
      'gg0170rWheel150Discharge'
    );
  }

  // GG Admission columns: Skip at discharge
  if (formData.assessmentType === 'DISCHARGE') {
    // Skip all admission columns in GG0130 and GG0170
    skipped.push(
      'gg0130aEatingAdmission',
      'gg0130bOralAdmission',
      'gg0130cToiletingAdmission',
      'gg0130eShowerAdmission',
      'gg0130fUpperDressAdmission',
      'gg0130gLowerDressAdmission',
      'gg0130hFootwearAdmission',
      'gg0170aRollAdmission',
      'gg0170bSitLyingAdmission',
      'gg0170cLyingSitAdmission',
      'gg0170dSitStandAdmission',
      'gg0170eTransferAdmission',
      'gg0170fToiletAdmission',
      'gg0170gCarAdmission',
      'gg0170iWalk10Admission',
      'gg0170jWalk50Admission',
      'gg0170kWalk150Admission',
      'gg0170lWalkUnevenAdmission',
      'gg0170mStep1Admission',
      'gg0170nStep4Admission',
      'gg0170oStep12Admission',
      'gg0170pPickupAdmission',
      'gg0170qWheel50Admission',
      'gg0170rWheel150Admission'
    );
  }

  return skipped;
};

/**
 * Calculate completion percentage (excluding skipped fields)
 */
export const calculateCompletionPercentage = (formData, skippedFields) => {
  const totalFields = 300; // Total OASIS-E1 fields
  const skippedCount = skippedFields.length;
  const requiredFields = totalFields - skippedCount;

  let filledFields = 0;

  // Count filled fields (simplified - actual implementation would check all 300 fields)
  Object.keys(formData).forEach((key) => {
    if (!skippedFields.includes(key) && formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
      filledFields++;
    }
  });

  if (requiredFields === 0) return 100;
  return Math.min(100, Math.round((filledFields * 100) / requiredFields));
};

export default {
  createOasisAssessment,
  updateOasisAssessment,
  autoSaveOasisAssessment,
  getOasisAssessment,
  getOasisAssessmentsByPatient,
  getMyRejectedAssessments,
  submitOasisForQA,
  reviewOasisAssessment,
  deleteOasisAssessment,
  calculateSkippedFields,
  calculateCompletionPercentage,
};

