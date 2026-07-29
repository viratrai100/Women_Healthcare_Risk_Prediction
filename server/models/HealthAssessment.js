import mongoose from 'mongoose';

/**
 * HealthAssessment
 * Stores a single multi-section health assessment submission.
 * Structured to feed the AI risk engine once it is integrated.
 *
 * Sections:
 *   personal  — demographics & biometrics
 *   medical   — history, conditions, medications
 *   lifestyle — diet, activity, sleep, habits
 *   symptoms  — current symptom checklist
 */

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const personalSchema = new mongoose.Schema(
  {
    dateOfBirth:    { type: Date,   required: true },
    age:            { type: Number, required: true, min: 10, max: 120 },
    bloodGroup:     { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'] },
    height:         { type: Number, required: true, min: 50,  max: 300  }, // cm
    weight:         { type: Number, required: true, min: 20,  max: 500  }, // kg
    bmi:            { type: Number },
    maritalStatus:  { type: String, enum: ['single','married','divorced','widowed','prefer_not_to_say'] },
    occupation:     { type: String, trim: true, maxlength: 100 },
    ethnicity:      { type: String, trim: true, maxlength: 80 },
    pregnancyStatus:{ type: String, enum: ['not_pregnant','pregnant','postpartum','not_applicable'] },
    menopausalStatus:{ type: String, enum: ['pre_menopausal','peri_menopausal','post_menopausal','not_applicable'] },
  },
  { _id: false }
);

const medicalSchema = new mongoose.Schema(
  {
    existingConditions: {
      type: [String],
      enum: [
        'diabetes', 'hypertension', 'heart_disease', 'asthma', 'thyroid_disorder',
        'pcos', 'endometriosis', 'fibroids', 'osteoporosis', 'cancer',
        'depression', 'anxiety', 'autoimmune_disease', 'none',
      ],
      default: [],
    },
    familyHistory: {
      type: [String],
      enum: [
        'breast_cancer', 'ovarian_cancer', 'cervical_cancer', 'diabetes',
        'heart_disease', 'hypertension', 'osteoporosis', 'mental_illness', 'none',
      ],
      default: [],
    },
    currentMedications:   { type: [String], default: [] },          // free-text list
    allergies:            { type: [String], default: [] },          // free-text list
    previousSurgeries:    { type: [String], default: [] },          // free-text list
    lastMenstrualPeriod:  { type: Date },
    cycleLength:          { type: Number, min: 14, max: 60 },       // days
    cycleRegularity:      { type: String, enum: ['regular','irregular','absent','on_contraceptive'] },
    lastCheckupDate:      { type: Date },
    mammogramDone:        { type: Boolean },
    papSmearDone:         { type: Boolean },
    bonesDensityTestDone: { type: Boolean },
  },
  { _id: false }
);

const lifestyleSchema = new mongoose.Schema(
  {
    smokingStatus:    { type: String, enum: ['never','former','current_light','current_heavy'] },
    alcoholUse:       { type: String, enum: ['never','occasional','moderate','heavy'] },
    physicalActivity: { type: String, enum: ['sedentary','light','moderate','active','very_active'] },
    activityFrequency:{ type: Number, min: 0, max: 7 },             // days/week
    dietType:         { type: String, enum: ['omnivore','vegetarian','vegan','pescatarian','keto','other'] },
    fruitVegServings: { type: Number, min: 0, max: 20 },            // servings/day
    processedFoodFrequency: { type: String, enum: ['rarely','sometimes','often','daily'] },
    waterIntake:      { type: Number, min: 0, max: 10 },            // litres/day
    sleepHours:       { type: Number, min: 0, max: 24 },
    sleepQuality:     { type: String, enum: ['poor','fair','good','excellent'] },
    stressLevel:      { type: Number, min: 1, max: 10 },
    screenTimeHours:  { type: Number, min: 0, max: 24 },
  },
  { _id: false }
);

const symptomsSchema = new mongoose.Schema(
  {
    current: {
      type: [String],
      enum: [
        // Reproductive
        'irregular_periods','heavy_bleeding','pelvic_pain','vaginal_discharge',
        // Breast
        'breast_lump','breast_pain','nipple_discharge',
        // Hormonal
        'hot_flashes','night_sweats','mood_swings','decreased_libido',
        // General
        'fatigue','unexplained_weight_change','hair_loss','excessive_hair_growth',
        'frequent_urination','painful_urination','bloating',
        // Musculoskeletal
        'joint_pain','bone_pain','back_pain',
        // Mental
        'anxiety','depression','brain_fog','sleep_disturbances',
        'none',
      ],
      default: [],
    },
    severity: {
      type: String,
      enum: ['none', 'mild', 'moderate', 'severe'],
      default: 'none',
    },
    duration: {
      type: String,
      enum: ['less_than_week','one_to_four_weeks','one_to_six_months','more_than_six_months'],
    },
    additionalNotes: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

// ── Root schema ───────────────────────────────────────────────────────────────

const healthAssessmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    personal:  { type: personalSchema,  required: true },
    medical:   { type: medicalSchema,   required: true },
    lifestyle: { type: lifestyleSchema, required: true },
    symptoms:  { type: symptomsSchema,  required: true },

    // ── Status ─────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['draft', 'submitted', 'analysed'],
      default: 'submitted',
    },
    // Filled once AI is integrated
    aiResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-compute BMI before save
healthAssessmentSchema.pre('save', function (next) {
  if (this.personal?.height && this.personal?.weight) {
    const h = this.personal.height / 100; // cm → m
    this.personal.bmi = parseFloat((this.personal.weight / (h * h)).toFixed(1));
  }
  next();
});

const HealthAssessment = mongoose.model('HealthAssessment', healthAssessmentSchema);
export default HealthAssessment;
