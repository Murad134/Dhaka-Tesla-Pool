const prisma = require("../config/db");
const { RideStatus } = require("@prisma/client");

async function getPool(req, res, next) {
  try {
    const pool = await prisma.pool.findUnique({
      where: { id: req.params.id },
      include: {
        tesla: { include: { driver: { include: { user: { select: { id: true, name: true } } } } } },
        members: {
          include: {
            ride: {
              include: {
                passenger: { select: { id: true, name: true } },
                pickupZone: true,
                destinationZone: true
              }
            }
          }
        }
      }
    });

    if (!pool) return res.status(404).json({ error: "Pool not found" });

    const isMember = pool.members.some((m) => m.ride.passenger.id === req.user.id);
    const isDriver = pool.tesla.driver.user.id === req.user.id;
    if (!isMember && !isDriver) return res.status(403).json({ error: "Forbidden" });

    const occupiedSeats = pool.members
      .filter((m) => m.ride.status !== RideStatus.CANCELLED)
      .reduce((sum, m) => sum + m.seats, 0);

    res.json({
      ...pool,
      occupiedSeats,
      availableSeats: pool.tesla.capacity - occupiedSeats
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPool };
