-- CreateEnum
CREATE TYPE "LodgingAmenityAvailability" AS ENUM ('included', 'on_request');

-- AlterTable
ALTER TABLE "LodgingAmenity" ADD COLUMN "availability" "LodgingAmenityAvailability" NOT NULL DEFAULT 'included';

-- CreateTable
CREATE TABLE "LodgingFaqItem" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "profile_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LodgingFaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LodgingFaqItem_profile_id_deleted_at_idx" ON "LodgingFaqItem"("profile_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "LodgingFaqItem" ADD CONSTRAINT "LodgingFaqItem_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "LodgingPublicProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
