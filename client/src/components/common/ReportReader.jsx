/**
 * ReportReader.jsx
 *
 * Floating sticky player for reading the AI health report aloud.
 * Uses the Web Speech API via the useSpeechReport hook.
 *
 * Features:
 *   - Start / Pause / Resume / Stop controls
 *   - Animated waveform bars while speaking
 *   - Progress bar with percentage
 *   - Current section label
 *   - Collapsible on mobile (minimise button)
 *   - Graceful unsupported-browser message
 */

import { useState } from 'react';
import { useSpeechReport } from '@/hooks/useSpeechReport.js';

// ─────────────────────────────────────────────────────────────────────────────
// Animated waveform — 5 bars that bounce while speaking
// ─────────────────────────────────────────────────────────────────────────────

function Waveform({ active }) {
  return (
    <div className="flex items-end gap-[3px] h-5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-primary-400 transition-all"
          style={{
            height: active ? undefined : '4px',
            animation: active
              ? `waveBar 0.9s ease-in-out infinite alternate`
              : 'none',
            animationDelay: active ? `${i * 0.13}s` : '0s',
            minHeight: '4px',
            maxHeight: '20px',
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section breadcrumb chips
// ─────────────────────────────────────────────────────────────────────────────

const ALL_SECTIONS = ['Introduction', 'Disease Risks', 'Risk Factors', 'Recommendations', 'Disclaimer'];

function SectionTrack({ currentSection }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {ALL_SECTIONS.map((s) => (
        <span
          key={s}
          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all duration-300 ${
            s === currentSection
              ? 'bg-primary-500/30 border-primary-500/50 text-primary-300 font-semibold'
              : 'bg-surface border-surface-border text-slate-600'
          }`}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Control button
// ─────────────────────────────────────────────────────────────────────────────

function CtrlBtn({ id, onClick, disabled, title, children, variant = 'ghost' }) {
  const base = 'flex items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary: 'w-11 h-11 bg-primary-600 hover:bg-primary-500 active:scale-95 text-white shadow-lg shadow-primary-500/30',
    ghost:   'w-9 h-9 border border-surface-border hover:border-slate-500 text-slate-400 hover:text-white hover:bg-surface-card active:scale-95',
    danger:  'w-9 h-9 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/60 active:scale-95',
  };
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} aiResult — the canonical AI prediction result object
 */
function ReportReader({ aiResult }) {
  const { state, progress, currentSection, start, pause, resume, stop, supported } =
    useSpeechReport(aiResult);

  const [minimised, setMinimised] = useState(false);

  const isSpeaking  = state === 'speaking';
  const isPaused    = state === 'paused';
  const isActive    = isSpeaking || isPaused;
  const isIdle      = state === 'idle';

  // ── Not supported ──────────────────────────────────────────────────────────
  if (!supported) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-md">
        <div className="card border-amber-500/30 bg-amber-500/5 text-center py-3">
          <p className="text-xs text-amber-400">
            🔇 Your browser does not support the Web Speech API.
            Try Chrome or Edge for audio report reading.
          </p>
        </div>
      </div>
    );
  }

  // ── Minimised pill ─────────────────────────────────────────────────────────
  if (minimised) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          id="reader-expand-btn"
          onClick={() => setMinimised(false)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-card border border-primary-500/40 shadow-xl shadow-primary-500/20 text-sm text-primary-300 hover:bg-primary-500/10 transition-all"
          title="Expand report reader"
        >
          <Waveform active={isSpeaking} />
          <span className="font-medium">Report Reader</span>
          {isActive && (
            <span className="text-xs text-slate-500 ml-1">{progress}%</span>
          )}
        </button>
      </div>
    );
  }

  // ── Full player ────────────────────────────────────────────────────────────
  return (
    <>
      {/* keyframes injected inline (avoids needing a CSS file edit) */}
      <style>{`
        @keyframes waveBar {
          0%   { height: 4px;  }
          100% { height: 20px; }
        }
      `}</style>

      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-xl"
        role="region"
        aria-label="Report audio reader"
      >
        <div
          className={`rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 ${
            isActive
              ? 'bg-surface-card/95 border-primary-500/40 shadow-primary-500/20'
              : 'bg-surface-card/90 border-surface-border'
          }`}
        >
          {/* ── Top bar ──────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            {/* Waveform / idle icon */}
            <div className="flex-shrink-0">
              {isSpeaking ? (
                <Waveform active />
              ) : (
                <div className="flex items-end gap-[3px] h-5">
                  {[4, 8, 12, 8, 4].map((h, i) => (
                    <div
                      key={i}
                      className="w-[3px] rounded-full bg-slate-600"
                      style={{ height: h }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {isIdle ? 'AI Health Report' : isSpeaking ? `Reading: ${currentSection}` : `Paused: ${currentSection}`}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Web Speech API · {isIdle ? 'Ready' : `${progress}% complete`}
              </p>
            </div>

            {/* Minimise */}
            <button
              id="reader-minimise-btn"
              onClick={() => setMinimised(true)}
              title="Minimise reader"
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-300 rounded-lg hover:bg-surface transition"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="1" y1="6" x2="11" y2="6" />
              </svg>
            </button>
          </div>

          {/* ── Progress bar ─────────────────────────────────────────────────── */}
          <div className="px-4 pb-2">
            <div className="relative h-1.5 w-full rounded-full bg-surface overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
              {/* Glowing tip */}
              {isActive && progress > 2 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary-400 shadow-lg shadow-primary-400/80 -translate-x-1/2 transition-all duration-500"
                  style={{ left: `${progress}%` }}
                />
              )}
            </div>
          </div>

          {/* ── Section track ─────────────────────────────────────────────────── */}
          <div className="px-4 pb-2">
            <SectionTrack currentSection={currentSection} />
          </div>

          {/* ── Controls ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-3 px-4 pb-4 pt-1">
            {/* Stop */}
            <CtrlBtn
              id="reader-stop-btn"
              onClick={stop}
              disabled={isIdle}
              title="Stop reading"
              variant="danger"
            >
              {/* Stop square */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="1" y="1" width="12" height="12" rx="2" />
              </svg>
            </CtrlBtn>

            {/* Play / Pause — primary CTA */}
            {isIdle || (!isSpeaking && !isPaused) ? (
              <CtrlBtn
                id="reader-play-btn"
                onClick={start}
                title="Read report aloud"
                variant="primary"
              >
                {/* Play triangle */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
                </svg>
              </CtrlBtn>
            ) : isSpeaking ? (
              <CtrlBtn
                id="reader-pause-btn"
                onClick={pause}
                title="Pause"
                variant="primary"
              >
                {/* Pause bars */}
                <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
                  <rect x="1" y="1" width="4" height="14" rx="1.5" />
                  <rect x="9" y="1" width="4" height="14" rx="1.5" />
                </svg>
              </CtrlBtn>
            ) : (
              <CtrlBtn
                id="reader-resume-btn"
                onClick={resume}
                title="Resume reading"
                variant="primary"
              >
                {/* Play triangle */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
                </svg>
              </CtrlBtn>
            )}

            {/* Restart */}
            <CtrlBtn
              id="reader-restart-btn"
              onClick={start}
              disabled={isIdle && progress === 0}
              title="Restart from beginning"
              variant="ghost"
            >
              {/* Circular arrow */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 7A5.5 5.5 0 1 0 3 3.5" />
                <polyline points="1 1 1.5 3.5 4 3" />
              </svg>
            </CtrlBtn>
          </div>
        </div>
      </div>
    </>
  );
}

export default ReportReader;
