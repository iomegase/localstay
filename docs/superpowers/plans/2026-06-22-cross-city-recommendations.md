# Recommandations POI inter-villes (cross-city) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'owner de recommander des POI d'autres villes (sélection par « villes d'intérêt »), affichés dans une section « À découvrir ailleurs » sur `/nos-recommandations`, sans changement de schéma.

**Architecture:** Le bucket local/ailleurs se dérive de `poi.city_id` vs `lodging.city_id` (validation) ou `poi.city.slug` vs `lodgingContext.citySlug` (affichage). `validateFeaturedPois` cesse de rejeter le hors-périmètre et applique une limite de 5/ville aux POI cross-city (5/catégorie inchangé pour le local). Un nouvel endpoint dashboard liste les POI d'une ville pour le sélecteur owner.

**Tech Stack:** Next 16 (App Router, RSC + Route Handlers), React 19, TypeScript, Prisma, Zod, Jest + Testing Library (jsdom).

## Global Constraints

- Aucune migration / aucun changement du schéma Prisma. Stockage inchangé : `lodgingFeaturedPoi(lodging_id, poi_id, sort_order)`.
- Bucket (source de vérité) : *local* si `poi.city_id === lodging.city_id` (serveur) / `poi.city.slug === lodgingContext.citySlug` (public) ; sinon *ailleurs*.
- Limites : local = 5 par catégorie (inchangé) ; ailleurs = **5 par ville** (`FEATURED_POI_LIMIT_PER_OTHER_CITY = 5`), toutes catégories confondues.
- Les POI cross-city s'affichent UNIQUEMENT sur `/nos-recommandations`, jamais dans `/guide/[ville]`.
- `isPoiWithinGuideScope` (fonction pure, `validation.ts`) est CONSERVÉE telle quelle (testée par `BR-08-10`) mais n'est plus appelée pour rejeter dans `validateFeaturedPois`.
- Auth des routes dashboard : `const session = await getSessionOwner(); if (!session.owner) return session.error`.
- Le payload `featured_pois` (PUT customization) reste une liste plate `{ poi_id, sort_order }` ; le serveur fait le bucketing.

---

### Task 1: Validation serveur bucketée (5/ville pour le cross-city)

**Files:**
- Modify: `src/features/guide-customization/queries/customization.ts`
- Test: `tests/unit/guide-customization.featured-cross-city.test.ts`

**Interfaces:**
- Produces: `validateFeaturedPois(lodging: CustomizableLodging, featuredPois: FeaturedPoiInput[]): Promise<FeaturedPoiResponse[]>` — désormais **exportée**. Accepte les POI cross-city ; limite 5/catégorie (local) et 5/ville (ailleurs) ; rejette inexistant/inactif/supprimé.

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/unit/guide-customization.featured-cross-city.test.ts` :

```ts
jest.mock('@/shared/lib/prisma', () => ({
  prisma: { pointOfInterest: { findMany: jest.fn() } },
}))

import { prisma } from '@/shared/lib/prisma'
import { validateFeaturedPois } from '@/features/guide-customization/queries/customization'

const lodging = {
  id: 'l1',
  owner_id: 'o1',
  city_id: 'cityA',
  city: { latitude: 45, longitude: 6 },
}

function poiRow(id: string, city_id: string, category_id: string, over: Partial<{ is_active: boolean; deleted_at: Date | null }> = {}) {
  return { id, city_id, category_id, is_active: over.is_active ?? true, deleted_at: over.deleted_at ?? null }
}

describe('validateFeaturedPois — cross-city', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts a POI from another city', async () => {
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([poiRow('p1', 'cityB', 'cat1')] as never)
    const res = await validateFeaturedPois(lodging as never, [{ poi_id: 'p1', sort_order: 0 }])
    expect(res).toEqual([{ poi_id: 'p1', category_id: 'cat1', sort_order: 0 }])
  })

  it('rejects more than 5 POIs in the same other city', async () => {
    const rows = Array.from({ length: 6 }, (_, i) => poiRow(`p${i}`, 'cityB', `c${i}`))
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue(rows as never)
    await expect(
      validateFeaturedPois(lodging as never, rows.map((r, i) => ({ poi_id: r.id, sort_order: i }))),
    ).rejects.toThrow(/ville/i)
  })

  it('still enforces 5 per category for local POIs', async () => {
    const rows = Array.from({ length: 6 }, (_, i) => poiRow(`p${i}`, 'cityA', 'cat1'))
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue(rows as never)
    await expect(
      validateFeaturedPois(lodging as never, rows.map((r, i) => ({ poi_id: r.id, sort_order: i }))),
    ).rejects.toThrow(/cat[ée]gorie/i)
  })

  it('rejects an inactive POI', async () => {
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([poiRow('p1', 'cityB', 'c1', { is_active: false })] as never)
    await expect(
      validateFeaturedPois(lodging as never, [{ poi_id: 'p1', sort_order: 0 }]),
    ).rejects.toThrow(/indisponible/i)
  })
})
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npx jest tests/unit/guide-customization.featured-cross-city.test.ts`
Expected: FAIL — `validateFeaturedPois` non exportée (TypeError / undefined).

- [ ] **Step 3: Réécrire `validateFeaturedPois` + nettoyer les imports**

Dans `src/features/guide-customization/queries/customization.ts` :

a) Retirer `isPoiWithinGuideScope` de l'import depuis `../lib/validation` (laisser `filterValidCategoryOrder, groupFeaturedPoisByCategory, normalizePracticalBlocks`).

b) Supprimer la fonction `haversineKm` (devenue inutilisée) — l'intégralité du bloc `function haversineKm(...) { ... }`.

c) Remplacer toute la fonction `async function validateFeaturedPois(...) { ... }` par cette version **exportée** :

```ts
const FEATURED_POI_LIMIT_PER_OTHER_CITY = 5

export async function validateFeaturedPois(
  lodging: CustomizableLodging,
  featuredPois: FeaturedPoiInput[],
): Promise<FeaturedPoiResponse[]> {
  if (featuredPois.length === 0) return []

  const requestedByPoiId = new Map<string, FeaturedPoiInput>()
  for (const featuredPoi of featuredPois) {
    requestedByPoiId.set(featuredPoi.poi_id, featuredPoi)
  }

  const rows = await prisma.pointOfInterest.findMany({
    where: { id: { in: [...requestedByPoiId.keys()] } },
    select: {
      id: true,
      city_id: true,
      category_id: true,
      is_active: true,
      deleted_at: true,
    },
  })

  if (rows.length !== requestedByPoiId.size) {
    raise('INVALID_FEATURED_POI', 'Un POI selectionne est introuvable')
  }

  const validated = rows.map(row => {
    const requested = requestedByPoiId.get(row.id)
    if (!requested) raise('INVALID_FEATURED_POI', 'Un POI selectionne est invalide')
    if (row.deleted_at !== null || !row.is_active) {
      raise('INVALID_FEATURED_POI', 'Un POI selectionne est indisponible')
    }
    return {
      poi_id: row.id,
      category_id: row.category_id,
      sort_order: requested.sort_order,
      city_id: row.city_id,
    }
  })

  // Bucket local → max 5 par catégorie (règle inchangée).
  const localForLimit = validated
    .filter(item => item.city_id === lodging.city_id)
    .map(({ city_id: _city_id, ...rest }) => rest)
  try {
    groupFeaturedPoisByCategory(localForLimit)
  } catch {
    raise('FEATURED_POI_LIMIT_EXCEEDED', 'Maximum 5 POI mis en avant par categorie')
  }

  // Bucket ailleurs → max 5 par ville (toutes catégories confondues).
  const otherCityCount = new Map<string, number>()
  for (const item of validated) {
    if (item.city_id === lodging.city_id) continue
    const next = (otherCityCount.get(item.city_id) ?? 0) + 1
    otherCityCount.set(item.city_id, next)
    if (next > FEATURED_POI_LIMIT_PER_OTHER_CITY) {
      raise('FEATURED_POI_LIMIT_EXCEEDED', 'Maximum 5 POI recommandes par ville')
    }
  }

  return validated
    .map(({ city_id: _city_id, ...rest }) => rest)
    .sort((a, b) => a.sort_order - b.sort_order)
}
```

- [ ] **Step 4: Lancer le nouveau test (passe)**

Run: `npx jest tests/unit/guide-customization.featured-cross-city.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Non-régression scope + typecheck**

Run: `npx jest tests/unit/guide-customization.BR-08-10.validation.test.ts tests/unit/guide-customization.AC-02-01-02-03.poi-featured-order.test.ts tests/unit/guide-customization.practical-blocks-save.test.ts tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts && npx tsc --noEmit`
Expected: toutes vertes (la fonction pure `isPoiWithinGuideScope` est inchangée) ; `tsc` sans erreur.

- [ ] **Step 6: Commit**

```bash
git add src/features/guide-customization/queries/customization.ts \
        tests/unit/guide-customization.featured-cross-city.test.ts
git commit -m "feat(guide-customization): accept cross-city featured POIs (5 per other city)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Endpoint dashboard — POI d'une ville pour le sélecteur

**Files:**
- Create: `src/app/api/dashboard/cities/[slug]/pois/route.ts`
- Test: `tests/contract/dashboard.city-pois-api.test.ts`

**Interfaces:**
- Produces: `GET /api/dashboard/cities/[slug]/pois` → `200 { data: { city: { slug, name }, pois: Array<{ id, name, category_slug, category_name }> } }` (POI actifs de la ville) ; `401` sans owner ; `404` ville introuvable.

- [ ] **Step 1: Écrire le test de contrat (échoue)**

Créer `tests/contract/dashboard.city-pois-api.test.ts` :

```ts
const mockGetSessionOwner = jest.fn()
jest.mock('@/features/dashboard-owner/lib/get-session-owner', () => ({
  getSessionOwner: () => mockGetSessionOwner(),
}))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: jest.fn() },
    pointOfInterest: { findMany: jest.fn() },
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { GET } from '@/app/api/dashboard/cities/[slug]/pois/route'

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

describe('GET /api/dashboard/cities/[slug]/pois', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionOwner.mockResolvedValue({ owner: { id: 'o1' }, error: null })
  })

  it('returns the active POIs of the city', async () => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue({ id: 'cityB', name: 'Annecy' } as never)
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      { id: 'p1', name: 'Lac', category: { slug: 'nature', name: 'Nature' } },
    ] as never)

    const res = await GET(new Request('http://t/api/dashboard/cities/annecy/pois'), makeParams('annecy'))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      data: {
        city: { slug: 'annecy', name: 'Annecy' },
        pois: [{ id: 'p1', name: 'Lac', category_slug: 'nature', category_name: 'Nature' }],
      },
    })
  })

  it('returns 401 when there is no owner session', async () => {
    const unauthorized = new Response(null, { status: 401 })
    mockGetSessionOwner.mockResolvedValue({ owner: null, error: unauthorized })
    const res = await GET(new Request('http://t/api/dashboard/cities/annecy/pois'), makeParams('annecy'))
    expect(res.status).toBe(401)
  })

  it('returns 404 when the city does not exist', async () => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue(null as never)
    const res = await GET(new Request('http://t/api/dashboard/cities/zzz/pois'), makeParams('zzz'))
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npx jest tests/contract/dashboard.city-pois-api.test.ts`
Expected: FAIL — module route introuvable.

- [ ] **Step 3: Créer la route**

Créer `src/app/api/dashboard/cities/[slug]/pois/route.ts` :

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const session = await getSessionOwner()
  if (!session.owner) return session.error

  const { slug } = await params
  const city = await prisma.city.findFirst({
    where: { slug, deleted_at: null, is_active: true },
    select: { id: true, name: true },
  })
  if (!city) {
    return NextResponse.json({ error: { code: 'CITY_NOT_FOUND', message: 'Ville introuvable' } }, { status: 404 })
  }

  const pois = await prisma.pointOfInterest.findMany({
    where: { city_id: city.id, deleted_at: null, is_active: true, geocode_status: { not: 'rejected' } },
    orderBy: [{ category: { sort_order: 'asc' } }, { name: 'asc' }],
    select: { id: true, name: true, category: { select: { slug: true, name: true } } },
  })

  return NextResponse.json({
    data: {
      city: { slug, name: city.name },
      pois: pois.map(poi => ({
        id: poi.id,
        name: poi.name,
        category_slug: poi.category.slug,
        category_name: poi.category.name,
      })),
    },
  })
}
```

- [ ] **Step 4: Lancer le test (passe)**

Run: `npx jest tests/contract/dashboard.city-pois-api.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add "src/app/api/dashboard/cities/[slug]/pois/route.ts" \
        tests/contract/dashboard.city-pois-api.test.ts
git commit -m "feat(api): dashboard endpoint listing a city's POIs for cross-city picker

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Composant `OtherCityRecommendations`

**Files:**
- Modify: `src/features/guide-customization/types.ts`
- Create: `src/features/guide-customization/components/OtherCityRecommendations.tsx`
- Test: `tests/unit/guide-customization.other-city-recommendations.test.tsx`

**Interfaces:**
- Consumes: `GET /api/cities/search` (Task existant), `GET /api/dashboard/cities/[slug]/pois` (Task 2).
- Produces:
  - Type `OtherCityPoiSelection { poi_id: string; name: string; category_name: string; city_slug: string; city_name: string }` (dans `types.ts`).
  - `OtherCityRecommendations(props: { value: OtherCityPoiSelection[]; onChange: (next: OtherCityPoiSelection[]) => void; excludeCitySlug: string }): JSX.Element` (consommé par Task 4).

- [ ] **Step 1: Ajouter le type**

Dans `src/features/guide-customization/types.ts`, après l'interface `FeaturedPoiResponse` (lignes 6-10), ajouter :

```ts
export interface OtherCityPoiSelection {
  poi_id: string
  name: string
  category_name: string
  city_slug: string
  city_name: string
}
```

- [ ] **Step 2: Écrire le test (échoue)**

Créer `tests/unit/guide-customization.other-city-recommendations.test.tsx` :

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { OtherCityRecommendations } from '@/features/guide-customization/components/OtherCityRecommendations'
import type { OtherCityPoiSelection } from '@/features/guide-customization/types'

function mockFetchOnce() {
  global.fetch = jest.fn((url: string) => {
    if (url.includes('/api/cities/search')) {
      return Promise.resolve({ ok: true, json: async () => ({ data: [{ id: 'cityB', name: 'Annecy', slug: 'annecy' }] }) })
    }
    if (url.includes('/api/dashboard/cities/annecy/pois')) {
      return Promise.resolve({ ok: true, json: async () => ({ data: { city: { slug: 'annecy', name: 'Annecy' }, pois: [{ id: 'p1', name: 'Le Lac', category_slug: 'nature', category_name: 'Nature' }] } }) })
    }
    return Promise.resolve({ ok: false, json: async () => ({}) })
  }) as jest.Mock
}

function Harness() {
  const [value, setValue] = useState<OtherCityPoiSelection[]>([])
  return (
    <>
      <OtherCityRecommendations value={value} onChange={setValue} excludeCitySlug="saint-gervais" />
      <pre data-testid="state">{JSON.stringify(value)}</pre>
    </>
  )
}

describe('OtherCityRecommendations', () => {
  beforeEach(() => { jest.clearAllMocks(); mockFetchOnce() })

  it('searches a city, lists its POIs, and selecting one updates the value', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText(/rechercher une ville/i), 'ann')
    await user.click(await screen.findByRole('button', { name: /annecy/i }))

    const poiCheckbox = await screen.findByLabelText(/le lac/i)
    await user.click(poiCheckbox)

    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toContain('"poi_id":"p1"'),
    )
    expect(screen.getByTestId('state').textContent).toContain('"city_slug":"annecy"')
  })
})
```

- [ ] **Step 3: Lancer le test (échoue)**

Run: `npx jest tests/unit/guide-customization.other-city-recommendations.test.tsx`
Expected: FAIL — module `OtherCityRecommendations` introuvable.

- [ ] **Step 4: Implémenter le composant**

Créer `src/features/guide-customization/components/OtherCityRecommendations.tsx` :

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import type { OtherCityPoiSelection } from '@/features/guide-customization/types'

const MAX_PER_CITY = 5

interface Props {
  value: OtherCityPoiSelection[]
  onChange: (next: OtherCityPoiSelection[]) => void
  excludeCitySlug: string
}

interface CityHit { id: string; name: string; slug: string }
interface CityPoi { id: string; name: string; category_slug: string; category_name: string }
interface OpenCity { slug: string; name: string; pois: CityPoi[] }

export function OtherCityRecommendations({ value, onChange, excludeCitySlug }: Props) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<CityHit[]>([])
  const [openCities, setOpenCities] = useState<OpenCity[]>([])
  const initialised = useRef(false)

  // Réhydrate les villes des POI déjà sélectionnés (au montage).
  useEffect(() => {
    if (initialised.current) return
    initialised.current = true
    const slugs = [...new Set(value.map(poi => poi.city_slug))]
    slugs.forEach(slug => { void loadCity(slug) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (query.trim().length < 3) { setHits([]); return }
    let cancelled = false
    const id = setTimeout(async () => {
      const res = await fetch(`/api/cities/search?q=${encodeURIComponent(query.trim())}`)
      if (!res.ok || cancelled) return
      const json = await res.json()
      const list: CityHit[] = (json.data ?? []).filter((c: CityHit) => c.slug !== excludeCitySlug)
      if (!cancelled) setHits(list)
    }, 250)
    return () => { cancelled = true; clearTimeout(id) }
  }, [query, excludeCitySlug])

  async function loadCity(slug: string) {
    if (openCities.some(city => city.slug === slug)) return
    const res = await fetch(`/api/dashboard/cities/${slug}/pois`)
    if (!res.ok) return
    const json = await res.json()
    const city = json.data?.city
    const pois: CityPoi[] = json.data?.pois ?? []
    if (!city) return
    setOpenCities(prev => (prev.some(c => c.slug === slug) ? prev : [...prev, { slug: city.slug, name: city.name, pois }]))
  }

  function addCity(hit: CityHit) {
    setQuery('')
    setHits([])
    void loadCity(hit.slug)
  }

  function countForCity(slug: string) {
    return value.filter(poi => poi.city_slug === slug).length
  }

  function togglePoi(city: OpenCity, poi: CityPoi, checked: boolean) {
    if (checked) {
      if (value.some(v => v.poi_id === poi.id)) return
      if (countForCity(city.slug) >= MAX_PER_CITY) return
      onChange([...value, {
        poi_id: poi.id,
        name: poi.name,
        category_name: poi.category_name,
        city_slug: city.slug,
        city_name: city.name,
      }])
    } else {
      onChange(value.filter(v => v.poi_id !== poi.id))
    }
  }

  function removeCity(slug: string) {
    setOpenCities(prev => prev.filter(city => city.slug !== slug))
    onChange(value.filter(poi => poi.city_slug !== slug))
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-charcoal">Recommandations ailleurs</h3>
        <p className="text-xs text-gray-500">Ajoutez des lieux situés dans d&apos;autres villes (5 max par ville).</p>
      </div>

      <div className="relative">
        <Label htmlFor="other-city-search" className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Rechercher une ville
        </Label>
        <div className="relative mt-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            id="other-city-search"
            value={query}
            placeholder="Annecy, Chamonix…"
            onChange={event => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        {hits.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            {hits.map(hit => (
              <li key={hit.id}>
                <button
                  type="button"
                  onClick={() => addCity(hit)}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-charcoal hover:bg-gray-50"
                >
                  {hit.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {openCities.map(city => {
        const count = countForCity(city.slug)
        return (
          <div key={city.slug} className="space-y-2 rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-charcoal">{city.name}</h4>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{count} / {MAX_PER_CITY}</span>
                <button type="button" aria-label={`Retirer ${city.name}`} onClick={() => removeCity(city.slug)} className="text-gray-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {city.pois.map(poi => {
                const checked = value.some(v => v.poi_id === poi.id)
                const disabled = !checked && count >= MAX_PER_CITY
                return (
                  <label key={poi.id} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${disabled ? 'opacity-40' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={event => togglePoi(city, poi, event.target.checked)}
                      className="h-4 w-4 accent-charcoal"
                    />
                    <span className="text-charcoal">{poi.name}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-widest text-gray-400">{poi.category_name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: Lancer le test (passe)**

Run: `npx jest tests/unit/guide-customization.other-city-recommendations.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 7: Commit**

```bash
git add src/features/guide-customization/types.ts \
        src/features/guide-customization/components/OtherCityRecommendations.tsx \
        tests/unit/guide-customization.other-city-recommendations.test.tsx
git commit -m "feat(guide-customization): OtherCityRecommendations picker component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Brancher le sélecteur dans le formulaire + page customize

**Files:**
- Modify: `src/features/guide-customization/components/CustomizationForm.tsx`
- Modify: `src/app/(dashboard)/dashboard/lodgings/[id]/customize/page.tsx`
- Test: `tests/unit/guide-customization.customization-form-other-city.test.tsx`

**Interfaces:**
- Consumes: `OtherCityRecommendations`, `OtherCityPoiSelection` (Task 3).
- Produces: le formulaire accepte `initialOtherCityPois?: OtherCityPoiSelection[]` et inclut les POI cross-city dans le payload `featured_pois` (à la suite des POI locaux).

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/unit/guide-customization.customization-form-other-city.test.tsx` :

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomizationForm } from '@/features/guide-customization/components/CustomizationForm'

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))
jest.mock('@/shared/components/ImageUpload', () => ({ ImageUpload: () => <div data-testid="image-upload" /> }))

const baseCustomization = {
  lodging_id: 'lodging-1',
  welcome_message: null,
  category_order: [],
  featured_pois: [],
  ignored_category_slugs: [],
  cover_photo_url: null, lodging_address: null, wifi_ssid: null, wifi_password: null,
  parking_info: null, equipment_info: null, checkout_instructions: null, trash_info: null,
  trash_location: null, house_rules: null, emergency_contacts: null, useful_services: null,
  practical_blocks: [],
}

describe('CustomizationForm — other-city payload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ...baseCustomization }) }) as jest.Mock
  })

  it('includes pre-selected other-city POIs in the PUT payload', async () => {
    const user = userEvent.setup()
    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais"
        categories={[]}
        pois={[]}
        initialCustomization={baseCustomization}
        initialOtherCityPois={[
          { poi_id: 'p1', name: 'Le Lac', category_name: 'Nature', city_slug: 'annecy', city_name: 'Annecy' },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const putCall = (global.fetch as jest.Mock).mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(putCall).toBeTruthy()
    const payload = JSON.parse((putCall![1] as RequestInit).body as string)
    expect(payload.featured_pois).toEqual([
      expect.objectContaining({ poi_id: 'p1', sort_order: 0 }),
    ])
  })
})
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npx jest tests/unit/guide-customization.customization-form-other-city.test.tsx`
Expected: FAIL — `initialOtherCityPois` ignoré / POI absent du payload.

- [ ] **Step 3: Modifier `CustomizationForm`**

Dans `src/features/guide-customization/components/CustomizationForm.tsx` :

a) Ajouter aux imports :

```ts
import { OtherCityRecommendations } from '@/features/guide-customization/components/OtherCityRecommendations'
import type { OtherCityPoiSelection } from '../types'
```

b) Étendre l'interface `Props` (après `initialCustomization: LodgingCustomizationResponse`) :

```ts
  initialOtherCityPois?: OtherCityPoiSelection[]
```

c) Dans la signature du composant, ajouter le paramètre avec défaut :

```ts
export function CustomizationForm({
  lodgingId,
  citySlug,
  categories,
  pois,
  initialCustomization,
  initialOtherCityPois = [],
}: Props) {
```

d) Juste après `}: Props) {`, calculer l'ensemble des poi_id cross-city :

```ts
  const otherCityIds = new Set(initialOtherCityPois.map(poi => poi.poi_id))
```

e) Remplacer l'initialisation de `featuredPois` (le `useState<FeaturedPoiInput[]>(...)`) pour exclure les POI cross-city :

```ts
  const [featuredPois, setFeaturedPois] = useState<FeaturedPoiInput[]>(
    initialCustomization.featured_pois
      .filter(featuredPoi => !otherCityIds.has(featuredPoi.poi_id))
      .map(featuredPoi => ({
        poi_id: featuredPoi.poi_id,
        sort_order: featuredPoi.sort_order,
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
  )
```

f) Après l'état `practicalBlocks` (le `useState<PracticalBlockInput[]>(...)`), ajouter l'état cross-city :

```ts
  const [otherCityPois, setOtherCityPois] = useState<OtherCityPoiSelection[]>(initialOtherCityPois)
```

g) Dans `saveCustomization`, remplacer la clé `featured_pois` de l'objet `body` par la fusion local + cross-city :

```ts
        featured_pois: [
          ...featuredPois.map((featuredPoi, index) => ({
            poi_id: featuredPoi.poi_id,
            sort_order: index,
          })),
          ...otherCityPois.map((poi, index) => ({
            poi_id: poi.poi_id,
            sort_order: featuredPois.length + index,
          })),
        ],
```

h) Dans le JSX, juste après la carte « Blocs personnalisés » (le `<section>` qui contient `<PracticalBlocksEditor .../>`), insérer :

```tsx
      <section className="overflow-hidden rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm">
        <OtherCityRecommendations
          value={otherCityPois}
          onChange={setOtherCityPois}
          excludeCitySlug={citySlug}
        />
      </section>
```

- [ ] **Step 4: Lancer le test (passe)**

Run: `npx jest tests/unit/guide-customization.customization-form-other-city.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Passer les données initiales depuis la page customize**

Dans `src/app/(dashboard)/dashboard/lodgings/[id]/customize/page.tsx` :

a) Après le calcul de `visiblePois` (le `const visiblePois = pois.filter(...).map(...)`), ajouter le calcul des POI cross-city déjà enregistrés :

```ts
  const featuredRows = await prisma.lodgingFeaturedPoi.findMany({
    where: { lodging_id: lodging.id, deleted_at: null },
    orderBy: [{ sort_order: 'asc' }],
    select: {
      poi: {
        select: {
          id: true,
          name: true,
          city: { select: { id: true, slug: true, name: true } },
          category: { select: { name: true } },
        },
      },
    },
  })

  const initialOtherCityPois = featuredRows
    .filter(row => row.poi.city.id !== lodging.city.id)
    .map(row => ({
      poi_id: row.poi.id,
      name: row.poi.name,
      category_name: row.poi.category.name,
      city_slug: row.poi.city.slug,
      city_name: row.poi.city.name,
    }))
```

b) Passer la prop au composant `CustomizationForm` (ajouter à l'appel existant) :

```tsx
        initialOtherCityPois={initialOtherCityPois}
```

- [ ] **Step 6: Non-régression + typecheck**

Run: `npx jest tests/unit/guide-customization.customization-form-blocks.test.tsx tests/unit/guide-customization.customization-form-other-city.test.tsx && npx tsc --noEmit`
Expected: vert + `tsc` sans erreur.

- [ ] **Step 7: Commit**

```bash
git add src/features/guide-customization/components/CustomizationForm.tsx \
        "src/app/(dashboard)/dashboard/lodgings/[id]/customize/page.tsx" \
        tests/unit/guide-customization.customization-form-other-city.test.tsx
git commit -m "feat(guide-customization): wire OtherCityRecommendations into the form

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Affichage public « À découvrir ailleurs » sur `/nos-recommandations`

**Files:**
- Modify: `src/app/(public)/nos-recommandations/page.tsx`
- Test: `tests/integration/nos-recommandations.cross-city.test.tsx`

**Interfaces:**
- Consumes: bucketing par `poi.city.slug === lodgingContext.citySlug`.
- Produces: section « À découvrir ailleurs » groupée par ville ; liens POI construits avec `poi.city.slug`.

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/integration/nos-recommandations.cross-city.test.tsx` :

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import NosRecommendationsPage from '@/app/(public)/nos-recommandations/page'
import { prisma } from '@/shared/lib/prisma'

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => ({
    lodgingId: 'lodging-1',
    lodgingName: 'Chalet MyStay',
    citySlug: 'saint-gervais',
    cityName: 'Saint-Gervais-les-Bains',
    ownerName: 'Alice',
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: { lodgingFeaturedPoi: { findMany: jest.fn() } },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

function row(id: string, name: string, citySlug: string, cityName: string) {
  return {
    poi_id: id,
    poi: {
      id, name, slug: id, description: null, photos: [],
      category: { name: 'Nature', slug: 'nature' },
      city: { slug: citySlug, name: cityName },
    },
  }
}

describe('/nos-recommandations — cross-city', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders an "À découvrir ailleurs" section grouped by city with city-slug links', async () => {
    jest.mocked(prisma.lodgingFeaturedPoi.findMany).mockResolvedValue([
      row('local1', 'Resto local', 'saint-gervais', 'Saint-Gervais-les-Bains'),
      row('far1', 'Le Lac', 'annecy', 'Annecy'),
    ] as never)

    render(await NosRecommendationsPage())

    expect(screen.getByText('Resto local')).toBeInTheDocument()
    expect(screen.getByText(/à découvrir ailleurs/i)).toBeInTheDocument()
    expect(screen.getByText(/à annecy/i)).toBeInTheDocument()
    const farLink = screen.getByText('Le Lac').closest('a')
    expect(farLink).toHaveAttribute('href', '/guide/annecy/nature/far1')
  })
})
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npx jest tests/integration/nos-recommandations.cross-city.test.tsx`
Expected: FAIL — pas de section « À découvrir ailleurs » / lien construit avec le citySlug du logement.

- [ ] **Step 3: Modifier la page**

Dans `src/app/(public)/nos-recommandations/page.tsx` :

a) Étendre le `select` de la requête `lodgingFeaturedPoi.findMany` pour ajouter la ville. Remplacer le bloc `poi: { select: { ... } }` par :

```ts
      poi: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          photos: true,
          category: { select: { name: true, slug: true } },
          city: { select: { slug: true, name: true } },
        },
      },
```

b) Étendre le type `FeaturedRow` pour inclure la ville :

```ts
type FeaturedRow = {
  poi_id: string
  poi: {
    id: string
    name: string
    slug: string
    description: string | null
    photos: string[]
    category: { name: string; slug: string }
    city: { slug: string; name: string }
  }
}
```

c) Remplacer le calcul `const grouped = groupByCategory(featuredPois)` et le bloc de rendu conditionnel par un découpage local/ailleurs :

```ts
  const localRows = featuredPois.filter(row => row.poi.city.slug === lodgingContext.citySlug)
  const otherRows = featuredPois.filter(row => row.poi.city.slug !== lodgingContext.citySlug)
  const grouped = groupByCategory(localRows)
  const otherByCity = groupByCity(otherRows)
  const hasAny = grouped.length > 0 || otherByCity.length > 0
```

d) Dans le JSX, remplacer `grouped.length === 0 ? (<EmptyState ... />) : (<div className="space-y-6 pb-8">{grouped.map(...)}</div>)` par :

```tsx
      {!hasAny ? (
        <EmptyState citySlug={lodgingContext.citySlug} />
      ) : (
        <div className="space-y-8 pb-8">
          {grouped.length > 0 && (
            <div className="space-y-6">
              {grouped.map(group => (
                <CategoryGroup
                  key={group.categorySlug}
                  categoryName={group.categoryName}
                  citySlug={lodgingContext.citySlug}
                  items={group.items}
                />
              ))}
            </div>
          )}
          {otherByCity.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">À découvrir ailleurs</h2>
              {otherByCity.map(group => (
                <section key={group.citySlug}>
                  <h3 className="mb-3 font-serif italic text-lg text-charcoal">À {group.cityName}</h3>
                  <div className="space-y-3">
                    {group.items.map(item => (
                      <FeaturedCard key={item.poi.id} item={item} citySlug={item.poi.city.slug} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
```

e) Modifier `FeaturedCard` pour utiliser la ville du POI dans le lien. Remplacer la ligne `const href = `/guide/${citySlug}/${item.poi.category.slug}/${item.poi.slug}`` par :

```ts
  const href = `/guide/${item.poi.city.slug}/${item.poi.category.slug}/${item.poi.slug}`
```

(la prop `citySlug` de `FeaturedCard`/`CategoryGroup` devient inutilisée pour le lien mais reste passée ; aucune autre modification nécessaire.)

f) Ajouter le helper `groupByCity` après `groupByCategory` :

```ts
type CityGroup = {
  citySlug: string
  cityName: string
  items: FeaturedRow[]
}

function groupByCity(rows: FeaturedRow[]): CityGroup[] {
  const map = new Map<string, CityGroup>()
  for (const row of rows) {
    const slug = row.poi.city.slug
    const existing = map.get(slug)
    if (existing) {
      existing.items.push(row)
    } else {
      map.set(slug, { citySlug: slug, cityName: row.poi.city.name, items: [row] })
    }
  }
  return [...map.values()]
}
```

- [ ] **Step 4: Lancer le test (passe)**

Run: `npx jest tests/integration/nos-recommandations.cross-city.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(public)/nos-recommandations/page.tsx" \
        tests/integration/nos-recommandations.cross-city.test.tsx
git commit -m "feat(nos-recommandations): 'À découvrir ailleurs' section grouped by city

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage :**
- Bucket dérivé (approche A, zéro schéma) → Tasks 1 & 5. ✅
- Validation cross-city + 5/ville, local 5/catégorie, rejet inactif → Task 1. ✅
- `isPoiWithinGuideScope` conservée, plus utilisée pour rejeter → Task 1 (import retiré, fonction pure intacte). ✅
- Sélecteur owner (autocomplete ville + POI 5/ville) → Task 3 ; branchement form + page → Task 4. ✅
- Endpoint POI par ville pour le sélecteur → Task 2. ✅
- Affichage `/nos-recommandations` groupé par ville + lien `poi.city.slug` → Task 5. ✅
- Pas d'affichage dans `/guide/[ville]` → aucune tâche ne touche le guide. ✅

**Placeholder scan :** aucun TBD/TODO ; code complet à chaque étape (composant, route, page, tests).

**Type consistency :** `OtherCityPoiSelection { poi_id, name, category_name, city_slug, city_name }` défini en Task 3, consommé identiquement en Task 4 (form + page mapping) et produit par l'endpoint Task 2 (`{ id, name, category_slug, category_name }` côté API → mappé vers la sélection dans le composant Task 3). `validateFeaturedPois` exportée en Task 1 avec signature `(CustomizableLodging, FeaturedPoiInput[]) => Promise<FeaturedPoiResponse[]>`. Le payload `featured_pois` reste `{ poi_id, sort_order }` (schéma Zod route inchangé). `FeaturedRow` (Task 5) ajoute `poi.city {slug,name}` cohérent avec le `select` Prisma étendu.
