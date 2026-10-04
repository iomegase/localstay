-- Spec 027 / 061 (amendement A1) : traductions de contenu par champ (DeepL). Additif.
DO $$ BEGIN
  CREATE TYPE "SupportedLocale" AS ENUM ('fr', 'en', 'it', 'es', 'nl');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TranslationStatus" AS ENUM ('queued', 'auto_translated', 'needs_review', 'approved', 'stale', 'rejected', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ContentTranslation" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "source_locale" "SupportedLocale" NOT NULL DEFAULT 'fr',
    "target_locale" "SupportedLocale" NOT NULL,
    "source_text_hash" TEXT NOT NULL,
    "source_updated_at" TIMESTAMP(3) NOT NULL,
    "translated_text" TEXT NOT NULL,
    "status" "TranslationStatus" NOT NULL DEFAULT 'queued',
    "provider" TEXT,
    "provider_request_id" TEXT,
    "generated_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    CONSTRAINT "ContentTranslation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ContentTranslation_entity_type_entity_id_field_name_target_locale_key" ON "ContentTranslation"("entity_type", "entity_id", "field_name", "target_locale");
CREATE INDEX IF NOT EXISTS "ContentTranslation_target_locale_status_idx" ON "ContentTranslation"("target_locale", "status");
CREATE INDEX IF NOT EXISTS "ContentTranslation_entity_type_entity_id_idx" ON "ContentTranslation"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "ContentTranslation_source_text_hash_idx" ON "ContentTranslation"("source_text_hash");
CREATE INDEX IF NOT EXISTS "ContentTranslation_deleted_at_idx" ON "ContentTranslation"("deleted_at");

DO $$ BEGIN
  ALTER TABLE "ContentTranslation" ADD CONSTRAINT "ContentTranslation_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
