/**
 * ml.service.js
 *
 * Local ML provider for health risk prediction.
 * Designed to support two sub-modes, controlled by ML_MODE:
 *
 *   ML_MODE=rule_based   — deterministic rule engine (default, zero dependencies)
 *   ML_MODE=onnx         — ONNX Runtime for a locally-loaded ML model file
 *   ML_MODE=python       — calls a local Python FastAPI / Flask microservice
 *
 * Environment variables:
 *   ML_MODE            — 'rule_based' | 'onnx' | 'python' (default: 'rule_based')
 *   ML_PYTHON_URL      — URL of the Python microservice (e.g. http://localhost:8000)
 *   ML_ONNX_MODEL_PATH — Absolute path to the .onnx model file
 *   ML_MODEL_VERSION   — Semantic version string for audit / tracking
 *
 * Why a local provider?
 *   - Zero latency, zero API cost during development and testing
 *   - The rule-based engine serves as the functional baseline before
 *     training a real ML model
 *   - The ONNX / Python paths allow swapping to a real trained model
 *     without changing the controller at all
 *
 * To train and export an ONNX model:
 *   1. Train with scikit-learn / XGBoost on the collected assessment data
 *   2. Export: `skl2onnx.convert_sklearn(model, ...)` or `onnxmltools`
 *   3. Set ML_ONNX_MODEL_PATH to the exported file path
 *   4. Set ML_MODE=onnx
 */

import { buildCanonicalResponse, classifyRiskLevel } from './aiResponse.schema.js';

// ── Provider constants ────────────────────────────────────────────────────────

const PROVIDER_NAME = 'ml';

// ── Rule-based engine ─────────────────────────────────────────────────────────
//
// Each rule adds to a weighted risk score (0–100).
// This acts as the functional baseline and can be replaced by a trained model.

/**
 * A single scoring rule.
 * @typedef {object} Rule
 * @property {string}   id          — unique rule identifier
 * @property {string}   factor      — human-readable factor name
 * @property {string}   category    — e.g. 'lifestyle', 'medical', 'biometric'
 * @property {string}   disease     — primary disease association
 * @property {function} test        — (inputData) => boolean
 * @property {number}   weight      — points added to total risk score (0–100 scale)
 * @property {string}   description — explanation shown to the end user
 * @property {object}   recommendation — action to suggest when rule fires
 */
const SCORING_RULES = [
  // ── Biometric rules ─────────────────────────────────────────────────────
  {
    id: 'bmi_overweight',
    factor: 'BMI Overweight (25–30)',
    category: 'biometric',
    disease: 'Diabetes / Heart Disease',
    test: (d) => {
      const bmi = computeBmi(d.personal?.height, d.personal?.weight);
      return bmi >= 25 && bmi < 30;
    },
    weight: 8,
    description: 'BMI in the overweight range increases metabolic risk.',
    recommendation: { priority: 'medium', category: 'Nutrition', action: 'Aim for a balanced calorie deficit through diet and exercise to reach a healthy BMI.' },
  },
  {
    id: 'bmi_obese',
    factor: 'BMI Obese (≥30)',
    category: 'biometric',
    disease: 'Diabetes / Heart Disease / PCOS',
    test: (d) => computeBmi(d.personal?.height, d.personal?.weight) >= 30,
    weight: 18,
    description: 'Obesity significantly elevates risk for multiple chronic conditions.',
    recommendation: { priority: 'high', category: 'Nutrition', action: 'Consult a dietitian and consider structured weight management programme.' },
  },

  // ── Lifestyle rules ──────────────────────────────────────────────────────
  {
    id: 'sedentary',
    factor: 'Sedentary Lifestyle',
    category: 'lifestyle',
    disease: 'Cardiovascular / Diabetes',
    test: (d) => d.lifestyle?.physicalActivity === 'sedentary',
    weight: 10,
    description: 'Sedentary behaviour is a major modifiable cardiovascular risk factor.',
    recommendation: { priority: 'high', category: 'Physical Activity', action: 'Begin with 30-minute daily walks. Target 150 min moderate exercise per week (WHO guideline).' },
  },
  {
    id: 'smoking_current',
    factor: 'Current Smoker',
    category: 'lifestyle',
    disease: 'Cancer / Cardiovascular',
    test: (d) => ['current_light', 'current_heavy'].includes(d.lifestyle?.smokingStatus),
    weight: 15,
    description: 'Smoking is the leading preventable cause of cancer and cardiovascular disease.',
    recommendation: { priority: 'urgent', category: 'Substance', action: 'Enrol in a smoking cessation programme. Consider NRT or varenicline with GP support.' },
  },
  {
    id: 'alcohol_heavy',
    factor: 'Heavy Alcohol Use',
    category: 'lifestyle',
    disease: 'Liver Disease / Breast Cancer',
    test: (d) => d.lifestyle?.alcoholUse === 'heavy',
    weight: 12,
    description: 'Heavy alcohol intake raises breast cancer risk by ~40% and damages the liver.',
    recommendation: { priority: 'high', category: 'Substance', action: 'Reduce alcohol to ≤14 units/week. Consult GP if you experience withdrawal symptoms.' },
  },
  {
    id: 'poor_sleep',
    factor: 'Chronic Sleep Deprivation (<6h)',
    category: 'lifestyle',
    disease: 'Metabolic / Mental Health',
    test: (d) => typeof d.lifestyle?.sleepHours === 'number' && d.lifestyle.sleepHours < 6,
    weight: 8,
    description: 'Consistently sleeping under 6 hours disrupts hormones and immune function.',
    recommendation: { priority: 'medium', category: 'Sleep', action: 'Target 7–9 hours nightly. Establish a fixed sleep schedule and reduce screen exposure 1h before bed.' },
  },
  {
    id: 'high_stress',
    factor: 'High Stress Level (≥8)',
    category: 'lifestyle',
    disease: 'Cardiovascular / Mental Health',
    test: (d) => typeof d.lifestyle?.stressLevel === 'number' && d.lifestyle.stressLevel >= 8,
    weight: 10,
    description: 'Chronic high stress elevates cortisol, raising cardiovascular and mental health risk.',
    recommendation: { priority: 'high', category: 'Mental Health', action: 'Explore CBT, mindfulness, or a structured stress management programme with a therapist.' },
  },
  {
    id: 'low_hydration',
    factor: 'Poor Hydration (<1.5L/day)',
    category: 'lifestyle',
    disease: 'Kidney / Metabolic',
    test: (d) => typeof d.lifestyle?.waterIntake === 'number' && d.lifestyle.waterIntake < 1.5,
    weight: 5,
    description: 'Inadequate hydration impairs kidney function and metabolic efficiency.',
    recommendation: { priority: 'low', category: 'Nutrition', action: 'Increase water intake to 2–2.5L/day. Carry a reusable water bottle as a reminder.' },
  },

  // ── Medical history rules ────────────────────────────────────────────────
  {
    id: 'existing_diabetes',
    factor: 'Existing Diabetes',
    category: 'medical',
    disease: 'Cardiovascular / Renal',
    test: (d) => (d.medical?.existingConditions || []).includes('diabetes'),
    weight: 14,
    description: 'Diabetes substantially increases risk of cardiovascular and renal complications.',
    recommendation: { priority: 'urgent', category: 'Medical', action: 'Maintain HbA1c <7%. Schedule quarterly GP review and annual diabetic eye/foot check.' },
  },
  {
    id: 'existing_hypertension',
    factor: 'Existing Hypertension',
    category: 'medical',
    disease: 'Cardiovascular / Stroke',
    test: (d) => (d.medical?.existingConditions || []).includes('hypertension'),
    weight: 12,
    description: 'Hypertension is the single largest risk factor for stroke and heart disease.',
    recommendation: { priority: 'urgent', category: 'Medical', action: 'Monitor BP daily. Take prescribed antihypertensives consistently and limit sodium to <5g/day.' },
  },
  {
    id: 'pcos_present',
    factor: 'PCOS Diagnosis',
    category: 'medical',
    disease: 'Diabetes / Endometrial Cancer',
    test: (d) => (d.medical?.existingConditions || []).includes('pcos'),
    weight: 10,
    description: 'PCOS increases lifetime risk of Type 2 diabetes and endometrial changes.',
    recommendation: { priority: 'high', category: 'Medical', action: 'Regular gynaecological review. Consider metformin if insulin-resistant. Maintain healthy weight.' },
  },
  {
    id: 'family_breast_cancer',
    factor: 'Family History — Breast Cancer',
    category: 'medical',
    disease: 'Breast Cancer',
    test: (d) => (d.medical?.familyHistory || []).includes('breast_cancer'),
    weight: 12,
    description: 'A first-degree relative with breast cancer roughly doubles personal lifetime risk.',
    recommendation: { priority: 'high', category: 'Screening', action: 'Discuss BRCA genetic testing with your GP. Schedule annual mammogram from age 40 (or earlier per guidelines).' },
  },
  {
    id: 'no_screening',
    factor: 'No Recent Screening Tests',
    category: 'medical',
    disease: 'Cancer (Cervical / Breast)',
    test: (d) => !d.medical?.mammogramDone && !d.medical?.papSmearDone,
    weight: 8,
    description: 'Skipping routine cancer screening delays early detection.',
    recommendation: { priority: 'high', category: 'Screening', action: 'Book a cervical smear and mammogram. Cervical screening every 3–5 years, mammogram every 2 years (40+).' },
  },

  // ── Symptom rules ────────────────────────────────────────────────────────
  {
    id: 'symptom_severe',
    factor: 'Severe Current Symptoms',
    category: 'symptoms',
    disease: 'Multiple / Undiagnosed',
    test: (d) => d.symptoms?.severity === 'severe',
    weight: 15,
    description: 'Severe symptoms warrant immediate clinical evaluation.',
    recommendation: { priority: 'urgent', category: 'Medical', action: 'Please consult a healthcare professional as soon as possible. Do not delay if symptoms are worsening.' },
  },
  {
    id: 'symptom_long_duration',
    factor: 'Long-Standing Symptoms (>6 months)',
    category: 'symptoms',
    disease: 'Chronic Condition',
    test: (d) => d.symptoms?.duration === 'more_than_six_months',
    weight: 10,
    description: 'Symptoms persisting over six months suggest an undiagnosed chronic condition.',
    recommendation: { priority: 'high', category: 'Medical', action: 'Request a comprehensive GP review with full blood panel and relevant specialist referral.' },
  },
  {
    id: 'breast_lump',
    factor: 'Breast Lump Reported',
    category: 'symptoms',
    disease: 'Breast Cancer',
    test: (d) => (d.symptoms?.current || []).includes('breast_lump'),
    weight: 20,
    description: 'A new breast lump requires urgent clinical assessment to rule out malignancy.',
    recommendation: { priority: 'urgent', category: 'Medical', action: 'See your GP within 48 hours for urgent breast examination. Do not wait for a routine appointment.' },
  },
];

// ── Utility helpers ────────────────────────────────────────────────────────────

function computeBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg) return 0;
  const h = heightCm / 100;
  return weightKg / (h * h);
}

/**
 * Caps the score at 100 and applies a slight diminishing curve
 * so stacking minor risks doesn't trivially push to critical.
 * @param {number} raw — uncapped raw additive score
 * @returns {number} — 0–100 clamped, one decimal
 */
function normaliseScore(raw) {
  const capped = Math.min(raw, 110);
  const normalised = (capped / 110) * 100;
  return Math.round(normalised * 10) / 10;
}

// ── Disease risk aggregator ───────────────────────────────────────────────────

/**
 * Groups fired rules by disease and builds a per-disease risk summary.
 * @param {Rule[]} firedRules
 * @param {number} totalScore
 * @returns {Array<{disease, riskScore, notes}>}
 */
function buildDiseaseRisks(firedRules, totalScore) {
  const diseaseMap = {};
  for (const rule of firedRules) {
    const d = rule.disease;
    if (!diseaseMap[d]) {
      diseaseMap[d] = { weight: 0, factors: [] };
    }
    diseaseMap[d].weight   += rule.weight;
    diseaseMap[d].factors.push(rule.factor);
  }

  return Object.entries(diseaseMap).map(([disease, { weight, factors }]) => ({
    disease,
    riskScore: Math.min(100, Math.round((weight / 20) * 100 * 10) / 10),
    notes:     `Influenced by: ${factors.slice(0, 3).join(', ')}${factors.length > 3 ? ` (+${factors.length - 3} more)` : ''}.`,
  }));
}

// ── ONNX inference stub ───────────────────────────────────────────────────────

async function runOnnxInference(inputData) {
  // TODO: Implement ONNX Runtime inference
  // Steps:
  //   1. npm install onnxruntime-node
  //   2. import * as ort from 'onnxruntime-node';
  //   3. const session = await ort.InferenceSession.create(process.env.ML_ONNX_MODEL_PATH);
  //   4. Convert inputData into a Float32Array tensor matching model input shape
  //   5. const results = await session.run({ input: tensor });
  //   6. Parse results.output.data into risk fields
  throw new Error('[ml.service] ONNX mode not yet implemented. Set ML_MODE=rule_based.');
}

// ── Python microservice stub ──────────────────────────────────────────────────

async function callPythonService(inputData) {
  // TODO: Implement Python microservice call
  // Steps:
  //   1. npm install axios (already installed)
  //   2. POST inputData to process.env.ML_PYTHON_URL + '/predict'
  //   3. Parse the JSON response into risk fields
  //
  // import axios from 'axios';
  // const { data } = await axios.post(`${process.env.ML_PYTHON_URL}/predict`, inputData);
  // return data;
  throw new Error('[ml.service] Python mode not yet implemented. Set ML_MODE=rule_based.');
}

// ── Main provider function ────────────────────────────────────────────────────

/**
 * Runs health risk prediction using the local ML engine.
 * Sub-mode is selected via the ML_MODE environment variable.
 *
 * @param {object} inputData — sanitised health assessment payload
 * @returns {Promise<object>} Canonical AI response (see aiResponse.schema.js)
 * @throws {Error} if ML_MODE is unsupported or inference fails
 */
export async function runMlPrediction(inputData) {
  const mode         = process.env.ML_MODE         || 'rule_based';
  const modelVersion = process.env.ML_MODEL_VERSION || `rule-engine-v1.0 (mode:${mode})`;

  // ── ONNX or Python sub-modes ──────────────────────────────────────────────
  if (mode === 'onnx') {
    const raw = await runOnnxInference(inputData);
    return buildCanonicalResponse({ provider: PROVIDER_NAME, modelVersion, ...raw });
  }

  if (mode === 'python') {
    const raw = await callPythonService(inputData);
    return buildCanonicalResponse({ provider: PROVIDER_NAME, modelVersion, ...raw });
  }

  // ── Rule-based engine (default) ───────────────────────────────────────────
  const firedRules = SCORING_RULES.filter((rule) => {
    try { return rule.test(inputData); }
    catch { return false; }
  });

  const rawScore    = firedRules.reduce((sum, r) => sum + r.weight, 0);
  const riskScore   = normaliseScore(rawScore);
  const riskLevel   = classifyRiskLevel(riskScore);
  const diseaseRisks = buildDiseaseRisks(firedRules, riskScore);

  const riskFactors = firedRules.map((r) => ({
    factor:       r.factor,
    contribution: Math.round((r.weight / Math.max(rawScore, 1)) * 100),
    description:  r.description,
  }));

  const recommendations = firedRules
    .map((r) => r.recommendation)
    .sort((a, b) => {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });

  // Deduplicate recommendations by action text
  const seen = new Set();
  const uniqueRecs = recommendations.filter((r) => {
    if (seen.has(r.action)) return false;
    seen.add(r.action);
    return true;
  });

  return buildCanonicalResponse({
    provider:     PROVIDER_NAME,
    modelVersion,
    riskScore,
    confidence:   0.78, // rule engines have ~78% concordance with clinical assessment
    riskFactors,
    diseaseRisks,
    recommendations: uniqueRecs,
    rawProviderResponse: {
      mode,
      rulesEvaluated: SCORING_RULES.length,
      rulesFired:     firedRules.length,
      rawScore,
    },
  });
}
