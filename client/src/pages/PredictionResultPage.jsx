import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarRadiusAxis, Tooltip,
} from 'recharts';
import Spinner            from '@/components/common/Spinner.jsx';
import ReportReader       from '@/components/common/ReportReader.jsx';
import ShareReportModal   from '@/components/common/ShareReportModal.jsx';
import { generateHealthReport } from '@/utils/generateHealthReport.js';
import { useAuth }        from '@/context/AuthContext.jsx';
import { predictionAPI } from '@/api/prediction.api.js';

// ─────────────────────────────────────────────────────────────────────────────
// Risk level helpers
// ─────────────────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  low:      { label: 'Low Risk',      icon: '✅', color: '#10b981', bg: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  moderate: { label: 'Moderate Risk', icon: '⚠️', color: '#f59e0b', bg: 'from-amber-500/20 to-amber-600/5',   border: 'border-amber-500/30',   text: 'text-amber-400',   badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30'   },
  high:     { label: 'High Risk',     icon: '🔴', color: '#ef4444', bg: 'from-rose-500/20 to-rose-600/5',     border: 'border-rose-500/30',     text: 'text-rose-400',     badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30'     },
  critical: { label: 'Critical',      icon: '🚨', color: '#dc2626', bg: 'from-red-600/25 to-red-700/5',       border: 'border-red-500/40',       text: 'text-red-400',      badge: 'bg-red-500/15 text-red-300 border-red-500/40'        },
};

function getRisk(level) {
  return RISK_CONFIG[level] ?? RISK_CONFIG.low;
}

function scoreToRisk(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'moderate';
  return 'low';
}

// ─────────────────────────────────────────────────────────────────────────────
// Disease icons
// ─────────────────────────────────────────────────────────────────────────────

const DISEASE_ICONS = {
  diabetes:               '🩸',
  anemia:                 '💉',
  hypertension:           '❤️',
  'heart disease':        '🫀',
  pcos:                   '🌸',
  'pregnancy':            '🤰',
  'pregnancy complications': '🤰',
  'thyroid disorder':     '🦋',
  thyroid:                '🦋',
  obesity:                '⚖️',
};

function getDiseaseIcon(name) {
  return DISEASE_ICONS[(name ?? '').toLowerCase()] ?? '🏥';
}

// ─────────────────────────────────────────────────────────────────────────────
// Health Score Gauge
// ─────────────────────────────────────────────────────────────────────────────

function HealthScoreGauge({ score, riskLevel, confidence, summary, generatedAt, provider }) {
  const risk  = getRisk(riskLevel);
  const color = risk.color;

  // Invert score for display: score=100 means healthy (green), score=0 means critical
  // The radial bar fills based on `value`, so we pass score directly (high score = healthy = green)
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className={`card bg-gradient-to-br ${risk.bg} ${risk.border} border flex flex-col gap-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Health Score</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Powered by {provider ?? 'Gemini AI'} · {generatedAt ? new Date(generatedAt).toLocaleDateString() : ''}
          </p>
        </div>
        <span className={`badge border text-xs px-3 py-1 font-semibold ${risk.badge}`}>
          {risk.icon} {risk.label}
        </span>
      </div>

      {/* Gauge + score */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Radial gauge */}
        <div className="relative flex-shrink-0" style={{ width: 180, height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="62%" outerRadius="82%"
              startAngle={220} endAngle={-40}
              data={[{ value: animated }]}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: '#2e2e4d' }}
                dataKey="value"
                cornerRadius={10}
                fill={color}
                angleAxisId={0}
                isAnimationActive
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-5xl font-black text-white leading-none">{score}</span>
            <span className="text-xs text-slate-400 mt-1">/ 100</span>
          </div>
        </div>

        {/* Text block */}
        <div className="flex flex-col gap-3 flex-1 text-center sm:text-left">
          <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            <div className="bg-surface/60 rounded-xl px-3 py-2">
              <p className="text-xs text-slate-500">Confidence</p>
              <p className="text-base font-bold text-white">{Math.round((confidence ?? 0) * 100)}%</p>
            </div>
            <div className="bg-surface/60 rounded-xl px-3 py-2">
              <p className="text-xs text-slate-500">Risk Level</p>
              <p className={`text-base font-bold capitalize ${risk.text}`}>{riskLevel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Disease Risk Card
// ─────────────────────────────────────────────────────────────────────────────

function DiseaseCard({ disease, riskScore, riskLevel, notes, index }) {
  const risk = getRisk(riskLevel ?? scoreToRisk(riskScore));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(riskScore), 300 + index * 80);
    return () => clearTimeout(t);
  }, [riskScore, index]);

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${risk.bg} ${risk.border} p-4 flex flex-col gap-3`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{getDiseaseIcon(disease)}</span>
          <span className="text-sm font-semibold text-white leading-tight">{disease}</span>
        </div>
        <span className={`badge border text-xs px-2.5 py-0.5 flex-shrink-0 font-medium ${risk.badge}`}>
          {risk.label}
        </span>
      </div>

      {/* Score + animated bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Risk Score</span>
          <span className={`text-xl font-black ${risk.text}`}>{riskScore}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-surface overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${width}%`, backgroundColor: risk.color }}
          />
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <p className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-2">{notes}</p>
      )}
    </div>
  );
}

function DiseaseRiskSection({ diseaseRisks }) {
  const sorted = [...(diseaseRisks ?? [])].sort((a, b) => b.riskScore - a.riskScore);

  // Radar data
  const radarData = sorted.map((d) => ({
    subject: d.disease?.split(' ')[0] ?? '',
    score:   d.riskScore,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Disease Risk Breakdown</h2>
          <p className="text-xs text-slate-500 mt-0.5">AI-assessed risk for each condition</p>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex gap-3 text-xs">
          {['low', 'moderate', 'high'].map((l) => (
            <div key={l} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_CONFIG[l].color }} />
              <span className="text-slate-400 capitalize">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Radar + cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Radar */}
        <div className="card lg:col-span-2 flex flex-col items-center gap-2">
          <p className="text-xs text-slate-400 font-medium">Risk Radar</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
              <PolarGrid stroke="#2e2e4d" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="score" stroke="#ec4899" fill="#ec4899" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #2e2e4d', borderRadius: 12, fontSize: 12 }}
                itemStyle={{ color: '#f472b6' }}
                formatter={(v) => [`${v}%`, 'Risk Score']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Disease cards grid */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map((d, i) => (
            <DiseaseCard key={d.disease} {...d} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Risk Factors Strip
// ─────────────────────────────────────────────────────────────────────────────

function RiskFactorsStrip({ riskFactors }) {
  if (!riskFactors?.length) return null;

  const sorted = [...riskFactors].sort((a, b) => b.contribution - a.contribution).slice(0, 6);

  return (
    <div className="card flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-white">Top Risk Factors</h2>
        <p className="text-xs text-slate-500 mt-0.5">Factors contributing most to your risk profile</p>
      </div>
      <div className="flex flex-col gap-3">
        {sorted.map((f, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300 font-medium">{f.factor}</span>
              <span className="text-xs font-bold text-primary-400">{f.contribution}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-700 ease-out"
                style={{ width: `${f.contribution}%` }}
              />
            </div>
            {f.description && (
              <p className="text-xs text-slate-500">{f.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendations
// ─────────────────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  urgent: { icon: '🚨', label: 'Urgent',  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',         dot: 'bg-red-500'     },
  high:   { icon: '🔴', label: 'High',    color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/30',        dot: 'bg-rose-500'    },
  medium: { icon: '🟡', label: 'Medium',  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',      dot: 'bg-amber-500'   },
  low:    { icon: '🟢', label: 'Low',     color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30',  dot: 'bg-emerald-500' },
};

function RecommendationCard({ priority, category, action, index }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
  return (
    <div
      className={`flex gap-3 p-4 rounded-xl border ${cfg.bg} transition-all duration-200 hover:scale-[1.01]`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`flex-shrink-0 mt-0.5 h-2 w-2 rounded-full ${cfg.dot} ring-4 ring-white/10 self-start mt-2`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-xs font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
          <span className="text-xs text-slate-500 bg-surface px-2 py-0.5 rounded-full border border-surface-border">
            {category}
          </span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">{action}</p>
      </div>
    </div>
  );
}

function RecommendationsSection({ recommendations }) {
  const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...(recommendations ?? [])].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
  );

  // Group by priority
  const groups = sorted.reduce((acc, rec) => {
    const p = rec.priority ?? 'medium';
    if (!acc[p]) acc[p] = [];
    acc[p].push(rec);
    return acc;
  }, {});

  return (
    <div className="card flex flex-col gap-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Personalised Recommendations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {sorted.length} AI-generated action items ordered by priority
          </p>
        </div>
        {/* Priority count pills */}
        <div className="flex flex-wrap gap-2">
          {['urgent', 'high', 'medium', 'low'].map((p) => groups[p]?.length ? (
            <span key={p} className={`badge border text-xs px-2.5 py-1 ${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color}`}>
              {PRIORITY_CONFIG[p].icon} {groups[p].length} {PRIORITY_CONFIG[p].label}
            </span>
          ) : null)}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {sorted.map((rec, i) => (
          <RecommendationCard key={i} {...rec} index={i} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function PredictionLoadingScreen() {
  const steps = [
    { icon: '🔬', text: 'Analysing your health data…'          },
    { icon: '🧠', text: 'Running AI risk models…'              },
    { icon: '📊', text: 'Calculating disease probabilities…'   },
    { icon: '💡', text: 'Generating personalised recommendations…' },
  ];
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setActiveStep((s) => (s + 1) % steps.length);
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8">
      {/* Pulsing orb */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-32 w-32 rounded-full bg-primary-500/20 animate-ping" />
        <div className="absolute h-24 w-24 rounded-full bg-primary-500/30 animate-pulse" />
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/30">
          <span className="text-3xl">{steps[activeStep].icon}</span>
        </div>
      </div>

      {/* Step text */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">AI Analysis in Progress</h2>
        <p className="text-slate-400 text-sm transition-all duration-500">{steps[activeStep].text}</p>
      </div>

      {/* Step dots */}
      <div className="flex gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === activeStep ? 'w-6 bg-primary-500' : 'w-2 bg-slate-600'
            }`}
          />
        ))}
      </div>

      <p className="text-xs text-slate-600 max-w-xs text-center">
        Gemini AI is evaluating 8 disease risks from your complete health assessment. This takes 10–20 seconds.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PredictionResultPage
 *
 * Accepts result in two ways:
 *   1. Via navigation state: navigate('/prediction', { state: { aiResult, assessment } })
 *   2. Via ?id= query param: fetches from GET /api/predictions/:id
 */
function PredictionResultPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [result,      setResult]     = useState(location.state?.aiResult ?? null);
  const [loading,     setLoading]    = useState(!location.state?.aiResult);
  const [error,       setError]      = useState(null);
  const [readerOpen,  setReaderOpen] = useState(false);
  const [shareOpen,   setShareOpen]  = useState(false);
  const [pdfLoading,  setPdfLoading] = useState(false);

  // Assessment input data (passed via navigation state for PDF)
  const inputData = location.state?.assessment ?? {};

  async function handleDownloadPdf(aiResult) {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      await generateHealthReport({ aiResult, user, inputData });
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setPdfLoading(false);
    }
  }

  // If no state passed, try to load by ID from URL ?id=
  const loadById = useCallback(async () => {
    const params = new URLSearchParams(location.search);
    const id     = params.get('id');
    if (!id) {
      setError('No prediction result available. Please complete a health assessment first.');
      setLoading(false);
      return;
    }
    try {
      const res = await predictionAPI.getOne(id);
      setResult(res.data?.data?.prediction ?? null);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load prediction result.');
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    if (!result) loadById();
  }, []);

  const aiResult = result;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="card">
          <PredictionLoadingScreen />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !aiResult) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card text-center py-12 flex flex-col items-center gap-4">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-white">Result Not Available</h2>
          <p className="text-slate-400 text-sm max-w-sm">{error ?? 'No prediction data found.'}</p>
          <div className="flex gap-3 mt-2">
            <Link to="/assessment" className="btn-primary">Start Assessment</Link>
            <Link to="/dashboard"  className="btn-ghost">Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const { riskScore, riskLevel, confidence, summary, diseaseRisks, riskFactors, recommendations, generatedAt, provider } = aiResult;

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-5xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">AI Risk Analysis</h1>
          <p className="text-slate-400 text-sm mt-1">
            Your personalised health risk prediction — powered by Gemini AI
          </p>
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {/* Read Report */}
          <button
            id="reader-open-btn"
            onClick={() => setReaderOpen((v) => !v)}
            title={readerOpen ? 'Close report reader' : 'Read report aloud'}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
              readerOpen
                ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'border-surface-border text-slate-300 hover:border-primary-500/60 hover:text-white hover:bg-surface-card'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M9.5 2a.5.5 0 0 1 .5.5V4a6 6 0 0 1 0 12v1.5a.5.5 0 0 1-1 0V16a6 6 0 0 1 0-12V2.5a.5.5 0 0 1 .5-.5zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.657-1.657a.5.5 0 0 1 .707 0A9.965 9.965 0 0 1 18 10a9.965 9.965 0 0 1-2.136 6.157.5.5 0 0 1-.778-.629A8.965 8.965 0 0 0 17 10a8.965 8.965 0 0 0-1.914-5.528.5.5 0 0 1 0-.707zM5.136 4.636a.5.5 0 0 1 0 .707A8.965 8.965 0 0 0 3 10a8.965 8.965 0 0 0 1.914 5.528.5.5 0 1 1-.778.629A9.965 9.965 0 0 1 2 10a9.965 9.965 0 0 1 2.136-6.157.5.5 0 0 1 .707 0z"/>
            </svg>
            {readerOpen ? 'Close Reader' : '🔊 Read Report'}
          </button>

          {/* Download PDF */}
          <button
            id="prediction-download-pdf-btn"
            onClick={() => handleDownloadPdf(aiResult)}
            disabled={pdfLoading}
            title="Download PDF report"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border border-surface-border text-slate-300 hover:border-primary-500/60 hover:text-white hover:bg-surface-card transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pdfLoading ? (
              <span className="h-3.5 w-3.5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            )}
            {pdfLoading ? 'Generating…' : '📄 Download PDF'}
          </button>

          {/* Share with Doctor */}
          <button
            id="prediction-share-btn"
            onClick={() => setShareOpen(true)}
            title="Share report with your doctor"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white shadow-lg shadow-primary-500/20 transition-all duration-200"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
            </svg>
            🩺 Share with Doctor
          </button>

          <Link
            to="/assessment"
            id="prediction-new-assessment-btn"
            className="btn-ghost !text-xs"
          >
            🔄 New Assessment
          </Link>
          <Link
            to="/dashboard"
            id="prediction-dashboard-btn"
            className="btn-primary !text-xs"
          >
            Dashboard →
          </Link>
        </div>
      </div>

      {/* ── 1. Health Score Gauge ────────────────────────────────────────────── */}
      <HealthScoreGauge
        score={riskScore}
        riskLevel={riskLevel}
        confidence={confidence}
        summary={summary}
        generatedAt={generatedAt}
        provider={provider}
      />

      {/* ── 2. Disease Risk Breakdown ────────────────────────────────────────── */}
      <DiseaseRiskSection diseaseRisks={diseaseRisks} />

      {/* ── 3. Top Risk Factors ──────────────────────────────────────────────── */}
      <RiskFactorsStrip riskFactors={riskFactors} />

      {/* ── 4. Recommendations ──────────────────────────────────────────────── */}
      <RecommendationsSection recommendations={recommendations} />

      {/* ── Disclaimer ──────────────────────────────────────────────────────── */}
      <div className="card border-slate-700/50 bg-slate-800/30 text-center">
        <p className="text-xs text-slate-500 leading-relaxed">
          ⚕️ <strong className="text-slate-400">Medical Disclaimer:</strong> This AI risk assessment is for informational purposes only
          and does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare
          professional for personalised medical guidance.
        </p>
      </div>

      {/* ── Floating Report Reader ───────────────────────────────────────────── */}
      {readerOpen && <ReportReader aiResult={aiResult} />}

      {/* ── Share with Doctor Modal ──────────────────────────────────────────── */}
      <ShareReportModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        aiResult={aiResult}
        user={user}
        inputData={inputData}
      />
    </div>
  );
}

export default PredictionResultPage;
