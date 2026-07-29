/**
 * dashboard/mockData.js
 * Static demo data used by all dashboard widgets.
 * Replace with real API calls once the AI backend is integrated.
 */

// ── Health Score ───────────────────────────────────────────────────────────────
export const HEALTH_SCORE = 74;

export const SCORE_HISTORY = [
  { month: 'Feb', score: 61 },
  { month: 'Mar', score: 65 },
  { month: 'Apr', score: 58 },
  { month: 'May', score: 70 },
  { month: 'Jun', score: 68 },
  { month: 'Jul', score: 74 },
];

// ── Disease Risk Cards ────────────────────────────────────────────────────────
export const DISEASE_RISKS = [
  {
    id: 'pcos',
    name: 'PCOS',
    risk: 32,
    level: 'low',
    icon: '🌸',
    description: 'Polycystic Ovary Syndrome risk based on hormonal and lifestyle factors.',
    lastChecked: '2026-07-10',
  },
  {
    id: 'breast_cancer',
    name: 'Breast Cancer',
    risk: 18,
    level: 'low',
    icon: '🎗️',
    description: 'Estimated lifetime risk based on family history and screening data.',
    lastChecked: '2026-07-10',
  },
  {
    id: 'diabetes',
    name: 'Type 2 Diabetes',
    risk: 55,
    level: 'moderate',
    icon: '🩸',
    description: 'Metabolic risk driven by BMI, diet quality and physical activity.',
    lastChecked: '2026-07-10',
  },
  {
    id: 'hypertension',
    name: 'Hypertension',
    risk: 41,
    level: 'moderate',
    icon: '❤️',
    description: 'Cardiovascular strain risk from stress, diet and sedentary behaviour.',
    lastChecked: '2026-07-10',
  },
  {
    id: 'osteoporosis',
    name: 'Osteoporosis',
    risk: 22,
    level: 'low',
    icon: '🦴',
    description: 'Bone density risk relative to age, calcium intake and activity.',
    lastChecked: '2026-07-10',
  },
  {
    id: 'thyroid',
    name: 'Thyroid Disorder',
    risk: 68,
    level: 'high',
    icon: '🦋',
    description: 'Thyroid function concern detected via symptom and lifestyle patterns.',
    lastChecked: '2026-07-10',
  },
];

// ── BMI Data ──────────────────────────────────────────────────────────────────
export const BMI_HISTORY = [
  { month: 'Jan', bmi: 26.8 },
  { month: 'Feb', bmi: 26.5 },
  { month: 'Mar', bmi: 26.1 },
  { month: 'Apr', bmi: 25.9 },
  { month: 'May', bmi: 25.4 },
  { month: 'Jun', bmi: 25.0 },
  { month: 'Jul', bmi: 24.6 },
];

export const CURRENT_BMI   = 24.6;
export const CURRENT_HEIGHT = 163; // cm
export const CURRENT_WEIGHT = 65;  // kg

// ── Health Trends ─────────────────────────────────────────────────────────────
export const HEALTH_TRENDS = [
  { month: 'Jan', sleep: 5.5, stress: 8, activity: 2, water: 1.5 },
  { month: 'Feb', sleep: 6.0, stress: 7, activity: 2, water: 1.8 },
  { month: 'Mar', sleep: 6.5, stress: 6, activity: 3, water: 2.0 },
  { month: 'Apr', sleep: 7.0, stress: 5, activity: 3, water: 2.2 },
  { month: 'May', sleep: 6.8, stress: 6, activity: 4, water: 2.3 },
  { month: 'Jun', sleep: 7.2, stress: 4, activity: 4, water: 2.5 },
  { month: 'Jul', sleep: 7.5, stress: 3, activity: 5, water: 2.8 },
];

// ── Previous Reports ──────────────────────────────────────────────────────────
export const PREVIOUS_REPORTS = [
  {
    id: 'rpt-001',
    title: 'Full Health Assessment',
    date: '2026-07-10',
    score: 74,
    status: 'analysed',
    highlights: ['Thyroid risk elevated', 'Diabetes risk moderate', 'Good sleep improvement'],
  },
  {
    id: 'rpt-002',
    title: 'Lifestyle Check-in',
    date: '2026-06-15',
    score: 68,
    status: 'analysed',
    highlights: ['High stress detected', 'Low physical activity', 'Hydration improving'],
  },
  {
    id: 'rpt-003',
    title: 'Symptom Review',
    date: '2026-05-20',
    score: 61,
    status: 'analysed',
    highlights: ['Irregular cycles noted', 'Fatigue reported', 'Mood swings flagged'],
  },
  {
    id: 'rpt-004',
    title: 'Baseline Assessment',
    date: '2026-04-02',
    score: 55,
    status: 'analysed',
    highlights: ['Initial screening', 'BMI overweight', 'Sedentary lifestyle'],
  },
];

// ── Lifestyle Radar ───────────────────────────────────────────────────────────
export const LIFESTYLE_RADAR = [
  { metric: 'Sleep',    value: 75 },
  { metric: 'Nutrition',value: 60 },
  { metric: 'Activity', value: 65 },
  { metric: 'Hydration',value: 80 },
  { metric: 'Stress',   value: 55 },
  { metric: 'Screening',value: 70 },
];
