/*
  Warnings:

  - The values [RAZORPAY] on the enum `PaymentGateway` will be removed. If these variants are still used in the database, this will fail.
  - The values [RAZORPAY] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentGateway_new" AS ENUM ('PAYU', 'COD');
ALTER TABLE "public"."payment_transactions" ALTER COLUMN "gateway" DROP DEFAULT;
ALTER TABLE "payment_transactions" ALTER COLUMN "gateway" TYPE "PaymentGateway_new" USING ("gateway"::text::"PaymentGateway_new");
ALTER TYPE "PaymentGateway" RENAME TO "PaymentGateway_old";
ALTER TYPE "PaymentGateway_new" RENAME TO "PaymentGateway";
DROP TYPE "public"."PaymentGateway_old";
ALTER TABLE "payment_transactions" ALTER COLUMN "gateway" SET DEFAULT 'PAYU';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('PREPAID', 'COD', 'PAYU', 'WALLET');
ALTER TABLE "orders" ALTER COLUMN "payment_method" TYPE "PaymentMethod_new" USING ("payment_method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;
