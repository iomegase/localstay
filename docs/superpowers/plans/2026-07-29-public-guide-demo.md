# Public Guide Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le lien privé « Voir le guide d’exemple » par un modal smartphone public qui rend le même `GuideApp` que le séjour privé avec des données statiques non sensibles.

**Architecture:** Les queries Prisma et le cookie restent dans des adaptateurs Server Components. Un `GuideApp` client normalisé rend toutes les vues et reçoit soit les données privées validées, soit `demoLodging` et l’unique collection `demoPois`. Le modal utilise Radix Dialog et Framer Motion ; la carte réutilise `GuestMap` via des callbacks et reste chargée dynamiquement.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 3, Radix Dialog, Framer Motion, react-map-gl/Mapbox, Lucide React, Jest/Testing Library, Playwright.

---

## File Structure

- Create `src/features/guide-app/types.ts`: contrat sérialisable commun du logement, des POI, des randonnées et des vues.
- Create `src/features/guide-app/lib/guide-pois.ts`: filtres, catégories, distance et sélection partagés.
- Create `src/features/guide-app/components/GuideApp.tsx`: état de navigation et composition des vues.
- Create `src/features/guide-app/components/GuideHeader.tsx`: header interne et mention de démonstration.
- Create `src/features/guide-app/components/GuideNavigation.tsx`: navigation basse pilotée par callbacks.
- Create `src/features/guide-app/components/GuideHome.tsx`: accueil et aperçus.
- Create `src/features/guide-app/components/GuideLodgingViews.tsx`: logement, arrivée, départ et informations pratiques.
- Create `src/features/guide-app/components/GuideFavoritesPage.tsx`: filtres et cards POI.
- Create `src/features/guide-app/components/GuidePoiDetails.tsx`: fiche POI et randonnée sans suivi en mode demo.
- Create `src/features/guide-app/components/GuideMapView.tsx`: adaptation dynamique de `GuestMap`.
- Create `src/features/guide-app/queries/private-guide-app.ts`: chargement Prisma privé et normalisation.
- Create `src/features/guide-demo/demo-guide-data.ts`: logement fictif et contenu pratique.
- Create `src/features/guide-demo/demo-pois.ts`: unique instantané public de 12 à 15 POI sans UUID.
- Create `src/features/guide-demo/components/GuideDemoLauncher.tsx`: trigger léger et import dynamique.
- Create `src/features/guide-demo/components/GuideDemoModal.tsx`: Dialog smartphone animé.
- Modify `src/app/(public)/nos-recommandations/page.tsx`: rendre `GuideApp mode="private"` après contrôle du séjour.
- Modify `src/app/(public)/map/_components/GuestMap.tsx`: permettre l’intégration contrôlée sans liens privés.
- Modify `src/features/marketing/components/MarketingHome.tsx`: remplacer le `Link` et supprimer l’UUID.
- Modify `specs/features/031-public-marketing-site/spec.md`: contrat approuvé de la démo.
- Modify `docs/traceability-matrix.md`: lier AC-05 aux sources et tests.
- Create `tests/unit/public-guide-demo.AC-05-06.data.test.ts`: source unique, diversité et confidentialité.
- Create `tests/unit/public-guide-demo.AC-05-08.trail.test.ts`: Porcherey sans suivi.
- Create `tests/unit/public-guide-demo.AC-05-09.security.test.ts`: aucune route/UUID privé.
- Create `tests/integration/public-guide-demo.AC-05-01.modal.test.tsx`: trigger et Dialog.
- Create `tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`: mini-application.
- Create `tests/integration/public-guide-demo.AC-05-07.map-selection.test.tsx`: sélection POI vers carte.
- Modify `tests/integration/public-marketing.AC-01-01.home.test.tsx`: CTA bouton.
- Modify `tests/e2e/public-marketing.AC-01-03.responsive.test.ts`: modal, interactions et débordement.

### Task 1: Lock the specification and common contracts

**Files:**
- Modify: `specs/features/031-public-marketing-site/spec.md`
- Create: `src/features/guide-app/types.ts`
- Test: `tests/unit/public-guide-demo.AC-05-06.data.test.ts`

- [ ] **Step 1: Write the failing type/data contract test**

```ts
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

test('exposes one credible public POI collection without real UUIDs', () => {
  expect(demoPois).toHaveLength(expect.any(Number))
  expect(demoPois.length).toBeGreaterThanOrEqual(12)
  expect(demoPois.length).toBeLessThanOrEqual(15)
  expect(new Set(demoPois.map(poi => poi.id)).size).toBe(demoPois.length)
  expect(demoPois.some(poi => poi.category.slug === 'rando')).toBe(true)
  expect(JSON.stringify({ demoLodging, demoPois })).not.toMatch(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  )
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- tests/unit/public-guide-demo.AC-05-06.data.test.ts --runInBand`

Expected: FAIL because the demo modules do not exist.

- [ ] **Step 3: Define the strict shared contracts**

Create `GuideMode`, `GuideView`, `GuideLodging`, `GuidePoiCategory`,
`GuideTrailSummary` and `GuidePoi`. All values passed from Server Components
must be JSON-serializable and no property uses `any`.

- [ ] **Step 4: Re-run the focused test**

Expected: it still fails only because data constants are not implemented.

### Task 2: Create the static public demo snapshot

**Files:**
- Create: `src/features/guide-demo/demo-guide-data.ts`
- Create: `src/features/guide-demo/demo-pois.ts`
- Test: `tests/unit/public-guide-demo.AC-05-06.data.test.ts`
- Test: `tests/unit/public-guide-demo.AC-05-08.trail.test.ts`

- [ ] **Step 1: Add the failing Porcherey security test**

```ts
import { demoPois } from '@/features/guide-demo/demo-pois'

test('shows Porcherey metrics without enabling trail tracking', () => {
  const porcherey = demoPois.find(poi => poi.slug === 'alpage-de-porcherey')
  expect(porcherey?.trail).toMatchObject({
    difficulty: 'easy',
    distanceKm: 8.3,
    elevationGainM: 709,
    estimatedDurationMinutes: 210,
    trackingEnabled: false,
  })
})
```

- [ ] **Step 2: Verify RED**

Run both unit files and confirm the missing constants are the reason.

- [ ] **Step 3: Add `demoLodging` and 14 POI**

Use public values for Bistrotsérac, Rond de Carotte, Relais des Communailles,
Petit Biscuit, Carrefour Express, La Cure, Maison forte de Hautetour, Thermes,
Piscine, Parc thermal, Pont du Diable, Tramway, télécabine du Bettex and
L’Alpage de Porcherey. Use stable string IDs such as `demo-poi-porcherey`,
local `/fallback/*` images, official websites and Google Maps directions URLs.

- [ ] **Step 4: Verify GREEN**

Run the two unit tests and expect PASS.

### Task 3: Build GuideApp navigation with shared views

**Files:**
- Create: `src/features/guide-app/lib/guide-pois.ts`
- Create: `src/features/guide-app/components/GuideApp.tsx`
- Create: `src/features/guide-app/components/GuideHeader.tsx`
- Create: `src/features/guide-app/components/GuideNavigation.tsx`
- Create: `src/features/guide-app/components/GuideHome.tsx`
- Test: `tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`

- [ ] **Step 1: Write a failing internal navigation test**

Render `<GuideApp mode="demo" lodging={demoLodging} pois={demoPois} />`, click
`Guide logement`, assert the lodging heading, click `Coups de cœur`, then
assert a known POI card. Confirm `window.location.pathname` never changes.

- [ ] **Step 2: Verify RED**

Expected: FAIL because `GuideApp` does not exist.

- [ ] **Step 3: Implement minimal stateful GuideApp**

Use `useState<GuideView>('home')`, `selectedPoiId` and a single category filter.
Render a full-height white mobile app, shared header, scroll area and fixed
bottom navigation. All navigation uses buttons and callbacks, never
`router.push`.

- [ ] **Step 4: Verify GREEN and refactor**

Run the navigation test and keep the current guide palette, 430 px mobile
rhythm, rounded cards and typography.

### Task 4: Extract the lodging experience

**Files:**
- Create: `src/features/guide-app/components/GuideLodgingViews.tsx`
- Modify: `src/features/guide-app/components/GuideApp.tsx`
- Test: `tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`

- [ ] **Step 1: Extend the failing test**

Assert navigation to arrival, Wi-Fi/practical information and departure, plus
the fictive SSID and checkout checklist.

- [ ] **Step 2: Verify RED**

Expected: the new headings and content are missing.

- [ ] **Step 3: Implement the four views**

Reuse the hero, colored fact cards, Wi-Fi card, equipment cards and departure
checklist visual language from `/le-logement`. Render only normalized props.

- [ ] **Step 4: Verify GREEN**

Run the focused integration test.

### Task 5: Build favorites and POI details

**Files:**
- Create: `src/features/guide-app/components/GuideFavoritesPage.tsx`
- Create: `src/features/guide-app/components/GuidePoiDetails.tsx`
- Modify: `src/features/guide-app/components/GuideApp.tsx`
- Test: `tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`
- Test: `tests/unit/public-guide-demo.AC-05-08.trail.test.ts`

- [ ] **Step 1: Add failing interaction assertions**

Filter by restaurants, open Rond de Carotte, assert address and actions, return
to favorites, open Porcherey and assert that no `Démarrer` button exists.

- [ ] **Step 2: Verify RED**

Expected: filters and POI details are missing.

- [ ] **Step 3: Implement cards, filters and detail view**

Use the existing recommendation cards and `PoiDetailBody` visual patterns:
illustrated cards, distance/duration, recommendation/family/proximity badges,
external website/directions actions and a callback to the map. For a trail,
render public metrics but guard all tracking controls with
`mode === 'private' && trail.trackingEnabled`.

- [ ] **Step 4: Verify GREEN**

Run focused tests.

### Task 6: Reuse GuestMap in controlled embedded mode

**Files:**
- Modify: `src/app/(public)/map/_components/GuestMap.tsx`
- Create: `src/features/guide-app/components/GuideMapView.tsx`
- Modify: `src/features/guide-app/components/GuideApp.tsx`
- Test: `tests/integration/public-guide-demo.AC-05-07.map-selection.test.tsx`
- Test: `tests/unit/guest-map.category-filter.test.tsx`

- [ ] **Step 1: Write a failing map-selection test**

Mock only the browser Mapbox canvas boundary, click `Voir sur la carte` for a
POI, then assert the controlled map receives that POI as active and renders its
bottom preview.

- [ ] **Step 2: Verify RED**

Expected: `GuestMap` has no embedded callback API.

- [ ] **Step 3: Add a backward-compatible controlled API**

Add optional `embedded`, `selectedPoiId`, `onSelectPoi`, `onOpenPoi` and
`onClose` props. Preserve existing route behavior as defaults. In embedded
mode use `h-full`, skip body immersive classes, replace private Links with
buttons, `flyTo` the controlled POI and position the preview at the bottom.

- [ ] **Step 4: Dynamically import the map view**

Load `GuideMapView` only for `activeView === 'map'` with an accessible skeleton
and a missing-token fallback.

- [ ] **Step 5: Verify GREEN and existing map tests**

Run both focused map test files.

### Task 7: Add the accessible smartphone modal

**Files:**
- Create: `src/features/guide-demo/components/GuideDemoLauncher.tsx`
- Create: `src/features/guide-demo/components/GuideDemoModal.tsx`
- Test: `tests/integration/public-guide-demo.AC-05-01.modal.test.tsx`

- [ ] **Step 1: Write the failing Dialog test**

Click the trigger, assert `role="dialog"`, `aria-modal="true"`, the demo label,
the 5 px border class and the guide heading. Click inside and assert it stays
open; press Escape and assert it closes and focus returns.

- [ ] **Step 2: Verify RED**

Expected: components are missing.

- [ ] **Step 3: Implement the launcher and modal**

Use the existing Radix Dialog wrapper, `AnimatePresence` and `motion.div`.
Apply the supplied `min(360px, calc(100vw - 24px))` and
`min(720px, calc(100dvh - 32px))` dimensions, white 5 px border, 2.5 rem
radius, strong shadow and blurred overlay. Stop propagation inside the frame.

- [ ] **Step 4: Verify GREEN**

Run the modal test, including body scroll lock and focus return.

### Task 8: Replace the marketing CTA securely

**Files:**
- Modify: `src/features/marketing/components/MarketingHome.tsx`
- Modify: `tests/integration/public-marketing.AC-01-01.home.test.tsx`
- Create: `tests/unit/public-guide-demo.AC-05-09.security.test.ts`

- [ ] **Step 1: Write failing CTA/security assertions**

Assert the CTA is a button, not a link, and serialized home source contains
neither `/logements`, `/guide/saint-gervais-les-bains?lodging=` nor a UUID.

- [ ] **Step 2: Verify RED**

Expected: current CTA is a Link containing the real lodging UUID.

- [ ] **Step 3: Remove the private href and render the launcher**

Delete `exampleGuideHref`, import `GuideDemoLauncher`, preserve the current
button classes and render the dynamic modal trigger.

- [ ] **Step 4: Verify GREEN**

Run marketing home and security tests.

### Task 9: Mount the same GuideApp in private mode

**Files:**
- Create: `src/features/guide-app/queries/private-guide-app.ts`
- Modify: `src/app/(public)/nos-recommandations/page.tsx`
- Test: `tests/integration/guide-customization.recommendations-page.test.tsx`
- Test: `tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`

- [ ] **Step 1: Add a failing private adapter assertion**

Mock the active lodging and Prisma rows, render the page and assert
`data-guide-mode="private"`, the real normalized lodging name and a featured
POI.

- [ ] **Step 2: Verify RED**

Expected: the page still renders `RecommendationsView` directly.

- [ ] **Step 3: Implement the server-only loader**

Query customization, public profile, practical blocks and featured POIs in
parallel after `getActiveLodgingContext`. Normalize values into the common
serializable contract. Keep the redirect and QR analytics before the loader.

- [ ] **Step 4: Render GuideApp private**

Return `<GuideApp mode="private" lodging={lodging} pois={pois} />`. Preserve
direct `/le-logement`, `/map` and POI routes as compatibility entries while
the QR landing uses the shared app.

- [ ] **Step 5: Verify GREEN and private regressions**

Run recommendations, le-logement, map, proxy and QR focused suites.

### Task 10: Traceability and full verification

**Files:**
- Modify: `docs/traceability-matrix.md`
- Modify: `tests/e2e/public-marketing.AC-01-03.responsive.test.ts`

- [ ] **Step 1: Add Playwright coverage**

At 375, 768 and 1440 px, open `/`, launch the demo, navigate favorites → POI →
map, close with Escape, and assert:

```ts
expect(await page.evaluate(() => document.documentElement.scrollWidth))
  .toBe(await page.evaluate(() => document.documentElement.clientWidth))
```

- [ ] **Step 2: Run focused Jest suites**

Run: `npm test -- tests/unit/public-guide-demo* tests/integration/public-guide-demo* tests/integration/guide-customization.recommendations-page.test.tsx tests/unit/guest-map.category-filter.test.tsx --runInBand`

Expected: PASS.

- [ ] **Step 3: Run lint and TypeScript**

Run: `npm run lint`

Run: `npx tsc --noEmit`

Expected: no new error.

- [ ] **Step 4: Run the production build**

Stop the active dev server before `npm run build` to avoid `.next/dev`
validator races, preserve `tsconfig.tsbuildinfo`, then restart the server.

Expected: production build succeeds.

- [ ] **Step 5: Run Playwright serially**

Run: `npx playwright test tests/e2e/public-marketing.AC-01-03.responsive.test.ts --workers=1`

Expected: all desktop/tablet/mobile cases pass.

- [ ] **Step 6: Update traceability**

Add one row per AC-05 linking the exact production and test files.

## Self-review

- Spec coverage: AC-05-01 through AC-05-09 are each mapped to an implementation
  task and a test.
- Privacy: no demo code imports Prisma, reads cookies, stores database UUIDs or
  routes to private surfaces.
- POI consistency: all list, filter, map, preview and detail views receive the
  same `demoPois` array.
- Trail safety: Porcherey exposes metrics only; tracking remains explicitly
  false and no navigation component is mounted in demo mode.
- Type consistency: `GuidePoi`, `GuideLodging`, `GuideView` and callbacks are
  defined once in Task 1 and reused by every later task.
- Performance: launcher, modal and map are split at client boundaries; the
  marketing home remains server-rendered.
