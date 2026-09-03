# Public Demo From Private Guide Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public smartphone demo as a faithful, complete and autonomous reproduction of the private guide, while leaving every private guide file, route and behavior byte-for-byte unchanged.

**Architecture:** Keep the existing marketing launchers and Radix `Dialog`, but replace the modal body with a client-only `DemoGuideApp` owned entirely by `src/features/guide-demo/`. The app uses a typed local view state and deterministic TypeScript fixtures; it never imports `guide-app`, Prisma, private queries, cookies, private routes or internal APIs. Separate view components reproduce the private guide's hierarchy and interaction model without sharing or modifying private source.

**Tech Stack:** Next.js 16 App Router, React 19 client components, strict TypeScript, Tailwind CSS, Radix Dialog, Lucide React, Jest + Testing Library, Playwright.

---

## Non-negotiable safety boundary

The base commit for this branch is `0202d66`. Every implementation checkpoint must preserve the following paths exactly:

```text
src/features/guide-app/**
src/app/(public)/sejour/**
src/app/(public)/le-logement/**
src/app/(public)/nos-recommandations/**
src/app/(public)/map/**
src/app/(public)/mes-favoris/**
src/features/city-guide/components/PublicMenu.tsx
src/features/city-guide/components/PublicBottomNav.tsx
src/proxy.ts
```

Do not import source from `src/features/guide-app/` into the demo. Read those files only as a visual and functional reference.

Run this guard after every task that edits source:

```bash
git diff --name-only 0202d66...HEAD -- \
  'src/features/guide-app/**' \
  'src/app/(public)/sejour/**' \
  'src/app/(public)/le-logement/**' \
  'src/app/(public)/nos-recommandations/**' \
  'src/app/(public)/map/**' \
  'src/app/(public)/mes-favoris/**' \
  'src/features/city-guide/components/PublicMenu.tsx' \
  'src/features/city-guide/components/PublicBottomNav.tsx' \
  'src/proxy.ts'
```

Expected: no output.

## File map

### Create

- `src/features/guide-demo/types.ts` — autonomous demo-only contracts and view union.
- `src/features/guide-demo/demo-content.ts` — lodging cards, blog articles and contact fixtures.
- `src/features/guide-demo/components/DemoGuideApp.tsx` — local state machine, selection history and view composition.
- `src/features/guide-demo/components/DemoGuideChrome.tsx` — fixed header, bottom navigation and internal menu overlay.
- `src/features/guide-demo/components/DemoHomeView.tsx` — private-home-faithful welcome and primary actions.
- `src/features/guide-demo/components/DemoLodgingGuideView.tsx` — complete hero, stay facts and four accessible accordion groups.
- `src/features/guide-demo/components/DemoFavoritesView.tsx` — category filters and bento POI cards.
- `src/features/guide-demo/components/DemoPoiDetailView.tsx` — POI and trail details with disabled external-effect controls.
- `src/features/guide-demo/components/DemoMapView.tsx` — static local marker map with no geolocation or route request.
- `src/features/guide-demo/components/DemoEditorialViews.tsx` — local lodging, blog and contact list/detail views.
- `tests/unit/public-demo-private-reference.AC-02-02-03.security.test.ts` — static security and sensitive-content gate.
- `tests/integration/public-demo-private-reference.AC-01-01.navigation.test.tsx` — home, chrome and parent-return flow.
- `tests/integration/public-demo-private-reference.AC-01-02.lodging-guide.test.tsx` — full lodging guide order and accordions.
- `tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx` — favorites, POI, trail, map, lodgings, blog and contact.
- `tests/integration/public-demo-private-reference.AC-02-01-05.modal-isolation.test.tsx` — stable URL, no network and reset on reopen.
- `tests/e2e/public-demo-private-reference.AC-01-05.responsive.test.ts` — 320/375/desktop modal flow and overflow.

### Modify

- `src/features/guide-demo/demo-guide-data.ts` — use local types and add the complete fictional lodging fixture.
- `src/features/guide-demo/demo-pois.ts` — use local types; retain reviewed public POIs and demo-prefixed identifiers.
- `src/features/guide-demo/demo-poi-content.ts` — replace the shared POI-hours type with the local demo contract.
- `src/features/guide-demo/demo-trail-geometry.ts` — replace the shared trail type with the local demo geometry contract.
- `src/features/guide-demo/components/GuideDemoModal.tsx` — mount `DemoGuideApp` only when the dialog is open.
- `tests/integration/public-guide-demo.AC-05-01-03.modal.test.tsx` — keep the original modal accessibility contract, assert the autonomous root.
- `tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx` — migrate expectations from `GuideApp` to `DemoGuideApp` or remove after equivalent 045 tests pass and import audit confirms no remaining traceability need.
- `tests/e2e/public-guide-demo.AC-05-01-09.test.ts` — replace the superseded internal-flow expectations with the 045 responsive flow, or remove after the new 045 E2E test is green.
- `docs/traceability-matrix.md` — add the complete 045 mapping.

### Preserve

- `src/features/guide-demo/components/GuideDemoLauncher.tsx`
- `src/features/guide-demo/components/GuideDemoPhoneButton.tsx`
- `src/features/guide-demo/demo-media-policy.ts`

These files currently have active consumers. Delete one only if `rg` proves it has become orphaned after all tests and traceability have been migrated.

---

### Task 1: Establish autonomous demo contracts and static fixtures

**Files:**
- Create: `src/features/guide-demo/types.ts`
- Create: `src/features/guide-demo/demo-content.ts`
- Modify: `src/features/guide-demo/demo-guide-data.ts`
- Modify: `src/features/guide-demo/demo-pois.ts`
- Modify: `src/features/guide-demo/demo-poi-content.ts`
- Modify: `src/features/guide-demo/demo-trail-geometry.ts`
- Create: `tests/unit/public-demo-private-reference.AC-02-02-03.security.test.ts`

- [ ] **Step 1: Write the failing security and fixture test**

Create `tests/unit/public-demo-private-reference.AC-02-02-03.security.test.ts`:

```typescript
import fs from 'node:fs'
import path from 'node:path'
import { demoGuideData } from '@/features/guide-demo/demo-content'

const demoRoot = path.join(process.cwd(), 'src/features/guide-demo')

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(target)
    return /\.(ts|tsx)$/.test(entry.name) ? [target] : []
  })
}

describe('spec 045 autonomous demo security', () => {
  it('uses demo-prefixed non-UUID identifiers and complete static data', () => {
    expect(demoGuideData.lodging.id).toMatch(/^demo-/)
    expect(demoGuideData.favoritePois.length).toBeGreaterThan(0)
    expect(demoGuideData.lodgingCards.length).toBeGreaterThan(0)
    expect(demoGuideData.blogPosts.length).toBeGreaterThan(0)
    expect(demoGuideData.contact.lodgingName).toBe('Le 305 — démonstration')

    const serialized = JSON.stringify(demoGuideData)
    expect(serialized).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
    )
    expect(serialized).not.toMatch(/digicode|boîte à clés|serrure|plaque|mot de passe réel/i)
  })

  it('contains no private runtime dependency, persistence or data API', () => {
    const source = sourceFiles(demoRoot)
      .map(file => fs.readFileSync(file, 'utf8'))
      .join('\n')

    expect(source).not.toMatch(/@\/features\/guide-app/)
    expect(source).not.toMatch(/@\/shared\/lib\/prisma/)
    expect(source).not.toMatch(/next\/navigation/)
    expect(source).not.toMatch(/document\.cookie|localStorage|sessionStorage/)
    expect(source).not.toMatch(/fetch\s*\(/)
    expect(source).not.toMatch(/\/api\//)
  })
})
```

- [ ] **Step 2: Run the test and verify the current private dependency is caught**

Run:

```bash
npm test -- --runInBand tests/unit/public-demo-private-reference.AC-02-02-03.security.test.ts
```

Expected: FAIL because `demo-content.ts` does not exist and the current demo imports `@/features/guide-app`.

- [ ] **Step 3: Create the demo-only type contract**

Create `src/features/guide-demo/types.ts` with these exact public contracts:

```typescript
export type DemoGuideView =
  | 'home'
  | 'lodging'
  | 'favorites'
  | 'map'
  | 'poi'
  | 'lodgings'
  | 'lodging-detail'
  | 'blog'
  | 'blog-detail'
  | 'contact'

export type DemoPoiCategory = {
  slug: string
  name: string
  icon: string
  color: string
}

export type DemoTrail = {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'unknown'
  distanceKm: number | null
  elevationGainM: number | null
  estimatedDurationMinutes: number | null
  startLabel: string | null
  geometry?: unknown
  startLatitude?: number | null
  startLongitude?: number | null
  reliability?: 'reliable' | 'indicative'
  trackingEnabled: false
}

export type DemoPoiHours = Readonly<
  Partial<Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', { open: string; close: string } | null>>
>

export type DemoTrailGeometry = {
  type: 'MultiLineString'
  coordinates: readonly (readonly (readonly [number, number])[])[]
}

export type DemoPoi = {
  id: `demo-${string}`
  name: string
  slug: string
  category: DemoPoiCategory
  description: string
  shortDescription: string
  photos: readonly string[]
  latitude: number
  longitude: number
  address: string
  distanceLabel?: string
  durationLabel?: string
  recommended?: boolean
  familyFriendly?: boolean
  nearby?: boolean
  isOpenNow?: boolean
  website?: string
  phone?: string
  directionsUrl: string
  rating?: number
  reviewCount?: number
  hours?: DemoPoiHours
  ownerNote?: string
  trail?: DemoTrail
}

export type DemoPracticalCard = {
  id: `demo-${string}`
  title: string
  description: string
  icon: string
  photoUrl?: string
  videoUrl?: string
}

export type DemoLodging = {
  id: `demo-${string}`
  name: string
  displayName: string
  city: string
  tagline: string
  coverImage: string
  gallery: readonly string[]
  latitude: number
  longitude: number
  addressLabel: string
  maxGuests: number
  bedroomCount: number
  surfaceM2: number
  checkIn: string
  checkOut: string
  presentationVideoUrl?: string
  wifiName: string
  wifiPassword: string
  arrivalInstructions: readonly { title: string; text: string }[]
  houseRules: readonly string[]
  practicalCards: readonly DemoPracticalCard[]
  usefulNumbers: readonly { label: string; number: string }[]
  trashBins: readonly { label: string; hint: string; color: 'yellow' | 'green' | 'burgundy' }[]
  trashLocation: string
  departureInstructions: readonly string[]
}

export type DemoLodgingCard = {
  id: `demo-${string}`
  title: string
  cityName: string
  propertyType: string
  coverPhotoUrl: string
  shortDescription: string
  maxGuests: number
  bedroomCount: number
  surfaceM2: number
  amenities: readonly string[]
  description: string
  photos: readonly string[]
}

export type DemoBlogPost = {
  id: `demo-${string}`
  title: string
  excerpt: string
  categoryLabel: string
  coverUrl: string
  cityName: string
  content: readonly string[]
}

export type DemoContact = {
  lodgingName: string
  cityName: string
  hostName: string
  responseLabel: string
}

export type DemoGuideData = {
  lodging: DemoLodging
  favoritePois: readonly DemoPoi[]
  lodgingCards: readonly DemoLodgingCard[]
  blogPosts: readonly DemoBlogPost[]
  contact: DemoContact
}
```

- [ ] **Step 4: Detach the existing fixture files from private types**

In `src/features/guide-demo/demo-pois.ts`, replace the two private type imports with:

```typescript
import type { DemoPoi, DemoPoiCategory } from './types'
```

Then make these mechanical type changes without changing the reviewed POI values:

```typescript
} satisfies Record<string, DemoPoiCategory>

const baseDemoPois: DemoPoi[] = [

export const demoPois: readonly DemoPoi[] = baseDemoPois.map(poi => ({
  ...poi,
  ...DEMO_POI_CONTENT[poi.slug],
}))
```

In `src/features/guide-demo/demo-poi-content.ts`, replace the import from
`@/features/categories/types` with the local hours contract:

```typescript
import type { DemoPoiHours } from './types'

export type DemoPoiContent = {
  photos?: string[]
  rating?: number
  reviewCount?: number
  hours?: DemoPoiHours
  description?: string
  website?: string
  phone?: string
  ownerNote?: string
}
```

In `src/features/guide-demo/demo-trail-geometry.ts`, replace its shared type
import with:

```typescript
import type { DemoTrailGeometry } from './types'

export const demoPorchereyGeometry: DemoTrailGeometry = {
```

In `src/features/guide-demo/demo-guide-data.ts`, remove both imports from `guide-app`, import `DemoLodging`, and define all lodging text locally. Use the existing approved media list and this complete fictional content:

```typescript
import type { DemoLodging } from './types'
import { APPROVED_DEMO_LODGING_MEDIA } from './demo-media-policy'

export const demoLodging: DemoLodging = {
  id: 'demo-le-305',
  name: 'Le 305',
  displayName: 'Le 305 — démonstration',
  city: 'Saint-Gervais-les-Bains',
  tagline: 'Un appartement fictif pour découvrir l’expérience MyStay.',
  coverImage: APPROVED_DEMO_LODGING_MEDIA[0],
  gallery: APPROVED_DEMO_LODGING_MEDIA,
  latitude: 45.8921,
  longitude: 6.7085,
  addressLabel: 'Résidence de démonstration, centre de Saint-Gervais',
  maxGuests: 4,
  bedroomCount: 2,
  surfaceM2: 62,
  checkIn: '16:00',
  checkOut: '10:00',
  presentationVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  wifiName: 'MyStay-Demo',
  wifiPassword: 'Exemple-Non-Reel',
  arrivalInstructions: [
    { title: 'Préparer votre arrivée', text: 'L’arrivée est possible à partir de 16 h. Cette consigne est fictive.' },
    { title: 'Rejoindre la résidence', text: 'Le parcours exact est communiqué uniquement aux voyageurs réels.' },
    { title: 'Entrer dans le logement', text: 'Les informations d’accès privées ne sont jamais publiées dans cette démonstration.' },
  ],
  houseRules: [
    'Respecter le calme de la résidence entre 22 h et 8 h.',
    'Le logement est non-fumeur.',
    'Signaler tout incident à votre hôte.',
  ],
  practicalCards: [
    { id: 'demo-television', title: 'Télévision', description: 'Smart TV de démonstration pour vos applications.', icon: 'tv' },
    { id: 'demo-heating', title: 'Chauffage', description: 'Thermostat présenté à titre d’exemple.', icon: 'thermometer' },
    { id: 'demo-kitchen', title: 'Cuisine équipée', description: 'Plaques, four et lave-vaisselle.', icon: 'cooking-pot' },
  ],
  usefulNumbers: [
    { label: 'Urgences européennes', number: '112' },
    { label: 'SAMU', number: '15' },
    { label: 'Pompiers', number: '18' },
    { label: 'Office de tourisme', number: '04 50 47 76 08' },
  ],
  trashBins: [
    { label: 'Bac jaune', hint: 'Emballages et papiers', color: 'yellow' },
    { label: 'Bac vert', hint: 'Verre', color: 'green' },
    { label: 'Ordures ménagères', hint: 'Déchets non recyclables', color: 'burgundy' },
  ],
  trashLocation: 'Point de tri public du centre — emplacement indicatif',
  departureInstructions: [
    'Vider le réfrigérateur.',
    'Lancer le lave-vaisselle.',
    'Déposer les déchets au point de tri.',
    'Fermer les fenêtres.',
    'Éteindre les lumières.',
    'Rassembler les serviettes.',
    'Vérifier les effets personnels.',
    'Laisser le logement rangé.',
    'Prévenir votre hôte de votre départ.',
  ],
}
```

- [ ] **Step 5: Add local editorial fixtures and aggregate data**

Create `src/features/guide-demo/demo-content.ts`:

```typescript
import { demoLodging } from './demo-guide-data'
import { APPROVED_DEMO_LODGING_MEDIA } from './demo-media-policy'
import { demoPois } from './demo-pois'
import type { DemoGuideData } from './types'

export const demoGuideData: DemoGuideData = {
  lodging: demoLodging,
  favoritePois: demoPois,
  lodgingCards: [
    {
      id: 'demo-lodging-chalet',
      title: 'Chalet des Cimes',
      cityName: 'Saint-Gervais-les-Bains',
      propertyType: 'Chalet fictif',
      coverPhotoUrl: APPROVED_DEMO_LODGING_MEDIA[1],
      shortDescription: 'Un exemple de chalet familial face aux sommets.',
      maxGuests: 6,
      bedroomCount: 3,
      surfaceM2: 110,
      amenities: ['Vue montagne', 'Parking', 'Cuisine équipée'],
      description: 'Cette fiche est entièrement fictive et illustre la présentation d’un logement dans le guide.',
      photos: APPROVED_DEMO_LODGING_MEDIA,
    },
    {
      id: 'demo-lodging-studio',
      title: 'Studio du Tramway',
      cityName: 'Le Fayet',
      propertyType: 'Studio fictif',
      coverPhotoUrl: APPROVED_DEMO_LODGING_MEDIA[2],
      shortDescription: 'Un exemple compact à proximité des transports.',
      maxGuests: 2,
      bedroomCount: 1,
      surfaceM2: 28,
      amenities: ['Wi-Fi', 'Balcon', 'Local à skis'],
      description: 'Ce second logement de démonstration ne correspond à aucune réservation réelle.',
      photos: APPROVED_DEMO_LODGING_MEDIA,
    },
  ],
  blogPosts: [
    {
      id: 'demo-blog-weekend',
      title: 'Un week-end au pied du Mont-Blanc',
      excerpt: 'Nos idées publiques pour découvrir le village en deux jours.',
      categoryLabel: 'Inspiration',
      coverUrl: APPROVED_DEMO_LODGING_MEDIA[1],
      cityName: 'Saint-Gervais-les-Bains',
      content: [
        'Commencez par le cœur du village et ses commerces indépendants.',
        'Le lendemain, choisissez une promenade adaptée à la météo et à votre niveau.',
      ],
    },
    {
      id: 'demo-blog-famille',
      title: 'La montagne avec les enfants',
      excerpt: 'Des activités simples et accessibles pour toute la famille.',
      categoryLabel: 'Famille',
      coverUrl: APPROVED_DEMO_LODGING_MEDIA[2],
      cityName: 'Pays du Mont-Blanc',
      content: [
        'Privilégiez les sorties courtes et prévoyez toujours une couche chaude.',
        'Les équipements et horaires cités sont publics et doivent être vérifiés avant le départ.',
      ],
    },
  ],
  contact: {
    lodgingName: 'Le 305 — démonstration',
    cityName: 'Saint-Gervais-les-Bains',
    hostName: 'Camille, hôte fictif',
    responseLabel: 'Formulaire désactivé dans la démonstration publique',
  },
}
```

- [ ] **Step 6: Run the fixture and existing data tests**

Run:

```bash
npm test -- --runInBand \
  tests/unit/public-demo-private-reference.AC-02-02-03.security.test.ts \
  tests/unit/public-guide-demo.AC-05-06.data.test.ts \
  tests/unit/public-guide-demo.AC-05-08.trail.test.ts
```

Expected: PASS. If a legacy test references the old private type shape, migrate only that test's import/expectation to the new local type without weakening its media or trail assertions.

- [ ] **Step 7: Commit the autonomous data boundary**

```bash
git add src/features/guide-demo/types.ts \
  src/features/guide-demo/demo-content.ts \
  src/features/guide-demo/demo-guide-data.ts \
  src/features/guide-demo/demo-pois.ts \
  src/features/guide-demo/demo-poi-content.ts \
  src/features/guide-demo/demo-trail-geometry.ts \
  tests/unit/public-demo-private-reference.AC-02-02-03.security.test.ts \
  tests/unit/public-guide-demo.AC-05-06.data.test.ts \
  tests/unit/public-guide-demo.AC-05-08.trail.test.ts
git commit -m "refactor: isolate public guide demo data"
```

---

### Task 2: Build the autonomous app shell, home and local navigation

**Files:**
- Create: `src/features/guide-demo/components/DemoGuideApp.tsx`
- Create: `src/features/guide-demo/components/DemoGuideChrome.tsx`
- Create: `src/features/guide-demo/components/DemoHomeView.tsx`
- Create: `tests/integration/public-demo-private-reference.AC-01-01.navigation.test.tsx`

- [ ] **Step 1: Write the failing home/navigation test**

Create `tests/integration/public-demo-private-reference.AC-01-01.navigation.test.tsx`:

```typescript
/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { DemoGuideApp } from '@/features/guide-demo/components/DemoGuideApp'

describe('spec 045 demo home and local navigation', () => {
  it('reproduces the private home hierarchy without changing URL', () => {
    window.history.replaceState({}, '', '/concept')
    render(<DemoGuideApp />)

    expect(screen.getByRole('heading', { name: /bienvenue au 305/i })).toBeInTheDocument()
    expect(screen.getByText('Logement fictif · démonstration')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /voir la vidéo du logement/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /découvrir le livret d’accueil/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /explorer saint-gervais/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /activer mon gps/i })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Guide logement' }))
    expect(screen.getByRole('heading', { name: 'Le 305' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Accueil' }))
    expect(screen.getByRole('heading', { name: /bienvenue au 305/i })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/concept')
  })

  it('opens every complementary destination from the local menu', () => {
    render(<DemoGuideApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.getByRole('navigation', { name: 'Menu de démonstration' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nos logements' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Blog' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nous contacter' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fermer le menu' }))
    expect(screen.queryByRole('navigation', { name: 'Menu de démonstration' })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify the app is missing**

```bash
npm test -- --runInBand tests/integration/public-demo-private-reference.AC-01-01.navigation.test.tsx
```

Expected: FAIL with `Cannot find module '@/features/guide-demo/components/DemoGuideApp'`.

- [ ] **Step 3: Implement demo chrome with no links and no router**

Create `src/features/guide-demo/components/DemoGuideChrome.tsx`. Keep the implementation self-contained: native buttons only, `MyStayLogo` as a neutral shared brand asset, and no `Link`.

```typescript
'use client'

import { BookOpen, Heart, Home, Map, Menu, X } from 'lucide-react'
import { MyStayLogo } from '@/shared/components/brand/MyStayLogo'
import type { DemoGuideView } from '../types'

const navigationItems = [
  { view: 'home' as const, label: 'Accueil', icon: Home },
  { view: 'lodging' as const, label: 'Guide logement', icon: BookOpen },
  { view: 'favorites' as const, label: 'Coups de cœur', icon: Heart },
  { view: 'map' as const, label: 'Carte', icon: Map },
]

export function DemoGuideHeader({ onHome, onMenu }: { onHome: () => void; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-white/50 bg-white/85 px-4 backdrop-blur-xl">
      <button type="button" onClick={onHome} aria-label="Accueil du guide" className="flex items-center">
        <MyStayLogo form="horizontal" className="h-9 w-auto" priority sizes="160px" />
      </button>
      <button type="button" onClick={onMenu} aria-label="Ouvrir le menu" className="p-2 text-slate-800">
        <Menu className="h-6 w-6" />
      </button>
    </header>
  )
}

export function DemoGuideNavigation({ active, onNavigate }: { active: DemoGuideView; onNavigate: (view: DemoGuideView) => void }) {
  return (
    <nav aria-label="Navigation du guide" className="absolute inset-x-3 bottom-3 z-40 rounded-full border border-slate-100 bg-white p-1.5 shadow-[0_16px_36px_rgba(15,23,42,0.18)]">
      <div className="grid grid-cols-4 gap-1">
        {navigationItems.map(({ view, label, icon: Icon }) => {
          const selected = active === view || (view === 'favorites' && active === 'poi')
          return (
            <button key={view} type="button" aria-label={label} aria-current={selected ? 'page' : undefined} onClick={() => onNavigate(view)} className={`flex min-h-12 flex-col items-center justify-center rounded-full px-1 text-[8px] font-bold uppercase ${selected ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
              <Icon className="h-4 w-4" />
              <span>{label === 'Guide logement' ? 'Guide' : label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function DemoGuideMenu({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (view: DemoGuideView) => void }) {
  if (!open) return null
  const items: ReadonlyArray<{ label: string; view: DemoGuideView }> = [
    { label: 'Accueil', view: 'home' },
    { label: 'Guide du logement', view: 'lodging' },
    { label: 'Coups de cœur', view: 'favorites' },
    { label: 'Carte', view: 'map' },
    { label: 'Nos logements', view: 'lodgings' },
    { label: 'Blog', view: 'blog' },
    { label: 'Nous contacter', view: 'contact' },
  ]
  return (
    <div className="absolute inset-0 z-50 bg-white/90 px-7 pb-12 pt-5 backdrop-blur-xl">
      <button type="button" onClick={onClose} aria-label="Fermer le menu" className="absolute right-3 top-5 grid h-10 w-10 place-items-center"><X className="h-6 w-6" /></button>
      <nav aria-label="Menu de démonstration" className="mt-16">
        <ul className="space-y-5">
          {items.map(item => (
            <li key={item.view}>
              <button type="button" onClick={() => { onNavigate(item.view); onClose() }} className="w-full text-left text-[26px] font-bold uppercase text-slate-800">{item.label}</button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
```

- [ ] **Step 4: Implement the private-home-faithful demo home**

Create `src/features/guide-demo/components/DemoHomeView.tsx` using the same hierarchy as the reference: centered welcome, optional video button first, lodging guide, local discovery, disabled GPS. Use only native buttons and local callbacks.

```typescript
import { ArrowRight, BookOpen, Heart, LocateFixed, Play } from 'lucide-react'
import type { DemoGuideData, DemoGuideView } from '../types'

export function DemoHomeView({ data, onNavigate }: { data: DemoGuideData; onNavigate: (view: DemoGuideView) => void }) {
  return (
    <div className="flex min-h-full flex-col gap-4 px-4 pb-28 pt-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="mb-3 rounded-full bg-slate-100 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">Logement fictif · démonstration</p>
        <h1 className="text-[40px] font-bold leading-[0.98] tracking-[-0.045em] text-slate-900">Bienvenue<br />au 305</h1>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3">
        <button type="button" aria-label="Voir la vidéo du logement" className="flex w-full items-center gap-3 rounded-[22px] bg-blue-600 px-5 py-4 text-left text-white"><span className="grid h-10 w-10 place-items-center rounded-full bg-white/15"><Play className="h-4 w-4 fill-current" /></span><span className="text-sm font-semibold">Vidéo du logement</span></button>
        <HomeAction icon={BookOpen} color="bg-blue-600" title="Découvrir le livret d’accueil" subtitle="Toutes les choses à connaître" onClick={() => onNavigate('lodging')} />
        <HomeAction icon={Heart} color="bg-pink-600" title="Explorer Saint-Gervais" subtitle={`${data.favoritePois.length} adresses sélectionnées`} onClick={() => onNavigate('favorites')} />
        <button type="button" disabled aria-disabled="true" aria-label="Activer mon GPS" className="flex w-full cursor-not-allowed items-center gap-3 rounded-[22px] bg-slate-900 px-5 py-4 text-left text-white opacity-85"><span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600"><LocateFixed className="h-4 w-4" /></span><span><span className="block text-sm font-semibold">Activer mon GPS</span><span className="mt-0.5 block text-[10px] text-white/60">Désactivé dans la démonstration</span></span></button>
      </div>
    </div>
  )
}

function HomeAction({ icon: Icon, color, title, subtitle, onClick }: { icon: typeof BookOpen; color: string; title: string; subtitle: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label={title} className="flex w-full items-center justify-between rounded-[22px] bg-slate-900 px-5 py-4 text-left text-white"><span className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-full ${color}`}><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-semibold">{title}</span><span className="mt-0.5 block text-[10px] text-white/60">{subtitle}</span></span></span><ArrowRight className="h-4 w-4" /></button>
}
```

- [ ] **Step 5: Implement the local state shell with temporary view fallbacks**

Create `src/features/guide-demo/components/DemoGuideApp.tsx`. The fallback panels make every view reachable while later tasks replace them. The component must have no initial-view prop so reopening always starts at home.

```typescript
'use client'

import { useRef, useState } from 'react'
import { demoGuideData } from '../demo-content'
import type { DemoGuideView, DemoPoi } from '../types'
import { DemoGuideHeader, DemoGuideMenu, DemoGuideNavigation } from './DemoGuideChrome'
import { DemoHomeView } from './DemoHomeView'

export function DemoGuideApp() {
  const [view, setView] = useState<DemoGuideView>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedPoi, setSelectedPoi] = useState<DemoPoi | null>(null)
  const [detailOrigin, setDetailOrigin] = useState<DemoGuideView>('favorites')
  const scrollRef = useRef<HTMLElement>(null)

  function navigate(next: DemoGuideView) {
    if (next !== 'poi') setSelectedPoi(null)
    setView(next)
    scrollRef.current?.scrollTo({ top: 0 })
  }

  function openPoi(poi: DemoPoi, origin: DemoGuideView) {
    setSelectedPoi(poi)
    setDetailOrigin(origin)
    setView('poi')
  }

  return (
    <div data-guide-mode="demo" data-testid="autonomous-demo-guide" className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white text-slate-900">
      {view !== 'poi' && <DemoGuideHeader onHome={() => navigate('home')} onMenu={() => setMenuOpen(true)} />}
      <main ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        {view === 'home' ? <DemoHomeView data={demoGuideData} onNavigate={navigate} /> : <FallbackView view={view} selectedPoi={selectedPoi} onOpenPoi={openPoi} onBack={() => navigate(detailOrigin)} />}
      </main>
      <DemoGuideNavigation active={view} onNavigate={navigate} />
      <DemoGuideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} />
    </div>
  )
}

function FallbackView({ view }: { view: DemoGuideView; selectedPoi: DemoPoi | null; onOpenPoi: (poi: DemoPoi, origin: DemoGuideView) => void; onBack: () => void }) {
  const title = view === 'lodging' ? 'Le 305' : view === 'favorites' ? 'Nos coups de cœur' : view === 'map' ? 'Carte' : view === 'lodgings' ? 'Nos logements' : view === 'blog' ? 'Blog' : view === 'contact' ? 'Votre hôte' : 'Détail'
  return <section className="px-5 py-8"><h1 className="text-3xl font-semibold">{title}</h1></section>
}
```

- [ ] **Step 6: Run the navigation test**

```bash
npm test -- --runInBand tests/integration/public-demo-private-reference.AC-01-01.navigation.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit the shell**

```bash
git add src/features/guide-demo/components/DemoGuideApp.tsx \
  src/features/guide-demo/components/DemoGuideChrome.tsx \
  src/features/guide-demo/components/DemoHomeView.tsx \
  tests/integration/public-demo-private-reference.AC-01-01.navigation.test.tsx
git commit -m "feat: add autonomous demo guide shell"
```

---

### Task 3: Reproduce the complete private lodging guide in the demo

**Files:**
- Create: `src/features/guide-demo/components/DemoLodgingGuideView.tsx`
- Modify: `src/features/guide-demo/components/DemoGuideApp.tsx`
- Create: `tests/integration/public-demo-private-reference.AC-01-02.lodging-guide.test.tsx`

- [ ] **Step 1: Write the failing complete-content and accordion test**

Create `tests/integration/public-demo-private-reference.AC-01-02.lodging-guide.test.tsx`:

```typescript
/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { DemoGuideApp } from '@/features/guide-demo/components/DemoGuideApp'

describe('spec 045 complete lodging guide', () => {
  it('renders the private reference hierarchy and section order', () => {
    render(<DemoGuideApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Guide logement' }))

    expect(screen.getByRole('heading', { name: 'Le 305' })).toBeInTheDocument()
    expect(screen.getByText('4', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('2', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('62 m²')).toBeInTheDocument()
    expect(screen.getByTestId('arrival-fact')).toHaveTextContent('16:00')
    expect(screen.getByTestId('departure-fact')).toHaveTextContent('10:00')

    const buttons = screen.getAllByRole('button').map(button => button.textContent ?? '')
    const access = buttons.findIndex(text => text.includes('Accéder au logement'))
    const discover = buttons.findIndex(text => text.includes('Découvrir le logement'))
    const practical = buttons.findIndex(text => text.includes('Infos pratiques'))
    const departure = buttons.findIndex(text => text.includes('DépartConsignes'))
    expect(access).toBeLessThan(discover)
    expect(discover).toBeLessThan(practical)
    expect(practical).toBeLessThan(departure)
  })

  it('opens one accessible section at a time and exposes every required content block', () => {
    render(<DemoGuideApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Guide logement' }))

    const access = screen.getByRole('button', { name: /accéder au logement/i })
    fireEvent.click(access)
    expect(access).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('MyStay-Demo')).toBeInTheDocument()
    expect(screen.getByText('Exemple-Non-Reel')).toBeInTheDocument()
    expect(screen.getByText(/informations d’accès privées/i)).toBeInTheDocument()

    const discover = screen.getByRole('button', { name: /découvrir le logement/i })
    fireEvent.click(discover)
    expect(access).toHaveAttribute('aria-expanded', 'false')
    expect(discover).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Télévision')).toBeInTheDocument()
    expect(screen.getByText('Règlement')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /infos pratiques/i }))
    expect(screen.getByText('Urgences européennes')).toBeInTheDocument()
    expect(screen.getByText('112')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /départ.*consignes/i }))
    const checklist = screen.getByRole('group', { name: 'Checklist de départ' })
    expect(within(checklist).getAllByRole('checkbox')).toHaveLength(9)
    expect(screen.getByText('Bac jaune')).toBeInTheDocument()
    expect(screen.getByText(/point de tri public/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run and confirm the temporary fallback is insufficient**

```bash
npm test -- --runInBand tests/integration/public-demo-private-reference.AC-01-02.lodging-guide.test.tsx
```

Expected: FAIL because the facts and accordions are absent.

- [ ] **Step 3: Implement the lodging guide view**

Create `src/features/guide-demo/components/DemoLodgingGuideView.tsx` with:

- a 410 px rounded hero using `lodging.coverImage`, gradient overlay, `Votre guide de séjour`, lodging name, city and three black stat cards;
- two white fact cards immediately after the hero;
- four accordion buttons in this exact order: `Accéder au logement`, `Découvrir le logement`, `Infos pratiques`, `Départ`;
- `openKey: 'access' | 'discover' | 'practical' | 'departure' | null` so only one region is open;
- `aria-expanded`, `aria-controls`, `role="region"` and matching labels;
- no Maps link, phone link, `YouTubeEmbed`, fetch or form submission. Render the video as a non-sensitive thumbnail/button labeled `Vidéo de présentation (démonstration)`; clicking toggles an inline explanatory panel rather than opening a URL;
- controlled checklist state local to this view.

Use this section contract so the order and accessible state cannot drift:

```typescript
type SectionKey = 'access' | 'discover' | 'practical' | 'departure'

const sectionMeta: ReadonlyArray<{
  key: SectionKey
  title: string
  subtitle: string
  accent: string
}> = [
  { key: 'access', title: 'Accéder au logement', subtitle: 'Adresse, vidéo, accès et Wi-Fi', accent: 'bg-orange-100 text-orange-600' },
  { key: 'discover', title: 'Découvrir le logement', subtitle: 'Équipements, règlement et services', accent: 'bg-lime-100 text-lime-700' },
  { key: 'practical', title: 'Infos pratiques', subtitle: 'Urgences et numéros utiles', accent: 'bg-pink-100 text-pink-600' },
  { key: 'departure', title: 'Départ', subtitle: 'Consignes et tri des déchets', accent: 'bg-blue-100 text-blue-700' },
]
```

The section body switch must be explicit and exhaustive:

```typescript
function SectionContent({ section, lodging }: { section: SectionKey; lodging: DemoLodging }) {
  if (section === 'access') return <DemoAccess lodging={lodging} />
  if (section === 'discover') return <DemoDiscover lodging={lodging} />
  if (section === 'practical') return <DemoPractical lodging={lodging} />
  return <DemoDeparture lodging={lodging} />
}
```

Use native checkboxes in `DemoDeparture` and announce progress:

```typescript
const [checked, setChecked] = useState<ReadonlySet<number>>(new Set())

<div role="group" aria-label="Checklist de départ">
  <p aria-live="polite">{checked.size} / {lodging.departureInstructions.length}</p>
  {lodging.departureInstructions.map((instruction, index) => (
    <label key={instruction} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
      <input
        type="checkbox"
        checked={checked.has(index)}
        onChange={() => setChecked(current => {
          const next = new Set(current)
          if (next.has(index)) next.delete(index)
          else next.add(index)
          return next
        })}
      />
      <span>{instruction}</span>
    </label>
  ))}
</div>
```

- [ ] **Step 4: Replace the lodging fallback in `DemoGuideApp`**

Import the component and replace the conditional view body with an explicit branch:

```typescript
import { DemoLodgingGuideView } from './DemoLodgingGuideView'

{view === 'home' && <DemoHomeView data={demoGuideData} onNavigate={navigate} />}
{view === 'lodging' && <DemoLodgingGuideView lodging={demoGuideData.lodging} />}
{view !== 'home' && view !== 'lodging' && (
  <FallbackView view={view} selectedPoi={selectedPoi} onOpenPoi={openPoi} onBack={() => navigate(detailOrigin)} />
)}
```

- [ ] **Step 5: Run lodging, home and interaction tests**

```bash
npm test -- --runInBand \
  tests/integration/public-demo-private-reference.AC-01-02.lodging-guide.test.tsx \
  tests/integration/public-demo-private-reference.AC-01-01.navigation.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the lodging guide reproduction**

```bash
git add src/features/guide-demo/components/DemoLodgingGuideView.tsx \
  src/features/guide-demo/components/DemoGuideApp.tsx \
  tests/integration/public-demo-private-reference.AC-01-02.lodging-guide.test.tsx
git commit -m "feat: reproduce complete lodging guide in demo"
```

---

### Task 4: Add favorites, POI, trail and map views

**Files:**
- Create: `src/features/guide-demo/components/DemoFavoritesView.tsx`
- Create: `src/features/guide-demo/components/DemoPoiDetailView.tsx`
- Create: `src/features/guide-demo/components/DemoMapView.tsx`
- Modify: `src/features/guide-demo/components/DemoGuideApp.tsx`
- Create: `tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx`

- [ ] **Step 1: Write the failing discovery-flow tests**

Start `tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx` with:

```typescript
/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { DemoGuideApp } from '@/features/guide-demo/components/DemoGuideApp'

describe('spec 045 complete demo content views', () => {
  it('filters favorites, opens POI detail and returns to its parent', () => {
    render(<DemoGuideApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Coups de cœur' }))
    expect(screen.getByRole('heading', { name: 'Nos coups de cœur' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Restaurants' }))
    expect(screen.getByRole('button', { name: /ouvrir rond de carotte/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ouvrir rond de carotte/i }))
    expect(screen.getByRole('heading', { name: 'Rond de Carotte' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retour aux coups de cœur' }))
    expect(screen.getByRole('heading', { name: 'Nos coups de cœur' })).toBeInTheDocument()
  })

  it('shows public trail metrics while keeping GPS tracking disabled', () => {
    render(<DemoGuideApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Coups de cœur' }))
    fireEvent.click(screen.getByRole('button', { name: /ouvrir l’alpage de porcherey/i }))
    expect(screen.getByText('8,3 km')).toBeInTheDocument()
    expect(screen.getByText('709 m')).toBeInTheDocument()
    const start = screen.getByRole('button', { name: 'Commencer la randonnée' })
    expect(start).toBeDisabled()
    expect(start).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText(/suivi gps indisponible/i)).toBeInTheDocument()
  })

  it('renders static markers and never requests geolocation automatically', () => {
    const geolocation = jest.spyOn(navigator.geolocation, 'getCurrentPosition')
    render(<DemoGuideApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Carte' }))
    expect(screen.getByRole('heading', { name: 'Carte des coups de cœur' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /afficher .* sur la carte/i }).length).toBeGreaterThan(0)
    expect(geolocation).not.toHaveBeenCalled()
    geolocation.mockRestore()
  })
})
```

If JSDOM does not expose `navigator.geolocation`, define it before the spy:

```typescript
Object.defineProperty(navigator, 'geolocation', {
  configurable: true,
  value: { getCurrentPosition: jest.fn() },
})
```

- [ ] **Step 2: Run and verify the fallbacks fail**

```bash
npm test -- --runInBand tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx
```

Expected: FAIL because no POI cards, trail metrics or markers exist.

- [ ] **Step 3: Implement favorite filters and bento cards**

Create `DemoFavoritesView.tsx`. Derive categories from `pois` with `Map`, keep `selectedCategorySlug` in the component, render `Tous` plus category buttons with `aria-pressed`, and render cards in a two-column grid. Each card must be one native button named `Ouvrir ${poi.name}`; a second button named `Afficher ${poi.name} sur la carte` sets the selected POI and opens the map. Use `img` with an existing `/fallback/` path when a photo is absent. Do not import `GuideFavoriteBentoCard` or `favorite-bento`.

The component contract is:

```typescript
export function DemoFavoritesView({
  pois,
  onOpenPoi,
  onShowOnMap,
}: {
  pois: readonly DemoPoi[]
  onOpenPoi: (poi: DemoPoi) => void
  onShowOnMap: (poi: DemoPoi) => void
})
```

Use deterministic card sizing from the index:

```typescript
const sizeClass = index % 5 === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'
```

- [ ] **Step 4: Implement POI and trail detail without external effects**

Create `DemoPoiDetailView.tsx`. It must render:

```typescript
export function DemoPoiDetailView({
  poi,
  onBack,
  onShowOnMap,
}: {
  poi: DemoPoi
  onBack: () => void
  onShowOnMap: (poi: DemoPoi) => void
})
```

Required controls:

```tsx
<button type="button" onClick={onBack} aria-label="Retour aux coups de cœur">Retour</button>
<button type="button" onClick={() => onShowOnMap(poi)}>Voir sur la carte</button>
<button type="button" disabled aria-disabled="true">Itinéraire indisponible dans la démonstration</button>
```

When `poi.trail` exists, render the metrics using French decimal formatting and this disabled action:

```tsx
<button type="button" disabled aria-disabled="true" aria-label="Commencer la randonnée" className="mt-4 w-full cursor-not-allowed rounded-full bg-emerald-700/35 px-4 py-3 text-xs font-bold text-white">
  Commencer la randonnée
</button>
<p className="mt-3 rounded-xl bg-slate-100 p-3 text-[10px] text-slate-500">
  Suivi GPS indisponible dans le guide de démonstration.
</p>
```

Render a local SVG polyline preview from the first trail coordinates if geometry exists; do not import the private `TrailPreviewMap` and do not create a route. Use a fixed viewBox, `preserveAspectRatio="none"`, a slate background and an emerald path so the view still works without Mapbox.

- [ ] **Step 5: Implement the static map view**

Create `DemoMapView.tsx` as a deterministic visual map with CSS-positioned markers rather than a network-dependent route map. It must not call the Geolocation API and must expose every marker as an accessible button.

```typescript
export function DemoMapView({
  pois,
  selectedPoi,
  onSelectPoi,
  onOpenPoi,
}: {
  pois: readonly DemoPoi[]
  selectedPoi: DemoPoi | null
  onSelectPoi: (poi: DemoPoi) => void
  onOpenPoi: (poi: DemoPoi) => void
})
```

Normalize marker positions relative to the fixture bounds:

```typescript
function markerPosition(poi: DemoPoi, pois: readonly DemoPoi[]) {
  const latitudes = pois.map(item => item.latitude)
  const longitudes = pois.map(item => item.longitude)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  const minLng = Math.min(...longitudes)
  const maxLng = Math.max(...longitudes)
  const x = ((poi.longitude - minLng) / Math.max(maxLng - minLng, 0.0001)) * 76 + 12
  const y = (1 - (poi.latitude - minLat) / Math.max(maxLat - minLat, 0.0001)) * 66 + 12
  return { left: `${x}%`, top: `${y}%` }
}
```

The map body must include a visible `Carte de démonstration · position GPS désactivée` label and a selected-POI card with an internal `Voir la fiche` button.

- [ ] **Step 6: Replace discovery fallbacks in `DemoGuideApp`**

Add `selectedMapPoi` state separately from detail selection. Wire parent history exactly:

```typescript
const [selectedMapPoi, setSelectedMapPoi] = useState<DemoPoi | null>(null)

function showOnMap(poi: DemoPoi) {
  setSelectedMapPoi(poi)
  setView('map')
}
```

Render the new views explicitly and hide bottom navigation only on `poi`:

```tsx
{view === 'favorites' && <DemoFavoritesView pois={demoGuideData.favoritePois} onOpenPoi={poi => openPoi(poi, 'favorites')} onShowOnMap={showOnMap} />}
{view === 'map' && <DemoMapView pois={demoGuideData.favoritePois} selectedPoi={selectedMapPoi} onSelectPoi={setSelectedMapPoi} onOpenPoi={poi => openPoi(poi, 'map')} />}
{view === 'poi' && selectedPoi && <DemoPoiDetailView poi={selectedPoi} onBack={() => navigate(detailOrigin)} onShowOnMap={showOnMap} />}
```

- [ ] **Step 7: Run discovery tests and the legacy POI/trail tests**

```bash
npm test -- --runInBand \
  tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx \
  tests/integration/public-guide-demo.poi-detail-content.test.tsx \
  tests/unit/public-guide-demo.AC-05-08.trail.test.ts
```

Expected: PASS after migrating legacy tests to `DemoGuideApp` and local types where needed. Do not weaken assertions that require public POI content, map selection or disabled trail tracking.

- [ ] **Step 8: Commit the discovery views**

```bash
git add src/features/guide-demo/components/DemoFavoritesView.tsx \
  src/features/guide-demo/components/DemoPoiDetailView.tsx \
  src/features/guide-demo/components/DemoMapView.tsx \
  src/features/guide-demo/components/DemoGuideApp.tsx \
  tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx \
  tests/integration/public-guide-demo.poi-detail-content.test.tsx \
  tests/unit/public-guide-demo.AC-05-08.trail.test.ts
git commit -m "feat: add autonomous demo discovery views"
```

---

### Task 5: Add local lodgings, blog and non-persistent contact views

**Files:**
- Create: `src/features/guide-demo/components/DemoEditorialViews.tsx`
- Modify: `src/features/guide-demo/components/DemoGuideApp.tsx`
- Modify: `tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx`

- [ ] **Step 1: Extend the failing integration test with the menu destinations**

Add these tests to `public-demo-private-reference.AC-01-03.content-views.test.tsx`:

```typescript
it('opens local lodging and blog details and returns to each parent', () => {
  render(<DemoGuideApp />)
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
  fireEvent.click(screen.getByRole('button', { name: 'Nos logements' }))
  fireEvent.click(screen.getByRole('button', { name: 'Voir Chalet des Cimes' }))
  expect(screen.getByRole('heading', { name: 'Chalet des Cimes' })).toBeInTheDocument()
  expect(screen.getByText(/entièrement fictive/i)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Retour aux logements' }))
  expect(screen.getByRole('heading', { name: 'Nos logements' })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
  fireEvent.click(screen.getByRole('button', { name: 'Blog' }))
  fireEvent.click(screen.getByRole('button', { name: /lire un week-end au pied du mont-blanc/i }))
  expect(screen.getByRole('heading', { name: 'Un week-end au pied du Mont-Blanc' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Retour au blog' }))
  expect(screen.getByRole('heading', { name: 'Blog' })).toBeInTheDocument()
})

it('renders a disabled contact action with no form submission', () => {
  render(<DemoGuideApp />)
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
  fireEvent.click(screen.getByRole('button', { name: 'Nous contacter' }))
  expect(screen.getByRole('heading', { name: 'Votre hôte' })).toBeInTheDocument()
  expect(screen.getByText('Camille, hôte fictif')).toBeInTheDocument()
  const action = screen.getByRole('button', { name: 'Envoyer un message' })
  expect(action).toBeDisabled()
  expect(screen.queryByRole('form')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run and confirm the editorial fallbacks fail**

```bash
npm test -- --runInBand tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx
```

Expected: FAIL at the first card/detail assertion.

- [ ] **Step 3: Implement all six editorial renderers in one focused file**

Create `DemoEditorialViews.tsx` exporting:

```typescript
export function DemoLodgingsView({ cards, onOpen }: { cards: readonly DemoLodgingCard[]; onOpen: (card: DemoLodgingCard) => void }): ReactNode
export function DemoLodgingDetailView({ card, onBack }: { card: DemoLodgingCard; onBack: () => void }): ReactNode
export function DemoBlogView({ posts, onOpen }: { posts: readonly DemoBlogPost[]; onOpen: (post: DemoBlogPost) => void }): ReactNode
export function DemoBlogDetailView({ post, onBack }: { post: DemoBlogPost; onBack: () => void }): ReactNode
export function DemoContactView({ contact }: { contact: DemoContact }): ReactNode
```

Use `ArrowLeft`, `BedDouble`, `MapPin`, `MessageCircle`, `Ruler` and `Users` from Lucide. Each list uses a single native button per card. Each detail uses an internal back button. `DemoContactView` renders identity/status in a white `rounded-[24px]` card and this explicit disabled action:

```tsx
<button type="button" disabled aria-disabled="true" aria-label="Envoyer un message" className="mt-6 w-full cursor-not-allowed rounded-full bg-slate-300 px-5 py-3 text-sm font-bold text-white">
  Envoyer un message
</button>
<p className="mt-3 text-center text-xs text-slate-500">{contact.responseLabel}</p>
```

Do not import `ContactMessageForm`; it posts to an API and violates BR-07.

- [ ] **Step 4: Wire local selections in `DemoGuideApp`**

Add:

```typescript
const [selectedLodging, setSelectedLodging] = useState<DemoLodgingCard | null>(null)
const [selectedPost, setSelectedPost] = useState<DemoBlogPost | null>(null)
```

Then render:

```tsx
{view === 'lodgings' && <DemoLodgingsView cards={demoGuideData.lodgingCards} onOpen={card => { setSelectedLodging(card); navigate('lodging-detail') }} />}
{view === 'lodging-detail' && selectedLodging && <DemoLodgingDetailView card={selectedLodging} onBack={() => navigate('lodgings')} />}
{view === 'blog' && <DemoBlogView posts={demoGuideData.blogPosts} onOpen={post => { setSelectedPost(post); navigate('blog-detail') }} />}
{view === 'blog-detail' && selectedPost && <DemoBlogDetailView post={selectedPost} onBack={() => navigate('blog')} />}
{view === 'contact' && <DemoContactView contact={demoGuideData.contact} />}
```

Update `navigate` so it clears only selections outside their own detail/list family; returning to a parent must not erase the parent list or its category filter.

- [ ] **Step 5: Run the full content test**

```bash
npm test -- --runInBand tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx
```

Expected: PASS for discovery, editorial and contact flows.

- [ ] **Step 6: Commit local editorial views**

```bash
git add src/features/guide-demo/components/DemoEditorialViews.tsx \
  src/features/guide-demo/components/DemoGuideApp.tsx \
  tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx
git commit -m "feat: complete public demo content views"
```

---

### Task 6: Mount the autonomous app in the existing accessible modal and verify reset

**Files:**
- Modify: `src/features/guide-demo/components/GuideDemoModal.tsx`
- Modify: `tests/integration/public-guide-demo.AC-05-01-03.modal.test.tsx`
- Create: `tests/integration/public-demo-private-reference.AC-02-01-05.modal-isolation.test.tsx`

- [ ] **Step 1: Write the failing modal isolation and reset tests**

Create `tests/integration/public-demo-private-reference.AC-02-01-05.modal-isolation.test.tsx`:

```typescript
/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuideDemoLauncher } from '@/features/guide-demo/components/GuideDemoLauncher'

describe('spec 045 modal isolation and reset', () => {
  it('makes no data request and keeps the browser URL stable', async () => {
    const user = userEvent.setup()
    const request = jest.spyOn(globalThis, 'fetch')
    window.history.replaceState({}, '', '/concept?source=demo')
    render(<GuideDemoLauncher />)
    await user.click(screen.getByRole('button', { name: 'Voir le guide d’exemple' }))
    await user.click(await screen.findByRole('button', { name: 'Coups de cœur' }))
    await user.click(screen.getByRole('button', { name: /ouvrir rond de carotte/i }))
    expect(window.location.pathname).toBe('/concept')
    expect(window.location.search).toBe('?source=demo')
    expect(request).not.toHaveBeenCalled()
    request.mockRestore()
  })

  it('returns to home after closing and reopening', async () => {
    const user = userEvent.setup()
    render(<GuideDemoLauncher />)
    const trigger = screen.getByRole('button', { name: 'Voir le guide d’exemple' })
    await user.click(trigger)
    await user.click(await screen.findByRole('button', { name: 'Guide logement' }))
    expect(screen.getByRole('heading', { name: 'Le 305' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(trigger)
    expect(await screen.findByRole('heading', { name: /bienvenue au 305/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run and observe the old `GuideApp` dependency/reset behavior**

```bash
npm test -- --runInBand \
  tests/integration/public-demo-private-reference.AC-02-01-05.modal-isolation.test.tsx \
  tests/integration/public-guide-demo.AC-05-01-03.modal.test.tsx
```

Expected: FAIL because `GuideDemoModal` still mounts private `GuideApp`, and because its content stays mounted while closed.

- [ ] **Step 3: Replace only the modal body**

In `GuideDemoModal.tsx`, remove the three `GuideApp`/fixture imports and add:

```typescript
import { DemoGuideApp } from './DemoGuideApp'
```

Keep every existing Radix and motion wrapper class unchanged. Replace only the old body with conditional mounting:

```tsx
{open ? <DemoGuideApp /> : null}
```

This unmounts all local view/checklist/filter state when the modal closes. Do not edit `GuideDemoLauncher` or `GuideDemoPhoneButton`.

- [ ] **Step 4: Update the legacy modal assertion without weakening accessibility**

In `public-guide-demo.AC-05-01-03.modal.test.tsx`, replace:

```typescript
expect(dialog.querySelector('[data-guide-mode="demo"]')).not.toBeNull()
```

with:

```typescript
expect(dialog.querySelector('[data-guide-mode="demo"]')).not.toBeNull()
expect(dialog.querySelector('[data-testid="autonomous-demo-guide"]')).not.toBeNull()
```

Retain the Escape, focus restoration, `aria-modal`, border, radius and absence of a visible modal-close button assertions.

- [ ] **Step 5: Run all modal and navigation tests**

```bash
npm test -- --runInBand \
  tests/integration/public-demo-private-reference.AC-02-01-05.modal-isolation.test.tsx \
  tests/integration/public-demo-private-reference.AC-01-01.navigation.test.tsx \
  tests/integration/public-demo-private-reference.AC-01-02.lodging-guide.test.tsx \
  tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx \
  tests/integration/public-guide-demo.AC-05-01-03.modal.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit modal integration**

```bash
git add src/features/guide-demo/components/GuideDemoModal.tsx \
  tests/integration/public-guide-demo.AC-05-01-03.modal.test.tsx \
  tests/integration/public-demo-private-reference.AC-02-01-05.modal-isolation.test.tsx
git commit -m "feat: mount autonomous app in guide demo modal"
```

---

### Task 7: Replace superseded demo tests and verify responsive behavior

**Files:**
- Create: `tests/e2e/public-demo-private-reference.AC-01-05.responsive.test.ts`
- Modify or delete after migration: `tests/e2e/public-guide-demo.AC-05-01-09.test.ts`
- Modify or delete after migration: `tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`
- Modify as required: other `tests/integration/public-guide-demo.*` files that import private `GuideApp`

- [ ] **Step 1: Write the new responsive E2E test**

Create `tests/e2e/public-demo-private-reference.AC-01-05.responsive.test.ts`:

```typescript
import { expect, test } from '@playwright/test'

for (const viewport of [
  { name: 'compact', width: 320, height: 700 },
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1440, height: 1000 },
] as const) {
  test(`complete autonomous demo remains contained at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/')
    const initialUrl = page.url()
    const trigger = page.getByTestId('editorial-process').getByRole('button', { name: 'Voir le guide d’exemple' })
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()

    const dialog = page.getByRole('dialog', { name: 'Guide MyStay de démonstration' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByTestId('autonomous-demo-guide')).toBeVisible()
    await expect(dialog.getByRole('heading', { name: /bienvenue au 305/i })).toBeVisible()
    await expect(page).toHaveURL(initialUrl)

    await dialog.getByRole('button', { name: 'Guide logement' }).click()
    await expect(dialog.getByRole('button', { name: /accéder au logement/i })).toBeVisible()
    await dialog.getByRole('button', { name: /départ.*consignes/i }).click()
    await expect(dialog.getByRole('group', { name: 'Checklist de départ' })).toBeVisible()
    await expect(page).toHaveURL(initialUrl)

    const dimensions = await dialog.evaluate(element => {
      const rect = element.getBoundingClientRect()
      const main = element.querySelector('main')
      return {
        width: rect.width,
        height: rect.height,
        clientWidth: main?.clientWidth ?? 0,
        scrollWidth: main?.scrollWidth ?? 1,
        scrollHeight: main?.scrollHeight ?? 0,
        clientHeight: main?.clientHeight ?? 0,
      }
    })
    expect(dimensions.width).toBeLessThanOrEqual(360)
    expect(dimensions.height).toBeLessThanOrEqual(720)
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
    expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight)
  })
}
```

- [ ] **Step 2: Audit old demo tests for private imports**

```bash
rg -n "features/guide-app|GuideApp" tests/integration/public-guide-demo* tests/e2e/public-guide-demo*
```

Expected before migration: at least `public-guide-demo.AC-05-04.navigation.test.tsx` imports `GuideApp`.

- [ ] **Step 3: Migrate or remove superseded tests**

For every old test that still asserts a requirement retained by 045, change its subject to `DemoGuideApp` and update only obsolete UI labels. Keep tests for modal dimensions, sticky filters, bento layout, POI public content and disabled trail tracking.

Delete `public-guide-demo.AC-05-04.navigation.test.tsx` only after its four behaviors are present in the new 045 integration tests. Delete `public-guide-demo.AC-05-01-09.test.ts` only after the new E2E file contains its modal/accessibility/responsive coverage. Before either deletion, prove no docs still name it:

```bash
rg -n "public-guide-demo\.AC-05-04\.navigation|public-guide-demo\.AC-05-01-09" docs specs tests src
```

If traceability names one, migrate that row to the new 045 test before deletion.

- [ ] **Step 4: Run the demo integration suite**

```bash
npm test -- --runInBand \
  tests/unit/public-demo-private-reference.AC-02-02-03.security.test.ts \
  tests/integration/public-demo-private-reference.AC-01-01.navigation.test.tsx \
  tests/integration/public-demo-private-reference.AC-01-02.lodging-guide.test.tsx \
  tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx \
  tests/integration/public-demo-private-reference.AC-02-01-05.modal-isolation.test.tsx \
  tests/integration/public-guide-demo.AC-05-01-03.modal.test.tsx \
  --testPathPattern='public-guide-demo|public-demo-private-reference'
```

Expected: all selected suites PASS.

- [ ] **Step 5: Start the production server and run Playwright**

In terminal 1:

```bash
set -a
source ../../.env
source ../../.env.local
set +a
DATABASE_URL="$DIRECT_URL" npm run build
DATABASE_URL="$DIRECT_URL" npm run start -- --port 3002
```

Expected: build succeeds and server listens on port 3002.

In terminal 2:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 npx playwright test tests/e2e/public-demo-private-reference.AC-01-05.responsive.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 6: Commit the migrated test contract**

```bash
git add tests/e2e/public-demo-private-reference.AC-01-05.responsive.test.ts \
  tests/e2e/public-guide-demo.AC-05-01-09.test.ts \
  tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx \
  tests/integration/public-guide-demo.AC-05-07.map.test.tsx \
  tests/integration/public-guide-demo.AC-05-10.visual-polish.test.tsx \
  tests/integration/public-guide-demo.AC-05-11.sticky-filters.test.tsx \
  tests/integration/public-guide-demo.AC-05-12.favorites-bento.test.tsx \
  tests/integration/public-guide-demo.poi-detail-content.test.tsx
git commit -m "test: cover complete autonomous guide demo"
```

Use `git add -u` for any listed legacy file that was correctly deleted; do not create an empty replacement.

---

### Task 8: Audit orphan cleanup and update traceability

**Files:**
- Delete only proven orphan files under: `src/features/guide-demo/`
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Generate a complete active-import inventory**

Run for every demo source file:

```bash
for file in $(rg --files src/features/guide-demo); do
  base=$(basename "$file")
  stem=${base%.*}
  echo "=== $file"
  rg -n "${stem}" src tests docs specs --glob '!src/features/guide-demo/**' || true
done
```

Expected: launcher, phone button, modal, app, active views and retained data show consumers. A zero-consumer file becomes a deletion candidate, not an automatic deletion.

- [ ] **Step 2: Verify deletion candidates against internal imports**

For each zero-consumer candidate, run:

```bash
rg -n "from ['\"].*(demo-media-policy|demo-poi-content|demo-trail-geometry|demo-guide-data|demo-pois)['\"]" src/features/guide-demo tests docs specs
```

Expected: keep a file if any source, required test or current traceability row consumes it. Delete only a file with no result and no required acceptance coverage. Never delete `GuideDemoLauncher`, `GuideDemoPhoneButton`, `GuideDemoModal`, `/guide`, `/decouvrir` or any protected path.

- [ ] **Step 3: Add the 045 traceability table**

Append this section to `docs/traceability-matrix.md`, updating file rows only if the final cleanup legitimately changed a demo filename:

```markdown
## 045 — Public Demo From Private Guide Reference

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 / AC-01-04 | Home fidèle, navigation locale, menu et retours parents | `src/features/guide-demo/components/DemoGuideApp.tsx`<br>`src/features/guide-demo/components/DemoGuideChrome.tsx`<br>`src/features/guide-demo/components/DemoHomeView.tsx` | `tests/integration/public-demo-private-reference.AC-01-01.navigation.test.tsx` | ✅ done |
| AC-01-02 | Guide logement complet avec hero, faits, accès, vidéo fictive, Wi-Fi, équipements, règlement, pratique, urgences, tri et départ | `src/features/guide-demo/components/DemoLodgingGuideView.tsx`<br>`src/features/guide-demo/demo-guide-data.ts` | `tests/integration/public-demo-private-reference.AC-01-02.lodging-guide.test.tsx` | ✅ done |
| AC-01-03 | Coups de cœur, POI, randonnée, carte, logements, blog et contact autonomes | `src/features/guide-demo/components/DemoFavoritesView.tsx`<br>`src/features/guide-demo/components/DemoPoiDetailView.tsx`<br>`src/features/guide-demo/components/DemoMapView.tsx`<br>`src/features/guide-demo/components/DemoEditorialViews.tsx` | `tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx` | ✅ done |
| AC-01-05 | Modal lisible et scrollable à 320 px, 375 px et desktop sans débordement horizontal | `src/features/guide-demo/components/GuideDemoModal.tsx`<br>`src/features/guide-demo/components/DemoGuideApp.tsx` | `tests/e2e/public-demo-private-reference.AC-01-05.responsive.test.ts` | ✅ done |
| AC-02-01 / AC-02-04 / AC-02-05 | URL stable, zéro requête de données, actions externes neutralisées et reset à la réouverture | `src/features/guide-demo/components/GuideDemoModal.tsx`<br>`src/features/guide-demo/components/DemoGuideApp.tsx` | `tests/integration/public-demo-private-reference.AC-02-01-05.modal-isolation.test.tsx` | ✅ done |
| AC-02-02 / AC-02-03 | Contrats autonomes, identifiants `demo-`, aucune dépendance privée, persistance ou donnée sensible | `src/features/guide-demo/types.ts`<br>`src/features/guide-demo/demo-content.ts`<br>`src/features/guide-demo/demo-guide-data.ts`<br>`src/features/guide-demo/demo-pois.ts` | `tests/unit/public-demo-private-reference.AC-02-02-03.security.test.ts` | ✅ done |
| AC-03-01 / AC-03-03 / AC-03-04 | Guide privé, navigations privées et proxy inchangés | Aucun fichier privé modifié ; contrôle par diff depuis `0202d66` | Inspection Git + tests privés existants | ✅ done |
| AC-03-02 | Routes privées et QR sans régression | Routes et proxy existants inchangés | `tests/unit/proxy.guest-confinement.test.ts`<br>`tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts`<br>tests `private-guide-*` existants | ✅ done |
| AC-04-01 / AC-04-02 / AC-04-03 | Nettoyage limité aux artefacts de démo réellement orphelins | `src/features/guide-demo/**` | Audit `rg` documenté dans le plan d’implémentation | ✅ done |
```

- [ ] **Step 4: Confirm no forbidden artifact was deleted or modified**

```bash
git diff --name-status 0202d66...HEAD
git diff --name-only 0202d66...HEAD -- \
  'src/features/guide-app/**' \
  'src/app/(public)/sejour/**' \
  'src/app/(public)/le-logement/**' \
  'src/app/(public)/nos-recommandations/**' \
  'src/app/(public)/map/**' \
  'src/app/(public)/mes-favoris/**' \
  'src/features/city-guide/components/PublicMenu.tsx' \
  'src/features/city-guide/components/PublicBottomNav.tsx' \
  'src/proxy.ts'
```

Expected: first command lists only spec/plan, `guide-demo`, demo tests and traceability; second command prints nothing.

- [ ] **Step 5: Commit cleanup and traceability**

```bash
git add -u src/features/guide-demo tests docs/traceability-matrix.md
git add docs/traceability-matrix.md
git commit -m "docs: trace autonomous public guide demo"
```

---

### Task 9: Run regression, lint, build and baseline-aware full verification

**Files:**
- No source changes unless a new failure is directly caused by this branch.

- [ ] **Step 1: Run the protected private-route regression set**

```bash
npm test -- --runInBand \
  tests/unit/private-guide-app.AC-01-05.data.test.ts \
  tests/unit/proxy.guest-confinement.test.ts \
  tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts \
  --testPathPattern='private-guide|guide-app|le-logement|nos-recommandations|proxy.guest-confinement|qr-redirect'
```

Expected: all selected suites PASS. If the broad pattern selects one of the two documented baseline failures, use the explicit file list without changing that baseline test.

- [ ] **Step 2: Run every demo test**

```bash
npm test -- --runInBand --testPathPattern='public-guide-demo|public-demo-private-reference'
```

Expected: all demo suites PASS.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: exit code 0, no new warning or error in `src/features/guide-demo` or the new tests.

- [ ] **Step 4: Run the production build**

```bash
set -a
source ../../.env
source ../../.env.local
set +a
DATABASE_URL="$DIRECT_URL" NEXT_PUBLIC_BASE_URL="https://www.mystay.city" npm run build
```

Expected: `Compiled successfully` and exit code 0.

- [ ] **Step 5: Run the safe complete Jest suite and compare with baseline**

```bash
set -a
source ../../.env
source ../../.env.local
set +a
DATABASE_URL="$DIRECT_URL" NEXT_PUBLIC_BASE_URL="https://www.mystay.city" \
npm test -- --runInBand \
  --testPathIgnorePatterns='tests/integration/gemini-fetch.AC-01-03.cache-flow.test.ts|tests/integration/public-discovery.AC-04.postgres-atomicity.test.ts'
```

Expected: no new failure. The only allowed failures are the two baseline failures recorded before this branch:

```text
tests/integration/blog.AC-02-01.article-detail.test.tsx
tests/integration/public-marketing.AC-03-03.lodgings-page.test.tsx
```

Do not modify those files as part of spec 045. Record total suites/tests and confirm every 045 test passed.

- [ ] **Step 6: Run final forbidden-diff and sensitive-source scans**

```bash
git diff --check
git status --short
git diff --name-only 0202d66...HEAD -- \
  'src/features/guide-app/**' \
  'src/app/(public)/sejour/**' \
  'src/app/(public)/le-logement/**' \
  'src/app/(public)/nos-recommandations/**' \
  'src/app/(public)/map/**' \
  'src/app/(public)/mes-favoris/**' \
  'src/features/city-guide/components/PublicMenu.tsx' \
  'src/features/city-guide/components/PublicBottomNav.tsx' \
  'src/proxy.ts'
rg -n "@/features/guide-app|@/shared/lib/prisma|next/navigation|document\.cookie|localStorage|sessionStorage|fetch\s*\(|/api/" src/features/guide-demo
```

Expected: `git diff --check` succeeds; forbidden diff and source scan print nothing; status contains no unexpected file.

- [ ] **Step 7: Commit any verification-only documentation adjustment**

Only if the traceability file required a factual test-name correction:

```bash
git add docs/traceability-matrix.md
git commit -m "docs: finalize demo verification traceability"
```

Otherwise do not create an empty commit.

---

## Completion criteria

The plan is complete only when all of the following are true:

- The existing marketing launchers open the unchanged smartphone `Dialog` shell.
- The body is `DemoGuideApp`, not private `GuideApp`.
- Home, full lodging guide, favorites, POI/trail, map, lodgings, blog and contact all work with local state.
- Closing and reopening starts at home.
- No data fetch, cookie, persistence, Prisma, private query, UUID or private route exists in the demo bounded context.
- Every private source path in the safety boundary has an empty diff from `0202d66`.
- Only demonstrably orphaned old demo artifacts were removed.
- Targeted demo/private regression tests, lint and build pass.
- The full safe suite has no failure beyond the two documented baseline failures.
- `docs/traceability-matrix.md` contains a complete 045 section.
