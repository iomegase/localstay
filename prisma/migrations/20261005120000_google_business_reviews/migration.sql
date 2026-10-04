-- Spec 062 — Avis Google Business Profile (additif, idempotent)
ALTER TYPE "LocalLandingReviewSource" ADD VALUE IF NOT EXISTS 'GOOGLE';

CREATE TABLE IF NOT EXISTS "GoogleBusinessReview" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "google_review_id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "author_photo_url" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "owner_reply" TEXT,
    "google_created_at" TIMESTAMP(3) NOT NULL,
    "google_updated_at" TIMESTAMP(3) NOT NULL,
    "last_synced_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GoogleBusinessReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GoogleBusinessReview_google_review_id_key" ON "GoogleBusinessReview"("google_review_id");
CREATE INDEX IF NOT EXISTS "GoogleBusinessReview_deleted_at_google_created_at_idx" ON "GoogleBusinessReview"("deleted_at", "google_created_at");

ALTER TABLE "LocalLandingReview" ADD COLUMN IF NOT EXISTS "google_review_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "LocalLandingReview_destination_id_google_review_id_key" ON "LocalLandingReview"("destination_id", "google_review_id");

DO $$ BEGIN
  ALTER TABLE "LocalLandingReview" ADD CONSTRAINT "LocalLandingReview_google_review_id_fkey"
    FOREIGN KEY ("google_review_id") REFERENCES "GoogleBusinessReview"("google_review_id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
