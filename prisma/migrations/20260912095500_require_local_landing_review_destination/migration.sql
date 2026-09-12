-- DropForeignKey
ALTER TABLE "LocalLandingReview" DROP CONSTRAINT "LocalLandingReview_destination_id_fkey";

-- AlterTable
ALTER TABLE "LocalLandingReview" ALTER COLUMN "destination_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "LocalLandingReview" ADD CONSTRAINT "LocalLandingReview_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "LocalLandingDestination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
