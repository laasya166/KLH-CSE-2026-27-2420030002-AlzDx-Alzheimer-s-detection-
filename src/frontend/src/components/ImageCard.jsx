import { useEffect, useState } from "react";
import { Info, Maximize2, X } from "lucide-react";

function ImageCard({
  src,
  title = "Cookie Theft Picture Description Task",
  instruction = "Describe everything you see in this picture using complete sentences. Speak naturally and include as much detail as you can.",
}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  return (
    <>
      <div
        className="card"
        style={{
          padding: "clamp(18px, 3vw, 26px)",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "750",
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            aria-label="Enlarge image"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--primary-dark)",
              background: "#f0fdfa",
              border: "1px solid #ccfbf1",
              borderRadius: "999px",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#ccfbf1";
              e.currentTarget.style.borderColor = "#99f6e4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f0fdfa";
              e.currentTarget.style.borderColor = "#ccfbf1";
            }}
          >
            <Maximize2 size={13} /> Click to enlarge
          </button>
        </div>

        {/* Task Instruction */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "12px 16px",
            background: "#f0fdfa",
            border: "1px solid #ccfbf1",
            borderLeft: "4px solid var(--primary)",
            borderRadius: "12px",
            marginBottom: "16px",
            fontSize: "14px",
            lineHeight: "1.55",
            color: "var(--text)",
          }}
        >
          <Info
            size={18}
            style={{
              flexShrink: 0,
              marginTop: "2px",
              color: "var(--primary)",
            }}
          />
          <p style={{ margin: 0, fontWeight: "500" }}>
            {instruction}
          </p>
        </div>

        {/* Interactive Image Frame */}
        <div
          className="image-frame"
          style={{
            position: "relative",
            cursor: "zoom-in",
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "14px",
            transition: "box-shadow 200ms ease, border-color 200ms ease",
          }}
          onClick={() => setIsLightboxOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Click to enlarge Cookie Theft picture"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsLightboxOpen(true);
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.boxShadow = "var(--shadow-soft)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <img
            src={src}
            alt="Cookie Theft Picture Description Task: A boy stealing cookies on a tipping stool, a girl reaching up, and a woman washing dishes at an overflowing sink."
            style={{
              display: "block",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "520px",
              objectFit: "contain",
              borderRadius: "10px",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: "16px",
              right: "16px",
              background: "rgba(15, 23, 42, 0.75)",
              color: "white",
              padding: "5px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backdropFilter: "blur(4px)",
              pointerEvents: "none",
            }}
          >
            <Maximize2 size={13} /> Click to expand
          </div>
        </div>
      </div>

      {/* Lightbox / Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged Cookie Theft Picture"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 200ms ease",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLightboxOpen(false);
          }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "960px",
              width: "100%",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "white",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 20px 48px rgba(0, 0, 0, 0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                background: "#f8fafc",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text)" }}>
                  Cookie Theft Picture (Standardized Clinical Stimulus)
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-light)" }}>
                  Boston Diagnostic Aphasia Examination
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                aria-label="Close enlarged picture"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "8px",
                  color: "var(--text)",
                  display: "grid",
                  placeItems: "center",
                  transition: "background 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Image Area */}
            <div
              style={{
                padding: "16px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#ffffff",
                overflowY: "auto",
                maxHeight: "calc(92vh - 120px)",
              }}
            >
              <img
                src={src}
                alt="Enlarged Cookie Theft Picture"
                style={{
                  maxWidth: "100%",
                  maxHeight: "75vh",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
            </div>

            {/* Modal Footer with Instruction */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--border)",
                background: "#f0fdfa",
                fontSize: "13px",
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <span style={{ fontWeight: "500" }}>
                Describe everything you see in this picture using complete sentences.
              </span>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setIsLightboxOpen(false)}
                style={{ padding: "6px 14px", fontSize: "13px" }}
              >
                Back to Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ImageCard;
