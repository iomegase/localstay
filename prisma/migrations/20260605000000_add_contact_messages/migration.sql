CREATE TYPE "ContactMessageDestination" AS ENUM ('owner', 'concierge');

CREATE TYPE "ContactMessageStatus" AS ENUM ('new', 'replied', 'archived');

CREATE TABLE "ContactMessage" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "lodging_id" TEXT,
  "owner_id" TEXT,
  "destination" "ContactMessageDestination" NOT NULL,
  "status" "ContactMessageStatus" NOT NULL DEFAULT 'new',
  "sender_name" TEXT NOT NULL,
  "sender_email" TEXT NOT NULL,
  "sender_phone" TEXT,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "archived_at" TIMESTAMP(3),
  "reply_body" TEXT,
  "replied_at" TIMESTAMP(3),
  "replied_by_user_id" TEXT,

  CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactMessage_created_at_idx" ON "ContactMessage"("created_at");
CREATE INDEX "ContactMessage_lodging_id_idx" ON "ContactMessage"("lodging_id");
CREATE INDEX "ContactMessage_owner_id_idx" ON "ContactMessage"("owner_id");
CREATE INDEX "ContactMessage_status_idx" ON "ContactMessage"("status");

ALTER TABLE "ContactMessage"
  ADD CONSTRAINT "ContactMessage_lodging_id_fkey"
  FOREIGN KEY ("lodging_id") REFERENCES "Lodging"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContactMessage"
  ADD CONSTRAINT "ContactMessage_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
