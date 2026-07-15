# Trail Navigation Safety and Close Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supprimer toute liaison graphique à vol d'oiseau entre le Tourist et le tracé, puis rendre la croix de la carte fiable et conforme au retour vers l'écran précédent.

**Architecture:** `TrailNavigationMap` conserve les calculs locaux de point le plus proche, de distance et de phase, mais ne construit plus aucun GeoJSON d'approche et ne rend plus les couches Mapbox correspondantes. Le composant utilise le routeur App Router pour le retour historique en l'absence de callback modal, tandis qu'une couche de contrôles avec empilement et événements pointeur explicites garantit que Mapbox ne capture pas la croix.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Mapbox GL via `react-map-gl`, Tailwind CSS, Jest, React Testing Library.

---

## Task 1: Remove every unsafe straight-line approach layer

**Files:**
- Modify: `tests/unit/trail-navigation.start-map.test.tsx`
- Modify: `src/features/trail-navigation/components/TrailNavigationMap.tsx`

- [ ] **Step 1: Replace the historical approach-line test with a failing safety regression**

In `tests/unit/trail-navigation.start-map.test.tsx`, replace `keeps the approach line while approaching and removes it after reaching the trail` with:

```tsx
it('AC-05-06/BR-19: never renders a straight-line approach layer', async () => {
  let gpsSuccess: PositionCallback | null = null
  const startedAt = Date.now()
  const watchPosition = jest.fn((success: PositionCallback) => {
    gpsSuccess = success
    return 42
  })
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { watchPosition, clearWatch: jest.fn() },
  })

  render(<TrailNavigationMap trail={trail} />)
  expect(screen.queryByTestId('map-layer-approach-line-halo')).not.toBeInTheDocument()
  expect(screen.queryByTestId('map-layer-approach-line-layer')).not.toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
  act(() => {
    gpsSuccess?.(makePosition({
      latitude: 45.879,
      longitude: 6.673,
      timestamp: startedAt,
    }))
  })

  await screen.findByRole('button', { name: 'Démarrer ici' })
  expect(screen.getByText(/Vous êtes à \d+ m du tracé/i)).toBeInTheDocument()
  expect(screen.queryByTestId('map-layer-approach-line-halo')).not.toBeInTheDocument()
  expect(screen.queryByTestId('map-layer-approach-line-layer')).not.toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Démarrer ici' }))
  expect(screen.getByText(/En route vers le tracé/i)).toBeInTheDocument()
  expect(screen.queryByTestId('map-layer-approach-line-halo')).not.toBeInTheDocument()
  expect(screen.queryByTestId('map-layer-approach-line-layer')).not.toBeInTheDocument()

  act(() => {
    gpsSuccess?.(makePosition({
      latitude: 45.875,
      longitude: 6.676,
      timestamp: startedAt + 4_000,
    }))
  })

  await waitFor(() => {
    expect(screen.queryByText(/En route vers le tracé/i)).not.toBeInTheDocument()
  })
  expect(screen.queryByTestId('map-layer-approach-line-halo')).not.toBeInTheDocument()
  expect(screen.queryByTestId('map-layer-approach-line-layer')).not.toBeInTheDocument()
})
```

This test retains evidence that distance text and the `approaching → tracking` transition continue to work without any directional line.

- [ ] **Step 2: Run the regression and verify RED**

Run:

```bash
npm test -- tests/unit/trail-navigation.start-map.test.tsx --runInBand
```

Expected: FAIL because `map-layer-approach-line-halo` and `map-layer-approach-line-layer` are still rendered after the first reliable GPS fix.

- [ ] **Step 3: Remove only the visual approach geometry**

In `src/features/trail-navigation/components/TrailNavigationMap.tsx`, remove `getClosestPointOnTrail` from the `../lib/geo` import:

```ts
import {
  getLineEndpoints,
  getPositionProgress,
  getTrailDistanceMeters,
  haversineMeters,
  isValidTrailGeometry,
  shouldAutoFollowCamera,
  smoothTrack,
} from '../lib/geo'
```

Delete the complete `approachTarget` and `approachLine` memo blocks. Do not remove `getTrailDistanceMeters`, `distanceToTrailM`, the `approaching` phase, session points or the 35 m transition.

Delete the complete Mapbox rendering block beginning with:

```tsx
{approachLine && (
  <Source id="approach-line" type="geojson" data={approachLine}>
```

and ending after both `approach-line-halo` and `approach-line-layer` layers.

- [ ] **Step 4: Run the focused map suite and verify GREEN**

Run:

```bash
npm test -- tests/unit/trail-navigation.start-map.test.tsx --runInBand
```

Expected: PASS. The distance text, start eligibility, phase transition and all existing map behavior remain green.

- [ ] **Step 5: Confirm no approach layer identifier remains in production code**

Run:

```bash
rg -n "approachTarget|approachLine|approach-line" src/features/trail-navigation
```

Expected: no match.

- [ ] **Step 6: Commit the safety correction**

```bash
git add src/features/trail-navigation/components/TrailNavigationMap.tsx tests/unit/trail-navigation.start-map.test.tsx
git commit -m "fix: remove unsafe trail approach line"
```

---

## Task 2: Make the full-screen Close control return through browser history

**Files:**
- Modify: `tests/unit/trail-navigation.start-map.test.tsx`
- Modify: `tests/integration/trail-navigation.session-flow.test.tsx`
- Modify: `src/features/trail-navigation/components/TrailNavigationMap.tsx`

- [ ] **Step 1: Add a controllable App Router mock to both map test files**

Near the imports in both `tests/unit/trail-navigation.start-map.test.tsx` and `tests/integration/trail-navigation.session-flow.test.tsx`, add:

```tsx
const mockRouterBack = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockRouterBack }),
}))
```

Add `mockRouterBack.mockClear()` to each relevant `beforeEach` so tests remain independent.

- [ ] **Step 2: Write failing tests for direct-page and modal closing**

Add these tests to `tests/unit/trail-navigation.start-map.test.tsx`:

```tsx
it('AC-02-07/BR-29: keeps the Close control above Mapbox and returns to the previous screen', async () => {
  render(<TrailNavigationMap trail={trail} />)

  const controls = screen.getByTestId('trail-top-controls')
  const close = screen.getByRole('button', { name: 'Fermer' })

  expect(controls).toHaveClass('z-30', 'pointer-events-none')
  expect(close).toHaveClass('pointer-events-auto', 'h-11', 'w-11')

  close.focus()
  expect(close).toHaveFocus()
  await userEvent.click(close)

  expect(mockRouterBack).toHaveBeenCalledTimes(1)
})

it('AC-02-07: uses the modal close callback instead of router history when provided', async () => {
  const onClose = jest.fn()
  render(<TrailNavigationMap trail={trail} onClose={onClose} />)

  await userEvent.click(screen.getByRole('button', { name: 'Fermer' }))

  expect(onClose).toHaveBeenCalledTimes(1)
  expect(mockRouterBack).not.toHaveBeenCalled()
})
```

In `tests/integration/trail-navigation.session-flow.test.tsx`, add a test proving the direct-page close also cleans the watcher without creating a summary:

```tsx
it('AC-02-07/AC-04-04: Close goes back and clears GPS without creating a summary', async () => {
  const clearWatch = jest.fn()
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      watchPosition: jest.fn(() => 91),
      clearWatch,
    },
  })

  const { unmount } = render(<TrailNavigationMap trail={trail} />)
  await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
  await userEvent.click(screen.getByRole('button', { name: 'Fermer' }))
  unmount()

  expect(mockRouterBack).toHaveBeenCalledTimes(1)
  expect(clearWatch).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('dialog', { name: /randonnée terminée/i })).not.toBeInTheDocument()
})
```

- [ ] **Step 3: Run the close tests and verify RED**

Run:

```bash
npm test -- tests/unit/trail-navigation.start-map.test.tsx tests/integration/trail-navigation.session-flow.test.tsx --runInBand
```

Expected failures:

- the direct close is a link rather than a button and does not call `router.back()`;
- `trail-top-controls` does not exist;
- the controls do not have explicit `z-30` / pointer-event classes.

- [ ] **Step 4: Implement one Close behavior for direct and intercepted modes**

In `src/features/trail-navigation/components/TrailNavigationMap.tsx`, import `useRouter`:

```ts
import { useRouter } from 'next/navigation'
```

Inside `TrailNavigationSessionMap`, create the router and a single close callback:

```ts
const router = useRouter()

const closeNavigation = useCallback(() => {
  if (onClose) {
    onClose()
    return
  }
  router.back()
}, [onClose, router])
```

Replace the conditional `button` / `Link` `closeControl` with one button:

```tsx
const closeControl = (
  <button
    ref={setCloseControlRef}
    type="button"
    onClick={closeNavigation}
    aria-label="Fermer"
    className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-charcoal shadow"
  >
    <X className="h-5 w-5" />
  </button>
)
```

Do not change `backHref` for the separate summary action « Quitter la rando »; this task changes only the top-left cross.

- [ ] **Step 5: Put every top control above Mapbox while preserving map gestures**

Replace the top controls wrapper with:

```tsx
<div
  data-testid="trail-top-controls"
  className="pointer-events-none absolute left-5 right-5 top-6 z-30 flex items-center justify-between"
>
```

Add `pointer-events-auto` to the Stop button. Add `pointer-events-auto` to the right-side controls container:

```tsx
<div className="pointer-events-auto flex items-center gap-3">
```

The parent remains `pointer-events-none`, so map gestures continue between the interactive controls.

- [ ] **Step 6: Run unit and integration tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/trail-navigation.start-map.test.tsx tests/integration/trail-navigation.session-flow.test.tsx --runInBand
```

Expected: PASS, including the history callback, modal callback, stacking contract and watcher cleanup.

- [ ] **Step 7: Commit the close correction**

```bash
git add src/features/trail-navigation/components/TrailNavigationMap.tsx tests/unit/trail-navigation.start-map.test.tsx tests/integration/trail-navigation.session-flow.test.tsx
git commit -m "fix: restore trail map close navigation"
```

---

## Task 3: Complete traceability and verify the safety fix

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Update the BR-19 traceability row**

Replace the current `AC-03-02/AC-03-03/AC-03-04/AC-03-06/BR-19` row description with:

```markdown
Distance au tracé, pré-départ, off-track et progression indicative calculés côté client ; aucune liaison graphique à vol d'oiseau, distance au tracé uniquement textuelle
```

Keep the existing source and test mappings because `TrailNavigationMap.tsx`, `geo.ts`, `trail-navigation.geo.test.ts` and `trail-navigation.start-map.test.tsx` still implement and verify those rules.

- [ ] **Step 2: Add the AC-02-07/BR-29 traceability row**

Under `## 021 — Trail Navigation`, append:

```markdown
| AC-02-07/BR-29 | Croix interactive au-dessus de Mapbox, retour à l'écran précédent et arrêt du watcher sans récapitulatif | `src/features/trail-navigation/components/TrailNavigationMap.tsx` | `tests/unit/trail-navigation.start-map.test.tsx`<br>`tests/integration/trail-navigation.session-flow.test.tsx` | ✅ done |
```

- [ ] **Step 3: Run all trail-navigation tests**

Run:

```bash
npm test -- tests/unit/trail-navigation.actions.test.tsx tests/unit/trail-navigation.geo.test.ts tests/unit/trail-navigation.session-stats.test.ts tests/unit/trail-navigation.session-hook.test.tsx tests/unit/trail-navigation.session-summary-modal.test.tsx tests/unit/trail-navigation.start-map.test.tsx tests/integration/trail-navigation.public-detail.test.tsx tests/integration/trail-navigation.session-flow.test.tsx --runInBand
```

Expected: PASS for all 8 suites. The final test count will be the previous 92 plus the new close and safety regressions.

- [ ] **Step 4: Run strict TypeScript and the production build**

Run:

```bash
npx tsc --noEmit --incremental false
set -a
source ../../.env
source ../../.env.local
set +a
npm run build
```

Expected: TypeScript exit 0 and Next.js production build exit 0. If Turbopack cannot open a local process/port inside the sandbox, rerun the same build with the required sandbox approval.

- [ ] **Step 5: Verify the safety and privacy invariants**

Run:

```bash
rg -n "approachTarget|approachLine|approach-line|walking-route|fetch\(" src/features/trail-navigation src/app/api/trails
```

Expected: no approach line, no walking-route route and no Tourist-coordinate fetch from the navigation runtime.

Run:

```bash
git diff --check
git status --short
```

Expected: only `docs/traceability-matrix.md` remains modified before the documentation commit; the unrelated dirty `guide-customization` files exist only in the main worktree, not in this isolated worktree.

- [ ] **Step 6: Commit traceability**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace trail navigation safety fixes"
```

- [ ] **Step 7: Final audit**

Confirm all items:

- no red-white or other straight-line layer is rendered in any phase;
- distance-to-trail text and the 1,500 m / 35 m rules remain operational;
- the top cross is a keyboard-accessible 44 × 44 px button above Mapbox;
- direct-page close calls `router.back()` once;
- intercepted-modal close calls its supplied `onClose` once;
- closing clears any active watcher and never creates a session summary;
- Stop and summary behavior remain unchanged;
- `specs/features/021-trail-navigation/spec.md` remains `status: approved`;
- traceability covers `AC-02-07`, `AC-05-06`, `BR-19` and `BR-29`.
