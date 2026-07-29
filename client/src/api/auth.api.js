import api from './axiosInstance.js';

export const authAPI = {
  register:      (data)  => api.post('/auth/register', data),
  login:         (data)  => api.post('/auth/login', data),
  logout:        ()      => api.post('/auth/logout'),
  forgotPassword:(data)  => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
};

export const userAPI = {
  getProfile:    ()     => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  deleteAccount: ()     => api.delete('/users/account'),
};
