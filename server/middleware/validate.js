import { validationResult } from 'express-validator';

/**
 * Runs after express-validator rule chains.
 * Returns 422 with field-level errors if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  next();
};

export default validate;
