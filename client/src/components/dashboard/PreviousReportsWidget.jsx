import { Link } from 'react-router-dom';
import { PREVIOUS_REPORTS } from '@/data/dashboard/mockData.js';

// ── Score colour ───────────────────────────────────────────────────────────────
function scoreColor(score) {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

function scoreRingColor(score) {
  if (score >= 75) return 'border-emerald-500';
  if (score >= 60) return 'border-amber-500';
  return 'border-rose-500';
}

// ── Mini sparkline using CSS gradient bars ─────────────────────────────────────
function ScoreMiniBar({ score }) {
  const pct = Math.round(score);
  const color = score >= 75 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative h-1.5 w-16 rounded-full bg-surface overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

/**
 * PreviousReportsWidget
 * List of past health assessment reports with score, key highlights and CTA.
 */
function PreviousReportsWidget() {
  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Previous Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">{PREVIOUS_REPORTS.length} assessments on record</p>
        </div>
        <Link
          to="/assessment"
          id="reports-new-assessment-btn"
          className="btn-primary !px-3 !py-1.5 !text-xs"
        >
          + New
        </Link>
      </div>

      {/* Report list */}
      <div className="flex flex-col gap-3">
        {PREVIOUS_REPORTS.map((report, idx) => (
          <div
            key={report.id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-surface border border-surface-border hover:border-slate-600 transition-colors"
          >
            {/* Score ring */}
            <div className={`flex-shrink-0 h-14 w-14 rounded-full border-4 flex items-center justify-center ${scoreRingColor(report.score)}`}>
              <span className={`text-lg font-black ${scoreColor(report.score)}`}>{report.score}</span>
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{report.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{report.date}</p>
                </div>
                <ScoreMiniBar score={report.score} />
              </div>

              {/* Highlight tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {report.highlights.map((h) => (
                  <span
                    key={h}
                    className="text-xs text-slate-400 bg-surface-card border border-surface-border rounded-full px-2.5 py-0.5"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex sm:flex-col gap-2 sm:self-start flex-shrink-0">
              <Link
                id={`report-view-${report.id}`}
                to="/reports"
                className="btn-ghost !px-3 !py-1.5 !text-xs text-center"
              >
                📄 View
              </Link>
              <button
                id={`report-download-${report.id}`}
                className="btn-ghost !px-3 !py-1.5 !text-xs"
                onClick={() => {/* PDF download coming soon */}}
              >
                ⬇ PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-slate-600 text-center">
        <Link to="/reports" className="text-primary-400 hover:underline">View all reports →</Link>
      </p>
    </div>
  );
}

export default PreviousReportsWidget;
