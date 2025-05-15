-- AlterTable
ALTER TABLE "SupplierJWTs" ADD COLUMN     "type" "JwtTokenType" NOT NULL DEFAULT 'access';

-- AlterTable
ALTER TABLE "UserJWTs" ADD COLUMN     "type" "JwtTokenType" NOT NULL DEFAULT 'access';
