import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Lock, User, Mail, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Login({ initialMode = "login" }) {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();

  const [mode, setMode] = useState(initialMode); // "login" | "register"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync mode if initialMode prop changes
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // If already authenticated, redirect directly to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Register extra form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (mode === "login") {
        if (!username.trim() || !password) {
          throw new Error("Please enter both username and password.");
        }
        await login(username.trim(), password);
        setSuccessMsg("Signed in successfully! Opening dashboard...");
        setTimeout(() => navigate("/dashboard", { replace: true }), 300);
      } else {
        if (!username.trim() || !password) {
          throw new Error("Username and password are required.");
        }
        if (username.trim().length < 3) {
          throw new Error("Username must be at least 3 characters long.");
        }
        if (password.length < 4) {
          throw new Error("Password must be at least 4 characters.");
        }
        await register({
          username: username.trim(),
          password,
          full_name: fullName.trim() || undefined,
          email: email.trim() || undefined,
          role: "Patient",
        });
        setSuccessMsg("Account created successfully! Opening dashboard...");
        setTimeout(() => navigate("/dashboard", { replace: true }), 300);
      }
    } catch (err) {
      setError(err.message || "Authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top right, rgba(88, 169, 166, 0.12), transparent 45%), var(--background)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            color: "var(--text)",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, var(--secondary), var(--primary))",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(88, 169, 166, 0.28)",
            }}
          >
            <Brain size={24} />
          </div>
          <span style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            Alz<span style={{ color: "var(--primary)" }}>Dx</span>
          </span>
        </div>
        <p style={{ color: "var(--text-light)", fontSize: "14px", margin: 0 }}>
          Speech Biomarker Screening & Assessment Platform
        </p>
      </div>

      {/* Main Auth Card */}
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "32px",
          borderRadius: "20px",
          boxShadow: "0 12px 36px rgba(35, 49, 58, 0.08)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Tab Switcher */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
            background: "var(--background)",
            padding: "4px",
            borderRadius: "12px",
            marginBottom: "24px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setSuccessMsg("");
            }}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: mode === "login" ? "white" : "transparent",
              color: mode === "login" ? "var(--primary-dark)" : "var(--text-light)",
              fontWeight: mode === "login" ? "700" : "500",
              cursor: "pointer",
              boxShadow: mode === "login" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
              setSuccessMsg("");
            }}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: mode === "register" ? "white" : "transparent",
              color: mode === "register" ? "var(--primary-dark)" : "var(--text-light)",
              fontWeight: mode === "register" ? "700" : "500",
              cursor: "pointer",
              boxShadow: mode === "register" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Create Account
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              borderRadius: "10px",
              fontSize: "14px",
              marginBottom: "18px",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 14px",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#047857",
              borderRadius: "10px",
              fontSize: "14px",
              marginBottom: "18px",
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Full Name & Email (Register only) */}
          {mode === "register" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "var(--text)" }}>
                  Full Name
                </label>
                <div style={{ position: "relative" }}>
                  <User
                    size={18}
                    style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}
                  />
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 42px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      fontSize: "14px",
                      color: "var(--text)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "var(--text)" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={18}
                    style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}
                  />
                  <input
                    type="email"
                    placeholder="e.g. john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 42px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      fontSize: "14px",
                      color: "var(--text)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Username */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "var(--text)" }}>
              Username
            </label>
            <div style={{ position: "relative" }}>
              <User
                size={18}
                style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}
              />
              <input
                type="text"
                autoComplete="username"
                required
                placeholder="e.g. johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 42px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  fontSize: "14px",
                  color: "var(--text)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "var(--text)" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 42px 12px 42px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  fontSize: "14px",
                  color: "var(--text)",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-light)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Quick Demo Logins Helper */}
          {mode === "login" && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                background: "var(--background)",
                border: "1px dashed var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-light)" }}>
                Quick Demo Accounts
              </span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    setUsername("doctor_smith");
                    setPassword("alzdx2026");
                    setError("");
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "white",
                    color: "var(--primary-dark)",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  🩺 Dr. Smith (Doctor)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsername("demo");
                    setPassword("demo1234");
                    setError("");
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "white",
                    color: "var(--primary-dark)",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  👤 Alex Morgan (Demo)
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              color: "white",
              fontWeight: "700",
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(88, 169, 166, 0.3)",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{mode === "login" ? "Sign In to AlzDx" : "Create Account"}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div style={{ marginTop: "24px", textAlign: "center", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-light)", margin: 0 }}>
            {mode === "login" ? "Don't have an account yet?" : "Already registered?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
                setSuccessMsg("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--primary-dark)",
                fontWeight: "700",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {mode === "login" ? "Create one here" : "Sign In instead"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
