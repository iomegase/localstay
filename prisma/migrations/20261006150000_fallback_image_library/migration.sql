-- Spec 070 : médiathèque des images de remplacement (additive).
CREATE TABLE IF NOT EXISTS "FallbackImage" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "url" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "category_id" TEXT,
    "subcategory_id" TEXT,
    CONSTRAINT "FallbackImage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FallbackImage_storage_path_key" ON "FallbackImage"("storage_path");
CREATE INDEX IF NOT EXISTS "FallbackImage_category_id_subcategory_id_deleted_at_idx" ON "FallbackImage"("category_id", "subcategory_id", "deleted_at");
ALTER TABLE "FallbackImage" ADD CONSTRAINT "FallbackImage_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FallbackImage" ADD CONSTRAINT "FallbackImage_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PointOfInterest" ADD COLUMN IF NOT EXISTS "fallback_image_id" TEXT;
ALTER TABLE "PointOfInterest" ADD CONSTRAINT "PointOfInterest_fallback_image_id_fkey" FOREIGN KEY ("fallback_image_id") REFERENCES "FallbackImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
