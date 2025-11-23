import api from './api';

const POC_BASE_URL = '/plan-of-care';

export const planOfCareAPI = {
  // Generate POC from OASIS
  generateFromOASIS: async (oasisId) => {
    const response = await api.post(`${POC_BASE_URL}/generate/${oasisId}`);
    return response.data;
  },

  // Create POC manually
  create: async (pocData) => {
    const response = await api.post(POC_BASE_URL, pocData);
    return response.data;
  },

  // Update POC
  update: async (id, pocData) => {
    const response = await api.put(`${POC_BASE_URL}/${id}`, pocData);
    return response.data;
  },

  // Get POC by ID
  getById: async (id) => {
    const response = await api.get(`${POC_BASE_URL}/${id}`);
    return response.data;
  },

  // Get all POCs (role-based filtering applied on backend)
  getAll: async () => {
    const response = await api.get(POC_BASE_URL);
    return response.data;
  },

  // Get POCs by patient
  getByPatient: async (patientId) => {
    const response = await api.get(`${POC_BASE_URL}/patient/${patientId}`);
    return response.data;
  },

  // Get POCs by status
  getByStatus: async (status) => {
    const response = await api.get(`${POC_BASE_URL}/status/${status}`);
    return response.data;
  },

  // Submit POC for approval
  submitForApproval: async (id) => {
    const response = await api.post(`${POC_BASE_URL}/${id}/submit`);
    return response.data;
  },

  // Approve POC
  approve: async (id) => {
    const response = await api.post(`${POC_BASE_URL}/${id}/approve`);
    return response.data;
  },

  // Reject POC
  reject: async (id, reason) => {
    const response = await api.post(`${POC_BASE_URL}/${id}/reject`, null, {
      params: { reason }
    });
    return response.data;
  },

  // Delete POC
  delete: async (id) => {
    const response = await api.delete(`${POC_BASE_URL}/${id}`);
    return response.data;
  }
};

export default planOfCareAPI;

