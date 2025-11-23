import api from './api';

/**
 * OASIS Assessment API Service
 */

// Create new OASIS assessment
export const createOasisAssessment = async (assessmentData) => {
  const response = await api.post('/oasis', assessmentData);
  return response.data;
};

// Update OASIS assessment (manual save)
export const updateOasisAssessment = async (id, assessmentData) => {
  const response = await api.put(`/oasis/${id}`, assessmentData);
  return response.data;
};

// Auto-save OASIS assessment (called every 15 seconds)
export const autoSaveOasisAssessment = async (id, assessmentData) => {
  const response = await api.post(`/oasis/${id}/auto-save`, assessmentData);
  return response.data;
};

// Submit OASIS assessment for QA review
export const submitOasisForQA = async (id) => {
  const response = await api.post(`/oasis/${id}/submit`);
  return response.data;
};

// QA Review - Approve or Reject
export const reviewOasisAssessment = async (reviewData) => {
  const response = await api.post('/oasis/qa/review', reviewData);
  return response.data;
};

// Lock OASIS assessment
export const lockOasisAssessment = async (id) => {
  const response = await api.post(`/oasis/${id}/lock`);
  return response.data;
};

// Get OASIS assessment by ID
export const getOasisAssessment = async (id) => {
  const response = await api.get(`/oasis/${id}`);
  return response.data;
};

// Get all OASIS assessments for a patient
export const getOasisAssessmentsByPatient = async (patientId) => {
  const response = await api.get(`/oasis/patient/${patientId}`);
  return response.data;
};

// Get all OASIS assessments for an episode
export const getOasisAssessmentsByEpisode = async (episodeId) => {
  const response = await api.get(`/oasis/episode/${episodeId}`);
  return response.data;
};

// Get pending QA reviews
export const getPendingQAReviews = async () => {
  try {
    const response = await api.get('/oasis/qa/pending');
    // Ensure we return an array
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching pending QA reviews:', error);
    // Return empty array on error
    return [];
  }
};

// Get incomplete assessments (DRAFT)
export const getIncompleteAssessments = async () => {
  const response = await api.get('/oasis/incomplete');
  return response.data;
};

// Get my rejected assessments (for RN/PT users)
export const getMyRejectedAssessments = async () => {
  const response = await api.get('/oasis/my/rejected');
  // Return the data directly (it's already an array)
  return response.data;
};

// Delete OASIS assessment
export const deleteOasisAssessment = async (id) => {
  await api.delete(`/oasis/${id}`);
};

