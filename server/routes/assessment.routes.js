import { Router } from 'express';
import protect from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { assessmentRules } from '../validators/assessment.validator.js';
import {
  createAssessment,
  getAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
} from '../controllers/assessment.controller.js';

const router = Router();

// All assessment routes require authentication
router.use(protect);

// POST   /api/assessments          — submit full assessment
router.post('/', assessmentRules, validate, createAssessment);

// GET    /api/assessments          — list own assessments (?page=1&limit=10)
router.get('/', getAssessments);

// GET    /api/assessments/:id      — single assessment
router.get('/:id', getAssessment);

// PUT    /api/assessments/:id      — update sections
router.put('/:id', assessmentRules, validate, updateAssessment);

// DELETE /api/assessments/:id
router.delete('/:id', deleteAssessment);

export default router;
