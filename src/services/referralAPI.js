import api from './api';

const REFERRAL_BASE_URL = '/referrals';

export const referralAPI = {
  getAll: () => api.get(REFERRAL_BASE_URL),
  getById: (id) => api.get(`${REFERRAL_BASE_URL}/${id}`),
  create: (referralData) => api.post(REFERRAL_BASE_URL, referralData),
  update: (id, referralData) => api.put(`${REFERRAL_BASE_URL}/${id}`, referralData),
  delete: (id) => api.delete(`${REFERRAL_BASE_URL}/${id}`),
  admit: (id) => api.post(`${REFERRAL_BASE_URL}/${id}/admit`),
};

export default referralAPI;

