import { Router } from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  logout,
} from '../controllers/auth.controller.js';
import validate from '../middleware/validate.js';
import {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
} from '../validators/auth.validator.js';

const router = Router();

// POST /api/auth/register
router.post('/register', registerRules, validate, register);

// POST /api/auth/login
router.post('/login', loginRules, validate, login);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', resetPasswordRules, validate, resetPassword);

// POST /api/auth/logout
router.post('/logout', logout);

export default router;
