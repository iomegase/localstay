# Home logement — grille bento (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire en sorte que la home en mode logement (`/`, onglet « Bienvenue » après scan QR) affiche le même design que la landing anonyme : grand titre + grille bento des catégories de la ville du logement, sans sélecteur de ville ni bloc hôte.

**Architecture:** On extrait la grille bento (aujourd'hui interne à `CityCategoryExplorer`) dans un composant client réutilisable `CategoryBentoGrid`. La landing anonyme continue de l'alimenter via son sélecteur ; la home logement l'alimente directement avec les catégories chargées côté serveur par `getCityGuide`.

**Tech Stack:** Next.js (App Router, React Server Components), TypeScript, Tailwind, framer-motion, Jest + Testing Library.

## Global Constraints

- Composant grille : `'use client'` (animations framer-motion).
- Type des catégories : `CategorySummary` de `@/features/city-guide/types` (`{ id, name, slug, icon, sort_order, poi_count }`).
- Liens catégorie : `/guide/{citySlug}/{categorySlug}`, suffixés `?lodging={lodgingId}` (encodé) quand un `lodgingId` est présent.
- Carte large : la carte d'index `0` (puis tout index `% 4 === 0`) prend `col-span-2`.
- Carte « Nos favoris » : insérée immédiatement après la catégorie de slug `rando` uniquement.
- Aucune régression visuelle sur la landing anonyme (`AnonymousLanding`).

---

### Task 1: Extraire `CategoryBentoGrid` et refactorer `CityCategoryExplorer`

**Files:**
- Create: `src/features/city-guide/components/CategoryBentoGrid.tsx`
- Modify: `src/features/city-guide/components/CityCategoryExplorer.tsx`
- Test: `tests/unit/home.category-bento-grid.test.tsx`

**Interfaces:**
- Consumes: `CategorySummary` (`@/features/city-guide/types`), `CategoryIcon` (`@/features/city-guide/lib/category-icon`), `getCategoryImage` / `getFallbackGradient` (`@/features/city-guide/lib/category-images`).
- Produces: `export function CategoryBentoGrid(props: { categories: CategorySummary[]; citySlug: string; lodgingId?: string | null }): JSX.Element` from `@/features/city-guide/components/CategoryBentoGrid`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/home.category-bento-grid.test.tsx`:

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { CategoryBentoGrid } from '@/features/city-guide/components/CategoryBentoGrid'

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

const CATEGORIES = [
  { id: '1', name: 'Boulangerie', slug: 'boulangerie', icon: 'coffee', sort_order: 0, poi_count: 4 },
  { id: '2', name: 'Rando', slug: 'rando', icon: 'mountain', sort_order: 1, poi_count: 3 },
  { id: '3', name: 'Dîner', slug: 'diner', icon: 'utensils', sort_order: 2, poi_count: 5 },
]

describe('CategoryBentoGrid', () => {
  it('renders one card per category', () => {
    render(<CategoryBentoGrid categories={CATEGORIES} citySlug="saint-gervais-les-bains" />)
    expect(screen.getByText('Boulangerie')).toBeInTheDocument()
    expect(screen.getByText('Dîner')).toBeInTheDocument()
  })

  it('links each card to its guide category route', () => {
    render(<CategoryBentoGrid categories={CATEGORIES} citySlug="saint-gervais-les-bains" />)
    expect(screen.getByText('Boulangerie').closest('a')).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/boulangerie',
    )
  })

  it('inserts the Nos favoris card after the rando category', () => {
    render(<CategoryBentoGrid categories={CATEGORIES} citySlug="saint-gervais-les-bains" />)
    expect(screen.getByText('Nos favoris')).toBeInTheDocument()
  })

  it('propagates the lodging id into category links', () => {
    render(
      <CategoryBentoGrid
        categories={CATEGORIES}
        citySlug="saint-gervais-les-bains"
        lodgingId="lodge-1"
      />,
    )
    expect(screen.getByText('Boulangerie').closest('a')).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/boulangerie?lodging=lodge-1',
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/home.category-bento-grid.test.tsx`
Expected: FAIL — `Cannot find module '@/features/city-guide/components/CategoryBentoGrid'`.

- [ ] **Step 3: Create `CategoryBentoGrid.tsx`**

Create `src/features/city-guide/components/CategoryBentoGrid.tsx` (the card components are moved verbatim from `CityCategoryExplorer`):

```tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import type { CategorySummary } from '@/features/city-guide/types'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import {
  getCategoryImage,
  getFallbackGradient,
} from '@/features/city-guide/lib/category-images'

const spring = { type: 'spring' as const, stiffness: 260, damping: 13 }

// Cadrage de l'image par slug (object-position). Défaut : object-center.
const CARD_IMAGE_POSITION: Record<string, string> = {
  culture: 'object-cover',
}

interface CategoryBentoGridProps {
  categories: CategorySummary[]
  citySlug: string
  lodgingId?: string | null
}

export function CategoryBentoGrid({ categories, citySlug, lodgingId }: CategoryBentoGridProps) {
  const reduce = useReducedMotion()

  function categoryHref(catSlug: string) {
    const base = `/guide/${citySlug}/${catSlug}`
    return lodgingId ? `${base}?lodging=${encodeURIComponent(lodgingId)}` : base
  }

  return (
    <motion.div
      key={citySlug}
      className="mt-6 grid grid-cols-2 gap-3"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.07 } } }}
    >
      {categories.flatMap((cat, index) => {
        const card = (
          <CategoryBentoCard
            key={cat.id}
            category={cat}
            href={categoryHref(cat.slug)}
            wide={index % 4 === 0}
            reduce={!!reduce}
          />
        )
        // Carte « Nos favoris » insérée à droite de Rando (logique à venir).
        if (cat.slug === 'rando') {
          return [card, <FavoritesCard key="nos-favoris" reduce={!!reduce} />]
        }
        return [card]
      })}
    </motion.div>
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
  const objectPosition = CARD_IMAGE_POSITION[category.slug] ?? 'object-center'

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
        className={`relative flex w-full items-end overflow-hidden rounded-3xl shadow-md ${
          wide ? 'aspect-[382/185]' : 'aspect-square'
        }`}
      >
        {image ? (
          <>
            <Image
              src={image}
              alt={category.name}
              fill
              unoptimized
              sizes="(max-width: 430px) 50vw, 215px"
              className={`object-cover ${objectPosition}`}
            />
            <span className="relative z-10 m-3 rounded-md bg-white/90 px-2 py-1 text-xs font-bold uppercase tracking-wide text-charcoal">
              {category.name}
            </span>
          </>
        ) : (
          <div
            className={`flex h-full w-full flex-col justify-between bg-gradient-to-br ${getFallbackGradient(category.slug)} p-3 text-white`}
          >
            <CategoryIcon iconSlug={category.icon} className="h-7 w-7" />
            <span className="text-xs font-bold uppercase tracking-wide">{category.name}</span>
          </div>
        )}
      </Link>
    </motion.div>
  )
}

function FavoritesCard({ reduce }: { reduce: boolean }) {
  // TODO(favoris): brancher la logique de récupération des favoris admin.
  // Pour l'instant la carte n'est pas navigante (pas de lien).
  function handleClick() {
    // À implémenter : ouvrir / charger les favoris.
  }

  return (
    <motion.div
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.85 },
        show: reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, transition: spring },
      }}
      whileHover={reduce ? undefined : { scale: 1.04 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className="col-span-1"
    >
      <button
        type="button"
        onClick={handleClick}
        className="relative flex aspect-square w-full items-end overflow-hidden rounded-3xl shadow-md"
      >
        <Image
          src="/home/nos-favoris.png"
          alt="Nos favoris"
          fill
          unoptimized
          sizes="(max-width: 430px) 50vw, 215px"
          className="object-cover"
        />
        <span className="relative z-10 m-3 rounded-md bg-white/90 px-2 py-1 text-xs font-bold uppercase tracking-wide text-charcoal">
          Nos favoris
        </span>
      </button>
    </motion.div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/unit/home.category-bento-grid.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Refactor `CityCategoryExplorer` to use `CategoryBentoGrid`**

In `src/features/city-guide/components/CityCategoryExplorer.tsx`:

a) Remove the now-extracted card components `CategoryBentoCard` and `FavoritesCard` (their whole function definitions at the bottom of the file).

b) Remove the module-level `spring` constant and `CARD_IMAGE_POSITION` constant (moved into `CategoryBentoGrid`).

c) Remove now-unused imports: `Image` (from `next/image`), `getCategoryImage`, `getFallbackGradient` (from `category-images`). Keep `CategoryIcon`? It is no longer used in the explorer after extraction — remove its import too. Keep `motion`, `AnimatePresence`, `useReducedMotion` (still used by the dropdown), `ChevronDown`, `Link`, `useRef`, `useState`, `useSearchParams`, `t`, the `CategorySummary` type.

d) Add the import:

```tsx
import { CategoryBentoGrid } from '@/features/city-guide/components/CategoryBentoGrid'
```

e) Replace the grid render block (the `{status === 'idle' && categories.length > 0 && ( <motion.div ...grid...> ... </motion.div> )}` block) with:

```tsx
{status === 'idle' && selected && categories.length > 0 && (
  <CategoryBentoGrid categories={categories} citySlug={selected.slug} lodgingId={lodgingId} />
)}
```

(`lodgingId` here is the existing `searchParams.get('lodging')` value — `string | null`, matching the prop type.)

- [ ] **Step 6: Run the affected test suites to verify no regression**

Run: `npx jest tests/unit/home.city-category-explorer.test.tsx tests/unit/home.city-category-explorer.lodging.test.tsx tests/unit/home.city-category-explorer.states.test.tsx tests/unit/home.category-bento-grid.test.tsx`
Expected: all suites PASS (the explorer still renders categories `Boulangerie` / `Mobilité` and links to `/guide/saint-gervais-les-bains/boulangerie` exactly as before).

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (confirms removed imports/constants are not referenced anywhere).

- [ ] **Step 8: Commit**

```bash
git add src/features/city-guide/components/CategoryBentoGrid.tsx \
        src/features/city-guide/components/CityCategoryExplorer.tsx \
        tests/unit/home.category-bento-grid.test.tsx
git commit -m "refactor(city-guide): extract reusable CategoryBentoGrid

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Rendre la home logement comme la landing (titre + grille bento)

**Files:**
- Modify: `src/app/(public)/page.tsx`
- Test: `tests/unit/home.lodging-bento.test.tsx`

**Interfaces:**
- Consumes: `CategoryBentoGrid` (Task 1), `getCityGuide(slug, { lodgingId }): Promise<CityGuide | null>` (`@/features/city-guide/queries/cities`), `getActiveLodgingContext()` (`@/features/public-menu/lib/lodging-mode`), `t` (`@/shared/lib/i18n`).
- Produces: `export async function LodgingHome(props: { citySlug: string; lodgingId: string }): Promise<JSX.Element>` (exported so it can be tested in isolation).

- [ ] **Step 1: Write the failing test**

Create `tests/unit/home.lodging-bento.test.tsx`:

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { LodgingHome } from '@/app/(public)/page'

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

jest.mock('@/features/city-guide/queries/cities', () => ({
  getCityGuide: jest.fn(),
}))

import { getCityGuide } from '@/features/city-guide/queries/cities'

const CATEGORIES = [
  { id: '1', name: 'Boulangerie', slug: 'boulangerie', icon: 'coffee', sort_order: 0, poi_count: 4 },
  { id: '2', name: 'Rando', slug: 'rando', icon: 'mountain', sort_order: 1, poi_count: 3 },
]

describe('LodgingHome', () => {
  beforeEach(() => {
    ;(getCityGuide as jest.Mock).mockResolvedValue({
      city: { id: 'c1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains', postal_code: '74170', department: null },
      categories: CATEGORIES,
      welcome_message: null,
    })
  })

  afterEach(() => jest.clearAllMocks())

  it('renders the landing-style category bento for the lodging city', async () => {
    const ui = await LodgingHome({ citySlug: 'saint-gervais-les-bains', lodgingId: 'lodge-1' })
    render(ui)

    expect(getCityGuide).toHaveBeenCalledWith('saint-gervais-les-bains', { lodgingId: 'lodge-1' })
    expect(screen.getByText('Boulangerie').closest('a')).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/boulangerie?lodging=lodge-1',
    )
  })

  it('does not render the old host hero block', async () => {
    const ui = await LodgingHome({ citySlug: 'saint-gervais-les-bains', lodgingId: 'lodge-1' })
    render(ui)

    expect(screen.queryByText('Votre séjour')).not.toBeInTheDocument()
    expect(screen.queryByText('Découvrir le guide')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/home.lodging-bento.test.tsx`
Expected: FAIL — either `LodgingHome` is not exported, or the old hero text `Votre séjour` is still rendered.

- [ ] **Step 3: Rewrite the lodging branch and `LodgingHome` in `page.tsx`**

In `src/app/(public)/page.tsx`:

a) Add imports at the top:

```tsx
import { getCityGuide } from '@/features/city-guide/queries/cities'
import { CategoryBentoGrid } from '@/features/city-guide/components/CategoryBentoGrid'
```

b) Remove now-unused imports: `Image` (from `next/image`) and `prisma` (from `@/shared/lib/prisma`) — both were only used by the old host hero / customization query.

c) Replace the `if (lodgingContext) { ... }` block inside `HomePage` (which currently queries `lodgingCustomization` and renders `<LodgingHome ... cover/welcome/... />`) with:

```tsx
  if (lodgingContext) {
    return (
      <LodgingHome
        citySlug={lodgingContext.citySlug}
        lodgingId={lodgingContext.lodgingId}
      />
    )
  }
```

d) Replace the entire existing `LodgingHome` function with the export below, and **delete** the now-unused `ShortcutCard` function, the `BentoTone` type, and the `LodgingBottomBar` function:

```tsx
export async function LodgingHome({
  citySlug,
  lodgingId,
}: {
  citySlug: string
  lodgingId: string
}) {
  const guide = await getCityGuide(citySlug, { lodgingId })
  const categories = guide?.categories ?? []

  return (
    <AppShell>
      <BrandMotionStyles />

      <main className="relative z-10 flex-1 px-6 pb-28 pt-10">
        <FloatingAura className="left-[-90px] top-24 h-64 w-64 bg-[#007AFF]/18" />
        <FloatingAura className="right-[-110px] top-20 h-72 w-72 bg-[#AF52DE]/16 delay-500" />

        <h1 className="max-w-[330px] text-6xl font-semibold leading-[0.92] tracking-[-0.06em] text-charcoal">
          {t('home.title')}
        </h1>

        <p className="mt-8 max-w-sm text-[12px] leading-relaxed text-[#6E6E73]">
          {t('home.intro')}
        </p>

        <div className="mt-8">
          {categories.length > 0 ? (
            <CategoryBentoGrid
              categories={categories}
              citySlug={citySlug}
              lodgingId={lodgingId}
            />
          ) : (
            <p className="mt-6 text-sm text-gray-500">{t('home.empty')}</p>
          )}
        </div>
      </main>
    </AppShell>
  )
}
```

Note: `AppShell`, `FloatingAura`, `BrandMotionStyles`, and `t` are already defined/imported in this file and stay unchanged. `AnonymousLanding` stays unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/unit/home.lodging-bento.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (confirms `Image`, `prisma`, `ShortcutCard`, `BentoTone`, `LodgingBottomBar` are fully removed and unreferenced).

- [ ] **Step 6: Run the home-related suites for regression**

Run: `npx jest tests/unit/home.category-bento-grid.test.tsx tests/unit/home.lodging-bento.test.tsx tests/unit/home.city-category-explorer.test.tsx`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/(public)/page.tsx tests/unit/home.lodging-bento.test.tsx
git commit -m "feat(home): lodging home mirrors anonymous landing bento grid

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Grand titre + intro identiques à la landing → Task 2 Step 3 (`t('home.title')` / `t('home.intro')`). ✅
- Grille bento des catégories du logement → Task 1 (`CategoryBentoGrid`) + Task 2 (rendu). ✅
- Pas de sélecteur de ville / pas de bloc hôte / pas de `LodgingBottomBar` → Task 2 Step 3 (suppression hero, `ShortcutCard`, `LodgingBottomBar`, requête `lodgingCustomization`). ✅
- 1ʳᵉ carte large + carte « Nos favoris » après `rando` → Task 1 (logique conservée verbatim). ✅
- Propagation `?lodging=` → Task 1 (`categoryHref`) + test Task 2. ✅
- Ville sans catégorie → état vide `t('home.empty')` → Task 2 Step 3. ✅
- Non-régression landing anonyme → Task 1 Step 6 (suites explorer). ✅

**Placeholder scan:** Aucun TBD/TODO d'implémentation (le `TODO(favoris)` est un commentaire métier existant, déplacé tel quel). Tout le code est fourni intégralement.

**Type consistency:** `CategoryBentoGrid` prend `{ categories: CategorySummary[]; citySlug: string; lodgingId?: string | null }` partout (Tasks 1 & 2). `getCityGuide(slug, { lodgingId })` correspond à la signature existante. `LodgingHome` prend `{ citySlug: string; lodgingId: string }` dans la page et le test.
