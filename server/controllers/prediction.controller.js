/**
 * Prediction Controller
 * Orchestrates AI risk prediction: validate input → call AI service → persist result.
 */

import Prediction from '../models/Prediction.js';
import { getAiPrediction, AiServiceError } from '../services/ai/index.js';
import { sendSuccess, createError }        from '../utils/response.js';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/predictions
// Run a new AI risk prediction for the authenticated user.
// ─────────────────────────────────────────────────────────────────────────────
export const runPrediction = async (req, res, next) => {
  try {
    const inputData = req.body; // expects { personal, medical, lifestyle, symptoms }

    // Call the AI service (provider selected via AI_PROVIDER env var)
    const aiResult = await getAiPrediction(inputData);

    // Persist the full canonical AI result to MongoDB
    const prediction = await Prediction.create({
      user:        req.user.id,
      inputData,

      // Core risk
      riskScore:   aiResult.riskScore,
      riskLevel:   aiResult.riskLevel,
      confidence:  aiResult.confidence,

      // Provider metadata
      provider:     aiResult.provider,
      modelVersion: `${aiResult.provider}@${aiResult.modelVersion}`,

      // Text
      summary:        aiResult.summary,
      recommendation: aiResult.summary, // backward-compat alias

      // Detail arrays
      riskFactors: (aiResult.riskFactors || []).map((f) => ({
        factor:       f.factor,
        contribution: f.contribution,
        description:  f.description,
      })),
      diseaseRisks: (aiResult.diseaseRisks || []).map((d) => ({
        disease:   d.disease,
        riskScore: d.riskScore,
        riskLevel: d.riskLevel,
        notes:     d.notes,
      })),
      recommendations: (aiResult.recommendations || []).map((r) => ({
        priority: r.priority,
        category: r.category,
        action:   r.action,
      })),
    });

    sendSuccess(res, 201, 'Prediction completed successfully.', {
      prediction: {
        _id:         prediction._id,
        riskScore:   prediction.riskScore,
        riskLevel:   prediction.riskLevel,
      },
      aiResult,
    });
  } catch (err) {
    if (err instanceof AiServiceError) {
      return next(createError(err.message, err.statusCode));
    }
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/predictions
// Fetch paginated prediction history for the authenticated user.
// ─────────────────────────────────────────────────────────────────────────────
export const getPredictions = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [predictions, total] = await Promise.all([
      Prediction.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-inputData -__v'),
      Prediction.countDocuments({ user: req.user.id }),
    ]);

    sendSuccess(res, 200, 'Predictions fetched.', {
      predictions,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/predictions/:id
// Fetch a single prediction — only the owner can access it.
// ─────────────────────────────────────────────────────────────────────────────
export const getPrediction = async (req, res, next) => {
  try {
    const prediction = await Prediction.findOne({
      _id:  req.params.id,
      user: req.user.id,
    }).select('-__v');

    if (!prediction) return next(createError('Prediction not found.', 404));

    sendSuccess(res, 200, 'Prediction fetched.', { prediction });
  } catch (err) {
    next(err);
  }
};
