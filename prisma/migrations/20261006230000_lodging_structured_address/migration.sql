-- Spec 080 : adresse du logement structurée (migration additive).
ALTER TABLE "LodgingCustomization" ADD COLUMN IF NOT EXISTS "address_number" TEXT;
ALTER TABLE "LodgingCustomization" ADD COLUMN IF NOT EXISTS "address_street" TEXT;
ALTER TABLE "LodgingCustomization" ADD COLUMN IF NOT EXISTS "address_postal_code" TEXT;
ALTER TABLE "LodgingCustomization" ADD COLUMN IF NOT EXISTS "address_city" TEXT;
