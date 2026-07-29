import jwt from 'jsonwebtoken';

/**
 * Signs a JWT for the given payload.
 * @param {object} payload — data to embed (e.g. { id, role })
 * @returns {string} signed JWT
 */
export const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Verifies a JWT and returns the decoded payload.
 * @param {string} token
 * @returns {object} decoded payload
 */
export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
