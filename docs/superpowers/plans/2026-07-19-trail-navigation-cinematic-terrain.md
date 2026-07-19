# Trail Navigation Cinematic Terrain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Renforcer le relief de la carte randonnée avec une géométrie `1.4`, un hillshade directionnel contrasté et une caméra GPS à `60°`, sans ajouter de source DEM ni de Map Load.

**Architecture:** `TrailNavigationMap` conserve son instance Mapbox, son fond `outdoors-v12` et sa source `mapbox-dem`. La source DEM existante contient une couche `hillshade` rendue avant la source du tracé ; le contrat visuel est couvert dans le test unitaire Mapbox existant, puis la matrice de traçabilité est alignée avec `AC-02-08/BR-30`.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, `react-map-gl` 8, Mapbox GL JS 3, Jest, Testing Library

---

## File map

- Modify: `tests/unit/trail-navigation.start-map.test.tsx` — expose les propriétés des couches Mapbox dans le mock et verrouille le contrat cinématique.
- Modify: `src/features/trail-navigation/components/TrailNavigationMap.tsx` — applique l'exagération, le hillshade et le pitch validés.
- Modify: `docs/traceability-matrix.md` — relie le contrat `AC-02-08/BR-30` actualisé au composant et à son test.

No new component, hook, source, endpoint, model, preference or dependency is introduced.

### Task 1: Write the failing cinematic-terrain regression

**Files:**
- Modify: `tests/unit/trail-navigation.start-map.test.tsx:102`
- Modify: `tests/unit/trail-navigation.start-map.test.tsx:208-246`

- [ ] **Step 1: Extend the Mapbox `Layer` mock with observable style properties**

Replace the current one-line `Layer` mock with:

```tsx
  Layer: ({
    id,
    type,
    paint,
  }: {
    id: string
    type?: string
    paint?: Record<string, unknown>
  }) => (
    <div
      data-testid={`map-layer-${id}`}
      data-layer-type={type}
      data-layer-paint={paint ? JSON.stringify(paint) : undefined}
    />
  ),
```

This keeps every existing layer assertion valid and makes the hillshade contract observable without mocking Mapbox internals.

- [ ] **Step 2: Replace the existing `AC-02-08/BR-30` expectations**

Keep the test setup and replace its assertions with the following complete contract:

```tsx
  it('AC-02-08/BR-30: renders one contrasted DEM terrain and preserves the cinematic camera pitch', async () => {
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
      exaggeration: 1.4,
    })
    expect(map).toHaveAttribute('data-map-style', 'mapbox://styles/mapbox/outdoors-v12')
    expect(map).toHaveAttribute('data-max-pitch', '75')
    expect(JSON.parse(map.getAttribute('data-initial-view-state') ?? 'null')).toMatchObject({
      pitch: 0,
    })

    const dem = screen.getByTestId('map-source-mapbox-dem')
    expect(dem).toHaveAttribute('data-source-type', 'raster-dem')
    expect(dem).toHaveAttribute('data-source-url', 'mapbox://mapbox.mapbox-terrain-dem-v1')
    expect(dem).toHaveAttribute('data-tile-size', '512')
    expect(dem).toHaveAttribute('data-max-zoom', '14')
    expect(screen.getAllByTestId('map-source-mapbox-dem')).toHaveLength(1)

    const hillshade = within(dem).getByTestId('map-layer-trail-terrain-hillshade')
    expect(hillshade).toHaveAttribute('data-layer-type', 'hillshade')
    expect(JSON.parse(hillshade.getAttribute('data-layer-paint') ?? 'null')).toEqual({
      'hillshade-exaggeration': 0.8,
      'hillshade-illumination-direction': 315,
      'hillshade-illumination-anchor': 'map',
      'hillshade-shadow-color': 'rgba(18, 31, 24, 0.72)',
      'hillshade-highlight-color': 'rgba(255, 248, 220, 0.42)',
      'hillshade-accent-color': 'rgba(65, 82, 70, 0.55)',
    })
    expect(
      hillshade.compareDocumentPosition(screen.getByTestId('map-layer-trail-line'))
      & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.queryByTestId('map-source-ign-base')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
    await waitFor(() => expect(watchPosition).toHaveBeenCalledTimes(1))
    expect(mockFlyTo).toHaveBeenCalledWith(expect.objectContaining({ pitch: 60 }))

    mockFlyTo.mockClear()
    await userEvent.click(screen.getByRole('button', { name: 'Recentrer sur ma position' }))
    expect(mockFlyTo).toHaveBeenCalledWith(expect.objectContaining({ pitch: 60 }))
  })
```

- [ ] **Step 3: Run the focused test and confirm the RED state**

Run:

```bash
npm test -- --runInBand tests/unit/trail-navigation.start-map.test.tsx
```

Expected: FAIL in `AC-02-08/BR-30` because the component still returns terrain exaggeration `1.2`, has no `map-layer-trail-terrain-hillshade`, and uses pitch `55`.

### Task 2: Implement the cinematic terrain contract

**Files:**
- Modify: `src/features/trail-navigation/components/TrailNavigationMap.tsx:144-150`
- Modify: `src/features/trail-navigation/components/TrailNavigationMap.tsx:187-196`
- Modify: `src/features/trail-navigation/components/TrailNavigationMap.tsx:312-349`
- Test: `tests/unit/trail-navigation.start-map.test.tsx`

- [ ] **Step 1: Increase the two explicit immersive camera movements**

In `tiltMapForImmersion`, change only the pitch:

```tsx
  function tiltMapForImmersion() {
    mapRef.current?.flyTo({
      pitch: 60,
      zoom: 16,
      duration: 1500,
      essential: true,
    })
  }
```

In `recenterOnPosition`, keep the center, zoom and timing unchanged and use:

```tsx
  function recenterOnPosition() {
    if (!position) return
    setIsFollowing(true)
    mapRef.current?.flyTo({
      center: [position.longitude, position.latitude],
      zoom: 17.5,
      pitch: 60,
      duration: 800,
      essential: true,
    })
  }
```

The automatic `easeTo` effect must remain unchanged so it continues moving only `center` and preserves the current pitch.

- [ ] **Step 2: Increase terrain exaggeration without changing initial or maximum pitch**

Keep `initialViewState.pitch` at `0`, keep `maxPitch={75}`, and replace the terrain prop with:

```tsx
        terrain={{ source: 'mapbox-dem', exaggeration: 1.4 }}
```

- [ ] **Step 3: Nest the contrasted hillshade inside the existing DEM source**

Replace the self-closing `mapbox-dem` source with this source and layer, immediately before `trail-navigation-line`:

```tsx
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        >
          <Layer
            id="trail-terrain-hillshade"
            type="hillshade"
            paint={{
              'hillshade-exaggeration': 0.8,
              'hillshade-illumination-direction': 315,
              'hillshade-illumination-anchor': 'map',
              'hillshade-shadow-color': 'rgba(18, 31, 24, 0.72)',
              'hillshade-highlight-color': 'rgba(255, 248, 220, 0.42)',
              'hillshade-accent-color': 'rgba(65, 82, 70, 0.55)',
            }}
          />
        </Source>
```

Do not add a second `Source`, an `onZoomEnd` handler, an IGN layer or another `Map` instance.

- [ ] **Step 4: Run the focused test and confirm the GREEN state**

Run:

```bash
npm test -- --runInBand tests/unit/trail-navigation.start-map.test.tsx
```

Expected: PASS, 21 tests passed in the focused suite.

- [ ] **Step 5: Commit the tested component change**

```bash
git add src/features/trail-navigation/components/TrailNavigationMap.tsx tests/unit/trail-navigation.start-map.test.tsx
git commit -m "feat: strengthen trail terrain contrast"
```

### Task 3: Update traceability and run the complete verification

**Files:**
- Modify: `docs/traceability-matrix.md:456`

- [ ] **Step 1: Replace the `AC-02-08/BR-30` traceability row**

Use the exact row:

```markdown
| AC-02-08/BR-30 | Relief Mapbox Terrain `1.4` et hillshade contrasté sur le fond `outdoors-v12`, pitch initial `0°`, immersion GPS et recentrage à `60°`, maximum `75°`, sans IGN, seconde source DEM ni second Map Load | `src/features/trail-navigation/components/TrailNavigationMap.tsx` | `tests/unit/trail-navigation.start-map.test.tsx` | ✅ done |
```

- [ ] **Step 2: Run all trail-navigation suites**

Run:

```bash
npm test -- --runInBand \
  tests/unit/trail-navigation.actions.test.tsx \
  tests/unit/trail-navigation.geo.test.ts \
  tests/unit/trail-navigation.session-hook.test.tsx \
  tests/unit/trail-navigation.session-stats.test.ts \
  tests/unit/trail-navigation.session-summary-modal.test.tsx \
  tests/unit/trail-navigation.start-map.test.tsx \
  tests/integration/trail-navigation.public-detail.test.tsx \
  tests/integration/trail-navigation.session-flow.test.tsx
```

Expected: PASS for all 8 suites and 96 tests. Existing duplicate-mock warnings from unrelated worktrees do not constitute a test failure.

- [ ] **Step 3: Run strict TypeScript verification**

Run:

```bash
npx tsc --noEmit
```

Expected: exit code `0`, no TypeScript errors.

- [ ] **Step 4: Run the production build**

Run:

```bash
npm run build
```

Expected: exit code `0`; Prisma generation and the Next.js production build complete successfully.

- [ ] **Step 5: Check the final scoped diff**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors. Before the documentation commit, only `docs/traceability-matrix.md` is modified by this plan; the four pre-existing guide-customization changes remain untouched and unstaged.

- [ ] **Step 6: Commit traceability**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace cinematic trail terrain"
```

## Final acceptance checklist

- [ ] Terrain references exactly one `mapbox-dem` source with exaggeration `1.4`.
- [ ] Hillshade is a child of the existing DEM source and precedes the official trail layer.
- [ ] Hillshade intensity, illumination direction and three colors match `BR-30` exactly.
- [ ] Ready mode remains at pitch `0°`; GPS activation and recentering use `60°`; maximum pitch remains `75°`.
- [ ] Automatic tracking still updates only the center and preserves the current camera pitch.
- [ ] No IGN, Géoplateforme, second DEM source, second Map instance or new dependency is introduced.
- [ ] All trail suites, TypeScript and production build pass.
- [ ] Traceability describes the implemented cinematic terrain contract.
