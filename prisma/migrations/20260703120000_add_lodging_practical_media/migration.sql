-- Infos pratiques logement : médias (photo + vidéo YouTube)
-- Champs additifs nullable, aucun backfill nécessaire.

ALTER TABLE "LodgingCustomization"
  ADD COLUMN "presentation_video_url" TEXT,
  ADD COLUMN "parking_photo_url" TEXT,
  ADD COLUMN "parking_video_url" TEXT;

ALTER TABLE "LodgingPracticalBlock"
  ADD COLUMN "video_url" TEXT;
