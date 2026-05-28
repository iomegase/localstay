-- AlterTable
ALTER TABLE "LodgingCustomization"
  ADD COLUMN "lodging_address"       TEXT,
  ADD COLUMN "wifi_ssid"              TEXT,
  ADD COLUMN "wifi_password"          TEXT,
  ADD COLUMN "parking_info"           TEXT,
  ADD COLUMN "equipment_info"         TEXT,
  ADD COLUMN "checkout_instructions"  TEXT,
  ADD COLUMN "trash_info"             TEXT,
  ADD COLUMN "house_rules"            TEXT,
  ADD COLUMN "emergency_contacts"     TEXT,
  ADD COLUMN "useful_services"        TEXT;
