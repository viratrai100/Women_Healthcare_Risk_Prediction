/**
 * Report Controller
 * Treats the Prediction collection as the report history store.
 * Every prediction saved is surfaced here as a "report" the user can browse,
 * view in detail, or delete.
 *
 * Routes mounted at /api/reports
 *   GET    /              — list reports (search, filter, paginate)
 *   GET    /:id           — get single report details
 *   DELETE /:id           — delete a report (owner only)
 */

import Prediction from '../models/Prediction.js';
import { sendSuccess, createError } from '../utils/response.js';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports
// List predictions for the authenticated user with optional search & filters.
// Query params:
//   page      — page number (default 1)
//   limit     — items per page (default 10, max 50)
//   riskLevel — 'low' | 'moderate' | 'high' | 'critical'
//   from      — ISO date string (createdAt >=)
//   to        — ISO date string (createdAt <=)
//   search    — text search on recommendation field
// ─────────────────────────────────────────────────────────────────────────────
export const getReports = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    // Base filter — always scoped to the authenticated user
    const filter = { user: req.user.id };

    // Optional: filter by risk level
    if (req.query.riskLevel) {
      const validLevels = ['low', 'moderate', 'high', 'critical'];
      if (validLevels.includes(req.query.riskLevel)) {
        filter.riskLevel = req.query.riskLevel;
      }
    }

    // Optional: date range filter
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to)   filter.createdAt.$lte = new Date(req.query.to);
    }

    // Optional: text search on recommendation
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { recommendation: searchRegex },
        { modelVersion:   searchRegex },
      ];
    }

    const [reports, total] = await Promise.all([
      Prediction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-inputData -__v'), // omit raw input from list view
      Prediction.countDocuments(filter),
    ]);

    sendSuccess(res, 200, 'Reports fetched.', {
      reports,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/:id
// Fetch full report details for one prediction (owner only).
// ─────────────────────────────────────────────────────────────────────────────
export const getReport = async (req, res, next) => {
  try {
    const report = await Prediction.findOne({
      _id:  req.params.id,
      user: req.user.id,
    }).select('-__v');

    if (!report) return next(createError('Report not found.', 404));

    sendSuccess(res, 200, 'Report fetched.', { report });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/reports/:id
// Permanently delete a prediction / report (owner only).
// ─────────────────────────────────────────────────────────────────────────────
export const deleteReport = async (req, res, next) => {
  try {
    const report = await Prediction.findOneAndDelete({
      _id:  req.params.id,
      user: req.user.id,
    });

    if (!report) return next(createError('Report not found.', 404));

    sendSuccess(res, 200, 'Report deleted successfully.');
  } catch (err) {
    next(err);
  }
};
