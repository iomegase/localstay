-- AlterTable
ALTER TABLE "PoiAcquisitionCandidate" ADD COLUMN     "description_sources" JSONB;

-- AlterTable
ALTER TABLE "PointOfInterest" ADD COLUMN     "description_sources" JSONB;

-- AlterTable
ALTER TABLE "TrailCandidate" ADD COLUMN     "description_sources" JSONB;

