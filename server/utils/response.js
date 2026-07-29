/**
 * Sends a standardised success JSON response.
 *
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {any} data
 */
export const sendSuccess = (res, statusCode = 200, message = 'OK', data = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

/**
 * Creates an error with an attached HTTP status code.
 *
 * @param {string} message
 * @param {number} statusCode
 * @returns {Error}
 */
export const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
