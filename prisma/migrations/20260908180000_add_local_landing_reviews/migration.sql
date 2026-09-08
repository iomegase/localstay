CREATE TYPE "LocalLandingReviewSource" AS ENUM ('AIRBNB', 'DIRECT');

CREATE TABLE "LocalLandingReview" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "destination_slug" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "stay_date" TEXT,
    "source" "LocalLandingReviewSource" NOT NULL,
    "rating" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "LocalLandingReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LocalLandingReview_destination_slug_deleted_at_is_active_sort_order_created_at_idx"
ON "LocalLandingReview"("destination_slug", "deleted_at", "is_active", "sort_order", "created_at");
