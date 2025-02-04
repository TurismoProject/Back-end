/*
  Warnings:

  - Made the column `accountId` on table `Authenticate` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Authenticate" ALTER COLUMN "accountId" SET NOT NULL;
