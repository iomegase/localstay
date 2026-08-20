CREATE TYPE "PoiDiscoveryStatus" AS ENUM ('DRAFT', 'PUBLISHED');

ALTER TABLE "PointOfInterest"
ADD COLUMN "discovery_status" "PoiDiscoveryStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "discovery_published_at" TIMESTAMP(3);

CREATE INDEX "poi_discovery_status_visibility_idx"
ON "PointOfInterest"("discovery_status", "deleted_at", "is_active", "updated_at");

CREATE INDEX "poi_discovery_city_category_idx"
ON "PointOfInterest"("city_id", "category_id", "discovery_status", "deleted_at", "is_active");
