# Spec 048 — staged landing migration

The final feature branch declares a required review `destination_id` relation
and contains no nullable-relation fallbacks in its runtime queries. Use the
nullable **expand-stage revision** for the migration and backfill steps below;
the final runtime revision must only run after required-relation enforcement.
**The complete feature branch is not deployable until the expand migration,
generated Prisma client, backfill, verification and required-relation enforcement
have all completed.** Intermediate commits must not be deployed. No runtime
compatibility gate substitutes for this deployment prerequisite.

The additive SQL was generated offline with Prisma 5.22.0 from the schema before
this change and `prisma/schema.prisma`:

```sh
npx prisma migrate diff --from-schema-datamodel <before.prisma> --to-schema-datamodel prisma/schema.prisma --script
```

No database was connected or changed while producing this migration. The SQL
contains only the enum, tables, indexes, optional review foreign key and
`deleted_with_destination` review marker. The marker addition was also generated
offline by diffing the pre-marker and current Prisma schemas.

## Deployment order

1. Confirm the target database/environment and arrange a maintenance window for
   review writes. Keep the existing deployed application until the stages below pass;
   use the feature checkout only for the offline/generated client and migration
   commands, without serving its runtime queries.
   Check out nullable expand-stage commit `418b8cf` (full commit identity must
   be verified in the target repository before deployment). In that revision's `prisma/schema.prisma`,
   `LocalLandingReview.destination_id` is `String?` and its `destination`
   relation is `LocalLandingDestination?`. Do not use a revision that has
   already made either field required for this backfill stage.
   Carry the reviewed `prisma/backfill-local-landing-destinations.ts` and both
   frozen modules in `prisma/local-landing-source/` from the final feature branch
   into this nullable-stage checkout: the script freezes the six
   concierge services and four process steps actually displayed at `40eed0f`.
   The original expand-stage script incorrectly used older catalogue blocks;
   do not run that historical version. Keep the expand-stage schema nullable.
2. Apply the additive migration from that nullable-stage revision with
   `npx prisma migrate deploy` against the confirmed environment.
3. Run `npm run db:generate` on the same nullable-stage revision before the
   backfill. `prisma migrate deploy` applies database migrations but does not
   generate Prisma Client; the backfill needs a client generated from that
   revision's nullable `prisma/schema.prisma`, including the new destination
   and page models and the optional review relation.
4. Run `npm run db:backfill:local-landings` against that confirmed environment.
   It requires all four existing, non-deleted City rows. Missing Cities or an
   unlinked review with an unknown destination slug fail before writes. All
   destination/page creation and review links are one Prisma transaction.
5. Rerun the command and confirm `attachedReviews: 0`. The output reports
   `processedDestinations: 4` and `processedPages: 12` on both runs; these count
   processed sources, not newly created rows. Through Prisma, check that
   `localLandingReview.count({ where: { destination_id: null } })` is zero and
   each imported destination has exactly the three expected intentions. Keep
   review writes paused through required-relation enforcement.
6. Save the nullable-stage schema as a temporary before snapshot, then generate
   the follow-up migration with the same offline Prisma schema diff command
   against this final branch's required `LocalLandingReview.destination_id` and
   `destination` relation, targeting a new timestamped migration directory.
   This generated migration sets the column to NOT NULL and replaces the optional
   foreign key with the required-relation foreign key. Review and apply it through
   Prisma. Then switch to the final feature branch, regenerate its Prisma client,
   typecheck it, and only then enable its persisted queries and review writers.
   Those runtime queries intentionally use only `destination_id` because every
   review is linked by the completed backfill. Only after every step passes may
   the complete feature branch be deployed; do not deploy intermediate commits to
   run the expand stage.

The enforcement migration is intentionally not included in the automatic
migration chain yet: Prisma deploy would otherwise apply it before the
TypeScript backfill can run, failing for every database containing old reviews.
The backfill uses the nullable-stage client and must run before the final branch
client is generated for the required schema; it remains safe to rerun during
stage 5.

## Content mapping and preservation

- Conciergerie maps the **currently displayed detailed content** from
  `concierge-landings.ts`: promise → `hero_title`, heroCopy → `hero_copy`,
  reassurance, ownerTitle/ownerCopy → section fields, localHeading/localCopy →
  local fields, and its full FAQ. SEO, eyebrow, H1 and CTA come from the
  destination catalogue. The six services → `highlights`, four process steps →
  `steps`, and exact process title `Comment se passe la mise en gestion ?` are
  frozen in the backfill from `LocalConciergeLanding.tsx` at commit `40eed0f`;
  their titles, copy and order are preserved verbatim. Superseded general concierge
  prose remains in the frozen `prisma/local-landing-source/destinations.ts`; it is not substituted for
  the detailed public page. The historically rendered eyebrow is exactly
  `Conciergerie locale`, and the previous metadata title is
  `Conciergerie à <City name> | MyStay`; the catalogue eyebrow is not substituted.
- Séminaires maps every catalogue scalar and repeatable block. `hero_title`
  reuses the current H1 so the historical hero is unchanged. The exact previous
  metadata title is `Séminaire à <City name> | MyStay`.
- Locations maps every existing content field. Its previous metadata title is
  `Locations de vacances à <City name> | MyStay`. The new hero and section fields
  reuse its reviewed H1/intro. The CTA preserves the published page's
  “Nos adresses locales” link to `/decouvrir` from `40eed0f`.
- Saint-Gervais-les-Bains and Saint-Nicolas-de-Véroce remain active; Megève and
  Combloux remain inactive, including their incomplete service drafts. Active
  imported content is validated with the publication input schema before writes.
- Empty upsert updates preserve all existing destination/page content, status,
  audit dates and soft deletion on reruns. Reviews are attached by existing
  `destination_slug` only while unlinked, including inactive/deleted reviews;
  their original `updated_at` is explicitly preserved. No City is changed.
  The corrected concierge source therefore applies only to pages first created
  by this import. Rerunning it never replaces existing Admin-authored blocks,
  including pages created by an earlier version of the script.
- The expand migration initializes `deleted_with_destination` to `false` for
  every existing review. Individual archive/restore preserves that value. Group
  deletion sets it to `true`; reinitializing a destination never resets it, and
  Admin/public readers and restore queries permanently exclude those reviews.
  Backfill reruns preserve this marker as well as the review content and dates.

The two source catalogue modules are frozen in `prisma/local-landing-source/`
for migration only. No runtime file in `src/` imports or exports either catalogue.
Keep these modules available until all target environments have completed their
backfill. The integration test uses an in-memory Prisma
test double and verifies mapping, preservation, idempotency and preflight errors.
The public concierge test renders the imported DTO and checks all six services
and four steps against independent verbatim fixtures from the former component;
it does not establish PostgreSQL execution or deployment success.
