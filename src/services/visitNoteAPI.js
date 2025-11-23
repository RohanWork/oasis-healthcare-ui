import api from './api';

const VISIT_NOTE_BASE_URL = '/visit-notes';

export const visitNoteAPI = {
  // CRUD operations
  create: (visitNoteData) => api.post(VISIT_NOTE_BASE_URL, visitNoteData),
  update: (id, visitNoteData) => api.put(`${VISIT_NOTE_BASE_URL}/${id}`, visitNoteData),
  getById: (id) => api.get(`${VISIT_NOTE_BASE_URL}/${id}`),
  getAll: () => api.get(VISIT_NOTE_BASE_URL),
  delete: (id) => api.delete(`${VISIT_NOTE_BASE_URL}/${id}`),

  // Get by relationships
  getByTaskId: (taskId) => api.get(`${VISIT_NOTE_BASE_URL}/task/${taskId}`),
  getByPatient: (patientId) => api.get(`${VISIT_NOTE_BASE_URL}/patient/${patientId}`),
  getByEpisode: (episodeId) => api.get(`${VISIT_NOTE_BASE_URL}/episode/${episodeId}`),
  getByClinician: (clinicianId) => api.get(`${VISIT_NOTE_BASE_URL}/clinician/${clinicianId}`),
  getByStatus: (status) => api.get(`${VISIT_NOTE_BASE_URL}/status/${status}`),

  // QA workflow
  submitForQA: (id) => api.post(`${VISIT_NOTE_BASE_URL}/${id}/submit`),
  approve: (id, qaComments) => api.post(`${VISIT_NOTE_BASE_URL}/${id}/approve`, null, {
    params: { qaComments }
  }),
  returnForCorrection: (id, correctionComments) => api.post(`${VISIT_NOTE_BASE_URL}/${id}/return`, null, {
    params: { correctionComments }
  }),

  // QA review
  getPendingQAReview: async () => {
    try {
      const response = await api.get(`${VISIT_NOTE_BASE_URL}/qa/pending`);
      // Ensure we return an array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching pending QA review visit notes:', error);
      // Return empty array on error
      return [];
    }
  },
};

export default visitNoteAPI;

