/**
 * ai.service.js  — Central AI Provider Factory
 *
 * This is the single entry point that ALL controllers must use.
 * It reads AI_PROVIDER from the environment and delegates to the
 * correct provider service, guaranteeing a uniform canonical response.
 *
 * ─── Supported providers ────────────────────────────────────────────────────
 *   AI_PROVIDER=gemini  → Google Gemini (gemini.service.js)
 *   AI_PROVIDER=grok    → xAI Grok      (grok.service.js)
 *   AI_PROVIDER=ml      → Local ML      (ml.service.js)  ← default
 *
 * ─── Usage in controllers ───────────────────────────────────────────────────
 *   import { getAiPrediction } from '../services/ai/ai.service.js';
 *
 *   const result = await getAiPrediction(sanitisedInputData);
 *   // result is always a canonical AiResponse regardless of provider
 *
 * ─── Canonical response shape ────────────────────────────────────────────────
 *   {
 *     provider            : string        // which provider ran
 *     modelVersion        : string        // model identifier
 *     requestId           : string        // UUID for tracing
 *     generatedAt         : string (ISO)  // generation timestamp
 *     riskScore           : number 0–100  // overall risk
 *     riskLevel           : 'low'|'moderate'|'high'|'critical'
 *     confidence          : number 0–1    // model confidence
 *     riskFactors         : RiskFactor[]  // contributing factors
 *     diseaseRisks        : DiseaseRisk[] // per-disease breakdown
 *     recommendations     : Recommendation[] // prioritised actions
 *     summary             : string        // plain-English summary
 *     rawProviderResponse : any           // raw provider payload (audit)
 *   }
 *
 * ─── Adding a new provider ──────────────────────────────────────────────────
 *   1. Create services/ai/<name>.service.js exporting run<Name>Prediction(inputData)
 *   2. Add a case to the PROVIDER_MAP below
 *   3. Add the required env vars to .env.example
 *   4. Document the new provider in this header comment
 */

import { runGeminiPrediction } from './gemini.service.js';
import { runGrokPrediction }   from './grok.service.js';
import { runMlPrediction }     from './ml.service.js';

// ── Provider registry ─────────────────────────────────────────────────────────

const PROVIDER_MAP = {
  gemini: runGeminiPrediction,
  grok:   runGrokPrediction,
  ml:     runMlPrediction,
};

const VALID_PROVIDERS  = Object.keys(PROVIDER_MAP);
const DEFAULT_PROVIDER = 'ml';

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Resolves the active AI provider from the environment and runs a prediction.
 * Returns the same canonical JSON structure regardless of which provider is used.
 *
 * @param {object} inputData — sanitised health assessment data
 *   Expected shape: { personal, medical, lifestyle, symptoms }
 * @returns {Promise<object>} Canonical AiResponse (see schema above)
 * @throws {AiServiceError} if the provider name is invalid or the call fails
 */
export async function getAiPrediction(inputData) {
  const providerName = (process.env.AI_PROVIDER || DEFAULT_PROVIDER).toLowerCase().trim();

  if (!VALID_PROVIDERS.includes(providerName)) {
    throw new AiServiceError(
      `Unknown AI provider: "${providerName}". ` +
      `Valid options: ${VALID_PROVIDERS.join(', ')}. ` +
      `Set AI_PROVIDER in your .env file.`,
      'INVALID_PROVIDER'
    );
  }

  const providerFn = PROVIDER_MAP[providerName];

  try {
    const startTime = Date.now();
    const result    = await providerFn(inputData);
    const elapsed   = Date.now() - startTime;

    // Attach timing metadata (non-breaking) for monitoring
    result._meta = {
      provider:       providerName,
      elapsedMs:      elapsed,
      inputDataKeys:  Object.keys(inputData || {}),
    };

    return result;
  } catch (err) {
    // Wrap provider errors in a typed error for consistent upstream handling
    if (err instanceof AiServiceError) throw err;
    throw new AiServiceError(
      `[${providerName}] Prediction failed: ${err.message}`,
      'PROVIDER_ERROR',
      err
    );
  }
}

// ── Utility exports ───────────────────────────────────────────────────────────

/**
 * Returns the currently configured provider name.
 * Useful for logging and health-check endpoints.
 * @returns {string}
 */
export function getActiveProvider() {
  return (process.env.AI_PROVIDER || DEFAULT_PROVIDER).toLowerCase().trim();
}

/**
 * Returns an array of all registered provider names.
 * @returns {string[]}
 */
export function getSupportedProviders() {
  return [...VALID_PROVIDERS];
}

/**
 * Validates that the configured provider is recognised without running a prediction.
 * Call this at server startup to catch misconfiguration early.
 * @throws {AiServiceError} if the provider is not recognised
 */
export function validateProviderConfig() {
  const providerName = getActiveProvider();
  if (!VALID_PROVIDERS.includes(providerName)) {
    throw new AiServiceError(
      `AI_PROVIDER="${providerName}" is not a recognised provider. ` +
      `Valid: ${VALID_PROVIDERS.join(', ')}.`,
      'INVALID_PROVIDER'
    );
  }
  console.log(`[ai.service] Provider validated: "${providerName}" ✓`);
}

// ── Custom error class ────────────────────────────────────────────────────────

/**
 * Typed error class for all AI service failures.
 * Allows controllers to distinguish AI errors from generic 500s.
 *
 * Codes:
 *   INVALID_PROVIDER  — AI_PROVIDER env var is unknown
 *   PROVIDER_ERROR    — The selected provider threw an exception
 *   INVALID_RESPONSE  — Provider returned a non-canonical shape
 */
export class AiServiceError extends Error {
  /**
   * @param {string} message    — human-readable description
   * @param {string} code       — machine-readable error code
   * @param {Error}  [cause]    — original error (for stack chaining)
   */
  constructor(message, code = 'PROVIDER_ERROR', cause = null) {
    super(message);
    this.name       = 'AiServiceError';
    this.code       = code;
    this.statusCode = 503; // Service Unavailable — appropriate for AI backend failures
    if (cause) this.cause = cause;
  }
}
