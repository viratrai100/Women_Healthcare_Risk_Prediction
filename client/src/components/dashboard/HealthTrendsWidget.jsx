import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = ['Score Trend', 'Lifestyle Radar'];

// ── Line chart series for lifestyle ──────────────────────────────────────────
const SERIES = [
  { key: 'sleep',    label: 'Sleep (hrs)',    color: '#a78bfa' },
  { key: 'water',    label: 'Water (L)',      color: '#38bdf8' },
  { key: 'activity', label: 'Activity (d/w)', color: '#10b981' },
  { key: 'stress',   label: 'Stress (/10)',   color: '#f43f5e' },
];

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs shadow-xl min-w-[140px]">
      <p className="text-slate-400 font-medium mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-slate-300">{p.name}</span>
          </div>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function ScoreTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400">{label}</p>
      <p className="text-white font-bold text-base mt-0.5">{payload[0].value}</p>
    </div>
  );
}

function CustomLegend({ payload }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-slate-400">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Build a lifestyle radar from the latest assessment's inputData.
 * Maps known lifestyle fields to a 0–100 score for radar display.
 */
function buildLifestyleRadar(inputData) {
  if (!inputData?.lifestyle) return [];
  const l = inputData.lifestyle;

  // Normalise each metric to 0–100 where higher = healthier
  const sleep    = l.sleepHours     != null ? Math.min(100, (l.sleepHours    / 9)  * 100) : null;
  const water    = l.waterIntake    != null ? Math.min(100, (l.waterIntake   / 3)  * 100) : null;
  const activity = l.physicalActivity === 'very_active' ? 90
                 : l.physicalActivity === 'active'      ? 70
                 : l.physicalActivity === 'moderate'    ? 50
                 : l.physicalActivity === 'light'       ? 30
                 : l.physicalActivity === 'sedentary'   ? 10 : null;
  const stress   = l.stressLevel    != null ? Math.max(0, 100 - ((l.stressLevel - 1) / 9) * 100) : null;
  const nutrition = l.fruitVegServings != null ? Math.min(100, (l.fruitVegServings / 10) * 100) : null;

  const entries = [
    { metric: 'Sleep',     value: sleep },
    { metric: 'Hydration', value: water },
    { metric: 'Activity',  value: activity },
    { metric: 'Nutrition', value: nutrition },
    { metric: 'Stress',    value: stress },
  ].filter((e) => e.value !== null);

  return entries.map((e) => ({ ...e, value: Math.round(e.value) }));
}

/**
 * HealthTrendsWidget
 * Tab 1: Score trend line from real history.
 * Tab 2: Lifestyle radar from the latest assessment.
 *
 * Props:
 *   scoreHistory  {Array}  — [{ label, score }]
 *   inputData     {object} — latest assessment inputData (for radar)
 *   loading       {boolean}
 */
function HealthTrendsWidget({ scoreHistory = [], inputData = null, loading = false }) {
  const [activeTab, setActiveTab] = useState(0);

  const radarData = inputData ? buildLifestyleRadar(inputData) : [];

  return (
    <div className="card flex flex-col gap-4">
      {/* Header + tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Health Trends</h2>
          <p className="text-xs text-slate-500 mt-0.5">Based on your assessment history</p>
        </div>
        <div className="flex gap-1 bg-surface rounded-xl p-1 self-start sm:self-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              id={`trend-tab-${i}`}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${activeTab === i
                  ? 'bg-primary-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="h-60 bg-surface animate-pulse rounded-xl" />
      )}

      {/* Tab 0 — Score Trend */}
      {!loading && activeTab === 0 && (
        <div>
          {scoreHistory.length >= 2 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={scoreHistory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e4d" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ScoreTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Health Score"
                  stroke="#ec4899"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ec4899', stroke: '#0f0f1a', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="text-4xl">📈</span>
              <p className="text-sm text-slate-400 font-medium">No trend data yet</p>
              <p className="text-xs text-slate-600">Complete at least 2 assessments to see your score trend.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 1 — Lifestyle Radar */}
      {!loading && activeTab === 1 && (
        <div>
          {radarData.length >= 3 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <PolarGrid stroke="#2e2e4d" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    axisLine={false}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#ec4899"
                    fill="#ec4899"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>

              {/* Legend grid */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                {radarData.map(({ metric, value }) => (
                  <div key={metric} className="bg-surface rounded-xl p-2 text-center">
                    <p className="text-xs text-slate-500">{metric}</p>
                    <p className={`text-base font-bold mt-0.5 ${
                      value >= 75 ? 'text-emerald-400' : value >= 55 ? 'text-amber-400' : 'text-rose-400'
                    }`}>{value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="text-4xl">🧘</span>
              <p className="text-sm text-slate-400 font-medium">No lifestyle data yet</p>
              <p className="text-xs text-slate-600">Complete an assessment to see your lifestyle analysis.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HealthTrendsWidget;
