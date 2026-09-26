const { RideStatus } = require("@prisma/client");
const prisma = require("../config/db");
const { isCompatibleRoute } = require("./zones");
const { calculateFare } = require("./fareCalculator");

async function findPoolCandidate({ pickupZone, destinationZone, seatsRequested }) {
  const pools = await prisma.pool.findMany({
    where: {
      status: { in: [RideStatus.MATCHED, RideStatus.DRIVER_ARRIVED, RideStatus.STARTED] }
    },
    include: {
      tesla: true,
      rides: {
        where: {
          status: { not: RideStatus.CANCELLED }
        },
        include: {
          pickupZone: true,
          destinationZone: true
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  return pools.find((pool) => {
    const occupied = pool.rides.reduce((sum, ride) => sum + ride.seatsRequested, 0);
    if (occupied + seatsRequested > pool.tesla.capacity) return false;

    return pool.rides.some((ride) =>
      isCompatibleRoute(
        pickupZone.name,
        destinationZone.name,
        ride.pickupZone.name,
        ride.destinationZone.name
      )
    );
  });
}

function recalculatePooledFare(distanceKm) {
  return calculateFare({ distanceKm, isPooled: true });
}

module.exports = { findPoolCandidate, recalculatePooledFare };
