# Home publique « Find what you need » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la home publique anonyme par un sélecteur de ville (villes en base) qui révèle, en spring très élastique, une grille bento des catégories de la ville choisie.

**Architecture:** `page.tsx` (server) charge les villes actives et rend un composant client `CityCategoryExplorer`. Le composant ouvre un dropdown custom (framer-motion), `fetch` les catégories via la route existante `/api/cities/[slug]/categories`, puis affiche une grille de cartes (photo mappée par slug, sinon fallback icône+dégradé) avec stagger + spring. La home « guest » (`LodgingHome`) est inchangée.

**Tech Stack:** Next.js (App Router, RSC), React client component, framer-motion ^12.40.0, Tailwind (tokens `charcoal`/`gold`), Prisma, Jest + jsdom + Testing Library.

---

## File Structure

- **Create** `src/features/city-guide/lib/category-images.ts` — mapping slug→photo + fallback dégradé.
- **Create** `src/features/city-guide/components/CityCategoryExplorer.tsx` — composant client (dropdown + grille + carte).
- **Create** `tests/unit/home.city-category-explorer.test.tsx` — tests du composant.
- **Create** `tests/unit/city-guide.list-active-cities.test.ts` — test de la requête.
- **Modify** `src/features/city-guide/queries/cities.ts` — ajout `listActiveCities()`.
- **Modify** `src/shared/lib/i18n.ts` — clés `home.*` (ajout + retrait `home.search.*`).
- **Modify** `src/app/(public)/page.tsx` — réécriture `AnonymousLanding`.
- **Modify** `tests/unit/public-home.lodging-home.test.tsx` — ajout d'un cas « home anonyme » (ou nouveau fichier).
- **Delete** `src/features/city-guide/components/CitySearchInput.tsx`.
- **Delete** `tests/integration/city-guide.AC-02-01.city-search-redirect.test.tsx`.
- **Delete** `tests/unit/city-guide.AC-02-02.no-result-message.test.tsx`.
- **Modify** `docs/traceability-matrix.md` — note sur le retrait de la recherche texte de la home.

Tokens Tailwind disponibles : `charcoal` = `#121212`, `gold` = `#A68E69`. Photos déjà présentes dans `/public/home/` : `art.png`, `bakery.png`, `outdoor.png`, `pub.png`, `resto.png`.

---

## Task 1: i18n — clés de la home

**Files:**
- Modify: `src/shared/lib/i18n.ts`

- [ ] **Step 1: Ajouter les clés et retirer les anciennes `home.search.*`**

Dans l'objet des traductions de `src/shared/lib/i18n.ts`, supprimer les 2 lignes :

```ts
  'home.search.placeholder': 'Votre ville ou code postal…',
  'home.search.no_results': 'Aucune ville trouvée pour « {q} »',
```

et ajouter :

```ts
  'home.title': 'Trouvez ce qu’il vous faut.',
  'home.intro':
    'Choisissez votre destination et explorez les meilleures adresses locales, sélectionnées pour votre séjour.',
  'home.select.placeholder': 'Sélectionner une ville',
  'home.empty': 'Aucune catégorie disponible pour cette ville pour le moment.',
  'home.error': 'Impossible de charger les catégories. Réessayez.',
```

- [ ] **Step 2: Vérifier qu’aucune autre référence aux clés supprimées ne subsiste**

Run: `grep -rn "home.search" src tests`
Expected: seules apparaissent les références dans `CitySearchInput.tsx` et ses 2 tests (supprimés en Task 8). Aucune autre.

- [ ] **Step 3: Compiler les types i18n**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "i18n" || echo "OK i18n types"`
Expected: `OK i18n types` (pas d’erreur de type sur i18n). Les erreurs résiduelles sur `CitySearchInput` sont normales et disparaissent en Task 8.

- [ ] **Step 4: Commit**

```bash
git add src/shared/lib/i18n.ts
git commit -m "feat(home): add i18n keys for public city selector home"
```

---

## Task 2: Requête `listActiveCities`

**Files:**
- Modify: `src/features/city-guide/queries/cities.ts`
- Test: `tests/unit/city-guide.list-active-cities.test.ts`

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/unit/city-guide.list-active-cities.test.ts` :

```ts
import { listActiveCities } from '@/features/city-guide/queries/cities'
import { prisma } from '@/shared/lib/prisma'

jest.mock('@/shared/lib/prisma', () => ({
  prisma: { city: { findMany: jest.fn() } },
}))

describe('listActiveCities', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns active, non-deleted cities ordered by name', async () => {
    ;(prisma.city.findMany as jest.Mock).mockResolvedValue([
      { name: 'Chamonix-Mont-Blanc', slug: 'chamonix-mont-blanc' },
      { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
    ])

    const result = await listActiveCities()

    expect(prisma.city.findMany).toHaveBeenCalledWith({
      where: { is_active: true, deleted_at: null },
      orderBy: { name: 'asc' },
      select: { name: true, slug: true },
    })
    expect(result).toEqual([
      { name: 'Chamonix-Mont-Blanc', slug: 'chamonix-mont-blanc' },
      { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
    ])
  })
})
```

- [ ] **Step 2: Lancer le test pour vérifier qu’il échoue**

Run: `npm test -- tests/unit/city-guide.list-active-cities.test.ts`
Expected: FAIL — `listActiveCities is not a function` / export introuvable.

- [ ] **Step 3: Implémenter la requête**

À la fin de `src/features/city-guide/queries/cities.ts`, ajouter :

```ts
/**
 * Liste les villes actives (pour le sélecteur de la home publique).
 * Triées par nom, ordre alphabétique.
 */
export async function listActiveCities(): Promise<{ name: string; slug: string }[]> {
  return prisma.city.findMany({
    where: { is_active: true, deleted_at: null },
    orderBy: { name: 'asc' },
    select: { name: true, slug: true },
  })
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu’il passe**

Run: `npm test -- tests/unit/city-guide.list-active-cities.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/city-guide/queries/cities.ts tests/unit/city-guide.list-active-cities.test.ts
git commit -m "feat(home): add listActiveCities query"
```

---

## Task 3: Lib `category-images`

**Files:**
- Create: `src/features/city-guide/lib/category-images.ts`
- Test: `tests/unit/city-guide.category-images.test.ts`

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/unit/city-guide.category-images.test.ts` :

```ts
import {
  getCategoryImage,
  getFallbackGradient,
} from '@/features/city-guide/lib/category-images'

describe('category-images', () => {
  it('maps known slugs to their photo path', () => {
    expect(getCategoryImage('boulangerie')).toBe('/home/bakery.png')
    expect(getCategoryImage('rando')).toBe('/home/outdoor.png')
    expect(getCategoryImage('bars')).toBe('/home/pub.png')
    expect(getCategoryImage('culture')).toBe('/home/art.png')
    expect(getCategoryImage('diner')).toBe('/home/resto.png')
    expect(getCategoryImage('restaurants')).toBe('/home/resto.png')
  })

  it('returns null for unmapped slugs', () => {
    expect(getCategoryImage('mobilite')).toBeNull()
    expect(getCategoryImage('location-de-ski')).toBeNull()
  })

  it('returns a deterministic gradient class for the same slug', () => {
    const a = getFallbackGradient('mobilite')
    const b = getFallbackGradient('mobilite')
    expect(a).toBe(b)
    expect(a).toMatch(/from-\[#/)
  })
})
```

- [ ] **Step 2: Lancer le test pour vérifier qu’il échoue**

Run: `npm test -- tests/unit/city-guide.category-images.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter la lib**

Créer `src/features/city-guide/lib/category-images.ts` :

```ts
/**
 * Mapping best-effort slug de catégorie → photo statique (/public/home).
 * Les slugs absents reçoivent un dégradé de fallback déterministe.
 */
export const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  boulangerie: '/home/bakery.png',
  rando: '/home/outdoor.png',
  bars: '/home/pub.png',
  culture: '/home/art.png',
  diner: '/home/resto.png',
  restaurants: '/home/resto.png',
}

export function getCategoryImage(slug: string): string | null {
  return CATEGORY_IMAGE_BY_SLUG[slug] ?? null
}

const FALLBACK_GRADIENTS = [
  'from-[#007AFF] to-[#5AC8FA]',
  'from-[#AF52DE] to-[#FF2D55]',
  'from-[#34C759] to-[#30D158]',
  'from-[#FF9500] to-[#FFCC00]',
  'from-[#5856D6] to-[#AF52DE]',
]

/** Dégradé Tailwind déterministe (hash simple du slug). */
export function getFallbackGradient(slug: string): string {
  let hash = 0
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  }
  return FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length]
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu’il passe**

Run: `npm test -- tests/unit/city-guide.category-images.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/city-guide/lib/category-images.ts tests/unit/city-guide.category-images.test.ts
git commit -m "feat(home): add category image mapping + fallback gradient"
```

---

## Task 4: Composant `CityCategoryExplorer` — dropdown + sélection + fetch

**Files:**
- Create: `src/features/city-guide/components/CityCategoryExplorer.tsx`
- Test: `tests/unit/home.city-category-explorer.test.tsx`

- [ ] **Step 1: Écrire le test (échoue) — liste, sélection, fetch, rendu des catégories**

Créer `tests/unit/home.city-category-explorer.test.tsx` :

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CityCategoryExplorer } from '@/features/city-guide/components/CityCategoryExplorer'

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

const CITIES = [
  { name: 'Chamonix-Mont-Blanc', slug: 'chamonix-mont-blanc' },
  { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
]

const CATEGORIES = [
  { id: '1', name: 'Boulangerie', slug: 'boulangerie', icon: 'coffee', sort_order: 0, poi_count: 4 },
  { id: '2', name: 'Mobilité', slug: 'mobilite', icon: 'car', sort_order: 9, poi_count: 6 },
]

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: CATEGORIES }),
  }) as jest.Mock
})

afterEach(() => jest.clearAllMocks())

describe('CityCategoryExplorer', () => {
  it('shows the placeholder and lists active cities when opened', async () => {
    const user = userEvent.setup()
    render(<CityCategoryExplorer cities={CITIES} />)

    expect(screen.getByText('Sélectionner une ville')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))

    expect(screen.getByRole('option', { name: 'Chamonix-Mont-Blanc' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' })).toBeInTheDocument()
  })

  it('fetches and renders categories of the selected city', async () => {
    const user = userEvent.setup()
    render(<CityCategoryExplorer cities={CITIES} />)

    await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
    await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cities/saint-gervais-les-bains/categories',
      ),
    )
    expect(await screen.findByText('Boulangerie')).toBeInTheDocument()
    expect(screen.getByText('Mobilité')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Lancer le test pour vérifier qu’il échoue**

Run: `npm test -- tests/unit/home.city-category-explorer.test.tsx`
Expected: FAIL — composant introuvable.

- [ ] **Step 3: Implémenter le composant complet (dropdown + grille + carte)**

Créer `src/features/city-guide/components/CityCategoryExplorer.tsx` :

```tsx
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { FC } from 'react'
import type { CategorySummary } from '@/features/city-guide/types'
import {
  getCategoryImage,
  getFallbackGradient,
} from '@/features/city-guide/lib/category-images'
import { t } from '@/shared/lib/i18n'

type City = { name: string; slug: string }
type Status = 'idle' | 'loading' | 'error'

const spring = { type: 'spring' as const, stiffness: 260, damping: 13 }

function CategoryIcon({ iconSlug }: { iconSlug: string }) {
  const name = iconSlug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('') as keyof typeof LucideIcons
  const Icon = (LucideIcons[name] ?? LucideIcons.MapPin) as FC<{ className?: string }>
  return <Icon className="h-7 w-7" />
}

export function CityCategoryExplorer({ cities }: { cities: City[] }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<City | null>(null)
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const searchParams = useSearchParams()
  const lodgingId = searchParams.get('lodging')
  const reduce = useReducedMotion()

  async function selectCity(city: City) {
    setSelected(city)
    setOpen(false)
    setStatus('loading')
    try {
      const qs = lodgingId ? `?lodging=${lodgingId}` : ''
      const res = await fetch(`/api/cities/${city.slug}/categories${qs}`)
      if (!res.ok) throw new Error('request failed')
      const json = await res.json()
      setCategories(json.data ?? [])
      setStatus('idle')
    } catch {
      setCategories([])
      setStatus('error')
    }
  }

  function categoryHref(catSlug: string) {
    const base = `/guide/${selected?.slug}/${catSlug}`
    return lodgingId ? `${base}?lodging=${lodgingId}` : base
  }

  return (
    <div className="w-full">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex w-full items-center justify-between border-b border-charcoal/80 px-2 py-4 text-left"
        >
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-charcoal">
            {selected ? selected.name : t('home.select.placeholder')}
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-charcoal transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              role="listbox"
              initial={reduce ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-black/5 bg-white py-2 shadow-xl"
            >
              {cities.map((city) => (
                <li key={city.slug} role="option" aria-selected={selected?.slug === city.slug}>
                  <button
                    type="button"
                    onClick={() => selectCity(city)}
                    className="block w-full px-4 py-2.5 text-left text-sm text-charcoal hover:bg-gray-50"
                  >
                    {city.name}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {status === 'loading' && (
        <div className="mt-6 grid grid-cols-2 gap-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-gray-100" />
          ))}
        </div>
      )}

      {status === 'error' && <p className="mt-6 text-sm text-gray-500">{t('home.error')}</p>}

      {status === 'idle' && selected && categories.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">{t('home.empty')}</p>
      )}

      {status === 'idle' && categories.length > 0 && (
        <motion.div
          key={selected?.slug}
          className="mt-6 grid grid-cols-2 gap-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.07 } } }}
        >
          {categories.map((cat, index) => (
            <CategoryBentoCard
              key={cat.id}
              category={cat}
              href={categoryHref(cat.slug)}
              wide={index % 3 === 0}
              reduce={!!reduce}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}

function CategoryBentoCard({
  category,
  href,
  wide,
  reduce,
}: {
  category: CategorySummary
  href: string
  wide: boolean
  reduce: boolean
}) {
  const image = getCategoryImage(category.slug)

  return (
    <motion.div
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.85 },
        show: reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, transition: spring },
      }}
      whileHover={reduce ? undefined : { scale: 1.04 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className={wide ? 'col-span-2' : 'col-span-1'}
    >
      <Link
        href={href}
        className="relative flex h-32 items-end overflow-hidden rounded-3xl shadow-sm"
      >
        {image ? (
          <>
            <Image
              src={image}
              alt={category.name}
              fill
              unoptimized
              sizes="(max-width: 430px) 50vw, 215px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <span className="relative z-10 m-3 rounded-md bg-white/90 px-2 py-1 text-xs font-bold uppercase tracking-wide text-charcoal">
              {category.name}
            </span>
          </>
        ) : (
          <div
            className={`flex h-full w-full flex-col justify-between bg-gradient-to-br ${getFallbackGradient(category.slug)} p-3 text-white`}
          >
            <CategoryIcon iconSlug={category.icon} />
            <span className="text-xs font-bold uppercase tracking-wide">{category.name}</span>
          </div>
        )}
      </Link>
    </motion.div>
  )
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu’il passe**

Run: `npm test -- tests/unit/home.city-category-explorer.test.tsx`
Expected: PASS (les 2 cas).

- [ ] **Step 5: Commit**

```bash
git add src/features/city-guide/components/CityCategoryExplorer.tsx tests/unit/home.city-category-explorer.test.tsx
git commit -m "feat(home): add CityCategoryExplorer (dropdown + animated category grid)"
```

---

## Task 5: Cartes — photo vs fallback, liens, paramètre lodging

**Files:**
- Test: `tests/unit/home.city-category-explorer.test.tsx` (ajout de cas)

> Le composant est déjà complet (Task 4). Ces tests verrouillent le comportement des cartes ; aucune nouvelle implémentation n’est attendue (sinon, corriger le composant).

- [ ] **Step 1: Ajouter les cas de test**

Ajouter dans le `describe('CityCategoryExplorer', ...)` de `tests/unit/home.city-category-explorer.test.tsx` :

```tsx
  it('uses a photo for a mapped slug and a fallback (icon, no img) for an unmapped slug', async () => {
    const user = userEvent.setup()
    render(<CityCategoryExplorer cities={CITIES} />)

    await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
    await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

    // boulangerie est mappée → image avec alt = nom
    expect(await screen.findByAltText('Boulangerie')).toBeInTheDocument()
    // mobilite n'est pas mappée → pas d'image, le libellé reste présent
    expect(screen.queryByAltText('Mobilité')).not.toBeInTheDocument()
    expect(screen.getByText('Mobilité')).toBeInTheDocument()
  })

  it('links each category card to its guide route', async () => {
    const user = userEvent.setup()
    render(<CityCategoryExplorer cities={CITIES} />)

    await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
    await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

    await screen.findByText('Boulangerie')
    expect(screen.getByText('Boulangerie').closest('a')).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/boulangerie',
    )
  })
```

Et ajouter un fichier de test séparé pour le cas `lodging` (mock distinct de `useSearchParams`).
Créer `tests/unit/home.city-category-explorer.lodging.test.tsx` :

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CityCategoryExplorer } from '@/features/city-guide/components/CityCategoryExplorer'

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (k: string) => (k === 'lodging' ? 'lodge-1' : null) }),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

const CITIES = [{ name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' }]
const CATEGORIES = [
  { id: '1', name: 'Boulangerie', slug: 'boulangerie', icon: 'coffee', sort_order: 0, poi_count: 4 },
]

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: CATEGORIES }) }) as jest.Mock
})
afterEach(() => jest.clearAllMocks())

it('propagates ?lodging= to the fetch URL and category links', async () => {
  const user = userEvent.setup()
  render(<CityCategoryExplorer cities={CITIES} />)

  await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
  await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/cities/saint-gervais-les-bains/categories?lodging=lodge-1',
    ),
  )
  await screen.findByText('Boulangerie')
  expect(screen.getByText('Boulangerie').closest('a')).toHaveAttribute(
    'href',
    '/guide/saint-gervais-les-bains/boulangerie?lodging=lodge-1',
  )
})
```

- [ ] **Step 2: Lancer les tests**

Run: `npm test -- tests/unit/home.city-category-explorer.test.tsx tests/unit/home.city-category-explorer.lodging.test.tsx`
Expected: PASS (tous les cas).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/home.city-category-explorer.test.tsx tests/unit/home.city-category-explorer.lodging.test.tsx
git commit -m "test(home): cover category card photo/fallback, links and lodging param"
```

---

## Task 6: Erreur, vide, et reduced-motion

**Files:**
- Test: `tests/unit/home.city-category-explorer.states.test.tsx`

> Comportements déjà implémentés en Task 4 ; on les verrouille.

- [ ] **Step 1: Écrire les tests**

Créer `tests/unit/home.city-category-explorer.states.test.tsx` :

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CityCategoryExplorer } from '@/features/city-guide/components/CityCategoryExplorer'

jest.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => null }) }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

// reduced motion : le rendu doit rester fonctionnel
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

const CITIES = [{ name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' }]

afterEach(() => jest.clearAllMocks())

it('shows an empty message when the city has no category', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }) as jest.Mock
  const user = userEvent.setup()
  render(<CityCategoryExplorer cities={CITIES} />)

  await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
  await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

  expect(await screen.findByText(/Aucune catégorie disponible/i)).toBeInTheDocument()
})

it('shows an error message when the fetch fails', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock
  const user = userEvent.setup()
  render(<CityCategoryExplorer cities={CITIES} />)

  await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
  await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

  expect(await screen.findByText(/Impossible de charger les catégories/i)).toBeInTheDocument()
})

it('still renders categories under reduced motion', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: [{ id: '1', name: 'Boulangerie', slug: 'boulangerie', icon: 'coffee', sort_order: 0, poi_count: 4 }] }),
  }) as jest.Mock
  const user = userEvent.setup()
  render(<CityCategoryExplorer cities={CITIES} />)

  await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
  await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

  expect(await screen.findByText('Boulangerie')).toBeInTheDocument()
})
```

- [ ] **Step 2: Lancer les tests**

Run: `npm test -- tests/unit/home.city-category-explorer.states.test.tsx`
Expected: PASS (3 cas).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/home.city-category-explorer.states.test.tsx
git commit -m "test(home): cover empty, error and reduced-motion states"
```

---

## Task 7: Réécriture de la home anonyme (`page.tsx`)

**Files:**
- Modify: `src/app/(public)/page.tsx`
- Test: `tests/unit/public-home.anonymous.test.tsx`

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/unit/public-home.anonymous.test.tsx` :

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/(public)/page'
import { prisma } from '@/shared/lib/prisma'

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => null),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: { city: { findMany: jest.fn() }, lodgingCustomization: { findFirst: jest.fn() } },
}))

jest.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => null }) }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

it('anonymous home renders the title and the city selector', async () => {
  ;(prisma.city.findMany as jest.Mock).mockResolvedValue([
    { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
  ])

  render(await HomePage())

  expect(screen.getByText('Trouvez ce qu’il vous faut.')).toBeInTheDocument()
  expect(screen.getByText('Sélectionner une ville')).toBeInTheDocument()
})
```

- [ ] **Step 2: Lancer le test pour vérifier qu’il échoue**

Run: `npm test -- tests/unit/public-home.anonymous.test.tsx`
Expected: FAIL — le titre/sélecteur n’existent pas encore (ancien layout bento).

- [ ] **Step 3: Réécrire `AnonymousLanding` et brancher la donnée**

Dans `src/app/(public)/page.tsx` :

1. Remplacer l’import de `CitySearchInput` par :
```tsx
import { CityCategoryExplorer } from '@/features/city-guide/components/CityCategoryExplorer'
import { listActiveCities } from '@/features/city-guide/queries/cities'
import { t } from '@/shared/lib/i18n'
```
(retirer `import { CitySearchInput } ...`)

2. Rendre `AnonymousLanding` asynchrone (elle charge les villes). Remplacer l’intégralité de la fonction `AnonymousLanding()` actuelle par :

```tsx
async function AnonymousLanding() {
  const cities = await listActiveCities()

  return (
    <AppShell>
      <BrandMotionStyles />

      <header className="relative z-20 flex items-center justify-between px-6 pt-6">
        <BrandLogo />
      </header>

      <main className="relative z-10 flex-1 px-6 pb-28 pt-10">
        <FloatingAura className="left-[-90px] top-24 h-64 w-64 bg-[#007AFF]/18" />
        <FloatingAura className="right-[-110px] top-20 h-72 w-72 bg-[#AF52DE]/16 delay-500" />

        <h1 className="max-w-[330px] text-[3.05rem] font-semibold leading-[0.92] tracking-[-0.06em] text-charcoal">
          {t('home.title')}
        </h1>

        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#6E6E73]">
          {t('home.intro')}
        </p>

        <div className="mt-8">
          <CityCategoryExplorer cities={cities} />
        </div>
      </main>
    </AppShell>
  )
}
```

3. Adapter l’appel : dans `HomePage`, `return <AnonymousLanding />` devient `return await AnonymousLanding()` (obligatoire — la fonction est désormais async ; `render(await HomePage())` doit recevoir du JSX concret, pas un élément de composant async non résolu).

4. Supprimer les fonctions devenues inutilisées si elles ne servent plus qu’à l’ancienne home anonyme : `BentoInfoCard`, `ApplePill`, `AnonymousBottomBar`. **Ne pas** toucher à `ShortcutCard`, `LodgingHome`, `LodgingBottomBar`, `AppShell`, `BrandLogo`, `FloatingAura`, `BrandMotionStyles` (utilisés par la home guest).

> Vérifier avant suppression : `grep -n "BentoInfoCard\|ApplePill\|AnonymousBottomBar\|QrScannerButton" src/app/(public)/page.tsx`. Retirer aussi l’import `QrScannerButton` s’il n’est plus référencé.

- [ ] **Step 4: Lancer le test pour vérifier qu’il passe**

Run: `npm test -- tests/unit/public-home.anonymous.test.tsx`
Expected: PASS.

- [ ] **Step 5: Vérifier que la home guest n’est pas cassée**

Run: `npm test -- tests/unit/public-home.lodging-home.test.tsx`
Expected: PASS (inchangé).

- [ ] **Step 6: Commit**

```bash
git add "src/app/(public)/page.tsx" tests/unit/public-home.anonymous.test.tsx
git commit -m "feat(home): replace anonymous home with city selector + category grid"
```

---

## Task 8: Suppression de `CitySearchInput` + tests, mise à jour traçabilité

**Files:**
- Delete: `src/features/city-guide/components/CitySearchInput.tsx`
- Delete: `tests/integration/city-guide.AC-02-01.city-search-redirect.test.tsx`
- Delete: `tests/unit/city-guide.AC-02-02.no-result-message.test.tsx`
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Vérifier qu’aucune référence à `CitySearchInput` ne subsiste**

Run: `grep -rn "CitySearchInput" src tests`
Expected: aucune occurrence (la home utilise désormais `CityCategoryExplorer`). Si une occurrence subsiste, la retirer avant suppression.

- [ ] **Step 2: Supprimer le composant et ses 2 tests**

Run:
```bash
git rm src/features/city-guide/components/CitySearchInput.tsx \
  tests/integration/city-guide.AC-02-01.city-search-redirect.test.tsx \
  tests/unit/city-guide.AC-02-02.no-result-message.test.tsx
```

- [ ] **Step 3: Mettre à jour la matrice de traçabilité**

Dans `docs/traceability-matrix.md`, repérer les lignes des AC `AC-02-01` / `AC-02-02` de la spec 001 (recherche de ville). Ajouter une note (sans supprimer la ligne historique) du type :

```
> NOTE (2026-06-14) : la recherche texte de ville sur la home publique (AC-02-01 / AC-02-02) est remplacée par un sélecteur de ville (voir specs/2026-06-14-home-publique-ville-categories-design.md). La recherche texte reste disponible dans le guide (GuideSearchInput).
```

Adapter le format exact à celui du fichier (repérer d’abord comment les notes y sont écrites avec `grep -n "AC-02-0" docs/traceability-matrix.md`).

- [ ] **Step 4: Lancer la suite des tests city-guide pour confirmer l’absence de régression**

Run: `npm test -- tests/unit/city-guide tests/unit/home tests/integration/city-guide`
Expected: PASS (les tests supprimés n’existent plus ; les nouveaux passent).

- [ ] **Step 5: Commit**

```bash
git add docs/traceability-matrix.md
git commit -m "chore(home): remove unused CitySearchInput + update traceability"
```

---

## Task 9: Vérification finale

**Files:** —

- [ ] **Step 1: Lancer toute la suite de tests**

Run: `npm test`
Expected: pas de **nouvelle** suite rouge causée par ce travail. (Rappel mémoire : ~10 suites rouges préexistantes liées au drift rebrand/multilingue/DB sont tolérées ; vérifier qu’aucune régression n’a été ajoutée par rapport à l’état initial de la branche.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: pas d’erreur liée aux fichiers créés/modifiés ci-dessus.

- [ ] **Step 3: Vérification manuelle dans l’app**

Lancer l’app (`npm run dev`) et ouvrir `http://localhost:3000/` (sans logement actif) :
- Le titre + le sélecteur s’affichent.
- Choisir « Saint-Gervais-les-Bains » → la grille apparaît avec un effet élastique (rebond), photos pour `boulangerie`/`rando`, fallback pour `mobilite`/`location-de-ski`.
- Cliquer une carte → navigue vers `/guide/saint-gervais-les-bains/<slug>`.
- Vérifier qu’un QR logement actif affiche toujours la home guest inchangée.

- [ ] **Step 4: Commit final éventuel (ajustements visuels)**

```bash
git add -A
git commit -m "polish(home): visual adjustments after manual verification"
```

---

## Notes d’implémentation

- **framer-motion en jsdom** : déjà utilisé par `PoiCard`/`WeatherWidget` (tests verts) → pas de polyfill `matchMedia` requis. Le test reduced-motion mocke `useReducedMotion`.
- **next/image** : non mocké dans le repo (next/jest le gère) → assertions via `getByAltText`.
- **next/link** : mocké en `<a>` dans chaque test (pattern repris de `public-home.lodging-home.test.tsx`).
- **Photos lourdes (~1 Mo)** : compression PNG hors périmètre ; à envisager ensuite.
