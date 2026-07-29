# Guide Featured Bento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recomposer les trois cartes « Nos coups de cœur » du GuideApp en cartes bento illustrées de dimensions identiques, avec scroll horizontal sans scrollbar et priorité à la hero administrée.

**Architecture:** Un résolveur partagé choisit d’abord la première photo réelle ordonnée par l’administration puis le fallback de catégorie uniquement sans galerie. Un composant `GuideFeaturedPoiCard` encapsule le rendu bento plein cadre ; `GuideHome` conserve la sélection des trois premiers POI recommandés et leur navigation interne.

**Tech Stack:** Next.js 16 App Router, React, TypeScript strict, Tailwind CSS, `next/image`, Jest, Testing Library, Playwright.

---

### Task 1: Contrat de sélection de la hero

**Files:**
- Create: `src/features/guide-app/lib/poi-image.ts`
- Create: `tests/unit/guide-app.poi-hero-image.test.ts`
- Modify: `src/features/guide-demo/demo-pois.ts`
- Modify: `tests/unit/public-guide-demo.AC-05-06.data.test.ts`
- Modify: `next.config.mjs`

- [x] **Step 1: Write the failing hero-selection test**

```ts
import { getGuidePoiHeroImage } from '@/features/guide-app/lib/poi-image'

it('prefers the admin-selected real hero over a fallback', () => {
  expect(
    getGuidePoiHeroImage({
      categorySlug: 'diner',
      photos: [
        '/fallback/fallback-restaurant.png',
        'https://example.com/admin-hero.jpg',
        'https://example.com/gallery-2.jpg',
      ],
    }),
  ).toBe('https://example.com/admin-hero.jpg')
})

it('keeps the first real photo selected by the admin', () => {
  expect(
    getGuidePoiHeroImage({
      categorySlug: 'culture',
      photos: [
        'https://example.com/selected.jpg',
        'https://example.com/other.jpg',
      ],
    }),
  ).toBe('https://example.com/selected.jpg')
})

it('uses the category fallback only without a real gallery', () => {
  expect(
    getGuidePoiHeroImage({ categorySlug: 'diner', photos: [] }),
  ).toBe('/fallback/fallback-restaurant.png')
})
```

- [x] **Step 2: Run the unit test and verify RED**

```bash
npm test -- tests/unit/guide-app.poi-hero-image.test.ts --runInBand
```

Expected: FAIL because `poi-image.ts` does not exist.

- [x] **Step 3: Implement the image resolver**

```ts
import { getPoiFallbackImage } from '@/features/categories/lib/poi-fallback-image'

export function getGuidePoiHeroImage({
  categorySlug,
  photos,
}: {
  categorySlug: string
  photos: string[]
}): string {
  const realHero = photos.find(
    photo => photo.trim().length > 0 && !photo.startsWith('/fallback/'),
  )
  if (realHero) return realHero

  const existingFallback = photos.find(photo =>
    photo.startsWith('/fallback/'),
  )
  return (
    existingFallback ??
    getPoiFallbackImage(categorySlug, null) ??
    '/fallback/fallback-culture.png'
  )
}
```

- [x] **Step 4: Replace the three demo fallbacks with admin heroes**

Use these read-only database snapshots, preserving index `0` as the selected
hero:

```ts
// Rond de Carotte
photos: [
  'https://cftqqyqfhlvobtsatxdq.supabase.co/storage/v1/object/public/guide-photos/pois/1782132327133.avif',
  'https://static.wixstatic.com/media/90a441_f2231b6f47ac4f62bf3b744c42cee73b~mv2.jpg/v1/fill/w_283,h_100,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/90a441_f2231b6f47ac4f62bf3b744c42cee73b~mv2.jpg',
]

// Le Relais des Communailles
photos: [
  'https://lerelaisdescommunailles.com/wp-content/uploads/2024/02/7H2A7789-scaled.jpg',
  'https://lerelaisdescommunailles.com/wp-content/uploads/2023/12/7H2A7507-2-scaled.jpg',
]

// Maison forte de Hautetour
photos: [
  'https://static.apidae-tourisme.com/filestore/objets-touristiques/images/60/198/37209660.jpg',
  'https://static.apidae-tourisme.com/filestore/objets-touristiques/images/2/90/30956034.jpg',
]
```

Add `lerelaisdescommunailles.com`, `static.apidae-tourisme.com` and
`static.wixstatic.com` to the existing HTTPS `remotePatterns`.

Replace the obsolete test requiring every demo photo to be a fallback with:

```ts
const featured = demoPois.filter(poi => poi.recommended).slice(0, 3)
expect(featured).toHaveLength(3)
for (const poi of featured) {
  expect(poi.photos[0]).toMatch(/^https:\/\//)
  expect(poi.photos[0]).not.toContain('/fallback/')
}
for (const poi of demoPois) {
  expect(poi.photos[0]).toBeTruthy()
}
```

- [x] **Step 5: Run data and resolver tests and verify GREEN**

```bash
npm test -- tests/unit/guide-app.poi-hero-image.test.ts tests/unit/public-guide-demo.AC-05-06.data.test.ts --runInBand
```

Expected: both suites pass.

### Task 2: Shared featured bento card

**Files:**
- Create: `src/features/guide-app/components/GuideFeaturedPoiCard.tsx`
- Modify: `src/features/guide-app/components/GuideHome.tsx`
- Create: `tests/integration/public-guide-demo.AC-01-01-07.featured-bento.test.tsx`

- [x] **Step 1: Write the failing bento integration test**

```tsx
render(
  <GuideApp mode="demo" lodging={demoLodging} pois={demoPois} />,
)

const carousel = screen.getByTestId('guide-featured-carousel')
expect(carousel).toHaveClass(
  'overflow-x-auto',
  '[scrollbar-width:none]',
  '[&::-webkit-scrollbar]:hidden',
)

const cards = screen.getAllByTestId('guide-featured-card')
expect(cards).toHaveLength(3)
for (const card of cards) {
  expect(card).toHaveClass(
    'h-[156px]',
    'w-[156px]',
    'snap-start',
    'rounded-[24px]',
  )
  expect(card).not.toHaveClass('bg-white')
}

expect(
  decodeURIComponent(
    screen.getByRole('img', { name: 'Rond de Carotte' }).getAttribute('src') ??
      '',
  ),
).toContain('1782132327133.avif')
```

- [x] **Step 2: Run the integration test and verify RED**

```bash
npm test -- tests/integration/public-guide-demo.AC-01-01-07.featured-bento.test.tsx --runInBand
```

Expected: FAIL because the current cards use a split white layout and the
carousel exposes its scrollbar.

- [x] **Step 3: Create the bento card**

```tsx
import Image from 'next/image'
import { MapPinned } from 'lucide-react'
import type { GuidePoi } from '@/features/guide-app/types'
import { getGuidePoiHeroImage } from '@/features/guide-app/lib/poi-image'

export function GuideFeaturedPoiCard({
  poi,
  onSelect,
}: {
  poi: GuidePoi
  onSelect: (poi: GuidePoi) => void
}) {
  const heroImage = getGuidePoiHeroImage({
    categorySlug: poi.category.slug,
    photos: poi.photos,
  })

  return (
    <button
      type="button"
      data-testid="guide-featured-card"
      aria-label={`Ouvrir ${poi.name}`}
      onClick={() => onSelect(poi)}
      className="group relative aspect-square h-[156px] w-[156px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-slate-900 text-left text-white shadow-[0_12px_28px_rgba(15,23,42,0.14)]"
    >
      <Image
        src={heroImage}
        alt={poi.name}
        fill
        unoptimized={heroImage.startsWith('https://')}
        sizes="156px"
        className="object-cover transition duration-500 group-hover:brightness-95"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-4">
        <strong className="line-clamp-2 block text-sm leading-[1.1]">
          {poi.name}
        </strong>
        {poi.distanceLabel && (
          <span className="mt-2 flex items-center gap-1 text-[9px] text-white/75">
            <MapPinned className="h-3 w-3" />
            {poi.distanceLabel}
          </span>
        )}
      </span>
    </button>
  )
}
```

- [x] **Step 4: Adopt the card and hide only the scrollbar**

Replace the current inline card map in `GuideHome` with:

```tsx
<div
  data-testid="guide-featured-carousel"
  className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
>
  {featured.map(poi => (
    <GuideFeaturedPoiCard
      key={poi.id}
      poi={poi}
      onSelect={onSelectPoi}
    />
  ))}
</div>
```

Remove the now-unused `MapPinned` import from `GuideHome`.

- [x] **Step 5: Run the integration test and verify GREEN**

```bash
npm test -- tests/integration/public-guide-demo.AC-01-01-07.featured-bento.test.tsx --runInBand
```

Expected: exactly three identical full-image cards pass all assertions.

### Task 3: Interaction, traceability and verification

**Files:**
- Modify: `tests/e2e/public-guide-demo.AC-05-01-09.test.ts`
- Modify: `docs/traceability-matrix.md`
- Modify: `docs/superpowers/plans/2026-07-29-guide-featured-bento.md`

- [x] **Step 1: Extend the responsive E2E contract**

After opening the modal:

```ts
const carousel = page.getByTestId('guide-featured-carousel')
await expect(carousel).toBeVisible()
await expect(page.getByTestId('guide-featured-card')).toHaveCount(3)

const scrollMetrics = await carousel.evaluate(element => {
  const before = element.scrollLeft
  element.scrollTo({ left: 120 })
  return {
    before,
    after: element.scrollLeft,
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    scrollbarWidth: getComputedStyle(element).scrollbarWidth,
  }
})
expect(scrollMetrics.scrollWidth).toBeGreaterThan(scrollMetrics.clientWidth)
expect(scrollMetrics.after).toBeGreaterThan(scrollMetrics.before)
expect(scrollMetrics.scrollbarWidth).toBe('none')
```

- [x] **Step 2: Update traceability**

Add section `033 — Guide Featured Bento` mapping AC-01-01 through AC-01-07 to:

- `GuideHome.tsx`;
- `GuideFeaturedPoiCard.tsx`;
- `poi-image.ts`;
- `demo-pois.ts`;
- the unit, integration and E2E tests introduced above.

- [x] **Step 3: Run focused regressions**

```bash
npm test -- tests/unit/guide-app.poi-hero-image.test.ts tests/unit/public-guide-demo.AC-05-06.data.test.ts tests/integration/public-guide-demo.AC-01-01-07.featured-bento.test.tsx tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx tests/integration/public-guide-demo.AC-05-07.map.test.tsx --runInBand
```

Expected: all focused suites pass.

- [x] **Step 4: Run static verification**

```bash
npx eslint src/features/guide-app/components/GuideFeaturedPoiCard.tsx src/features/guide-app/components/GuideHome.tsx src/features/guide-app/lib/poi-image.ts src/features/guide-demo/demo-pois.ts
npx tsc --noEmit --pretty false
npm run build
```

Expected: zero errors. The existing Story Script fallback warning may remain.

- [x] **Step 5: Run responsive E2E sequentially**

```bash
npx playwright test tests/e2e/public-guide-demo.AC-05-01-09.test.ts --project='Mobile Chrome' --workers=1
```

Expected: mobile, tablet and desktop pass; the row scrolls horizontally without
visible scrollbar or page overflow.

- [x] **Step 6: Leave work local**

Do not push or deploy. Keep the development server available on port 3000.
