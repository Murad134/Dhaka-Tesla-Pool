const { z } = require("zod");
const { RideStatus, Role } = require("@prisma/client");
const prisma = require("../config/db");
const { calculateFare } = require("../utils/fareCalculator");
const { recalculatePooledFare } = require("../utils/poolMatcher");
const { assertValidTransition, statusTimestampField } = require("../utils/rideStateMachine");

const createSchema = z.object({
  pickupZone: z.string().min(1),
  destinationZone: z.string().min(1),
  seats: z.number().int().min(1).max(3).default(1),
  distanceKm: z.number().positive().max(100),
  paymentMethod: z.enum(["CASH", "TESLAPAY"]).default("CASH")
});

const transitionSchema = z.object({
  status: z.enum(["DRIVER_ARRIVED", "STARTED", "COMPLETED", "CANCELLED"])
});

async function createRide(req, res, next) {
  try {
    const input = createSchema.parse(req.body);
    const [pickupZone, destinationZone] = await Promise.all([
      prisma.zone.findUnique({ where: { name: input.pickupZone } }),
      prisma.zone.findUnique({ where: { name: input.destinationZone } })
    ]);

    if (!pickupZone || !destinationZone) {
      return res.status(400).json({ error: "Unknown pickup or destination zone" });
    }
    if (pickupZone.id === destinationZone.id) {
      return res.status(400).json({ error: "Pickup and destination must differ" });
    }

    const fare = calculateFare({ distanceKm: input.distanceKm, isPooled: false });

    const ride = await prisma.$transaction(async (tx) => {
      const activeRide = await tx.ride.findFirst({
        where: {
          passengerId: req.user.id,
          status: { in: [RideStatus.REQUESTED, RideStatus.MATCHED, RideStatus.DRIVER_ARRIVED, RideStatus.STARTED] }
        }
      });
      if (activeRide) {
        const e = new Error("You already have an active ride");
        e.statusCode = 409;
        throw e;
      }

      return tx.ride.create({
        data: {
          passengerId: req.user.id,
          pickupZoneId: pickupZone.id,
          destinationZoneId: destinationZone.id,
          seatsRequested: input.seats,
          distanceKm: input.distanceKm,
          farePoysha: fare.farePoysha,
          paymentMethod: input.paymentMethod,
          history: {
            create: {
              actorId: req.user.id,
              toStatus: RideStatus.REQUESTED,
              note: "Ride requested"
            }
          }
        },
        include: rideInclude()
      });
    });

    res.status(201).json(ride);
  } catch (error) {
    next(error);
  }
}

async function listHistory(req, res, next) {
  try {
    const rides = await prisma.ride.findMany({
      where: { passengerId: req.user.id },
      include: rideInclude(),
      orderBy: { createdAt: "desc" }
    });
    res.json(rides);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id },
      include: rideInclude()
    });
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    const isPassenger = ride.passengerId === req.user.id;
    const isDriver = ride.driver?.userId === req.user.id;
    if (!isPassenger && !isDriver) return res.status(403).json({ error: "Forbidden" });

    res.json(ride);
  } catch (error) {
    next(error);
  }
}

async function matchRide(req, res, next) {
  try {
    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id },
      include: { pickupZone: true, destinationZone: true }
    });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (ride.status !== RideStatus.REQUESTED) {
      return res.status(409).json({ error: "Only requested rides can be matched" });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.id },
      include: { tesla: true }
    });

    if (!driver?.isOnline || !driver.tesla) {
      return res.status(409).json({ error: "Driver must be online and have a Tesla" });
    }

    const existingPool = await prisma.pool.findFirst({
      where: {
        teslaId: driver.tesla.id,
        status: { in: [RideStatus.MATCHED, RideStatus.DRIVER_ARRIVED, RideStatus.STARTED] }
      },
      include: {
        tesla: true,
        rides: {
          where: { status: { not: RideStatus.CANCELLED } },
          include: { pickupZone: true, destinationZone: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    const compatibleExistingPool = existingPool &&
      existingPool.rides.some((member) => require("../utils/zones").isCompatibleRoute(
        ride.pickupZone.name,
        ride.destinationZone.name,
        member.pickupZone.name,
        member.destinationZone.name
      )) &&
      existingPool.rides.reduce((sum, member) => sum + member.seatsRequested, 0) + ride.seatsRequested <= driver.tesla.capacity
      ? existingPool
      : null;

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.ride.findUnique({ where: { id: ride.id } });
      if (!current || current.status !== RideStatus.REQUESTED) {
        const e = new Error("Ride was already matched or cancelled");
        e.statusCode = 409;
        throw e;
      }

      let poolId = compatibleExistingPool?.id ?? null;
      let teslaId = driver.tesla.id;
      let driverId = driver.id;

      if (!compatibleExistingPool) {
        const pool = await tx.pool.create({
          data: {
            teslaId: driver.tesla.id,
            status: RideStatus.MATCHED
          }
        });
        poolId = pool.id;
      }

      const pool = await tx.pool.findUnique({
        where: { id: poolId },
        include: { tesla: true, rides: true }
      });

      const occupied = pool.rides
        .filter((r) => r.status !== RideStatus.CANCELLED)
        .reduce((sum, r) => sum + r.seatsRequested, 0);

      if (occupied + current.seatsRequested > pool.tesla.capacity) {
        const e = new Error("Tesla capacity exceeded");
        e.statusCode = 409;
        throw e;
      }

      const fare = compatibleExistingPool
        ? recalculatePooledFare(Number(current.distanceKm))
        : calculateFare({ distanceKm: Number(current.distanceKm), isPooled: false });

      return tx.ride.update({
        where: { id: current.id },
        data: {
          driverId,
          teslaId,
          poolId,
          status: RideStatus.MATCHED,
          matchedAt: new Date(),
          farePoysha: fare.farePoysha,
          poolDiscountPoysha: fare.poolDiscountPoysha,
          membership: {
            create: { poolId, seats: current.seatsRequested }
          },
          history: {
            create: {
              actorId: req.user.id,
              fromStatus: RideStatus.REQUESTED,
              toStatus: RideStatus.MATCHED,
              note: compatibleExistingPool ? "Matched into an existing pool" : "Matched into a new pool"
            }
          }
        },
        include: rideInclude()
      });
    }, { isolationLevel: "Serializable" });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function transition(req, res, next) {
  try {
    const { status: toStatus } = transitionSchema.parse(req.body);
    const ride = req.ride;

    if (toStatus === RideStatus.CANCELLED) {
      if (!req.isRidePassenger && !req.isRideDriver) return res.status(403).json({ error: "Forbidden" });
      if (![RideStatus.REQUESTED, RideStatus.MATCHED, RideStatus.DRIVER_ARRIVED].includes(ride.status)) {
        return res.status(409).json({ error: "Ride cannot be cancelled at this stage" });
      }
    } else if (!req.isRideDriver) {
      return res.status(403).json({ error: "Only the assigned driver can advance the ride" });
    }

    assertValidTransition(ride.status, toStatus);

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.ride.findUnique({ where: { id: ride.id } });
      if (!current) {
        const e = new Error("Ride not found");
        e.statusCode = 404;
        throw e;
      }
      if (current.status !== ride.status) {
        const e = new Error("Ride changed; retry");
        e.statusCode = 409;
        throw e;
      }

      const timestampField = statusTimestampField(toStatus);
      return tx.ride.update({
        where: { id: ride.id },
        data: {
          status: toStatus,
          ...(timestampField ? { [timestampField]: new Date() } : {}),
          history: {
            create: {
              actorId: req.user.id,
              fromStatus: current.status,
              toStatus,
              note: `Status changed to ${toStatus}`
            }
          }
        },
        include: rideInclude()
      });
    }, { isolationLevel: "Serializable" });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

function rideInclude() {
  return {
    passenger: { select: { id: true, name: true, email: true } },
    driver: { include: { user: { select: { id: true, name: true, email: true } } } },
    tesla: true,
    pool: { include: { members: { include: { ride: { select: { id: true, passengerId: true, seatsRequested: true, status: true } } } } } },
    pickupZone: true,
    destinationZone: true,
    history: { orderBy: { createdAt: "asc" } }
  };
}

module.exports = { createRide, listHistory, getById, matchRide, transition };
