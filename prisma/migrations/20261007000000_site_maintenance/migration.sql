-- Spec 087 : mode maintenance du site public (migration additive).
CREATE TABLE IF NOT EXISTS "SiteMaintenance" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "updated_by" TEXT,
    CONSTRAINT "SiteMaintenance_pkey" PRIMARY KEY ("id")
);
