-- CreateEnum
CREATE TYPE "JwtTokenType" AS ENUM ('access', 'reset');

-- AlterTable
ALTER TABLE "AdminJWTs" ADD COLUMN     "type" "JwtTokenType" NOT NULL DEFAULT 'access';
