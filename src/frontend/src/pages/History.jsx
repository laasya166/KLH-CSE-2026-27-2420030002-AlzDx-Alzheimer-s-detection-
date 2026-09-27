import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileDown } from "lucide-react";
import Layout from "../components/Layout";
import { fetchAssessment, fetchAssessments } from "../services/api";
import { downloadAlzDxPdf } from "../services/pdfReportGenerator";

function History() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => {
    let active = true;
    fetchAssessments()
      .then((records) => {
        if (active) setAnalyses(records);
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load assessment history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleGeneratePdf = async (e, analysis) => {
    e.stopPropagation();
    setGeneratingId(analysis.id);
    try {
      // Fetch full persisted assessment from PostgreSQL
      const detailed = await fetchAssessment(analysis.id);
      downloadAlzDxPdf(detailed);
    } catch (err) {
      console.error("Could not fetch full assessment for PDF:", err);
      // Fallback with available record values
      downloadAlzDxPdf(analysis);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <Layout
      title="Analysis History"
      subtitle="Review past speech screening records and generated PDF reports."
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {error && (
          <div
            role="alert"
            style={{
              color: "var(--danger)",
              background: "#fef2f2",
              padding: "14px 18px",
              borderRadius: "12px",
              marginBottom: "20px",
              border: "1px solid #fecaca",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="skeleton-box"
                style={{ height: "80px", width: "100%", borderRadius: "16px" }}
              />
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <div className="history-empty">
            <h2 style={{ marginBottom: 7, color: "var(--text)" }}>
              No previous assessments
            </h2>
            <p>Your completed screenings will appear here.</p>
          </div>
        ) : (
          analyses.map((analysis) => (
            <div
              className="history-item"
              key={analysis.id}
              onClick={() =>
                navigate("/report", { state: { assessmentId: analysis.id } })
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate("/report", { state: { assessmentId: analysis.id } });
                }
              }}
              aria-label={`Open assessment from ${new Date(
                analysis.created_at
              ).toLocaleDateString()}`}
              style={{ cursor: "pointer" }}
            >
              <div className="history-item-content">
                <div>
                  <h3 style={{ margin: "0 0 6px" }}>
                    {new Date(analysis.created_at).toLocaleDateString()}
                  </h3>
                  <p style={{ margin: 0, color: "var(--text-light)" }}>
                    Cookie Theft Assessment
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "12px",
                      color: "var(--text-light)",
                      marginTop: "4px",
                    }}
                  >
                    ID: {String(analysis.id).slice(0, 8)}...
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "18px",
                  }}
                >
                  <div style={{ textAlign: "right" }}>
                    <strong>{Number(analysis.confidence).toFixed(1)}%</strong>
                    <p
                      style={{
                        margin: "4px 0 0",
                        color: analysis.prediction
                          .toLowerCase()
                          .includes("alzheimer")
                          ? "var(--danger)"
                          : "var(--primary-dark)",
                        fontWeight: "600",
                      }}
                    >
                      {analysis.prediction}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="button button-primary"
                    style={{
                      padding: "8px 14px",
                      fontSize: "13px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onClick={(e) => handleGeneratePdf(e, analysis)}
                    disabled={generatingId === analysis.id}
                    id={`generate-pdf-btn-${analysis.id}`}
                    title="Generate PDF for this assessment"
                  >
                    <FileDown size={15} />
                    {generatingId === analysis.id
                      ? "Generating..."
                      : "Generate PDF"}
                  </button>

                  <ArrowRight size={18} color="var(--text-light)" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}

export default History;
