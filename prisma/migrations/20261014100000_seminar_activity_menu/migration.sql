-- Spec 097 : menu d'activités séminaire (catalogue, prestataires internes, attributions par surface).
-- CreateEnum
CREATE TYPE "SeminarActivityCategory" AS ENUM ('TEAM_BUILDING', 'WINTER', 'SUMMER', 'WELLBEING', 'GASTRONOMY', 'EXCEPTIONAL');

-- CreateTable
CREATE TABLE "SeminarActivity" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "SeminarActivityCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "season_label" TEXT NOT NULL,
    "level_label" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "price_per_person_cents" INTEGER,
    "price_per_group_cents" INTEGER,
    "internal_notes" TEXT,

    CONSTRAINT "SeminarActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeminarActivityProvider" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "activity_id" TEXT NOT NULL,
    "poi_id" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "SeminarActivityProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeminarActivityPlacement" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "activity_id" TEXT NOT NULL,
    "destination_id" TEXT,
    "surface_key" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "SeminarActivityPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeminarActivity_slug_key" ON "SeminarActivity"("slug");

-- CreateIndex
CREATE INDEX "SeminarActivity_deleted_at_is_published_category_idx" ON "SeminarActivity"("deleted_at", "is_published", "category");

-- CreateIndex
CREATE UNIQUE INDEX "SeminarActivityProvider_activity_id_poi_id_key" ON "SeminarActivityProvider"("activity_id", "poi_id");

-- CreateIndex
CREATE INDEX "SeminarActivityPlacement_surface_key_deleted_at_position_idx" ON "SeminarActivityPlacement"("surface_key", "deleted_at", "position");

-- CreateIndex
CREATE UNIQUE INDEX "SeminarActivityPlacement_activity_id_surface_key_key" ON "SeminarActivityPlacement"("activity_id", "surface_key");

-- AddForeignKey
ALTER TABLE "SeminarActivityProvider" ADD CONSTRAINT "SeminarActivityProvider_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "SeminarActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeminarActivityProvider" ADD CONSTRAINT "SeminarActivityProvider_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "PointOfInterest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeminarActivityPlacement" ADD CONSTRAINT "SeminarActivityPlacement_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "SeminarActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeminarActivityPlacement" ADD CONSTRAINT "SeminarActivityPlacement_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "LocalLandingDestination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

