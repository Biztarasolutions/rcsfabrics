-- Cashfree payment gateway
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CASHFREE';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cashfreeOrderId" VARCHAR(255);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cashfreePaymentId" VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS "orders_cashfreeOrderId_key" ON "orders"("cashfreeOrderId");
