import User from '../models/User.js';
import { sendSuccess, createError } from '../utils/response.js';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/profile  — returns authenticated user's profile
// ─────────────────────────────────────────────────────────────────────────────
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(createError('User not found.', 404));
    sendSuccess(res, 200, 'Profile fetched.', { user });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/profile  — update name (and optionally password)
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const { name, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return next(createError('User not found.', 404));

    // Update name if provided
    if (name) user.name = name;

    // Update password only if both fields are provided
    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return next(createError('Current password is incorrect.', 400));
      user.password = newPassword;
    }

    await user.save();

    // Return updated user without password
    const updated = await User.findById(user._id);
    sendSuccess(res, 200, 'Profile updated successfully.', { user: updated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/users/account  — permanently deletes account
// ─────────────────────────────────────────────────────────────────────────────
export const deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    sendSuccess(res, 200, 'Account deleted successfully.');
  } catch (err) {
    next(err);
  }
};
