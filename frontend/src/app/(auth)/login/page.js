"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("nusrat@example.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(email, password);
      router.push(u.role === "DRIVER" ? "/driver" : "/passenger");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(demoEmail) {
    setEmail(demoEmail);
    setPassword("Password123!");
  }

  const demoAccounts = [
    { name: "Jashim", role: "Driver", email: "jashim@example.com" },
    { name: "Nusrat", role: "Passenger", email: "nusrat@example.com" },
    { name: "Rafiq", role: "Passenger", email: "rafiq@example.com" },
    { name: "Shirin", role: "Passenger", email: "shirin@example.com" },
  ];

  return (
    <section>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Welcome back</h1>
      <p className="text-muted" style={{ marginBottom: '24px' }}>Sign in to continue your journey.</p>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input 
            className="input-field"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            type="email" 
            placeholder="name@example.com"
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            className="input-field"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            type="password" 
            placeholder="••••••••"
            required 
          />
        </div>
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '16px' }} 
          disabled={busy}
        >
          {busy ? <span className="spinner" /> : "Sign in"}
        </button>
      </form>

      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border-strong)' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '4px' }}>Demo Accounts</h3>
        <p className="text-muted text-small" style={{ marginBottom: '16px' }}>— For Evaluation Only —</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {demoAccounts.map((acc) => (
            <div key={acc.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9375rem' }}>{acc.name} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>({acc.role})</span></strong>
                <span className="text-muted text-small">{acc.email}</span>
              </div>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                onClick={() => fillDemo(acc.email)}
              >
                Use Demo
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
