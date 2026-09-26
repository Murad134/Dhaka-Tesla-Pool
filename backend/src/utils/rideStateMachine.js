const { RideStatus } = require("@prisma/client");

const ALLOWED_TRANSITIONS = {
  [RideStatus.REQUESTED]: [RideStatus.MATCHED, RideStatus.CANCELLED],
  [RideStatus.MATCHED]: [RideStatus.DRIVER_ARRIVED, RideStatus.CANCELLED],
  [RideStatus.DRIVER_ARRIVED]: [RideStatus.STARTED, RideStatus.CANCELLED],
  [RideStatus.STARTED]: [RideStatus.COMPLETED],
  [RideStatus.COMPLETED]: [],
  [RideStatus.CANCELLED]: []
};

function isValidTransition(from, to) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

function assertValidTransition(from, to) {
  if (!isValidTransition(from, to)) {
    const error = new Error(`Invalid ride transition: ${from} -> ${to}`);
    error.statusCode = 409;
    throw error;
  }
}

function statusTimestampField(status) {
  return {
    [RideStatus.MATCHED]: "matchedAt",
    [RideStatus.DRIVER_ARRIVED]: "driverArrivedAt",
    [RideStatus.STARTED]: "startedAt",
    [RideStatus.COMPLETED]: "completedAt",
    [RideStatus.CANCELLED]: "cancelledAt"
  }[status];
}

module.exports = { ALLOWED_TRANSITIONS, isValidTransition, assertValidTransition, statusTimestampField };
