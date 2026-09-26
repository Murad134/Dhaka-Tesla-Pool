import Link from "next/link";
import RideStatusBadge from "./RideStatusBadge";

export default function PoolStatusCard({ ride }) {
  if (!ride?.pool) return null;
  const members = ride.pool.members || [];
  
  // Calculate total occupied seats
  const occupiedSeats = members.reduce((sum, m) => sum + (m.ride.status !== "CANCELLED" ? m.ride.seatsRequested : 0), 0);
  const capacity = ride.tesla?.capacity || 3;
  const fillPercentage = Math.min(100, (occupiedSeats / capacity) * 100);

  return (
    <section className="card card-glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <p className="text-muted text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Shared Pool</p>
          <h3 style={{ fontSize: '1.25rem', marginTop: '4px' }}>{ride.tesla?.name || "Tesla"}</h3>
        </div>
        <span className="badge badge-completed">{members.length} Passenger{members.length === 1 ? "" : "s"}</span>
      </div>

      <div className="capacity-container">
        <div className="capacity-header">
          <span>Seat Capacity</span>
          <span>{occupiedSeats} / {capacity}</span>
        </div>
        <div className="capacity-bar">
          <div className="capacity-fill" style={{ width: `${fillPercentage}%` }} />
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 className="text-muted text-small">Pool Members</h4>
        {members.map((m) => {
          const isYou = m.ride.passengerId === ride.passengerId;
          const isCancelled = m.ride.status === "CANCELLED";
          return (
            <div 
              key={m.ride.id} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px',
                background: isYou ? 'var(--accent-dim)' : 'var(--bg-base)',
                borderRadius: 'var(--radius-md)',
                border: isYou ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                opacity: isCancelled ? 0.5 : 1
              }}
            >
              <div>
                <strong style={{ color: isYou ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {isYou ? "You" : "Other Passenger"}
                </strong>
                <span className="text-muted text-small" style={{ display: 'block' }}>
                  {m.ride.seatsRequested} Seat{m.ride.seatsRequested > 1 ? "s" : ""}
                </span>
              </div>
              <RideStatusBadge status={m.ride.status} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
