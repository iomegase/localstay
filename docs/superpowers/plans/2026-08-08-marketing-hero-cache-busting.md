# Marketing Hero Cache Busting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Force Vercel and `next/image` to generate and serve the newly supplied marketing hero instead of a cached transform of the previous binary.

**Architecture:** Version the public asset pathname from `hero-chalet.png` to `hero-chalet-v2.png` and update every active consumer. Protect the cache key with a source-level regression test and document the behavior in approved spec 031 and the traceability matrix.

**Tech Stack:** Next.js 16, TypeScript, Jest, Next Image, Vercel Image Optimization.

---

### Task 1: Extend the approved marketing contract

**Files:**
- Modify: `specs/features/031-public-marketing-site/spec.md`

- [x] **Step 1: Add BR-35**

```markdown
- **BR-35**: Lorsqu’un asset hero marketing déjà déployé est remplacé, son chemin public est versionné afin de créer une nouvelle clé `next/image` et CDN ; le code actif ne conserve aucune référence à l’ancien chemin.
```

- [x] **Step 2: Map BR-35 to a unit test in the acceptance table**

```markdown
| BR-35 | unit |
```

- [x] **Step 3: Commit the approved contract change**

```bash
git add specs/features/031-public-marketing-site/spec.md
git commit -m "docs(marketing): specify versioned hero assets"
```

### Task 2: Add a failing cache-key regression test

**Files:**
- Create: `tests/unit/public-marketing.BR-35.hero-cache-key.test.ts`

- [x] **Step 1: Write the source contract test**

```typescript
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const activeConsumers = [
  'src/features/marketing/components/MarketingHome.tsx',
  'src/app/(public)/seminaires/page.tsx',
  'src/features/guide-demo/demo-guide-data.ts',
  'src/features/guide-app/queries/private-guide-data.ts',
] as const

describe('031 public marketing BR-35 — versioned hero cache key', () => {
  it.each(activeConsumers)('%s uses no stale hero-chalet.png cache key', relativePath => {
    const source = readFileSync(join(process.cwd(), relativePath), 'utf8')
    expect(source).not.toContain('/marketing/hero-chalet.png')
  })

  it.each(activeConsumers)('%s uses hero-chalet-v2.png when it needs the shared hero', relativePath => {
    const source = readFileSync(join(process.cwd(), relativePath), 'utf8')
    expect(source).toContain('/marketing/hero-chalet-v2.png')
  })
})
```

- [x] **Step 2: Run the test and confirm RED**

```bash
npm test -- --runInBand tests/unit/public-marketing.BR-35.hero-cache-key.test.ts
```

Expected: every assertion fails because consumers still use `hero-chalet.png`.

- [x] **Step 3: Commit the regression test**

```bash
git add tests/unit/public-marketing.BR-35.hero-cache-key.test.ts
git commit -m "test(marketing): require a versioned hero cache key"
```

### Task 3: Rename the asset and update all active references

**Files:**
- Rename: `public/marketing/hero-chalet.png` → `public/marketing/hero-chalet-v2.png`
- Modify: `src/features/marketing/components/MarketingHome.tsx`
- Modify: `src/app/(public)/seminaires/page.tsx`
- Modify: `src/features/guide-demo/demo-guide-data.ts`
- Modify: `src/features/guide-app/queries/private-guide-data.ts`
- Modify: `tests/integration/public-marketing.AC-01-01.home.test.tsx`

- [x] **Step 1: Rename the binary without altering it**

```bash
git mv public/marketing/hero-chalet.png public/marketing/hero-chalet-v2.png
```

- [x] **Step 2: Replace every active path**

Replace:

```typescript
'/marketing/hero-chalet.png'
```

with:

```typescript
'/marketing/hero-chalet-v2.png'
```

in the four source consumers and the marketing fixture.

- [x] **Step 3: Confirm GREEN and run marketing regressions**

```bash
npm test -- --runInBand tests/unit/public-marketing.BR-35.hero-cache-key.test.ts tests/integration/public-marketing.AC-01-01.home.test.tsx tests/integration/public-marketing.AC-01-02.editorial-pages.test.tsx tests/unit/public-guide-demo.AC-05-06.data.test.ts
```

Expected: all selected suites pass.

- [x] **Step 4: Confirm the old active path is gone**

```bash
rg -n -S "/marketing/hero-chalet\.png" src tests --glob '!tests/unit/public-marketing.BR-35.hero-cache-key.test.ts'
```

Expected: no matches.

- [x] **Step 5: Commit the implementation**

```bash
git add public/marketing/hero-chalet-v2.png src tests
git commit -m "fix(marketing): version hero image cache key"
```

### Task 4: Trace, verify and publish

**Files:**
- Modify: `docs/traceability-matrix.md`

- [x] **Step 1: Add the traceability row**

```markdown
| BR-35 | Hero marketing utilise un chemin versionné pour invalider les transformations `next/image` et CDN | `public/marketing/hero-chalet-v2.png`<br>`src/features/marketing/components/MarketingHome.tsx`<br>`src/app/(public)/seminaires/page.tsx`<br>`src/features/guide-demo/demo-guide-data.ts`<br>`src/features/guide-app/queries/private-guide-data.ts` | `tests/unit/public-marketing.BR-35.hero-cache-key.test.ts` | ✅ done |
```

- [x] **Step 2: Run final verification**

```bash
npm run lint
set -a; source .env.local; set +a; npm run build
git diff --check
```

Expected: lint has no errors and the production build succeeds.

- [ ] **Step 3: Commit traceability and push main**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace marketing hero cache busting"
git push origin main
```
