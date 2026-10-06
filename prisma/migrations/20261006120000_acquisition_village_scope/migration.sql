-- Spec 066 : périmètre village et statut d'ouverture de l'acquisition POI (additive).
ALTER TABLE "PoiAcquisitionRun" ADD COLUMN IF NOT EXISTS "skipped_other_village" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PoiAcquisitionRun" ADD COLUMN IF NOT EXISTS "skipped_closed_permanently" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PoiAcquisitionCandidate" ADD COLUMN IF NOT EXISTS "business_status" TEXT;
