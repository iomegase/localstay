-- Spec agenda public : slug d'événement pour les URLs publiques.
ALTER TABLE "Event" ADD COLUMN "slug" TEXT;
CREATE INDEX "Event_slug_idx" ON "Event"("slug");
