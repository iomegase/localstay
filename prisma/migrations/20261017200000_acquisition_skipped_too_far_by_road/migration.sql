-- Spec 100 : lieux écartés car à plus de 20 min en voiture du centre de la ville.
ALTER TABLE "PoiAcquisitionRun" ADD COLUMN IF NOT EXISTS "skipped_too_far_by_road" INTEGER NOT NULL DEFAULT 0;
