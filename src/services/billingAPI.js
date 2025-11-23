import api from './api';

const BILLING_BASE_URL = '/billing';

export const billingAPI = {
  // CRUD operations
  createClaim: (claimData) => api.post(`${BILLING_BASE_URL}/claims`, claimData),
  updateClaim: (id, claimData) => api.put(`${BILLING_BASE_URL}/claims/${id}`, claimData),
  getClaimById: (id) => api.get(`${BILLING_BASE_URL}/claims/${id}`),
  getAllClaims: () => api.get(`${BILLING_BASE_URL}/claims`),
  deleteClaim: (id) => api.delete(`${BILLING_BASE_URL}/claims/${id}`),

  // Get by relationships
  getClaimsByPatient: (patientId) => api.get(`${BILLING_BASE_URL}/claims/patient/${patientId}`),
  getClaimsByEpisode: (episodeId) => api.get(`${BILLING_BASE_URL}/claims/episode/${episodeId}`),
  getClaimsByStatus: (status) => api.get(`${BILLING_BASE_URL}/claims/status/${status}`),

  // Workflow actions
  submitClaim: (id) => api.post(`${BILLING_BASE_URL}/claims/${id}/submit`),
  markAsPaid: (id, paidAmount) => api.post(`${BILLING_BASE_URL}/claims/${id}/mark-paid`, null, {
    params: { paidAmount }
  }),
  markAsDenied: (id, denialReason) => api.post(`${BILLING_BASE_URL}/claims/${id}/mark-denied`, null, {
    params: { denialReason }
  }),
};

export default billingAPI;

