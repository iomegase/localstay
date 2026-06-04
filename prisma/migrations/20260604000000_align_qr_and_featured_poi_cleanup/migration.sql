ALTER TABLE "QrCode" DROP COLUMN IF EXISTS "deleted_at";

ALTER TABLE "LodgingFeaturedPoi" DROP COLUMN IF EXISTS "owner_note";
ALTER TABLE "LodgingFeaturedPoi" DROP COLUMN IF EXISTS "owner_rating";
