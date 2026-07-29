import { useState, useEffect, useCallback } from 'react';
import { reportAPI } from '@/api/report.api.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function riskBadge(level) {
  const map = {
    low:      { bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: 'Low' },
    moderate: { bg: 'bg-amber-500/15   text-amber-400   border-amber-500/30',   label: 'Moderate' },
    high:     { bg: 'bg-orange-500/15  text-orange-400  border-orange-500/30',  label: 'High' },
    critical: { bg: 'bg-rose-500/15    text-rose-400    border-rose-500/30',    label: 'Critical' },
  };
  return map[level] || { bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: level };
}

function scoreColor(score) {
  if (score >= 70) return 'text-rose-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-emerald-400';
}

function scoreRingColor(score) {
  if (score >= 70) return 'border-rose-500';
  if (score >= 40) return 'border-amber-500';
  return 'border-emerald-500';
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RiskBadge({ level }) {
  const { bg, label } = riskBadge(level);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg}`}>
      {label}
    </span>
  );
}

/** Modal to view full report details */
function ReportModal({ report, onClose }) {
  if (!report) return null;

  return (
    <div
      id="report-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target.id === 'report-modal-backdrop' && onClose()}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-surface-border bg-surface-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-surface-card px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">Report Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(report.createdAt)}</p>
          </div>
          <button
            id="report-modal-close"
            onClick={onClose}
            className="btn-ghost !px-3 !py-1.5 !text-xs"
          >
            ✕ Close
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">
          {/* Overview row */}
          <div className="flex items-center gap-6">
            <div className={`flex-shrink-0 h-20 w-20 rounded-full border-4 flex items-center justify-center ${scoreRingColor(report.riskScore)}`}>
              <span className={`text-2xl font-black ${scoreColor(report.riskScore)}`}>{report.riskScore}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-semibold text-sm">Risk Score</span>
                <RiskBadge level={report.riskLevel} />
              </div>
              <p className="text-xs text-slate-400">Model: <span className="text-slate-300">{report.modelVersion || 'N/A'}</span></p>
            </div>
          </div>

          {/* Summary / recommendation */}
          {report.recommendation && (
            <div className="rounded-xl border border-surface-border bg-surface/50 p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">AI Summary</p>
              <p className="text-sm text-slate-300 leading-relaxed">{report.recommendation}</p>
            </div>
          )}

          {/* Risk factors */}
          {report.riskFactors?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Risk Factors</p>
              <div className="flex flex-col gap-2">
                {report.riskFactors.map((rf, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 flex-1 min-w-0 truncate">{rf.factor}</span>
                    <div className="relative h-2 w-32 rounded-full bg-surface overflow-hidden flex-shrink-0">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary-500"
                        style={{ width: `${Math.min(100, rf.contribution || 0)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right flex-shrink-0">
                      {rf.contribution != null ? `${rf.contribution}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Delete confirmation dialog */
function DeleteConfirm({ onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-surface-card shadow-2xl p-6 flex flex-col gap-4">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-white font-semibold text-lg">Delete Report?</h3>
          <p className="text-slate-400 text-sm mt-1">
            This action is permanent and cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            id="delete-cancel-btn"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 btn-ghost !py-2"
          >
            Cancel
          </button>
          <button
            id="delete-confirm-btn"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium py-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">{hasFilters ? '🔍' : '📋'}</div>
      <p className="text-white font-semibold text-lg mb-1">
        {hasFilters ? 'No reports match your filters' : 'No reports yet'}
      </p>
      <p className="text-slate-400 text-sm">
        {hasFilters
          ? 'Try adjusting your search or filter criteria.'
          : 'Complete a health assessment to generate your first report.'}
      </p>
    </div>
  );
}

// ── Report card ────────────────────────────────────────────────────────────────
function ReportCard({ report, onView, onDelete }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border border-surface-border bg-surface-card hover:border-slate-600 transition-all duration-200 group">
      {/* Score ring */}
      <div className={`flex-shrink-0 h-16 w-16 rounded-full border-4 flex items-center justify-center ${scoreRingColor(report.riskScore)}`}>
        <span className={`text-xl font-black ${scoreColor(report.riskScore)}`}>{report.riskScore}</span>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <RiskBadge level={report.riskLevel} />
          <span className="text-xs text-slate-500">{formatDate(report.createdAt)}</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed line-clamp-2 mt-1">
          {report.recommendation || 'No summary available.'}
        </p>
        {/* Risk factor pills */}
        {report.riskFactors?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {report.riskFactors.slice(0, 3).map((rf, i) => (
              <span key={i} className="text-xs text-slate-500 bg-surface border border-surface-border rounded-full px-2 py-0.5">
                {rf.factor}
              </span>
            ))}
            {report.riskFactors.length > 3 && (
              <span className="text-xs text-slate-500 bg-surface border border-surface-border rounded-full px-2 py-0.5">
                +{report.riskFactors.length - 3} more
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-slate-600 mt-1.5">Model: {report.modelVersion || 'N/A'}</p>
      </div>

      {/* Actions */}
      <div className="flex sm:flex-col gap-2 sm:self-start flex-shrink-0">
        <button
          id={`view-report-${report._id}`}
          onClick={() => onView(report)}
          className="btn-ghost !px-3 !py-1.5 !text-xs"
        >
          📄 View
        </button>
        <button
          id={`delete-report-${report._id}`}
          onClick={() => onDelete(report._id)}
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs px-3 py-1.5 transition-colors"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────
function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        id="pagination-prev"
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="btn-ghost !px-3 !py-1.5 !text-xs disabled:opacity-30"
      >
        ← Prev
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          id={`pagination-page-${p}`}
          onClick={() => onPage(p)}
          className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
            p === page
              ? 'bg-primary-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        id="pagination-next"
        onClick={() => onPage(page + 1)}
        disabled={page === pages}
        className="btn-ghost !px-3 !py-1.5 !text-xs disabled:opacity-30"
      >
        Next →
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const RISK_LEVELS = ['', 'low', 'moderate', 'high', 'critical'];

function ReportHistoryPage() {
  const [reports, setReports]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Filters
  const [search, setSearch]         = useState('');
  const [riskLevel, setRiskLevel]   = useState('');
  const [fromDate, setFromDate]     = useState('');
  const [toDate, setToDate]         = useState('');
  const [page, setPage]             = useState(1);

  // Modal / confirm state
  const [viewReport, setViewReport]       = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading]   = useState(false);

  const hasFilters = !!(search || riskLevel || fromDate || toDate);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchReports = useCallback(async (currentPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage, limit: 10 };
      if (search)    params.search    = search;
      if (riskLevel) params.riskLevel = riskLevel;
      if (fromDate)  params.from      = fromDate;
      if (toDate)    params.to        = toDate;

      const res = await reportAPI.list(params);
      setReports(res.data.data.reports);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [search, riskLevel, fromDate, toDate]);

  useEffect(() => {
    fetchReports(page);
  }, [fetchReports, page]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReports(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setRiskLevel('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      await reportAPI.remove(deleteTargetId);
      setDeleteTargetId(null);
      // Refresh
      fetchReports(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete report.');
      setDeleteTargetId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {/* Modals */}
      {viewReport  && <ReportModal report={viewReport} onClose={() => setViewReport(null)} />}
      {deleteTargetId && (
        <DeleteConfirm
          onConfirm={handleDelete}
          onCancel={() => setDeleteTargetId(null)}
          loading={deleteLoading}
        />
      )}

      <div className="flex flex-col gap-8 pb-12">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white leading-tight">Report History</h1>
            <p className="text-slate-400 text-sm mt-1">
              Browse, search, and manage all your AI health assessment reports.
            </p>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm bg-surface-card border border-surface-border rounded-xl px-4 py-2">
            <span>📋</span>
            <span><span className="text-white font-semibold">{pagination.total}</span> total reports</span>
          </div>
        </div>

        {/* ── Filters & Search ────────────────────────────────────────────── */}
        <form
          id="report-filter-form"
          onSubmit={handleSearch}
          className="card flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Search</label>
              <input
                id="report-search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by recommendation or model…"
                className="w-full rounded-xl border border-surface-border bg-surface px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>

            {/* Risk level */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Risk Level</label>
              <select
                id="report-risk-filter"
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface px-4 py-2 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
              >
                <option value="">All Levels</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* From date */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">From Date</label>
              <input
                id="report-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface px-4 py-2 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* To date */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">To Date</label>
              <input
                id="report-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface px-4 py-2 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="sm:col-span-1 lg:col-span-3 flex items-end gap-2">
              <button
                id="report-search-btn"
                type="submit"
                className="btn-primary !py-2"
              >
                🔍 Search
              </button>
              {hasFilters && (
                <button
                  id="report-clear-filters-btn"
                  type="button"
                  onClick={handleClearFilters}
                  className="btn-ghost !py-2"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
        </form>

        {/* ── Results ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-10 w-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
              <p className="text-slate-400 text-sm">Loading reports…</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
              <p className="text-rose-400 font-medium">{error}</p>
              <button
                onClick={() => fetchReports(page)}
                className="btn-ghost !text-xs !px-4 !py-2 mt-3"
              >
                Try again
              </button>
            </div>
          ) : reports.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            <>
              {reports.map((report) => (
                <ReportCard
                  key={report._id}
                  report={report}
                  onView={setViewReport}
                  onDelete={setDeleteTargetId}
                />
              ))}

              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onPage={(p) => { setPage(p); fetchReports(p); }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ReportHistoryPage;
