import crypto from 'crypto';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { sendSuccess, createError } from '../utils/response.js';

// ── Helper: strip sensitive fields & return user object ──────────────────────
const sanitiseUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return next(createError('An account with this email already exists.', 409));

    const user = await User.create({ name, email, password });
    const token = signToken({ id: user._id, role: user.role });

    sendSuccess(res, 201, 'Account created successfully.', {
      token,
      user: sanitiseUser(user),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(createError('Invalid email or password.', 401));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken({ id: user._id, role: user.role });

    sendSuccess(res, 200, 'Logged in successfully.', {
      token,
      user: sanitiseUser(user),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Always returns 200 to prevent email enumeration
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Generic success regardless of whether the email exists
    const genericMsg =
      'If an account with that email exists, a password reset link has been sent.';

    if (!user) return sendSuccess(res, 200, genericMsg);

    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // In production: send rawToken via email (e.g. nodemailer / SendGrid).
    // For development: return token directly in the response body.
    const resetURL = `${process.env.CLIENT_ORIGIN}/reset-password/${rawToken}`;

    if (process.env.NODE_ENV === 'development') {
      return sendSuccess(res, 200, genericMsg, { resetURL, resetToken: rawToken });
    }

    // TODO: integrate mailer service here
    // await sendEmail({ to: user.email, subject: 'Password Reset', html: `<a href="${resetURL}">Reset</a>` });

    sendSuccess(res, 200, genericMsg);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) return next(createError('Reset token is invalid or has expired.', 400));

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = signToken({ id: user._id, role: user.role });
    sendSuccess(res, 200, 'Password reset successfully.', { token, user: sanitiseUser(user) });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout  (stateless JWT — client discards token)
// ─────────────────────────────────────────────────────────────────────────────
export const logout = async (_req, res) => {
  sendSuccess(res, 200, 'Logged out successfully.');
};
