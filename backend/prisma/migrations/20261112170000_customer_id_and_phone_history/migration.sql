-- Customer ID (RCS000123) for every account, numbered by sign-up date
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "customerNumber" SERIAL;
UPDATE "users" u SET "customerNumber" = r.n
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt", id) AS n FROM "users") r
WHERE u.id = r.id;
SELECT setval(pg_get_serial_sequence('"users"', 'customerNumber'), COALESCE((SELECT MAX("customerNumber") FROM "users"), 0) + 1, false);
CREATE UNIQUE INDEX IF NOT EXISTS "users_customerNumber_key" ON "users"("customerNumber");

-- Phone number history (users.phone stays the current number)
CREATE TABLE IF NOT EXISTS "user_phones" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_phones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_phones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "user_phones_userId_idx" ON "user_phones"("userId");
CREATE INDEX IF NOT EXISTS "user_phones_phone_idx" ON "user_phones"("phone");
INSERT INTO "user_phones" ("id", "userId", "phone", "createdAt")
SELECT 'up_' || u.id, u.id, u.phone, u."createdAt" FROM "users" u
WHERE u.phone IS NOT NULL AND u.phone <> ''
ON CONFLICT ("id") DO NOTHING;

-- Phone used on each order
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customerPhone" VARCHAR(20);
