"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, moneyPoysha } from "../../../../lib/api";
import RideStatusBadge from "../../../../components/RideStatusBadge";
import PoolStatusCard from "../../../../components/PoolStatusCard";
import { showError, showSuccess } from "../../../../lib/feedback";

export default function DriverRide() {
  const { id } = useParams();
  const [ride, setRide] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRide(await apiFetch(`/rides/${id}`));
      setError("");
    } catch (e) {
      setError(e.message || "Failed to load ride.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function transition(status) {
    try {
      setRide(await apiFetch(`/rides/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      }));
      await showSuccess("Ride updated", `Ride status is now ${status.replaceAll("_", " ").toLowerCase()}.`);
    } catch (e) {
      setError(e.message);
      showError(e);
    }
  }

  if (loading && !ride) {
    return (
      <main className="container">
        <div className="skeleton skeleton-block" style={{ height: '100px', marginBottom: '24px' }} />
        <div className="grid grid-cols-2">
          <div className="skeleton skeleton-block" style={{ height: '300px' }} />
          <div className="skeleton skeleton-block" style={{ height: '300px' }} />
        </div>
      </main>
    );
  }

  if (error && !ride) {
    return (
      <main className="container">
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button className="btn btn-ghost" style={{ padding: '4px 12px', minHeight: 0 }} onClick={load}>Retry</button>
        </div>
      </main>
    );
  }

  if (!ride) return null;

  return (
    <main className="container">
      <div className="dashboard-header">
        <div>
          <p className="text-muted text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Driver Ride</p>
          <h1 style={{ fontSize: '2rem', marginTop: '4px' }}>{ride.pickupZone.name} → {ride.destinationZone.name}</h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>
            Passenger: {ride.passenger.name} · Fare: {moneyPoysha(ride.farePoysha)}
          </p>
        </div>
        <RideStatusBadge status={ride.status} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-cols-2">
        <section className="card card-glass">
          <h2 style={{ marginBottom: '8px' }}>Ride Controls</h2>
          <p className="text-muted text-small" style={{ marginBottom: '24px' }}>Only valid next states are offered.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ride.status === "MATCHED" && <button className="btn btn-primary" onClick={() => transition("DRIVER_ARRIVED")}>Mark Arrived</button>}
            {ride.status === "DRIVER_ARRIVED" && <button className="btn btn-primary" onClick={() => transition("STARTED")}>Start Trip</button>}
            {ride.status === "STARTED" && <button className="btn btn-primary" onClick={() => transition("COMPLETED")} style={{ background: 'var(--status-completed-fg)', color: '#000' }}>Complete Trip</button>}
            
            {["MATCHED", "DRIVER_ARRIVED"].includes(ride.status) && (
              <button 
                className="btn btn-secondary" 
                onClick={() => transition("CANCELLED")}
                style={{ borderColor: 'var(--status-cancelled-fg)', color: 'var(--status-cancelled-fg)' }}
              >
                Cancel Ride
              </button>
            )}

            {["COMPLETED", "CANCELLED"].includes(ride.status) && (
              <div className="alert alert-success" style={{ textAlign: 'center', background: 'transparent' }}>
                Ride is {ride.status.toLowerCase()}.
              </div>
            )}
          </div>
        </section>

        <div>
          <PoolStatusCard ride={ride} />
        </div>
      </div>

      <section className="card" style={{ marginTop: '32px', background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}>
        <h2 style={{ marginBottom: '24px' }}>Audit Trail</h2>
        <div className="timeline">
          {ride.history.map((h, i) => (
            <div className={`timeline-item ${i === ride.history.length - 1 ? 'active' : 'completed'}`} key={h.id}>
              <strong style={{ color: i === ride.history.length - 1 ? 'var(--text-primary)' : 'var(--accent)' }}>
                {String(h.toStatus).replaceAll("_", " ")}
              </strong>
              <span className="text-muted text-small" style={{ display: 'block' }}>
                {h.note || "Status updated"} · {new Date(h.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ marginTop: '32px' }}>
        <Link className="btn btn-ghost" href="/driver">← Driver Dashboard</Link>
      </div>
    </main>
  );
}
