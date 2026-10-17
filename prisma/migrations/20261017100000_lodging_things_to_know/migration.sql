-- Spec 099 : « Choses à savoir » du guide logement (cartes saisies par l'Owner).
CREATE TABLE IF NOT EXISTS "LodgingThingToKnow" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "lodging_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "photos" TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LodgingThingToKnow_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LodgingThingToKnow_lodging_id_deleted_at_idx" ON "LodgingThingToKnow"("lodging_id", "deleted_at");
DO $$ BEGIN
  ALTER TABLE "LodgingThingToKnow" ADD CONSTRAINT "LodgingThingToKnow_lodging_id_fkey"
    FOREIGN KEY ("lodging_id") REFERENCES "Lodging"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
