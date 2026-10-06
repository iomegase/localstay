-- Spec 072 : lancements d'acquisition par lots reprenables (additive).
ALTER TABLE "PoiAcquisitionRun" ADD COLUMN IF NOT EXISTS "source_url" TEXT;
ALTER TABLE "PoiAcquisitionRun" ADD COLUMN IF NOT EXISTS "pending_places" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "PoiAcquisitionRun" ADD COLUMN IF NOT EXISTS "processed_count" INTEGER NOT NULL DEFAULT 0;
