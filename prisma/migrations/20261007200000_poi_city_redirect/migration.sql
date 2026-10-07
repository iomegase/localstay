-- CreateTable
CREATE TABLE "PoiCityRedirect" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "from_city_id" TEXT NOT NULL,
    "from_slug" TEXT NOT NULL,
    "poi_id" TEXT NOT NULL,

    CONSTRAINT "PoiCityRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PoiCityRedirect_poi_id_idx" ON "PoiCityRedirect"("poi_id");

-- CreateIndex
CREATE UNIQUE INDEX "PoiCityRedirect_from_city_id_from_slug_key" ON "PoiCityRedirect"("from_city_id", "from_slug");

-- AddForeignKey
ALTER TABLE "PoiCityRedirect" ADD CONSTRAINT "PoiCityRedirect_from_city_id_fkey" FOREIGN KEY ("from_city_id") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoiCityRedirect" ADD CONSTRAINT "PoiCityRedirect_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "PointOfInterest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

