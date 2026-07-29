import { useState } from 'react';

// ── Risk colour helpers ────────────────────────────────────────────────────────
const RISK_META = {
  low:      { bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', label: 'Low Risk'      },
  moderate: { bar: 'bg-amber-500',   text: 'text-amber-400',   badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',       label: 'Moderate Risk' },
  high:     { bar: 'bg-rose-500',    text: 'text-rose-400',    badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400',           label: 'High Risk'     },
  critical: { bar: 'bg-red-600',     text: 'text-red-400',     badge: 'bg-red-500/10 border-red-500/30 text-red-400',              label: 'Critical'      },
};

// Disease display config — maps names from API to icons
const DISEASE_ICON_MAP = {
  diabetes:                 '🩸',
  anemia:                   '💉',
  hypertension:             '❤️',
  'heart disease':          '🫀',
  pcos:                     '🌸',
  'pregnancy complications': '🤰',
  'thyroid disorder':       '🦋',
  obesity:                  '⚖️',
};

function getDiseaseIcon(name = '') {
  return DISEASE_ICON_MAP[name.toLowerCase()] ?? '🏥';
}

function classifyLevel(riskScore) {
  if (riskScore >= 80) return 'critical';
  if (riskScore >= 60) return 'high';
  if (riskScore >= 35) return 'moderate';
  return 'low';
}

function DiseaseCard({ disease, isExpanded, onToggle }) {
  const level = disease.riskLevel || classifyLevel(disease.riskScore ?? 0);
  const meta  = RISK_META[level] ?? RISK_META.low;

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden
        ${isExpanded ? 'border-surface-border bg-surface-card' : 'border-surface-border bg-surface-card hover:border-slate-600'}`}
      onClick={onToggle}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-2xl flex-shrink-0">
          {getDiseaseIcon(disease.disease ?? disease.name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-sm font-semibold text-white truncate">{disease.disease ?? disease.name}</p>
            <span className={`badge border text-xs px-2 py-0.5 flex-shrink-0 ${meta.badge}`}>
              {meta.label}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${meta.bar}`}
              style={{ width: `${disease.riskScore ?? disease.risk ?? 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-500">Risk Score</span>
            <span className={`text-xs font-bold ${meta.text}`}>{disease.riskScore ?? disease.risk ?? 0}%</span>
          </div>
        </div>

        {/* Chevron */}
        <div className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          ▾
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-surface-border pt-3 animate-[fadeIn_0.2s_ease]">
          <p className="text-sm text-slate-400 leading-relaxed">
            {disease.notes ?? disease.description ?? 'No additional detail available.'}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-4 flex items-center gap-3">
      <div className="h-11 w-11 rounded-xl bg-surface animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-surface animate-pulse rounded-full w-1/2" />
        <div className="h-1.5 bg-surface animate-pulse rounded-full w-full" />
      </div>
    </div>
  );
}

/**
 * DiseaseCardsWidget
 * Expandable risk cards for each tracked disease condition.
 *
 * Props:
 *   diseaseRisks  {Array}   — [{ disease, riskScore, riskLevel, notes }] from API
 *   loading       {boolean} — show skeletons while fetching
 */
function DiseaseCardsWidget({ diseaseRisks = [], loading = false }) {
  const [expandedId, setExpandedId] = useState(null);

  const summary = {
    critical: diseaseRisks.filter((d) => (d.riskLevel || classifyLevel(d.riskScore)) === 'critical').length,
    high:     diseaseRisks.filter((d) => (d.riskLevel || classifyLevel(d.riskScore)) === 'high').length,
    moderate: diseaseRisks.filter((d) => (d.riskLevel || classifyLevel(d.riskScore)) === 'moderate').length,
    low:      diseaseRisks.filter((d) => (d.riskLevel || classifyLevel(d.riskScore)) === 'low').length,
  };

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Disease Risk</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tap a card to see details</p>
        </div>
        {!loading && diseaseRisks.length > 0 && (
          <div className="flex gap-2 flex-wrap justify-end">
            {summary.critical > 0 && (
              <span className="badge bg-red-500/10 border border-red-500/30 text-red-400">
                {summary.critical} Critical
              </span>
            )}
            {summary.high > 0 && (
              <span className="badge bg-rose-500/10 border border-rose-500/30 text-rose-400">
                {summary.high} High
              </span>
            )}
            {summary.moderate > 0 && (
              <span className="badge bg-amber-500/10 border border-amber-500/30 text-amber-400">
                {summary.moderate} Moderate
              </span>
            )}
            {summary.low > 0 && (
              <span className="badge bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                {summary.low} Low
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && diseaseRisks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <span className="text-4xl">🩺</span>
          <p className="text-sm text-slate-400 font-medium">No assessment data yet</p>
          <p className="text-xs text-slate-600">Complete your first health assessment to see disease risk analysis.</p>
        </div>
      )}

      {/* Grid of cards */}
      {!loading && diseaseRisks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {diseaseRisks.map((disease, idx) => (
            <DiseaseCard
              key={disease.disease ?? idx}
              disease={disease}
              isExpanded={expandedId === (disease.disease ?? idx)}
              onToggle={() => setExpandedId(expandedId === (disease.disease ?? idx) ? null : (disease.disease ?? idx))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DiseaseCardsWidget;
