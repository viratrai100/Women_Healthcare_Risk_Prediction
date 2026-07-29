import mongoose from 'mongoose';

/**
 * Stores a single AI risk prediction result for a patient.
 * Persists both the input payload and the full canonical AI response
 * so that report history can reconstruct the complete result at any time.
 */
const predictionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ── Input payload (raw form data sent to AI service) ──────────────────────
    inputData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // ── Core AI risk result ────────────────────────────────────────────────────
    riskScore: {
      type: Number, // 0–100
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      required: true,
    },
    confidence: {
      type: Number, // 0.0–1.0
      default: null,
    },

    // ── AI provider metadata ───────────────────────────────────────────────────
    provider: {
      type: String, // 'gemini' | 'grok' | 'ml'
    },
    modelVersion: {
      type: String,
    },

    // ── Plain-English summary ─────────────────────────────────────────────────
    summary: {
      type: String,
    },
    /** @deprecated use summary instead — kept for backward compatibility */
    recommendation: {
      type: String,
    },

    // ── Per-factor risk breakdown ──────────────────────────────────────────────
    riskFactors: [
      {
        factor:       String,
        contribution: Number, // % contribution to score
        description:  String,
      },
    ],

    // ── Per-disease risk breakdown (full AI output) ───────────────────────────
    diseaseRisks: [
      {
        disease:   String,
        riskScore: Number, // 0–100
        riskLevel: String, // 'low'|'moderate'|'high'|'critical'
        notes:     String,
      },
    ],

    // ── Prioritised recommendation actions ────────────────────────────────────
    recommendations: [
      {
        priority: String, // 'urgent'|'high'|'medium'|'low'
        category: String,
        action:   String,
      },
    ],
  },
  { timestamps: true }
);

// Fast dashboard queries: most recent prediction per user
predictionSchema.index({ user: 1, createdAt: -1 });

const Prediction = mongoose.model('Prediction', predictionSchema);
export default Prediction;
