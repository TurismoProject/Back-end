-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('HERO', 'PROMOTION', 'FEATURED_DESTINATION', 'SEASONAL', 'EVENT', 'B2B_SPECIAL');

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "b2bAvailable" SET DEFAULT true;

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "type" "BannerType" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "targetAudience" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "relatedProductId" TEXT,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
