/*
  Warnings:

  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "transactionId" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2);
