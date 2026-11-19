-- Remove Razorpay (replaced by Cashfree)
ALTER TABLE "orders" DROP COLUMN IF EXISTS "razorpayOrderId";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "razorpayPaymentId";

-- Drop RAZORPAY from the PaymentMethod enum (no orders use it)
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'CASHFREE', 'UPI', 'COD', 'BANK_TRANSFER');
ALTER TABLE "orders" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod" USING ("paymentMethod"::text::"PaymentMethod");
DROP TYPE "PaymentMethod_old";

-- Online-payment on/off switch, now for Cashfree
UPDATE "settings" SET "key" = 'payment_online_enabled' WHERE "key" = 'payment_razorpay_enabled'
  AND NOT EXISTS (SELECT 1 FROM "settings" WHERE "key" = 'payment_online_enabled');
DELETE FROM "settings" WHERE "key" = 'payment_razorpay_enabled';
