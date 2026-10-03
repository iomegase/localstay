ALTER TABLE "CityTransportCard"
ADD COLUMN "is_free" BOOLEAN NOT NULL DEFAULT false;

UPDATE "CityTransportCard"
SET "is_free" = true
WHERE "service_key" = 'facilibus'
  AND "deleted_at" IS NULL;
