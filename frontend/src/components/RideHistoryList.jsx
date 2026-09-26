import Link from "next/link";
import RideStatusBadge from "./RideStatusBadge";
import { moneyPoysha } from "../lib/api";

export default function RideHistoryList({ rides = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1">
        <div className="skeleton skeleton-block" style={{ height: '80px' }} />
        <div className="skeleton skeleton-block" style={{ height: '80px' }} />
        <div className="skeleton skeleton-block" style={{ height: '80px' }} />
      </div>
    );
  }

  if (!rides.length) {
    return (
      <div className="empty-state">
        <h3>No rides yet — request one.</h3>
        <p style={{ marginTop: '8px' }}>Your completed and current rides will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1" style={{ gap: '12px' }}>
      {rides.map((ride) => (
        <Link 
          href={`/passenger/ride/${ride.id}`} 
          key={ride.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            transition: 'border-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
        >
          <div>
            <strong style={{ fontSize: '1.125rem', display: 'block' }}>
              {ride.pickupZone.name} → {ride.destinationZone.name}
            </strong>
            <span className="text-muted text-small" style={{ display: 'block', marginTop: '4px' }}>
              {new Date(ride.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <RideStatusBadge status={ride.status}/>
            <strong style={{ fontSize: '1.125rem' }}>{moneyPoysha(ride.farePoysha)}</strong>
          </div>
        </Link>
      ))}
    </div>
  );
}
