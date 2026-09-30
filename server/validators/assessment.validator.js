import { body } from 'express-validator';

// ── Personal section ──────────────────────────────────────────────────────────
export const personalRules = [
  body('personal.dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Invalid date format'),
  body('personal.age')
    .isInt({ min: 10, max: 120 }).withMessage('Age must be between 10 and 120'),
  body('personal.height')
    .isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50 and 300 cm'),
  body('personal.weight')
    .isFloat({ min: 20, max: 500 }).withMessage('Weight must be between 20 and 500 kg'),
  body('personal.bloodGroup').optional()
    .isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'])
    .withMessage('Invalid blood group'),
  body('personal.systolicBP').optional({ nullable: true })
    .isFloat({ min: 50, max: 260 }).withMessage('Systolic BP must be between 50 and 260 mmHg'),
  body('personal.diastolicBP').optional({ nullable: true })
    .isFloat({ min: 30, max: 180 }).withMessage('Diastolic BP must be between 30 and 180 mmHg'),
  body('personal.bloodSugar').optional({ nullable: true })
    .isFloat({ min: 1, max: 500 }).withMessage('Blood sugar must be valid level'),
  body('personal.bodyTemp').optional({ nullable: true })
    .isFloat({ min: 80, max: 115 }).withMessage('Body temperature must be between 80 and 115 °F'),
  body('personal.heartRate').optional({ nullable: true })
    .isFloat({ min: 30, max: 240 }).withMessage('Heart rate must be between 30 and 240 bpm'),
];

// ── Medical section ───────────────────────────────────────────────────────────
export const medicalRules = [
  body('medical.cycleLength').optional({ nullable: true })
    .isInt({ min: 14, max: 60 }).withMessage('Cycle length must be 14–60 days'),
  body('medical.cycleRegularity').optional()
    .isIn(['regular','irregular','absent','on_contraceptive'])
    .withMessage('Invalid cycle regularity value'),
];

// ── Lifestyle section ─────────────────────────────────────────────────────────
export const lifestyleRules = [
  body('lifestyle.stressLevel').optional()
    .isInt({ min: 1, max: 10 }).withMessage('Stress level must be 1–10'),
  body('lifestyle.sleepHours').optional()
    .isFloat({ min: 0, max: 24 }).withMessage('Sleep hours must be 0–24'),
  body('lifestyle.waterIntake').optional()
    .isFloat({ min: 0, max: 10 }).withMessage('Water intake must be 0–10 litres'),
];

// ── Symptoms section ──────────────────────────────────────────────────────────
export const symptomsRules = [
  body('symptoms.severity').optional()
    .isIn(['none','mild','moderate','severe'])
    .withMessage('Invalid severity value'),
  body('symptoms.additionalNotes').optional()
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
];

// ── Combined (all sections) ───────────────────────────────────────────────────
export const assessmentRules = [
  ...personalRules,
  ...medicalRules,
  ...lifestyleRules,
  ...symptomsRules,
];
