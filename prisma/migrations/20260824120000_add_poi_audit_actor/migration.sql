CREATE TYPE "PoiAuditActorType" AS ENUM ('ADMIN', 'MERCHANT', 'SYSTEM');

ALTER TABLE "PoiAcquisitionAuditLog"
ADD COLUMN "actor_type" "PoiAuditActorType",
ALTER COLUMN "admin_id" DROP NOT NULL;

-- Existing audit rows were all created by authenticated Admin flows.
UPDATE "PoiAcquisitionAuditLog"
SET "actor_type" = 'ADMIN'
WHERE "actor_type" IS NULL;

ALTER TABLE "PoiAcquisitionAuditLog"
ALTER COLUMN "actor_type" SET DEFAULT 'ADMIN',
ALTER COLUMN "actor_type" SET NOT NULL;

ALTER TABLE "PoiAcquisitionAuditLog"
ADD CONSTRAINT "poi_acquisition_audit_actor_identity_check"
CHECK (
  ("actor_type" = 'SYSTEM' AND "admin_id" IS NULL)
  OR
  ("actor_type" IN ('ADMIN', 'MERCHANT') AND "admin_id" IS NOT NULL)
);
