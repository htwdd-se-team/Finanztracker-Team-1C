/*
  Warnings:

  - The values [YEARLY] on the enum `RecurringTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `endDate` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `recurringInterval` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RecurringTransactionType_new" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
ALTER TABLE "Transaction" ALTER COLUMN "recurringType" TYPE "RecurringTransactionType_new" USING ("recurringType"::text::"RecurringTransactionType_new");
ALTER TYPE "RecurringTransactionType" RENAME TO "RecurringTransactionType_old";
ALTER TYPE "RecurringTransactionType_new" RENAME TO "RecurringTransactionType";
DROP TYPE "RecurringTransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_transactionId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "endDate",
DROP COLUMN "recurringInterval",
DROP COLUMN "startDate",
ADD COLUMN     "recurringBaseInterval" INTEGER,
ADD COLUMN     "recurringDisabled" BOOLEAN;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
