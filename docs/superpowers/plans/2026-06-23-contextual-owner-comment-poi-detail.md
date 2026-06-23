# Contextual Owner Comment on POI Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher sur une fiche POI le commentaire de recommandation du seul Lodging actif, sans exposer ce commentaire dans la query POI globale, l'API ou le SEO.

**Architecture:** Une query dédiée du bounded context `guide-customization` reçoit `lodgingId` et `poiId`, puis retourne une note normalisée ou `null`. La page POI Server Component combine cette donnée contextuelle avec le `PoiDetail` global et transmet une prop optionnelle à un composant visuel partagé par les fiches standard et randonnée.

**Tech Stack:** Next.js 16 App Router, React Server Components, TypeScript strict, Prisma, Tailwind CSS, Jest, Testing Library.

---

### Task 1: Query contextuelle isolée

**Files:**
- Create: `src/features/guide-customization/queries/contextual-owner-note.ts`
- Create: `tests/unit/guide-customization.AC-02-06.contextual-owner-note.test.ts`

- [ ] **Step 1: Write the failing query tests**

Créer un mock Prisma et vérifier la paire exacte ainsi que les garde-fous :

```ts
const mockFindFirst = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodgingFeaturedPoi: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}))

import { getContextualOwnerNote } from '@/features/guide-customization/queries/contextual-owner-note'

describe('AC-02-06: contextual Owner note', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the normalized note for the exact lodging and POI', async () => {
    mockFindFirst.mockResolvedValue({ owner_note: '  Notre adresse préférée.  ' })

    await expect(getContextualOwnerNote('lodging-1', 'poi-1')).resolves.toBe(
      'Notre adresse préférée.',
    )
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: {
        lodging_id: 'lodging-1',
        poi_id: 'poi-1',
        deleted_at: null,
        lodging: { is_active: true, deleted_at: null },
        poi: { is_active: true, deleted_at: null },
      },
      select: { owner_note: true },
    })
  })

  it('returns null when the recommendation does not belong to the active lodging', async () => {
    mockFindFirst.mockResolvedValue(null)
    await expect(getContextualOwnerNote('lodging-other', 'poi-1')).resolves.toBeNull()
  })

  it.each([null, '', '   '])('returns null for an empty note: %p', async ownerNote => {
    mockFindFirst.mockResolvedValue({ owner_note: ownerNote })
    await expect(getContextualOwnerNote('lodging-1', 'poi-1')).resolves.toBeNull()
  })
})
```

- [ ] **Step 2: Run the test and confirm RED**

```bash
npm test -- --runInBand tests/unit/guide-customization.AC-02-06.contextual-owner-note.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the minimal query**

```ts
import { prisma } from '@/shared/lib/prisma'
import { normalizeOwnerNote } from '@/features/guide-customization/lib/validation'

export async function getContextualOwnerNote(
  lodgingId: string,
  poiId: string,
): Promise<string | null> {
  const recommendation = await prisma.lodgingFeaturedPoi.findFirst({
    where: {
      lodging_id: lodgingId,
      poi_id: poiId,
      deleted_at: null,
      lodging: { is_active: true, deleted_at: null },
      poi: { is_active: true, deleted_at: null },
    },
    select: { owner_note: true },
  })

  return normalizeOwnerNote(recommendation?.owner_note)
}
```

- [ ] **Step 4: Run the query tests**

```bash
npm test -- --runInBand tests/unit/guide-customization.AC-02-06.contextual-owner-note.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/guide-customization/queries/contextual-owner-note.ts tests/unit/guide-customization.AC-02-06.contextual-owner-note.test.ts
git commit -m "feat: resolve contextual owner note for POIs"
```

### Task 2: Bloc visuel partagé par les fiches standard et randonnée

**Files:**
- Create: `src/features/categories/components/OwnerRecommendationNote.tsx`
- Modify: `src/features/categories/components/PoiDetailBody.tsx`
- Modify: `src/features/trail-navigation/components/TrailPoiDetailBody.tsx`
- Create: `tests/unit/categories.AC-01-05-06.owner-recommendation-note.test.tsx`
- Modify: `tests/integration/trail-navigation.public-detail.test.tsx`

- [ ] **Step 1: Write failing component tests**

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { OwnerRecommendationNote } from '@/features/categories/components/OwnerRecommendationNote'

describe('OwnerRecommendationNote', () => {
  it('renders the contextual note as plain text', () => {
    render(<OwnerRecommendationNote note="<strong>Notre choix</strong>" />)
    expect(screen.getByText('<strong>Notre choix</strong>')).toBeInTheDocument()
    expect(document.querySelector('strong')).toBeNull()
  })

  it('renders nothing without a note', () => {
    const { container } = render(<OwnerRecommendationNote note={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

Ajouter aux tests standard et randonnée :

```tsx
render(
  <PoiDetailBody
    poi={poi}
    citySlug="saint-gervais-les-bains"
    categorySlug="restaurants"
    ownerRecommendationNote="Notre choix pour dîner."
  />,
)
expect(screen.getByText('Notre choix pour dîner.')).toBeInTheDocument()
```

```tsx
render(
  <PoiDetailBody
    poi={trailPoi}
    citySlug="saint-gervais-les-bains"
    categorySlug="rando"
    ownerRecommendationNote="Notre balade favorite."
  />,
)
expect(screen.getByText('Notre balade favorite.')).toBeInTheDocument()
```

- [ ] **Step 2: Run tests and confirm RED**

```bash
npm test -- --runInBand \
  tests/unit/categories.AC-01-05-06.owner-recommendation-note.test.tsx \
  tests/integration/categories.AC-01-01.poi-detail-renders.test.tsx \
  tests/integration/trail-navigation.public-detail.test.tsx
```

Expected: FAIL because the component and props do not exist.

- [ ] **Step 3: Create the presentation component**

```tsx
export function OwnerRecommendationNote({ note }: { note: string | null }) {
  if (!note) return null

  return (
    <section
      aria-label="Le mot de votre hôte"
      className="mx-6 rounded-[30px] bg-stone-200/40 p-6"
    >
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
        Le mot de votre hôte
      </h2>
      <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed text-charcoal/80">
        {note}
      </p>
    </section>
  )
}
```

- [ ] **Step 4: Thread the optional prop through both detail bodies**

Dans `PoiDetailBody` :

```ts
ownerRecommendationNote?: string | null
```

Pour la branche randonnée :

```tsx
return (
  <TrailPoiDetailBody
    poi={poi}
    citySlug={citySlug}
    categorySlug={categorySlug}
    onClose={onClose}
    ownerRecommendationNote={ownerRecommendationNote}
  />
)
```

Dans la fiche standard, rendre le bloc après la description :

```tsx
<OwnerRecommendationNote note={ownerRecommendationNote ?? null} />
```

Dans `TrailPoiDetailBody`, ajouter la même prop et rendre le bloc après la description, avant les statistiques.

- [ ] **Step 5: Run component and detail tests**

```bash
npm test -- --runInBand \
  tests/unit/categories.AC-01-05-06.owner-recommendation-note.test.tsx \
  tests/integration/categories.AC-01-01.poi-detail-renders.test.tsx \
  tests/integration/trail-navigation.public-detail.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add \
  src/features/categories/components/OwnerRecommendationNote.tsx \
  src/features/categories/components/PoiDetailBody.tsx \
  src/features/trail-navigation/components/TrailPoiDetailBody.tsx \
  tests/unit/categories.AC-01-05-06.owner-recommendation-note.test.tsx \
  tests/integration/categories.AC-01-01.poi-detail-renders.test.tsx \
  tests/integration/trail-navigation.public-detail.test.tsx
git commit -m "feat: render contextual owner notes on POI details"
```

### Task 3: Intégration Server Component et isolation du SEO

**Files:**
- Modify: `src/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/page.tsx`
- Create: `tests/integration/poi-detail.contextual-owner-note.test.tsx`
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Write failing page integration tests**

Mocker séparément le POI global, le contexte de séjour et la query contextuelle :

```tsx
jest.mock('@/features/categories/queries/poi-detail', () => ({
  getPoiDetail: jest.fn(),
}))
jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(),
}))
jest.mock('@/features/guide-customization/queries/contextual-owner-note', () => ({
  getContextualOwnerNote: jest.fn(),
}))
jest.mock('@/features/categories/components/PoiDetailBody', () => ({
  PoiDetailBody: ({ ownerRecommendationNote }: { ownerRecommendationNote?: string | null }) => (
    <div data-testid="poi-detail-note">{ownerRecommendationNote ?? 'none'}</div>
  ),
}))
jest.mock('@/shared/components/JsonLd', () => ({ JsonLd: () => null }))
```

Vérifier :

```tsx
it('passes the exact active lodging note to the POI detail', async () => {
  jest.mocked(getActiveLodgingContext).mockResolvedValue({
    lodgingId: 'lodging-1',
    lodgingName: 'Chalet',
    citySlug: 'saint-gervais-les-bains',
    cityName: 'Saint-Gervais-les-Bains',
    ownerName: 'Jean Dupont',
  })
  jest.mocked(getContextualOwnerNote).mockResolvedValue('Notre adresse préférée.')

  render(await PoiDetailPage({ params: Promise.resolve({
    'city-slug': 'les-contamines-montjoie',
    'category-slug': 'diner',
    'poi-slug': 'la-vieille-auberge',
  }) }))

  expect(getContextualOwnerNote).toHaveBeenCalledWith('lodging-1', 'poi-1')
  expect(screen.getByTestId('poi-detail-note')).toHaveTextContent('Notre adresse préférée.')
})

it('does not query a contextual note without an active lodging', async () => {
  jest.mocked(getActiveLodgingContext).mockResolvedValue(null)
  render(await PoiDetailPage({ params: Promise.resolve({
    'city-slug': 'les-contamines-montjoie',
    'category-slug': 'diner',
    'poi-slug': 'la-vieille-auberge',
  }) }))
  expect(getContextualOwnerNote).not.toHaveBeenCalled()
  expect(screen.getByTestId('poi-detail-note')).toHaveTextContent('none')
})
```

- [ ] **Step 2: Run the page test and confirm RED**

```bash
npm test -- --runInBand tests/integration/poi-detail.contextual-owner-note.test.tsx
```

Expected: FAIL because the page does not resolve or pass the contextual note.

- [ ] **Step 3: Resolve the note only in the page render**

Importer :

```ts
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { getContextualOwnerNote } from '@/features/guide-customization/queries/contextual-owner-note'
```

Après le chargement du POI :

```ts
const lodgingContext = await getActiveLodgingContext()
const ownerRecommendationNote = lodgingContext
  ? await getContextualOwnerNote(lodgingContext.lodgingId, poi.id)
  : null
```

Transmettre :

```tsx
<PoiDetailBody
  poi={poi}
  citySlug={citySlug}
  categorySlug={categorySlug}
  ownerRecommendationNote={ownerRecommendationNote}
/>
```

Ne modifier ni `generateMetadata`, ni `schemaInput`, ni `JsonLd`.

- [ ] **Step 4: Run page and SEO regression tests**

```bash
npm test -- --runInBand \
  tests/integration/poi-detail.contextual-owner-note.test.tsx \
  tests/unit/seo.structured-data.test.ts \
  tests/unit/seo.metadata.test.ts
```

Expected: PASS.

- [ ] **Step 5: Update traceability**

Ajouter :

```markdown
| AC-01-05/AC-01-06 | Commentaire Owner affiché uniquement pour le Lodging actif qui recommande le POI | `src/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/page.tsx`<br>`src/features/guide-customization/queries/contextual-owner-note.ts`<br>`src/features/categories/components/OwnerRecommendationNote.tsx`<br>`src/features/categories/components/PoiDetailBody.tsx`<br>`src/features/trail-navigation/components/TrailPoiDetailBody.tsx` | `tests/unit/guide-customization.AC-02-06.contextual-owner-note.test.ts`<br>`tests/unit/categories.AC-01-05-06.owner-recommendation-note.test.tsx`<br>`tests/integration/poi-detail.contextual-owner-note.test.tsx`<br>`tests/integration/trail-navigation.public-detail.test.tsx` | ✅ done |
```

Mettre à jour la ligne 012 AC-02-02 et ajouter AC-02-06 avec les mêmes sources contextuelles.

- [ ] **Step 6: Run full focused verification**

```bash
npm test -- --runInBand \
  tests/unit/guide-customization.AC-02-06.contextual-owner-note.test.ts \
  tests/unit/categories.AC-01-05-06.owner-recommendation-note.test.tsx \
  tests/integration/categories.AC-01-01.poi-detail-renders.test.tsx \
  tests/integration/trail-navigation.public-detail.test.tsx \
  tests/integration/poi-detail.contextual-owner-note.test.tsx \
  tests/unit/seo.structured-data.test.ts \
  tests/unit/seo.metadata.test.ts
npx tsc --noEmit
git diff --check
```

Expected: all tests PASS, TypeScript exits 0, no whitespace errors.

- [ ] **Step 7: Build and commit**

```bash
set -a
source .env
source .env.local
set +a
npm run build
git add \
  'src/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/page.tsx' \
  tests/integration/poi-detail.contextual-owner-note.test.tsx \
  docs/traceability-matrix.md
git commit -m "test: cover contextual owner notes on POI pages"
```

Expected: production build succeeds and the worktree contains no generated file staged.

---

## Self-Review

- Specs 004 AC-01-05/06 and BR-06/09 are covered.
- Spec 012 AC-02-06 and the contextual exception to BR-09/12 are covered.
- The comment is not added to `PoiDetail`, the POI API, metadata or JSON-LD.
- Standard and trail detail rendering use one shared presentation component.
- Isolation between Lodgings is enforced by the compound lookup inputs.
- Empty notes and inactive/soft-deleted entities return `null`.
- No schema migration or new API endpoint is required.
