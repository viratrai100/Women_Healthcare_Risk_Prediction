/**
 * useSpeechReport.js
 *
 * Custom hook wrapping the Web Speech API (SpeechSynthesis) for reading
 * an AI health report aloud.
 *
 * Returns:
 *   state     — 'idle' | 'speaking' | 'paused' | 'unsupported'
 *   progress  — 0–100 (character-based estimate)
 *   currentSection — label of the section currently being read
 *   start()   — begin reading from the top
 *   pause()   — pause mid-speech
 *   resume()  — resume from where it paused
 *   stop()    — cancel and reset to idle
 *
 * Notes:
 *   - Uses utterance boundary events to track word progress
 *   - Each section is a separate SpeechSynthesisUtterance so that
 *     we get clear section labels and reliable boundary events
 *   - Prefers a female English voice when available (appropriate for
 *     a women's healthcare app)
 *   - Cleans up (cancels) on unmount automatically
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Report script builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts the AI result object into an ordered array of labelled sections,
 * each containing natural-language text for TTS.
 *
 * @param {object} aiResult
 * @returns {Array<{ label: string, text: string }>}
 */
export function buildReportScript(aiResult) {
  if (!aiResult) return [];

  const {
    riskScore,
    riskLevel,
    confidence,
    summary,
    diseaseRisks   = [],
    riskFactors    = [],
    recommendations = [],
    provider,
  } = aiResult;

  const sections = [];

  // ── Introduction ─────────────────────────────────────────────────────────────
  sections.push({
    label: 'Introduction',
    text: [
      'Your AI Health Risk Report. Powered by Gemini A I.',
      `Overall Health Score: ${riskScore} out of 100.`,
      `Risk Level: ${riskLevel}.`,
      `AI Confidence: ${Math.round((confidence ?? 0) * 100)} percent.`,
      summary ? summary : '',
    ].filter(Boolean).join(' '),
  });

  // ── Disease Risks ─────────────────────────────────────────────────────────────
  if (diseaseRisks.length > 0) {
    const sorted = [...diseaseRisks].sort((a, b) => b.riskScore - a.riskScore);

    const diseaseLines = sorted.map((d) =>
      `${d.disease}: ${d.riskScore} percent risk, rated ${d.riskLevel}.${d.notes ? ' ' + d.notes : ''}`
    );

    sections.push({
      label: 'Disease Risks',
      text: [
        'Section 2: Disease Risk Breakdown.',
        `Your risk was assessed across ${diseaseRisks.length} conditions.`,
        ...diseaseLines,
      ].join(' '),
    });
  }

  // ── Top Risk Factors ──────────────────────────────────────────────────────────
  if (riskFactors.length > 0) {
    const topFactors = [...riskFactors]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 5);

    const factorLines = topFactors.map((f) =>
      `${f.factor}, contributing ${f.contribution} percent.${f.description ? ' ' + f.description : ''}`
    );

    sections.push({
      label: 'Risk Factors',
      text: [
        'Section 3: Top Risk Factors.',
        ...factorLines,
      ].join(' '),
    });
  }

  // ── Recommendations ───────────────────────────────────────────────────────────
  if (recommendations.length > 0) {
    const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...recommendations].sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
    );

    const recLines = sorted.map((r, i) =>
      `Recommendation ${i + 1}: Priority ${r.priority}. Category: ${r.category}. ${r.action}`
    );

    sections.push({
      label: 'Recommendations',
      text: [
        `Section 4: Personalised Recommendations. ${sorted.length} action items follow.`,
        ...recLines,
      ].join(' '),
    });
  }

  // ── Closing disclaimer ────────────────────────────────────────────────────────
  sections.push({
    label: 'Disclaimer',
    text: 'Medical disclaimer: This AI risk assessment is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for personalised medical guidance. End of report.',
  });

  return sections;
}

// ─────────────────────────────────────────────────────────────────────────────
// Voice selector
// ─────────────────────────────────────────────────────────────────────────────

function pickVoice(voices) {
  if (!voices?.length) return null;

  // 1. Prefer female English voice
  const femaleEn = voices.find(
    (v) => v.lang.startsWith('en') && /female|zira|samantha|karen|victoria|moira/i.test(v.name)
  );
  if (femaleEn) return femaleEn;

  // 2. Any English voice
  const anyEn = voices.find((v) => v.lang.startsWith('en'));
  if (anyEn) return anyEn;

  // 3. Fallback to first available
  return voices[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} aiResult — the canonical AI prediction result
 * @param {object} [options]
 * @param {number} [options.rate=0.95]   — speech rate (0.5–2)
 * @param {number} [options.pitch=1.0]   — pitch  (0–2)
 * @param {number} [options.volume=1.0]  — volume (0–1)
 */
export function useSpeechReport(aiResult, { rate = 0.95, pitch = 1.0, volume = 1.0 } = {}) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const supported = !!synth;

  const [state,          setState]          = useState(supported ? 'idle' : 'unsupported');
  const [progress,       setProgress]       = useState(0);    // 0–100
  const [currentSection, setCurrentSection] = useState('');

  // Refs — don't need re-renders
  const utterancesRef   = useRef([]);   // array of SpeechSynthesisUtterance
  const sectionIndexRef = useRef(0);    // which utterance is active
  const totalCharsRef   = useRef(0);    // total char count across all sections
  const spokenCharsRef  = useRef(0);    // chars spoken so far (from completed sections)
  const voiceRef        = useRef(null);

  // Load voices once (some browsers load them async)
  useEffect(() => {
    if (!synth) return;
    const load = () => {
      voiceRef.current = pickVoice(synth.getVoices());
    };
    load();
    synth.addEventListener('voiceschanged', load);
    return () => synth.removeEventListener('voiceschanged', load);
  }, []);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (synth) synth.cancel();
    };
  }, []);

  // Build utterances from the script
  const buildUtterances = useCallback(() => {
    if (!synth) return [];
    const script = buildReportScript(aiResult);
    if (!script.length) return [];

    const total = script.reduce((s, sec) => s + sec.text.length, 0);
    totalCharsRef.current  = total;
    spokenCharsRef.current = 0;
    sectionIndexRef.current = 0;

    return script.map((section, idx) => {
      const utt        = new SpeechSynthesisUtterance(section.text);
      utt.rate         = rate;
      utt.pitch        = pitch;
      utt.volume       = volume;
      if (voiceRef.current) utt.voice = voiceRef.current;

      // Track word-boundary progress within this utterance
      utt.onboundary = (e) => {
        if (e.name !== 'word') return;
        const charsDone = spokenCharsRef.current + (e.charIndex ?? 0);
        const pct       = Math.min(100, Math.round((charsDone / totalCharsRef.current) * 100));
        setProgress(pct);
      };

      utt.onstart = () => {
        sectionIndexRef.current = idx;
        setCurrentSection(section.label);
        setState('speaking');
      };

      utt.onend = () => {
        // Accumulate chars from this completed section
        spokenCharsRef.current += section.text.length;

        // If last utterance just ended
        if (idx === script.length - 1) {
          setProgress(100);
          setCurrentSection('');
          setState('idle');
        }
      };

      utt.onerror = (e) => {
        // 'interrupted' fires on cancel — treat as normal stop, not an error
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        console.error('[useSpeechReport] TTS error:', e.error);
        setState('idle');
      };

      return utt;
    });
  }, [aiResult, rate, pitch, volume]);

  // ── Controls ─────────────────────────────────────────────────────────────────

  const start = useCallback(() => {
    if (!synth) return;
    synth.cancel(); // clear any queue
    setProgress(0);
    setState('speaking');

    const utts = buildUtterances();
    utterancesRef.current = utts;
    utts.forEach((u) => synth.speak(u));
  }, [buildUtterances]);

  const pause = useCallback(() => {
    if (!synth || state !== 'speaking') return;
    synth.pause();
    setState('paused');
  }, [state]);

  const resume = useCallback(() => {
    if (!synth || state !== 'paused') return;
    synth.resume();
    setState('speaking');
  }, [state]);

  const stop = useCallback(() => {
    if (!synth) return;
    synth.cancel();
    setProgress(0);
    setCurrentSection('');
    setState('idle');
  }, []);

  return { state, progress, currentSection, start, pause, resume, stop, supported };
}
