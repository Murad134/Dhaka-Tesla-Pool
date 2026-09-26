const { z } = require("zod");
const prisma = require("../config/db");
const { RideStatus } = require("@prisma/client");

const onlineSchema = z.object({ isOnline: z.boolean() });

async function getMe(req, res) {
  res.json({
    driver: req.user.driver,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    }
  });
}

async function setOnline(req, res, next) {
  try {
    const { isOnline } = onlineSchema.parse(req.body);
    if (!req.user.driver) return res.status(400).json({ error: "Driver profile not found" });

    const driver = await prisma.driver.update({
      where: { id: req.user.driver.id },
      data: { isOnline }
    });

    res.json(driver);
  } catch (error) {
    next(error);
  }
}

async function relevantRequests(req, res, next) {
  try {
    if (!req.user.driver) return res.status(400).json({ error: "Driver profile not found" });

    const rides = await prisma.ride.findMany({
      where: {
        status: RideStatus.REQUESTED
      },
      include: {
        passenger: { select: { id: true, name: true } },
        pickupZone: true,
        destinationZone: true
      },
      orderBy: { requestedAt: "asc" }
    });

    res.json(rides);
  } catch (error) {
    next(error);
  }
}

async function history(req, res, next) {
  try {
    const rides = await prisma.ride.findMany({
      where: { driverId: req.user.driver.id },
      include: {
        passenger: { select: { id: true, name: true, email: true } },
        pickupZone: true,
        destinationZone: true,
        history: { orderBy: { createdAt: "asc" } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(rides);
  } catch (error) {
    next(error);
  }
}

module.exports = { getMe, setOnline, relevantRequests, history };
