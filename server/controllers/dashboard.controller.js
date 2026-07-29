/**
 * Dashboard Controller
 *
 * Provides a single aggregated endpoint that the dashboard page uses
 * to drive all its widgets with real data.
 *
 * GET /api/dashboard
 *   Returns:
 *     latestPrediction  — most recent full prediction (or null)
 *     scoreHistory      — last 6 predictions as { label, score } for trend chart
 *     totalAssessments  — count of all predictions for this user
 *     bmi               — computed from the latest assessment's biometric data
 *     latestAssessedAt  — ISO timestamp of the most recent prediction
 */

import Prediction from '../models/Prediction.js';
import { sendSuccess } from '../utils/response.js';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard
// ─────────────────────────────────────────────────────────────────────────────
export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Run both queries in parallel
    const [latest, history, total] = await Promise.all([
      // Most recent prediction with full detail
      Prediction.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .select('-rawProviderResponse -__v'),

      // Last 6 predictions for the score trend chart (oldest → newest)
      Prediction.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('riskScore createdAt'),

      // Total count
      Prediction.countDocuments({ user: userId }),
    ]);

    // Build score history in chronological order (oldest first) for chart
    const scoreHistory = [...history]
      .reverse()
      .map((p, idx) => ({
        label: formatMonthLabel(p.createdAt, idx, history.length),
        score: p.riskScore,
        date:  p.createdAt,
      }));

    // Derive BMI from the latest assessment's personal data
    let bmi = null;
    if (latest?.inputData?.personal) {
      const { height, weight } = latest.inputData.personal;
      if (height && weight) {
        const h = height / 100;
        bmi = Math.round((weight / (h * h)) * 10) / 10;
      }
    }

    sendSuccess(res, 200, 'Dashboard summary fetched.', {
      hasData:          !!latest,
      totalAssessments: total,
      latestAssessedAt: latest?.createdAt ?? null,
      bmi,
      // Latest prediction data (null when user has no assessments)
      latestPrediction: latest
        ? {
            _id:             latest._id,
            riskScore:       latest.riskScore,
            riskLevel:       latest.riskLevel,
            confidence:      latest.confidence,
            provider:        latest.provider,
            summary:         latest.summary,
            riskFactors:     latest.riskFactors     ?? [],
            diseaseRisks:    latest.diseaseRisks    ?? [],
            recommendations: latest.recommendations ?? [],
            inputData:       latest.inputData,
            createdAt:       latest.createdAt,
          }
        : null,
      scoreHistory,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a short human-readable label for a history entry.
 * Uses the month abbreviation from the date.
 * If multiple entries fall in the same month, disambiguates with the day.
 */
function formatMonthLabel(date, idx, total) {
  const d = new Date(date);
  // Simple month abbreviation
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
