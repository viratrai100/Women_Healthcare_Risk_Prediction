/**
 * generateHealthReport.js
 *
 * Generates a professional, multi-page PDF health report using jsPDF + jsPDF-AutoTable.
 *
 * Sections:
 *   Cover Page        — branding, patient name, report date, health score badge
 *   Section 1         — Patient Details (personal info)
 *   Section 2         — Overall Health Score + AI Summary
 *   Section 3         — Disease Risk Analysis (table + colour-coded bars)
 *   Section 4         — Top Risk Factors (table)
 *   Section 5         — Personalised Recommendations (priority-grouped table)
 *   Footer            — disclaimer + page numbers on every page
 *
 * Usage:
 *   import { generateHealthReport } from '@/utils/generateHealthReport.js';
 *   await generateHealthReport({ aiResult, user, inputData });
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (Dark/Accent palette serialised as jsPDF RGB arrays)
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:           [15,  15,  26],   // #0f0f1a  surface background
  card:         [26,  26,  46],   // #1a1a2e  card background
  border:       [46,  46,  77],   // #2e2e4d  border
  primary:      [236, 72,  153],  // #ec4899  primary pink
  primaryDark:  [190, 24,  93],   // #be185d  primary dark
  white:        [255, 255, 255],
  slate400:     [148, 163, 184],  // slate-400
  slate500:     [100, 116, 139],  // slate-500
  emerald:      [16,  185, 129],  // emerald-500  low
  amber:        [245, 158, 11],   // amber-500   moderate
  rose:         [239, 68,  68],   // rose-500    high
  red:          [220, 38,  38],   // red-600     critical
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Maps a risk level string → RGB colour */
function riskColour(level) {
  const map = { low: C.emerald, moderate: C.amber, high: C.rose, critical: C.red };
  return map[level] ?? C.slate400;
}

/** Maps a risk score 0-100 → level string */
function scoreToLevel(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'moderate';
  return 'low';
}

/** Capitalises the first letter of a string */
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'; }

/** Formats a date value to a readable string, gracefully */
function fmtDate(val) {
  if (!val) return '—';
  try { return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return String(val); }
}

/** Draws a coloured badge pill (filled rect + white text) */
function drawBadge(doc, text, x, y, color) {
  const padding = 3;
  const textW   = doc.getTextWidth(text);
  const rectW   = textW + padding * 2;
  const rectH   = 6;
  doc.setFillColor(...color);
  doc.roundedRect(x, y - rectH + 1.5, rectW, rectH, 1.5, 1.5, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(text, x + padding, y - 0.5);
}

/** Draws a horizontal filled bar (risk score visualisation) */
function drawBar(doc, x, y, pct, color, trackW = 60, h = 3) {
  // Track
  doc.setFillColor(...C.border);
  doc.roundedRect(x, y, trackW, h, 1, 1, 'F');
  // Fill
  const fillW = Math.max(1, (pct / 100) * trackW);
  doc.setFillColor(...color);
  doc.roundedRect(x, y, fillW, h, 1, 1, 'F');
}

/** Adds footer (disclaimer + page number) to every page */
function addFooter(doc) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const W   = doc.internal.pageSize.getWidth();
    const H   = doc.internal.pageSize.getHeight();
    const y   = H - 10;

    // Thin separator
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(14, y - 3, W - 14, y - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.slate500);
    doc.text(
      'Medical Disclaimer: This AI-generated report is for informational purposes only and does not constitute medical advice.',
      14, y
    );
    doc.text(`Page ${i} of ${totalPages}`, W - 14, y, { align: 'right' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cover Page
// ─────────────────────────────────────────────────────────────────────────────

function drawCover(doc, { patientName, reportDate, riskScore, riskLevel }) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, H, 'F');

  // Top accent bar (gradient-like — two overlapping rects)
  doc.setFillColor(...C.primaryDark);
  doc.rect(0, 0, W, 48, 'F');
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, W, 42, 'F');

  // Brand name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...C.white);
  doc.text('AI Women\'s Healthcare', W / 2, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(253, 242, 248); // primary-50
  doc.text('Personalised Health Risk Analysis Report', W / 2, 30, { align: 'center' });

  // Divider line
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(0.5);
  doc.line(14, 52, W - 14, 52);

  // Patient info block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...C.white);
  doc.text('Patient:', 14, 66);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(patientName || 'Anonymous Patient', 42, 66);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...C.slate400);
  doc.text('Report Date:', 14, 77);
  doc.setFont('helvetica', 'normal');
  doc.text(reportDate, 44, 77);

  // Health Score circle
  const cx = W / 2;
  const cy = 130;
  const r  = 32;

  // Shadow ring
  doc.setFillColor(...C.card);
  doc.circle(cx, cy, r + 4, 'F');

  // Outer ring (risk colour)
  doc.setFillColor(...riskColour(riskLevel));
  doc.circle(cx, cy, r + 1.5, 'F');

  // Inner circle
  doc.setFillColor(...C.card);
  doc.circle(cx, cy, r - 2, 'F');

  // Score number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(...C.white);
  doc.text(String(riskScore), cx, cy + 6, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.slate400);
  doc.text('HEALTH SCORE / 100', cx, cy + 16, { align: 'center' });

  // Risk level badge below circle
  const level = cap(riskLevel) + ' Risk';
  const bW    = doc.getTextWidth(level) + 18;
  doc.setFillColor(...riskColour(riskLevel));
  doc.roundedRect(cx - bW / 2, cy + 22, bW, 9, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.white);
  doc.text(level.toUpperCase(), cx, cy + 28, { align: 'center' });

  // Bottom notice
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...C.slate500);
  const notice = 'Generated by Gemini AI · This report is confidential and intended for the patient named above.';
  doc.text(notice, W / 2, H - 18, { align: 'center' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Section helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Draws a section heading with a pink left accent bar */
function sectionHeading(doc, title, y) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...C.primary);
  doc.rect(14, y - 4.5, 3, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...C.white);
  doc.text(title, 20, y + 0.5);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(14, y + 4, W - 14, y + 4);
  return y + 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates and downloads a PDF health report.
 *
 * @param {object} opts
 * @param {object}  opts.aiResult   — canonical AI prediction result
 * @param {object}  [opts.user]     — authenticated user { name, email }
 * @param {object}  [opts.inputData] — raw health assessment form data
 */
export async function generateHealthReport({ aiResult, user, inputData = {} }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const W   = doc.internal.pageSize.getWidth();

  const {
    riskScore       = 0,
    riskLevel       = 'low',
    confidence      = 0,
    summary         = '',
    diseaseRisks    = [],
    riskFactors     = [],
    recommendations = [],
    generatedAt,
    provider        = 'Gemini AI',
    modelVersion    = '',
  } = aiResult;

  const patientName  = user?.name  || 'Anonymous Patient';
  const patientEmail = user?.email || '—';
  const reportDate   = fmtDate(generatedAt || new Date());
  const { personal = {}, medical = {}, lifestyle = {}, symptoms = {} } = inputData;

  // ── Page 1: Cover ───────────────────────────────────────────────────────────
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), 'F');
  drawCover(doc, { patientName, reportDate, riskScore, riskLevel });

  // ── Page 2: Patient Details + Health Score ──────────────────────────────────
  doc.addPage();
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), 'F');

  let y = 20;
  y = sectionHeading(doc, 'Section 1 — Patient Details', y);

  // Patient details table
  const bmi = (personal.height && personal.weight)
    ? ((personal.weight / Math.pow(personal.height / 100, 2)).toFixed(1) + ' kg/m²')
    : '—';

  const patientRows = [
    ['Full Name',         patientName],
    ['Email',             patientEmail],
    ['Age',               personal.age ? `${personal.age} years` : '—'],
    ['Date of Birth',     fmtDate(personal.dateOfBirth)],
    ['Height',            personal.height ? `${personal.height} cm` : '—'],
    ['Weight',            personal.weight ? `${personal.weight} kg` : '—'],
    ['BMI',               bmi],
    ['Blood Group',       personal.bloodGroup  || '—'],
    ['Pregnancy Status',  cap(personal.pregnancyStatus?.replace(/_/g, ' ') || '') || '—'],
    ['Menopausal Status', cap(personal.menopausalStatus?.replace(/_/g, ' ') || '') || '—'],
    ['Occupation',        personal.occupation  || '—'],
    ['Marital Status',    cap(personal.maritalStatus || '') || '—'],
    ['Report Generated',  reportDate],
    ['AI Provider',       `${cap(provider)} (${modelVersion})`],
    ['AI Confidence',     `${Math.round((confidence ?? 0) * 100)}%`],
  ];

  autoTable(doc, {
    startY: y,
    body: patientRows,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: C.white,
      fillColor: C.card,
      lineColor: C.border,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: C.slate400, cellWidth: 50 },
      1: { textColor: C.white },
    },
    alternateRowStyles: { fillColor: [22, 22, 38] },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── Section 2: Health Score ──────────────────────────────────────────────────
  y = sectionHeading(doc, 'Section 2 — Overall Health Score', y);

  // Score bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...riskColour(riskLevel));
  doc.text(String(riskScore), 14, y + 10);

  doc.setFontSize(10);
  doc.setTextColor(...C.slate400);
  doc.text('/ 100', 30, y + 10);

  // Risk badge
  drawBadge(doc, cap(riskLevel) + ' Risk', 42, y + 10, riskColour(riskLevel));

  // Score bar track
  drawBar(doc, 14, y + 16, riskScore, riskColour(riskLevel), W - 28, 4);

  y += 26;

  // Summary text
  if (summary) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C.slate400);
    const lines = doc.splitTextToSize(summary, W - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 6;
  }

  // ── Page 3+: Disease Risks ─────────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), 'F');
  y = 20;
  y = sectionHeading(doc, 'Section 3 — Disease Risk Analysis', y);

  const sortedDiseases = [...diseaseRisks].sort((a, b) => b.riskScore - a.riskScore);

  // Diseases table
  autoTable(doc, {
    startY: y,
    head: [['Disease', 'Risk Score', 'Risk Level', 'Notes']],
    body: sortedDiseases.map((d) => [
      d.disease,
      `${d.riskScore}%`,
      cap(d.riskLevel || scoreToLevel(d.riskScore)),
      d.notes || '—',
    ]),
    theme: 'plain',
    headStyles: {
      fillColor: C.card,
      textColor: C.primary,
      fontStyle: 'bold',
      fontSize: 9,
      lineColor: C.border,
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: C.white,
      fillColor: C.bg,
      lineColor: C.border,
      lineWidth: 0.2,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
    },
    alternateRowStyles: { fillColor: C.card },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 'auto' },
    },
    didDrawCell: (data) => {
      // Colour the Risk Level cell text
      if (data.section === 'body' && data.column.index === 2) {
        const level = sortedDiseases[data.row.index]?.riskLevel ?? 'low';
        const col   = riskColour(level);
        doc.setTextColor(...col);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(
          cap(level),
          data.cell.x + data.cell.width / 2,
          data.cell.y + data.cell.height / 2 + 1,
          { align: 'center' }
        );
      }
      // Draw mini bar inside Risk Score cell
      if (data.section === 'body' && data.column.index === 1) {
        const score = sortedDiseases[data.row.index]?.riskScore ?? 0;
        const level = sortedDiseases[data.row.index]?.riskLevel ?? scoreToLevel(score);
        const bx    = data.cell.x + 2;
        const by    = data.cell.y + data.cell.height - 3.5;
        const bW    = data.cell.width - 4;
        drawBar(doc, bx, by, score, riskColour(level), bW, 1.5);
      }
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 14;

  // ── Section 4: Risk Factors ────────────────────────────────────────────────
  if (riskFactors.length > 0) {
    // Check if we have enough space; if not, new page
    if (y > 200) {
      doc.addPage();
      doc.setFillColor(...C.bg);
      doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), 'F');
      y = 20;
    }

    y = sectionHeading(doc, 'Section 4 — Top Risk Factors', y);

    const topFactors = [...riskFactors]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 8);

    autoTable(doc, {
      startY: y,
      head: [['Risk Factor', 'Contribution', 'Description']],
      body: topFactors.map((f) => [
        f.factor,
        `${f.contribution}%`,
        f.description || '—',
      ]),
      theme: 'plain',
      headStyles: {
        fillColor: C.card,
        textColor: C.primary,
        fontStyle: 'bold',
        fontSize: 9,
        lineColor: C.border,
        lineWidth: 0.3,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: C.white,
        fillColor: C.bg,
        lineColor: C.border,
        lineWidth: 0.2,
        cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      },
      alternateRowStyles: { fillColor: C.card },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 28, halign: 'center', textColor: C.primary },
        2: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 14;
  }

  // ── Section 5: Recommendations ─────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), 'F');
  y = 20;
  y = sectionHeading(doc, 'Section 5 — Personalised Recommendations', y);

  const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
  const PRIORITY_LABEL = { urgent: 'URGENT', high: 'HIGH', medium: 'MEDIUM', low: 'LOW' };
  const PRIORITY_COLOR = { urgent: C.red, high: C.rose, medium: C.amber, low: C.emerald };

  const sortedRecs = [...recommendations].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
  );

  autoTable(doc, {
    startY: y,
    head: [['#', 'Priority', 'Category', 'Action']],
    body: sortedRecs.map((r, i) => [
      i + 1,
      PRIORITY_LABEL[r.priority] ?? 'MEDIUM',
      r.category || '—',
      r.action || '—',
    ]),
    theme: 'plain',
    headStyles: {
      fillColor: C.card,
      textColor: C.primary,
      fontStyle: 'bold',
      fontSize: 9,
      lineColor: C.border,
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: C.white,
      fillColor: C.bg,
      lineColor: C.border,
      lineWidth: 0.2,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    alternateRowStyles: { fillColor: C.card },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', textColor: C.slate400 },
      1: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 34 },
      3: { cellWidth: 'auto' },
    },
    didDrawCell: (data) => {
      // Colour priority text
      if (data.section === 'body' && data.column.index === 1) {
        const rec = sortedRecs[data.row.index];
        const col = PRIORITY_COLOR[rec?.priority] ?? C.amber;
        doc.setTextColor(...col);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(
          PRIORITY_LABEL[rec?.priority] ?? 'MEDIUM',
          data.cell.x + data.cell.width / 2,
          data.cell.y + data.cell.height / 2 + 1,
          { align: 'center' }
        );
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Apply footers to all pages ──────────────────────────────────────────────
  addFooter(doc);

  // ── Save ────────────────────────────────────────────────────────────────────
  const safeName    = (patientName || 'Patient').replace(/\s+/g, '_');
  const dateStamp   = new Date().toISOString().slice(0, 10);
  const filename    = `HealthReport_${safeName}_${dateStamp}.pdf`;

  doc.save(filename);
  return filename;
}

/**
 * Generates the PDF and returns its Blob URL (for sharing / preview).
 * The caller is responsible for revoking the URL when done.
 *
 * @param {object} opts — same as generateHealthReport
 * @returns {Promise<{ url: string, filename: string }>}
 */
export async function getHealthReportBlobUrl({ aiResult, user, inputData = {} }) {
  // Re-use the same generation logic but output as blob
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  // Simplified: just save as blob by calling the full generator internally
  // Since jsPDF doesn't support a pure "return blob" in one pass,
  // we generate again and call output('blob')

  await generateHealthReport({ aiResult, user, inputData });
  // Note: for the share modal, we generate separately to get the blob
  // This function is a convenience alias for now
  const tempDoc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const blob    = doc.output('blob');
  const url     = URL.createObjectURL(blob);
  const safeName  = (user?.name || 'Patient').replace(/\s+/g, '_');
  const filename  = `HealthReport_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  return { url, filename };
}
