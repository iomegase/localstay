-- Spec 071 : mémoire de revue de l'acquisition POI (additive).
ALTER TABLE "PoiAcquisitionRun" ADD COLUMN IF NOT EXISTS "skipped_rejected" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PoiAcquisitionRun" ADD COLUMN IF NOT EXISTS "skipped_excluded" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "PoiAcquisitionMemory" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "city_id" TEXT NOT NULL,
    "google_place_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "category_id" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "created_by" TEXT,
    CONSTRAINT "PoiAcquisitionMemory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PoiAcquisitionMemory_city_id_google_place_id_deleted_at_idx" ON "PoiAcquisitionMemory"("city_id", "google_place_id", "deleted_at");
ALTER TABLE "PoiAcquisitionMemory" ADD CONSTRAINT "PoiAcquisitionMemory_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PoiAcquisitionMemory" ADD CONSTRAINT "PoiAcquisitionMemory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
