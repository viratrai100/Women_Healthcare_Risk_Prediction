import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

// ── BMI classification ────────────────────────────────────────────────────────
function getBmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-sky-400',    bg: 'bg-sky-500/10 border-sky-500/30',    bar: '#38bdf8' };
  if (bmi < 25)   return { label: 'Normal',       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', bar: '#10b981' };
  if (bmi < 30)   return { label: 'Overweight',   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',   bar: '#f59e0b' };
  return               { label: 'Obese',         color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/30',    bar: '#ef4444' };
}

// ── BMI zones for chart reference ─────────────────────────────────────────────
const BMI_ZONES = [
  { y: 18.5, label: '18.5', stroke: '#38bdf8'  },
  { y: 25,   label: '25',   stroke: '#10b981'  },
  { y: 30,   label: '30',   stroke: '#f59e0b'  },
];

function BmiTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const cat = getBmiCategory(payload[0].value);
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400">{label}</p>
      <p className="font-bold text-white text-sm mt-0.5">{payload[0].value}</p>
      <p className={`${cat.color} mt-0.5`}>{cat.label}</p>
    </div>
  );
}

function SkeletonBar({ w = 'w-full', h = 'h-3' }) {
  return <div className={`${w} ${h} rounded-full bg-surface animate-pulse`} />;
}

/**
 * BmiWidget
 * Shows the current BMI value, category, and a trend chart.
 *
 * Props:
 *   bmi     {number|null} — computed BMI (null = no data yet)
 *   height  {number|null} — height in cm
 *   weight  {number|null} — weight in kg
 *   loading {boolean}     — show skeleton
 */
function BmiWidget({ bmi = null, height = null, weight = null, loading = false }) {
  const hasBmi = bmi !== null && bmi > 0;
  const cat    = hasBmi ? getBmiCategory(bmi) : { label: '—', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30', bar: '#64748b' };

  // Normalise BMI for the visual bar (scale 10–40 → 0–100%)
  const barPct = hasBmi ? Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100)) : 0;

  if (loading) {
    return (
      <div className="card flex flex-col gap-5 h-full">
        <SkeletonBar w="w-1/3" h="h-4" />
        <SkeletonBar w="w-1/2" h="h-12" />
        <SkeletonBar />
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-xl p-3 h-14 animate-pulse" />
          <div className="bg-surface rounded-xl p-3 h-14 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">BMI</h2>
          <p className="text-xs text-slate-500 mt-0.5">Body Mass Index</p>
        </div>
        <span className={`badge border text-xs px-3 py-1 font-semibold ${cat.bg} ${cat.color}`}>
          {cat.label}
        </span>
      </div>

      {/* Big number */}
      <div className="flex items-end gap-3">
        <span className="text-6xl font-black text-white leading-none">
          {hasBmi ? bmi : '—'}
        </span>
        <span className="text-sm text-slate-500 mb-1">kg/m²</span>
      </div>

      {/* Colour spectrum bar */}
      <div>
        <div className="relative h-3 rounded-full overflow-hidden"
          style={{ background: 'linear-gradient(to right, #38bdf8 0%, #10b981 28%, #f59e0b 55%, #ef4444 100%)' }}
        >
          {hasBmi && (
            <div
              className="absolute top-1/2 -translate-y-1/2 h-5 w-1.5 rounded-full bg-white shadow-lg border border-slate-300"
              style={{ left: `calc(${barPct}% - 3px)` }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1 px-0.5">
          <span>10</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>40+</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Height', value: height ? `${height} cm` : '—' },
          { label: 'Weight', value: weight ? `${weight} kg` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface rounded-xl p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-base font-bold text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Empty state note */}
      {!hasBmi && (
        <p className="text-xs text-slate-600 text-center pt-2">
          Complete an assessment to see your BMI data.
        </p>
      )}
    </div>
  );
}

export default BmiWidget;
