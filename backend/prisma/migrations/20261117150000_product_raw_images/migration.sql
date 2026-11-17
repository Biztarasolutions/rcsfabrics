-- Admin-only original ("Raw") fabric photo, one per product
CREATE TABLE IF NOT EXISTS "product_raw_images" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_raw_images_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "product_raw_images_productId_key" ON "product_raw_images"("productId");
ALTER TABLE "product_raw_images" DROP CONSTRAINT IF EXISTS "product_raw_images_productId_fkey";
ALTER TABLE "product_raw_images" ADD CONSTRAINT "product_raw_images_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Not readable through Supabase's public API
ALTER TABLE "product_raw_images" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "product_raw_images" FROM anon, authenticated;
