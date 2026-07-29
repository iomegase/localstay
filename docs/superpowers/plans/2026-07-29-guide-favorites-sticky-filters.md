# Guide Favorites Sticky Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garder les filtres de la vue « Nos coups de cœur » accessibles juste sous le header du GuideApp pendant le scroll vertical.

**Architecture:** `GuideFavoritesPage` conserve son introduction dans le flux normal et applique un positionnement sticky CSS natif à la rangée horizontale de filtres. Le conteneur `main` existant reste l’unique surface scrollable ; aucun état React ni listener de scroll n’est ajouté.

**Tech Stack:** Next.js 16, React, TypeScript strict, Tailwind CSS, Jest, Testing Library, Playwright.

---

### Task 1: Contrat sticky du composant partagé

**Files:**
- Create: `tests/integration/public-guide-demo.AC-05-11.sticky-filters.test.tsx`
- Modify: `src/features/guide-app/components/GuideFavoritesPage.tsx`

- [x] **Step 1: Write the failing integration test**

```tsx
/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

it('keeps category filters sticky below the GuideApp header', () => {
  render(<GuideApp mode="demo" lodging={demoLodging} pois={demoPois} />)
  fireEvent.click(screen.getByRole('button', { name: 'Coups de cœur' }))

  expect(screen.getByLabelText('Filtrer les catégories')).toHaveClass(
    'sticky',
    'top-0',
    'z-20',
    'bg-white/95',
    'backdrop-blur-xl',
    'overflow-x-auto',
    '[scrollbar-width:none]',
    '[&::-webkit-scrollbar]:hidden',
  )
})
```

- [x] **Step 2: Run the integration test and verify RED**

```bash
npm test -- tests/integration/public-guide-demo.AC-05-11.sticky-filters.test.tsx --runInBand
```

Expected: FAIL because the filter row has no sticky or scrollbar-hiding classes.

- [x] **Step 3: Implement the CSS-native sticky row**

Replace the filter row classes with:

```tsx
className="sticky top-0 z-20 -mx-3 mt-5 flex gap-2 overflow-x-auto border-b border-slate-100/80 bg-white/95 px-4 py-3 backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
```

Keep `aria-label="Filtrer les catégories"` and the existing filter buttons.

- [x] **Step 4: Run the integration test and verify GREEN**

```bash
npm test -- tests/integration/public-guide-demo.AC-05-11.sticky-filters.test.tsx --runInBand
```

Expected: PASS.

### Task 2: Positionnement réel et traçabilité

**Files:**
- Modify: `tests/e2e/public-guide-demo.AC-05-01-09.test.ts`
- Modify: `docs/traceability-matrix.md`
- Modify: `docs/superpowers/plans/2026-07-29-guide-favorites-sticky-filters.md`

- [x] **Step 1: Extend the responsive E2E contract**

After opening the favorites view:

```ts
const guideMain = dialog.locator('main')
const header = dialog.locator('header')
const filters = dialog.getByLabel('Filtrer les catégories')
const title = dialog.getByRole('heading', { name: 'Nos coups de cœur' })

await guideMain.evaluate(element => {
  element.scrollTop = 320
})

await expect.poll(async () => {
  const [headerBox, filtersBox] = await Promise.all([
    header.boundingBox(),
    filters.boundingBox(),
  ])
  if (!headerBox || !filtersBox) return Number.POSITIVE_INFINITY
  return Math.abs(filtersBox.y - (headerBox.y + headerBox.height))
}).toBeLessThanOrEqual(2)

await expect.poll(async () => {
  const [mainBox, titleBox] = await Promise.all([
    guideMain.boundingBox(),
    title.boundingBox(),
  ])
  if (!mainBox || !titleBox) return false
  return titleBox.y + titleBox.height <= mainBox.y
}).toBe(true)
```

- [x] **Step 2: Update traceability**

Add AC-05-11 and BR-31 to section 031, mapping:

- `GuideFavoritesPage.tsx`;
- the sticky integration test;
- the responsive guide-demo E2E test.

- [x] **Step 3: Run focused regression tests**

```bash
npm test -- tests/integration/public-guide-demo.AC-05-11.sticky-filters.test.tsx tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx tests/integration/public-guide-demo.AC-05-07.map.test.tsx --runInBand
```

Expected: all suites pass.

- [x] **Step 4: Run static and responsive verification**

```bash
npx eslint src/features/guide-app/components/GuideFavoritesPage.tsx tests/integration/public-guide-demo.AC-05-11.sticky-filters.test.tsx tests/e2e/public-guide-demo.AC-05-01-09.test.ts
npx tsc --noEmit --pretty false
npx playwright test tests/e2e/public-guide-demo.AC-05-01-09.test.ts --project='Mobile Chrome' --workers=1
npm run build
```

Expected: zero errors; mobile, tablet and desktop pass. The existing Story Script fallback warning may remain.

- [x] **Step 5: Leave the development server available**

Start `npm run dev` on port 3000 after the build. Do not push or deploy.
