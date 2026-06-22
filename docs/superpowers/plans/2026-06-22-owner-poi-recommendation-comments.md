# Owner POI Recommendation Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restaurer un commentaire Owner facultatif de 300 mots maximum sur chaque POI recommandé et l'afficher uniquement sur `/nos-recommandations`.

**Architecture:** Le commentaire est stocké sur `LodgingFeaturedPoi.owner_note`, car il appartient au couple logement–POI. Le contrat de personnalisation Owner transporte et valide ce champ, tandis que seule la page publique dédiée aux recommandations le sélectionne et l'affiche ; les queries générales du Guide restent inchangées.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Prisma/PostgreSQL, Zod, Tailwind CSS, Jest et Testing Library.

---

## File Map

- Modify `src/features/guide-customization/lib/validation.ts`: constante de limite et normalisation métier du commentaire.
- Modify `tests/unit/guide-customization.welcome-words.test.ts`: tests partagés du comptage et de la limite Owner.
- Modify `prisma/schema.prisma`: champ nullable `owner_note` sur `LodgingFeaturedPoi`.
- Create `prisma/migrations/20260622150000_add_owner_recommendation_comment/migration.sql`: ajout de colonne sans perte de données.
- Modify `src/features/guide-customization/types.ts`: types d'entrée et de réponse avec `owner_note`.
- Modify `src/app/api/dashboard/lodgings/[id]/customization/route.ts`: validation Zod des 300 mots.
- Modify `src/features/guide-customization/queries/customization.ts`: lecture, normalisation et persistance.
- Modify `tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts`: contrat valide/invalide et rejet du rating.
- Modify `tests/unit/guide-customization.practical-blocks-save.test.ts`: persistance transactionnelle et trim.
- Modify `src/features/guide-customization/components/CustomizationForm.tsx`: textarea, compteur et blocage de sauvegarde.
- Create `tests/unit/guide-customization.owner-note-form.test.tsx`: comportement du formulaire Owner.
- Modify `src/app/(public)/nos-recommandations/page.tsx`: affichage texte simple du commentaire.
- Modify `tests/integration/guide-customization.recommendations-page.test.tsx`: affichage conditionnel et isolation.
- Modify `docs/traceability-matrix.md`: nouvelle traçabilité AC-02-02, AC-02-04 et BR-15.

### Task 1: Owner Comment Word Rules

**Files:**
- Modify: `src/features/guide-customization/lib/validation.ts`
- Modify: `tests/unit/guide-customization.welcome-words.test.ts`

- [ ] **Step 1: Write the failing validation tests**

Add imports and assertions:

```ts
import {
  countWords,
  normalizeOwnerNote,
  OWNER_NOTE_MAX_WORDS,
  WELCOME_MESSAGE_MAX_WORDS,
} from '@/features/guide-customization/lib/validation'

describe('owner recommendation comment', () => {
  it('exposes a 300-word limit', () => {
    expect(OWNER_NOTE_MAX_WORDS).toBe(300)
    expect(countWords(Array.from({ length: 300 }, () => 'mot').join(' '))).toBe(300)
    expect(countWords(Array.from({ length: 301 }, () => 'mot').join(' '))).toBe(301)
  })

  it('trims text and converts blank text to null', () => {
    expect(normalizeOwnerNote('  Adresse parfaite après le ski.  ')).toBe(
      'Adresse parfaite après le ski.',
    )
    expect(normalizeOwnerNote(' \n\t ')).toBeNull()
    expect(normalizeOwnerNote(null)).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
npm test -- tests/unit/guide-customization.welcome-words.test.ts --runInBand
```

Expected: FAIL because `OWNER_NOTE_MAX_WORDS` and `normalizeOwnerNote` do not exist.

- [ ] **Step 3: Implement the minimal validation helpers**

Add to `validation.ts`:

```ts
/** Limite du commentaire Owner associé à une recommandation POI. */
export const OWNER_NOTE_MAX_WORDS = 300

export function normalizeOwnerNote(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
```

- [ ] **Step 4: Run the test and verify success**

Run:

```bash
npm test -- tests/unit/guide-customization.welcome-words.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/guide-customization/lib/validation.ts tests/unit/guide-customization.welcome-words.test.ts
git commit -m "test: define owner recommendation comment rules"
```

### Task 2: Prisma Storage

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260622150000_add_owner_recommendation_comment/migration.sql`

- [ ] **Step 1: Add a schema regression assertion**

Create a temporary failing expectation in the existing validation command by first running:

```bash
rg -n "owner_note" prisma/schema.prisma
```

Expected: no match in `LodgingFeaturedPoi`.

- [ ] **Step 2: Add the nullable Prisma field**

Update the model:

```prisma
model LodgingFeaturedPoi {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  lodging_id String
  lodging    Lodging         @relation(fields: [lodging_id], references: [id])
  poi_id     String
  poi        PointOfInterest @relation(fields: [poi_id], references: [id])
  owner_note String?
  sort_order Int             @default(0)

  @@unique([lodging_id, poi_id])
  @@index([lodging_id, deleted_at])
  @@index([poi_id])
}
```

- [ ] **Step 3: Add the forward-only migration**

Create `migration.sql`:

```sql
ALTER TABLE "LodgingFeaturedPoi"
ADD COLUMN "owner_note" TEXT;
```

- [ ] **Step 4: Validate and regenerate Prisma**

Run:

```bash
npx prisma validate
npx prisma generate
```

Expected: both commands exit successfully and the generated client exposes `owner_note`.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260622150000_add_owner_recommendation_comment/migration.sql
git commit -m "feat: store owner POI recommendation comments"
```

### Task 3: API Contract and Persistence

**Files:**
- Modify: `src/features/guide-customization/types.ts`
- Modify: `src/app/api/dashboard/lodgings/[id]/customization/route.ts`
- Modify: `src/features/guide-customization/queries/customization.ts`
- Modify: `tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts`
- Modify: `tests/unit/guide-customization.practical-blocks-save.test.ts`

- [ ] **Step 1: Replace the obsolete stripping contract with failing acceptance tests**

Replace the old `strips owner_note and owner_rating` test with:

```ts
it('AC-02-02: accepts owner_note but strips owner_rating', async () => {
  mockSaveCustomization.mockResolvedValue({
    ...responseBody,
    featured_pois: [{
      poi_id: 'poi-1',
      category_id: 'cat-1',
      owner_note: 'Notre terrasse préférée.',
      sort_order: 0,
    }],
  })

  const res = await PUT(
    makeRequest('PUT', {
      category_order: [],
      featured_pois: [{
        poi_id: 'poi-1',
        owner_note: '  Notre terrasse préférée.  ',
        owner_rating: 5,
        sort_order: 0,
      }],
    }),
    { params: Promise.resolve({ id: 'lodging-1' }) },
  )

  expect(res.status).toBe(200)
  expect(mockSaveCustomization).toHaveBeenCalledWith(
    'owner-1',
    'lodging-1',
    expect.objectContaining({
      featured_pois: [{
        poi_id: 'poi-1',
        owner_note: 'Notre terrasse préférée.',
        sort_order: 0,
      }],
    }),
  )
})

it('AC-02-04: rejects owner_note over 300 words', async () => {
  const res = await PUT(
    makeRequest('PUT', {
      category_order: [],
      featured_pois: [{
        poi_id: 'poi-1',
        owner_note: Array.from({ length: 301 }, () => 'mot').join(' '),
        sort_order: 0,
      }],
    }),
    { params: Promise.resolve({ id: 'lodging-1' }) },
  )

  expect(res.status).toBe(400)
  expect(mockSaveCustomization).not.toHaveBeenCalled()
})
```

Extend the transaction test with a selected POI and assert:

```ts
expect(tx.lodgingFeaturedPoi.upsert).toHaveBeenCalledWith({
  where: { lodging_id_poi_id: { lodging_id: 'lodging-1', poi_id: 'poi-1' } },
  update: {
    owner_note: 'Notre terrasse préférée.',
    sort_order: 0,
    deleted_at: null,
  },
  create: {
    lodging_id: 'lodging-1',
    poi_id: 'poi-1',
    owner_note: 'Notre terrasse préférée.',
    sort_order: 0,
  },
})
```

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
npm test -- tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts tests/unit/guide-customization.practical-blocks-save.test.ts --runInBand
```

Expected: FAIL because the API removes `owner_note` and the query does not persist it.

- [ ] **Step 3: Extend feature types**

Update:

```ts
export interface FeaturedPoiInput {
  poi_id: string
  owner_note?: string | null
  sort_order: number
}

export interface FeaturedPoiResponse {
  poi_id: string
  category_id: string
  owner_note: string | null
  sort_order: number
}
```

- [ ] **Step 4: Extend the Zod contract**

Import `OWNER_NOTE_MAX_WORDS`, then define:

```ts
const ownerNoteSchema = z
  .string()
  .transform(value => normalizeOwnerNote(value))
  .refine(value => value === null || countWords(value) <= OWNER_NOTE_MAX_WORDS, {
    message: `Le commentaire ne doit pas dépasser ${OWNER_NOTE_MAX_WORDS} mots`,
  })
  .nullable()
  .optional()
  .transform(value => normalizeOwnerNote(value))

const featuredPoiSchema = z.object({
  poi_id: z.string().min(1),
  owner_note: ownerNoteSchema,
  sort_order: z.number().int().min(0),
})
```

Do not add `owner_rating` to the schema. Zod's default object behavior strips that unknown key.

- [ ] **Step 5: Read and persist the normalized field**

In `getLodgingCustomization`, select and map:

```ts
select: {
  poi_id: true,
  owner_note: true,
  sort_order: true,
  poi: { select: { category_id: true } },
}
```

```ts
featured_pois: featuredPois.map(featuredPoi => ({
  poi_id: featuredPoi.poi_id,
  category_id: featuredPoi.poi.category_id,
  owner_note: featuredPoi.owner_note,
  sort_order: featuredPoi.sort_order,
})),
```

In `validateFeaturedPois`:

```ts
return {
  poi_id: row.id,
  category_id: row.category_id,
  owner_note: normalizeOwnerNote(requested.owner_note),
  sort_order: requested.sort_order,
}
```

In the upsert:

```ts
update: {
  owner_note: featuredPoi.owner_note,
  sort_order: featuredPoi.sort_order,
  deleted_at: null,
},
create: {
  lodging_id: lodgingId,
  poi_id: featuredPoi.poi_id,
  owner_note: featuredPoi.owner_note,
  sort_order: featuredPoi.sort_order,
},
```

Do not expose `owner_note` from `getPublicCustomization`; this prevents propagation into general Guide queries.

- [ ] **Step 6: Run focused tests and verify success**

Run:

```bash
npm test -- tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts tests/unit/guide-customization.practical-blocks-save.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/guide-customization/types.ts src/app/api/dashboard/lodgings/[id]/customization/route.ts src/features/guide-customization/queries/customization.ts tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts tests/unit/guide-customization.practical-blocks-save.test.ts
git commit -m "feat: persist owner recommendation comments"
```

### Task 4: Owner Form and Word Counter

**Files:**
- Modify: `src/features/guide-customization/components/CustomizationForm.tsx`
- Create: `tests/unit/guide-customization.owner-note-form.test.tsx`

- [ ] **Step 1: Write failing component tests**

Create the test file with these imports, mocks, fixture and render helper:

```tsx
/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomizationForm } from '@/features/guide-customization/components/CustomizationForm'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string
    children: React.ReactNode
  }) => <a href={href}>{children}</a>,
}))

jest.mock('@/shared/components/ImageUpload', () => ({
  ImageUpload: () => <div data-testid="image-upload" />,
}))

const baseCustomization = {
  lodging_id: 'lodging-1',
  welcome_message: null,
  category_order: ['restaurants'],
  featured_pois: [{
    poi_id: 'poi-1',
    category_id: 'cat-1',
    owner_note: null,
    sort_order: 0,
  }],
  ignored_category_slugs: [],
  cover_photo_url: null,
  lodging_address: null,
  wifi_ssid: null,
  wifi_password: null,
  parking_info: null,
  equipment_info: null,
  checkout_instructions: null,
  trash_info: null,
  trash_location: null,
  house_rules: null,
  emergency_contacts: null,
  useful_services: null,
  practical_blocks: [],
}

function renderSelectedPoi() {
  return render(
    <CustomizationForm
      lodgingId="lodging-1"
      citySlug="saint-gervais"
      categories={[{
        id: 'cat-1',
        name: 'Restaurants',
        slug: 'restaurants',
        sort_order: 0,
      }]}
      pois={[{
        id: 'poi-1',
        name: 'Bistrot du Centre',
        category_id: 'cat-1',
        category_slug: 'restaurants',
        category_name: 'Restaurants',
      }]}
      initialCustomization={baseCustomization}
    />,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      ...baseCustomization,
      featured_pois: [{
        ...baseCustomization.featured_pois[0],
        owner_note: 'Une adresse chaleureuse après la randonnée.',
      }],
    }),
  }) as jest.Mock
})
```

```tsx
it('AC-02-04: shows and submits a word-counted comment for a selected POI', async () => {
  const user = userEvent.setup()
  renderSelectedPoi()

  await user.click(screen.getByText('Restaurants'))
  const textarea = screen.getByLabelText(/votre mot pour les voyageurs/i)
  await user.type(textarea, 'Une adresse chaleureuse après la randonnée.')
  expect(screen.getByText('6 / 300 mots')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /enregistrer/i }))
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  const payload = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
  expect(payload.featured_pois[0].owner_note).toBe(
    'Une adresse chaleureuse après la randonnée.',
  )
})

it('AC-02-04: disables save above 300 words', async () => {
  const user = userEvent.setup()
  renderSelectedPoi()

  await user.click(screen.getByText('Restaurants'))
  const textarea = screen.getByLabelText(/votre mot pour les voyageurs/i)
  fireEvent.change(textarea, {
    target: { value: Array.from({ length: 301 }, () => 'mot').join(' ') },
  })

  expect(screen.getByText('301 / 300 mots')).toHaveClass('text-rose-500')
  expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled()
})
```

- [ ] **Step 2: Run the component test and verify failure**

Run:

```bash
npm test -- tests/unit/guide-customization.owner-note-form.test.tsx --runInBand
```

Expected: FAIL because no comment textarea or counter exists.

- [ ] **Step 3: Restore comment state and helpers**

When initializing and refreshing `featuredPois`, preserve:

```ts
owner_note: featuredPoi.owner_note,
```

Add:

```ts
const featuredByPoiId = new Map(
  featuredPois.map(featuredPoi => [featuredPoi.poi_id, featuredPoi]),
)
const ownerNoteOverLimit = featuredPois.some(
  featuredPoi => countWords(featuredPoi.owner_note ?? '') > OWNER_NOTE_MAX_WORDS,
)

function updateOwnerNote(poiId: string, ownerNote: string) {
  setFeaturedPois(current =>
    current.map(featuredPoi =>
      featuredPoi.poi_id === poiId
        ? { ...featuredPoi, owner_note: ownerNote }
        : featuredPoi,
    ),
  )
}
```

New selections use:

```ts
return [...current, {
  poi_id: poiId,
  owner_note: null,
  sort_order: current.length,
}]
```

The PUT payload uses:

```ts
owner_note: normalizeOwnerNote(featuredPoi.owner_note),
```

- [ ] **Step 4: Add the textarea and counter**

Inside each selected POI card:

```tsx
{featuredPoi && (
  <div className="mt-5 border-t border-gray-100 pt-5">
    <Label
      htmlFor={`owner-note-${poi.id}`}
      className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400"
    >
      Votre mot pour les voyageurs
    </Label>
    <Textarea
      id={`owner-note-${poi.id}`}
      value={featuredPoi.owner_note ?? ''}
      onChange={event => updateOwnerNote(poi.id, event.target.value)}
      placeholder="Pourquoi recommandez-vous cette adresse ?"
      className="mt-2 min-h-[88px] resize-none"
    />
    <p
      className={`mt-2 text-right text-[11px] font-medium ${
        countWords(featuredPoi.owner_note ?? '') > OWNER_NOTE_MAX_WORDS
          ? 'text-rose-500'
          : 'text-gray-400'
      }`}
    >
      {countWords(featuredPoi.owner_note ?? '')} / {OWNER_NOTE_MAX_WORDS} mots
    </p>
  </div>
)}
```

Disable save with:

```tsx
disabled={status === 'saving' || welcomeOverLimit || ownerNoteOverLimit}
```

- [ ] **Step 5: Run component tests**

Run:

```bash
npm test -- tests/unit/guide-customization.owner-note-form.test.tsx tests/unit/guide-customization.customization-form-blocks.test.tsx --runInBand
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/guide-customization/components/CustomizationForm.tsx tests/unit/guide-customization.owner-note-form.test.tsx
git commit -m "feat: add owner recommendation comment editor"
```

### Task 5: Dedicated Public Rendering

**Files:**
- Modify: `src/app/(public)/nos-recommandations/page.tsx`
- Modify: `tests/integration/guide-customization.recommendations-page.test.tsx`
- Test: `tests/integration/categories.AC-01-02.poi-card-renders.test.tsx`

- [ ] **Step 1: Write failing public rendering tests**

Add `owner_note` to the mocked row:

```ts
owner_note: 'Notre choix pour un dîner calme en terrasse.',
```

Assert:

```ts
expect(
  screen.getByText('Notre choix pour un dîner calme en terrasse.'),
).toBeInTheDocument()
```

Add a second test with `owner_note: null`:

```ts
expect(screen.queryByTestId('owner-recommendation-comment')).not.toBeInTheDocument()
```

- [ ] **Step 2: Run the recommendations test and verify failure**

Run:

```bash
npm test -- tests/integration/guide-customization.recommendations-page.test.tsx --runInBand
```

Expected: FAIL because `owner_note` is neither selected nor rendered.

- [ ] **Step 3: Select and render only on `/nos-recommandations`**

Select:

```ts
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
    },
  },
}
```

Extend `FeaturedRow`:

```ts
type FeaturedRow = {
  poi_id: string
  owner_note: string | null
  poi: {
    id: string
    name: string
    slug: string
    description: string | null
    photos: string[]
    category: { name: string; slug: string }
  }
}
```

Render before the generic POI description:

```tsx
{item.owner_note && (
  <p
    data-testid="owner-recommendation-comment"
    className="mt-1 text-sm font-medium leading-relaxed text-charcoal"
  >
    {item.owner_note}
  </p>
)}
```

Keep JSX text interpolation only. Do not use `MarkdownText`, `dangerouslySetInnerHTML`, or `react-markdown`.

- [ ] **Step 4: Run public and general POI regression tests**

Run:

```bash
npm test -- tests/integration/guide-customization.recommendations-page.test.tsx tests/integration/categories.AC-01-02.poi-card-renders.test.tsx tests/unit/guide-customization.AC-02-01-02-03.poi-featured-order.test.ts --runInBand
```

Expected: PASS, proving the comment appears on the dedicated page and general POI behavior remains unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/app/(public)/nos-recommandations/page.tsx tests/integration/guide-customization.recommendations-page.test.tsx
git commit -m "feat: show owner comments on personal recommendations"
```

### Task 6: Traceability and Full Verification

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Update spec-to-code traceability**

Replace the obsolete AC-02-02 row with:

```markdown
| AC-02-02 | Commentaire Owner sauvegardé et affiché uniquement dans `/nos-recommandations` | `prisma/schema.prisma`<br>`src/app/api/dashboard/lodgings/[id]/customization/route.ts`<br>`src/features/guide-customization/queries/customization.ts`<br>`src/features/guide-customization/components/CustomizationForm.tsx`<br>`src/app/(public)/nos-recommandations/page.tsx` | `tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts`<br>`tests/unit/guide-customization.practical-blocks-save.test.ts`<br>`tests/unit/guide-customization.owner-note-form.test.tsx`<br>`tests/integration/guide-customization.recommendations-page.test.tsx` | ✅ done |
| AC-02-04/BR-15 | Compteur 300 mots, rejet serveur, trim vers `null` et rendu texte simple | `src/features/guide-customization/lib/validation.ts`<br>`src/app/api/dashboard/lodgings/[id]/customization/route.ts`<br>`src/features/guide-customization/components/CustomizationForm.tsx`<br>`src/app/(public)/nos-recommandations/page.tsx` | `tests/unit/guide-customization.welcome-words.test.ts`<br>`tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts`<br>`tests/unit/guide-customization.owner-note-form.test.tsx`<br>`tests/integration/guide-customization.recommendations-page.test.tsx` | ✅ done |
```

- [ ] **Step 2: Run all feature tests**

Run:

```bash
npm test -- \
  tests/unit/guide-customization.welcome-words.test.ts \
  tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts \
  tests/unit/guide-customization.practical-blocks-save.test.ts \
  tests/unit/guide-customization.owner-note-form.test.tsx \
  tests/unit/guide-customization.customization-form-blocks.test.tsx \
  tests/integration/guide-customization.recommendations-page.test.tsx \
  tests/integration/categories.AC-01-02.poi-card-renders.test.tsx \
  tests/unit/guide-customization.AC-02-01-02-03.poi-featured-order.test.ts \
  --runInBand
```

Expected: all suites PASS.

- [ ] **Step 3: Validate Prisma and production build**

Run:

```bash
npx prisma validate
npx prisma generate
npm run build
```

Expected: Prisma validation/generation and Next.js production build succeed.

- [ ] **Step 4: Check diff hygiene**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only intended source, migration, tests, and traceability changes remain.

- [ ] **Step 5: Commit traceability**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace owner recommendation comments"
```
