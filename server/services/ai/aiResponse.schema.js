/**
 * aiResponse.schema.js
 *
 * The canonical JSON structure that EVERY AI provider must return.
 * This contract decouples the controller layer from any specific provider.
 *
 * ─── Canonical Response Shape ────────────────────────────────────────────────
 * {
 *   provider      : string        — which AI provider produced this result
 *   modelVersion  : string        — model or endpoint version string
 *   requestId     : string        — unique identifier for tracing / debugging
 *   generatedAt   : string (ISO)  — server-side timestamp of when the response was built
 *   riskScore     : number 0–100  — overall health risk score
 *   riskLevel     : 'low' | 'moderate' | 'high' | 'critical'
 *   confidence    : number 0–1    — provider confidence in the prediction
 *   riskFactors   : RiskFactor[]  — individual contributing factors
 *   diseaseRisks  : DiseaseRisk[] — per-disease risk breakdown
 *   recommendations: Recommendation[] — personalised health recommendations
 *   summary       : string        — one-paragraph plain-English summary
 *   rawProviderResponse: any      — raw provider payload (retained for auditing)
 * }
 *
 * ─── Sub-Types ───────────────────────────────────────────────────────────────
 * RiskFactor    : { factor: string, contribution: number, description: string }
 * DiseaseRisk   : { disease: string, riskScore: number, riskLevel: string, notes: string }
 * Recommendation: { priority: 'urgent'|'high'|'medium'|'low', category: string, action: string }
 */

import { randomUUID } from 'crypto';

// ── Risk level classification ─────────────────────────────────────────────────

/**
 * Derives a riskLevel string from a numeric score.
 * @param {number} score — 0 to 100
 * @returns {'low'|'moderate'|'high'|'critical'}
 */
export function classifyRiskLevel(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'moderate';
  return 'low';
}

// ── Canonical response builder ────────────────────────────────────────────────

/**
 * Constructs a validated canonical AI response object.
 * All providers must call this to guarantee a consistent shape.
 *
 * @param {object} opts
 * @param {string}   opts.provider            — provider name (e.g. 'gemini')
 * @param {string}   opts.modelVersion        — model version string
 * @param {number}   opts.riskScore           — 0–100
 * @param {number}   [opts.confidence]        — 0–1 (default 1.0)
 * @param {Array}    [opts.riskFactors]        — []
 * @param {Array}    [opts.diseaseRisks]       — []
 * @param {Array}    [opts.recommendations]    — []
 * @param {string}   [opts.summary]           — plain-English summary
 * @param {any}      [opts.rawProviderResponse] — raw provider payload
 * @returns {object} Canonical AI response
 */
export function buildCanonicalResponse({
  provider,
  modelVersion,
  riskScore,
  confidence = 1.0,
  riskFactors = [],
  diseaseRisks = [],
  recommendations = [],
  summary = '',
  rawProviderResponse = null,
}) {
  // ── Validate inputs ──────────────────────────────────────────────────────────
  if (typeof riskScore !== 'number' || riskScore < 0 || riskScore > 100) {
    throw new Error(`[aiResponse] riskScore must be a number between 0 and 100. Got: ${riskScore}`);
  }
  if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
    throw new Error(`[aiResponse] confidence must be a number between 0 and 1. Got: ${confidence}`);
  }
  if (!provider || typeof provider !== 'string') {
    throw new Error('[aiResponse] provider must be a non-empty string.');
  }

  const roundedScore = Math.round(riskScore * 10) / 10;

  return {
    // ── Meta ──────────────────────────────────────────────────────────────────
    provider,
    modelVersion:  modelVersion || 'unknown',
    requestId:     randomUUID(),
    generatedAt:   new Date().toISOString(),

    // ── Core risk ─────────────────────────────────────────────────────────────
    riskScore:  roundedScore,
    riskLevel:  classifyRiskLevel(roundedScore),
    confidence: Math.round(confidence * 1000) / 1000,

    // ── Detail arrays ─────────────────────────────────────────────────────────
    riskFactors:     validateRiskFactors(riskFactors),
    diseaseRisks:    validateDiseaseRisks(diseaseRisks),
    recommendations: validateRecommendations(recommendations),

    // ── Text ──────────────────────────────────────────────────────────────────
    summary: summary || generateDefaultSummary(roundedScore, provider),

    // ── Raw audit payload ─────────────────────────────────────────────────────
    rawProviderResponse,
  };
}

// ── Sub-array validators ───────────────────────────────────────────────────────

function validateRiskFactors(factors) {
  return (factors || []).map((f) => ({
    factor:       String(f.factor       || ''),
    contribution: Number(f.contribution ?? 0),
    description:  String(f.description  || ''),
  }));
}

function validateDiseaseRisks(risks) {
  return (risks || []).map((r) => ({
    disease:   String(r.disease   || ''),
    riskScore: Number(r.riskScore ?? 0),
    riskLevel: classifyRiskLevel(Number(r.riskScore ?? 0)),
    notes:     String(r.notes     || ''),
  }));
}

const VALID_PRIORITIES = ['urgent', 'high', 'medium', 'low'];

function validateRecommendations(recs) {
  return (recs || []).map((r) => ({
    priority: VALID_PRIORITIES.includes(r.priority) ? r.priority : 'medium',
    category: String(r.category || 'General'),
    action:   String(r.action   || ''),
  }));
}

// ── Default summary text ───────────────────────────────────────────────────────

function generateDefaultSummary(score, provider) {
  const level = classifyRiskLevel(score);
  const levelText = {
    low:      'Your overall health risk is LOW. Continue maintaining your current healthy habits.',
    moderate: 'Your overall health risk is MODERATE. Some lifestyle adjustments are recommended.',
    high:     'Your overall health risk is HIGH. Please consult a healthcare professional promptly.',
    critical: 'Your overall health risk is CRITICAL. Immediate medical consultation is strongly advised.',
  };
  return `[${provider.toUpperCase()}] Score ${score}/100 — ${levelText[level]}`;
}
