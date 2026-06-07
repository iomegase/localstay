-- POI photo liveness : flag de revue admin + horodatage du dernier contrôle
ALTER TABLE "PointOfInterest" ADD COLUMN IF NOT EXISTS "photos_status" TEXT NOT NULL DEFAULT 'ok';
ALTER TABLE "PointOfInterest" ADD COLUMN IF NOT EXISTS "photos_checked_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "PointOfInterest_photos_status_photos_checked_at_idx"
  ON "PointOfInterest"("photos_status", "photos_checked_at");
