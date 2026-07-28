-- CreateEnum
CREATE TYPE "GeometryType" AS ENUM ('POINT', 'LINE', 'POLYGON');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('DANG_XU_LY', 'THANH_CONG', 'CO_LOI', 'THAT_BAI');

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "elevation" DOUBLE PRECISION,
ADD COLUMN     "geojson" JSONB,
ADD COLUMN     "geometryType" "GeometryType" NOT NULL DEFAULT 'POINT';

-- CreateTable
CREATE TABLE "asset_import_batches" (
    "id" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "assetTypeId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "importedById" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'DANG_XU_LY',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_import_batches_batchCode_key" ON "asset_import_batches"("batchCode");

-- CreateIndex
CREATE INDEX "asset_import_batches_assetTypeId_idx" ON "asset_import_batches"("assetTypeId");

-- AddForeignKey
ALTER TABLE "asset_import_batches" ADD CONSTRAINT "asset_import_batches_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "asset_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_import_batches" ADD CONSTRAINT "asset_import_batches_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
