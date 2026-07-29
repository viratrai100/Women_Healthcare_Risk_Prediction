import { forwardRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import InputField from '@/components/common/InputField.jsx';

const EXISTING_CONDITIONS = [
  { value: 'diabetes',          label: 'Diabetes' },
  { value: 'hypertension',      label: 'Hypertension' },
  { value: 'heart_disease',     label: 'Heart Disease' },
  { value: 'asthma',            label: 'Asthma' },
  { value: 'thyroid_disorder',  label: 'Thyroid Disorder' },
  { value: 'pcos',              label: 'PCOS' },
  { value: 'endometriosis',     label: 'Endometriosis' },
  { value: 'fibroids',          label: 'Uterine Fibroids' },
  { value: 'osteoporosis',      label: 'Osteoporosis' },
  { value: 'cancer',            label: 'Cancer (any)' },
  { value: 'depression',        label: 'Depression' },
  { value: 'anxiety',           label: 'Anxiety Disorder' },
  { value: 'autoimmune_disease', label: 'Autoimmune Disease' },
  { value: 'none',              label: 'None of the above' },
];

const FAMILY_HISTORY = [
  { value: 'breast_cancer',  label: 'Breast Cancer' },
  { value: 'ovarian_cancer', label: 'Ovarian Cancer' },
  { value: 'cervical_cancer',label: 'Cervical Cancer' },
  { value: 'diabetes',       label: 'Diabetes' },
  { value: 'heart_disease',  label: 'Heart Disease' },
  { value: 'hypertension',   label: 'Hypertension' },
  { value: 'osteoporosis',   label: 'Osteoporosis' },
  { value: 'mental_illness', label: 'Mental Illness' },
  { value: 'none',           label: 'None known' },
];

const CYCLE_REGULARITY = [
  { value: 'regular',           label: 'Regular' },
  { value: 'irregular',         label: 'Irregular' },
  { value: 'absent',            label: 'Absent' },
  { value: 'on_contraceptive',  label: 'On contraceptive' },
];

/** Reusable checkbox group for multi-select enums */
function CheckboxGroup({ name, options, label, error }) {
  const { control } = useFormContext();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-slate-300">{label}</p>
      {/* defaultValue omitted — useForm({ defaultValues }) in AssessmentPage is the sole source of
          truth. A local defaultValue on Controller competes with the form store on reset (RHF v7). */}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {options.map(({ value, label: optLabel }) => {
              const checked = (field.value || []).includes(value);
              return (
                <label
                  key={value}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-colors
                    ${checked
                      ? 'border-primary-500 bg-primary-500/10 text-white'
                      : 'border-surface-border bg-surface text-slate-400 hover:border-slate-500'
                    }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...(field.value || []), value]
                        : (field.value || []).filter((v) => v !== value);
                      field.onChange(next);
                    }}
                  />
                  <span
                    className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center text-xs
                      ${checked ? 'border-primary-500 bg-primary-500 text-white' : 'border-slate-600'}`}
                  >
                    {checked && '✓'}
                  </span>
                  {optLabel}
                </label>
              );
            })}
          </div>
        )}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

/**
 * SelectField — labelled <select> wrapper with integrated error display.
 *
 * forwardRef is required so that React Hook Form's register() callback ref
 * reaches the native <select> element. React 18 drops the ref prop before
 * entering a plain function component; forwardRef bypasses that and passes
 * it through as the second argument, which we then attach to <select ref={ref}>.
 */
const SelectField = forwardRef(function SelectField(
  { id, label, error, children, ...rest },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={`input appearance-none ${error ? 'border-rose-500 focus:ring-rose-500' : ''}`}
        aria-invalid={!!error}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-xs text-rose-400 mt-0.5">{error}</p>}
    </div>
  );
});

SelectField.displayName = 'SelectField';

/**
 * Section 2 — Medical History
 */
function MedicalSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const e = errors.medical || {};

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-white">Medical History</h2>
        <p className="text-sm text-slate-400 mt-1">
          Existing conditions, family history, medications, and reproductive health details.
        </p>
      </div>

      {/* Existing conditions */}
      <CheckboxGroup
        name="medical.existingConditions"
        label="Existing Conditions (select all that apply)"
        options={EXISTING_CONDITIONS}
        error={e.existingConditions?.message}
      />

      {/* Family history */}
      <CheckboxGroup
        name="medical.familyHistory"
        label="Family History (select all that apply)"
        options={FAMILY_HISTORY}
        error={e.familyHistory?.message}
      />

      {/* Medications + Allergies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="medical-medications" className="text-sm font-medium text-slate-300">
            Current Medications
          </label>
          <textarea
            id="medical-medications"
            rows={3}
            placeholder="e.g. Metformin 500mg, Levothyroxine 50mcg (one per line)"
            className="input resize-none"
            {...register('medical.currentMedicationsRaw')}
          />
          <p className="text-xs text-slate-500">Enter each medication on a new line.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="medical-allergies" className="text-sm font-medium text-slate-300">
            Allergies
          </label>
          <textarea
            id="medical-allergies"
            rows={3}
            placeholder="e.g. Penicillin, Sulfa drugs (one per line)"
            className="input resize-none"
            {...register('medical.allergiesRaw')}
          />
          <p className="text-xs text-slate-500">Enter each allergy on a new line.</p>
        </div>
      </div>

      {/* Previous surgeries */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="medical-surgeries" className="text-sm font-medium text-slate-300">
          Previous Surgeries / Procedures
        </label>
        <textarea
          id="medical-surgeries"
          rows={2}
          placeholder="e.g. Appendectomy 2018, Hysterectomy 2022 (one per line)"
          className="input resize-none"
          {...register('medical.previousSurgeriesRaw')}
        />
      </div>

      {/* Menstrual info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputField
          id="medical-lmp"
          label="Last Menstrual Period"
          type="date"
          error={e.lastMenstrualPeriod?.message}
          {...register('medical.lastMenstrualPeriod')}
        />
        <InputField
          id="medical-cycle-length"
          label="Cycle Length (days)"
          type="number"
          min={14}
          max={60}
          placeholder="e.g. 28"
          error={e.cycleLength?.message}
          {...register('medical.cycleLength', {
            min: { value: 14, message: 'Min 14 days.' },
            max: { value: 60, message: 'Max 60 days.' },
            valueAsNumber: true,
          })}
        />
        <SelectField
          id="medical-cycle-regularity"
          label="Cycle Regularity"
          error={e.cycleRegularity?.message}
          {...register('medical.cycleRegularity')}
        >
          <option value="" disabled>Select</option>
          {CYCLE_REGULARITY.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </SelectField>
      </div>

      {/* Last check-up date — registered in form store and STEP_FIELDS; must be rendered */}
      <InputField
        id="medical-last-checkup"
        label="Last Check-up Date"
        type="date"
        error={e.lastCheckupDate?.message}
        {...register('medical.lastCheckupDate')}
      />

      {/* Screening tests */}
      <div>
        <p className="text-sm font-medium text-slate-300 mb-3">Screening Tests Completed</p>
        <div className="flex flex-wrap gap-4">
          {[
            { id: 'medical-mammogram', name: 'medical.mammogramDone', label: 'Mammogram' },
            { id: 'medical-pap',       name: 'medical.papSmearDone',  label: 'Pap Smear' },
            { id: 'medical-bone',      name: 'medical.bonesDensityTestDone', label: 'Bone Density Test' },
          ].map(({ id, name, label }) => (
            <label key={id} className="flex items-center gap-2 cursor-pointer group">
              <input
                id={id}
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600 bg-surface text-primary-500 focus:ring-primary-500"
                {...register(name)}
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MedicalSection;
