# SEO / GEO Content Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a reproducible, read-only audit of public POI and lodging content, remove the one approved `/concept` placeholder, and deliver a versioned report without rewriting or depublishing business content.

**Architecture:** Implement pure normalization, similarity, and contradiction detectors behind typed audit records; isolate Prisma in read-only query functions that reuse current publication/eligibility rules; render a deterministic Markdown report from findings; expose a local script that can write only under `docs/audits/`. Keep all findings advisory and require Product Owner review for business contradictions.

**Tech Stack:** TypeScript strict, Prisma, existing SEO/structured-data helpers, Jest/Testing Library, Node/tsx script, Markdown documentation.

---

## Preconditions and guardrails

- Approved source spec: `specs/features/043-seo-content-quality/spec.md`.
- Dependency: implement and verify spec 042 before generating the final report so public lodging URLs are `/logements/{slug}`.
- No Prisma migration, API route, design change, data mutation, web scraping, automated rewrite, or automated unpublication is allowed.
- The script may read public records and write the requested report only. It must not include `lodging_id`, stay cookie values, access codes, private Tourist/Owner/Merchant data, or QR tokens.
- POI/profile public entity identifiers required by AC-01-02 are allowed; a private Lodging/stay UUID is not.
- If the audit exposes a lodging contradiction, report it and stop before any data correction. Resolution is a separate Product Owner decision.

## Task 1: Implement deterministic text normalization and similarity

**Files:**

- Create: `src/features/seo-content-audit/types.ts`
- Create: `src/features/seo-content-audit/lib/text-audit.ts`
- Create: `tests/unit/seo-content-quality.AC-01-03.text-audit.test.ts`

- [ ] **Step 1: Define the report contract in a failing test**

Create the exact spec type:

```ts
export type SeoContentAuditFinding = {
  publicUrl: string
  entityType: 'poi' | 'lodging' | 'public-page'
  entityId: string | null
  code:
    | 'CONTENT_TOO_THIN'
    | 'EXACT_INTERNAL_DUPLICATE'
    | 'HIGH_INTERNAL_SIMILARITY'
    | 'PLACEHOLDER_CONTENT'
    | 'EXTERNAL_SOURCE_REVIEW_REQUIRED'
    | 'LODGING_STRUCTURED_TEXT_CONFLICT'
    | 'JSON_LD_VISIBLE_CONTENT_CONFLICT'
  evidence: string[]
  updatedAt: string | null
  requiresOwnerDecision: boolean
}
```

Test that `normalizeAuditText('  École,  de  Ski ! ')` returns `ecole de ski`.

- [ ] **Step 2: Add failing rule tests**

Cover:

- empty/blank/79-character description → `CONTENT_TOO_THIN`;
- 80 characters → not thin;
- `Lorem ipsum`, `TODO`, `TBD`, `placeholder`, `description des principes`, `...`, and `……` → `PLACEHOLDER_CONTENT`;
- normal prose containing a legitimate form concept is not scanned as a DOM attribute;
- normalized equal strings → exact duplicate;
- two non-identical descriptions of at least 120 normalized characters and Jaccard word-trigram score `>= 0.85` → high similarity;
- shorter descriptions do not enter the similarity rule;
- evidence says “indicateur de similarité” and never “plagiat”.

- [ ] **Step 3: Run and confirm missing implementation**

```bash
npm test -- --runInBand tests/unit/seo-content-quality.AC-01-03.text-audit.test.ts
```

Expected: FAIL.

- [ ] **Step 4: Implement pure normalization and Jaccard helpers**

Normalization order:

```ts
value
  .normalize('NFKD')
  .replace(/\p{Mark}+/gu, '')
  .toLowerCase()
  .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
  .trim()
  .replace(/\s+/g, ' ')
```

Build word trigrams as a `Set<string>`, then `intersection.size / union.size`. Return `0` when a union cannot be formed. Treat exact duplicates as `EXACT_INTERNAL_DUPLICATE` only, not a redundant high-similarity finding.

- [ ] **Step 5: Rerun and commit**

```bash
npm test -- --runInBand tests/unit/seo-content-quality.AC-01-03.text-audit.test.ts
git add src/features/seo-content-audit/types.ts src/features/seo-content-audit/lib/text-audit.ts tests/unit/seo-content-quality.AC-01-03.text-audit.test.ts
git commit -m "feat(seo-audit): add deterministic text quality rules"
```

## Task 2: Read and audit only eligible public POIs

**Files:**

- Create: `src/features/seo-content-audit/queries/audit-data.ts`
- Create: `src/features/seo-content-audit/lib/poi-audit.ts`
- Create: `tests/integration/seo-content-quality.AC-01-01.audit-data.test.ts`
- Create: `tests/unit/seo-content-quality.AC-01-04.poi-audit.test.ts`

- [ ] **Step 1: Write a failing Prisma-boundary test**

Mock `prisma.pointOfInterest.findMany` and assert the query requires:

```ts
{
  discovery_status: 'PUBLISHED',
  discovery_published_at: { not: null },
  is_active: true,
  deleted_at: null,
  geocode_status: 'success',
}
```

It must select only public audit fields, City/category/subcategory eligibility data, and acquisition provenance (`source`, candidate `description`, `website`, and run source when available). After the database filter, pass every row through `getDiscoveryPoiVisibility` to preserve the 15/30 km and publication rules.

Assert no mutation method is called.

- [ ] **Step 2: Write failing POI audit tests**

Each finding must carry profile-safe public data:

```ts
{
  publicUrl: '/decouvrir/annecy/restaurants/le-serac',
  entityType: 'poi',
  entityId: 'poi-1',
  updatedAt: '2026-08-20T10:00:00.000Z',
}
```

Test City/name/category evidence, exact duplicate pairs referencing both URLs, reproducible Jaccard score rounded consistently, and external provenance as `EXTERNAL_SOURCE_REVIEW_REQUIRED`. External-source evidence must be minimal and must not reproduce a full candidate description.

- [ ] **Step 3: Run and confirm failures**

```bash
npm test -- --runInBand tests/integration/seo-content-quality.AC-01-01.audit-data.test.ts tests/unit/seo-content-quality.AC-01-04.poi-audit.test.ts
```

- [ ] **Step 4: Implement public POI mapping and pairwise audit**

Construct public URLs only from canonical slugs:

```ts
`/decouvrir/${citySlug}/${categorySlug}/${poiSlug}`
```

Sort POIs by public URL before comparing so output is reproducible. Perform exact grouping first, then compare non-identical descriptions meeting the 120-character threshold. A known acquisition source creates a human-review flag; it never concludes copying and triggers no network call.

- [ ] **Step 5: Rerun and commit**

```bash
npm test -- --runInBand tests/integration/seo-content-quality.AC-01-01.audit-data.test.ts tests/unit/seo-content-quality.AC-01-04.poi-audit.test.ts
git add src/features/seo-content-audit/queries/audit-data.ts src/features/seo-content-audit/lib/poi-audit.ts tests/integration/seo-content-quality.AC-01-01.audit-data.test.ts tests/unit/seo-content-quality.AC-01-04.poi-audit.test.ts
git commit -m "feat(seo-audit): inspect eligible public poi content"
```

## Task 3: Detect explicit lodging text and JSON-LD contradictions

**Files:**

- Modify: `src/features/seo-content-audit/queries/audit-data.ts`
- Create: `src/features/seo-content-audit/lib/lodging-audit.ts`
- Create: `tests/unit/seo-content-quality.AC-03-01.lodging-audit.test.ts`
- Modify: `tests/integration/seo-content-quality.AC-01-01.audit-data.test.ts`

- [ ] **Step 1: Extend the failing read-only query test**

Require only profiles with:

```ts
{
  publication_status: 'published',
  deleted_at: null,
  city: { is_active: true, deleted_at: null },
  lodging: { is_active: true, deleted_at: null },
}
```

Select profile `id` (not `lodging_id`), slug, timestamps, visible descriptions, numeric facts, public location label, City public name/slug, and non-deleted amenity code/label/availability.

- [ ] **Step 2: Write failing numeric contradiction tests**

Parse only explicit labelled values:

```text
70 m²
6 voyageurs / 6 personnes
3 chambres
4 lits / 4 couchages
2 salles de bain
```

Assert a mismatch emits `LODGING_STRUCTURED_TEXT_CONFLICT` with the structured value, a short contradictory excerpt, `/logements/{slug}`, and `requiresOwnerDecision: true`. An absent mention emits nothing.

- [ ] **Step 3: Write failing location/equipment tests**

- A different known City after an explicit cue such as `situé à`, `située à`, `au cœur de`, or `dans le centre de` is flagged.
- An incidental nearby-City mention without a location cue is not flagged.
- `sans Wi-Fi`, `pas de parking`, or `ne dispose pas de cuisine` conflicts only when that amenity is structurally present.
- Missing amenity prose is not a conflict.

- [ ] **Step 4: Write failing JSON-LD parity tests**

Build the existing lodging schemas from the audit row. Validate schema facts for occupancy, rooms, beds, bathrooms, floor size, amenities, location, URL, and provider against structured/visible inputs. An injected schema value not justified by those inputs emits `JSON_LD_VISIBLE_CONTENT_CONFLICT`; no database change occurs.

- [ ] **Step 5: Run and confirm failures**

```bash
npm test -- --runInBand tests/unit/seo-content-quality.AC-03-01.lodging-audit.test.ts tests/integration/seo-content-quality.AC-01-01.audit-data.test.ts
```

- [ ] **Step 6: Implement conservative extraction**

Use named regex descriptors and capture the shortest sentence around a match. Normalize decimal comma for bathroom counts. Compare only explicit matches; never infer a contradiction from silence. Use the public URL helper delivered by spec 042.

- [ ] **Step 7: Rerun and commit**

```bash
npm test -- --runInBand tests/unit/seo-content-quality.AC-03-01.lodging-audit.test.ts tests/integration/seo-content-quality.AC-01-01.audit-data.test.ts
git add src/features/seo-content-audit/queries/audit-data.ts src/features/seo-content-audit/lib/lodging-audit.ts tests/unit/seo-content-quality.AC-03-01.lodging-audit.test.ts tests/integration/seo-content-quality.AC-01-01.audit-data.test.ts
git commit -m "feat(seo-audit): report lodging content contradictions"
```

## Task 4: Render a deterministic, privacy-safe Markdown report

**Files:**

- Create: `src/features/seo-content-audit/lib/report.ts`
- Create: `tests/unit/seo-content-quality.AC-05-01.report.test.ts`

- [ ] **Step 1: Write failing report structure tests**

Required sections:

```markdown
# Audit qualité SEO / GEO des contenus publics
## Résumé
## Méthode reproductible
## Résultats POI
## Contradictions logements
## Structure éditoriale recommandée
## Décisions Product Owner requises
```

The target editorial structure must list `description factuelle`, `conseil MyStay`, `informations pratiques`, `source externe éventuelle`, and `date de mise à jour`, explicitly as a documentation proposal with no Prisma migration.

- [ ] **Step 2: Add failing summary/privacy tests**

Assert totals include all audited entities but detail tables include findings only. Output is sorted by code and public URL. Reject secrets with defensive patterns for `lodging=`, stay-cookie names, `token=`, `password`, access codes, and UUIDs associated with stay query/cookie evidence. Allow the public entity identifier required by AC-01-02, but never render `lodging_id`.

- [ ] **Step 3: Run and confirm failure**

```bash
npm test -- --runInBand tests/unit/seo-content-quality.AC-05-01.report.test.ts
```

- [ ] **Step 4: Implement escaping, truncation, and sections**

- Escape Markdown table separators/newlines.
- Limit evidence excerpts to a documented maximum such as 180 characters.
- Label similarity as an indicator, never proof.
- List `Aucune` for an empty findings section.
- Put every `requiresOwnerDecision` finding in the final decision section without selecting a value.
- Include the method constants: 80 characters, 120 characters, NFKD, word trigrams, and Jaccard `0.85`.

- [ ] **Step 5: Rerun and commit**

```bash
npm test -- --runInBand tests/unit/seo-content-quality.AC-05-01.report.test.ts
git add src/features/seo-content-audit/lib/report.ts tests/unit/seo-content-quality.AC-05-01.report.test.ts
git commit -m "feat(seo-audit): render privacy-safe content report"
```

## Task 5: Remove the approved `/concept` placeholder without inventing copy

**Files:**

- Modify: `src/app/(public)/concept/page.tsx`
- Create: `tests/integration/seo-content-quality.AC-04-02.concept-placeholder.test.tsx`

- [ ] **Step 1: Write the failing rendered-output test**

Render `ConceptPage` and assert:

```ts
expect(screen.queryByText(/description des principes/i)).not.toBeInTheDocument()
expect(screen.getByRole('heading', {
  name: 'Une présence locale et identifiable',
})).toBeInTheDocument()
expect(screen.getByRole('heading', {
  name: 'Des besoins anticipés avec justesse',
})).toBeInTheDocument()
expect(screen.getByRole('heading', {
  name: 'Chaque logement valorisé durablement',
})).toBeInTheDocument()
```

Also assert the principle wrapper contains no empty paragraph element.

- [ ] **Step 2: Run and confirm the placeholder is rendered**

```bash
npm test -- --runInBand tests/integration/seo-content-quality.AC-04-02.concept-placeholder.test.tsx
```

Expected: FAIL on `description des principes`.

- [ ] **Step 3: Remove only the unapproved paragraph**

Delete:

```tsx
<p>description des principes</p>
```

Keep the three headings, section order, responsive layout, numbering, colors, and spacing utilities otherwise unchanged. Add no replacement sentence.

- [ ] **Step 4: Rerun and inspect other manifest editorial markers**

```bash
npm test -- --runInBand tests/integration/seo-content-quality.AC-04-02.concept-placeholder.test.tsx
rg -n -i "lorem ipsum|description des principes|>\s*(todo|tbd|placeholder|\.{3}|…+)\s*<" 'src/app/(public)' src/features
```

Expected: test PASS. Review each search result; input `placeholder` attributes, comments, tests, and technical labels are not findings. Remove another rendered editorial marker only when it is equally manifest and the containing block remains useful; otherwise document it and follow the Product Owner decision rule.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(public)'/concept/page.tsx tests/integration/seo-content-quality.AC-04-02.concept-placeholder.test.tsx
git commit -m "fix(content): remove concept placeholder copy"
```

## Task 6: Orchestrate the read-only audit and generate the versioned report

**Files:**

- Create: `src/features/seo-content-audit/lib/audit.ts`
- Create: `scripts/audit-seo-content.ts`
- Modify: `package.json`
- Create: `tests/integration/seo-content-quality.AC-03-04.read-only-runner.test.ts`
- Create: `docs/audits/seo-content-quality-2026-08-28.md` by running the script

- [ ] **Step 1: Write a failing orchestration test**

Mock the two read queries and assert `runSeoContentAudit()`:

- counts all audited public POIs and lodging profiles;
- passes rows into the pure POI/lodging detectors;
- combines and deterministically sorts findings;
- performs no `create`, `update`, `upsert`, `delete`, `deleteMany`, `$executeRaw`, HTTP fetch, or publication call;
- returns data to the renderer without writing a database field.

- [ ] **Step 2: Run and confirm failure**

```bash
npm test -- --runInBand tests/integration/seo-content-quality.AC-03-04.read-only-runner.test.ts
```

- [ ] **Step 3: Implement the typed orchestrator**

```ts
export type SeoContentAuditResult = {
  generatedAt: string
  auditedPoiCount: number
  auditedLodgingCount: number
  findings: SeoContentAuditFinding[]
}
```

Accept the clock as an optional dependency in tests. Use `Promise.all` for the two independent read queries, then pure audit functions. No function in this feature accepts a Prisma mutation client.

- [ ] **Step 4: Add a guarded report CLI**

Add:

```json
"audit:seo-content": "tsx scripts/audit-seo-content.ts"
```

Support explicit `--output` and `--date`. Resolve the output path and reject anything outside `docs/audits/`. Create the target directory if needed, write UTF-8 Markdown, log counts and path, and disconnect Prisma in `finally`. Findings are a successful audit result; do not return a failing exit code just because Product Owner decisions are listed.

- [ ] **Step 5: Rerun the automated audit tests**

```bash
npm test -- --runInBand \
  tests/unit/seo-content-quality.AC-01-03.text-audit.test.ts \
  tests/unit/seo-content-quality.AC-01-04.poi-audit.test.ts \
  tests/unit/seo-content-quality.AC-03-01.lodging-audit.test.ts \
  tests/unit/seo-content-quality.AC-05-01.report.test.ts \
  tests/integration/seo-content-quality.AC-01-01.audit-data.test.ts \
  tests/integration/seo-content-quality.AC-03-04.read-only-runner.test.ts
```

Expected: PASS.

- [ ] **Step 6: Generate the real versioned report**

```bash
npm run audit:seo-content -- --date 2026-08-28 --output docs/audits/seo-content-quality-2026-08-28.md
```

Expected console shape:

```text
Audited public POIs: [runtime integer]
Audited public lodgings: [runtime integer]
Findings: [runtime integer]
Report written: docs/audits/seo-content-quality-2026-08-28.md
```

If the database is unavailable, do not create a fabricated empty report. Resolve only local configuration issues already covered by the project setup; otherwise report the execution blocker. If contradictions are present, leave them in the report and do not alter Prisma data.

- [ ] **Step 7: Inspect the generated report for private-data leakage**

```bash
rg -n -i "lodging=|stay.*cookie|token=|password|mot de passe|code d'accès|owner_email|merchant_email|tourist" docs/audits/seo-content-quality-2026-08-28.md
```

Expected: no private value. Method prose mentioning that private data is excluded is acceptable only after manual inspection of the matching line.

- [ ] **Step 8: Commit code and report**

```bash
git add src/features/seo-content-audit/lib/audit.ts scripts/audit-seo-content.ts package.json tests/integration/seo-content-quality.AC-03-04.read-only-runner.test.ts docs/audits/seo-content-quality-2026-08-28.md
git commit -m "feat(seo-audit): generate public content quality report"
```

## Task 7: Complete traceability and full verification

**Files:**

- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Map every AC-01-01 through AC-05-03**

Add rows for spec `043-seo-content-quality`, each naming the precise detector/query/report/source file and exact test. Mark the documentation-review criteria with the generated report path. Keep AC-02-02 linked to the schema-regression/no-migration check.

- [ ] **Step 2: Prove this feature has no schema or mutation surface**

```bash
git diff --exit-code -- prisma/schema.prisma
rg -n "prisma\..*\.(create|update|upsert|delete|deleteMany)|\$executeRaw|fetch\(" src/features/seo-content-audit scripts/audit-seo-content.ts
```

Expected: no schema diff attributable to spec 043 and no mutation/network call. If spec 042 was implemented in the same uncommitted tree, compare against its completed commit rather than reverting its approved global-slug schema change.

- [ ] **Step 3: Run all quality gates**

```bash
npm run lint
npm test -- --runInBand
npm run build
```

Expected: all exit `0`.

- [ ] **Step 4: Check formatting and final scope**

```bash
git diff --check
git status --short
```

Expected: only spec-043 audit, `/concept` placeholder removal, versioned report, tests, package command, and traceability changes.

- [ ] **Step 5: Commit traceability**

```bash
git add docs/traceability-matrix.md
git commit -m "docs(traceability): map seo content quality audit"
```

## Final coverage review

- US-01: Tasks 1–2 and Task 6.
- US-02: Task 4 documents the target editorial roles without changing Prisma.
- US-03: Task 3 plus the read-only regression in Task 6.
- US-04: Task 5, with no invented replacement copy.
- US-05: Tasks 4, 6, and 7.
- Data model/API: unchanged by explicit regression checks.
- Out of scope: no scraping, auto-rewrite, auto-unpublish, business-value correction, guide-private audit, UI redesign, or migration.
