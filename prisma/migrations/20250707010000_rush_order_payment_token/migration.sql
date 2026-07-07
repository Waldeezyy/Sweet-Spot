-- AlterTable
ALTER TABLE "Order" ADD COLUMN "isRush" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "paymentToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentToken_key" ON "Order"("paymentToken");
