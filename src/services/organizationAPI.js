import api from './api';

const ORGANIZATION_BASE_URL = '/organizations';

export const organizationAPI = {
  create: (orgData) => api.post(ORGANIZATION_BASE_URL, orgData),
  update: (id, orgData) => api.put(`${ORGANIZATION_BASE_URL}/${id}`, orgData),
  getAll: () => api.get(ORGANIZATION_BASE_URL),
  getById: (id) => api.get(`${ORGANIZATION_BASE_URL}/${id}`),
  delete: (id) => api.delete(`${ORGANIZATION_BASE_URL}/${id}`),
};

export default organizationAPI;

