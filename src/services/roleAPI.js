import api from './api';

const ROLE_BASE_URL = '/roles';

export const roleAPI = {
  getAll: () => api.get(ROLE_BASE_URL),
  getById: (id) => api.get(`${ROLE_BASE_URL}/${id}`),
};

export default roleAPI;

