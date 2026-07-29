import { Router } from 'express';
import protect from '../middleware/auth.js';
import { getReports, getReport, deleteReport } from '../controllers/report.controller.js';

const router = Router();

// All report routes require a valid JWT
router.use(protect);

/**
 * GET /api/reports
 * List the authenticated user's report history (paginated).
 * Query params: ?page=1&limit=10&riskLevel=high&from=2025-01-01&to=2025-12-31&search=diabetes
 */
router.get('/', getReports);

/**
 * GET /api/reports/:id
 * Fetch a single report / prediction in full detail (owner only).
 */
router.get('/:id', getReport);

/**
 * DELETE /api/reports/:id
 * Permanently delete a report (owner only).
 */
router.delete('/:id', deleteReport);

export default router;
