-- Suppression du module « parking » du logement (infos désormais saisies dans
-- les instructions d'arrivée). Colonnes retirées de LodgingCustomization.

ALTER TABLE "LodgingCustomization"
  DROP COLUMN IF EXISTS "parking_info",
  DROP COLUMN IF EXISTS "parking_photo_url",
  DROP COLUMN IF EXISTS "parking_video_url";
