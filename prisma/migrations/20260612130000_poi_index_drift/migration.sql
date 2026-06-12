-- Réconciliation drift : index de perf déclarés au schéma (@@index PointOfInterest)
-- jamais créés en base. Idempotent (IF NOT EXISTS), noms = ceux attendus par Prisma.
CREATE INDEX IF NOT EXISTS "PointOfInterest_city_id_deleted_at_is_active_updated_at_idx"
  ON "PointOfInterest"("city_id", "deleted_at", "is_active", "updated_at");
CREATE INDEX IF NOT EXISTS "PointOfInterest_city_id_category_id_deleted_at_is_active_idx"
  ON "PointOfInterest"("city_id", "category_id", "deleted_at", "is_active");
CREATE INDEX IF NOT EXISTS "PointOfInterest_city_id_subcategory_id_deleted_at_is_active_idx"
  ON "PointOfInterest"("city_id", "subcategory_id", "deleted_at", "is_active");
CREATE INDEX IF NOT EXISTS "PointOfInterest_city_id_geocode_status_deleted_at_idx"
  ON "PointOfInterest"("city_id", "geocode_status", "deleted_at");
