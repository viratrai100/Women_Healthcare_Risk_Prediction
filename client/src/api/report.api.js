import api from './axiosInstance.js';

/**
 * Report History API
 * Mirrors GET/DELETE /api/reports on the backend.
 *
 * list()     — paginated list with optional search & filters
 * getOne()   — full detail of a single report
 * remove()   — permanently delete a report by ID
 */
export const reportAPI = {
  /**
   * @param {{ page?, limit?, riskLevel?, from?, to?, search? }} params
   */
  list:   (params = {}) => api.get('/reports', { params }),

  /**
   * @param {string} id — MongoDB ObjectId
   */
  getOne: (id)          => api.get(`/reports/${id}`),

  /**
   * @param {string} id — MongoDB ObjectId
   */
  remove: (id)          => api.delete(`/reports/${id}`),
};
