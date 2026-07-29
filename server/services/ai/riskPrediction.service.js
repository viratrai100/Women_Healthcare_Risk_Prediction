/**
 * AI Risk Prediction Service
 *
 * Abstraction layer between the Express controllers and the
 * underlying AI/ML model (external API, Python microservice, etc.).
 *
 * Swap the implementation here without touching controllers.
 */

// import axios from 'axios';

/**
 * Submits patient health data to the AI model and returns a structured risk result.
 *
 * @param {object} inputData  — sanitised health form data
 * @returns {Promise<{riskScore: number, riskLevel: string, riskFactors: array, recommendation: string, modelVersion: string}>}
 */
export const getRiskPrediction = async (inputData) => {
  // TODO: integrate with AI model endpoint
  // Option A — External REST API:
  //   const { data } = await axios.post(process.env.AI_SERVICE_URL, inputData, {
  //     headers: { Authorization: `Bearer ${process.env.AI_SERVICE_API_KEY}` },
  //   });
  //   return data;
  //
  // Option B — Local rule-based / ML model (e.g., ONNX runtime):
  //   return runLocalModel(inputData);

  throw new Error('AI service not yet implemented. inputData received: ' + JSON.stringify(inputData));
};
