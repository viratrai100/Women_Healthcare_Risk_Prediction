import api from './axiosInstance.js';

export const predictionAPI = {
  run:    (data) => api.post('/predictions', data),
  list:   (params) => api.get('/predictions', { params }),
  getOne: (id) => api.get(`/predictions/${id}`),
};
