-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('MANUAL', 'GOOGLE');

-- CreateTable
CREATE TABLE "CacheTtlConfig" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "category_slug" TEXT NOT NULL,
    "ttl_hours" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "CacheTtlConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "department" TEXT,
    "region" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeminiCache" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "city_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_fetching" BOOLEAN NOT NULL DEFAULT false,
    "fetch_error" TEXT,
    "prompt_version" TEXT NOT NULL,
    "raw_response" JSONB,

    CONSTRAINT "GeminiCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HikingDetail" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "poi_id" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "duration_minutes" INTEGER,
    "distance_km" DOUBLE PRECISION,
    "elevation_gain_m" INTEGER,
    "starting_point" TEXT,
    "parking_info" TEXT,
    "kids_friendly" BOOLEAN NOT NULL DEFAULT false,
    "pets_friendly" BOOLEAN NOT NULL DEFAULT false,
    "best_season" TEXT[],
    "gpx_url" TEXT,

    CONSTRAINT "HikingDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointOfInterest" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "rating" DOUBLE PRECISION,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_open_now" BOOLEAN,
    "hours" JSONB,
    "photos" TEXT[],
    "tags" TEXT[],
    "city_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "subcategory_id" TEXT,
    "google_place_id" TEXT,
    "review_source" "ReviewSource" NOT NULL DEFAULT 'MANUAL',
    "reviews_synced_at" TIMESTAMP(3),
    "geocode_attempts" INTEGER NOT NULL DEFAULT 0,
    "geocode_error" TEXT,
    "geocode_provider" TEXT,
    "geocode_status" TEXT NOT NULL DEFAULT 'pending',
    "geocoded_at" TIMESTAMP(3),

    CONSTRAINT "PointOfInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrCode" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "city_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "storage_url" TEXT NOT NULL,

    CONSTRAINT "QrCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CacheTtlConfig_category_slug_key" ON "CacheTtlConfig"("category_slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "GeminiCache_city_id_category_id_key" ON "GeminiCache"("city_id" ASC, "category_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "HikingDetail_poi_id_key" ON "HikingDetail"("poi_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PointOfInterest_city_id_slug_key" ON "PointOfInterest"("city_id" ASC, "slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_city_id_key" ON "QrCode"("city_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SubCategory_slug_key" ON "SubCategory"("slug" ASC);

-- AddForeignKey
ALTER TABLE "GeminiCache" ADD CONSTRAINT "GeminiCache_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeminiCache" ADD CONSTRAINT "GeminiCache_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HikingDetail" ADD CONSTRAINT "HikingDetail_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "PointOfInterest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointOfInterest" ADD CONSTRAINT "PointOfInterest_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointOfInterest" ADD CONSTRAINT "PointOfInterest_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointOfInterest" ADD CONSTRAINT "PointOfInterest_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

