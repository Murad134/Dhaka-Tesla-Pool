"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import FareDisplay from "../../components/FareDisplay";
import RideStatusBadge from "../../components/RideStatusBadge";

const zones = ["Banani", "Gulshan 1", "Mohakhali", "Dhanmondi", "Mirpur", "Uttara", "Farmgate", "Bashundhara"];
const demoDistances = {
  "Banani-Mohakhali": 3.5, "Banani-Gulshan 1": 2.4, "Banani-Dhanmondi": 7.1,
  "Banani-Mirpur": 9.2, "Banani-Uttara": 12, "Banani-Farmgate": 5.4,
  "Banani-Bashundhara": 6.8
};

export default function PassengerPage() {
  const [form, setForm] = useState({ pickupZone: "Banani", destinationZone: "Mohakhali", seats: 1, distanceKm: 3.5, paymentMethod: "CASH" });
  const [ride, setRide] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const key = `${form.pickupZone}-${form.destinationZone}`;
    if (demoDistances[key]) setForm((f) => ({ ...f, distanceKm: demoDistances[key] }));
  }, [form.pickupZone, form.destinationZone]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await apiFetch("/rides", {
        method: "POST",
        body: JSON.stringify({ ...form, seats: Number(form.seats), distanceKm: Number(form.distanceKm) })
      });
      setRide(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    try {
      const r = await apiFetch(`/rides/${ride.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED" })
      });
      setRide(r);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="container">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '2rem' }}>Request a Tesla</h1>
          <p className="text-muted">Choose your predefined Dhaka zones. Distance is an MVP input.</p>
        </div>
        <Link className="btn btn-secondary" href="/passenger/history">Ride History</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-cols-2">
        <div className="card card-glass">
          {busy && !ride ? (
            <div>
              <div className="skeleton skeleton-block" style={{ height: '60px', marginBottom: '16px' }} />
              <div className="skeleton skeleton-block" style={{ height: '60px', marginBottom: '16px' }} />
              <div className="skeleton skeleton-block" style={{ height: '120px' }} />
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="grid grid-cols-2" style={{ gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pickup</label>
                  <select 
                    className="input-field" 
                    value={form.pickupZone} 
                    onChange={e => setForm({ ...form, pickupZone: e.target.value })}
                  >
                    {zones.map(z => <option key={z}>{z}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Destination</label>
                  <select 
                    className="input-field" 
                    value={form.destinationZone} 
                    onChange={e => setForm({ ...form, destinationZone: e.target.value })}
                  >
                    {zones.map(z => <option key={z}>{z}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2" style={{ gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Seats Required</label>
                  <select 
                    className="input-field" 
                    value={form.seats} 
                    onChange={e => setForm({ ...form, seats: Number(e.target.value) })}
                  >
                    <option value="1">1 Seat</option>
                    <option value="2">2 Seats</option>
                    <option value="3">3 Seats</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Est. Distance (km)</label>
                  <input 
                    className="input-field"
                    type="number" 
                    min="0.1" 
                    max="100" 
                    step="0.1" 
                    value={form.distanceKm} 
                    onChange={e => setForm({ ...form, distanceKm: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select 
                  className="input-field" 
                  value={form.paymentMethod} 
                  onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                >
                  <option value="CASH">Cash</option>
                  <option value="TESLAPAY">TeslaPay</option>
                </select>
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
                {busy ? <span className="spinner" /> : "Request Ride"}
              </button>
            </form>
          )}
        </div>

        <div>
          {ride ? (
            <div className="card card-glass">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <p className="text-muted text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ride Created</p>
                  <h2 style={{ fontSize: '1.5rem', marginTop: '4px' }}>{ride.pickupZone.name} → {ride.destinationZone.name}</h2>
                </div>
                <RideStatusBadge status={ride.status} />
              </div>
              
              <FareDisplay ride={ride} />
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Link className="btn btn-primary" style={{ flex: 1 }} href={`/passenger/ride/${ride.id}`}>
                  Track Ride
                </Link>
                <button className="btn btn-secondary" onClick={cancel} style={{ borderColor: 'var(--status-cancelled-fg)', color: 'var(--status-cancelled-fg)' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ background: 'transparent', border: '1px dashed var(--border-strong)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
              <h3 style={{ marginBottom: '8px' }}>Smart Pooling</h3>
              <p className="text-muted" style={{ fontSize: '0.9375rem' }}>Compatible corridor rules can match Nusrat and Rafiq into the same Tesla safely, dividing the fare.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
