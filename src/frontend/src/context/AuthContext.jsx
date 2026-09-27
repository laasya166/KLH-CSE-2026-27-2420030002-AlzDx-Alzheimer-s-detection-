import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, fetchCurrentUser, updateUserProfile } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("alzdx_token"));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("alzdx_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize user session on mount
  useEffect(() => {
    let active = true;
    const storedToken = localStorage.getItem("alzdx_token");

    if (storedToken) {
      fetchCurrentUser(storedToken)
        .then((userData) => {
          if (active) {
            setUser(userData);
            localStorage.setItem("alzdx_user", JSON.stringify(userData));
          }
        })
        .catch(() => {
          // Token expired or invalid
          if (active) {
            setToken(null);
            setUser(null);
            localStorage.removeItem("alzdx_token");
            localStorage.removeItem("alzdx_user");
          }
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await loginUser({ username, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("alzdx_token", data.token);
    localStorage.setItem("alzdx_user", JSON.stringify(data.user));
    return data.user;
  }, []);

  const register = useCallback(async (userData) => {
    const data = await registerUser(userData);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("alzdx_token", data.token);
    localStorage.setItem("alzdx_user", JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("alzdx_token");
    localStorage.removeItem("alzdx_user");
  }, []);

  const updateProfile = useCallback(async (updateData) => {
    const updated = await updateUserProfile(updateData, token);
    setUser(updated);
    localStorage.setItem("alzdx_user", JSON.stringify(updated));
    return updated;
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    try {
      const refreshed = await fetchCurrentUser(token);
      setUser(refreshed);
      localStorage.setItem("alzdx_user", JSON.stringify(refreshed));
      return refreshed;
    } catch {
      return null;
    }
  }, [token]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
