-- CreateEnum
CREATE TYPE "ArrivalStepKind" AS ENUM ('address', 'access', 'garage', 'ski', 'custom');

-- CreateEnum
CREATE TYPE "StayEventType" AS ENUM ('arrived', 'departed');

-- AlterTable
ALTER TABLE "LodgingArrivalInstruction" ADD COLUMN     "facts" JSONB,
ADD COLUMN     "kind" "ArrivalStepKind" NOT NULL DEFAULT 'custom',
ADD COLUMN     "substeps" JSONB,
ADD COLUMN     "tip" TEXT;

-- AlterTable
ALTER TABLE "LodgingCustomization" ADD COLUMN     "key_box_code" TEXT;

-- CreateTable
CREATE TABLE "LodgingStayEvent" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "lodging_id" TEXT NOT NULL,
    "type" "StayEventType" NOT NULL,

    CONSTRAINT "LodgingStayEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LodgingStayEvent_lodging_id_type_created_at_idx" ON "LodgingStayEvent"("lodging_id", "type", "created_at");

-- AddForeignKey
ALTER TABLE "LodgingStayEvent" ADD CONSTRAINT "LodgingStayEvent_lodging_id_fkey" FOREIGN KEY ("lodging_id") REFERENCES "Lodging"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

