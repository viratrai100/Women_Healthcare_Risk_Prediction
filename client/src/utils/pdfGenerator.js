import jsPDF from 'jspdf';

/**
 * Generates a basic risk report PDF using jsPDF.
 * Full implementation will be added in the report feature.
 *
 * @param {object} prediction  — prediction document from the API
 * @param {object} user        — current user object
 * @returns {jsPDF} PDF document instance
 */
export const generateRiskReportPDF = (prediction, user) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Header ─────────────────────────────────────────────────────────────────
  doc.setFontSize(20);
  doc.text("AI Women's Healthcare — Risk Report", 14, 20);

  doc.setFontSize(10);
  doc.text(`Patient: ${user?.name ?? '—'}`, 14, 32);
  doc.text(`Date: ${new Date(prediction?.createdAt).toLocaleDateString()}`, 14, 38);

  // ── Risk summary ──────────────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.text('Risk Summary', 14, 52);

  doc.setFontSize(11);
  doc.text(`Risk Score : ${prediction?.riskScore ?? '—'} / 100`, 14, 62);
  doc.text(`Risk Level : ${prediction?.riskLevel ?? '—'}`, 14, 70);

  // ── Recommendation ────────────────────────────────────────────────────────
  if (prediction?.recommendation) {
    doc.setFontSize(14);
    doc.text('Recommendation', 14, 86);
    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(prediction.recommendation, 180), 14, 96);
  }

  return doc;
};
