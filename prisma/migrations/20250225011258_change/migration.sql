/*
  Warnings:

  - You are about to drop the column `companyName` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the `Authenticate` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "companyName",
ADD COLUMN     "name" TEXT NOT NULL;

-- DropTable
DROP TABLE "Authenticate";

-- CreateTable
CREATE TABLE "UserJWTs" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserJWTs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierJWTs" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supplierId" TEXT NOT NULL,

    CONSTRAINT "SupplierJWTs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminJWTs" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "AdminJWTs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserJWTs_token_key" ON "UserJWTs"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierJWTs_token_key" ON "SupplierJWTs"("token");

-- CreateIndex
CREATE UNIQUE INDEX "AdminJWTs_token_key" ON "AdminJWTs"("token");

-- AddForeignKey
ALTER TABLE "UserJWTs" ADD CONSTRAINT "UserJWTs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierJWTs" ADD CONSTRAINT "SupplierJWTs_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminJWTs" ADD CONSTRAINT "AdminJWTs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
