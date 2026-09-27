import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Brain, FileText, History, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Layout({ title, subtitle, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Assessment", path: "/assessment", icon: Brain },
    { label: "Reports", path: "/report", icon: FileText },
    { label: "History", path: "/history", icon: History },
  ];

  const isNavActive = (path) => {
    return location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path));
  };

  const getUsernameInitial = () => {
    if (!user || !user.username) return "U";
    return user.username.trim()[0].toUpperCase();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="nav-shell">
          <button
            type="button"
            className="brand-button"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
            aria-label="AlzDx home"
          >
            <span className="brand-mark">
              <Brain size={20} />
            </span>
            <h2 style={{ color: "var(--text)", margin: 0 }}>AlzDx</h2>
          </button>

          <div className="nav-actions">
            <nav className="nav-list" aria-label="Main navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item.path);

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`nav-link${active ? " is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    aria-label={item.label}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {isAuthenticated && user ? (
              <button
                type="button"
                className={`profile-button${location.pathname === "/profile" ? " is-active" : ""}`}
                onClick={() => navigate("/profile")}
                aria-label={`Profile of ${user.username}`}
                title={`@${user.username}`}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: location.pathname === "/profile" ? "2px solid var(--primary-dark)" : "1px solid var(--border)",
                  background: "linear-gradient(135deg, var(--secondary), var(--primary))",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: "pointer",
                  padding: 0,
                  boxShadow: location.pathname === "/profile" ? "0 0 0 3px rgba(88, 169, 166, 0.25)" : "none",
                  transition: "transform 150ms ease, box-shadow 150ms ease",
                }}
              >
                {getUsernameInitial()}
              </button>
            ) : (
              <button
                type="button"
                className="profile-button"
                onClick={() => navigate("/")}
                aria-label="Sign In"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--primary-dark)",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="page-main">
        <div className="page-heading">
          <h1>{title}</h1>

          {subtitle && (
            <p style={{ color: "var(--text-light)" }}>{subtitle}</p>
          )}
        </div>

        {children}
      </main>
    </div>
  );
}

export default Layout;
