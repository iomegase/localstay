# Stable Guide Child Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Préserver les UUID des blocs pratiques et instructions d'arrivée lors des sauvegardes du guide.

**Architecture:** Les normaliseurs distinguent les UUID persistants des identifiants UI `tmp-`. Deux synchroniseurs transactionnels valident l'appartenance au Lodging, mettent à jour les lignes conservées, créent les nouvelles et archivent uniquement les lignes retirées.

**Tech Stack:** Next.js 16, TypeScript strict, Prisma 5, PostgreSQL, Zod, Jest.

---

### Task 1: Preserve persistent identities during normalization

**Files:**
- Modify: `src/features/guide-customization/lib/validation.ts`
- Modify: `src/features/guide-customization/components/PracticalBlocksEditor.tsx`
- Modify: `src/features/guide-customization/components/ArrivalInstructionsEditor.tsx`
- Test: `tests/unit/guide-customization.practical-blocks-normalize.test.ts`
- Test: `tests/unit/guide-customization.arrival-instructions-normalize.test.ts`

- [x] **Step 1: Write failing tests**

Assert that `block-1` and `instruction-1` survive normalization while
`tmp-new-block` and `tmp-new-instruction` are omitted from normalized output.

- [x] **Step 2: Run tests and observe RED**

Run:

```bash
npm test -- tests/unit/guide-customization.practical-blocks-normalize.test.ts tests/unit/guide-customization.arrival-instructions-normalize.test.ts --runInBand
```

Expected: failures because normalized results currently omit every `id`.

- [x] **Step 3: Implement identity normalization**

Add optional `id` to normalized child types, preserve trimmed IDs except those
prefixed by `tmp-`, and make both editors always create `tmp-` IDs.

- [x] **Step 4: Verify GREEN**

Run the Task 1 command and expect both suites to pass.

### Task 2: Synchronize child rows differentially

**Files:**
- Modify: `src/features/guide-customization/queries/customization.ts`
- Modify: `src/features/guide-customization/types.ts`
- Test: `tests/unit/guide-customization.practical-blocks-save.test.ts`
- Test: `tests/unit/guide-customization.arrival-instructions-save.test.ts`

- [x] **Step 1: Write failing transaction tests**

Assert `update` for retained UUIDs, `create` only for new rows, and
`updateMany` restricted to removed active UUIDs. Assert a foreign UUID raises
`INVALID_CHILD_ITEM_ID` before mutation.

- [x] **Step 2: Run tests and observe RED**

Run:

```bash
npm test -- tests/unit/guide-customization.practical-blocks-save.test.ts tests/unit/guide-customization.arrival-instructions-save.test.ts --runInBand
```

Expected: failures because production still archives all rows and calls
`createMany`.

- [x] **Step 3: Implement transactional synchronizers**

Read active IDs through the transaction client, reject duplicate or unknown
persisted IDs, update retained rows by UUID, create rows without persistent
IDs, then soft-delete only the remaining active IDs.

- [x] **Step 4: Verify GREEN and regressions**

Run the four Task 1 and Task 2 suites and the existing customization contract,
media, trash-bin, editor and private-guide query suites.

### Task 3: Complete API error mapping and traceability

**Files:**
- Modify: `src/app/api/dashboard/lodgings/[id]/customization/route.ts`
- Modify: `tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts`
- Modify: `docs/traceability-matrix.md`

- [x] **Step 1: Add contract coverage**

Assert an `INVALID_CHILD_ITEM_ID` domain error maps to a 400 response with the
standard error envelope.

- [x] **Step 2: Implement the exact mapping**

Return code `INVALID_CHILD_ITEM_ID`, message `Élément du guide invalide` and
empty details with HTTP 400.

- [x] **Step 3: Run final verification**

Run focused Jest suites, `npx tsc --noEmit`, scoped ESLint and
`git diff --check`; then update the spec 012 traceability row and commit.
