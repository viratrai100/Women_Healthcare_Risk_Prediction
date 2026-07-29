import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';

import HealthScoreWidget    from '@/components/dashboard/HealthScoreWidget.jsx';
import DiseaseCardsWidget   from '@/components/dashboard/DiseaseCardsWidget.jsx';
import BmiWidget            from '@/components/dashboard/BmiWidget.jsx';
import HealthTrendsWidget   from '@/components/dashboard/HealthTrendsWidget.jsx';
import PreviousReportsWidget from '@/components/dashboard/PreviousReportsWidget.jsx';

import { HEALTH_SCORE, DISEASE_RISKS, PREVIOUS_REPORTS } from '@/data/dashboard/mockData.js';

// ── Stat card definitions ─────────────────────────────────────────────────────
function buildStats(user) {
  const highRisks = DISEASE_RISKS.filter((d) => d.level === 'high').length;
  return [
    {
      id: 'stat-health-score',
      label: 'Health Score',
      value: HEALTH_SCORE,
      unit: '/ 100',
      icon: '🏥',
      color: 'text-primary-400',
      bg: 'from-primary-500/20 to-primary-600/5',
      border: 'border-primary-500/20',
    },
    {
      id: 'stat-high-risks',
      label: 'High Risk Flags',
      value: highRisks,
      unit: 'conditions',
      icon: '⚠️',
      color: highRisks > 0 ? 'text-rose-400' : 'text-emerald-400',
      bg: highRisks > 0 ? 'from-rose-500/20 to-rose-600/5' : 'from-emerald-500/20 to-emerald-600/5',
      border: highRisks > 0 ? 'border-rose-500/20' : 'border-emerald-500/20',
    },
    {
      id: 'stat-reports',
      label: 'Reports',
      value: PREVIOUS_REPORTS.length,
      unit: 'assessments',
      icon: '📄',
      color: 'text-amber-400',
      bg: 'from-amber-500/20 to-amber-600/5',
      border: 'border-amber-500/20',
    },
    {
      id: 'stat-account',
      label: 'Account',
      value: user?.role ?? '—',
      unit: 'role',
      icon: '👤',
      color: 'text-sky-400',
      bg: 'from-sky-500/20 to-sky-600/5',
      border: 'border-sky-500/20',
    },
  ];
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function DashboardPage() {
  const { user } = useAuth();
  const stats = buildStats(user);

  return (
    <div className="flex flex-col gap-8 pb-12">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white leading-tight">
            Health Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back,{' '}
            <span className="text-primary-400 font-medium">{user?.name?.split(' ')[0]}</span>
            {' '}— here's your personalised health overview.
          </p>
        </div>
        <Link
          to="/assessment"
          id="dashboard-start-assessment-btn"
          className="btn-primary self-start sm:self-auto flex-shrink-0"
        >
          🩺 New Assessment
        </Link>
      </div>

      {/* ── Summary stat strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ id, label, value, unit, icon, color, bg, border }) => (
          <div
            key={id}
            id={id}
            className={`rounded-2xl border bg-gradient-to-br ${bg} ${border} p-4 flex flex-col gap-1`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">{label}</span>
              <span className="text-lg">{icon}</span>
            </div>
            <div className="flex items-end gap-1.5 mt-1">
              <span className={`text-2xl font-black capitalize ${color}`}>{value}</span>
              <span className="text-xs text-slate-500 mb-0.5">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Health Score (left, tall) + BMI (right, tall) ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HealthScoreWidget />
        <BmiWidget />
      </div>

      {/* ── Row 2: Disease Risk Cards (full width) ────────────────────────────── */}
      <DiseaseCardsWidget />

      {/* ── Row 3: Health Trends (full width) ─────────────────────────────────── */}
      <HealthTrendsWidget />

      {/* ── Row 4: Previous Reports (full width) ──────────────────────────────── */}
      <PreviousReportsWidget />

      {/* ── AI coming soon ribbon ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-primary-500/20 bg-gradient-to-r from-primary-500/10 via-rose-500/5 to-transparent p-5">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="text-4xl flex-shrink-0">🤖</div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-white">
              AI Risk Analysis — Coming Soon
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Your data is already being collected. Once the AI engine is integrated, every widget above
              will be powered by real predictions from your health assessment.
            </p>
          </div>
          <Link
            to="/assessment"
            id="dashboard-ai-cta-btn"
            className="btn-primary flex-shrink-0 !text-xs !px-4 !py-2"
          >
            Start Assessment →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
