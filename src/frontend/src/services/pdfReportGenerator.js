import { jsPDF } from "jspdf";

/**
 * Renders the circular confidence ring matching the frontend SVG design.
 * Returns a data URL (PNG) if in a browser DOM environment, or null.
 */
function createConfidenceRingImage(confidence, isAlzheimers) {
  if (typeof document === "undefined") return null;

  try {
    const canvas = document.createElement("canvas");
    const size = 320;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const center = size / 2;
    const radius = size * 0.39;
    const lineWidth = size * 0.075;
    const ringColor = isAlzheimers ? "#ea580c" : "#0d9488";

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Background track ring
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#e6efec";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Foreground progress arc
    const clampedConf = Math.min(100, Math.max(0, Number(confidence) || 0));
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (clampedConf / 100) * 2 * Math.PI;

    if (clampedConf > 0) {
      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Centered percentage text
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 50px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${clampedConf.toFixed(1)}%`, center, center - 10);

    // "confidence" sub-label
    ctx.fillStyle = "#64748b";
    ctx.font = "500 22px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("confidence", center, center + 30);

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Could not render confidence ring via canvas:", err);
    return null;
  }
}

/**
 * Renders the AlzDx Brain Logo badge.
 * Returns a data URL (PNG) if in a browser DOM environment, or null.
 */
function createAlzDxLogoImage() {
  if (typeof document === "undefined") return null;

  try {
    const canvas = document.createElement("canvas");
    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Rounded rectangle background in AlzDx Teal
    const r = 36;
    ctx.fillStyle = "#0d9488";
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, r);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, size, size);
    }

    // Draw stylized brain icon paths
    ctx.save();
    ctx.translate(22, 22);
    ctx.scale((size - 44) / 24, (size - 44) / 24);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.85;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (typeof Path2D !== "undefined") {
      const paths = [
        "M12 18V5",
        "M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4",
        "M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5",
        "M17.997 5.125a4 4 0 0 1 2.526 5.77",
        "M18 18a4 4 0 0 0 2-7.464",
        "M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517",
        "M6 18a4 4 0 0 1-2-7.464",
        "M6.003 5.125a4 4 0 0 0-2.526 5.77",
      ];
      for (const p of paths) {
        ctx.stroke(new Path2D(p));
      }
    } else {
      // Simple brain hemisphere curves fallback
      ctx.beginPath();
      ctx.arc(12, 12, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Could not render logo via canvas:", err);
    return null;
  }
}

/**
 * Format date nicely for report display.
 */
function formatReportDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toLocaleString();

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Generate filename: AlzDx_Report_<AssessmentID>.pdf or AlzDx_Report_YYYY-MM-DD_HHMM.pdf
 */
export function getReportFilename(assessment) {
  const id = assessment?.id || assessment?.assessment_id;
  if (id) {
    const cleanId = String(id).replace(/[^a-zA-Z0-9_-]/g, "");
    return `AlzDx_Report_${cleanId}.pdf`;
  }

  const now = assessment?.created_at ? new Date(assessment.created_at) : new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `AlzDx_Report_${yyyy}-${mm}-${dd}_${hh}${min}.pdf`;
}

/**
 * Format metric value with units or "Unavailable".
 */
function formatMetric(val, suffix = "") {
  if (val === null || val === undefined || val === "") return "Unavailable";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  // Format float with up to 2 decimal places if decimal
  const formatted = Number.isInteger(num) ? String(num) : num.toFixed(2);
  return `${formatted}${suffix}`;
}

/**
 * Main PDF Builder: creates a 1-page A4 PDF using the existing saved assessment data.
 * @param {Object} assessment - Stored assessment object from PostgreSQL / state
 * @returns {jsPDF} doc
 */
export function buildAlzDxPdf(assessment) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = 210;
  const leftMargin = 14;
  const contentWidth = pageWidth - leftMargin * 2; // 182mm
  const rightMargin = leftMargin + contentWidth; // 196mm

  // Colors
  const tealPrimary = [13, 148, 136]; // #0d9488
  const tealDark = [15, 118, 110]; // #0f766e
  const tealLight = [240, 253, 250]; // #f0fdfa
  const tealBorder = [204, 251, 241]; // #ccfbf1
  const orangeAccent = [234, 88, 12]; // #ea580c
  const orangeSoft = [255, 247, 237]; // #fff7ed
  const orangeBorder = [254, 215, 170]; // #fed7aa
  const textDark = [15, 23, 42]; // #0f172a
  const textMuted = [100, 116, 139]; // #64748b
  const cardBg = [248, 250, 252]; // #f8fafc
  const cardBorder = [226, 232, 240]; // #e2e8f0

  // Extract data with graceful fallbacks
  const assessmentId = assessment?.id || assessment?.assessment_id || "Unassigned";
  const displayId = String(assessmentId).length > 18
    ? `ALZ-${String(assessmentId).slice(0, 8).toUpperCase()}`
    : `ALZ-${String(assessmentId).toUpperCase()}`;

  const rawPrediction = assessment?.prediction || "Healthy";
  const isAlzheimers = rawPrediction.toLowerCase().includes("alzheimer");
  const predictionText = isAlzheimers ? "Alzheimer's" : "Healthy";

  const confidenceNum = Number(assessment?.confidence) || 0;
  const confidenceFormatted = confidenceNum.toFixed(1);

  const createdAt = assessment?.created_at || new Date().toISOString();
  const dateFormatted = formatReportDate(createdAt);

  const metrics = assessment?.metrics || {};
  const transcriptText = (assessment?.transcript || "").trim() || "No transcript recorded.";

  // ==========================================
  // 1. HEADER (y = 12 to 32)
  // ==========================================
  let currentY = 12;

  // Logo Badge
  const logoDataUrl = createAlzDxLogoImage();
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", leftMargin, currentY, 13, 13);
  } else {
    // Vector fallback badge
    doc.setFillColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
    doc.roundedRect(leftMargin, currentY, 13, 13, 2.5, 2.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Dx", leftMargin + 6.5, currentY + 8, { align: "center" });
  }

  // Header Title
  const titleX = leftMargin + 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("AlzDx – Cognitive Screening Report", titleX, currentY + 5.5);

  // Subtitle / Assessment Type tag
  doc.setFillColor(tealLight[0], tealLight[1], tealLight[2]);
  doc.setDrawColor(tealBorder[0], tealBorder[1], tealBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(titleX, currentY + 7.5, 59, 5.2, 1.2, 1.2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
  doc.text("Cookie Theft Picture Description", titleX + 2.5, currentY + 11.2);

  // Header Right Metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Report ID: ${displayId}`, rightMargin, currentY + 4.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Date & Time: ${dateFormatted}`, rightMargin, currentY + 9.5, { align: "right" });

  // Two-tone decorative accent bar (Teal + Orange branding)
  currentY += 15.5;
  doc.setFillColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.rect(leftMargin, currentY, contentWidth * 0.65, 1, "F");
  doc.setFillColor(orangeAccent[0], orangeAccent[1], orangeAccent[2]);
  doc.rect(leftMargin + contentWidth * 0.65, currentY, contentWidth * 0.35, 1, "F");

  currentY += 4.5;

  // ==========================================
  // 2. SCREENING RESULT HERO CARD (height = 38mm)
  // ==========================================
  const resultCardH = 38;
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(leftMargin, currentY, contentWidth, resultCardH, 3.5, 3.5, "FD");

  // Left colored indicator stripe
  const stripeColor = isAlzheimers ? orangeAccent : tealPrimary;
  doc.setFillColor(stripeColor[0], stripeColor[1], stripeColor[2]);
  doc.roundedRect(leftMargin, currentY, 3.2, resultCardH, 1.5, 1.5, "F");

  // Pill badge: Screening Outcome
  const badgeY = currentY + 4.5;
  const badgeX = leftMargin + 7;
  const badgeBg = isAlzheimers ? orangeSoft : tealLight;
  const badgeBdr = isAlzheimers ? orangeBorder : tealBorder;
  const badgeTxt = isAlzheimers ? orangeAccent : tealDark;

  doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  doc.setDrawColor(badgeBdr[0], badgeBdr[1], badgeBdr[2]);
  doc.roundedRect(badgeX, badgeY, 32, 4.8, 1.2, 1.2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(badgeTxt[0], badgeTxt[1], badgeTxt[2]);
  doc.text("SCREENING RESULT", badgeX + 16, badgeY + 3.4, { align: "center" });

  // Large Result Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  const resultColor = isAlzheimers ? orangeAccent : tealDark;
  doc.setTextColor(resultColor[0], resultColor[1], resultColor[2]);
  doc.text(predictionText, badgeX, currentY + 18.5);

  // Description copy
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const outcomeSummary = isAlzheimers
    ? "Acoustic and semantic indicators show patterns associated with cognitive decline."
    : "Speech fluency, pause dynamics, and lexical markers indicate typical cognitive patterns.";
  doc.text(outcomeSummary, badgeX, currentY + 24.5);

  // Metadata line
  doc.setFontSize(7.2);
  doc.setTextColor(148, 163, 184);
  doc.text(`Assessment UID: ${assessmentId}`, badgeX, currentY + 31.5);

  // Circular Confidence Ring (Right Side)
  const ringSize = 30; // 30mm diameter
  const ringX = rightMargin - ringSize - 5;
  const ringY = currentY + 4;
  const ringImgData = createConfidenceRingImage(confidenceNum, isAlzheimers);

  if (ringImgData) {
    doc.addImage(ringImgData, "PNG", ringX, ringY, ringSize, ringSize);
  } else {
    // Vector fallback for ring
    const centerX = ringX + ringSize / 2;
    const centerY = ringY + ringSize / 2;
    const radius = ringSize / 2 - 2;

    doc.setDrawColor(230, 239, 236);
    doc.setLineWidth(2.2);
    doc.circle(centerX, centerY, radius, "S");

    doc.setDrawColor(stripeColor[0], stripeColor[1], stripeColor[2]);
    doc.circle(centerX, centerY, radius, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`${confidenceFormatted}%`, centerX, centerY - 1, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text("confidence", centerX, centerY + 4.5, { align: "center" });
  }

  currentY += resultCardH + 3.5;

  // ==========================================
  // 3. RESEARCH DISCLAIMER CALLOUT (height = 12mm)
  // ==========================================
  const disclaimerH = 12;
  doc.setFillColor(orangeSoft[0], orangeSoft[1], orangeSoft[2]);
  doc.setDrawColor(orangeBorder[0], orangeBorder[1], orangeBorder[2]);
  doc.setLineWidth(0.35);
  doc.roundedRect(leftMargin, currentY, contentWidth, disclaimerH, 2.5, 2.5, "FD");

  // Left orange stripe
  doc.setFillColor(orangeAccent[0], orangeAccent[1], orangeAccent[2]);
  doc.roundedRect(leftMargin, currentY, 2.2, disclaimerH, 1, 1, "F");

  // Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  doc.setTextColor(194, 65, 12); // #c2410c
  doc.text("RESEARCH DISCLAIMER:", leftMargin + 6, currentY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.3);
  doc.setTextColor(154, 52, 18);
  const disclaimerBody =
    "This report is generated by the AlzDx research screening system for educational and research purposes and is not a medical diagnosis.";
  doc.text(disclaimerBody, leftMargin + 43, currentY + 5);

  const subDisclaimer =
    "Results must be interpreted in conjunction with formal neuropsychological batteries and clinical neurological evaluation.";
  doc.setFontSize(6.8);
  doc.setTextColor(180, 83, 9);
  doc.text(subDisclaimer, leftMargin + 6, currentY + 9.2);

  currentY += disclaimerH + 3.8;

  // ==========================================
  // 4. LINGUISTIC ANALYSIS (6 metric cards, 3 cols x 2 rows)
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("Linguistic & Temporal Biomarkers", leftMargin, currentY + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Derived from acoustic segmentation & speech timing analysis", leftMargin + 68, currentY + 2);

  currentY += 4.5;

  const metricDefs = [
    { label: "Speech Rate", val: formatMetric(metrics?.speech_rate, " WPM") },
    { label: "Pause Count", val: formatMetric(metrics?.pause_count, "") },
    { label: "Total Pause Duration", val: formatMetric(metrics?.total_pause_seconds, " s") },
    { label: "Average Pause Duration", val: formatMetric(metrics?.average_pause_seconds, " s") },
    { label: "Hesitations", val: formatMetric(metrics?.hesitation_count, "") },
    { label: "Repetitions", val: formatMetric(metrics?.repetition_count, "") },
  ];

  const colWidth = (contentWidth - 6) / 3; // ~58.6mm
  const cardRowH = 13.5;
  const colGap = 3;
  const rowGap = 2.5;

  metricDefs.forEach((item, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const cardX = leftMargin + col * (colWidth + colGap);
    const cardY = currentY + row * (cardRowH + rowGap);

    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY, colWidth, cardRowH, 2, 2, "FD");

    // Decorative tiny indicator dot
    doc.setFillColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
    doc.circle(cardX + 4, cardY + 4.2, 1, "F");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(item.label.toUpperCase(), cardX + 7, cardY + 5);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(item.val, cardX + 7, cardY + 10.8);
  });

  currentY += cardRowH * 2 + rowGap + 4;

  // ==========================================
  // 5. ASSESSMENT TRANSCRIPT
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("Assessment Transcript", leftMargin, currentY + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Exact transcript evaluated by model (verbatim with punctuation preserved)", leftMargin + 48, currentY + 2);

  currentY += 4.5;

  const transcriptBoxH = 46; // 46mm fits comfortably within 1 page
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftMargin, currentY, contentWidth, transcriptBoxH, 2.5, 2.5, "FD");

  // Transcript text inside container
  const paddingX = 5;
  const paddingY = 5;
  const maxTextWidth = contentWidth - paddingX * 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  const splitTranscript = doc.splitTextToSize(transcriptText, maxTextWidth);
  const maxLines = 11;
  const linesToRender = splitTranscript.slice(0, maxLines);
  if (splitTranscript.length > maxLines) {
    const lastIdx = linesToRender.length - 1;
    linesToRender[lastIdx] = linesToRender[lastIdx].slice(0, -3) + "...";
  }

  doc.text(linesToRender, leftMargin + paddingX, currentY + paddingY + 2.5, {
    lineHeightFactor: 1.35,
  });

  currentY += transcriptBoxH + 4;

  // ==========================================
  // 6. MODEL INFORMATION (Fixed project specifications)
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("Deep Learning Model Information", leftMargin, currentY + 2);

  currentY += 4.5;

  const modelBoxH = 19;
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftMargin, currentY, contentWidth, modelBoxH, 2.5, 2.5, "FD");

  const modelCols = [
    { label: "BASE MODEL", value: "microsoft/deberta-v3-base" },
    { label: "ARCHITECTURE", value: "Attention Pooling + Mean Pooling" },
    { label: "CHECKPOINT", value: "checkpoint-264" },
    { label: "FINAL TEST ACCURACY", value: "89.33%", highlight: true },
  ];

  const mColW = contentWidth / 4;
  modelCols.forEach((m, idx) => {
    const mx = leftMargin + idx * mColW + 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.4);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(m.label, mx, currentY + 5.5);

    if (m.highlight) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
      doc.text(m.value, mx, currentY + 12.5);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.6);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(m.value, mx, currentY + 11.5);
    }

    // Divider line between columns
    if (idx < 3) {
      doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
      doc.setLineWidth(0.2);
      doc.line(leftMargin + (idx + 1) * mColW, currentY + 3, leftMargin + (idx + 1) * mColW, currentY + modelBoxH - 3);
    }
  });

  currentY += modelBoxH + 4;

  // ==========================================
  // 7. FOOTER (Page 1 of 1 guaranteed)
  // ==========================================
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, currentY, rightMargin, currentY);

  currentY += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("Generated by AlzDx", leftMargin, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Project Version: v1.0   •   Generated On: ${new Date().toLocaleString()}`,
    leftMargin + 32,
    currentY
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Page 1 of 1", rightMargin, currentY, { align: "right" });

  return doc;
}

/**
 * Generates and downloads the PDF report for a given assessment object.
 * Triggers the browser download immediately with guaranteed .pdf extension.
 */
export function downloadAlzDxPdf(assessment) {
  const doc = buildAlzDxPdf(assessment);
  const filename = getReportFilename(assessment);

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const blob = doc.output("blob");
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");
      link.style.position = "fixed";
      link.style.left = "-9999px";
      link.style.top = "-9999px";
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);

      // Trigger click synchronously in current user gesture
      link.click();

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 1500);

      return filename;
    } catch (e) {
      console.warn("Anchor click download fallback:", e);
    }
  }

  // Fallback
  doc.save(filename);
  return filename;
}

