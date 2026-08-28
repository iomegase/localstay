DROP INDEX IF EXISTS "LodgingPublicProfile_city_id_slug_key";
CREATE UNIQUE INDEX "LodgingPublicProfile_slug_key" ON "LodgingPublicProfile"("slug");
