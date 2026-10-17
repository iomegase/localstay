-- Spec 101 : crédits des photos sous licence libre (Wikimedia Commons).
ALTER TABLE "PointOfInterest" ADD COLUMN IF NOT EXISTS "photo_credits" JSONB;
