/**
 * grok.service.js
 *
 * xAI Grok provider for health risk prediction.
 *
 * Environment variables required:
 *   GROK_API_KEY   — xAI API key (from https://console.x.ai)
 *   GROK_MODEL     — Model ID (default: 'grok-2-latest')
 *   GROK_API_URL   — Base URL (default: xAI OpenAI-compatible endpoint)
 *
 * Integration notes (implement when ready):
 *   - Grok exposes an OpenAI-compatible API — use the openai npm package
 *     with baseURL set to the xAI endpoint
 *   - Use structured output (response_format: { type: 'json_object' }) for
 *     deterministic JSON responses
 *   - Recommended temperature: 0.1 for reproducible medical predictions
 *   - Grok supports function calling — use it to enforce output schema
 *
 * Docs: https://docs.x.ai/api
 */

import { buildCanonicalResponse } from './aiResponse.schema.js';

// ── Provider constants ────────────────────────────────────────────────────────

const PROVIDER_NAME  = 'grok';
const DEFAULT_MODEL  = 'grok-2-latest';
const DEFAULT_API_URL = 'https://api.x.ai/v1';

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a clinical AI assistant specialising in women's healthcare risk assessment.
Analyse the provided patient health data and return a JSON risk prediction with:
- Overall risk score (0-100)
- Risk level (low/moderate/high/critical)
- Confidence score (0-1)
- Individual risk factors with contributions
- Per-disease risk breakdown
- Prioritised health recommendations
- A plain-English summary paragraph
Return ONLY valid JSON. No explanations outside the JSON object.`;

// ── Input → Message builder (implement when integrating) ──────────────────────

/**
 * Builds the messages array for the Grok chat completion API.
 * @param {object} inputData — sanitised health form data
 * @returns {Array} messages array
 */
function buildGrokMessages(inputData) {
  // TODO: Implement structured message building for Grok
  // Recommended approach:
  //   1. System message defines the clinical AI role (see SYSTEM_PROMPT)
  //   2. User message contains the serialised health assessment sections
  //   3. Add assistant message prefix to guide JSON output format
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user',   content: `Patient Health Assessment Data:\n${JSON.stringify(inputData, null, 2)}` },
  ];
}

/**
 * Parses the raw Grok chat completion response into canonical fields.
 * @param {object} grokResponse — raw API response object (OpenAI-compatible)
 * @returns {object} normalised fields for buildCanonicalResponse()
 */
function parseGrokResponse(grokResponse) {
  // TODO: Implement when Grok integration is live
  // OpenAI-compatible response structure:
  //   grokResponse.choices[0].message.content → JSON string
  //
  // const content = grokResponse.choices?.[0]?.message?.content || '{}';
  // const parsed  = JSON.parse(content);
  // return {
  //   riskScore:       parsed.riskScore,
  //   confidence:      parsed.confidence,
  //   riskFactors:     parsed.riskFactors,
  //   diseaseRisks:    parsed.diseaseRisks,
  //   recommendations: parsed.recommendations,
  //   summary:         parsed.summary,
  // };
  return {};
}

// ── Main provider function ────────────────────────────────────────────────────

/**
 * Runs health risk prediction using xAI Grok.
 * Currently returns a stub response — replace the TODO block when integrating.
 *
 * @param {object} inputData — sanitised health assessment payload
 * @returns {Promise<object>} Canonical AI response (see aiResponse.schema.js)
 * @throws {Error} if the API call fails or returns an unexpected shape
 */
export async function runGrokPrediction(inputData) {
  const apiKey = process.env.GROK_API_KEY;
  const model  = process.env.GROK_MODEL   || DEFAULT_MODEL;
  const apiUrl = process.env.GROK_API_URL  || DEFAULT_API_URL;

  // ── TODO: Replace this block with the real Grok API call ────────────────
  //
  // import OpenAI from 'openai';  // npm install openai
  // const openai = new OpenAI({ apiKey, baseURL: apiUrl });
  //
  // const messages  = buildGrokMessages(inputData);
  // const response  = await openai.chat.completions.create({
  //   model,
  //   messages,
  //   temperature:    0.1,
  //   response_format: { type: 'json_object' },
  // });
  //
  // const parsed = parseGrokResponse(response);
  //
  // return buildCanonicalResponse({
  //   provider:            PROVIDER_NAME,
  //   modelVersion:        model,
  //   riskScore:           parsed.riskScore,
  //   confidence:          parsed.confidence,
  //   riskFactors:         parsed.riskFactors,
  //   diseaseRisks:        parsed.diseaseRisks,
  //   recommendations:     parsed.recommendations,
  //   summary:             parsed.summary,
  //   rawProviderResponse: response,
  // });
  // ─────────────────────────────────────────────────────────────────────────

  // ── STUB (active until integration) ──────────────────────────────────────
  console.warn('[grok.service] Using stub response — GROK_API_KEY not yet configured.');

  return buildCanonicalResponse({
    provider:     PROVIDER_NAME,
    modelVersion: model,
    riskScore:    0,
    confidence:   0,
    riskFactors:  [],
    diseaseRisks: [],
    recommendations: [{
      priority: 'medium',
      category: 'System',
      action:   'Grok provider is not yet configured. Set GROK_API_KEY to enable predictions.',
    }],
    summary:             'xAI Grok provider is not yet integrated. This is a placeholder response.',
    rawProviderResponse: { stub: true, provider: PROVIDER_NAME, model, apiUrl },
  });
}
