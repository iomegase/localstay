-- Phase C (plan 2026-06-05) — snap/densification ORS foot-hiking.
-- Colonnes additives nullables ; IF NOT EXISTS pour rester idempotent face à l'état
-- de migration existant (shadow DB cassée + drift sur d'autres tables).
ALTER TABLE "TrailDetail" ADD COLUMN IF NOT EXISTS "geometry_raw_geojson" JSONB;
ALTER TABLE "TrailDetail" ADD COLUMN IF NOT EXISTS "geometry_refined_at" TIMESTAMP(3);
