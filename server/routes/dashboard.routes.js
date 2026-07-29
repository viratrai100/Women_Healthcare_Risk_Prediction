import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import protect from '../middleware/auth.js';

const router = Router();

// All dashboard routes require authentication
router.use(protect);

// GET /api/dashboard  — aggregated summary for the dashboard page
router.get('/', getDashboardSummary);

export default router;
