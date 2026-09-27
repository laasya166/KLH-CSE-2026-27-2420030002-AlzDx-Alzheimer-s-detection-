import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bot,
  Brain,
  Clock3,
  Cpu,
  FileDown,
  FileText,
  History,
  MessageCircle,
  Pause,
  Repeat2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import Layout from "../components/Layout";
import { fetchAssessment, fetchAssessments } from "../services/api";
import { downloadAlzDxPdf } from "../services/pdfReportGenerator";
import ChatAssistant from "../components/ChatAssistant";

function AnalysisReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [assessment, setAssessment] = useState(location.state?.assessment || null);
  const [loading, setLoading] = useState(!location.state?.assessment);
  const [error, setError] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialChatPrompt, setInitialChatPrompt] = useState("");

  const handleAskAiAboutMetric = (label, val) => {
    let prompt = "";
    if (label === "Speech Rate") {
      prompt = val != null ? `What does my speech rate of ${val} WPM mean?` : "What does speech rate mean in this screening?";
    } else if (label === "Pause Count") {
      prompt = val != null ? `What is pause count and what does my count of ${val} indicate?` : "What is pause count?";
    } else if (label === "Hesitations") {
      prompt = val != null ? `Why are hesitations measured and what does my count of ${val} mean?` : "Why are hesitations measured?";
    } else if (label === "Repetitions") {
      prompt = val != null ? `Why are repetitions measured and what does my count of ${val} mean?` : "Why are repetitions measured?";
    } else if (label === "Confidence") {
      prompt = val != null ? `Why ${Number(val).toFixed(1)}% confidence?` : "Why is this confidence score assigned?";
    } else {
      prompt = `Can you explain ${label}?`;
    }
    setInitialChatPrompt(prompt);
    setIsChatOpen(true);
  };

  const assessmentIdFromState = location.state?.assessmentId;
  const assessmentIdFromParam = searchParams.get("id");
  const targetId = assessmentIdFromState || assessmentIdFromParam;

  useEffect(() => {
    let active = true;

    async function loadAssessment() {
      // If assessment already passed in route state, use it
      if (location.state?.assessment) {
        setAssessment(location.state.assessment);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        if (targetId) {
          const record = await fetchAssessment(targetId);
          if (active) setAssessment(record);
        } else {
          // If no ID specified, load the latest assessment from database
          const list = await fetchAssessments();
          if (list && list.length > 0) {
            const latest = await fetchAssessment(list[0].id);
            if (active) setAssessment(latest);
          } else {
            // Graceful fallback dummy if database has no records yet
            if (active) {
              setAssessment({
                id: "sample-demo-id",
                prediction: "Alzheimer's",
                confidence: 89.33,
                transcript:
                  "The mother is standing by the kitchen sink washing dishes while the water is overflowing onto the floor. The boy has climbed onto a stool that is tipping over to reach cookies from the jar, and his sister is reaching up asking for one.",
                metrics: {
                  speech_rate: 118.4,
                  pause_count: 14,
                  total_pause_seconds: 12.8,
                  average_pause_seconds: 0.91,
                  hesitation_count: 5,
                  repetition_count: 2,
                },
                created_at: new Date().toISOString(),
              });
            }
          }
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Could not load assessment details from database.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAssessment();
    return () => {
      active = false;
    };
  }, [targetId, location.state]);

  const handleGeneratePdf = () => {
    if (!assessment) return;
    setIsGeneratingPdf(true);
    try {
      downloadAlzDxPdf(assessment);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const confidenceNum = Number(assessment?.confidence) || 0;
  const clampedConfidence = Math.min(100, Math.max(0, confidenceNum));
  const confidenceCircumference = 2 * Math.PI * 49;
  const isAlzheimers = assessment?.prediction?.toLowerCase().includes("alzheimer");
  const metrics = assessment?.metrics || {};

  return (
    <Layout
      title="Analysis Report"
      subtitle="Standardized Cookie Theft cognitive screening results"
    >
      {error && (
        <div
          role="alert"
          style={{
            color: "var(--danger)",
            background: "#fef2f2",
            padding: "16px",
            borderRadius: "14px",
            marginBottom: "20px",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            color: "var(--text-light)",
          }}
        >
          <div className="loading-spinner" style={{ margin: "0 auto 16px" }} />
          <p>Loading assessment details from PostgreSQL database...</p>
        </div>
      ) : (
        <>
          {/* Screening Result Hero */}
          <section className="result-summary" aria-labelledby="report-prediction">
            <div>
              <span className="status-pill">
                {isAlzheimers ? (
                  <ShieldAlert size={15} color="var(--danger)" />
                ) : (
                  <ShieldCheck size={15} color="var(--primary-dark)" />
                )}
                Screening Result
              </span>
              <h2
                id="report-prediction"
                className="result-title"
                style={{
                  color: isAlzheimers ? "var(--danger)" : "var(--text)",
                }}
              >
                {assessment?.prediction || "Healthy"}
              </h2>
              <p className="result-copy">
                Assessment UID: {assessment?.id || "N/A"}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-light)",
                  marginTop: "4px",
                }}
              >
                Analyzed on:{" "}
                {assessment?.created_at
                  ? new Date(assessment.created_at).toLocaleString()
                  : "N/A"}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <svg
                className="confidence-ring"
                viewBox="0 0 120 120"
                role="img"
                aria-label={`Confidence ${clampedConfidence.toFixed(1)}%`}
              >
                <circle cx="60" cy="60" r="49" fill="none" stroke="#e6efec" strokeWidth="9" />
                <circle
                  cx="60"
                  cy="60"
                  r="49"
                  fill="none"
                  stroke={isAlzheimers ? "var(--danger)" : "var(--primary)"}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={confidenceCircumference}
                  strokeDashoffset={
                    confidenceCircumference * (1 - clampedConfidence / 100)
                  }
                  transform="rotate(-90 60 60)"
                />
                <text
                  x="60"
                  y="57"
                  textAnchor="middle"
                  fill="var(--text)"
                  fontSize="22"
                  fontWeight="750"
                >
                  {clampedConfidence.toFixed(1)}%
                </text>
                <text
                  x="60"
                  y="75"
                  textAnchor="middle"
                  fill="var(--text-light)"
                  fontSize="10"
                >
                  confidence
                </text>
              </svg>
              <button
                type="button"
                onClick={() => handleAskAiAboutMetric("Confidence", clampedConfidence)}
                className="metric-sparkle-btn"
                style={{ marginTop: "6px" }}
                title="Ask AI about confidence score"
                aria-label="Ask AI about confidence score"
              >
                <Sparkles size={11} /> Explain ✨
              </button>
            </div>
          </section>

          {/* Research Disclaimer Callout */}
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderLeft: "4px solid #ea580c",
              borderRadius: "14px",
              padding: "16px 20px",
              margin: "20px 0",
              color: "#9a3412",
              fontSize: "13.5px",
              lineHeight: 1.5,
            }}
          >
            <strong>Research Disclaimer:</strong> This report is generated by the
            AlzDx research screening system for educational and research purposes
            and is not a medical diagnosis.
          </div>

          {/* Linguistic Analysis Metric Cards */}
          <section
            className="card report-explanation"
            aria-labelledby="report-analysis-heading"
            style={{ marginBottom: "20px", padding: "24px" }}
          >
            <div className="report-section-heading" style={{ marginBottom: "16px" }}>
              <span className="metric-icon">
                <Brain size={19} />
              </span>
              <div>
                <h2 id="report-analysis-heading" style={{ fontSize: "18px" }}>
                  Linguistic Analysis
                </h2>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-light)" }}>
                  Temporal, acoustic, and fluency biomarkers extracted from speech
                </p>
              </div>
            </div>

            <div className="metric-grid">
              {[
                { label: "Speech Rate", key: "speech_rate", suffix: " WPM", Icon: Activity, sparkle: true },
                { label: "Pause Count", key: "pause_count", suffix: "", Icon: Pause, sparkle: true },
                { label: "Total Pause", key: "total_pause_seconds", suffix: " s", Icon: Clock3 },
                { label: "Average Pause", key: "average_pause_seconds", suffix: " s", Icon: Timer },
                { label: "Hesitations", key: "hesitation_count", suffix: "", Icon: MessageCircle, sparkle: true },
                { label: "Repetitions", key: "repetition_count", suffix: "", Icon: Repeat2, sparkle: true },
              ].map(({ label, key, suffix, Icon, sparkle }) => {
                const val = metrics?.[key];
                return (
                  <div className="metric-card" key={key}>
                    <span className="metric-icon">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                        <div className="metric-label">{label}</div>
                        {sparkle && (
                          <button
                            type="button"
                            onClick={() => handleAskAiAboutMetric(label, val)}
                            className="metric-sparkle-btn"
                            title={`Ask AI about ${label}`}
                            aria-label={`Ask AI about ${label}`}
                          >
                            <Sparkles size={11} /> ✨
                          </button>
                        )}
                      </div>
                      <strong className="metric-value">
                        {val === null || val === undefined || val === ""
                          ? "Unavailable"
                          : `${Number(val).toFixed(Number.isInteger(Number(val)) ? 0 : 2)}${suffix}`}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Assessment Transcript */}
          <section
            className="card"
            style={{
              padding: "24px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <span className="metric-icon">
                <FileText size={18} />
              </span>
              <h3 style={{ margin: 0 }}>Exact Assessment Transcript</h3>
            </div>
            <p
              style={{
                color: "var(--text-light)",
                fontSize: "13px",
                marginBottom: "12px",
              }}
            >
              Verbatim speech transcript utilized for classification inference
              (punctuation and structure preserved).
            </p>
            <div
              style={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "16px",
                fontSize: "14.5px",
                lineHeight: 1.6,
                color: "var(--text)",
                fontFamily: "inherit",
                whiteSpace: "pre-wrap",
              }}
            >
              {assessment?.transcript || "No transcript recorded."}
            </div>
          </section>

          {/* Deep Learning Model Information */}
          <section className="report-stat-grid" aria-label="Model Information" style={{ marginBottom: "24px" }}>
            <article className="card report-stat">
              <span className="metric-icon">
                <Brain size={19} />
              </span>
              <div>
                <p>Base Model</p>
                <h3 style={{ fontSize: "14px", wordBreak: "break-all" }}>
                  microsoft/deberta-v3-base
                </h3>
              </div>
            </article>

            <article className="card report-stat">
              <span className="metric-icon">
                <Cpu size={19} />
              </span>
              <div>
                <p>Architecture</p>
                <h3 style={{ fontSize: "14px" }}>Attention + Mean Pooling</h3>
              </div>
            </article>

            <article className="card report-stat">
              <span className="metric-icon">
                <ShieldCheck size={19} />
              </span>
              <div>
                <p>Checkpoint & Accuracy</p>
                <h3 style={{ fontSize: "14px" }}>checkpoint-264 (89.33%)</h3>
              </div>
            </article>
          </section>

          {/* Actions: Generate PDF, View History, New Assessment */}
          <div className="report-action-grid">
            <button
              type="button"
              className="button button-primary"
              id="generate-pdf-report-btn"
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf || !assessment}
            >
              <FileDown size={18} />
              {isGeneratingPdf ? "Generating PDF..." : "Generate PDF"}
            </button>

            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/history")}
            >
              <History size={18} /> View Previous Analyses
            </button>

            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/assessment")}
            >
              <ArrowRight size={18} /> New Assessment
            </button>
          </div>

          <aside
            className="card"
            style={{
              padding: "20px 24px",
              marginTop: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              background: "linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)",
              border: "1px solid #ccfbf1",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span
                className="metric-icon"
                style={{ background: "var(--primary)", color: "white" }}
              >
                <Bot size={22} />
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px" }}>
                  AlzDx AI Assistant (Gemini 2.5 Flash)
                </h3>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "13px",
                    color: "var(--text-light)",
                  }}
                >
                  Get instant explanations for your speech metrics and screening outcome.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="button button-primary"
              id="ask-ai-report-btn"
              onClick={() => setIsChatOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Bot size={18} /> Ask AI about my results
            </button>
          </aside>

          <p className="medical-disclaimer" style={{ marginTop: "20px" }}>
            This result is for educational screening only and is not a diagnosis.
            Please discuss health concerns with a qualified healthcare professional.
          </p>
        </>
      )}
      <ChatAssistant
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        assessmentId={assessment?.id}
        assessmentData={assessment}
        initialPrompt={initialChatPrompt}
        onClearInitialPrompt={() => setInitialChatPrompt("")}
      />
    </Layout>
  );
}

export default AnalysisReport;
