/*
  Warnings:

  - A unique constraint covering the columns `[stripeIntentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "stripeIntentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeIntentId_key" ON "Payment"("stripeIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
