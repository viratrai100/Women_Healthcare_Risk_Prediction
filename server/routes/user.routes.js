import { Router } from 'express';
import { getProfile, updateProfile, deleteAccount } from '../controllers/user.controller.js';
import protect from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { updateProfileRules } from '../validators/auth.validator.js';

const router = Router();

// All user routes require authentication
router.use(protect);

// GET    /api/users/profile
router.get('/profile', getProfile);

// PUT    /api/users/profile
router.put('/profile', updateProfileRules, validate, updateProfile);

// DELETE /api/users/account
router.delete('/account', deleteAccount);

export default router;
