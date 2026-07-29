import api from './axiosInstance.js';

/**
 * Assessment API — thin wrappers around the /api/assessments endpoints.
 */

/** Submit a completed health assessment (all 4 sections). */
export const createAssessment = (payload) =>
  api.post('/assessments', payload).then((r) => r.data);

/** Fetch the authenticated user's assessment list (paginated). */
export const getAssessments = (params = {}) =>
  api.get('/assessments', { params }).then((r) => r.data);

/** Fetch a single assessment by ID. */
export const getAssessment = (id) =>
  api.get(`/assessments/${id}`).then((r) => r.data);

/** Update an existing assessment. */
export const updateAssessment = (id, payload) =>
  api.put(`/assessments/${id}`, payload).then((r) => r.data);

/** Delete an assessment. */
export const deleteAssessment = (id) =>
  api.delete(`/assessments/${id}`).then((r) => r.data);
