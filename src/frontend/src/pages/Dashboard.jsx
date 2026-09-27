import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Calendar,
  History,
  Play,
  RefreshCw,
  User,
} from "lucide-react";
import Layout from "../components/Layout";
import { fetchAssessments } from "../services/api";

function Dashboard() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const records = await fetchAssessments();
      setAssessments(records || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError(err.message || "Unable to load dashboard assessments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metrics
  const totalAnalyses = assessments.length;
  const latestAssessment = assessments[0] || null;

  const averageConfidence =
    totalAnalyses > 0
      ? (
          assessments.reduce(
            (sum, item) => sum + (Number(item.confidence) || 0),
            0
          ) / totalAnalyses
        ).toFixed(1)
      : null;

  const recentAssessments = assessments.slice(0, 5);

  return (
    <Layout title="Dashboard" subtitle="Overview of cognitive speech assessments.">
      {/* Error Banner with Retry */}
      {error && (
        <div
          role="alert"
          style={{
            padding: "14px 18px",
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "14px",
            color: "#9a3412",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            fontSize: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            style={{
              padding: "6px 12px",
              background: "white",
              border: "1px solid #fed7aa",
              borderRadius: "8px",
              color: "#9a3412",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12.5px",
            }}
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Hero Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
          borderRadius: "28px",
          padding: "clamp(24px, 4vw, 40px)",
          color: "white",
          marginBottom: "28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "24px",
          boxShadow: "0 8px 24px rgba(13, 148, 136, 0.15)",
        }}
      >
        <div style={{ maxWidth: "560px" }}>
          <p
            style={{
              opacity: 0.9,
              marginBottom: "8px",
              fontSize: "13.5px",
              fontWeight: "600",
              letterSpacing: "0.02em",
            }}
          >
            Standardized Cookie Theft Assessment
          </p>

          <h2
            style={{
              fontSize: "clamp(24px, 3.5vw, 32px)",
              lineHeight: "1.25",
              marginBottom: "12px",
              fontWeight: "750",
            }}
          >
            Start a new cognitive speech assessment.
          </h2>

          <p
            style={{
              opacity: 0.92,
              marginBottom: "22px",
              fontSize: "14.5px",
              lineHeight: "1.55",
            }}
          >
            {loading ? (
              "Loading your assessment summary..."
            ) : totalAnalyses > 0 ? (
              `Welcome back. You've completed ${totalAnalyses} ${
                totalAnalyses === 1 ? "assessment" : "assessments"
              }.`
            ) : (
              "Record or upload a participant's Cookie Theft description for analysis using our trained DeBERTa model."
            )}
          </p>

          <button
            onClick={() => navigate("/assessment")}
            style={{
              background: "white",
              color: "var(--primary-dark)",
              border: "none",
              padding: "12px 22px",
              borderRadius: "999px",
              fontWeight: "650",
              fontSize: "14px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              transition: "transform 150ms ease, box-shadow 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
            }}
          >
            <Play size={16} fill="currentColor" /> Start Assessment{" "}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>

        <div
          style={{
            width: "clamp(90px, 12vw, 130px)",
            height: "clamp(90px, 12vw, 130px)",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexShrink: 0,
            boxShadow: "inset 0 0 20px rgba(255,255,255,0.2)",
          }}
        >
          <Brain size={52} aria-hidden="true" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats-grid">
        {/* Total Analyses */}
        <div className="card" style={{ padding: "24px" }}>
          <p style={{ color: "var(--text-light)", fontSize: "13.5px", fontWeight: "600", margin: 0 }}>
            Total Analyses
          </p>
          {loading ? (
            <div className="skeleton-box" style={{ height: "36px", width: "65px", marginTop: "10px" }} />
          ) : (
            <h1
              style={{
                color: "var(--primary)",
                marginTop: "8px",
                marginBottom: 0,
                fontSize: "36px",
                fontWeight: "800",
              }}
            >
              {totalAnalyses}
            </h1>
          )}
        </div>

        {/* Last Result */}
        <div className="card" style={{ padding: "24px" }}>
          <p style={{ color: "var(--text-light)", fontSize: "13.5px", fontWeight: "600", margin: 0 }}>
            Last Result
          </p>
          {loading ? (
            <div className="skeleton-box" style={{ height: "36px", width: "140px", marginTop: "10px" }} />
          ) : latestAssessment ? (
            <div style={{ marginTop: "8px", display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: "750",
                  color: latestAssessment.prediction.toLowerCase().includes("alzheimer")
                    ? "var(--danger)"
                    : "var(--primary-dark)",
                }}
              >
                {latestAssessment.prediction}
              </h2>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--text-light)",
                }}
              >
                ({Number(latestAssessment.confidence || 0).toFixed(1)}%)
              </span>
            </div>
          ) : (
            <h2 style={{ marginTop: "8px", marginBottom: 0, color: "var(--text-light)" }}>—</h2>
          )}
        </div>

        {/* Average Confidence */}
        <div className="card" style={{ padding: "24px" }}>
          <p style={{ color: "var(--text-light)", fontSize: "13.5px", fontWeight: "600", margin: 0 }}>
            Average Confidence
          </p>
          {loading ? (
            <div className="skeleton-box" style={{ height: "36px", width: "90px", marginTop: "10px" }} />
          ) : averageConfidence !== null ? (
            <h2
              style={{
                marginTop: "8px",
                marginBottom: 0,
                color: "var(--info)",
                fontSize: "32px",
                fontWeight: "750",
              }}
            >
              {averageConfidence}%
            </h2>
          ) : (
            <h2 style={{ marginTop: "8px", marginBottom: 0, color: "var(--text-light)" }}>—</h2>
          )}
        </div>
      </div>

      {/* Bottom Section: Recent Activity & Quick Actions */}
      <div className="dashboard-bottom-grid">
        {/* Recent Activity */}
        <div className="card" style={{ padding: "26px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "18px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Recent Activity</h3>
            {totalAnalyses > 5 && (
              <button
                type="button"
                onClick={() => navigate("/history")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--primary)",
                  fontSize: "12.5px",
                  fontWeight: "650",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                }}
              >
                View all ({totalAnalyses}) <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* Loading Skeletons */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1, 2, 3].map((key) => (
                <div key={key} className="skeleton-box" style={{ height: "56px", width: "100%" }} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && recentAssessments.length === 0 && (
            <div
              style={{
                borderLeft: "3px solid var(--secondary)",
                paddingLeft: "16px",
                paddingTop: "6px",
                paddingBottom: "6px",
              }}
            >
              <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "var(--text)" }}>
                No recent assessments
              </h4>
              <p style={{ margin: 0, color: "var(--text-light)", fontSize: "13.5px" }}>
                Your latest analyses will appear here.
              </p>
            </div>
          )}

          {/* Recent Assessment Rows */}
          {!loading && recentAssessments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentAssessments.map((item) => {
                const isAlz = item.prediction.toLowerCase().includes("alzheimer");
                const formattedDate = item.created_at
                  ? new Date(item.created_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Date recorded";

                return (
                  <div
                    key={item.id}
                    className="recent-activity-row"
                    onClick={() => navigate("/report", { state: { assessmentId: item.id } })}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open assessment from ${formattedDate}: ${item.prediction}, ${Number(item.confidence || 0).toFixed(1)}% confidence`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        navigate("/report", { state: { assessmentId: item.id } });
                      }
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: isAlz ? "#fef2f2" : "#f0fdfa",
                          color: isAlz ? "#dc2626" : "#0d9488",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Calendar size={17} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong
                          style={{
                            display: "block",
                            fontSize: "14px",
                            color: "var(--text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formattedDate}
                        </strong>
                        <span style={{ fontSize: "12px", color: "var(--text-light)" }}>
                          Cookie Theft Picture Description
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: isAlz ? "#fee2e2" : "#ccfbf1",
                            color: isAlz ? "#991b1b" : "#0f766e",
                          }}
                        >
                          {item.prediction}
                        </span>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "var(--text-light)",
                            marginTop: "2px",
                          }}
                        >
                          {Number(item.confidence || 0).toFixed(1)}%
                        </div>
                      </div>

                      <ArrowRight size={16} color="var(--text-light)" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ padding: "26px" }}>
          <h3 style={{ margin: "0 0 18px", fontSize: "17px", fontWeight: "700" }}>
            Quick Actions
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <button
              onClick={() => navigate("/assessment")}
              style={{
                background: "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "14px 18px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "opacity 150ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Brain size={18} /> New Assessment
              </span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => navigate("/history")}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                borderRadius: "12px",
                padding: "14px 18px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "background 150ms ease, border-color 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <History size={18} /> View History
              </span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => navigate("/profile")}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                borderRadius: "12px",
                padding: "14px 18px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "background 150ms ease, border-color 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <User size={18} /> Profile
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
