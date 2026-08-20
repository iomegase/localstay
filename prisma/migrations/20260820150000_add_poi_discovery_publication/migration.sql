CREATE TYPE "PoiDiscoveryStatus" AS ENUM ('DRAFT', 'PUBLISHED');

ALTER TABLE "PointOfInterest"
ADD COLUMN "discovery_status" "PoiDiscoveryStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "discovery_published_at" TIMESTAMP(3);

CREATE INDEX "PointOfInterest_discovery_status_deleted_at_is_active_updated_at_idx"
ON "PointOfInterest"("discovery_status", "deleted_at", "is_active", "updated_at");

CREATE INDEX "PointOfInterest_city_id_category_id_discovery_status_deleted_at_is_active_idx"
ON "PointOfInterest"("city_id", "category_id", "discovery_status", "deleted_at", "is_active");
