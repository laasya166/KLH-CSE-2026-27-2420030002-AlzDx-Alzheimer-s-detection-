import { useNavigate } from "react-router-dom";
import { Brain, ShieldCheck, FileDown, History } from "lucide-react";
import Layout from "../components/Layout";
import { downloadAlzDxPdf } from "../services/pdfReportGenerator";

function Report() {
  const navigate = useNavigate();

  const prediction = "Alzheimer's Disease";
  const confidence = 89.33;

  return (
    <Layout
      title="Analysis Report"
      subtitle="Cookie Theft speech assessment results"
    >
      {/* Prediction Hero */}
      <div
        style={{
          background: "var(--primary)",
          color: "white",
          borderRadius: "24px",
          padding: "30px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <p style={{ opacity: 0.9, marginBottom: "8px" }}>
              Model Prediction
            </p>

            <h1 style={{ margin: 0, fontSize: "36px" }}>{prediction}</h1>

            <p style={{ marginTop: "10px", opacity: 0.95 }}>
              Confidence Score: <strong>{confidence}%</strong>
            </p>
          </div>

          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: "rgba(255,255,255,.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Brain size={42} />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "18px",
          marginBottom: "24px",
        }}
      >
        <div className="card" style={{ padding: "20px" }}>
          <p style={{ color: "var(--text-light)" }}>Model Used</p>
          <h3 style={{ marginTop: "8px" }}>EXP8</h3>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <p style={{ color: "var(--text-light)" }}>Assessment</p>
          <h3 style={{ marginTop: "8px" }}>Cookie Theft</h3>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <p style={{ color: "var(--text-light)" }}>Status</p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <ShieldCheck size={18} color="var(--success)" />
            <h3 style={{ margin: 0 }}>Completed</h3>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div
        className="card"
        style={{
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginBottom: "16px" }}>Linguistic Analysis</h2>

        <p
          style={{
            color: "var(--text-light)",
            lineHeight: 1.7,
          }}
        >
          After integrating the final EXP8 model, this section will display the
          explainable AI insights, including linguistic patterns, pauses,
          semantic coherence, and attention-based explanations that contributed
          to the prediction.
        </p>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "16px",
        }}
      >
        <button
          onClick={() => {
            downloadAlzDxPdf({
              id: "report-demo-id",
              prediction,
              confidence,
              transcript: "Speech assessment description",
              metrics: {},
              created_at: new Date().toISOString(),
            });
          }}
          style={{
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "14px",
            padding: "16px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          <FileDown size={18} />
          Generate PDF
        </button>

        <button
          onClick={() => navigate("/history")}
          style={{
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "16px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          <History size={18} />
          View History
        </button>

        <button
          onClick={() => navigate("/assessment")}
          style={{
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "16px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          New Assessment
        </button>
      </div>
    </Layout>
  );
}

export default Report;