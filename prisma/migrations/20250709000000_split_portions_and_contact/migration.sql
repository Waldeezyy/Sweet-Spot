-- CreateEnum
CREATE TYPE "PreferredContactMethod" AS ENUM ('EMAIL', 'PHONE', 'EITHER');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "maxFlavorOptions" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "piecesPerOrderUnit" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "portions" JSONB;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preferredContactMethod" "PreferredContactMethod";

-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "preferredContactMethod" "PreferredContactMethod";
