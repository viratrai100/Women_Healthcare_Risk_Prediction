import { Router } from 'express';
import protect from '../middleware/auth.js';
import {
  runPrediction,
  getPredictions,
  getPrediction,
} from '../controllers/prediction.controller.js';

const router = Router();

// All prediction routes require a valid JWT
router.use(protect);

/**
 * POST /api/predictions
 * Submit a full health assessment and receive an AI risk prediction.
 * Body: { personal, medical, lifestyle, symptoms }
 */
router.post('/', runPrediction);

/**
 * GET /api/predictions
 * List the authenticated user's prediction history (paginated).
 * Query params: ?page=1&limit=10
 */
router.get('/', getPredictions);

/**
 * GET /api/predictions/:id
 * Fetch a single prediction by ID (owner-only).
 */
router.get('/:id', getPrediction);

export default router;
