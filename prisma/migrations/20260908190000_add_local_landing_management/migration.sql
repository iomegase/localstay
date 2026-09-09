-- CreateEnum
CREATE TYPE "LocalLandingIntent" AS ENUM ('CONCIERGE', 'SEMINAR', 'VACATION_RENTAL');

-- AlterTable
ALTER TABLE "LocalLandingReview" ADD COLUMN     "destination_id" TEXT;

-- AlterTable
ALTER TABLE "LocalLandingReview" ADD COLUMN     "deleted_with_destination" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LocalLandingDestination" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "city_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LocalLandingDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalLandingPage" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "destination_id" TEXT NOT NULL,
    "intent" "LocalLandingIntent" NOT NULL,
    "seo_title" TEXT NOT NULL,
    "meta_description" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "h1" TEXT NOT NULL,
    "hero_title" TEXT NOT NULL,
    "hero_copy" TEXT NOT NULL,
    "reassurance" TEXT,
    "section_title" TEXT NOT NULL,
    "section_copy" TEXT NOT NULL,
    "process_title" TEXT,
    "local_title" TEXT NOT NULL,
    "local_copy" TEXT NOT NULL,
    "cta_label" TEXT NOT NULL,
    "cta_href" TEXT NOT NULL,
    "empty_copy" TEXT,
    "highlights" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "faq" JSONB NOT NULL,

    CONSTRAINT "LocalLandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocalLandingDestination_city_id_key" ON "LocalLandingDestination"("city_id");

-- CreateIndex
CREATE INDEX "LocalLandingPage_destination_id_deleted_at_idx" ON "LocalLandingPage"("destination_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "LocalLandingPage_destination_id_intent_key" ON "LocalLandingPage"("destination_id", "intent");

-- AddForeignKey
ALTER TABLE "LocalLandingDestination" ADD CONSTRAINT "LocalLandingDestination_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalLandingPage" ADD CONSTRAINT "LocalLandingPage_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "LocalLandingDestination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalLandingReview" ADD CONSTRAINT "LocalLandingReview_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "LocalLandingDestination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
