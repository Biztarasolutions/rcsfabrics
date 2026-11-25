ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "codeNumber" INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS "categories_codeNumber_key" ON "categories"("codeNumber");
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "designNumber" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "rcsCode" VARCHAR(120);
CREATE UNIQUE INDEX IF NOT EXISTS "products_rcsCode_key" ON "products"("rcsCode");
