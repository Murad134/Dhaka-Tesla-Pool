const BASE_FARE_POYSHA = 5000;       // BDT 50.00
const PER_KM_POYSHA = 3000;         // BDT 30.00/km
const POOL_DISCOUNT_RATE = 0.20;

function calculateFare({ distanceKm, isPooled = false }) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    throw new Error("distanceKm must be greater than zero");
  }

  const gross = Math.round(BASE_FARE_POYSHA + distanceKm * PER_KM_POYSHA);
  const discount = isPooled ? Math.round(gross * POOL_DISCOUNT_RATE) : 0;
  return {
    baseFarePoysha: BASE_FARE_POYSHA,
    distanceChargePoysha: Math.round(distanceKm * PER_KM_POYSHA),
    poolDiscountPoysha: discount,
    farePoysha: gross - discount
  };
}

module.exports = {
  BASE_FARE_POYSHA,
  PER_KM_POYSHA,
  POOL_DISCOUNT_RATE,
  calculateFare
};
