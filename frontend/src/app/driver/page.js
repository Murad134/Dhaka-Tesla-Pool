"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, moneyPoysha } from "../../lib/api";
import RideStatusBadge from "../../components/RideStatusBadge";

export default function DriverPage() {
  const [me, setMe] = useState(null);
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [m, r, h] = await Promise.all([
        apiFetch("/drivers/me"),
        apiFetch("/drivers/requests"),
        apiFetch("/drivers/history")
      ]);
      setMe(m);
      setRequests(r);
      setHistory(h);
      setError("");
    } catch (e) {
      setError(e.message || "Failed to load driver data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      await apiFetch("/drivers/online", {
        method: "PATCH",
        body: JSON.stringify({ isOnline: !me.driver.isOnline })
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function match(id) {
    try {
      await apiFetch(`/rides/${id}/match`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function advance(ride, status) {
    try {
      await apiFetch(`/rides/${ride.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading && !me) {
    return (
      <main className="container">
        <div className="dashboard-header">
          <div className="skeleton skeleton-block" style={{ height: '60px', width: '300px' }} />
          <div className="skeleton skeleton-block" style={{ height: '40px', width: '120px' }} />
        </div>
        <div className="grid grid-cols-3">
          <div className="skeleton skeleton-block" style={{ height: '100px' }} />
          <div className="skeleton skeleton-block" style={{ height: '100px' }} />
          <div className="skeleton skeleton-block" style={{ height: '100px' }} />
        </div>
        <div className="skeleton skeleton-block" style={{ height: '200px', marginTop: '32px' }} />
      </main>
    );
  }

  return (
    <main className="container">
      <div className="dashboard-header">
        <div>
          <p className="text-muted text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Driver Dashboard</p>
          <h1 style={{ fontSize: '2rem', marginTop: '4px' }}>Good morning, {me?.user?.name || "Driver"}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-strong)' }}>
          <span style={{ fontWeight: '600', color: me?.driver?.isOnline ? 'var(--accent)' : 'var(--text-muted)' }}>
            {me?.driver?.isOnline ? "Online" : "Offline"}
          </span>
          <input 
            type="checkbox" 
            className="toggle-switch" 
            checked={me?.driver?.isOnline || false} 
            onChange={toggle} 
            disabled={busy} 
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button className="btn btn-ghost" style={{ padding: '4px 12px', minHeight: 0 }} onClick={load}>Retry</button>
        </div>
      )}

      <div className="grid grid-cols-3" style={{ marginBottom: '32px' }}>
        <div className="card card-glass" style={{ padding: '20px' }}>
          <span className="text-muted text-small">Tesla</span>
          <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '8px' }}>{me?.driver?.tesla?.name || "—"}</strong>
        </div>
        <div className="card card-glass" style={{ padding: '20px' }}>
          <span className="text-muted text-small">Capacity</span>
          <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '8px' }}>{me?.driver?.tesla?.capacity || 0} seats</strong>
        </div>
        <div className="card card-glass" style={{ padding: '20px' }}>
          <span className="text-muted text-small">Open requests</span>
          <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '8px', color: 'var(--accent)' }}>{requests.length}</strong>
        </div>
      </div>

      <section className="card" style={{ marginBottom: '32px', background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}>
        <h2 style={{ marginBottom: '16px' }}>Ride Requests</h2>
        {requests.length ? (
          <div className="grid grid-cols-2">
            {requests.map((r) => (
              <div className="action-card" key={r.id}>
                <div className="action-card-header">
                  <div>
                    <h3 style={{ fontSize: '1.25rem' }}>{r.pickupZone.name} → {r.destinationZone.name}</h3>
                    <span className="text-muted text-small" style={{ display: 'block', marginTop: '4px' }}>
                      {r.passenger.name} · {r.seatsRequested} seat{r.seatsRequested > 1 ? "s" : ""} · {Number(r.distanceKm)} km
                    </span>
                  </div>
                  <strong style={{ color: 'var(--accent)', fontSize: '1.25rem' }}>{moneyPoysha(r.farePoysha)}</strong>
                </div>
                <button className="btn btn-primary" onClick={() => match(r.id)} style={{ width: '100%', marginTop: '8px' }}>
                  Accept / Pool
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No requested rides right now</h3>
            <p style={{ marginTop: '8px' }}>Stay online to receive ride requests.</p>
          </div>
        )}
      </section>

      <section className="card card-glass">
        <h2 style={{ marginBottom: '24px' }}>Active & Past Rides</h2>
        {history.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {history.map((r) => (
              <div key={r.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: 'var(--bg-base)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <strong style={{ fontSize: '1.125rem', display: 'block' }}>{r.pickupZone.name} → {r.destinationZone.name}</strong>
                  <span className="text-muted text-small" style={{ display: 'block', marginTop: '4px' }}>
                    {r.passenger.name} · {r.seatsRequested} seat{r.seatsRequested > 1 ? "s" : ""}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <RideStatusBadge status={r.status}/>
                  {r.status === "MATCHED" && <button className="btn btn-secondary" onClick={() => advance(r, "DRIVER_ARRIVED")}>Arrived</button>}
                  {r.status === "DRIVER_ARRIVED" && <button className="btn btn-secondary" onClick={() => advance(r, "STARTED")}>Start</button>}
                  {r.status === "STARTED" && <button className="btn btn-primary" onClick={() => advance(r, "COMPLETED")}>Complete</button>}
                  <Link className="btn btn-ghost" href={`/driver/ride/${r.id}`}>Details</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No active rides</h3>
            <p style={{ marginTop: '8px' }}>Accepted rides will appear here.</p>
          </div>
        )}
      </section>
    </main>
  );
}
