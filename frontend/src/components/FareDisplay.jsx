import { moneyPoysha } from "../lib/api";

export default function FareDisplay({ ride }) {
  if (!ride) return null;

  const baseFare = ride.farePoysha + (ride.poolDiscountPoysha || 0);
  
  return (
    <div className="receipt-card">
      <div className="receipt-row">
        <span>Base Fare</span>
        <span>{moneyPoysha(baseFare)}</span>
      </div>
      {ride.poolDiscountPoysha > 0 && (
        <div className="receipt-row" style={{ color: 'var(--accent)' }}>
          <span>Pool Discount</span>
          <span>-{moneyPoysha(ride.poolDiscountPoysha)}</span>
        </div>
      )}
      <div className="receipt-total">
        <span>Total Fare</span>
        <span style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>{moneyPoysha(ride.farePoysha)}</span>
      </div>
      <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        PAYMENT: {ride.paymentMethod}
      </div>
    </div>
  );
}
