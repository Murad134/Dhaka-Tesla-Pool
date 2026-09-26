"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import RideHistoryList from "../../../components/RideHistoryList";
import Link from "next/link";

export default function History() {
  const [rides, setRides] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRides();
  }, []);

  async function fetchRides() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/rides/history");
      setRides(data);
    } catch (e) {
      setError("Failed to load rides. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '2rem' }}>Ride History</h1>
          <p className="text-muted">Your past trips and current requests.</p>
        </div>
        <Link className="btn btn-primary" href="/passenger">New Ride</Link>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button className="btn btn-ghost" style={{ padding: '4px 12px', minHeight: 0 }} onClick={fetchRides}>Retry</button>
        </div>
      )}

      <RideHistoryList rides={rides} loading={loading} />
    </main>
  );
}
