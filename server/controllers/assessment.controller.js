import HealthAssessment from '../models/HealthAssessment.js';
import { sendSuccess, createError } from '../utils/response.js';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/assessments
// Submit a new health assessment (all four sections in one payload)
// ─────────────────────────────────────────────────────────────────────────────
export const createAssessment = async (req, res, next) => {
  try {
    const { personal, medical, lifestyle, symptoms } = req.body;

    const assessment = await HealthAssessment.create({
      user: req.user.id,
      personal,
      medical,
      lifestyle,
      symptoms,
      status: 'submitted',
    });

    sendSuccess(res, 201, 'Health assessment submitted successfully.', { assessment });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/assessments
// List all assessments belonging to the authenticated user (newest first)
// ─────────────────────────────────────────────────────────────────────────────
export const getAssessments = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [assessments, total] = await Promise.all([
      HealthAssessment.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      HealthAssessment.countDocuments({ user: req.user.id }),
    ]);

    sendSuccess(res, 200, 'Assessments fetched.', {
      assessments,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/assessments/:id
// Fetch a single assessment — only the owner can access it
// ─────────────────────────────────────────────────────────────────────────────
export const getAssessment = async (req, res, next) => {
  try {
    const assessment = await HealthAssessment.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).select('-__v');

    if (!assessment) return next(createError('Assessment not found.', 404));

    sendSuccess(res, 200, 'Assessment fetched.', { assessment });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/assessments/:id
// Update an existing assessment (only if status is 'draft')
// ─────────────────────────────────────────────────────────────────────────────
export const updateAssessment = async (req, res, next) => {
  try {
    const { personal, medical, lifestyle, symptoms } = req.body;

    const assessment = await HealthAssessment.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!assessment) return next(createError('Assessment not found.', 404));

    // Merge section-level updates
    if (personal)  assessment.personal  = { ...assessment.personal.toObject(),  ...personal  };
    if (medical)   assessment.medical   = { ...assessment.medical.toObject(),   ...medical   };
    if (lifestyle) assessment.lifestyle = { ...assessment.lifestyle.toObject(), ...lifestyle };
    if (symptoms)  assessment.symptoms  = { ...assessment.symptoms.toObject(),  ...symptoms  };

    await assessment.save();

    sendSuccess(res, 200, 'Assessment updated.', { assessment });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/assessments/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteAssessment = async (req, res, next) => {
  try {
    const result = await HealthAssessment.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!result) return next(createError('Assessment not found.', 404));

    sendSuccess(res, 200, 'Assessment deleted.');
  } catch (err) {
    next(err);
  }
};
