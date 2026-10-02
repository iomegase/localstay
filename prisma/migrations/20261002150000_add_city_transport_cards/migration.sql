-- CreateTable
CREATE TABLE "CityTransportCard" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "city_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tag" TEXT,
    "body" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CityTransportCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CityTransportCard_city_id_deleted_at_idx" ON "CityTransportCard"("city_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "CityTransportCard" ADD CONSTRAINT "CityTransportCard_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

