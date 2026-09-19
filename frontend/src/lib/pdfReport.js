/**
 * Generates and downloads a client-side verification certificate.
 * Tradeoff note for viva:
 * Client-side jsPDF eliminates server CPU load, requires zero server-side headless browsers,
 * works with zero API latency, and generates instantly directly in the user's browser.
 */
export async function generatePdfReport(result) {
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FAKE INFO DETECTOR', margin, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Multi-Modal AI Misinformation Verification Platform — Forensic Report', margin, 23);
  doc.text(`Generated: ${new Date().toLocaleString()} | ID: ${result.id || 'SCAN-' + Date.now()}`, margin, 29);

  y = 48;

  // Modality & Summary
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('VERIFICATION METADATA', margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Modality: ${(result.modality || 'Content').toUpperCase()}`, margin, y);
  y += 5;
  const summary = (result.input_summary || result.raw_details?.filename || result.raw_details?.normalized_url || 'User submitted content');
  const splitSummary = doc.splitTextToSize(`Input: ${summary}`, pageWidth - margin * 2);
  doc.text(splitSummary, margin, y);
  y += splitSummary.length * 5 + 4;

  // Verdict Box
  const pred = (result.prediction || 'UNKNOWN').toUpperCase();
  let boxColor = [245, 158, 11]; // amber for suspicious
  if (pred === 'REAL' || pred === 'SAFE' || pred === 'CLEAN' || pred === 'HARMLESS') boxColor = [16, 185, 129]; // emerald
  if (pred === 'FAKE' || pred === 'MALICIOUS' || pred === 'PHISHING' || pred === 'MALWARE') boxColor = [239, 68, 68]; // red


  doc.setFillColor(boxColor[0], boxColor[1], boxColor[2]);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`VERDICT: ${pred}`, margin + 8, y + 11);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Confidence Score: ${result.confidence_score}%`, margin + 8, y + 18);

  y += 34;

  // Explainable Scoring Weights (90 / 10 Model vs Rules)
  const weights = result.weights || {};
  const modelWeightPct = weights.model_weight !== undefined ? Math.round(weights.model_weight * 100) : 90;
  const ruleWeightPct = weights.rule_weight !== undefined ? Math.round(weights.rule_weight * 100) : 10;

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`EXPLAINABLE SCORING BREAKDOWN (${modelWeightPct}% MODEL / ${ruleWeightPct}% RULES)`, margin, y);
  y += 7;

  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const modelProb = weights.model_probability !== undefined ? `${(weights.model_probability * 100).toFixed(1)}%` : 'N/A';
  const ruleScore = weights.rule_score !== undefined ? `${(weights.rule_score * 100).toFixed(1)}%` : 'N/A';
  const compScore = weights.composite_score !== undefined ? `${(weights.composite_score * 100).toFixed(1)}%` : 'N/A';

  doc.text(`* Machine Learning Model Probability (${modelWeightPct}% weight): ${modelProb} fake`, margin + 6, y + 6);
  doc.text(`* Forensic Heuristic Rule Score     (${ruleWeightPct}% weight): ${ruleScore} tampering risk`, margin + 6, y + 12);
  doc.text(`* Composite Weighted Risk Score:                 ${compScore} calculated`, margin + 6, y + 18);

  y += 30;

  // Forensic Explanations List
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FORENSIC EXPLANATIONS & DETECTED INDICATORS', margin, y);
  y += 7;

  const explanations = result.explanation || [];
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  if (explanations.length === 0) {
    doc.text('- No specific anomalies detected; content maintains normal characteristics.', margin + 4, y);
    y += 6;
  } else {
    explanations.forEach((exp, idx) => {
      const splitExp = doc.splitTextToSize(`${idx + 1}. ${exp}`, pageWidth - margin * 2 - 6);
      if (y + splitExp.length * 5 > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(splitExp, margin + 4, y);
      y += splitExp.length * 5 + 2;
    });
  }

  y += 8;

  // Footer Certificate Notice
  if (y > 265) {
    doc.addPage();
    y = 20;
  }
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This verification report was generated autonomously by Fake Info Detector using multi-modal AI heuristics.\nDesigned for research and informational verification purposes.',
    margin,
    y
  );

  // Save/Download PDF
  const filename = `Verification_Report_${result.modality || 'content'}_${Date.now()}.pdf`;
  doc.save(filename);
}
