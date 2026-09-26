const prisma = require("../config/db");

async function rideOwnershipMiddleware(req, res, next) {
  const ride = await prisma.ride.findUnique({
    where: { id: req.params.id },
    include: { driver: true }
  });

  if (!ride) return res.status(404).json({ error: "Ride not found" });

  const isPassenger = ride.passengerId === req.user.id;
  const isDriver = ride.driver?.userId === req.user.id;

  if (!isPassenger && !isDriver) {
    return res.status(403).json({ error: "You do not own this ride" });
  }

  req.ride = ride;
  req.isRidePassenger = isPassenger;
  req.isRideDriver = isDriver;
  next();
}
module.exports = { rideOwnershipMiddleware };
