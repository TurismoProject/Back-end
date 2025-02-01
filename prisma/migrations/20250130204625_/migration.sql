/*
  Warnings:

  - You are about to drop the column `adminId` on the `Authenticate` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `Authenticate` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Authenticate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accountId]` on the table `Authenticate` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Authenticate" DROP CONSTRAINT "Authenticate_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Authenticate" DROP CONSTRAINT "Authenticate_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "Authenticate" DROP CONSTRAINT "Authenticate_userId_fkey";

-- DropIndex
DROP INDEX "Authenticate_adminId_idx";

-- DropIndex
DROP INDEX "Authenticate_adminId_key";

-- DropIndex
DROP INDEX "Authenticate_supplierId_idx";

-- DropIndex
DROP INDEX "Authenticate_supplierId_key";

-- DropIndex
DROP INDEX "Authenticate_userId_idx";

-- DropIndex
DROP INDEX "Authenticate_userId_key";

-- AlterTable
ALTER TABLE "Authenticate" DROP COLUMN "adminId",
DROP COLUMN "supplierId",
DROP COLUMN "userId",
ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "type" "Role" NOT NULL DEFAULT 'User';

-- CreateIndex
CREATE UNIQUE INDEX "Authenticate_accountId_key" ON "Authenticate"("accountId");
