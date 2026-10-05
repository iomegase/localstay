-- Spec 063 — Copie des photos des POI (additif, idempotent)
CREATE TABLE IF NOT EXISTS "PoiPhotoMirror" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "poi_id" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,
    CONSTRAINT "PoiPhotoMirror_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PoiPhotoMirror_poi_id_source_url_key" ON "PoiPhotoMirror"("poi_id", "source_url");
CREATE INDEX IF NOT EXISTS "PoiPhotoMirror_source_url_idx" ON "PoiPhotoMirror"("source_url");

DO $$ BEGIN
  ALTER TABLE "PoiPhotoMirror" ADD CONSTRAINT "PoiPhotoMirror_poi_id_fkey"
    FOREIGN KEY ("poi_id") REFERENCES "PointOfInterest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
