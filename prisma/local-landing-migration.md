# Spec 048 — staged landing migration

The committed schema is the **expand stage**: review `destination_id` and its
relation are temporarily nullable so existing reviews survive migration. The
approved final state is a required relation. **Do not enable the new persisted
queries until the backfill and required-relation stage have completed.**

The additive SQL was generated offline with Prisma 5.22.0 from the schema before
this change and `prisma/schema.prisma`:

```sh
npx prisma migrate diff --from-schema-datamodel <before.prisma> --to-schema-datamodel prisma/schema.prisma --script
```

No database was connected or changed while producing this migration. The SQL
contains only the enum, tables, indexes and optional review foreign key.

## Deployment order

1. Confirm the target database/environment and arrange a maintenance window for
   review writes. Keep the existing public readers until the stages below pass.
2. Apply the additive migration using the normal Prisma deployment workflow.
3. Run `npm run db:backfill:local-landings` against that confirmed environment.
   It requires all four existing, non-deleted City rows. Missing Cities or an
   unlinked review with an unknown destination slug fail before writes. All
   destination/page creation and review links are one Prisma transaction.
4. Rerun the command and confirm `attachedReviews: 0`. Through Prisma, check that
   `localLandingReview.count({ where: { destination_id: null } })` is zero and
   each imported destination has exactly the three expected intentions. Keep
   review writes paused through required-relation enforcement.
5. Save the nullable schema as a temporary before snapshot, then change only
   `LocalLandingReview.destination_id` to `String` and its `destination` relation
   to `LocalLandingDestination` in `prisma/schema.prisma`. Remove the staging
   comment. Generate the follow-up migration with the same offline Prisma
   schema diff command, targeting a new timestamped migration directory. This
   generated migration sets the column to NOT NULL and replaces the optional
   foreign key with the required-relation foreign key. Review it, apply through
   Prisma, regenerate the client, then enable the persisted queries and review
   writers which always supply the destination relation.

The enforcement migration is intentionally not included in the automatic
migration chain yet: Prisma deploy would otherwise apply it before the
TypeScript backfill can run, failing for every database containing old reviews.
The backfill uses the nullable-stage client and must run before that client is
regenerated for the required schema; it remains safe to rerun during stage 4.

## Content mapping and preservation

- Conciergerie maps the **currently displayed detailed content** from
  `concierge-landings.ts`: promise → `hero_title`, heroCopy → `hero_copy`,
  reassurance, ownerTitle/ownerCopy → section fields, localHeading/localCopy →
  local fields, and its full FAQ. SEO, eyebrow, H1, CTA, highlights, process title
  and steps come from the destination catalogue. Superseded general concierge
  prose remains in its original TypeScript source; it is not substituted for
  the detailed public page.
- Séminaires maps every catalogue scalar and repeatable block. `hero_title` and
  `seo_title` reuse the current H1.
- Locations maps every existing content field. The new hero and section fields
  reuse its reviewed H1/intro. The CTA uses the existing “Voir tous les logements”
  link to `/logements`; no new inventory claim is generated.
- Saint-Gervais-les-Bains and Saint-Nicolas-de-Véroce remain active; Megève and
  Combloux remain inactive, including their incomplete service drafts. Active
  imported content is validated with the publication input schema before writes.
- Empty upsert updates preserve all existing destination/page content, status,
  audit dates and soft deletion on reruns. Reviews are attached by existing
  `destination_slug` only while unlinked, including inactive/deleted reviews;
  their original `updated_at` is explicitly preserved. No City is changed.

Keep the two source catalogue modules available until all target environments
have completed their backfill. The integration test uses an in-memory Prisma
test double and verifies mapping, preservation, idempotency and preflight errors;
it does not establish PostgreSQL execution or deployment success.
