import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';

import PersonalSection  from '@/components/assessment/PersonalSection.jsx';
import MedicalSection   from '@/components/assessment/MedicalSection.jsx';
import LifestyleSection from '@/components/assessment/LifestyleSection.jsx';
import SymptomsSection  from '@/components/assessment/SymptomsSection.jsx';
import Spinner          from '@/components/common/Spinner.jsx';
import Alert            from '@/components/common/Alert.jsx';

import { createAssessment } from '@/api/assessment.api.js';
import { predictionAPI }    from '@/api/prediction.api.js';

// ── Step configuration ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 'personal',  label: 'Personal',  icon: '👤', component: PersonalSection  },
  { id: 'medical',   label: 'Medical',   icon: '🩺', component: MedicalSection   },
  { id: 'lifestyle', label: 'Lifestyle', icon: '🌿', component: LifestyleSection },
  { id: 'symptoms',  label: 'Symptoms',  icon: '💊', component: SymptomsSection  },
];

/**
 * BUG FIX #1 + #5 — trigger(sectionKey) never validated anything.
 *
 * RHF's trigger() accepts:
 *   - undefined       → validate ALL registered fields
 *   - string          → validate ONE field by its exact registered name
 *   - string[]        → validate a specific list of fields
 *
 * Passing the section id string ('personal') matches NO registered field
 * (fields are 'personal.dateOfBirth', 'personal.age', etc.) so trigger
 * always returned true — the Next button never blocked on validation errors.
 *
 * Fix: supply the exact nested field names for each step so trigger knows
 * exactly which fields to validate before advancing.
 */
const STEP_FIELDS = {
  personal: [
    'personal.dateOfBirth',
    'personal.age',
    'personal.height',
    'personal.weight',
    'personal.bloodGroup',
    'personal.maritalStatus',
    'personal.occupation',
    'personal.ethnicity',
    'personal.pregnancyStatus',
    'personal.menopausalStatus',
    'personal.systolicBP',
    'personal.diastolicBP',
    'personal.bloodSugar',
    'personal.bodyTemp',
    'personal.heartRate',
  ],
  medical: [
    'medical.existingConditions',
    'medical.familyHistory',
    'medical.currentMedicationsRaw',
    'medical.allergiesRaw',
    'medical.previousSurgeriesRaw',
    'medical.lastMenstrualPeriod',
    'medical.cycleLength',
    'medical.cycleRegularity',
    'medical.lastCheckupDate',
    'medical.mammogramDone',
    'medical.papSmearDone',
    'medical.bonesDensityTestDone',
  ],
  lifestyle: [
    'lifestyle.smokingStatus',
    'lifestyle.alcoholUse',
    'lifestyle.physicalActivity',
    'lifestyle.activityFrequency',
    'lifestyle.dietType',
    'lifestyle.fruitVegServings',
    'lifestyle.processedFoodFrequency',
    'lifestyle.waterIntake',
    'lifestyle.sleepHours',
    'lifestyle.sleepQuality',
    'lifestyle.stressLevel',
    'lifestyle.screenTimeHours',
  ],
  symptoms: [
    'symptoms.current',
    'symptoms.severity',
    'symptoms.duration',
    'symptoms.additionalNotes',
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Converts free-text textarea (one item per line) → string[].
 * Filters out blank lines.
 */
function linesToArray(raw = '') {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Transforms raw form values into the payload expected by the server.
 */
function buildPayload(data) {
  return {
    personal: {
      dateOfBirth:      data.personal.dateOfBirth,
      age:              data.personal.age,
      bloodGroup:       data.personal.bloodGroup     || undefined,
      height:           data.personal.height,
      weight:           data.personal.weight,
      maritalStatus:    data.personal.maritalStatus   || undefined,
      occupation:       data.personal.occupation      || undefined,
      ethnicity:        data.personal.ethnicity       || undefined,
      pregnancyStatus:  data.personal.pregnancyStatus || undefined,
      menopausalStatus: data.personal.menopausalStatus || undefined,
      systolicBP:       Number.isFinite(data.personal.systolicBP)  ? data.personal.systolicBP  : undefined,
      diastolicBP:      Number.isFinite(data.personal.diastolicBP) ? data.personal.diastolicBP : undefined,
      bloodSugar:       Number.isFinite(data.personal.bloodSugar)  ? data.personal.bloodSugar  : undefined,
      bodyTemp:         Number.isFinite(data.personal.bodyTemp)    ? data.personal.bodyTemp    : undefined,
      heartRate:        Number.isFinite(data.personal.heartRate)   ? data.personal.heartRate   : undefined,
    },
    medical: {
      existingConditions:   data.medical.existingConditions  || [],
      familyHistory:        data.medical.familyHistory       || [],
      currentMedications:   linesToArray(data.medical.currentMedicationsRaw),
      allergies:            linesToArray(data.medical.allergiesRaw),
      previousSurgeries:    linesToArray(data.medical.previousSurgeriesRaw),
      lastMenstrualPeriod:  data.medical.lastMenstrualPeriod || undefined,
      cycleLength:          Number.isFinite(data.medical.cycleLength) ? data.medical.cycleLength : undefined,
      cycleRegularity:      data.medical.cycleRegularity      || undefined,
      lastCheckupDate:      data.medical.lastCheckupDate      || undefined,
      mammogramDone:        data.medical.mammogramDone        || false,
      papSmearDone:         data.medical.papSmearDone         || false,
      bonesDensityTestDone: data.medical.bonesDensityTestDone || false,
    },
    lifestyle: {
      smokingStatus:          data.lifestyle.smokingStatus          || undefined,
      alcoholUse:             data.lifestyle.alcoholUse             || undefined,
      physicalActivity:       data.lifestyle.physicalActivity       || undefined,
      // BUG FIX #7 — use Number.isFinite to safely strip NaN from untouched number/range fields
      activityFrequency:      Number.isFinite(data.lifestyle.activityFrequency)   ? data.lifestyle.activityFrequency   : undefined,
      dietType:               data.lifestyle.dietType               || undefined,
      fruitVegServings:       Number.isFinite(data.lifestyle.fruitVegServings)    ? data.lifestyle.fruitVegServings    : undefined,
      processedFoodFrequency: data.lifestyle.processedFoodFrequency || undefined,
      waterIntake:            Number.isFinite(data.lifestyle.waterIntake)         ? data.lifestyle.waterIntake         : undefined,
      sleepHours:             Number.isFinite(data.lifestyle.sleepHours)          ? data.lifestyle.sleepHours          : undefined,
      sleepQuality:           data.lifestyle.sleepQuality           || undefined,
      stressLevel:            Number.isFinite(data.lifestyle.stressLevel)         ? data.lifestyle.stressLevel         : undefined,
      screenTimeHours:        Number.isFinite(data.lifestyle.screenTimeHours)     ? data.lifestyle.screenTimeHours     : undefined,
    },
    symptoms: {
      current:         data.symptoms.current         || [],
      // BUG FIX #8 — severity defaults to 'none' in the payload (Mongoose enum requires a valid value)
      severity:        data.symptoms.severity         || 'none',
      duration:        data.symptoms.duration         || undefined,
      additionalNotes: data.symptoms.additionalNotes  || undefined,
    },
  };
}

// ── Step progress indicator ────────────────────────────────────────────────────

function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent   = idx === currentStep;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Bubble */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold
                  border-2 transition-all duration-300
                  ${isCompleted
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : isCurrent
                      ? 'bg-surface-card border-primary-500 text-primary-400 ring-4 ring-primary-500/20'
                      : 'bg-surface-card border-surface-border text-slate-500'
                  }`}
              >
                {isCompleted ? '✓' : step.icon}
              </div>
              <span
                className={`hidden sm:block text-xs font-medium transition-colors
                  ${isCurrent ? 'text-primary-400' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-colors duration-300
                  ${isCompleted ? 'bg-primary-500' : 'bg-surface-border'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Submit phase indicator (shows while AI is thinking) ────────────────────────

function AnalysingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full bg-primary-500/20 animate-ping" />
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/30">
          <span className="text-2xl">🧠</span>
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Analysing with Gemini AI…</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Your health data is being evaluated across 8 disease categories.
          This typically takes 10–20 seconds.
        </p>
      </div>
      <Spinner size="md" />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

/**
 * AssessmentPage
 * Four-step multi-section health assessment wizard.
 *
 * Submit flow:
 *   1. Save assessment to MongoDB via POST /api/assessments
 *   2. Run AI prediction via POST /api/predictions
 *   3. Navigate to /prediction with the AI result in router state
 */
function AssessmentPage() {
  const navigate = useNavigate();

  const [step,      setStep]      = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [analysing, setAnalysing] = useState(false);  // AI call phase
  const [error,     setError]     = useState(null);

  /**
   * BUG FIX #2 — defaultValues were empty objects ({}) for every section.
   *
   * Problems with empty-object defaults:
   *   a) `valueAsNumber` fields (age, height, weight, cycleLength, slider fields)
   *      start with `undefined` internally. RHF coerces `undefined` through
   *      `valueAsNumber` → NaN on submit.
   *   b) Select fields registered without a matching defaultValue entry have
   *      an undefined internal state, making required validation unreliable
   *      across re-renders and step navigation.
   *   c) Checkbox arrays (existingConditions, familyHistory, symptoms.current)
   *      need [] as default to avoid undefined spread errors in CheckboxGroup.
   *
   * Fix: Provide explicit defaults for every field. Numeric fields default to
   * undefined (not 0) so that unset optional fields are cleanly omitted from
   * the payload. Required numeric fields (age, height, weight) also default to
   * undefined so the user is forced to enter them and validation fires correctly.
   *
   * BUG FIX #3 — mode changed from 'onTouched' to 'onSubmit'.
   *
   * With 'onTouched', clicking Next without touching any field would not show
   * errors inline. Combined with the trigger bug (#1/#5), the step advanced
   * silently. 'onSubmit' + explicit trigger() call gives correct behaviour:
   * errors appear when the user tries to advance past a step with invalid data.
   */
  const methods = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      personal: {
        dateOfBirth:      '',
        age:              undefined,
        bloodGroup:       '',
        height:           undefined,
        weight:           undefined,
        maritalStatus:    '',
        occupation:       '',
        ethnicity:        '',
        pregnancyStatus:  '',
        menopausalStatus: '',
      },
      medical: {
        existingConditions:   [],
        familyHistory:        [],
        currentMedicationsRaw: '',
        allergiesRaw:          '',
        previousSurgeriesRaw:  '',
        lastMenstrualPeriod:  '',
        cycleLength:          undefined,
        cycleRegularity:      '',
        lastCheckupDate:      '',
        mammogramDone:        false,
        papSmearDone:         false,
        bonesDensityTestDone: false,
      },
      lifestyle: {
        smokingStatus:          '',
        alcoholUse:             '',
        physicalActivity:       '',
        activityFrequency:      undefined,
        dietType:               '',
        // BUG FIX #7 — sliders need a numeric default so the displayed midpoint
        // matches the actual RHF stored value from the very first render.
        fruitVegServings:       10,   // midpoint of 0–20
        processedFoodFrequency: '',
        waterIntake:            5,    // midpoint of 0–10
        sleepHours:             6,    // midpoint of 0–12
        sleepQuality:           '',
        stressLevel:            5,    // midpoint of 1–10
        screenTimeHours:        8,    // midpoint of 0–16
      },
      symptoms: {
        current:         [],
        // BUG FIX #8 — severity must have a valid enum default ('none') so the
        // Mongoose schema never receives an empty string '' (not in the enum).
        severity:        'none',
        duration:        '',
        additionalNotes: '',
      },
    },
  });

  const { handleSubmit, trigger } = methods;

  const isLastStep  = step === STEPS.length - 1;
  const CurrentStep = STEPS[step].component;

  /**
   * BUG FIX #1 + #5 — Validate only the current step's fields before advancing.
   *
   * trigger(STEP_FIELDS[sectionKey]) passes the exact list of field names that
   * belong to this step. RHF then validates only those fields, shows their
   * errors, and returns false if any are invalid — correctly blocking Next.
   */
  const handleNext = async () => {
    const sectionKey = STEPS[step].id;
    const valid = await trigger(STEP_FIELDS[sectionKey]);
    if (!valid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const payload = buildPayload(data);

      // Step 1 — Save assessment to MongoDB
      await createAssessment(payload);

      // Step 2 — Switch to AI analysis phase UI
      setLoading(false);
      setAnalysing(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Step 3 — Run Gemini AI prediction
      const predRes = await predictionAPI.run(payload);
      const aiResult = predRes.data?.data?.aiResult;

      if (!aiResult) throw new Error('AI prediction returned an empty result.');

      // Step 4 — Navigate to results page with the AI result passed via state
      navigate('/prediction', { state: { aiResult } });

    } catch (err) {
      setAnalysing(false);
      setLoading(false);
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit assessment. Please try again.';
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Show AI analysing screen
  if (analysing) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <AnalysingScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Health Assessment</h1>
        <p className="text-slate-400 mt-1">
          Complete all four sections to generate your personalised AI risk profile.
        </p>
      </div>

      <div className="card">
        {/* Progress indicator */}
        <StepIndicator steps={STEPS} currentStep={step} />

        {/* Section form */}
        <FormProvider {...methods}>
          <form
            id="health-assessment-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="min-h-[420px]">
              <CurrentStep />
            </div>

            {/* Server-side error */}
            {error && (
              <div className="mt-4">
                <Alert type="error">{error}</Alert>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-border">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 0 || loading}
                id="assessment-back-btn"
                className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Back
              </button>

              <span className="text-xs text-slate-500 hidden sm:block">
                Step {step + 1} of {STEPS.length}
              </span>

              {isLastStep ? (
                <button
                  type="submit"
                  disabled={loading}
                  id="assessment-submit-btn"
                  className="btn-primary min-w-[160px]"
                >
                  {loading ? <Spinner size="sm" /> : '🧠 Analyse with AI'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  id="assessment-next-btn"
                  className="btn-primary"
                >
                  Next →
                </button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

export default AssessmentPage;
