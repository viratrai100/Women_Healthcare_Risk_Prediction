import { forwardRef } from 'react';
import { useFormContext } from 'react-hook-form';
import InputField from '@/components/common/InputField.jsx';

/**
 * SelectField — labelled <select> wrapper with integrated error display.
 *
 * forwardRef is required so that React Hook Form's register() callback ref
 * reaches the native <select> element. React 18 drops the ref prop before
 * entering a plain function component; forwardRef bypasses that and passes
 * it through as the second argument, which we then attach to <select ref={ref}>.
 *
 * RangeField below does NOT need forwardRef because it calls register()
 * internally via useFormContext() and spreads the result directly onto the
 * native <input type="range"> — no wrapper ref hop occurs.
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

/** Visual range slider with live value display */
function RangeField({ id, label, min, max, unit, error, name }) {
  const { register, watch } = useFormContext();
  const value = watch(name) ?? Math.floor((min + max) / 2);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
        <span className="text-sm font-bold text-primary-400">
          {value} {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        className="w-full h-2 rounded-full accent-primary-500 cursor-pointer"
        {...register(name, { valueAsNumber: true })}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

/**
 * Section 3 — Lifestyle
 */
function LifestyleSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const e = errors.lifestyle || {};

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-white">Lifestyle</h2>
        <p className="text-sm text-slate-400 mt-1">
          Daily habits, diet, and activity patterns that influence your long-term health.
        </p>
      </div>

      {/* Smoking + Alcohol */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          id="lifestyle-smoking"
          label="Smoking Status"
          error={e.smokingStatus?.message}
          {...register('lifestyle.smokingStatus')}
        >
          <option value="" disabled>Select</option>
          <option value="never">Never smoked</option>
          <option value="former">Former smoker</option>
          <option value="current_light">Current — light (&lt;10/day)</option>
          <option value="current_heavy">Current — heavy (≥10/day)</option>
        </SelectField>

        <SelectField
          id="lifestyle-alcohol"
          label="Alcohol Use"
          error={e.alcoholUse?.message}
          {...register('lifestyle.alcoholUse')}
        >
          <option value="" disabled>Select</option>
          <option value="never">Never</option>
          <option value="occasional">Occasional</option>
          <option value="moderate">Moderate</option>
          <option value="heavy">Heavy</option>
        </SelectField>
      </div>

      {/* Physical activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          id="lifestyle-activity"
          label="Physical Activity Level"
          error={e.physicalActivity?.message}
          {...register('lifestyle.physicalActivity')}
        >
          <option value="" disabled>Select</option>
          <option value="sedentary">Sedentary (desk job, no exercise)</option>
          <option value="light">Light (walks, occasional activity)</option>
          <option value="moderate">Moderate (exercise 3× / week)</option>
          <option value="active">Active (exercise 5× / week)</option>
          <option value="very_active">Very Active (intense daily exercise)</option>
        </SelectField>

        <InputField
          id="lifestyle-activity-freq"
          label="Exercise Frequency (days/week)"
          type="number"
          min={0}
          max={7}
          placeholder="0–7"
          error={e.activityFrequency?.message}
          {...register('lifestyle.activityFrequency', {
            min: { value: 0, message: 'Min 0.' },
            max: { value: 7, message: 'Max 7 days/week.' },
            valueAsNumber: true,
          })}
        />
      </div>

      {/* Diet */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          id="lifestyle-diet"
          label="Diet Type"
          error={e.dietType?.message}
          {...register('lifestyle.dietType')}
        >
          <option value="" disabled>Select</option>
          <option value="omnivore">Omnivore</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="pescatarian">Pescatarian</option>
          <option value="keto">Ketogenic</option>
          <option value="other">Other</option>
        </SelectField>

        <SelectField
          id="lifestyle-processed-food"
          label="Processed Food Frequency"
          error={e.processedFoodFrequency?.message}
          {...register('lifestyle.processedFoodFrequency')}
        >
          <option value="" disabled>Select</option>
          <option value="rarely">Rarely</option>
          <option value="sometimes">Sometimes (a few times/week)</option>
          <option value="often">Often (most days)</option>
          <option value="daily">Daily</option>
        </SelectField>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <RangeField
          id="lifestyle-fruit-veg"
          name="lifestyle.fruitVegServings"
          label="Fruit & Veg Servings"
          min={0}
          max={20}
          unit="/ day"
          error={e.fruitVegServings?.message}
        />
        <RangeField
          id="lifestyle-water"
          name="lifestyle.waterIntake"
          label="Water Intake"
          min={0}
          max={10}
          unit="L / day"
          error={e.waterIntake?.message}
        />
        <RangeField
          id="lifestyle-sleep"
          name="lifestyle.sleepHours"
          label="Sleep Duration"
          min={0}
          max={12}
          unit="hrs"
          error={e.sleepHours?.message}
        />
        <RangeField
          id="lifestyle-screen-time"
          name="lifestyle.screenTimeHours"
          label="Screen Time"
          min={0}
          max={16}
          unit="hrs"
          error={e.screenTimeHours?.message}
        />
      </div>

      {/* Sleep quality + Stress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          id="lifestyle-sleep-quality"
          label="Sleep Quality"
          error={e.sleepQuality?.message}
          {...register('lifestyle.sleepQuality')}
        >
          <option value="" disabled>Select</option>
          <option value="poor">Poor</option>
          <option value="fair">Fair</option>
          <option value="good">Good</option>
          <option value="excellent">Excellent</option>
        </SelectField>

        <RangeField
          id="lifestyle-stress"
          name="lifestyle.stressLevel"
          label="Stress Level"
          min={1}
          max={10}
          unit="/ 10"
          error={e.stressLevel?.message}
        />
      </div>
    </div>
  );
}

export default LifestyleSection;
