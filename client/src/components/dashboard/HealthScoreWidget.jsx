import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

// ── Score ring colour ──────────────────────────────────────────────────────────
function getScoreColor(score) {
  if (score >= 80) return '#10b981'; // emerald
  if (score >= 60) return '#f59e0b'; // amber
  return '#ef4444';                  // red
}

function getScoreLabel(score) {
  if (score >= 80) return { text: 'Excellent', color: 'text-emerald-400' };
  if (score >= 60) return { text: 'Good',      color: 'text-amber-400'   };
  return             { text: 'At Risk',  color: 'text-rose-400'    };
}

// ── Custom tooltip for the trend line ─────────────────────────────────────────
function ScoreTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400">{label}</p>
      <p className="text-white font-bold text-base mt-0.5">{payload[0].value}</p>
    </div>
  );
}

// ── Skeleton placeholder ───────────────────────────────────────────────────────
function SkeletonBar({ w = 'w-full', h = 'h-3' }) {
  return <div className={`${w} ${h} rounded-full bg-surface animate-pulse`} />;
}

/**
 * HealthScoreWidget
 * Radial gauge showing the current overall health score + trend line.
 *
 * Props:
 *   score       {number}   — 0–100 risk score (required)
 *   history     {Array}    — [{ label, score }] for trend line
 *   loading     {boolean}  — show skeleton while fetching
 */
function HealthScoreWidget({ score = 0, history = [], loading = false }) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  const radialData = [{ value: score }];

  if (loading) {
    return (
      <div className="card flex flex-col gap-4 h-full">
        <SkeletonBar w="w-1/2" h="h-4" />
        <div className="flex items-center justify-center" style={{ height: 200 }}>
          <div className="h-36 w-36 rounded-full bg-surface animate-pulse" />
        </div>
        <SkeletonBar />
        <SkeletonBar w="w-3/4" />
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Health Score</h2>
          <p className="text-xs text-slate-500 mt-0.5">Overall wellness index</p>
        </div>
        <span className={`badge border px-3 py-1 text-xs font-semibold ${
          score >= 80
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : score >= 60
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {label.text}
        </span>
      </div>

      {/* Radial gauge */}
      <div className="relative flex items-center justify-center" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="68%"
            outerRadius="85%"
            startAngle={220}
            endAngle={-40}
            data={radialData}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            {/* Track */}
            <RadialBar
              background={{ fill: '#2e2e4d' }}
              dataKey="value"
              cornerRadius={10}
              fill={color}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Centre label */}
        <div className="absolute flex flex-col items-center pointer-events-none">
          <span className="text-5xl font-black text-white leading-none">{score}</span>
          <span className="text-xs text-slate-400 mt-1">out of 100</span>
        </div>
      </div>

      {/* Trend chart */}
      <div>
        <p className="text-xs text-slate-500 mb-2 font-medium">Score Trend</p>
        {history.length >= 2 ? (
          <ResponsiveContainer width="100%" height={70}>
            <LineChart data={history} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e4d" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ScoreTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke={color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: color, stroke: '#0f0f1a', strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-slate-600 text-center py-4">
            Complete more assessments to see your score trend.
          </p>
        )}
      </div>
    </div>
  );
}

export default HealthScoreWidget;
