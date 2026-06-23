# Cross-City Owner Comments and Lodging Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'Owner de commenter ses recommandations inter-villes avec la limite existante de 300 mots, puis afficher les recommandations locales et inter-villes dans deux sections distinctes sur la fiche publique du logement.

**Architecture:** Le dashboard conserve deux états d'interface, local et inter-ville, mais sérialise une seule liste `featured_pois` vers le contrat existant. La query publique enrichit chaque recommandation avec `owner_note` et sa City réelle ; un composant serveur sépare ensuite le bloc local du bloc "À découvrir ailleurs" et groupe ce dernier par City sans étendre les listes géographiques du Guide.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Prisma, Tailwind CSS, Jest, Testing Library.

---

## File Map

- Modify: `src/features/guide-customization/types.ts`
  - Ajoute `owner_note` à l'état UI des recommandations inter-villes.
- Modify: `src/features/guide-customization/components/OtherCityRecommendations.tsx`
  - Affiche le textarea et le compteur de mots pour chaque POI inter-ville sélectionné.
- Modify: `src/features/guide-customization/components/CustomizationForm.tsx`
  - Valide les commentaires locaux et inter-villes, sérialise `owner_note` et évite les doublons après sauvegarde.
- Modify: `src/app/(dashboard)/dashboard/lodgings/[id]/customize/page.tsx`
  - Réhydrate le commentaire existant dans `initialOtherCityPois`.
- Create: `tests/unit/guide-customization.AC-02-05.other-city-owner-note.test.tsx`
  - Vérifie l'édition, le compteur et l'initialisation du commentaire inter-ville.
- Modify: `tests/unit/guide-customization.customization-form-other-city.test.tsx`
  - Vérifie le payload, le blocage au-delà de 300 mots et deux sauvegardes sans doublon.
- Modify: `src/features/lodging-showcase/types.ts`
  - Définit la forme publique complète d'une recommandation Owner.
- Modify: `src/features/lodging-showcase/queries/public-lodgings.ts`
  - Sélectionne `owner_note`, la catégorie et la City réelle du POI.
- Modify: `src/features/lodging-showcase/components/OwnerRecommendationsBlock.tsx`
  - Rend deux sections et groupe les recommandations inter-villes par City.
- Create: `tests/unit/lodging-showcase.AC-02-05-06.owner-recommendations.test.tsx`
  - Vérifie le bucketing, les commentaires et les liens réels.
- Modify: `tests/contract/lodging-showcase.public-api.test.ts`
  - Vérifie la sélection Prisma et le mapping des recommandations dans la query de détail.
- Modify: `tests/integration/lodging-showcase.public-pages.test.tsx`
  - Vérifie le rendu complet sur la route publique du logement.
- Modify: `docs/traceability-matrix.md`
  - Met à jour les lignes 012 et 028.

### Task 1: Éditeur de commentaire pour les recommandations inter-villes

**Files:**
- Modify: `src/features/guide-customization/types.ts`
- Modify: `src/features/guide-customization/components/OtherCityRecommendations.tsx`
- Create: `tests/unit/guide-customization.AC-02-05.other-city-owner-note.test.tsx`

- [ ] **Step 1: Write the failing editor test**

Créer le test avec un POI déjà sélectionné afin de vérifier la réhydratation, puis sélectionner un nouveau POI pour vérifier l'initialisation à `null`.

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { OtherCityRecommendations } from '@/features/guide-customization/components/OtherCityRecommendations'
import type { OtherCityPoiSelection } from '@/features/guide-customization/types'

function Harness({ initialValue }: { initialValue: OtherCityPoiSelection[] }) {
  const [value, setValue] = useState(initialValue)
  return (
    <>
      <OtherCityRecommendations
        value={value}
        onChange={setValue}
        excludeCitySlug="saint-gervais-les-bains"
      />
      <pre data-testid="state">{JSON.stringify(value)}</pre>
    </>
  )
}

describe('AC-02-05: commentaire Owner inter-ville', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/dashboard/cities/annecy/pois')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              city: { slug: 'annecy', name: 'Annecy' },
              pois: [
                {
                  id: 'poi-lac',
                  name: 'Le Lac',
                  category_slug: 'nature',
                  category_name: 'Nature',
                },
                {
                  id: 'poi-chateau',
                  name: 'Le Château',
                  category_slug: 'culture',
                  category_name: 'Culture',
                },
              ],
            },
          }),
        })
      }
      return Promise.resolve({ ok: false, json: async () => ({}) })
    }) as jest.Mock
  })

  it('réhydrate, modifie et compte les mots du commentaire sélectionné', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        initialValue={[{
          poi_id: 'poi-lac',
          name: 'Le Lac',
          category_name: 'Nature',
          city_slug: 'annecy',
          city_name: 'Annecy',
          owner_note: 'Vue magnifique',
        }]}
      />,
    )

    const textarea = await screen.findByLabelText(
      'Votre mot pour les voyageurs - Le Lac',
    )
    expect(textarea).toHaveValue('Vue magnifique')
    expect(screen.getByText('2 / 300 mots')).toBeInTheDocument()

    await user.clear(textarea)
    await user.type(textarea, 'Parfait pour une promenade au coucher du soleil')

    expect(screen.getByText('8 / 300 mots')).toBeInTheDocument()
    expect(screen.getByTestId('state')).toHaveTextContent(
      '"owner_note":"Parfait pour une promenade au coucher du soleil"',
    )
  })

  it('initialise à null le commentaire d’un nouveau POI sélectionné', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        initialValue={[{
          poi_id: 'poi-lac',
          name: 'Le Lac',
          category_name: 'Nature',
          city_slug: 'annecy',
          city_name: 'Annecy',
          owner_note: null,
        }]}
      />,
    )

    await user.click(await screen.findByLabelText('Le Château'))

    await waitFor(() => {
      expect(screen.getByTestId('state')).toHaveTextContent(
        '"poi_id":"poi-chateau"',
      )
    })
    expect(screen.getByTestId('state')).toHaveTextContent('"owner_note":null')
  })
})
```

- [ ] **Step 2: Run the editor test and confirm the expected failure**

Run:

```bash
npm test -- --runInBand tests/unit/guide-customization.AC-02-05.other-city-owner-note.test.tsx
```

Expected: FAIL because `OtherCityPoiSelection` has no `owner_note` field and the inter-ville component renders no textarea.

- [ ] **Step 3: Extend the inter-ville type and component**

Ajouter le champ au type :

```ts
export interface OtherCityPoiSelection {
  poi_id: string
  name: string
  category_name: string
  city_slug: string
  city_name: string
  owner_note: string | null
}
```

Importer le textarea et les helpers dans `OtherCityRecommendations.tsx` :

```tsx
import { Textarea } from '@/shared/components/ui/textarea'
import {
  countWords,
  OWNER_NOTE_MAX_WORDS,
} from '@/features/guide-customization/lib/validation'
```

Initialiser le commentaire lors de la sélection :

```tsx
onChange([...value, {
  poi_id: poi.id,
  name: poi.name,
  category_name: poi.category_name,
  city_slug: city.slug,
  city_name: city.name,
  owner_note: null,
}])
```

Ajouter un updater immuable :

```tsx
function updateOwnerNote(poiId: string, ownerNote: string) {
  onChange(value.map(selection =>
    selection.poi_id === poiId
      ? { ...selection, owner_note: ownerNote }
      : selection,
  ))
}
```

Remplacer chaque ligne POI par une card qui conserve la checkbox et affiche l'éditeur uniquement si le POI est sélectionné :

```tsx
const selected = value.find(selection => selection.poi_id === poi.id)
const checked = Boolean(selected)
const disabled = !checked && count >= MAX_PER_CITY
const wordCount = countWords(selected?.owner_note ?? '')
const overLimit = wordCount > OWNER_NOTE_MAX_WORDS

return (
  <div
    key={poi.id}
    className={`rounded-xl border p-3 ${
      checked ? 'border-[#0B1437]/15 bg-white shadow-sm' : 'border-transparent'
    }`}
  >
    <label className={`flex items-center gap-3 text-sm ${disabled ? 'opacity-40' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={event => togglePoi(city, poi, event.target.checked)}
        className="h-4 w-4 accent-charcoal"
      />
      <span className="text-charcoal">{poi.name}</span>
      <span className="ml-auto text-[10px] uppercase tracking-widest text-gray-400">
        {poi.category_name}
      </span>
    </label>
    {selected && (
      <div className="mt-3 border-t border-gray-100 pt-3">
        <Label
          htmlFor={`other-city-owner-note-${poi.id}`}
          className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400"
        >
          Votre mot pour les voyageurs - {poi.name}
        </Label>
        <Textarea
          id={`other-city-owner-note-${poi.id}`}
          value={selected.owner_note ?? ''}
          onChange={event => updateOwnerNote(poi.id, event.target.value)}
          placeholder="Pourquoi recommandez-vous cette adresse ?"
          className="mt-2 min-h-[88px] resize-none"
        />
        <p className={`mt-2 text-right text-[11px] font-medium ${
          overLimit ? 'text-rose-500' : 'text-gray-400'
        }`}>
          {wordCount} / {OWNER_NOTE_MAX_WORDS} mots
        </p>
      </div>
    )}
  </div>
)
```

- [ ] **Step 4: Run the focused component tests**

Run:

```bash
npm test -- --runInBand \
  tests/unit/guide-customization.AC-02-05.other-city-owner-note.test.tsx \
  tests/unit/guide-customization.other-city-recommendations.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the editor**

```bash
git add \
  src/features/guide-customization/types.ts \
  src/features/guide-customization/components/OtherCityRecommendations.tsx \
  tests/unit/guide-customization.AC-02-05.other-city-owner-note.test.tsx
git commit -m "feat: add comments to cross-city recommendations"
```

### Task 2: Sérialisation, limite globale et réhydratation sans doublon

**Files:**
- Modify: `src/features/guide-customization/components/CustomizationForm.tsx`
- Modify: `src/app/(dashboard)/dashboard/lodgings/[id]/customize/page.tsx`
- Modify: `tests/unit/guide-customization.customization-form-other-city.test.tsx`

- [ ] **Step 1: Add failing payload and duplicate-regression tests**

Mettre à jour le fixture inter-ville avec `owner_note`, puis ajouter les assertions suivantes :

```tsx
const otherCityPoi = {
  poi_id: 'p1',
  name: 'Le Lac',
  category_name: 'Nature',
  city_slug: 'annecy',
  city_name: 'Annecy',
  owner_note: 'Notre promenade préférée au coucher du soleil.',
}

it('sérialise le commentaire inter-ville normalisé', async () => {
  const user = userEvent.setup()
  render(
    <CustomizationForm
      lodgingId="lodging-1"
      citySlug="saint-gervais"
      categories={[]}
      pois={[]}
      initialCustomization={baseCustomization}
      initialOtherCityPois={[otherCityPoi]}
    />,
  )

  await user.click(screen.getByRole('button', { name: /enregistrer/i }))

  const putCall = await waitFor(() => {
    const call = (global.fetch as jest.Mock).mock.calls.find(([, init]) =>
      init?.method === 'PUT',
    )
    expect(call).toBeTruthy()
    return call
  })
  const payload = JSON.parse((putCall[1] as RequestInit).body as string)

  expect(payload.featured_pois).toEqual([{
    poi_id: 'p1',
    owner_note: 'Notre promenade préférée au coucher du soleil.',
    sort_order: 0,
  }])
})

it('désactive la sauvegarde si un commentaire inter-ville dépasse 300 mots', async () => {
  const longNote = Array.from({ length: 301 }, () => 'mot').join(' ')
  render(
    <CustomizationForm
      lodgingId="lodging-1"
      citySlug="saint-gervais"
      categories={[]}
      pois={[]}
      initialCustomization={baseCustomization}
      initialOtherCityPois={[{ ...otherCityPoi, owner_note: longNote }]}
    />,
  )

  expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled()
  expect(screen.getByText('301 / 300 mots')).toHaveClass('text-rose-500')
})

it('ne duplique pas un POI inter-ville lors de deux sauvegardes successives', async () => {
  const user = userEvent.setup()
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      ...baseCustomization,
      featured_pois: [{
        poi_id: 'p1',
        category_id: 'cat-nature',
        owner_note: otherCityPoi.owner_note,
        sort_order: 0,
      }],
    }),
  }) as jest.Mock

  render(
    <CustomizationForm
      lodgingId="lodging-1"
      citySlug="saint-gervais"
      categories={[]}
      pois={[]}
      initialCustomization={baseCustomization}
      initialOtherCityPois={[otherCityPoi]}
    />,
  )

  await user.click(screen.getByRole('button', { name: /enregistrer/i }))
  await screen.findByText('Personnalisation sauvegardée.')
  await user.click(screen.getByRole('button', { name: /enregistrer/i }))

  const putCalls = (global.fetch as jest.Mock).mock.calls.filter(([, init]) =>
    init?.method === 'PUT',
  )
  const secondPayload = JSON.parse(
    (putCalls[1][1] as RequestInit).body as string,
  )
  expect(secondPayload.featured_pois).toHaveLength(1)
  expect(secondPayload.featured_pois[0].poi_id).toBe('p1')
})
```

- [ ] **Step 2: Run the form test and confirm failure**

Run:

```bash
npm test -- --runInBand tests/unit/guide-customization.customization-form-other-city.test.tsx
```

Expected: FAIL because `owner_note` is absent du payload inter-ville, la limite ne couvre que `featuredPois`, et la réponse de sauvegarde mélange les deux états.

- [ ] **Step 3: Include inter-ville notes in validation and payload**

Calculer la limite sur les deux listes :

```tsx
const ownerNoteOverLimit = [...featuredPois, ...otherCityPois].some(
  featuredPoi => countWords(featuredPoi.owner_note ?? '') > OWNER_NOTE_MAX_WORDS,
)
```

Sérialiser le commentaire :

```tsx
...otherCityPois.map((poi, index) => ({
  poi_id: poi.poi_id,
  owner_note: normalizeOwnerNote(poi.owner_note),
  sort_order: featuredPois.length + index,
})),
```

- [ ] **Step 4: Partition the save response instead of duplicating state**

Remplacer la réhydratation actuelle de `featuredPois` par :

```tsx
const otherCityPoiIds = new Set(otherCityPois.map(poi => poi.poi_id))
const savedByPoiId = new Map(
  payload.featured_pois.map(featuredPoi => [featuredPoi.poi_id, featuredPoi]),
)

setFeaturedPois(
  payload.featured_pois
    .filter(featuredPoi => !otherCityPoiIds.has(featuredPoi.poi_id))
    .map(featuredPoi => ({
      poi_id: featuredPoi.poi_id,
      owner_note: featuredPoi.owner_note,
      sort_order: featuredPoi.sort_order,
    })),
)
setOtherCityPois(current => current.map(poi => ({
  ...poi,
  owner_note: savedByPoiId.get(poi.poi_id)?.owner_note ?? null,
})))
```

Cette partition utilise la liste inter-ville courante, donc elle couvre aussi les POI ajoutés pendant la session et pas seulement `initialOtherCityPois`.

- [ ] **Step 5: Rehydrate `owner_note` from Prisma**

Dans la query dashboard, sélectionner le champ sur la relation :

```tsx
select: {
  owner_note: true,
  poi: {
    select: {
      id: true,
      name: true,
      city: { select: { id: true, slug: true, name: true } },
      category: { select: { name: true } },
    },
  },
},
```

Puis l'ajouter au mapping :

```tsx
.map(row => ({
  poi_id: row.poi.id,
  name: row.poi.name,
  category_name: row.poi.category.name,
  city_slug: row.poi.city.slug,
  city_name: row.poi.city.name,
  owner_note: row.owner_note,
}))
```

- [ ] **Step 6: Run all guide-customization comment tests**

Run:

```bash
npm test -- --runInBand \
  tests/unit/guide-customization.AC-02-05.other-city-owner-note.test.tsx \
  tests/unit/guide-customization.customization-form-other-city.test.tsx \
  tests/unit/guide-customization.owner-note-form.test.tsx \
  tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit persistence and regression fix**

```bash
git add \
  src/features/guide-customization/components/CustomizationForm.tsx \
  'src/app/(dashboard)/dashboard/lodgings/[id]/customize/page.tsx' \
  tests/unit/guide-customization.customization-form-other-city.test.tsx
git commit -m "fix: persist cross-city owner comments"
```

### Task 3: Query publique et deux sections de recommandations

**Files:**
- Modify: `src/features/lodging-showcase/types.ts`
- Modify: `src/features/lodging-showcase/queries/public-lodgings.ts`
- Modify: `src/features/lodging-showcase/components/OwnerRecommendationsBlock.tsx`
- Create: `tests/unit/lodging-showcase.AC-02-05-06.owner-recommendations.test.tsx`
- Modify: `tests/contract/lodging-showcase.public-api.test.ts`

- [ ] **Step 1: Write the failing rendering test**

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import { OwnerRecommendationsBlock } from '@/features/lodging-showcase/components/OwnerRecommendationsBlock'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

const items = [
  {
    id: 'local-1',
    name: 'Le Port',
    slug: 'le-port',
    category_slug: 'restaurants',
    city_slug: 'annecy',
    city_name: 'Annecy',
    owner_note: 'Idéal pour dîner au bord de l’eau.',
    photo_url: null,
  },
  {
    id: 'other-1',
    name: 'Aiguille du Midi',
    slug: 'aiguille-du-midi',
    category_slug: 'explorer',
    city_slug: 'chamonix',
    city_name: 'Chamonix',
    owner_note: 'À réserver par temps clair.',
    photo_url: null,
  },
  {
    id: 'other-2',
    name: 'Mer de Glace',
    slug: 'mer-de-glace',
    category_slug: 'explorer',
    city_slug: 'chamonix',
    city_name: 'Chamonix',
    owner_note: null,
    photo_url: null,
  },
]

describe('AC-02-05/06: recommandations de la fiche logement', () => {
  it('sépare les recommandations locales et inter-villes', () => {
    render(<OwnerRecommendationsBlock citySlug="annecy" items={items} />)

    const localSection = screen.getByRole('region', {
      name: 'Les recommandations de votre hôte',
    })
    const otherSection = screen.getByRole('region', {
      name: 'À découvrir ailleurs',
    })

    expect(within(localSection).getByText('Le Port')).toBeInTheDocument()
    expect(within(localSection).queryByText('Aiguille du Midi')).not.toBeInTheDocument()
    expect(within(otherSection).getByText('Chamonix')).toBeInTheDocument()
    expect(within(otherSection).getByText('Aiguille du Midi')).toBeInTheDocument()
    expect(within(otherSection).getByText('Mer de Glace')).toBeInTheDocument()
  })

  it('affiche les commentaires et utilise la City réelle dans les liens', () => {
    render(<OwnerRecommendationsBlock citySlug="annecy" items={items} />)

    expect(screen.getByText('Idéal pour dîner au bord de l’eau.')).toBeInTheDocument()
    expect(screen.getByText('À réserver par temps clair.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Le Port/ })).toHaveAttribute(
      'href',
      '/guide/annecy/restaurants/le-port',
    )
    expect(screen.getByRole('link', { name: /Aiguille du Midi/ })).toHaveAttribute(
      'href',
      '/guide/chamonix/explorer/aiguille-du-midi',
    )
  })
})
```

- [ ] **Step 2: Extend the public contract test fixture**

Dans `publishedProfile.lodging.featured_pois`, ajouter :

```ts
featured_pois: [
  {
    owner_note: 'Idéal pour dîner au bord de l’eau.',
    poi: {
      id: 'poi-local',
      name: 'Le Port',
      slug: 'le-port',
      photos: [],
      category: { slug: 'restaurants' },
      city: { slug: 'annecy', name: 'Annecy' },
    },
  },
  {
    owner_note: 'À réserver par temps clair.',
    poi: {
      id: 'poi-other',
      name: 'Aiguille du Midi',
      slug: 'aiguille-du-midi',
      photos: [],
      category: { slug: 'explorer' },
      city: { slug: 'chamonix', name: 'Chamonix' },
    },
  },
],
```

Ajouter au test détail :

```ts
expect(json.owner_recommendations).toEqual([
  expect.objectContaining({
    id: 'poi-local',
    city_slug: 'annecy',
    owner_note: 'Idéal pour dîner au bord de l’eau.',
  }),
  expect.objectContaining({
    id: 'poi-other',
    city_slug: 'chamonix',
    owner_note: 'À réserver par temps clair.',
  }),
])

const detailCall = mockFindFirstProfile.mock.calls[0][0]
expect(
  detailCall.select.lodging.select.featured_pois.select,
).toEqual(expect.objectContaining({
  owner_note: true,
  poi: expect.objectContaining({
    select: expect.objectContaining({
      city: { select: { slug: true, name: true } },
    }),
  }),
}))
```

Le route handler détail doit aussi exposer `owner_recommendations` dans sa réponse :

```ts
owner_recommendations: result.owner_recommendations,
```

- [ ] **Step 3: Run the public tests and confirm failure**

Run:

```bash
npm test -- --runInBand \
  tests/unit/lodging-showcase.AC-02-05-06.owner-recommendations.test.tsx \
  tests/contract/lodging-showcase.public-api.test.ts
```

Expected: FAIL because the public type/query omit City and comment data, the component uses the lodging City for every link, and the detail API omits recommendations.

- [ ] **Step 4: Define one shared public recommendation type**

Dans `src/features/lodging-showcase/types.ts` :

```ts
export type PublicOwnerRecommendationDto = {
  id: string
  name: string
  slug: string
  category_slug: string
  city_slug: string
  city_name: string
  owner_note: string | null
  photo_url: string | null
}
```

Puis remplacer la forme inline :

```ts
owner_recommendations: PublicOwnerRecommendationDto[]
```

Importer et réutiliser ce type dans la query et le composant pour éviter trois contrats divergents.

- [ ] **Step 5: Enrich the Prisma selection and mapping**

Dans `featured_pois.select` :

```ts
select: {
  owner_note: true,
  poi: {
    select: {
      id: true,
      name: true,
      slug: true,
      photos: true,
      category: { select: { slug: true } },
      city: { select: { slug: true, name: true } },
    },
  },
},
```

Conserver uniquement les règles `deleted_at: null` et `is_active: true` sur le POI recommandé ; ne pas utiliser la recommandation inter-ville pour modifier les listes géographiques du Guide.

Mapper la réponse :

```ts
owner_recommendations: row.lodging.featured_pois.map(featuredPoi => ({
  id: featuredPoi.poi.id,
  name: featuredPoi.poi.name,
  slug: featuredPoi.poi.slug,
  category_slug: featuredPoi.poi.category.slug,
  city_slug: featuredPoi.poi.city.slug,
  city_name: featuredPoi.poi.city.name,
  owner_note: featuredPoi.owner_note,
  photo_url: selectPrimaryPoiPhoto(featuredPoi.poi.photos),
})),
```

Ajouter dans `src/app/api/cities/[slug]/lodgings/[lodgingSlug]/route.ts` :

```ts
owner_recommendations: result.owner_recommendations,
```

- [ ] **Step 6: Render local and cross-city sections**

Le composant doit partitionner et grouper sans état client :

```tsx
import Link from 'next/link'
import type { PublicOwnerRecommendationDto } from '@/features/lodging-showcase/types'

type Props = {
  citySlug: string
  items: PublicOwnerRecommendationDto[]
}

function RecommendationCard({ item }: { item: PublicOwnerRecommendationDto }) {
  return (
    <Link
      href={`/guide/${item.city_slug}/${item.category_slug}/${item.slug}`}
      className="block rounded-2xl border border-gray-100 p-3 transition hover:bg-stone-50"
    >
      <div className="flex items-center gap-3">
        {item.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photo_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-2xl bg-stone-100" aria-hidden="true" />
        )}
        <span className="text-sm font-medium text-charcoal">{item.name}</span>
      </div>
      {item.owner_note && (
        <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-gray-600">
          {item.owner_note}
        </p>
      )}
    </Link>
  )
}

export function OwnerRecommendationsBlock({ citySlug, items }: Props) {
  const localItems = items.filter(item => item.city_slug === citySlug)
  const otherItems = items.filter(item => item.city_slug !== citySlug)
  const otherByCity = Map.groupBy(otherItems, item => item.city_slug)

  if (items.length === 0) return null

  return (
    <div className="space-y-6">
      {localItems.length > 0 && (
        <section
          aria-label="Les recommandations de votre hôte"
          className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Guide local
          </p>
          <h2 className="mt-1 text-xl font-light text-charcoal">
            Les recommandations de votre hôte
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {localItems.map(item => <RecommendationCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {otherItems.length > 0 && (
        <section
          aria-label="À découvrir ailleurs"
          className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Carnet d'adresses
          </p>
          <h2 className="mt-1 text-xl font-light text-charcoal">
            À découvrir ailleurs
          </h2>
          <div className="mt-5 space-y-5">
            {[...otherByCity.values()].map(cityItems => (
              <div key={cityItems[0].city_slug}>
                <h3 className="text-sm font-semibold text-charcoal">
                  {cityItems[0].city_name}
                </h3>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  {cityItems.map(item => <RecommendationCard key={item.id} item={item} />)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
```

Si la cible TypeScript du projet ne fournit pas `Map.groupBy`, utiliser ce reduce strictement typé :

```ts
const otherByCity = otherItems.reduce<Map<string, PublicOwnerRecommendationDto[]>>(
  (groups, item) => {
    const current = groups.get(item.city_slug) ?? []
    groups.set(item.city_slug, [...current, item])
    return groups
  },
  new Map(),
)
```

- [ ] **Step 7: Run the public unit and contract tests**

Run:

```bash
npm test -- --runInBand \
  tests/unit/lodging-showcase.AC-02-05-06.owner-recommendations.test.tsx \
  tests/contract/lodging-showcase.public-api.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit the public recommendation contract**

```bash
git add \
  src/features/lodging-showcase/types.ts \
  src/features/lodging-showcase/queries/public-lodgings.ts \
  src/features/lodging-showcase/components/OwnerRecommendationsBlock.tsx \
  'src/app/api/cities/[slug]/lodgings/[lodgingSlug]/route.ts' \
  tests/unit/lodging-showcase.AC-02-05-06.owner-recommendations.test.tsx \
  tests/contract/lodging-showcase.public-api.test.ts
git commit -m "feat: show cross-city recommendations on lodging pages"
```

### Task 4: Integration publique, traçabilité et vérification

**Files:**
- Modify: `tests/integration/lodging-showcase.public-pages.test.tsx`
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Extend the public page integration fixture**

Remplacer la recommandation unique par :

```ts
owner_recommendations: [
  {
    id: 'poi-local',
    name: 'Le Port',
    slug: 'le-port',
    category_slug: 'restaurants',
    city_slug: 'annecy',
    city_name: 'Annecy',
    owner_note: 'Idéal pour dîner au bord de l’eau.',
    photo_url: null,
  },
  {
    id: 'poi-other',
    name: 'Aiguille du Midi',
    slug: 'aiguille-du-midi',
    category_slug: 'explorer',
    city_slug: 'chamonix',
    city_name: 'Chamonix',
    owner_note: 'À réserver par temps clair.',
    photo_url: null,
  },
],
```

Ajouter au test de la fiche :

```tsx
expect(screen.getByRole('region', {
  name: 'Les recommandations de votre hôte',
})).toBeInTheDocument()
expect(screen.getByRole('region', {
  name: 'À découvrir ailleurs',
})).toBeInTheDocument()
expect(screen.getByText('Chamonix')).toBeInTheDocument()
expect(screen.getByText('Idéal pour dîner au bord de l’eau.')).toBeInTheDocument()
expect(screen.getByText('À réserver par temps clair.')).toBeInTheDocument()
expect(screen.getByRole('link', { name: /Aiguille du Midi/ })).toHaveAttribute(
  'href',
  '/guide/chamonix/explorer/aiguille-du-midi',
)
```

- [ ] **Step 2: Run the integration test**

Run:

```bash
npm test -- --runInBand tests/integration/lodging-showcase.public-pages.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Update traceability for specs 012 and 028**

Mettre à jour les lignes 012 :

```markdown
| AC-02-02 | Commentaire Owner local ou inter-ville sauvegardé et affiché dans les surfaces Owner dédiées | `prisma/schema.prisma`<br>`src/app/api/dashboard/lodgings/[id]/customization/route.ts`<br>`src/features/guide-customization/queries/customization.ts`<br>`src/features/guide-customization/components/CustomizationForm.tsx`<br>`src/features/guide-customization/components/OtherCityRecommendations.tsx`<br>`src/app/(public)/nos-recommandations/page.tsx`<br>`src/features/lodging-showcase/components/OwnerRecommendationsBlock.tsx` | `tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts`<br>`tests/unit/guide-customization.owner-note-form.test.tsx`<br>`tests/unit/guide-customization.AC-02-05.other-city-owner-note.test.tsx`<br>`tests/integration/guide-customization.recommendations-page.test.tsx`<br>`tests/integration/lodging-showcase.public-pages.test.tsx` | ✅ done |
| AC-02-05 | Commentaire Owner éditable sur les POI inter-villes avec compteur 300 mots | `src/features/guide-customization/types.ts`<br>`src/features/guide-customization/components/OtherCityRecommendations.tsx`<br>`src/features/guide-customization/components/CustomizationForm.tsx`<br>`src/app/(dashboard)/dashboard/lodgings/[id]/customize/page.tsx` | `tests/unit/guide-customization.AC-02-05.other-city-owner-note.test.tsx`<br>`tests/unit/guide-customization.customization-form-other-city.test.tsx` | ✅ done |
```

Mettre à jour ou ajouter les lignes 028 :

```markdown
| AC-02-05 | Recommandations locales et inter-villes séparées sur la fiche logement | `src/features/lodging-showcase/queries/public-lodgings.ts`<br>`src/features/lodging-showcase/components/OwnerRecommendationsBlock.tsx`<br>`src/app/(public)/guide/[city-slug]/logements/[lodging-slug]/page.tsx` | `tests/unit/lodging-showcase.AC-02-05-06.owner-recommendations.test.tsx`<br>`tests/integration/lodging-showcase.public-pages.test.tsx` | ✅ done |
| AC-02-06 | Commentaires Owner visibles et liens construits avec la City réelle du POI | `src/features/lodging-showcase/types.ts`<br>`src/features/lodging-showcase/queries/public-lodgings.ts`<br>`src/features/lodging-showcase/components/OwnerRecommendationsBlock.tsx` | `tests/unit/lodging-showcase.AC-02-05-06.owner-recommendations.test.tsx`<br>`tests/contract/lodging-showcase.public-api.test.ts`<br>`tests/integration/lodging-showcase.public-pages.test.tsx` | ✅ done |
```

- [ ] **Step 4: Run the focused regression suite**

Run:

```bash
npm test -- --runInBand \
  tests/unit/guide-customization.AC-02-05.other-city-owner-note.test.tsx \
  tests/unit/guide-customization.other-city-recommendations.test.tsx \
  tests/unit/guide-customization.customization-form-other-city.test.tsx \
  tests/unit/guide-customization.owner-note-form.test.tsx \
  tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts \
  tests/unit/lodging-showcase.AC-02-05-06.owner-recommendations.test.tsx \
  tests/contract/lodging-showcase.public-api.test.ts \
  tests/integration/lodging-showcase.public-pages.test.tsx
```

Expected: all suites PASS.

- [ ] **Step 5: Run static and full verification**

Run:

```bash
npx tsc --noEmit
npm test -- --runInBand
npm run build
git diff --check
```

Expected:
- TypeScript exits with code 0.
- Jest reports no failing suite.
- Next.js production build exits with code 0.
- `git diff --check` produces no output.

- [ ] **Step 6: Commit integration and traceability**

```bash
git add \
  tests/integration/lodging-showcase.public-pages.test.tsx \
  docs/traceability-matrix.md
git commit -m "test: cover cross-city lodging recommendations"
```

- [ ] **Step 7: Verify the final worktree scope**

Run:

```bash
git status --short
git log --oneline -5
```

Expected: only pre-existing unrelated changes such as `tsconfig.tsbuildinfo` remain; the four feature commits are visible and no `.env` file is staged.

---

## Self-Review

- Spec 012 AC-02-02, AC-02-04, AC-02-05, BR-03, BR-08, BR-09, BR-11, BR-12 and BR-15 are covered.
- Spec 028 AC-02-05, AC-02-06, BR-17, BR-18 and BR-18a are covered.
- No schema migration is planned because `LodgingFeaturedPoi.owner_note` already exists.
- No recommendation is injected into `/guide/[city-slug]` or its geographic category lists.
- Local links and cross-city links both use the POI's actual `city_slug`.
- The plan includes the existing double-save duplication regression.
- The plan contains no unresolved product decision.
