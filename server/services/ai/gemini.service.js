/**
 * gemini.service.js
 *
 * Production-ready Google Gemini integration for AI Women's Healthcare Risk Prediction.
 *
 * Environment variables:
 *   GEMINI_API_KEY  — Google AI Studio API key  (required)
 *   GEMINI_MODEL    — Model ID                  (default: gemini-1.5-pro)
 *
 * Flow:
 *   runGeminiPrediction(inputData)
 *     → buildSystemInstruction()   — role + output contract
 *     → buildUserPrompt(inputData) — structured patient data narrative
 *     → callGeminiApi()            — SDK call with JSON response mode + retry
 *     → extractJsonFromResponse()  — pull + parse JSON from model text
 *     → validateGeminiJson()       — assert all required fields are present
 *     → buildCanonicalResponse()   — normalise into project-wide contract
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { buildCanonicalResponse, classifyRiskLevel } from './aiResponse.schema.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER_NAME  = 'gemini';
const DEFAULT_MODEL  = 'gemini-1.5-pro';

/** Diseases the model MUST evaluate — drives both the prompt and post-parse validation. */
const REQUIRED_DISEASES = [
  'Diabetes',
  'Anemia',
  'Hypertension',
  'Heart Disease',
  'PCOS',
  'Pregnancy Complications',
  'Thyroid Disorder',
  'Obesity',
];

/** Max API call attempts before giving up (initial + retries). */
const MAX_ATTEMPTS = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Safety settings — allow clinical content through
// ─────────────────────────────────────────────────────────────────────────────

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ─────────────────────────────────────────────────────────────────────────────
// System instruction
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemInstruction() {
  return `You are an expert clinical AI assistant specialising in women's preventive healthcare and risk assessment.

Your task is to analyse a complete patient health assessment and return a structured JSON risk prediction.

CRITICAL RULES:
1. Return ONLY a single valid JSON object — no markdown fences, no explanation, no preamble.
2. All riskScore values MUST be integers between 0 and 100.
3. All confidence values MUST be decimals between 0.0 and 1.0.
4. You MUST evaluate all 8 specified diseases, even if the risk is low (score 0–10).
5. riskLevel for each disease MUST be one of: "low", "moderate", "high", "critical".
6. Recommendations MUST be clinically actionable and personalised to the patient data.
7. priority MUST be one of: "urgent", "high", "medium", "low".
8. Do NOT guess data not provided. Acknowledge missing data in the notes field.
9. The overallHealthScore is a holistic wellness score (100 = perfect health, 0 = critical).

EXACT JSON STRUCTURE TO RETURN:
{
  "overallHealthScore": <integer 0-100>,
  "riskLevel": <"low"|"moderate"|"high"|"critical">,
  "confidence": <decimal 0.0-1.0>,
  "summary": "<2-3 sentence plain English summary of the patient's overall risk profile>",
  "diseaseRisks": [
    {
      "disease": "<disease name>",
      "riskScore": <integer 0-100>,
      "riskLevel": <"low"|"moderate"|"high"|"critical">,
      "keyFactors": ["<factor 1>", "<factor 2>"],
      "notes": "<one sentence clinical explanation>"
    }
  ],
  "riskFactors": [
    {
      "factor": "<factor name>",
      "contribution": <integer 1-100 representing % contribution>,
      "description": "<brief clinical explanation>"
    }
  ],
  "recommendations": [
    {
      "priority": <"urgent"|"high"|"medium"|"low">,
      "category": "<category e.g. Nutrition, Exercise, Screening, Medication, Mental Health>",
      "action": "<specific, actionable recommendation>"
    }
  ]
}

The diseaseRisks array MUST contain exactly these 8 diseases in this order:
${REQUIRED_DISEASES.map((d, i) => `${i + 1}. ${d}`).join('\n')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// User prompt builder — converts structured form data into a rich narrative
// ─────────────────────────────────────────────────────────────────────────────

function buildUserPrompt(inputData) {
  const { personal = {}, medical = {}, lifestyle = {}, symptoms = {} } = inputData;

  // ── BMI calculation ────────────────────────────────────────────────────────
  let bmiInfo = '';
  if (personal.height && personal.weight) {
    const h   = personal.height / 100;
    const bmi = (personal.weight / (h * h)).toFixed(1);
    const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obese';
    bmiInfo   = `BMI: ${bmi} kg/m² (${cat})`;
  }

  // ── Format arrays cleanly ──────────────────────────────────────────────────
  const fmt = (arr) => (Array.isArray(arr) && arr.length > 0) ? arr.join(', ') : 'None reported';

  return `Please perform a comprehensive health risk assessment for the following patient:

═══════════════════════════════════════════
SECTION 1 — PERSONAL & BIOMETRIC DATA
═══════════════════════════════════════════
Age:               ${personal.age ?? 'Not provided'}
Date of Birth:     ${personal.dateOfBirth ?? 'Not provided'}
Height:            ${personal.height ? `${personal.height} cm` : 'Not provided'}
Weight:            ${personal.weight ? `${personal.weight} kg` : 'Not provided'}
${bmiInfo ? `${bmiInfo}` : ''}
Blood Group:       ${personal.bloodGroup ?? 'Unknown'}
Marital Status:    ${personal.maritalStatus ?? 'Not provided'}
Occupation:        ${personal.occupation ?? 'Not provided'}
Ethnicity:         ${personal.ethnicity ?? 'Not provided'}
Pregnancy Status:  ${personal.pregnancyStatus ?? 'Not provided'}
Menopausal Status: ${personal.menopausalStatus ?? 'Not provided'}

═══════════════════════════════════════════
SECTION 2 — MEDICAL HISTORY
═══════════════════════════════════════════
Existing Conditions:   ${fmt(medical.existingConditions)}
Family History:        ${fmt(medical.familyHistory)}
Current Medications:   ${fmt(medical.currentMedications)}
Allergies:             ${fmt(medical.allergies)}
Previous Surgeries:    ${fmt(medical.previousSurgeries)}
Last Menstrual Period: ${medical.lastMenstrualPeriod ?? 'Not provided'}
Cycle Length:          ${medical.cycleLength ? `${medical.cycleLength} days` : 'Not provided'}
Cycle Regularity:      ${medical.cycleRegularity ?? 'Not provided'}
Last Checkup Date:     ${medical.lastCheckupDate ?? 'Not provided'}
Mammogram Done:        ${medical.mammogramDone === true ? 'Yes' : medical.mammogramDone === false ? 'No' : 'Not provided'}
Pap Smear Done:        ${medical.papSmearDone === true ? 'Yes' : medical.papSmearDone === false ? 'No' : 'Not provided'}
Bone Density Test:     ${medical.bonesDensityTestDone === true ? 'Yes' : medical.bonesDensityTestDone === false ? 'No' : 'Not provided'}

═══════════════════════════════════════════
SECTION 3 — LIFESTYLE
═══════════════════════════════════════════
Smoking Status:            ${lifestyle.smokingStatus ?? 'Not provided'}
Alcohol Use:               ${lifestyle.alcoholUse ?? 'Not provided'}
Physical Activity Level:   ${lifestyle.physicalActivity ?? 'Not provided'}
Activity Frequency:        ${lifestyle.activityFrequency != null ? `${lifestyle.activityFrequency} days/week` : 'Not provided'}
Diet Type:                 ${lifestyle.dietType ?? 'Not provided'}
Fruit & Veg Servings:      ${lifestyle.fruitVegServings != null ? `${lifestyle.fruitVegServings} servings/day` : 'Not provided'}
Processed Food Frequency:  ${lifestyle.processedFoodFrequency ?? 'Not provided'}
Water Intake:              ${lifestyle.waterIntake != null ? `${lifestyle.waterIntake} L/day` : 'Not provided'}
Sleep Duration:            ${lifestyle.sleepHours != null ? `${lifestyle.sleepHours} hours/night` : 'Not provided'}
Sleep Quality:             ${lifestyle.sleepQuality ?? 'Not provided'}
Stress Level:              ${lifestyle.stressLevel != null ? `${lifestyle.stressLevel}/10` : 'Not provided'}
Screen Time:               ${lifestyle.screenTimeHours != null ? `${lifestyle.screenTimeHours} hours/day` : 'Not provided'}

═══════════════════════════════════════════
SECTION 4 — CURRENT SYMPTOMS
═══════════════════════════════════════════
Current Symptoms: ${fmt(symptoms.current)}
Symptom Severity: ${symptoms.severity ?? 'Not reported'}
Symptom Duration: ${symptoms.duration ?? 'Not reported'}
Additional Notes: ${symptoms.additionalNotes ?? 'None'}

═══════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════
Based on the above patient data, return your JSON risk prediction.
Remember: evaluate ALL 8 diseases, return ONLY valid JSON, no markdown.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON extraction — handles model wrapping text with or without code fences
// ─────────────────────────────────────────────────────────────────────────────

function extractJsonFromResponse(text) {
  if (!text) throw new Error('Gemini returned an empty response.');

  // Strip markdown code fences if present
  let clean = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/,           '')
    .trim();

  // Find the outermost JSON object boundaries
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error(`No JSON object found in Gemini response. Raw text: ${text.slice(0, 200)}`);
  }

  const jsonStr = clean.slice(start, end + 1);

  try {
    return JSON.parse(jsonStr);
  } catch (parseErr) {
    throw new Error(`Gemini JSON parse failed: ${parseErr.message}. Raw snippet: ${jsonStr.slice(0, 300)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Response validation — ensures the model honoured the required structure
// ─────────────────────────────────────────────────────────────────────────────

function validateGeminiJson(parsed) {
  const errors = [];

  // Overall score
  if (typeof parsed.overallHealthScore !== 'number') {
    errors.push('Missing or non-numeric overallHealthScore');
  }

  // Disease risks array
  if (!Array.isArray(parsed.diseaseRisks) || parsed.diseaseRisks.length === 0) {
    errors.push('Missing or empty diseaseRisks array');
  } else {
    const returnedDiseases = parsed.diseaseRisks.map((d) => d.disease?.toLowerCase() ?? '');
    for (const required of REQUIRED_DISEASES) {
      const found = returnedDiseases.some((d) => d.includes(required.toLowerCase().split(' ')[0]));
      if (!found) errors.push(`Missing disease risk entry for: ${required}`);
    }
  }

  // Recommendations
  if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
    errors.push('Missing or empty recommendations array');
  }

  if (errors.length > 0) {
    throw new Error(`Gemini response failed validation:\n  • ${errors.join('\n  • ')}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core API call with retry logic
// ─────────────────────────────────────────────────────────────────────────────

async function callGeminiApi({ genAI, modelName, systemInstruction, userPrompt, attempt = 1 }) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: {
      temperature:     0.15,   // near-deterministic for medical output
      topP:            0.95,
      topK:            40,
      maxOutputTokens: 4096,
    },
    safetySettings: SAFETY_SETTINGS,
  });

  let lastError;

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    try {
      console.log(`[gemini.service] Attempt ${i}/${MAX_ATTEMPTS} — calling ${modelName}`);
      const result   = await model.generateContent(userPrompt);
      const response = result.response;

      // Check finish reason
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
        throw new Error(`Gemini generation stopped unexpectedly: ${finishReason}`);
      }

      const text = response.text();
      return { text, usage: response.usageMetadata };
    } catch (err) {
      lastError = err;
      // Exponential back-off: 1s, 2s, 4s
      if (i < MAX_ATTEMPTS) {
        const waitMs = Math.pow(2, i - 1) * 1000;
        console.warn(`[gemini.service] Attempt ${i} failed: ${err.message}. Retrying in ${waitMs}ms…`);
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
  }

  throw new Error(`Gemini API failed after ${MAX_ATTEMPTS} attempts. Last error: ${lastError?.message}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical response mapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ensures every one of the 8 required diseases appears in diseaseRisks,
 * filling in a default low-risk entry for any Gemini omitted.
 */
function ensureAllDiseases(diseaseRisks) {
  const result = [...(diseaseRisks || [])];

  for (const required of REQUIRED_DISEASES) {
    const key   = required.toLowerCase().split(' ')[0];
    const found = result.some((d) => (d.disease ?? '').toLowerCase().includes(key));
    if (!found) {
      result.push({
        disease:    required,
        riskScore:  5,
        riskLevel:  'low',
        keyFactors: ['Insufficient data'],
        notes:      'Risk could not be fully assessed from the provided data.',
      });
    }
  }

  return result;
}

function mapToCanonical(parsed, modelName, usage) {
  const healthScore = Math.min(100, Math.max(0, Math.round(parsed.overallHealthScore ?? 50)));

  const diseaseRisks = ensureAllDiseases(parsed.diseaseRisks).map((d) => ({
    disease:   d.disease   ?? '',
    riskScore: Math.min(100, Math.max(0, Math.round(d.riskScore ?? 0))),
    riskLevel: d.riskLevel ?? classifyRiskLevel(d.riskScore ?? 0),
    notes:     d.notes ?? (Array.isArray(d.keyFactors) ? d.keyFactors.join('; ') : ''),
  }));

  const riskFactors = (parsed.riskFactors ?? []).map((f) => ({
    factor:       f.factor       ?? '',
    contribution: Math.min(100, Math.max(0, Math.round(f.contribution ?? 0))),
    description:  f.description  ?? '',
  }));

  const recommendations = (parsed.recommendations ?? []).map((r) => ({
    priority: ['urgent', 'high', 'medium', 'low'].includes(r.priority) ? r.priority : 'medium',
    category: r.category ?? 'General',
    action:   r.action   ?? '',
  }));

  return {
    healthScore,
    confidence:      Math.min(1, Math.max(0, parseFloat(parsed.confidence ?? 0.85))),
    summary:         parsed.summary ?? '',
    diseaseRisks,
    riskFactors,
    recommendations,
    tokenUsage:      usage ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main exported function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs a full health risk prediction via Google Gemini.
 *
 * @param {object} inputData — { personal, medical, lifestyle, symptoms }
 * @returns {Promise<object>} Canonical AI response (aiResponse.schema.js)
 * @throws {Error} on missing API key, API failure, or invalid model output
 */
export async function runGeminiPrediction(inputData) {
  const apiKey    = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  // ── Guard: API key must be set ────────────────────────────────────────────
  if (!apiKey) {
    throw new Error(
      '[gemini.service] GEMINI_API_KEY is not set. ' +
      'Add it to your .env file. Get a key at https://aistudio.google.com/app/apikey'
    );
  }

  // ── Initialise SDK ────────────────────────────────────────────────────────
  const genAI           = new GoogleGenerativeAI(apiKey);
  const systemInstruction = buildSystemInstruction();
  const userPrompt        = buildUserPrompt(inputData);

  // ── Call API with retry ───────────────────────────────────────────────────
  const { text, usage } = await callGeminiApi({
    genAI,
    modelName,
    systemInstruction,
    userPrompt,
  });

  // ── Parse and validate JSON ───────────────────────────────────────────────
  const parsed = extractJsonFromResponse(text);
  validateGeminiJson(parsed);

  // ── Map to canonical shape ────────────────────────────────────────────────
  const mapped = mapToCanonical(parsed, modelName, usage);

  console.log(
    `[gemini.service] ✓ Prediction complete — ` +
    `score=${mapped.healthScore}, model=${modelName}, ` +
    `tokens=${usage?.totalTokenCount ?? 'unknown'}`
  );

  return buildCanonicalResponse({
    provider:     PROVIDER_NAME,
    modelVersion: modelName,
    riskScore:    mapped.healthScore,
    confidence:   mapped.confidence,
    riskFactors:  mapped.riskFactors,
    diseaseRisks: mapped.diseaseRisks,
    recommendations: mapped.recommendations,
    summary:      mapped.summary,
    rawProviderResponse: {
      model:      modelName,
      tokenUsage: mapped.tokenUsage,
      rawParsed:  parsed,
    },
  });
}
