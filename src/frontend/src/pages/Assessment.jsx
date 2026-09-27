import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bot,
  CheckCircle2,
  Clock3,
  FileDown,
  MessageCircle,
  Pause,
  Repeat2,
  Sparkles,
  Timer,
} from "lucide-react";
import Layout from "../components/Layout";
import ImageCard from "../components/ImageCard";
import VoiceRecorder from "../components/VoiceRecorder";
import ChatAssistant from "../components/ChatAssistant";
import { analyzeAssessment } from "../services/api";
import { downloadAlzDxPdf } from "../services/pdfReportGenerator";
import cookieTheftImage from "../assets/cookie-theft.png";

function Assessment() {
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [result, setResult] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
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

  const handleGeneratePdf = () => {
    if (!result) return;
    setIsGeneratingPdf(true);
    try {
      downloadAlzDxPdf({
        id: result.assessment_id || result.id,
        prediction: result.prediction,
        confidence: result.confidence,
        transcript: result.transcript || text,
        metrics: result.metrics || metrics,
        created_at: result.created_at,
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  const confidenceValue = Math.min(100, Math.max(0, Number(result?.confidence) || 0));

  const handleAnalyze = async () => {
    if (!audioFile) {
      alert("Please record or upload audio before analyzing.");
      return;
    }

    setLoading(true);
    setResult(null);
    setAnalysisError("");

    try {
      const response = await analyzeAssessment(audioFile, text);
      setResult(response);
    } catch (err) {
      console.error(err);
      setAnalysisError(err.message || "Assessment analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      title="Cookie Theft Assessment"
      subtitle="Observe the image carefully and describe everything happening naturally."
    >
      {/* Cookie Theft Image */}
      <ImageCard src={cookieTheftImage} />

      {/* Voice Recorder */}
      <VoiceRecorder
        onTranscriptionStateChange={setIsTranscribing}
        onAudioReady={(file) => {
          setAudioFile(file);
          setText("");
          setMetrics(null);
          setResult(null);
          setAnalysisError("");
        }}
        onTranscriptReady={(transcript, extractedMetrics) => {
          setText(transcript);
          setMetrics(extractedMetrics);
        }}
      />

      {/* Transcript */}
      <section className="card section-card" aria-labelledby="transcript-heading">
        <div className="transcript-meta" style={{ marginBottom: 12 }}>
          <h3 id="transcript-heading" style={{ margin: 0 }}>Transcript</h3>

          {text && (
            <span className="status-pill">
              <CheckCircle2 size={15} aria-hidden="true" />
              Auto-transcribed
            </span>
          )}
        </div>

        <p
          style={{ color: "var(--text-light)", marginBottom: "16px" }}
        >
          Your transcript is generated automatically after recording or uploading audio. You can edit it before analysis.
        </p>

        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your transcript will appear here automatically..."
          className="transcript-input"
          aria-label="Editable assessment transcript"
        />
        <div className="transcript-meta" style={{ marginTop: 9 }}>
          {!text && <span className="empty-state">No transcript yet. Record or upload audio to begin.</span>}
          <span className="character-count" aria-live="polite">{text.length} characters</span>
        </div>
      </section>

      {/* Analyze */}
      <button
        onClick={handleAnalyze}
        disabled={loading || isTranscribing || !audioFile || !text.trim()}
        className="button button-primary"
        style={{ width: "100%", minHeight: 54, marginTop: 22, fontSize: 16 }}
        aria-busy={loading}
      >
        {loading && <span className="loading-spinner" aria-hidden="true" />}
        {isTranscribing ? "Transcribing audio..." : loading ? "Analyzing assessment..." : "Analyze Assessment"}
      </button>

      {analysisError && <div role="alert" style={{ color: "var(--danger)", marginTop: 12 }}>{analysisError}</div>}

      {loading && (
        <div className="result-skeleton" aria-label="Loading assessment results" role="status">
          {Array.from({ length: 6 }).map((_, index) => <div className="skeleton-card" key={index} />)}
        </div>
      )}

      {/* Result */}
      {result && (
        <section className="card result-panel" aria-labelledby="result-heading">
          <h2 style={{ marginBottom: "18px" }}>Prediction Result</h2>

          <div className="result-summary">
            <div>
              <span className="status-pill">Screening Result</span>
              <h1 className="result-title" id="result-heading">{result.prediction}</h1>
              <p className="result-copy">Assessment screening outcome</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <svg
                className="confidence-ring"
                viewBox="0 0 120 120"
                role="img"
                aria-label={`Confidence ${Number(result.confidence).toFixed(1)}%`}
              >
                <circle cx="60" cy="60" r="49" fill="none" stroke="#e6efec" strokeWidth="9" />
                <circle
                  cx="60" cy="60" r="49" fill="none" stroke="var(--primary)" strokeWidth="9"
                  strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 49}`}
                  strokeDashoffset={`${2 * Math.PI * 49 * (1 - confidenceValue / 100)}`}
                  transform="rotate(-90 60 60)"
                  style={{ transition: "stroke-dashoffset 700ms ease" }}
                />
                <text x="60" y="57" textAnchor="middle" fill="var(--text)" fontSize="23" fontWeight="750">
                  {Number(result.confidence).toFixed(1) + "%"}
                </text>
                <text x="60" y="75" textAnchor="middle" fill="var(--text-light)" fontSize="10">
                  confidence
                </text>
              </svg>
              <button
                type="button"
                onClick={() => handleAskAiAboutMetric("Confidence", result.confidence)}
                className="metric-sparkle-btn"
                style={{ marginTop: "6px" }}
                title="Ask AI about confidence score"
                aria-label="Ask AI about confidence score"
              >
                <Sparkles size={11} /> Explain ✨
              </button>
            </div>
          </div>

          <div className="result-content">
            <div className="analysis-panel">
              <h3 style={{ marginBottom: "12px" }}>Linguistic Analysis</h3>

              <div className="metric-grid">
                {[
                  { label: "Speech Rate", key: "speech_rate", suffix: " WPM", Icon: Activity, sparkle: true },
                  { label: "Pause Count", key: "pause_count", suffix: "", Icon: Pause, sparkle: true },
                  { label: "Total Pause", key: "total_pause_seconds", suffix: " s", Icon: Clock3 },
                  { label: "Average Pause", key: "average_pause_seconds", suffix: " s", Icon: Timer },
                  { label: "Hesitations", key: "hesitation_count", suffix: "", Icon: MessageCircle, sparkle: true },
                  { label: "Repetitions", key: "repetition_count", suffix: "", Icon: Repeat2, sparkle: true },
                ].map(({ label, key, suffix, Icon, sparkle }) => {
                  const value = (result?.metrics || metrics)?.[key];
                  return (
                    <div className="metric-card" key={key}>
                      <span className="metric-icon"><Icon size={18} aria-hidden="true" /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                          <div className="metric-label">{label}</div>
                          {sparkle && (
                            <button
                              type="button"
                              onClick={() => handleAskAiAboutMetric(label, value)}
                              className="metric-sparkle-btn"
                              title={`Ask AI about ${label}`}
                              aria-label={`Ask AI about ${label}`}
                            >
                              <Sparkles size={11} /> ✨
                            </button>
                          )}
                        </div>
                        <strong className="metric-value">
                        {value === null || value === undefined ? "Unavailable" : `${value}${suffix}`}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="result-actions">
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
                className="button button-primary"
                id="generate-pdf-btn"
              >
                <FileDown size={18} aria-hidden="true" />
                {isGeneratingPdf ? "Generating PDF..." : "Generate PDF"}
              </button>

              <button
                onClick={() => navigate("/history")}
                className="button button-secondary"
              >
                Previous Analyses
              </button>

              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="button button-secondary"
                id="ask-ai-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  borderColor: "var(--primary)",
                  color: "var(--primary-dark)",
                }}
              >
                <Bot size={18} aria-hidden="true" />
                Ask AI about my results
              </button>
            </div>
          </div>
          <p className="medical-disclaimer">
            This result is for educational screening only and is not a diagnosis. Please discuss health concerns with a qualified healthcare professional.
          </p>
        </section>
      )}
      <ChatAssistant
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        assessmentId={result?.assessment_id || result?.id}
        assessmentData={result}
        initialPrompt={initialChatPrompt}
        onClearInitialPrompt={() => setInitialChatPrompt("")}
      />
    </Layout>
  );
}

export default Assessment;
