-- CreateTable
CREATE TABLE "EquipmentTemplate" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "title_key" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source_lodging_id" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "EquipmentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentTemplate_title_key_key" ON "EquipmentTemplate"("title_key");

-- CreateIndex
CREATE INDEX "EquipmentTemplate_status_deleted_at_idx" ON "EquipmentTemplate"("status", "deleted_at");

