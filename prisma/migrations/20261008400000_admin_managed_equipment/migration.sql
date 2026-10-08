-- Spec 096 : équipements gérés par l'admin (photo / vidéo de bibliothèque, lien des équipements de logement).
ALTER TABLE "EquipmentTemplate" ADD COLUMN IF NOT EXISTS "photo_url" TEXT;
ALTER TABLE "EquipmentTemplate" ADD COLUMN IF NOT EXISTS "video_url" TEXT;
ALTER TABLE "LodgingPracticalBlock" ADD COLUMN IF NOT EXISTS "equipment_template_id" TEXT;
CREATE INDEX IF NOT EXISTS "LodgingPracticalBlock_equipment_template_id_idx" ON "LodgingPracticalBlock"("equipment_template_id");
DO $$ BEGIN
  ALTER TABLE "LodgingPracticalBlock" ADD CONSTRAINT "LodgingPracticalBlock_equipment_template_id_fkey"
    FOREIGN KEY ("equipment_template_id") REFERENCES "EquipmentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
