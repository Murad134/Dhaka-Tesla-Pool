"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tesla_user");
      if (raw) setUser(JSON.parse(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    localStorage.setItem("tesla_token", data.token);
    localStorage.setItem("tesla_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify(payload) });
    localStorage.setItem("tesla_token", data.token);
    localStorage.setItem("tesla_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("tesla_token");
    localStorage.removeItem("tesla_user");
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, register, logout, setUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
