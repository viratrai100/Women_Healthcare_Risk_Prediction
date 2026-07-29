import { forwardRef } from 'react';
import { useFormContext } from 'react-hook-form';
import InputField from '@/components/common/InputField.jsx';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const MARITAL_STATUS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];
const PREGNANCY_STATUS = [
  { value: 'not_pregnant', label: 'Not pregnant' },
  { value: 'pregnant', label: 'Currently pregnant' },
  { value: 'postpartum', label: 'Postpartum (within 1 year)' },
  { value: 'not_applicable', label: 'Not applicable' },
];
const MENOPAUSAL_STATUS = [
  { value: 'pre_menopausal', label: 'Pre-menopausal' },
  { value: 'peri_menopausal', label: 'Peri-menopausal' },
  { value: 'post_menopausal', label: 'Post-menopausal' },
  { value: 'not_applicable', label: 'Not applicable' },
];

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
 * Section 1 — Personal Information
 * Consumes the parent <FormProvider> context via useFormContext.
 */
function PersonalSection() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const e = errors.personal || {};

  // Auto-derive age label hint from DOB (display only — actual age field is separate)
  const dob = watch('personal.dateOfBirth');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-white">Personal Information</h2>
        <p className="text-sm text-slate-400 mt-1">
          Basic demographics and biometric details — used to personalise your risk profile.
        </p>
      </div>

      {/* Row 1 — DOB + Age */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          id="personal-dob"
          label="Date of Birth *"
          type="date"
          error={e.dateOfBirth?.message}
          {...register('personal.dateOfBirth', {
            required: 'Date of birth is required.',
          })}
        />
        <InputField
          id="personal-age"
          label="Age *"
          type="number"
          min={10}
          max={120}
          placeholder="e.g. 32"
          error={e.age?.message}
          {...register('personal.age', {
            required: 'Age is required.',
            min: { value: 10, message: 'Minimum age is 10.' },
            max: { value: 120, message: 'Maximum age is 120.' },
            valueAsNumber: true,
          })}
        />
      </div>

      {/* Row 2 — Height + Weight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          id="personal-height"
          label="Height (cm) *"
          type="number"
          min={50}
          max={300}
          placeholder="e.g. 163"
          error={e.height?.message}
          {...register('personal.height', {
            required: 'Height is required.',
            min: { value: 50, message: 'Must be at least 50 cm.' },
            max: { value: 300, message: 'Must be 300 cm or less.' },
            valueAsNumber: true,
          })}
        />
        <InputField
          id="personal-weight"
          label="Weight (kg) *"
          type="number"
          min={20}
          max={500}
          placeholder="e.g. 60"
          error={e.weight?.message}
          {...register('personal.weight', {
            required: 'Weight is required.',
            min: { value: 20, message: 'Must be at least 20 kg.' },
            max: { value: 500, message: 'Must be 500 kg or less.' },
            valueAsNumber: true,
          })}
        />
      </div>

      {/* Row 3 — Blood group + Marital status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          id="personal-blood-group"
          label="Blood Group"
          error={e.bloodGroup?.message}
          {...register('personal.bloodGroup')}
        >
          <option value="" disabled>Select blood group</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </SelectField>

        <SelectField
          id="personal-marital-status"
          label="Marital Status"
          error={e.maritalStatus?.message}
          {...register('personal.maritalStatus')}
        >
          <option value="" disabled>Select status</option>
          {MARITAL_STATUS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </SelectField>
      </div>

      {/* Row 4 — Occupation + Ethnicity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          id="personal-occupation"
          label="Occupation"
          type="text"
          placeholder="e.g. Software Engineer"
          error={e.occupation?.message}
          {...register('personal.occupation', {
            maxLength: { value: 100, message: 'Maximum 100 characters.' },
          })}
        />
        <InputField
          id="personal-ethnicity"
          label="Ethnicity"
          type="text"
          placeholder="e.g. South Asian"
          error={e.ethnicity?.message}
          {...register('personal.ethnicity', {
            maxLength: { value: 80, message: 'Maximum 80 characters.' },
          })}
        />
      </div>

      {/* Row 5 — Pregnancy + Menopausal status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          id="personal-pregnancy-status"
          label="Pregnancy Status *"
          error={e.pregnancyStatus?.message}
          {...register('personal.pregnancyStatus', {
            required: 'Please select a pregnancy status.',
          })}
        >
          <option value="" disabled>Select status</option>
          {PREGNANCY_STATUS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </SelectField>

        <SelectField
          id="personal-menopausal-status"
          label="Menopausal Status *"
          error={e.menopausalStatus?.message}
          {...register('personal.menopausalStatus', {
            required: 'Please select a menopausal status.',
          })}
        >
          <option value="" disabled>Select status</option>
          {MENOPAUSAL_STATUS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </SelectField>
      </div>
    </div>
  );
}

export default PersonalSection;
