/*
  Warnings:

  - A unique constraint covering the columns `[adminId]` on the table `AdminJWTs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AdminJWTs_adminId_key" ON "AdminJWTs"("adminId");
