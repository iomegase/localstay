# Refonte bento « Nos recommandations » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la liste de la page guest `/(public)/nos-recommandations` par une mise en page bento éditoriale fidèle au mockup, pilotée par les POIs en vedette du logement.

**Architecture:** La page reste un Server Component qui lit le contexte séjour + Prisma, partitionne les POIs (ville du logement / autres villes), calcule des stats, puis compose un Hero et des sections bento. La logique d'assignation des variantes de carte est isolée dans une fonction pure testée. Les composants de présentation sont co-localisés sous `_components/`.

**Tech Stack:** Next.js 16 (App Router, RSC), React, Tailwind CSS 3 (config-based), lucide-react, Jest + Testing Library.

## Global Constraints

- Scope **uniquement** `nos-recommandations` (déjà `redirect('/')` hors mode séjour). Aucune autre page modifiée.
- Tokens Tailwind ajoutés de façon **additive** : `cream #f7f3ed`, `sand #ebe2d5`, `boxShadow.soft 0 18px 60px rgba(36,34,32,0.08)`. Garder `charcoal`/`gold`/`Playfair Display` existants.
- Photos = **`poi.photos[0]`** uniquement. Aucune image stock externe. POI sans photo → variante texte.
- Liens des cartes = **`/guide/{citySlug}/{categorySlug}/{poiSlug}` SANS `?lodging=`**, où `citySlug = poi.city?.slug ?? lodgingContext.citySlug` (résolution défensive).
- Titre Hero (texte exact, testé) = **« Les recommandations de {ownerName} »** (fallback « de votre hôte »).
- `owner_note` rendu **conditionnellement** avec `data-testid="owner-recommendation-comment"` (pas d'espace réservé si absent).
- Section autres villes : texte **« À découvrir ailleurs »** présent + sous-titre **« À {cityName} »**.
- Empty state conservé : texte « …n'a pas encore sélectionné… » + lien **« Voir le guide complet »** → `/guide/{citySlug}`.
- Composant `default function NosRecommendationsPage()` **sans argument** (les tests l'appellent ainsi).

---

### Task 1: Tokens Tailwind (cream, sand, shadow-soft)

**Files:**
- Modify: `tailwind.config.ts` (bloc `theme.extend.colors` et `theme.extend`)

**Interfaces:**
- Produces: classes utilitaires `bg-cream`, `bg-sand`, `text-cream`, `shadow-soft` disponibles globalement.

> Fichier de configuration → exception TDD (pas de test unitaire). Vérification par typecheck + grep.

- [ ] **Step 1: Ajouter `cream` et `sand` dans `colors`**

Dans `tailwind.config.ts`, sous `colors:` après la ligne `forest: '#455E4C',`, ajouter :

```ts
        // Tokens éditoriaux (page recommandations bento)
        cream: '#f7f3ed',
        sand: '#ebe2d5',
```

- [ ] **Step 2: Ajouter `boxShadow.soft` dans `theme.extend`**

Toujours dans `theme.extend` (au même niveau que `fontFamily`), ajouter :

```ts
      boxShadow: {
        soft: '0 18px 60px rgba(36, 34, 32, 0.08)',
      },
```

- [ ] **Step 3: Vérifier le typecheck**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep tailwind.config`
Expected: aucune sortie (pas d'erreur).

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(reco): ajout des tokens Tailwind cream, sand et shadow-soft"
```

---

### Task 2: Fonction pure `assignVariants` + types partagés

**Files:**
- Create: `src/app/(public)/nos-recommandations/_components/variants.ts`
- Test: `tests/unit/nos-recommandations.variants.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type RecRow = {
    poi_id: string
    owner_note: string | null
    poi: {
      id: string
      name: string
      slug: string
      description: string | null
      photos: string[]
      category: { name: string; slug: string }
      city?: { slug: string; name: string } | null
    }
  }
  export type CardVariant = 'bigImage' | 'image' | 'white' | 'sand' | 'note'
  export type AssignedCard = { row: RecRow; variant: CardVariant }
  export function assignVariants(rows: RecRow[]): AssignedCard[]
  export function hasPhoto(row: RecRow): boolean
  export function hasNote(row: RecRow): boolean
  ```
- Règle déterministe :
  - index 0 : `hasPhoto ? 'bigImage' : hasNote ? 'note' : 'white'`
  - index i≥1 : base = `['image','white','sand'][(i-1) % 3]` ; si base==='image' → `hasPhoto ? 'image' : hasNote ? 'note' : 'white'` ; sinon base inchangé.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/unit/nos-recommandations.variants.test.ts` :

```ts
import { assignVariants, type RecRow } from '@/app/(public)/nos-recommandations/_components/variants'

function row(id: string, opts: { photo?: boolean; note?: boolean } = {}): RecRow {
  return {
    poi_id: id,
    owner_note: opts.note ? 'Une note' : null,
    poi: {
      id,
      name: `POI ${id}`,
      slug: id,
      description: null,
      photos: opts.photo ? ['https://cdn.test/p.jpg'] : [],
      category: { name: 'Restaurants', slug: 'restaurants' },
      city: { slug: 'saint-gervais', name: 'Saint-Gervais' },
    },
  }
}

describe('assignVariants', () => {
  it('returns bigImage for a single photo POI', () => {
    expect(assignVariants([row('a', { photo: true })]).map(c => c.variant)).toEqual(['bigImage'])
  })

  it('returns note for a single photoless POI that has an owner note', () => {
    expect(assignVariants([row('a', { note: true })]).map(c => c.variant)).toEqual(['note'])
  })

  it('returns white for a single photoless, noteless POI', () => {
    expect(assignVariants([row('a')]).map(c => c.variant)).toEqual(['white'])
  })

  it('cycles bigImage,image,white,sand for four photo POIs', () => {
    const rows = ['a', 'b', 'c', 'd'].map(id => row(id, { photo: true }))
    expect(assignVariants(rows).map(c => c.variant)).toEqual(['bigImage', 'image', 'white', 'sand'])
  })

  it('replaces an image slot with note when the POI has no photo but a note', () => {
    const rows = [row('a', { photo: true }), row('b', { note: true })]
    expect(assignVariants(rows).map(c => c.variant)).toEqual(['bigImage', 'note'])
  })

  it('replaces an image slot with white when the POI has neither photo nor note', () => {
    const rows = [row('a', { photo: true }), row('b')]
    expect(assignVariants(rows).map(c => c.variant)).toEqual(['bigImage', 'white'])
  })
})
```

- [ ] **Step 2: Lancer le test et vérifier l'échec**

Run: `npx jest tests/unit/nos-recommandations.variants.test.ts`
Expected: FAIL — `Cannot find module '.../variants'`.

- [ ] **Step 3: Implémenter `variants.ts`**

```ts
export type RecRow = {
  poi_id: string
  owner_note: string | null
  poi: {
    id: string
    name: string
    slug: string
    description: string | null
    photos: string[]
    category: { name: string; slug: string }
    city?: { slug: string; name: string } | null
  }
}

export type CardVariant = 'bigImage' | 'image' | 'white' | 'sand' | 'note'
export type AssignedCard = { row: RecRow; variant: CardVariant }

export function hasPhoto(row: RecRow): boolean {
  return Boolean(row.poi.photos?.[0])
}

export function hasNote(row: RecRow): boolean {
  return Boolean(row.owner_note && row.owner_note.trim().length > 0)
}

const TEXT_CYCLE = ['image', 'white', 'sand'] as const

export function assignVariants(rows: RecRow[]): AssignedCard[] {
  return rows.map((row, i) => {
    if (i === 0) {
      const variant: CardVariant = hasPhoto(row) ? 'bigImage' : hasNote(row) ? 'note' : 'white'
      return { row, variant }
    }
    const base = TEXT_CYCLE[(i - 1) % TEXT_CYCLE.length]
    if (base === 'image') {
      const variant: CardVariant = hasPhoto(row) ? 'image' : hasNote(row) ? 'note' : 'white'
      return { row, variant }
    }
    return { row, variant: base }
  })
}
```

- [ ] **Step 4: Lancer le test et vérifier le succès**

Run: `npx jest tests/unit/nos-recommandations.variants.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add tests/unit/nos-recommandations.variants.test.ts "src/app/(public)/nos-recommandations/_components/variants.ts"
git commit -m "feat(reco): fonction pure assignVariants pour le bento"
```

---

### Task 3: Composant `RecommendationCard`

**Files:**
- Create: `src/app/(public)/nos-recommandations/_components/RecommendationCard.tsx`
- Test: `tests/unit/nos-recommandations.card.test.tsx`

**Interfaces:**
- Consumes: `RecRow`, `CardVariant` (Task 2).
- Produces:
  ```ts
  export function RecommendationCard(props: {
    row: RecRow
    variant: CardVariant
    fallbackCitySlug: string
  }): JSX.Element
  ```
- href = `/guide/${row.poi.city?.slug ?? fallbackCitySlug}/${row.poi.category.slug}/${row.poi.slug}`.
- `owner_note` rendu seulement si présent, avec `data-testid="owner-recommendation-comment"`.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/unit/nos-recommandations.card.test.tsx` :

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { RecommendationCard } from '@/app/(public)/nos-recommandations/_components/RecommendationCard'
import type { RecRow } from '@/app/(public)/nos-recommandations/_components/variants'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

function makeRow(over: Partial<RecRow['poi']> = {}, note: string | null = null): RecRow {
  return {
    poi_id: 'p1',
    owner_note: note,
    poi: {
      id: 'p1',
      name: 'Bistrot du Centre',
      slug: 'bistrot-du-centre',
      description: 'Cuisine locale.',
      photos: ['https://cdn.test/x.jpg'],
      category: { name: 'Restaurants', slug: 'restaurants' },
      city: null,
      ...over,
    },
  }
}

describe('RecommendationCard', () => {
  it('links to the POI using the fallback city slug when poi.city is missing', () => {
    render(<RecommendationCard row={makeRow()} variant="bigImage" fallbackCitySlug="saint-gervais" />)
    expect(screen.getByRole('link', { name: /Bistrot du Centre/i })).toHaveAttribute(
      'href',
      '/guide/saint-gervais/restaurants/bistrot-du-centre',
    )
  })

  it('uses poi.city.slug when present', () => {
    render(
      <RecommendationCard
        row={makeRow({ city: { slug: 'annecy', name: 'Annecy' } })}
        variant="white"
        fallbackCitySlug="saint-gervais"
      />,
    )
    expect(screen.getByRole('link', { name: /Bistrot du Centre/i })).toHaveAttribute(
      'href',
      '/guide/annecy/restaurants/bistrot-du-centre',
    )
  })

  it('renders the owner note with its test id when present', () => {
    render(<RecommendationCard row={makeRow({}, 'Notre coup de cœur.')} variant="bigImage" fallbackCitySlug="x" />)
    expect(screen.getByTestId('owner-recommendation-comment')).toHaveTextContent('Notre coup de cœur.')
  })

  it('does not render the owner note element when absent', () => {
    render(<RecommendationCard row={makeRow()} variant="white" fallbackCitySlug="x" />)
    expect(screen.queryByTestId('owner-recommendation-comment')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Lancer le test et vérifier l'échec**

Run: `npx jest tests/unit/nos-recommandations.card.test.tsx`
Expected: FAIL — module `RecommendationCard` introuvable.

- [ ] **Step 3: Implémenter `RecommendationCard.tsx`**

```tsx
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import type { CardVariant, RecRow } from './variants'

type Props = {
  row: RecRow
  variant: CardVariant
  fallbackCitySlug: string
}

export function RecommendationCard({ row, variant, fallbackCitySlug }: Props) {
  const { poi, owner_note } = row
  const citySlug = poi.city?.slug ?? fallbackCitySlug
  const href = `/guide/${citySlug}/${poi.category.slug}/${poi.slug}`
  const photo = poi.photos?.[0] ?? null

  const note = owner_note ? (
    <p
      data-testid="owner-recommendation-comment"
      className="text-sm font-medium leading-relaxed"
    >
      {owner_note}
    </p>
  ) : null

  if (variant === 'bigImage') {
    return (
      <Link
        href={href}
        className="group relative col-span-2 min-h-[360px] overflow-hidden rounded-[2rem] bg-charcoal shadow-soft"
      >
        {photo && (
          <img
            src={photo}
            alt={poi.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative flex h-full min-h-[360px] flex-col justify-end p-5 text-white">
          <div className="mb-3 w-fit rounded-full bg-white/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.25em] backdrop-blur">
            {poi.category.name}
          </div>
          <h3 className="font-serif text-3xl italic leading-none">{poi.name}</h3>
          {note && <div className="mt-4 max-w-lg text-white/90">{note}</div>}
          {poi.description && (
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/65 line-clamp-2">{poi.description}</p>
          )}
          <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
            Voir le lieu
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    )
  }

  if (variant === 'image') {
    return (
      <Link
        href={href}
        className="group relative min-h-[180px] overflow-hidden rounded-[1.75rem] bg-charcoal shadow-soft"
      >
        {photo && (
          <img
            src={photo}
            alt={poi.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="relative flex h-full min-h-[180px] flex-col justify-end p-4 text-white">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.25em] text-gold">{poi.category.name}</p>
          <h3 className="font-serif text-2xl italic leading-tight">{poi.name}</h3>
          {poi.description && (
            <p className="mt-2 text-xs leading-5 text-white/75 line-clamp-2">{poi.description}</p>
          )}
        </div>
      </Link>
    )
  }

  if (variant === 'note') {
    return (
      <Link
        href={href}
        className="group relative min-h-[180px] overflow-hidden rounded-[1.75rem] bg-charcoal p-4 text-white shadow-soft"
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-gold">Note de l’hôte</p>
            {note ? (
              <div className="mt-3 font-serif text-xl italic leading-tight">{owner_note}</div>
            ) : (
              <h3 className="mt-3 font-serif text-xl italic leading-tight">{poi.name}</h3>
            )}
          </div>
          <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/70">
            {poi.name}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    )
  }

  // variant 'white' | 'sand'
  const bg = variant === 'sand' ? 'bg-sand' : 'bg-white'
  return (
    <Link
      href={href}
      className={`group relative min-h-[180px] overflow-hidden rounded-[1.75rem] ${bg} p-4 shadow-soft transition hover:-translate-y-0.5`}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-gold">{poi.category.name}</p>
          <h3 className="mt-2 font-serif text-xl italic leading-tight text-charcoal">{poi.name}</h3>
          {note && <div className="mt-2 text-charcoal">{note}</div>}
          {poi.description && (
            <p className="mt-2 text-xs leading-5 text-gray-500 line-clamp-3">{poi.description}</p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Voir</span>
          <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-1 group-hover:text-charcoal" />
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Lancer le test et vérifier le succès**

Run: `npx jest tests/unit/nos-recommandations.card.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add tests/unit/nos-recommandations.card.test.tsx "src/app/(public)/nos-recommandations/_components/RecommendationCard.tsx"
git commit -m "feat(reco): composant RecommendationCard et ses variantes"
```

---

### Task 4: Composant `Hero`

**Files:**
- Create: `src/app/(public)/nos-recommandations/_components/Hero.tsx`
- Test: `tests/unit/nos-recommandations.hero.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export function Hero(props: {
    ownerName: string | null
    lodgingName: string
    cityName: string
    citySlug: string
    stats: { places: number; categories: number; cities: number }
  }): JSX.Element
  ```
- Titre = `ownerName ? \`Les recommandations de ${ownerName}\` : 'Les recommandations de votre hôte'`.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/unit/nos-recommandations.hero.test.tsx` :

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { Hero } from '@/app/(public)/nos-recommandations/_components/Hero'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('Hero', () => {
  it('renders the owner title, lodging info and stats', () => {
    render(
      <Hero
        ownerName="Alice Martin"
        lodgingName="Chalet Rémy"
        cityName="Saint-Gervais-les-Bains"
        citySlug="saint-gervais"
        stats={{ places: 12, categories: 4, cities: 2 }}
      />,
    )
    expect(screen.getByText('Les recommandations de Alice Martin')).toBeInTheDocument()
    expect(screen.getByText('Chalet Rémy')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /guide complet/i })).toHaveAttribute('href', '/guide/saint-gervais')
  })

  it('falls back to a generic title without an owner name', () => {
    render(
      <Hero
        ownerName={null}
        lodgingName="Chalet Rémy"
        cityName="Saint-Gervais-les-Bains"
        citySlug="saint-gervais"
        stats={{ places: 0, categories: 0, cities: 0 }}
      />,
    )
    expect(screen.getByText('Les recommandations de votre hôte')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Lancer le test et vérifier l'échec**

Run: `npx jest tests/unit/nos-recommandations.hero.test.tsx`
Expected: FAIL — module `Hero` introuvable.

- [ ] **Step 3: Implémenter `Hero.tsx`**

```tsx
import Link from 'next/link'

type Props = {
  ownerName: string | null
  lodgingName: string
  cityName: string
  citySlug: string
  stats: { places: number; categories: number; cities: number }
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-white/50">{label}</p>
    </div>
  )
}

export function Hero({ ownerName, lodgingName, cityName, citySlug, stats }: Props) {
  const title = ownerName ? `Les recommandations de ${ownerName}` : 'Les recommandations de votre hôte'
  const intro = ownerName
    ? `Une sélection personnelle de ${ownerName} pour profiter de ${cityName}.`
    : `Une sélection personnelle de votre hôte pour profiter de ${cityName}.`

  return (
    <section className="mb-8 overflow-hidden rounded-[2rem] bg-charcoal p-5 text-white shadow-soft">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/75 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        Recommandations de l’hôte
      </div>

      <h1 className="font-serif text-4xl italic leading-[1.05]">{title}</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">{intro}</p>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">Votre logement</p>
        <h2 className="mt-2 font-serif text-2xl italic">{lodgingName}</h2>
        <p className="mt-1 text-sm text-white/60">{cityName}</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat value={stats.places} label="lieux" />
          <Stat value={stats.categories} label="catégories" />
          <Stat value={stats.cities} label="villes" />
        </div>
      </div>

      <Link
        href={`/guide/${citySlug}`}
        className="mt-5 inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/80 transition hover:border-gold hover:text-gold"
      >
        Guide complet
      </Link>
    </section>
  )
}
```

- [ ] **Step 4: Lancer le test et vérifier le succès**

Run: `npx jest tests/unit/nos-recommandations.hero.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add tests/unit/nos-recommandations.hero.test.tsx "src/app/(public)/nos-recommandations/_components/Hero.tsx"
git commit -m "feat(reco): composant Hero avec stats du séjour"
```

---

### Task 5: Composant `BentoSection`

**Files:**
- Create: `src/app/(public)/nos-recommandations/_components/BentoSection.tsx`
- Test: `tests/unit/nos-recommandations.bento-section.test.tsx`

**Interfaces:**
- Consumes: `RecRow`, `assignVariants` (Task 2), `RecommendationCard` (Task 3).
- Produces:
  ```ts
  export function BentoSection(props: {
    title: string
    eyebrow?: string
    rows: RecRow[]
    fallbackCitySlug: string
  }): JSX.Element | null
  ```
- Retourne `null` si `rows` est vide. Rend l'eyebrow (si fourni), le titre serif, puis une grille `grid grid-cols-2 gap-3` de `RecommendationCard` issues de `assignVariants(rows)`.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/unit/nos-recommandations.bento-section.test.tsx` :

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { BentoSection } from '@/app/(public)/nos-recommandations/_components/BentoSection'
import type { RecRow } from '@/app/(public)/nos-recommandations/_components/variants'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

function row(id: string, name: string): RecRow {
  return {
    poi_id: id,
    owner_note: null,
    poi: {
      id, name, slug: id, description: null, photos: [],
      category: { name: 'Restaurants', slug: 'restaurants' },
      city: null,
    },
  }
}

describe('BentoSection', () => {
  it('renders the eyebrow, title and a card per row', () => {
    render(
      <BentoSection eyebrow="Sélection principale" title="Restaurants" rows={[row('a', 'Chez A'), row('b', 'Chez B')]} fallbackCitySlug="sg" />,
    )
    expect(screen.getByText('Sélection principale')).toBeInTheDocument()
    expect(screen.getByText('Restaurants')).toBeInTheDocument()
    expect(screen.getByText('Chez A')).toBeInTheDocument()
    expect(screen.getByText('Chez B')).toBeInTheDocument()
  })

  it('returns null when there are no rows', () => {
    const { container } = render(<BentoSection title="Vide" rows={[]} fallbackCitySlug="sg" />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Lancer le test et vérifier l'échec**

Run: `npx jest tests/unit/nos-recommandations.bento-section.test.tsx`
Expected: FAIL — module `BentoSection` introuvable.

- [ ] **Step 3: Implémenter `BentoSection.tsx`**

```tsx
import { assignVariants, type RecRow } from './variants'
import { RecommendationCard } from './RecommendationCard'

type Props = {
  title: string
  eyebrow?: string
  rows: RecRow[]
  fallbackCitySlug: string
}

export function BentoSection({ title, eyebrow, rows, fallbackCitySlug }: Props) {
  if (rows.length === 0) return null
  const cards = assignVariants(rows)

  return (
    <section className="mb-10">
      <div className="mb-4">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
        )}
        <h2 className="mt-1 font-serif text-3xl italic text-charcoal">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ row, variant }) => (
          <RecommendationCard
            key={row.poi.id}
            row={row}
            variant={variant}
            fallbackCitySlug={fallbackCitySlug}
          />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Lancer le test et vérifier le succès**

Run: `npx jest tests/unit/nos-recommandations.bento-section.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add tests/unit/nos-recommandations.bento-section.test.tsx "src/app/(public)/nos-recommandations/_components/BentoSection.tsx"
git commit -m "feat(reco): composant BentoSection"
```

---

### Task 6: Réécriture de `page.tsx` (composition + tests d'intégration verts)

**Files:**
- Modify (réécriture complète): `src/app/(public)/nos-recommandations/page.tsx`
- Test (existants, doivent passer) : `tests/integration/guide-customization.recommendations-page.test.tsx`, `tests/integration/nos-recommandations.cross-city.test.tsx`

**Interfaces:**
- Consumes: `Hero` (Task 4), `BentoSection` (Task 5), `RecRow` (Task 2).
- Produces: `export default async function NosRecommendationsPage(): Promise<JSX.Element>`.

- [ ] **Step 1: Vérifier l'état rouge des tests d'intégration cibles**

Run: `npx jest tests/integration/guide-customization.recommendations-page.test.tsx tests/integration/nos-recommandations.cross-city.test.tsx`
Expected: `guide-customization.recommendations-page` FAIL (2 tests, `Cannot read properties of undefined (reading 'slug')`), `cross-city` PASS. C'est le point de départ ; Task 6 rend les 4 verts.

- [ ] **Step 2: Réécrire `page.tsx`**

Remplacer **tout** le contenu de `src/app/(public)/nos-recommandations/page.tsx` par :

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { prisma } from '@/shared/lib/prisma'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { Hero } from './_components/Hero'
import { BentoSection } from './_components/BentoSection'
import type { RecRow } from './_components/variants'

export default async function NosRecommendationsPage() {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) redirect('/')

  const featuredPois = (await prisma.lodgingFeaturedPoi.findMany({
    where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    select: {
      poi_id: true,
      owner_note: true,
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
    },
  })) as RecRow[]

  // Résolution défensive : un POI sans city rattaché est considéré local.
  const cityOf = (row: RecRow) => row.poi.city?.slug ?? lodgingContext.citySlug

  const localRows = featuredPois.filter(row => cityOf(row) === lodgingContext.citySlug)
  const otherRows = featuredPois.filter(row => cityOf(row) !== lodgingContext.citySlug)
  const grouped = groupByCategory(localRows)
  const otherByCity = groupByCity(otherRows)
  const hasAny = grouped.length > 0 || otherByCity.length > 0

  const stats = {
    places: featuredPois.length,
    categories: new Set(featuredPois.map(r => r.poi.category.slug)).size,
    cities: new Set(featuredPois.map(cityOf)).size,
  }

  return (
    <div className="bg-cream px-4 pt-2">
      <header className="mb-6 flex items-center justify-between pt-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-400">MyStay</p>
          <p className="mt-1 text-xs text-gray-500">Mode séjour activé</p>
        </div>
      </header>

      <Hero
        ownerName={lodgingContext.ownerName}
        lodgingName={lodgingContext.lodgingName}
        cityName={lodgingContext.cityName}
        citySlug={lodgingContext.citySlug}
        stats={stats}
      />

      {!hasAny ? (
        <EmptyState citySlug={lodgingContext.citySlug} />
      ) : (
        <div className="pb-8">
          {grouped.map((group, i) => (
            <BentoSection
              key={group.categorySlug}
              eyebrow={i === 0 ? 'Sélection principale' : group.categoryName}
              title={group.categoryName}
              rows={group.items}
              fallbackCitySlug={lodgingContext.citySlug}
            />
          ))}

          {otherByCity.length > 0 && (
            <div className="mb-2">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
                À découvrir ailleurs
              </p>
              {otherByCity.map(group => (
                <BentoSection
                  key={group.citySlug}
                  title={`À ${group.cityName}`}
                  rows={group.items}
                  fallbackCitySlug={lodgingContext.citySlug}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type Group = { categorySlug: string; categoryName: string; items: RecRow[] }

function groupByCategory(rows: RecRow[]): Group[] {
  const map = new Map<string, Group>()
  for (const row of rows) {
    const slug = row.poi.category.slug
    const existing = map.get(slug)
    if (existing) {
      existing.items.push(row)
    } else {
      map.set(slug, { categorySlug: slug, categoryName: row.poi.category.name, items: [row] })
    }
  }
  return [...map.values()]
}

type CityGroup = { citySlug: string; cityName: string; items: RecRow[] }

function groupByCity(rows: RecRow[]): CityGroup[] {
  const map = new Map<string, CityGroup>()
  for (const row of rows) {
    const slug = row.poi.city?.slug ?? ''
    const name = row.poi.city?.name ?? ''
    const existing = map.get(slug)
    if (existing) {
      existing.items.push(row)
    } else {
      map.set(slug, { citySlug: slug, cityName: name, items: [row] })
    }
  }
  return [...map.values()]
}

function EmptyState({ citySlug }: { citySlug: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-gray-300" />
      <p className="mt-3 text-sm text-gray-500">
        Votre hôte n&apos;a pas encore sélectionné de lieux à vous recommander.
      </p>
      <Link
        href={`/guide/${citySlug}`}
        className="mt-5 inline-flex items-center justify-center rounded-full bg-charcoal px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
      >
        Voir le guide complet
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Lancer les tests d'intégration et vérifier le succès**

Run: `npx jest tests/integration/guide-customization.recommendations-page.test.tsx tests/integration/nos-recommandations.cross-city.test.tsx`
Expected: PASS (4 tests). Note : la 1re section locale a l'eyebrow « Sélection principale » mais son titre reste le nom de catégorie (`Restaurants`), donc `getByText('Restaurants')` passe.

- [ ] **Step 4: Vérifier le typecheck global**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "nos-recommandations" | head`
Expected: aucune sortie.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/nos-recommandations/page.tsx"
git commit -m "feat(reco): page nos-recommandations en bento éditorial"
```

---

### Task 7: Vérification finale & non-régression

**Files:** aucun changement de code (sauf correctifs éventuels).

- [ ] **Step 1: Lancer toute la suite des fichiers touchés**

Run:
```bash
npx jest tests/unit/nos-recommandations.variants.test.ts \
  tests/unit/nos-recommandations.card.test.tsx \
  tests/unit/nos-recommandations.hero.test.tsx \
  tests/unit/nos-recommandations.bento-section.test.tsx \
  tests/integration/guide-customization.recommendations-page.test.tsx \
  tests/integration/nos-recommandations.cross-city.test.tsx
```
Expected: toutes les suites PASS.

- [ ] **Step 2: Lancer le rendu réel (optionnel, manuel)**

Run: `npm run dev` puis ouvrir `/nos-recommandations` en mode séjour (cookie `lodging_id` posé via un scan QR). Vérifier visuellement le Hero, les sections bento, l'empty state.

- [ ] **Step 3: Commit final si correctifs**

```bash
git add -A
git commit -m "test(reco): vérification de la refonte bento"
```

---

## Self-Review

**Spec coverage :**
- Tokens cream/sand/shadow-soft → Task 1. ✓
- Rendu mobile dans shell 430px → grilles `grid-cols-2` (Task 5), pas de breakout. ✓
- Photos `poi.photos[0]` + fallback texte → Task 2 (assignVariants) + Task 3 (cartes). ✓
- Hero titre exact + stats → Task 4 + Task 6. ✓
- Sections par catégorie, eyebrow « Sélection principale » sur la 1re → Task 6. ✓
- « À découvrir ailleurs » + « À {ville} » → Task 6. ✓
- owner_note conditionnel + testid → Task 3. ✓
- Liens sans `?lodging=`, fallback citySlug → Task 3 + Task 6. ✓
- Empty state conservé → Task 6. ✓
- Tests d'intégration existants verts (drift corrigé) → Task 6. ✓

**Placeholder scan :** aucun TBD/TODO ; code complet à chaque étape.

**Type consistency :** `RecRow`, `CardVariant`, `AssignedCard`, `assignVariants`, `hasPhoto`, `hasNote` définis en Task 2 et réutilisés tels quels (Tasks 3, 5, 6). `Hero`/`BentoSection`/`RecommendationCard` signatures cohérentes entre définition et appels. `fallbackCitySlug` nommé identiquement partout.
