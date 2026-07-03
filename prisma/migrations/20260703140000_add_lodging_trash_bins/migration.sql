-- Bacs à poubelles structurés : liste JSON [{ type, description }]
-- Champ additif nullable, non destructif (trash_info conservé).

ALTER TABLE "LodgingCustomization"
  ADD COLUMN "trash_bins" JSONB;
