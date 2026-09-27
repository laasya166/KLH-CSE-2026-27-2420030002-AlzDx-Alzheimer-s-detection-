import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  Calendar,
  LogOut,
  Edit3,
  Check,
  FileText,
  History,
  Brain,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { fetchUserProfileStats } from "../services/api";

function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();

  const [stats, setStats] = useState({
    total_assessments: 0,
    last_assessment_date: null,
    last_prediction: null,
    last_confidence: null,
  });

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync edit form with user data
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Load stats
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfileStats()
        .then((data) => setStats(data))
        .catch((err) => console.error("Could not fetch user stats:", err));
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");
    setSaving(true);

    try {
      const updateData = {
        full_name: fullName.trim() || undefined,
        email: email.trim() || undefined,
      };

      if (newPassword) {
        if (!currentPassword) {
          throw new Error("Current password is required to set a new password.");
        }
        updateData.current_password = currentPassword;
        updateData.new_password = newPassword;
      }

      await updateProfile(updateData);
      setEditSuccess("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => {
        setIsEditing(false);
        setEditSuccess("");
      }, 1200);
    } catch (err) {
      setEditError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const getUsernameInitial = () => {
    if (!user || !user.username) return "U";
    return user.username.trim()[0].toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Unauthenticated view
  if (!isAuthenticated || !user) {
    return (
      <Layout
        title="Profile"
        subtitle="Manage your personal account, security settings, and assessment history."
      >
        <div
          className="card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            maxWidth: "520px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "rgba(88, 169, 166, 0.15)",
              color: "var(--primary-dark)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto",
            }}
          >
            <UserRound size={36} />
          </div>
          <h2 style={{ marginBottom: "8px" }}>Sign In to View Your Profile</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "24px", fontSize: "15px" }}>
            Sign in with your username and password to view your saved assessment history, edit your account details, and download reports.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "12px 28px",
              fontWeight: "600",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Sign In / Register
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Profile"
      subtitle="Manage your personal account, security settings, and assessment history."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Main Profile Info Card */}
        <div
          className="card"
          style={{
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              {/* Username Initial Avatar */}
              <div
                style={{
                  width: "76px",
                  height: "76px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--secondary), var(--primary))",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "30px",
                  fontWeight: "700",
                  boxShadow: "0 6px 16px rgba(88, 169, 166, 0.28)",
                }}
              >
                {getUsernameInitial()}
              </div>

              <div>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "24px" }}>
                  {user.full_name || user.username}
                </h2>

                <p style={{ color: "var(--text-light)", margin: 0, fontSize: "14px" }}>
                  @{user.username} {user.email ? `• ${user.email}` : ""}
                </p>

                <p style={{ color: "var(--text-light)", margin: "4px 0 0 0", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Calendar size={13} />
                  <span>Member since {formatDate(user.created_at)}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsEditing(!isEditing);
                setEditError("");
                setEditSuccess("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: isEditing ? "var(--background)" : "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "10px 18px",
                color: "var(--text)",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <Edit3 size={16} />
              <span>{isEditing ? "Close Editor" : "Edit Profile"}</span>
            </button>
          </div>

          {/* Edit Form Section */}
          {isEditing && (
            <div
              style={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Edit3 size={18} color="var(--primary-dark)" />
                <span>Edit Account Details</span>
              </h3>

              {editError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "16px",
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    color: "#047857",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "16px",
                  }}
                >
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>{editSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "white",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. jane.doe@example.com"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "white",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>

                {/* Change Password Block */}
                <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "16px", marginTop: "4px" }}>
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-light)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Lock size={14} />
                    <span>Change Password (leave blank if keeping current password)</span>
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          background: "white",
                          border: "1px solid var(--border)",
                          borderRadius: "10px",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>
                        New Password (min 4 characters)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          background: "white",
                          border: "1px solid var(--border)",
                          borderRadius: "10px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "white",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: "10px 22px",
                      borderRadius: "10px",
                      border: "none",
                      background: "var(--primary)",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: saving ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Check size={16} />
                    <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Assessment Statistics Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
          }}
        >
          <div className="card" style={{ padding: "20px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-light)", fontWeight: "600" }}>
              Total Assessments
            </span>
            <h2 style={{ fontSize: "32px", margin: "10px 0 4px 0", color: "var(--primary-dark)" }}>
              {stats.total_assessments}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-light)", margin: 0 }}>
              Completed speech evaluations
            </p>
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-light)", fontWeight: "600" }}>
              Latest Diagnosis
            </span>
            <h2 style={{ fontSize: "24px", margin: "12px 0 4px 0", color: "var(--text)" }}>
              {stats.last_prediction ? `${stats.last_prediction}` : "None"}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-light)", margin: 0 }}>
              {stats.last_confidence ? `${stats.last_confidence}% confidence` : "No assessments recorded"}
            </p>
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-light)", fontWeight: "600" }}>
              Last Assessment Date
            </span>
            <h2 style={{ fontSize: "20px", margin: "14px 0 4px 0", color: "var(--text)" }}>
              {formatDate(stats.last_assessment_date)}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-light)", margin: 0 }}>
              Recorded in system
            </p>
          </div>
        </div>

        {/* Quick Navigation & Actions Section */}
        <div
          className="card"
          style={{
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <h3 style={{ fontSize: "16px", marginBottom: "4px" }}>Account Navigation & Actions</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            <button
              type="button"
              onClick={() => navigate("/assessment")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 20px",
                borderRadius: "14px",
                border: "none",
                background: "var(--primary)",
                color: "white",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(88, 169, 166, 0.25)",
              }}
            >
              <Brain size={20} />
              <span>New Speech Assessment</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/history")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 20px",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <History size={20} />
              <span>View Analysis History</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/report")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 20px",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <FileText size={20} />
              <span>Latest Analysis Report</span>
            </button>
          </div>

          <div style={{ marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "18px" }}>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 24px",
                borderRadius: "12px",
                border: "1px solid rgba(195, 90, 90, 0.3)",
                background: "#fff5f5",
                color: "var(--danger)",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <LogOut size={18} />
              <span>Sign Out of AlzDx</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Profile;
