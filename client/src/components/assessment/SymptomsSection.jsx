import { useFormContext, Controller } from 'react-hook-form';

const SYMPTOM_GROUPS = [
  {
    title: '🌸 Reproductive',
    symptoms: [
      { value: 'irregular_periods',   label: 'Irregular Periods' },
      { value: 'heavy_bleeding',      label: 'Heavy Bleeding' },
      { value: 'pelvic_pain',         label: 'Pelvic Pain' },
      { value: 'vaginal_discharge',   label: 'Vaginal Discharge' },
    ],
  },
  {
    title: '🫁 Breast',
    symptoms: [
      { value: 'breast_lump',         label: 'Breast Lump' },
      { value: 'breast_pain',         label: 'Breast Pain' },
      { value: 'nipple_discharge',    label: 'Nipple Discharge' },
    ],
  },
  {
    title: '🌡️ Hormonal',
    symptoms: [
      { value: 'hot_flashes',         label: 'Hot Flashes' },
      { value: 'night_sweats',        label: 'Night Sweats' },
      { value: 'mood_swings',         label: 'Mood Swings' },
      { value: 'decreased_libido',    label: 'Decreased Libido' },
    ],
  },
  {
    title: '⚡ General',
    symptoms: [
      { value: 'fatigue',                   label: 'Fatigue' },
      { value: 'unexplained_weight_change',  label: 'Unexplained Weight Change' },
      { value: 'hair_loss',                 label: 'Hair Loss' },
      { value: 'excessive_hair_growth',     label: 'Excessive Hair Growth' },
      { value: 'frequent_urination',        label: 'Frequent Urination' },
      { value: 'painful_urination',         label: 'Painful Urination' },
      { value: 'bloating',                  label: 'Bloating' },
    ],
  },
  {
    title: '🦴 Musculoskeletal',
    symptoms: [
      { value: 'joint_pain',  label: 'Joint Pain' },
      { value: 'bone_pain',   label: 'Bone Pain' },
      { value: 'back_pain',   label: 'Back Pain' },
    ],
  },
  {
    title: '🧠 Mental Health',
    symptoms: [
      { value: 'anxiety',              label: 'Anxiety' },
      { value: 'depression',           label: 'Depression' },
      { value: 'brain_fog',            label: 'Brain Fog' },
      { value: 'sleep_disturbances',   label: 'Sleep Disturbances' },
    ],
  },
];

/**
 * Section 4 — Current Symptoms
 * Grouped checkbox checklist + severity / duration / notes.
 */
function SymptomsSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const e = errors.symptoms || {};

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-white">Current Symptoms</h2>
        <p className="text-sm text-slate-400 mt-1">
          Select any symptoms you are currently experiencing. Choose "None" if you have no symptoms.
        </p>
      </div>

      {/* Symptom checklist by group */}
      {/* defaultValue omitted — useForm({ defaultValues }) in AssessmentPage is the sole source of
          truth. A local defaultValue on Controller competes with the form store on reset (RHF v7). */}
      <Controller
        name="symptoms.current"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col gap-5">
            {SYMPTOM_GROUPS.map(({ title, symptoms }) => (
              <div key={title}>
                <p className="text-sm font-semibold text-slate-400 mb-2">{title}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {symptoms.map(({ value, label }) => {
                    const checked = (field.value || []).includes(value);
                    return (
                      <label
                        key={value}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-all
                          ${checked
                            ? 'border-rose-500 bg-rose-500/10 text-white'
                            : 'border-surface-border bg-surface text-slate-400 hover:border-slate-500 hover:text-slate-300'
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
                            ${checked ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-600'}`}
                        >
                          {checked && '✓'}
                        </span>
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* None option */}
            <div>
              <label className={`inline-flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-all
                  ${(field.value || []).includes('none')
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-surface-border text-slate-400 hover:border-slate-500'}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={(field.value || []).includes('none')}
                  onChange={(e) => {
                    field.onChange(e.target.checked ? ['none'] : []);
                  }}
                />
                <span
                  className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center text-xs
                    ${(field.value || []).includes('none') ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-600'}`}
                >
                  {(field.value || []).includes('none') && '✓'}
                </span>
                ✅ None of the above — I have no current symptoms
              </label>
            </div>
          </div>
        )}
      />

      {/* Severity + Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="symptoms-severity" className="text-sm font-medium text-slate-300">
            Overall Severity
          </label>
          <select
            id="symptoms-severity"
            className="input appearance-none"
            {...register('symptoms.severity')}
          >
            <option value="" disabled>Select severity</option>
            <option value="none">None</option>
            <option value="mild">Mild — noticeable but not disruptive</option>
            <option value="moderate">Moderate — affects daily activities</option>
            <option value="severe">Severe — significantly impacts life</option>
          </select>
          {e.severity && <p className="text-xs text-rose-400">{e.severity.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="symptoms-duration" className="text-sm font-medium text-slate-300">
            Symptom Duration
          </label>
          <select
            id="symptoms-duration"
            className="input appearance-none"
            {...register('symptoms.duration')}
          >
            <option value="" disabled>Select duration</option>
            <option value="less_than_week">Less than a week</option>
            <option value="one_to_four_weeks">1 – 4 weeks</option>
            <option value="one_to_six_months">1 – 6 months</option>
            <option value="more_than_six_months">More than 6 months</option>
          </select>
          {e.duration && <p className="text-xs text-rose-400">{e.duration.message}</p>}
        </div>
      </div>

      {/* Additional notes */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="symptoms-notes" className="text-sm font-medium text-slate-300">
          Additional Notes <span className="text-slate-500 font-normal">(optional)</span>
        </label>
        <textarea
          id="symptoms-notes"
          rows={4}
          maxLength={1000}
          placeholder="Describe anything else about your symptoms, concerns, or health questions…"
          className="input resize-none"
          {...register('symptoms.additionalNotes', {
            maxLength: { value: 1000, message: 'Maximum 1 000 characters.' },
          })}
        />
        {e.additionalNotes && (
          <p className="text-xs text-rose-400">{e.additionalNotes.message}</p>
        )}
      </div>
    </div>
  );
}

export default SymptomsSection;
