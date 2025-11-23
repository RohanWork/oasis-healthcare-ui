import api from './api';

const INSURANCE_BASE_URL = '/insurances';

export const insuranceAPI = {
  getByPatient: (patientId) => api.get(`${INSURANCE_BASE_URL}/patient/${patientId}`),
  getPrimaryByPatient: (patientId) => api.get(`${INSURANCE_BASE_URL}/patient/${patientId}/primary`),
};

export default insuranceAPI;

