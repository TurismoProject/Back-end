/*
  Warnings:

  - The values [Admin,User,Supplier] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `imagesUrl` on the `Product` table. All the data in the column will be lost.
  - Added the required column `cancellationPolicy` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endingPoint` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itinerary` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `meetingPoint` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('TRAVEL_AGENCY', 'TOUR_OPERATOR', 'CORPORATE_CLIENT', 'EVENT_ORGANIZER');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('CULTURAL', 'ADVENTURE', 'ECOTOURISM', 'GASTRONOMY', 'RELIGIOUS', 'BEACH', 'URBAN', 'RURAL', 'HISTORICAL', 'SHOPPING');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('GUIDED_TOUR', 'SELF_GUIDED', 'GROUP_TOUR', 'PRIVATE_TOUR', 'MULTI_DAY_TOUR', 'DAY_TRIP', 'CUSTOM_PACKAGE');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'USER', 'SUPPLIER');
ALTER TABLE "Admin" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Supplier" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Admin" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "Supplier" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "Admin" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
ALTER TABLE "Supplier" ALTER COLUMN "role" SET DEFAULT 'SUPPLIER';
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "imagesUrl",
ADD COLUMN     "b2bAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "b2bDiscount" DECIMAL(65,30),
ADD COLUMN     "b2bMinQuantity" INTEGER,
ADD COLUMN     "bulkAvailability" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cancellationPolicy" TEXT NOT NULL,
ADD COLUMN     "categories" "Category"[],
ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "endingPoint" TEXT NOT NULL,
ADD COLUMN     "excludedItems" TEXT[],
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "includedItems" TEXT[],
ADD COLUMN     "itinerary" JSONB NOT NULL,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "maxGroupSize" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "meetingPoint" TEXT NOT NULL,
ADD COLUMN     "minAge" INTEGER,
ADD COLUMN     "rating" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "businessHours" TEXT,
ADD COLUMN     "categories" "Category"[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "licenses" TEXT[],
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "socialMedia" JSONB,
ADD COLUMN     "website" TEXT,
ALTER COLUMN "role" SET DEFAULT 'SUPPLIER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "preferences" JSONB,
ALTER COLUMN "role" SET DEFAULT 'USER';

-- CreateTable
CREATE TABLE "BusinessClient" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL,
    "creditLimit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "contractStart" TIMESTAMP(3) NOT NULL,
    "contractEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingHours" (
    "id" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WorkingHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "availableSpots" INTEGER NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "specialRequests" TEXT,
    "participants" JSONB,
    "bulkBookingId" TEXT,
    "pickupLocation" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkBooking" (
    "id" TEXT NOT NULL,
    "businessClientId" TEXT NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "specialRate" DECIMAL(65,30),
    "paymentTerms" INTEGER NOT NULL,
    "contractNumber" TEXT,

    CONSTRAINT "BulkBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierReview" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "supplierId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SupplierReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessJWTs" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessClientId" TEXT NOT NULL,

    CONSTRAINT "BusinessJWTs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessClient_email_key" ON "BusinessClient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessClient_cnpj_key" ON "BusinessClient"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHours_productId_dayOfWeek_key" ON "WorkingHours"("productId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessJWTs_token_key" ON "BusinessJWTs"("token");

-- AddForeignKey
ALTER TABLE "WorkingHours" ADD CONSTRAINT "WorkingHours_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bulkBookingId_fkey" FOREIGN KEY ("bulkBookingId") REFERENCES "BulkBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkBooking" ADD CONSTRAINT "BulkBooking_businessClientId_fkey" FOREIGN KEY ("businessClientId") REFERENCES "BusinessClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReview" ADD CONSTRAINT "SupplierReview_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReview" ADD CONSTRAINT "SupplierReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessJWTs" ADD CONSTRAINT "BusinessJWTs_businessClientId_fkey" FOREIGN KEY ("businessClientId") REFERENCES "BusinessClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
