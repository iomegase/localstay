# POI Description Assistance Implementation Plan

**Goal:** Implement approved spec 049: official source first, sourced Gemini web
fallback when website is absent, separate admin review and existing PATCH save.

**Architecture:** A read-only query loads the saved POI identity. A bounded,
DNS-pinned HTTP reader extracts official content using the existing extractor.
A dedicated Gemini service validates descriptions and provider source metadata.
A client review component applies accepted text to the existing edit form.

**Tech Stack:** Next.js Node route, Prisma, Zod, existing Gemini SDK, React,
Shadcn, Jest and Playwright.

Execution is local and autonomous. Follow AGENTS.md source-before-tests order;
this takes precedence over the generic TDD skill sequence. No migration.

- [x] Approve spec 049 and document the ADR-008 extension.
- [x] Create `src/features/poi-description-assistance/lib/contracts.ts` with
  schemas for POI identity, suggestion, sources and readable domain errors.
- [x] Create `services/official-source.ts`: allow only public HTTP(S), validate
  every DNS result and redirect, pin the connection to the validated address,
  cap timeout/redirects/body, reuse official text extraction.
- [x] Create `services/generate-description.ts`: use official content or Google
  Search, reject insufficient evidence/mismatches/invalid outputs, preserve
  provider citations and search entry point, never log raw provider content.
- [x] Create `queries/suggest-description.ts` and
  `src/app/api/admin/pois/[id]/suggest-description/route.ts`: admin authentication,
  UUID validation, archived/missing handling, no database mutation.
- [x] Add `components/PoiDescriptionAssistant.tsx` and integrate it in
  `src/features/admin-pois/components/AdminPoiEditForm.tsx`. Keep draft separate,
  require accept then save, block stale identity, duplicate clicks and invalid text.
- [x] Add unit tests for reader boundaries, service source modes, model refusals
  and errors; contract tests for authorization/validation; integration tests for
  generation/accept/cancel/save and existing audit/publication rules; add local
  authenticated E2E coverage for accept/save and cancel.
- [x] Run focused Jest suites, `npx tsc --noEmit`, targeted ESLint, and browser
  verification if a local authenticated session is available. Report limitations
  explicitly; do not manufacture credentials or modify real POIs for tests.
- [x] Update `docs/traceability-matrix.md` for AC-01 through AC-08 and review
  the diff against the approved spec.

Validation terminée : 165 tests ciblés réussis ; TypeScript et lint des nouveaux fichiers réussis. Aperçu du composant vérifié dans Chromium (375/1100 px, annuler/appliquer, aucune erreur JS). E2E authentifié ajouté mais ignoré sans session locale. Essai réel : site officiel lu puis Gemini HTTP 503 ; aucune écriture de POI.
