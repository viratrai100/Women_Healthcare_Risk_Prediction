import api from './axiosInstance.js';

/**
 * Dashboard API
 * Single endpoint that returns an aggregated summary for the dashboard page.
 */
export const dashboardAPI = {
  /**
   * Fetch live dashboard summary data.
   * Returns: { hasData, totalAssessments, latestAssessedAt, bmi,
   *             latestPrediction, scoreHistory }
   */
  getSummary: () => api.get('/dashboard'),
};
