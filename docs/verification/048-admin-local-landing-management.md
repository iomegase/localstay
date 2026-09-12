# Spec 048 — verification record

## Live migration checkpoint — 2026-09-12

The approved nullable expand migration
`20260908190000_add_local_landing_management` was applied to the configured
Supabase database with `prisma migrate deploy` (exit 0). From the pinned
`418b8cf` checkout, using the final reviewed backfill and frozen source modules,
the nullable Prisma client was generated and the backfill ran twice:

- First run: 4 destinations, 12 pages processed; 3 existing reviews attached.
- Second run: 4 destinations, 12 pages processed; 0 reviews attached.

A read-only query before the migration confirmed all four active City rows and
three reviews with known destination slugs. The planned post-backfill integrity
query was rejected by the tool's usage limit. **The required review relation
has not been enforced, the final branch has not been merged or deployed, and
the database migration is not complete.** The next operator must confirm zero
null review `destination_id` values and exactly three distinct page intents per
destination, then generate and apply the NOT NULL/foreign-key migration from
the nullable and final Prisma schemas. The offline diff contains only a foreign
key replacement and `ALTER COLUMN "destination_id" SET NOT NULL`. Keep review
writes paused until enforcement succeeds. The final Prisma client was regenerated
locally; TypeScript and 16 focused tests passed afterward.

The historical offline-only statements below describe the earlier verification
run, not this live migration checkpoint.

## Final-review follow-up — 2026-09-12

Subsequent active-save regression: the draft relaxation originally allowed an
already-active destination to save incomplete Concierge or Seminar content,
making public routes disappear while the slider remained ON. A failing
integration test reproduced both scalar and nested-placeholder variants. The
update transaction now validates both service pages before its first page
upsert; a rejected save preserves the persisted pages and active status.
Inactive draft saves and active saves with incomplete Locations remain allowed.
The focused five-suite offline rerun passed 92/92 tests. No live database or
deployment was used for this follow-up.

The final-review fixes remain offline-only. A saved draft may contain incomplete
fields and blank Locations while retaining typed repeatable blocks and safe CTA
URLs. Publication uses the stricter schema for both service intentions, including
nested placeholders; Locations remains unpublishable until its own content and
eligible inventory are complete. A mocked Prisma lifecycle covers create and
reinitialize → progressive save → activation → public reads. The public tests
cover an edited Concierge eyebrow, distinct Seminar hero title, exact absolute
SEO metadata, and a single responsive inline Admin editor. Review POST/PATCH
malformed JSON returns structured 400 errors. The API contract now records
anonymous 401 and missing-City POST 404, and the staged migration runbook pins
the verified nullable checkout at `418b8cf`.

Verification: initial focused run 7 suites / 103 tests passed. A wider run
exposed one historical 046 assertion that still expected the formerly hardcoded
Concierge eyebrow despite a custom persisted fixture value; that assertion was
updated to the persisted field. A new 401 contract test initially reused a
consumed Response body; its session double now returns a fresh Response per call.
Final offline targeted run: **32 suites / 255 tests passed**, including local
landing, local SEO, review API, sitemap, and robots boundaries. `npx prisma
validate`, `npx prisma generate`, `npx tsc --noEmit`, and targeted `npx eslint
--quiet` exited 0. Prisma commands and Jest used offline database URL overrides.
No live migration, backfill, browser fixture, production build, or deployment
was run. The historical full-suite/build limitations below remain applicable.

Date: 2026-09-11. Branch: `feature/admin-local-landing-management`.
Task 8 starts from `276b4b9`; pre-feature code reference:
`42b44f4b136d231a9fa180bb4c0b260c0e8cc9d9`.

## Result and limits

Implementation and cleanup are complete offline. This is **not** a full green
build or deployment sign-off. The complete branch must not be deployed before
the staged migration, generated nullable client, backfill twice, integrity
verification, required-relation enforcement and final generated client described
in [the migration runbook](../../prisma/local-landing-migration.md).

No migration, backfill, deployment or successful remote database connection was
performed. The first unrestricted Jest invocation loaded the existing environment;
the unchanged Gemini integration suite failed on its first `city.findFirst`
connection attempt. No test mutation ran. All subsequent full/focused runs and
both build attempts explicitly override `DATABASE_URL` and `DIRECT_URL` with
`postgresql://offline:offline@127.0.0.1:1/offline`. Use these overrides for future
offline verification: the historical Gemini integration suite requires a real
database and contains writes.

## Checks

| Check | Result |
|---|---|
| `npx prisma validate` | Exit 0, schema valid |
| `npx prisma generate` | Exit 0, Prisma Client 5.22.0 generated locally, no generated client committed |
| TDD for empty hubs and stale delete-dialog errors | Red: 5 failed / 13 passed. Green: 3 suites / 27 tests passed including backfill; later preservation assertion included in focused/full counts below |
| Exact affected Jest suites below | 41 suites: 39 passed, 2 failed. 281 tests: 279 passed, 2 failed (existing editorial assertions) |
| `npm test -- --runInBand` with offline DB overrides | 474 suites: 459 passed, 14 failed, 1 skipped. 2263 tests: 2242 passed, 20 failed, 1 skipped |
| `npm run lint` | Exit 0, 0 errors / 257 warnings; no warnings in local-seo modules |
| `npx tsc --noEmit` | Exit 0 |
| `npm run build` in sandbox | Exit 1: existing Google Fonts downloads failed for Big Shoulders Inline, Playfair Display, Plus Jakarta Sans and Story Script |
| Build retried with network permission and offline DB overrides | Compiled successfully (20.7 s), TypeScript completed (13.6 s); exit 1 collecting page data for `/conciergerie/[city-slug]`: `localLandingDestination.findMany` cannot reach `127.0.0.1:1` |
| Playwright local lifecycle | 1 skipped, 0 executed; Admin/City fixture absent. No server started |
| `git diff --check` | Exit 0 |
| Static catalogue search in `src` | No matches |
| Frozen catalogue preservation | Both moved files byte-identical to their originals after removing the added freeze comment |

The first network-build permission review timed out. Its one permitted retry was
approved and produced the compilation/data-collection result above. No application
fallback or fabricated database fixture was added to make the build pass.

The full suite's 14 failures match the reported pre-feature count (14 failed,
444 passed); the original run has no durable per-suite log. Comparison against
`42b44f4` shows the twelve unchanged failing suites and the code responsible for
their failing assertions were already present. The other two failing suites only
gained persisted-query mocks/async rendering in this feature; their failing
editorial assertions and corresponding page copy predate the branch. This
supports classification as existing failures; it is not a fresh execution of the
historical checkout or proof of an identical historical failure list.

## Full-suite failure inventory

Paths below are relative to `tests/`.

| Suite | Existing failure evidence |
|---|---|
| `integration/public-demo-private-reference.AC-01-01.navigation.test.tsx` | Missing expected “Nos logements” / “Blog” headings; test and guide-demo source unchanged |
| `integration/public-marketing.AC-01-01.home.test.tsx` | Old “Votre logement, géré avec soin” heading expectation; test and home source unchanged |
| `unit/public-home.anonymous.test.tsx` | Same old home heading; test and home source unchanged |
| `integration/blog.AC-02-01.article-detail.test.tsx` | Old “Continuer la lecture” heading expectation; test/blog source unchanged |
| `integration/public-marketing.AC-03-03.lodgings-page.test.tsx` | Old “Des séjours choisis” heading expectation; only query mock added, page editorial content unchanged |
| `integration/public-demo-private-reference.AC-01-02.lodging-guide.test.tsx` | Old arrival-card `bg-slate-900` expectation; test and guide-demo source unchanged |
| `integration/public-discovery.AC-01-03.pages.test.tsx` | Configured localhost URL versus hardcoded production URL; test and SEO source unchanged |
| `unit/public-demo-private-reference.AC-02-02-03.security.test.ts` | Existing imports in DemoEditorialViews conflict with old isolation expectation; test/source unchanged |
| `integration/lodging-showcase.public-pages.test.tsx` | Configured localhost versus hardcoded production structured-data URL; assertion/source unchanged |
| `integration/blog.AC-01-01.public-list-published.test.tsx` | Old “Inspirations, conciergerie” heading expectation; test/blog source unchanged |
| `integration/public-marketing.AC-01-02.editorial-pages.test.tsx` | Old “Séminaires en Haute-Savoie” exact text; only mocks/async rendering changed, seminar editorial content unchanged |
| `integration/seo-content-quality.AC-04-02.concept-placeholder.test.tsx` | Old absence-of-paragraph expectation conflicts with existing concept copy; test/source unchanged |
| `unit/lodging-showcase.metadata.test.ts` | Configured localhost versus hardcoded production URL; test/metadata source unchanged |
| `integration/gemini-fetch.AC-01-03.cache-flow.test.ts` | Six tests fail beforeAll because a real DB is required; test/orchestrator unchanged. Offline rerun targets unreachable localhost |

No unrelated marketing copy or expectations were changed to remove these failures.

## Focused command

Run with offline database overrides above:

```sh
npm test -- --runInBand --runTestsByPath \
  tests/contract/dashboard.AC-lodgings.test.ts \
  tests/contract/local-landing-management.admin-api.test.ts \
  tests/contract/local-landing-reviews.admin-api.test.ts \
  tests/contract/lodging-showcase.admin-api.test.ts \
  tests/contract/public-discovery.AC-06.sitemap-route.test.ts \
  tests/integration/local-landing-management.AC-02-05.mutations.test.ts \
  tests/integration/local-landing-management.AC-06.backfill.test.ts \
  tests/integration/local-landing-management.admin-page.test.tsx \
  tests/integration/local-landing-management.hub-links.test.tsx \
  tests/integration/local-landing-management.public-routes.test.tsx \
  tests/integration/local-landing-reviews.admin-page.test.tsx \
  tests/integration/local-landing-reviews.public-page.test.tsx \
  tests/integration/local-seo.AC-01-02.service-pages.test.tsx \
  tests/integration/local-seo.AC-03-01-05.vacation-page.test.tsx \
  tests/integration/local-seo.AC-04-04.hub-links.test.tsx \
  tests/integration/local-seo.AC-06.concierge-mutualization.test.tsx \
  tests/integration/public-marketing.AC-01-02.editorial-pages.test.tsx \
  tests/integration/public-marketing.AC-03-03.lodgings-page.test.tsx \
  tests/unit/admin-hard-delete.user.test.ts \
  tests/unit/admin-lodgings.delete-route.test.ts \
  tests/unit/local-landing-management.AC-01-04.queries.test.ts \
  tests/unit/local-landing-management.admin-theme.test.ts \
  tests/unit/local-landing-management.lodging-publication-revalidation.test.ts \
  tests/unit/local-landing-management.owner-publication-revalidation.test.ts \
  tests/unit/local-landing-management.photo-revalidation.test.ts \
  tests/unit/local-landing-management.public-cache.test.ts \
  tests/unit/local-landing-management.publication.test.ts \
  tests/unit/local-landing-management.sitemap.test.ts \
  tests/unit/local-landing-management.validation.test.ts \
  tests/unit/local-landing-reviews.queries.test.ts \
  tests/unit/local-landing-reviews.validation.test.ts \
  tests/unit/local-seo.AC-01-02-03.access-policy.test.ts \
  tests/unit/local-seo.AC-01-02-04.catalog-metadata.test.ts \
  tests/unit/local-seo.AC-03-01.published-lodgings.test.ts \
  tests/unit/local-seo.AC-04-02.structured-data.test.ts \
  tests/unit/local-seo.AC-04-03.sitemap.test.ts \
  tests/unit/lodging-showcase.save-amenities.test.ts \
  tests/unit/seo-public-private.BR-11-13.global-lodging-slug.test.ts \
  tests/unit/seo-public-private.BR-15.lodging-revalidation.test.ts \
  tests/unit/seo.robots.test.ts \
  tests/unit/seo.sitemap.test.ts
```

This list includes every changed/new Jest suite from Tasks 1–8, remaining
046/047 regression suites, and sitemap/robots boundary suites. The two editorial
failures are retained in its reported result, not silently omitted.

## Cleanup and UI review

`rg -n "content/destinations|content/concierge-landings|localSeoDestinations" src`
returns no matches. Runtime intent types live in
`src/features/local-seo/types/landing-pages.ts`; the only catalogues are frozen
under `prisma/local-landing-source/` for the reviewed backfill and its preservation
tests. No credentials, generated clients or environment files are staged.

`LocalDestinationLinks` returns null when no destination is published. Opening a
delete dialog clears an unrelated parent error, while actual DELETE failures
remain visible and retryable. Existing component coverage proves both behaviors.
The React review kept those operations in the event handler and a simple early
return; no effect, extra fetch or conditional hook was introduced.

The sitemap's existing public boundary rejects `/guide/**`, including paths
returned accidentally by a mocked local catalogue query. Robots rules remain
unchanged: marketing routes are crawlable; admin/API/dashboard/merchant are
disallowed; private noindex pages remain crawlable so their noindex can be read.

## Required operational follow-up

1. In a dedicated confirmed environment, apply the additive migration and generate
   the nullable-stage client, carrying the final backfill script and both frozen
   source modules as documented in the migration runbook.
2. Run backfill twice, confirm no unattached reviews and exactly three intents per
   destination, preserving content and review state. Enforce the required review
   relation, then generate the final client.
3. Build against that prepared database. Do not deploy this complete branch or
   its intermediate runtime commits before all migration stages are complete.
4. Run the opt-in local Playwright Admin lifecycle with a dedicated City/session.
   Also verify service routes return 200 after activation, Locations 404 without
   inventory, and all three routes 404 after archive/delete. The existing
   Playwright test covers the UI lifecycle; public HTTP checks are still manual
   operational gates. Jest route tests do not replace those browser checks.

Guarded invocation used here:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 \
PLAYWRIGHT_ADMIN_STORAGE_STATE='' PLAYWRIGHT_LANDING_CITY='' \
npx playwright test tests/e2e/local-landing-management.admin-flow.test.ts --reporter=line
```

Local raw artifacts (not committed): `/private/tmp/staylocal-task8-safe-full-jest.json`,
`/private/tmp/staylocal-task8-focused-jest.json`,
`/private/tmp/staylocal-task8-lint.log`,
`/private/tmp/staylocal-task8-types.log`,
`/private/tmp/staylocal-task8-build.log`,
`/private/tmp/staylocal-task8-build-network.log`.
