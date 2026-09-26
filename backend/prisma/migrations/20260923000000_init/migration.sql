CREATE TYPE "Role" AS ENUM ('PASSENGER', 'DRIVER');
CREATE TYPE "RideStatus" AS ENUM ('REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TESLAPAY');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Driver" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "isOnline" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

CREATE TABLE "Tesla" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL,
  "driverId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tesla_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Tesla_driverId_key" ON "Tesla"("driverId");

CREATE TABLE "Zone" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "latitude" DECIMAL(9,6) NOT NULL,
  "longitude" DECIMAL(9,6) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");

CREATE TABLE "Pool" (
  "id" TEXT NOT NULL,
  "teslaId" TEXT NOT NULL,
  "status" "RideStatus" NOT NULL DEFAULT 'MATCHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Pool_teslaId_status_idx" ON "Pool"("teslaId","status");

CREATE TABLE "Ride" (
  "id" TEXT NOT NULL,
  "passengerId" TEXT NOT NULL,
  "driverId" TEXT,
  "teslaId" TEXT,
  "poolId" TEXT,
  "pickupZoneId" TEXT NOT NULL,
  "destinationZoneId" TEXT NOT NULL,
  "seatsRequested" INTEGER NOT NULL DEFAULT 1,
  "distanceKm" DECIMAL(6,2) NOT NULL,
  "farePoysha" INTEGER NOT NULL,
  "poolDiscountPoysha" INTEGER NOT NULL DEFAULT 0,
  "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "status" "RideStatus" NOT NULL DEFAULT 'REQUESTED',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "matchedAt" TIMESTAMP(3),
  "driverArrivedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Ride_passengerId_createdAt_idx" ON "Ride"("passengerId","createdAt");
CREATE INDEX "Ride_driverId_status_createdAt_idx" ON "Ride"("driverId","status","createdAt");
CREATE INDEX "Ride_status_pickupZoneId_destinationZoneId_idx" ON "Ride"("status","pickupZoneId","destinationZoneId");
CREATE INDEX "Ride_poolId_status_idx" ON "Ride"("poolId","status");

CREATE TABLE "PoolMembership" (
  "id" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "rideId" TEXT NOT NULL,
  "seats" INTEGER NOT NULL DEFAULT 1,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PoolMembership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PoolMembership_rideId_key" ON "PoolMembership"("rideId");
CREATE UNIQUE INDEX "PoolMembership_poolId_rideId_key" ON "PoolMembership"("poolId","rideId");
CREATE INDEX "PoolMembership_poolId_idx" ON "PoolMembership"("poolId");

CREATE TABLE "RideHistory" (
  "id" TEXT NOT NULL,
  "rideId" TEXT NOT NULL,
  "actorId" TEXT,
  "fromStatus" "RideStatus",
  "toStatus" "RideStatus" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RideHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RideHistory_rideId_createdAt_idx" ON "RideHistory"("rideId","createdAt");

ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tesla" ADD CONSTRAINT "Tesla_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_teslaId_fkey" FOREIGN KEY ("teslaId") REFERENCES "Tesla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_teslaId_fkey" FOREIGN KEY ("teslaId") REFERENCES "Tesla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_pickupZoneId_fkey" FOREIGN KEY ("pickupZoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_destinationZoneId_fkey" FOREIGN KEY ("destinationZoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PoolMembership" ADD CONSTRAINT "PoolMembership_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoolMembership" ADD CONSTRAINT "PoolMembership_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RideHistory" ADD CONSTRAINT "RideHistory_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RideHistory" ADD CONSTRAINT "RideHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
