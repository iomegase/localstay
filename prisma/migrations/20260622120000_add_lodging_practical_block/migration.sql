-- CreateTable
CREATE TABLE "LodgingPracticalBlock" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "lodging_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "icon" TEXT NOT NULL,
    "photo_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LodgingPracticalBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LodgingPracticalBlock_lodging_id_deleted_at_idx" ON "LodgingPracticalBlock"("lodging_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "LodgingPracticalBlock" ADD CONSTRAINT "LodgingPracticalBlock_lodging_id_fkey" FOREIGN KEY ("lodging_id") REFERENCES "Lodging"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
