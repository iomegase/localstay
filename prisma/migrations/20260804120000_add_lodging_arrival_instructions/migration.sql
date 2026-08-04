-- CreateTable
CREATE TABLE "LodgingArrivalInstruction" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "lodging_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "video_url" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LodgingArrivalInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LodgingArrivalInstruction_lodging_id_deleted_at_idx" ON "LodgingArrivalInstruction"("lodging_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "LodgingArrivalInstruction" ADD CONSTRAINT "LodgingArrivalInstruction_lodging_id_fkey" FOREIGN KEY ("lodging_id") REFERENCES "Lodging"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
