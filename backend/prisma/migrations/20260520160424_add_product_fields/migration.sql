-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "bestFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "gender" TEXT NOT NULL DEFAULT 'women',
ADD COLUMN     "properties" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "code" INTEGER,
ADD COLUMN     "discountType" VARCHAR(20),
ADD COLUMN     "discountValue" DOUBLE PRECISION,
ADD COLUMN     "folderUrl" TEXT,
ADD COLUMN     "occasion" VARCHAR(100),
ADD COLUMN     "styleCode" VARCHAR(100),
ADD COLUMN     "workType" VARCHAR(50);

-- CreateTable
CREATE TABLE "product_colors" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "hexCode" VARCHAR(7) NOT NULL,
    "productCode" VARCHAR(100),
    "folderUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_colors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_colors_productId_idx" ON "product_colors"("productId");

-- AddForeignKey
ALTER TABLE "product_colors" ADD CONSTRAINT "product_colors_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
