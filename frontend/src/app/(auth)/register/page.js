"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { showError, showSuccess } from "../../../lib/feedback";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "PASSENGER" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await register(form);
      await showSuccess("Account created", `Welcome to Dhaka Tesla Pool, ${u.name}.`);
      router.push(u.role === "DRIVER" ? "/driver" : "/passenger");
    } catch (err) {
      setError(err.message);
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Create account</h1>
      <p className="text-muted" style={{ marginBottom: '24px' }}>Join the Dhaka Tesla Pool today.</p>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input 
            className="input-field"
            name="name" 
            value={form.name} 
            onChange={change} 
            placeholder="Full name"
            required 
            minLength={2} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input 
            className="input-field"
            name="email" 
            value={form.email} 
            onChange={change} 
            type="email" 
            placeholder="name@example.com"
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            className="input-field"
            name="password" 
            value={form.password} 
            onChange={change} 
            type="password" 
            placeholder="••••••••"
            minLength={8} 
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Account Type</label>
          <select 
            className="input-field"
            name="role" 
            value={form.role} 
            onChange={change}
          >
            <option value="PASSENGER">Passenger</option>
            <option value="DRIVER">Driver</option>
          </select>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '16px' }} 
          disabled={busy}
        >
          {busy ? <span className="spinner" /> : "Create account"}
        </button>
      </form>
    </section>
  );
}
