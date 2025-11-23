import api from './api';

const TASK_BASE_URL = '/tasks';

export const taskAPI = {
  // Task CRUD
  create: (taskData) => api.post(TASK_BASE_URL, taskData),
  getAll: () => api.get(TASK_BASE_URL),
  getById: (id) => api.get(`${TASK_BASE_URL}/${id}`),
  update: (id, taskData) => api.put(`${TASK_BASE_URL}/${id}`, taskData),
  delete: (id) => api.delete(`${TASK_BASE_URL}/${id}`),

  // Auto-generation
  generateFromPOC: (pocId, requestData) => 
    api.post(`${TASK_BASE_URL}/generate-from-poc`, {
      planOfCareId: pocId,
      ...requestData
    }),

  // My Tasks
  getMyTasks: () => api.get(`${TASK_BASE_URL}/my-tasks`),
  getMyTasksByDateRange: (startDate, endDate) => 
    api.get(`${TASK_BASE_URL}/my-tasks/by-date-range`, {
      params: { startDate, endDate }
    }),

  // Clinician Tasks
  getClinicianTasks: (clinicianId) => 
    api.get(`${TASK_BASE_URL}/clinician/${clinicianId}`),

  // Patient Tasks
  getByPatient: (patientId) => 
    api.get(`${TASK_BASE_URL}/patient/${patientId}`),

  // Date Range Queries
  getByDateRange: (startDate, endDate) => 
    api.get(`${TASK_BASE_URL}/by-date-range`, {
      params: { startDate, endDate }
    }),

  // Special Queries
  getDueToday: () => api.get(`${TASK_BASE_URL}/due-today`),
  getOverdue: () => api.get(`${TASK_BASE_URL}/overdue`),

  // Task Actions
  reschedule: (id, newDate, reason) => 
    api.put(`${TASK_BASE_URL}/${id}/reschedule`, null, {
      params: { newDate, reason }
    }),
  
  assign: (id, clinicianId) => 
    api.put(`${TASK_BASE_URL}/${id}/assign`, null, {
      params: { clinicianId }
    }),
  
  complete: (id, completionNotes) => 
    api.put(`${TASK_BASE_URL}/${id}/complete`, null, {
      params: { completionNotes }
    }),
  
  cancel: (id, reason) => 
    api.put(`${TASK_BASE_URL}/${id}/cancel`, null, {
      params: { reason }
    }),
  
  start: (id) => 
    api.put(`${TASK_BASE_URL}/${id}/start`),
};

export default taskAPI;
