import { Router } from 'express';
import authRoutes       from './auth.routes.js';
import userRoutes       from './user.routes.js';
import assessmentRoutes from './assessment.routes.js';
import predictionRoutes from './prediction.routes.js';
import reportRoutes     from './report.routes.js';
import dashboardRoutes  from './dashboard.routes.js';

const router = Router();

// ── Mount routes ──────────────────────────────────────────────────────────────
router.use('/auth',        authRoutes);
router.use('/users',       userRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/predictions', predictionRoutes);
router.use('/reports',     reportRoutes);
router.use('/dashboard',   dashboardRoutes);

// ── API root info ─────────────────────────────────────────────────────────────
router.get('/', (_req, res) => {
  res.json({ success: true, message: "AI Women's Healthcare Risk Prediction API v1" });
});

export default router;
