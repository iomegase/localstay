# Trail Navigation 3D Terrain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter le relief Mapbox Terrain 3D au mode randonnée sans modifier le fond Outdoor, les règles GPS, le cycle de session ni les interdictions IGN.

**Architecture:** `TrailNavigationMap` réutilise l'instance Mapbox existante et lui ajoute une source DEM `mapbox-dem`, la propriété `terrain` avec une exagération `1.2`, un pitch initial explicite `0°` et un maximum `75°`. Les mouvements existants à `55°` pour l'activation GPS et le recentrage restent inchangés ; aucun nouveau composant, endpoint, état de session ou fond cartographique n'est créé.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, `react-map-gl` 8, Mapbox GL JS 3, Jest, React Testing Library.

---

## Task 1: Add and prove the Mapbox 3D terrain configuration

**Files:**
- Modify: `tests/unit/trail-navigation.start-map.test.tsx`
- Modify: `src/features/trail-navigation/components/TrailNavigationMap.tsx`

- [ ] **Step 1: Install the isolated worktree dependencies and verify the baseline**

Run:

```bash
npm install
npm test -- tests/unit/trail-navigation.start-map.test.tsx --runInBand
```

Expected: dependencies install without changing `package.json` or `package-lock.json`; the existing focused suite passes before the terrain test is added.

- [ ] **Step 2: Make the Mapbox test double expose terrain configuration**

In `tests/unit/trail-navigation.start-map.test.tsx`, replace the current Map mock callback signature and rendered map element with:

```tsx
(
  {
    children,
    onMoveStart,
    terrain,
    maxPitch,
    initialViewState,
  }: {
    children: React.ReactNode
    onMoveStart?: (evt: unknown) => void
    terrain?: { source: string; exaggeration: number }
    maxPitch?: number
    initialViewState?: Record<string, number>
  },
  ref: React.Ref<unknown>,
) => {
  const React = jest.requireActual('react') as typeof import('react')
  mockOnMoveStart = onMoveStart ?? null
  React.useImperativeHandle(ref, () => ({
    getMap: () => ({
      easeTo: mockEaseTo,
      dragRotate: {
        disable: mockDragRotateDisable,
        enable: mockDragRotateEnable,
      },
      touchZoomRotate: {
        disableRotation: mockTouchRotationDisable,
        enableRotation: mockTouchRotationEnable,
      },
    }),
    flyTo: mockFlyTo,
  }))
  return (
    <div
      data-testid="mapbox-outdoors"
      data-terrain={terrain ? JSON.stringify(terrain) : undefined}
      data-max-pitch={maxPitch}
      data-initial-view-state={initialViewState ? JSON.stringify(initialViewState) : undefined}
    >
      {children}
    </div>
  )
}
```

Replace the `Source` mock with a version that exposes only the Mapbox source metadata required by the acceptance criterion:

```tsx
Source: ({
  children,
  id,
  type,
  url,
  tileSize,
  maxzoom,
}: {
  children?: React.ReactNode
  id: string
  type: string
  url?: string
  tileSize?: number
  maxzoom?: number
}) => (
  <div
    data-testid={`map-source-${id}`}
    data-source-type={type}
    data-source-url={url}
    data-tile-size={tileSize}
    data-max-zoom={maxzoom}
  >
    {children}
  </div>
),
```

This mock remains presentation-only: it does not simulate Mapbox terrain behavior or network calls.

- [ ] **Step 3: Write the failing AC-02-08/BR-30 regression**

Add this test after the existing `AC-02-03/AC-04-01` ready-mode test:

```tsx
it('AC-02-08/BR-30: enables Mapbox terrain without IGN and preserves the immersive camera pitch', async () => {
  const watchPosition = jest.fn((success: PositionCallback) => {
    success(makePosition({ latitude: 45.8732, longitude: 6.6731 }))
    return 42
  })
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { watchPosition, clearWatch: jest.fn() },
  })

  render(<TrailNavigationMap trail={trail} />)

  const map = screen.getByTestId('mapbox-outdoors')
  expect(JSON.parse(map.getAttribute('data-terrain') ?? 'null')).toEqual({
    source: 'mapbox-dem',
    exaggeration: 1.2,
  })
  expect(map).toHaveAttribute('data-max-pitch', '75')
  expect(JSON.parse(map.getAttribute('data-initial-view-state') ?? 'null')).toMatchObject({
    pitch: 0,
  })

  const dem = screen.getByTestId('map-source-mapbox-dem')
  expect(dem).toHaveAttribute('data-source-type', 'raster-dem')
  expect(dem).toHaveAttribute('data-source-url', 'mapbox://mapbox.mapbox-terrain-dem-v1')
  expect(dem).toHaveAttribute('data-tile-size', '512')
  expect(dem).toHaveAttribute('data-max-zoom', '14')
  expect(screen.queryByTestId('map-source-ign-base')).not.toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
  await waitFor(() => expect(watchPosition).toHaveBeenCalledTimes(1))
  expect(mockFlyTo).toHaveBeenCalledWith(expect.objectContaining({ pitch: 55 }))

  mockFlyTo.mockClear()
  await userEvent.click(screen.getByRole('button', { name: 'Recentrer sur ma position' }))
  expect(mockFlyTo).toHaveBeenCalledWith(expect.objectContaining({ pitch: 55 }))
})
```

- [ ] **Step 4: Run the regression and verify RED**

Run:

```bash
npm test -- tests/unit/trail-navigation.start-map.test.tsx --runInBand
```

Expected: FAIL because the map has no `terrain` value, no `maxPitch=75`, no explicit initial `pitch=0`, and no `map-source-mapbox-dem`.

- [ ] **Step 5: Add the minimal terrain configuration**

In `src/features/trail-navigation/components/TrailNavigationMap.tsx`, extend the existing Map configuration:

```tsx
<Map
  ref={mapRef}
  mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
  initialViewState={{
    latitude: trail.start_latitude,
    longitude: trail.start_longitude,
    zoom: 14,
    bearing: 0,
    pitch: 0,
  }}
  maxPitch={75}
  terrain={{ source: 'mapbox-dem', exaggeration: 1.2 }}
  touchPitch={true}
  mapStyle="mapbox://styles/mapbox/outdoors-v12"
  style={{ width: '100%', height: '100%' }}
>
```

Immediately before the existing `trail-navigation-line` source, add:

```tsx
<Source
  id="mapbox-dem"
  type="raster-dem"
  url="mapbox://mapbox.mapbox-terrain-dem-v1"
  tileSize={512}
  maxzoom={14}
/>
```

Do not change `tiltMapForImmersion`, `recenterOnPosition`, the auto-follow `easeTo`, the trail line, the user track, GPS behavior, Close/Stop behavior or session statistics.

- [ ] **Step 6: Run the focused suite and verify GREEN**

Run:

```bash
npm test -- tests/unit/trail-navigation.start-map.test.tsx --runInBand
```

Expected: the complete focused suite passes, including `AC-02-08/BR-30`; the pre-existing GPS, line-safety, Close and session tests remain green.

- [ ] **Step 7: Verify the implementation scope and privacy invariant**

Run:

```bash
rg -n "mapbox-dem|mapbox-terrain-dem-v1|maxPitch|terrain=" src/features/trail-navigation/components/TrailNavigationMap.tsx
rg -n "IGN|Géoplateforme|data.geopf|ign-base|fetch\(" src/features/trail-navigation
git diff --check
git status --short
```

Expected: the first command shows only the approved Mapbox terrain configuration; the second command has no production match; status contains only the component and focused unit test.

- [ ] **Step 8: Commit the terrain implementation**

```bash
git add src/features/trail-navigation/components/TrailNavigationMap.tsx tests/unit/trail-navigation.start-map.test.tsx
git commit -m "feat: add 3d terrain to trail navigation"
```

---

## Task 2: Trace the terrain requirement and verify the full trail feature

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Add the AC-02-08/BR-30 traceability row**

Under `## 021 — Trail Navigation`, immediately after the existing `AC-02-07/BR-29` row, add:

```markdown
| AC-02-08/BR-30 | Relief Mapbox Terrain `1.2` sur le fond `outdoors-v12`, pitch initial `0°`, immersion GPS et recentrage à `55°`, maximum `75°`, sans IGN ni second Map Load | `src/features/trail-navigation/components/TrailNavigationMap.tsx` | `tests/unit/trail-navigation.start-map.test.tsx` | ✅ done |
```

- [ ] **Step 2: Run all trail-navigation tests**

Run:

```bash
npm test -- tests/unit/trail-navigation.actions.test.tsx tests/unit/trail-navigation.geo.test.ts tests/unit/trail-navigation.session-stats.test.ts tests/unit/trail-navigation.session-hook.test.tsx tests/unit/trail-navigation.session-summary-modal.test.tsx tests/unit/trail-navigation.start-map.test.tsx tests/integration/trail-navigation.public-detail.test.tsx tests/integration/trail-navigation.session-flow.test.tsx --runInBand
```

Expected: all 8 suites pass. The prior baseline was 95 tests; the new terrain regression increases the total to 96.

- [ ] **Step 3: Run strict TypeScript and the production build**

Run:

```bash
npx tsc --noEmit --incremental false
set -a
source ../../.env
source ../../.env.local
set +a
npm run build
```

Expected: TypeScript exits `0`; the production build compiles, performs its TypeScript phase and generates all static pages. If Turbopack cannot bind its internal port inside the sandbox, rerun the same build with the required sandbox approval.

- [ ] **Step 4: Recheck terrain, privacy and scope**

Run:

```bash
rg -n "mapbox-dem|mapbox-terrain-dem-v1|maxPitch|terrain=" src/features/trail-navigation/components/TrailNavigationMap.tsx
rg -n "IGN|Géoplateforme|data.geopf|ign-base|fetch\(" src/features/trail-navigation
git diff --check
git status --short
```

Expected: Mapbox terrain values match `AC-02-08/BR-30`; no IGN or frontend fetch is introduced; only `docs/traceability-matrix.md` remains modified before the documentation commit.

- [ ] **Step 5: Commit traceability**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace trail navigation 3d terrain"
```

- [ ] **Step 6: Final audit**

Confirm every item against code, tests and documentation:

- `specs/features/021-trail-navigation/spec.md` remains `status: approved`;
- the mode still uses `outdoors-v12` and a single Map instance;
- `mapbox-dem` is a `raster-dem` source with the approved URL, tile size and max zoom;
- terrain exaggeration is exactly `1.2`;
- initial pitch is `0°`, immersive/recenter pitch is `55°`, maximum is `75°`;
- auto-follow moves only the center and preserves the current pitch;
- no IGN / Géoplateforme source, selector, endpoint or frontend fetch exists in trail navigation;
- official trail line, user track, GPS consent, 1,500 m / 35 m rules, Close, Stop and summary behavior are unchanged;
- traceability maps `AC-02-08/BR-30` to the component and regression test;
- worktree is clean and contains no unrelated `guide-customization` changes.
