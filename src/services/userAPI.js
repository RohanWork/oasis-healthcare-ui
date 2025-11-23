import api from './api';

const USER_BASE_URL = '/users';

export const userAPI = {
  // User CRUD
  getAll: () => api.get(USER_BASE_URL),
  getById: (id) => api.get(`${USER_BASE_URL}/${id}`),
  create: (userData) => api.post(USER_BASE_URL, userData),
  update: (id, userData) => api.put(`${USER_BASE_URL}/${id}`, userData),
  delete: (id) => api.delete(`${USER_BASE_URL}/${id}`),

  // Get clinicians (RN, PT, OT, ST) for dropdowns
  getClinicians: () => api.get(`${USER_BASE_URL}/clinicians`),

  // User management
  assignOrganization: (userId, organizationId) =>
    api.put(`${USER_BASE_URL}/${userId}/assign-organization`, null, {
      params: { organizationId }
    }),
  
  assignRole: (userId, roleId) =>
    api.put(`${USER_BASE_URL}/${userId}/assign-role`, null, {
      params: { roleId }
    }),
};

export default userAPI;

