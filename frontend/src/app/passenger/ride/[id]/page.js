"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, moneyPoysha } from "../../../../lib/api";
import RideStatusBadge from "../../../../components/RideStatusBadge";
import FareDisplay from "../../../../components/FareDisplay";
import PoolStatusCard from "../../../../components/PoolStatusCard";
import { showError, showSuccess } from "../../../../lib/feedback";

const STATUS_ORDER = ["REQUESTED", "MATCHED", "DRIVER_ARRIVED", "STARTED", "COMPLETED"];

export default function RidePage() {
  const { id } = useParams();
  const [ride, setRide] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRide(await apiFetch(`/rides/${id}`));
    } catch (e) {
      setError(e.message || "Couldn't load ride.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function cancel() {
    try {
      setRide(await apiFetch(`/rides/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED" })
      }));
      await showSuccess("Ride cancelled", "The seat has been released.");
    } catch (e) {
      setError(e.message);
      showError(e);
    }
  }

  if (loading && !ride) {
    return (
      <main className="container">
        <div className="skeleton skeleton-block" style={{ height: '80px', marginBottom: '24px' }} />
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
          <p className="text-muted text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ride Tracking</p>
          <h1 style={{ fontSize: '2rem', marginTop: '4px' }}>{ride.pickupZone.name} → {ride.destinationZone.name}</h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>
            Driver: {ride.driver?.user?.name || "Waiting for match"} · {ride.tesla?.name || "Tesla pending"}
          </p>
        </div>
        <RideStatusBadge status={ride.status} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-cols-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card card-glass">
            <FareDisplay ride={ride} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '24px' }}>
              <div style={{ background: 'var(--bg-base)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <span className="text-muted text-small">Seats</span>
                <strong style={{ display: 'block', fontSize: '1.25rem' }}>{ride.seatsRequested}</strong>
              </div>
              <div style={{ background: 'var(--bg-base)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <span className="text-muted text-small">Distance</span>
                <strong style={{ display: 'block', fontSize: '1.25rem' }}>{Number(ride.distanceKm)} km</strong>
              </div>
              <div style={{ background: 'var(--bg-base)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <span className="text-muted text-small">Method</span>
                <strong style={{ display: 'block', fontSize: '1rem', marginTop: '4px' }}>{ride.paymentMethod}</strong>
              </div>
            </div>
            
            {["REQUESTED", "MATCHED", "DRIVER_ARRIVED"].includes(ride.status) && (
              <button 
                className="btn btn-secondary" 
                onClick={cancel}
                style={{ width: '100%', marginTop: '24px', borderColor: 'var(--status-cancelled-fg)', color: 'var(--status-cancelled-fg)' }}
              >
                Cancel ride
              </button>
            )}
          </div>

          <div className="card card-glass">
            <h3 style={{ marginBottom: '24px' }}>Lifecycle Timeline</h3>
            <div className="timeline">
              {STATUS_ORDER.map(step => {
                const historyRecord = ride.history.find(h => h.toStatus === step);
                const isCompleted = !!historyRecord;
                const isCurrent = ride.status === step;
                const isCancelled = ride.status === "CANCELLED";

                // If cancelled, show what happened
                if (isCancelled && step === "CANCELLED") {
                  const cancelRecord = ride.history.find(h => h.toStatus === "CANCELLED");
                  return (
                    <div className="timeline-item active" key="cancelled">
                      <strong style={{ color: 'var(--status-cancelled-fg)' }}>CANCELLED</strong>
                      <span className="text-muted text-small" style={{ display: 'block' }}>
                        {cancelRecord?.note || "Ride was cancelled"} · {cancelRecord ? new Date(cancelRecord.createdAt).toLocaleString(undefined, { timeStyle: 'short' }) : ''}
                      </span>
                    </div>
                  );
                }

                if (isCancelled && !historyRecord && step !== "CANCELLED") return null;

                return (
                  <div className={`timeline-item ${isCurrent ? 'active' : ''} ${isCompleted && !isCurrent ? 'completed' : ''}`} key={step}>
                    <strong style={{ color: isCurrent ? 'var(--text-primary)' : (isCompleted ? 'var(--accent)' : 'var(--text-muted)') }}>
                      {step.replaceAll("_", " ")}
                    </strong>
                    <span className="text-muted text-small" style={{ display: 'block' }}>
                      {historyRecord ? 
                        `${historyRecord.note || 'Status updated'} · ${new Date(historyRecord.createdAt).toLocaleString(undefined, { timeStyle: 'short' })}` : 
                        'Pending...'}
                    </span>
                  </div>
                );
              })}
              {ride.status === "CANCELLED" && !STATUS_ORDER.includes("CANCELLED") && (
                <div className="timeline-item active" key="cancelled">
                  <strong style={{ color: 'var(--status-cancelled-fg)' }}>CANCELLED</strong>
                  <span className="text-muted text-small" style={{ display: 'block' }}>
                    Ride was cancelled.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <PoolStatusCard ride={ride} />
        </div>
      </div>
      
      <div style={{ marginTop: '32px' }}>
        <Link className="btn btn-ghost" href="/passenger/history">← Back to history</Link>
      </div>
    </main>
  );
}
