ALTER TABLE "City" ADD COLUMN "insee_code" TEXT;
CREATE UNIQUE INDEX "City_insee_code_key" ON "City"("insee_code");

CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'datatourisme',
    "source_id" TEXT NOT NULL,
    "source_updated_at" TIMESTAMP(3),
    "city_id" TEXT,
    "commune_insee" TEXT NOT NULL,
    "commune_name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_types" TEXT[],
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "periods" JSONB,
    "venue_name" TEXT,
    "address" TEXT,
    "postal_code" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "images" TEXT[],
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "price_info" TEXT,
    "raw_payload" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Event_source_source_id_key" ON "Event"("source", "source_id");
CREATE INDEX "Event_commune_insee_end_date_idx" ON "Event"("commune_insee", "end_date");
CREATE INDEX "Event_city_id_start_date_idx" ON "Event"("city_id", "start_date");
CREATE INDEX "Event_end_date_idx" ON "Event"("end_date");
ALTER TABLE "Event" ADD CONSTRAINT "Event_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
