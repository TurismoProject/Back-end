-- CreateEnum
CREATE TYPE "DepartureStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('NOT_RECORDED', 'BOARDED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "TourDeparture" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'America/Maceio',
    "capacity" INTEGER NOT NULL,
    "pricePerPerson" DECIMAL(12,2) NOT NULL,
    "status" "DepartureStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourDeparture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "departureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "responsibleName" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "pricePerPerson" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(14,2) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationParticipant" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "attendance" "AttendanceStatus" NOT NULL DEFAULT 'NOT_RECORDED',
    "recordedAt" TIMESTAMP(3),
    "recordedBy" TEXT,

    CONSTRAINT "ReservationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationEvent" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" "Role" NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TourDeparture_startsAt_status_idx" ON "TourDeparture"("startsAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TourDeparture_productId_startsAt_key" ON "TourDeparture"("productId", "startsAt");

-- CreateIndex
CREATE INDEX "Reservation_departureId_status_idx" ON "Reservation"("departureId", "status");

-- CreateIndex
CREATE INDEX "Reservation_userId_createdAt_idx" ON "Reservation"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_userId_requestKey_key" ON "Reservation"("userId", "requestKey");

-- CreateIndex
CREATE INDEX "ReservationParticipant_reservationId_attendance_idx" ON "ReservationParticipant"("reservationId", "attendance");

-- CreateIndex
CREATE INDEX "ReservationEvent_reservationId_createdAt_idx" ON "ReservationEvent"("reservationId", "createdAt");

-- AddForeignKey
ALTER TABLE "TourDeparture" ADD CONSTRAINT "TourDeparture_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "TourDeparture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationParticipant" ADD CONSTRAINT "ReservationParticipant_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationEvent" ADD CONSTRAINT "ReservationEvent_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve basic invariants even for writes outside the HTTP API.
ALTER TABLE "TourDeparture" ADD CONSTRAINT "TourDeparture_capacity_check" CHECK ("capacity" BETWEEN 1 AND 10000);
ALTER TABLE "TourDeparture" ADD CONSTRAINT "TourDeparture_price_check" CHECK ("pricePerPerson" > 0);
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_price_check" CHECK ("pricePerPerson" > 0 AND "totalPrice" > 0);
ALTER TABLE "ReservationParticipant" ADD CONSTRAINT "ReservationParticipant_name_check" CHECK (length(trim("name")) BETWEEN 2 AND 150);
