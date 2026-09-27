"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const dashboard = user ? (user.role === "DRIVER" ? "/driver" : "/passenger") : "/login";
  
  return (
    <main className="container">
      <section style={{ padding: 'var(--space-3xl) 0' }}>
        <div className="grid grid-cols-2" style={{ alignItems: 'center', gap: 'var(--space-2xl)' }}>
          <div>
            <p className="badge badge-requested" style={{marginBottom: "1rem"}}>Dhaka · MVP ride pooling</p>
            <h1 style={{ marginBottom: 'var(--space-lg)' }}>
              Share a seat.<br/>
              <span className="text-gradient">Split the fare.</span>
            </h1>
            <p className="text-muted" style={{ fontSize: '1.125rem', marginBottom: 'var(--space-xl)' }}>
              Dhaka Tesla Pool connects passengers with a small shared Tesla, matches compatible trips, protects seat capacity, and keeps a clear ride history.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link className="btn btn-primary" href={dashboard}>
                {user ? "Open dashboard" : "Get started"}
              </Link>
              {!user && (
                <Link className="btn btn-secondary" href="/register">
                  Create account
                </Link>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Image
              src="/images/ride_sharing_car.jpg" 
              alt="Ride Sharing Tesla" 
              width={600}
              height={400}
              style={{ 
                width: '100%', 
                maxWidth: '600px', 
                height: 'auto', 
                borderRadius: 'var(--radius-lg)', 
                boxShadow: 'var(--shadow-glow)',
                border: '1px solid var(--border-subtle)'
              }} 
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3" style={{ marginTop: '4rem' }}>
        <div className="card card-glass">
          <h3>Simple geography</h3>
          <p className="text-muted" style={{marginTop: '8px'}}>Predefined Dhaka zones and documented corridor rules instead of a costly routing API.</p>
        </div>
        <div className="card card-glass">
          <h3>Safe capacity</h3>
          <p className="text-muted" style={{marginTop: '8px'}}>Pool membership is checked transactionally so Bullet cannot be overbooked.</p>
        </div>
        <div className="card card-glass">
          <h3>Visible lifecycle</h3>
          <p className="text-muted" style={{marginTop: '8px'}}>REQUESTED → MATCHED → ARRIVED → STARTED → COMPLETED, with clear history.</p>
        </div>
      </section>
    </main>
  );
}
