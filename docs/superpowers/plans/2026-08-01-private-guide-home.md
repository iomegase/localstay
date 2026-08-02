# Private Guide Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer `/sejour` comme nouvelle home privée MyStay, alimentée par le Lodging actif et rendue par le `GuideApp` partagé, tout en conservant les routes privées historiques comme destinations temporaires.

**Architecture:** Un Server Component résout le contexte de séjour et charge un modèle `GuideLodging`/`GuidePoi[]` via une query Prisma dédiée. Le `GuideApp` reçoit une table optionnelle de routes : en démo il conserve sa navigation interne, tandis que sur `/sejour` les vues enfants encore non migrées ouvrent les routes privées historiques. Le proxy QR redirige vers `/sejour` après avoir posé le cookie existant.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Prisma, Tailwind CSS, Jest/Testing Library, Next.js Proxy.

---

## File Map

- Create `src/features/guide-app/queries/private-guide-data.ts`: charger et adapter les données privées réelles.
- Create `src/app/(public)/sejour/page.tsx`: route privée canonique et Server Component.
- Modify `src/features/guide-app/types.ts`: déclarer `GuideRouteMap` et le modèle de données de la home privée.
- Modify `src/features/guide-app/components/GuideApp.tsx`: router les vues vers des URLs seulement en mode privé configuré.
- Modify `src/features/guide-app/components/GuideMenuOverlay.tsx`: rendre de vrais liens privés sans changer le menu de démonstration.
- Modify `src/proxy.ts`: diriger l'entrée QR vers `/sejour`.
- Create `tests/unit/private-guide-app.AC-01-05.data.test.ts`: contrat de mapping Prisma vers `GuideApp`.
- Create `tests/integration/private-guide-app.AC-01-01-04.home.test.tsx`: rendu et navigation de `/sejour`.
- Modify `tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts`: nouvelle destination QR.
- Modify `tests/unit/proxy.guest-confinement.test.ts`: protection et confinement `/sejour`.
- Modify `docs/traceability-matrix.md`: relier la spec 034 au code et aux tests.

### Task 1: Contractualiser les données privées du GuideApp

**Files:**
- Create: `tests/unit/private-guide-app.AC-01-05.data.test.ts`
- Create: `src/features/guide-app/queries/private-guide-data.ts`
- Modify: `src/features/guide-app/types.ts`

- [ ] **Step 1: Write the failing mapping test**

```ts
/** @jest-environment node */

import { prisma } from '@/shared/lib/prisma'
import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingFeaturedPoi: { findMany: jest.fn() },
  },
}))

const lodgingFindFirst = prisma.lodging.findFirst as jest.Mock
const featuredFindMany = prisma.lodgingFeaturedPoi.findMany as jest.Mock

describe('034-private-guide-app private data adapter', () => {
  it('maps only active real lodging recommendations in owner order', async () => {
    lodgingFindFirst.mockResolvedValue({
      id: 'lodging-1',
      name: 'Le Chalet Hygge',
      city: { name: 'Saint-Gervais-les-Bains', latitude: 45.891, longitude: 6.713 },
      customization: {
        welcome_message: 'Bienvenue au chalet',
        cover_photo_url: '/chalet.jpg',
        lodging_address: '1 rue du Mont-Blanc',
        lodging_latitude: 45.89,
        lodging_longitude: 6.71,
        wifi_ssid: null,
        wifi_password: null,
        equipment_info: null,
        checkout_instructions: null,
        house_rules: null,
        emergency_contacts: null,
        useful_services: null,
      },
      practical_blocks: [],
    })
    featuredFindMany.mockResolvedValue([
      {
        owner_note: 'Notre table préférée',
        poi: {
          id: 'poi-1', name: 'Rond de Carotte', slug: 'rond-de-carotte',
          description: 'Cuisine locale', address: 'Saint-Gervais', latitude: 45.89,
          longitude: 6.71, phone: null, website: 'https://example.com', rating: 4.8,
          rating_count: 120, is_open_now: true, hours: null, photos: ['/hero.jpg'],
          category: { slug: 'diner', name: 'Restaurants', icon: 'utensils' },
          trail_detail: null,
        },
      },
    ])

    const result = await getPrivateGuideData('lodging-1')

    expect(result?.lodging.name).toBe('Le Chalet Hygge')
    expect(result?.lodging.city).toBe('Saint-Gervais-les-Bains')
    expect(result?.pois).toHaveLength(1)
    expect(result?.pois[0]).toMatchObject({
      name: 'Rond de Carotte',
      photos: ['/hero.jpg'],
      ownerNote: 'Notre table préférée',
      recommended: true,
    })
    expect(featuredFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ lodging_id: 'lodging-1', deleted_at: null }),
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    }))
  })

  it('returns null when the active lodging cannot be resolved', async () => {
    lodgingFindFirst.mockResolvedValue(null)
    await expect(getPrivateGuideData('missing')).resolves.toBeNull()
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --runInBand tests/unit/private-guide-app.AC-01-05.data.test.ts`

Expected: FAIL because `private-guide-data` does not exist.

- [ ] **Step 3: Add the private route and data types**

Add to `src/features/guide-app/types.ts`:

```ts
export type GuideRouteMap = Partial<Record<Exclude<GuideView, 'poi'>, string>>

export type PrivateGuideData = {
  lodging: GuideLodging
  pois: GuidePoi[]
}
```

- [ ] **Step 4: Implement the Prisma adapter**

Create `getPrivateGuideData(lodgingId: string): Promise<PrivateGuideData | null>` with these exact rules:

```ts
const lodging = await prisma.lodging.findFirst({
  where: { id: lodgingId, deleted_at: null, is_active: true },
  select: {
    id: true,
    name: true,
    city: { select: { name: true, latitude: true, longitude: true } },
    customization: {
      select: {
        welcome_message: true,
        cover_photo_url: true,
        lodging_address: true,
        lodging_latitude: true,
        lodging_longitude: true,
        wifi_ssid: true,
        wifi_password: true,
        equipment_info: true,
        checkout_instructions: true,
        house_rules: true,
        emergency_contacts: true,
        useful_services: true,
      },
    },
    practical_blocks: {
      where: { deleted_at: null },
      orderBy: { sort_order: 'asc' },
      select: { id: true, title: true, body: true, icon: true, video_url: true },
    },
  },
})
```

Then load `lodgingFeaturedPoi` with `poi.is_active = true`, `poi.deleted_at = null`, `trail_detail.deleted_at = null`, and map without `any`:

```ts
return {
  lodging: {
    id: lodging.id,
    name: lodging.name,
    city: lodging.city.name,
    tagline: customization?.welcome_message?.trim() || `Bienvenue à ${lodging.city.name}`,
    coverImage: customization?.cover_photo_url || '/fallback/fallback-lodging.png',
    gallery: customization?.cover_photo_url ? [customization.cover_photo_url] : [],
    latitude: customization?.lodging_latitude ?? lodging.city.latitude,
    longitude: customization?.lodging_longitude ?? lodging.city.longitude,
    addressLabel: customization?.lodging_address ?? lodging.city.name,
    checkIn: '16:00',
    checkOut: '10:00',
    wifiName: customization?.wifi_ssid ?? '',
    wifiPassword: customization?.wifi_password ?? '',
    arrivalInstructions: [],
    departureInstructions: splitContent(customization?.checkout_instructions),
    equipment: splitContent(customization?.equipment_info),
    houseRules: splitContent(customization?.house_rules),
    practicalCards: lodging.practical_blocks.map(block => ({
      id: block.id,
      title: block.title,
      description: block.body ?? '',
      icon: block.icon,
      videoUrl: block.video_url ?? undefined,
    })),
    usefulNumbers: mapUsefulNumbers(customization?.emergency_contacts),
  },
  pois: featuredRows.map(mapPrivateGuidePoi),
}
```

`mapPrivateGuidePoi` must use `getCategoryColor`, `computeIsOpenNow`, the real photo order, the owner note, Google Maps coordinates, and the existing `TrailDetail` fields. `trackingEnabled` is true only when `isValidTrailGeometry(geometry_geojson)` and `data_quality_status` is `complete` or `partial`.

- [ ] **Step 5: Run the data test and verify GREEN**

Run: `npm test -- --runInBand tests/unit/private-guide-app.AC-01-05.data.test.ts`

Expected: PASS, 2 tests.

- [ ] **Step 6: Commit the data boundary**

```bash
git add src/features/guide-app/types.ts src/features/guide-app/queries/private-guide-data.ts tests/unit/private-guide-app.AC-01-05.data.test.ts
git commit -m "feat: adapt private stay data for GuideApp"
```

### Task 2: Add route-aware navigation without regressing the demo

**Files:**
- Create: `tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`
- Modify: `src/features/guide-app/components/GuideApp.tsx`
- Modify: `src/features/guide-app/components/GuideMenuOverlay.tsx`

- [ ] **Step 1: Write the failing private navigation test**

```tsx
/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'

const push = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

describe('034-private-guide-app route-aware shell', () => {
  beforeEach(() => push.mockClear())

  it('uses private routes from the shared GuideApp home', () => {
    render(
      <GuideApp
        mode="private"
        lodging={{ ...demoLodging, name: 'Le Chalet Hygge' }}
        pois={[]}
        routes={{
          home: '/sejour',
          favorites: '/nos-recommandations',
          lodging: '/le-logement',
          map: '/map',
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /explorer/i }))
    expect(push).toHaveBeenCalledWith('/nos-recommandations')
    fireEvent.click(screen.getByRole('button', { name: 'Guide logement' }))
    expect(push).toHaveBeenCalledWith('/le-logement')
  })

  it('renders functional private menu links', () => {
    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={[]}
        routes={{ home: '/sejour', lodging: '/le-logement', map: '/map' }}
        menuItems={[
          { label: 'Bienvenue', href: '/sejour' },
          { label: 'Vos favoris', href: '/mes-favoris' },
        ]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.getByRole('link', { name: 'Bienvenue' })).toHaveAttribute('href', '/sejour')
    expect(screen.getByRole('link', { name: 'Vos favoris' })).toHaveAttribute('href', '/mes-favoris')
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --runInBand tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`

Expected: FAIL because `GuideApp` does not accept `routes` or `menuItems`.

- [ ] **Step 3: Implement optional route-aware navigation**

In `GuideApp.tsx`, add optional props:

```ts
routes?: GuideRouteMap
menuItems?: GuideMenuItem[]
```

Use `useRouter()` and change only the central `navigate` function:

```ts
function navigate(view: GuideView) {
  const href = view === 'poi' ? undefined : routes?.[view]
  if (href) {
    router.push(href)
    return
  }
  if (view !== 'poi' && view !== 'map') setSelectedPoiId(null)
  setActiveView(view)
}
```

The demo passes no `routes`, so its current no-URL-change behavior remains exact.

- [ ] **Step 4: Make the menu data-driven**

Export from `GuideMenuOverlay.tsx`:

```ts
export type GuideMenuItem = {
  label: string
  href?: string
}
```

Render a Next.js `Link` when `href` exists and the existing disabled `span` otherwise. Keep Framer Motion, Escape handling and the current visual classes unchanged.

- [ ] **Step 5: Verify private and demo navigation together**

Run: `npm test -- --runInBand tests/integration/private-guide-app.AC-01-03.navigation.test.tsx tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`

Expected: PASS, private routes use `push`; demo URL stays unchanged.

- [ ] **Step 6: Commit the shared navigation contract**

```bash
git add src/features/guide-app/components/GuideApp.tsx src/features/guide-app/components/GuideMenuOverlay.tsx tests/integration/private-guide-app.AC-01-03.navigation.test.tsx
git commit -m "feat: make GuideApp navigation route aware"
```

### Task 3: Create the protected `/sejour` Server Component

**Files:**
- Create: `tests/integration/private-guide-app.AC-01-01-04.home.test.tsx`
- Create: `src/app/(public)/sejour/page.tsx`

- [ ] **Step 1: Write the failing page integration test**

```tsx
/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import SejourPage from '@/app/(public)/sejour/page'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(),
}))
jest.mock('@/features/guide-app/queries/private-guide-data', () => ({
  getPrivateGuideData: jest.fn(),
}))
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: () => ({ push: jest.fn() }),
}))

describe('034-private-guide-app /sejour', () => {
  it('renders the shared private home with the active lodging', async () => {
    ;(getActiveLodgingContext as jest.Mock).mockResolvedValue({
      lodgingId: 'lodging-1', lodgingName: 'Le Chalet Hygge',
      citySlug: 'saint-gervais-les-bains', cityName: 'Saint-Gervais-les-Bains',
      ownerName: 'David',
    })
    ;(getPrivateGuideData as jest.Mock).mockResolvedValue({
      lodging: {
        id: 'lodging-1', name: 'Le Chalet Hygge', city: 'Saint-Gervais-les-Bains',
        tagline: '', coverImage: '', gallery: [], latitude: 45.89, longitude: 6.71,
        addressLabel: '', checkIn: '16:00', checkOut: '10:00', wifiName: '',
        wifiPassword: '', arrivalInstructions: [], departureInstructions: [],
        equipment: [], houseRules: [], practicalCards: [], usefulNumbers: [],
      },
      pois: [{ id: '1' }, { id: '2' }],
    })

    render(await SejourPage())

    expect(screen.getByRole('heading', { name: 'Bienvenue au Chalet Hygge' })).toBeInTheDocument()
    expect(screen.getByText('2 adresses sélectionnées')).toBeInTheDocument()
    expect(screen.queryByText('Le Refuge du Mont-Blanc')).not.toBeInTheDocument()
  })
})
```

Use complete `GuidePoi` fixtures rather than unsafe casts in the final test file.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --runInBand tests/integration/private-guide-app.AC-01-01-04.home.test.tsx`

Expected: FAIL because `/sejour/page.tsx` does not exist.

- [ ] **Step 3: Implement `/sejour/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'

export const dynamic = 'force-dynamic'

export default async function SejourPage() {
  const context = await getActiveLodgingContext()
  if (!context) redirect('/')

  const data = await getPrivateGuideData(context.lodgingId)
  if (!data) redirect('/')

  return (
    <GuideApp
      mode="private"
      lodging={data.lodging}
      pois={data.pois}
      routes={{
        home: '/sejour',
        favorites: '/nos-recommandations',
        lodging: '/le-logement',
        map: '/map',
      }}
      menuItems={[
        { label: 'Bienvenue', href: '/sejour' },
        { label: 'Nos coups de cœur', href: '/nos-recommandations' },
        { label: 'Guide logement', href: '/le-logement' },
        { label: 'Vos favoris', href: '/mes-favoris' },
        { label: 'Carte', href: '/map' },
        { label: 'Agenda', href: `/guide/${context.citySlug}/agenda` },
        { label: 'Nous contacter', href: `/guide/${context.citySlug}/contact` },
      ]}
    />
  )
}
```

- [ ] **Step 4: Run the page and route-aware tests**

Run: `npm test -- --runInBand tests/integration/private-guide-app.AC-01-01-04.home.test.tsx tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the new private home**

```bash
git add 'src/app/(public)/sejour/page.tsx' tests/integration/private-guide-app.AC-01-01-04.home.test.tsx
git commit -m "feat: add private stay home"
```

### Task 4: Redirect QR entry to the canonical private home

**Files:**
- Modify: `tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts`
- Modify: `tests/unit/proxy.guest-confinement.test.ts`
- Modify: `src/proxy.ts`

- [ ] **Step 1: Change the QR expectation first**

```ts
expect(response.headers.get('location')).toBe(
  `http://localhost:3000/sejour?lodging=${lodgingId}`,
)
```

Add a confinement assertion proving `/sejour` without a cookie is rewritten to `/acces-reserve` by the existing guest branch.

- [ ] **Step 2: Run proxy tests and verify RED**

Run: `npm test -- --runInBand tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts tests/unit/proxy.guest-confinement.test.ts`

Expected: QR test FAIL with `/nos-recommandations`; guest protection test already passes or documents the existing rewrite.

- [ ] **Step 3: Change only the QR destination**

In `src/proxy.ts`:

```ts
const destination = new URL('/sejour', request.url)
destination.searchParams.set('lodging', lodgingFromQuery)
```

Do not add `/sejour` to marketing or bypass prefixes.

- [ ] **Step 4: Verify QR, access protection and legacy routes**

Run: `npm test -- --runInBand tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts tests/unit/proxy.guest-confinement.test.ts tests/unit/public-marketing.AC-01-02.access-policy.test.ts`

Expected: PASS; `/sejour` remains private and the marketing allowlist is unchanged.

- [ ] **Step 5: Commit the canonical QR destination**

```bash
git add src/proxy.ts tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts tests/unit/proxy.guest-confinement.test.ts
git commit -m "feat: route stay QR entry to sejour"
```

### Task 5: Traceability and complete verification

**Files:**
- Modify: `docs/traceability-matrix.md`
- Test: all files created or modified above

- [ ] **Step 1: Add spec 034 rows to the traceability matrix**

```md
## 034 — Private Guide App

| Spec ID | Feature | User Story | Acceptance Criterion | Source File | Test File | Status |
|---|---|---|---|---|---|---|
| 034-private-guide-app | Home privée `/sejour` | US-01 | AC-01-01/03/04/05/06 | `src/app/(public)/sejour/page.tsx`<br>`src/features/guide-app/components/GuideApp.tsx`<br>`src/features/guide-app/queries/private-guide-data.ts` | `tests/integration/private-guide-app.AC-01-01-04.home.test.tsx`<br>`tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`<br>`tests/unit/private-guide-app.AC-01-05.data.test.ts` | ✅ done |
| 034-private-guide-app | Accès et QR | US-02 | AC-01-02/AC-02-01/02/03 | `src/proxy.ts` | `tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts`<br>`tests/unit/proxy.guest-confinement.test.ts` | ✅ done |
```

- [ ] **Step 2: Run the focused spec suite**

Run:

```bash
npm test -- --runInBand \
  tests/unit/private-guide-app.AC-01-05.data.test.ts \
  tests/integration/private-guide-app.AC-01-03.navigation.test.tsx \
  tests/integration/private-guide-app.AC-01-01-04.home.test.tsx \
  tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts \
  tests/unit/proxy.guest-confinement.test.ts \
  tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx
```

Expected: all suites PASS.

- [ ] **Step 3: Run TypeScript and lint on the changed source**

Run: `npx tsc --noEmit`

Expected: exit 0.

Run:

```bash
npx eslint \
  'src/app/(public)/sejour/page.tsx' \
  src/features/guide-app/components/GuideApp.tsx \
  src/features/guide-app/components/GuideMenuOverlay.tsx \
  src/features/guide-app/queries/private-guide-data.ts \
  tests/unit/private-guide-app.AC-01-05.data.test.ts \
  tests/integration/private-guide-app.AC-01-03.navigation.test.tsx \
  tests/integration/private-guide-app.AC-01-01-04.home.test.tsx
```

Expected: 0 errors.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: exit 0 and `/sejour` listed as a dynamic route.

- [ ] **Step 5: Verify desktop and mobile behavior**

With a valid local `lodging_id`, verify `/sejour` at 375×812, 768×1024 and 1440×1000:

- no horizontal overflow;
- private surface stays at 430 px maximum;
- header and bottom navigation remain visible;
- Explorer opens the historical recommendation list;
- Guide opens `/le-logement`;
- Carte opens `/map`;
- menu links are keyboard accessible;
- no geolocation prompt appears before the GPS action.

- [ ] **Step 6: Commit traceability and verification metadata**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace private guide home"
```

## Self-Review Result

- Spec coverage: AC-01-01 through AC-02-03 are assigned to explicit tasks.
- Scope: only `/sejour` is created; child pages remain historical destinations.
- Type consistency: `GuideRouteMap`, `PrivateGuideData` and `GuideMenuItem` have one canonical definition each.
- Security: `/sejour` is absent from anonymous and bypass allowlists.
- Regression boundary: demo navigation, QR activation, old private pages and trail `/start` are explicitly retained.
