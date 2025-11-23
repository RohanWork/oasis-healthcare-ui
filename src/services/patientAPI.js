import api from './api';

export const patientAPI = {
  // Get all patients
  getAll: () => api.get('/patients'),

  // Get patient by ID
  getById: (id) => api.get(`/patients/${id}`),

  // Create new patient
  create: (data) => api.post('/patients', data),

  // Update patient
  update: (id, data) => api.put(`/patients/${id}`, data),

  // Delete patient
  delete: (id) => api.delete(`/patients/${id}`),

  // Search patients
  search: (searchTerm) => api.get(`/patients/search?searchTerm=${searchTerm}`),

  // Get patients by status
  getByStatus: (status) => api.get(`/patients/status/${status}`),

  // Get patient statistics
  getStats: () => api.get('/patients/stats'),
};

export const episodeAPI = {
  // Get all episodes
  getAll: () => api.get('/episodes'),

  // Get episode by ID
  getById: (id) => api.get(`/episodes/${id}`),

  // Get episodes by patient
  getByPatient: (patientId) => api.get(`/episodes/patient/${patientId}`),

  // Create new episode
  create: (data) => api.post('/episodes', data),

  // Update episode
  update: (id, data) => api.put(`/episodes/${id}`, data),

  // Delete episode
  delete: (id) => api.delete(`/episodes/${id}`),

  // Get expiring episodes
  getExpiring: (daysAhead = 14) => api.get(`/episodes/expiring?daysAhead=${daysAhead}`),

  // Episode closure workflow
  recertify: (id, newCertificationStartDate, certificationPeriod = 60) => 
    api.post(`/episodes/${id}/recertify`, null, {
      params: { newCertificationStartDate, certificationPeriod }
    }),
  
  discharge: (id, dischargeReason, dischargeDisposition) =>
    api.post(`/episodes/${id}/discharge`, null, {
      params: { dischargeReason, dischargeDisposition }
    }),
  
  archive: (id) => api.post(`/episodes/${id}/archive`),
};

export default { patientAPI, episodeAPI };

