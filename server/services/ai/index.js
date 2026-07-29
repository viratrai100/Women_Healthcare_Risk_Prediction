/**
 * services/ai/index.js
 * Public re-export surface for the AI service layer.
 * Controllers should import from here — never directly from provider files.
 */

export {
  getAiPrediction,
  getActiveProvider,
  getSupportedProviders,
  validateProviderConfig,
  AiServiceError,
} from './ai.service.js';

export { buildCanonicalResponse, classifyRiskLevel } from './aiResponse.schema.js';

// Legacy export — kept for backwards compatibility with existing stub imports
export { getAiPrediction as getRiskPrediction } from './ai.service.js';
