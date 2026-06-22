# Blocs « Infos pratiques » personnalisés — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'owner d'ajouter des blocs libres (titre + texte markdown + icône + photo optionnelle) dans la section « Infos pratiques » de son logement (`/le-logement`), affichés après les sections fixes et réordonnables entre eux.

**Architecture:** Nouvelle table `LodgingPracticalBlock` (1-N avec `Lodging`, comme `LodgingFeaturedPoi`). Les blocs voyagent dans le payload du formulaire de customization existant avec sémantique de remplacement complet (soft-delete + recréation en transaction). Un module pur normalise/réordonne les blocs ; un catalogue d'icônes Lucide prédéfini alimente le sélecteur et la validation.

**Tech Stack:** Next.js (App Router, RSC) + TypeScript, Prisma/PostgreSQL, Zod, Tailwind, dnd-kit, Jest + Testing Library.

## Global Constraints

- Table : `LodgingPracticalBlock { id, created_at, updated_at, deleted_at, lodging_id, title, body?, icon, photo_url?, sort_order }`, `@@index([lodging_id, deleted_at])`.
- Relation inverse sur `model Lodging` : `practical_blocks LodgingPracticalBlock[]`.
- DB injoignable depuis le sandbox : `npx prisma generate` fonctionne hors-ligne ; le DDL live (migration) doit être appliqué par l'utilisateur. Ne PAS exécuter `prisma migrate dev` (échoue sans DB) — la migration SQL est écrite à la main.
- Icône : slug ∈ `PRACTICAL_BLOCK_ICON_SLUGS` (catalogue) ; défaut `DEFAULT_PRACTICAL_BLOCK_ICON = 'info'` ; rendu via `CategoryIcon` (`@/features/city-guide/lib/category-icon`).
- Contraintes de bloc : `title` requis, trim, 1–120 ; `body` markdown ≤ 4000, nullé si vide ; `photo_url` URL valide ou vide→null ; `sort_order` réindexé par position (l'ordre client fait foi).
- Édition : pas de nouvel endpoint CRUD. Les blocs sont dans le payload `PUT /api/dashboard/lodgings/[id]/customization`. La photo réutilise `ImageUpload` + endpoint existant `POST /api/dashboard/lodgings/[id]/cover-photo`.
- Placement public : après les sections fixes ; pas de mélange d'ordre avec les sections fixes ; 1 photo max par bloc.

---

### Task 1: Modèle Prisma + migration

**Files:**
- Modify: `prisma/schema.prisma` (model `LodgingPracticalBlock` + relation sur `Lodging`)
- Create: `prisma/migrations/20260622120000_add_lodging_practical_block/migration.sql`

**Interfaces:**
- Produces: table/modèle Prisma `LodgingPracticalBlock` et l'accès client `prisma.lodgingPracticalBlock` (utilisé par Tasks 5 & 6).

- [ ] **Step 1: Ajouter le modèle au schéma**

Dans `prisma/schema.prisma`, ajouter à la fin du fichier :

```prisma
model LodgingPracticalBlock {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  lodging_id  String
  lodging     Lodging   @relation(fields: [lodging_id], references: [id])
  title       String
  body        String?
  icon        String
  photo_url   String?
  sort_order  Int       @default(0)

  @@index([lodging_id, deleted_at])
}
```

- [ ] **Step 2: Ajouter la relation inverse sur `Lodging`**

Dans `model Lodging`, sous la ligne `featured_pois LodgingFeaturedPoi[]`, ajouter :

```prisma
  practical_blocks LodgingPracticalBlock[]
```

- [ ] **Step 3: Formater et valider le schéma**

Run: `npx prisma format && npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀` (aucune erreur).

- [ ] **Step 4: Générer le client (hors-ligne)**

Run: `npx prisma generate`
Expected: `Generated Prisma Client` sans erreur (ne nécessite pas de DB).

- [ ] **Step 5: Écrire la migration SQL à la main**

Créer `prisma/migrations/20260622120000_add_lodging_practical_block/migration.sql` :

```sql
-- CreateTable
CREATE TABLE "LodgingPracticalBlock" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "lodging_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "icon" TEXT NOT NULL,
    "photo_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LodgingPracticalBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LodgingPracticalBlock_lodging_id_deleted_at_idx" ON "LodgingPracticalBlock"("lodging_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "LodgingPracticalBlock" ADD CONSTRAINT "LodgingPracticalBlock_lodging_id_fkey" FOREIGN KEY ("lodging_id") REFERENCES "Lodging"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur (le client régénéré expose `prisma.lodgingPracticalBlock`).

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260622120000_add_lodging_practical_block
git commit -m "feat(db): add LodgingPracticalBlock model + migration

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

⚠️ Note pour l'exécuteur : le DDL devra être appliqué sur la base par l'utilisateur (sandbox sans accès DB).

---

### Task 2: Catalogue d'icônes + types

**Files:**
- Create: `src/features/guide-customization/lib/practical-block-icons.ts`
- Modify: `src/features/guide-customization/types.ts`
- Test: `tests/unit/guide-customization.practical-block-icons.test.ts`

**Interfaces:**
- Produces:
  - `PRACTICAL_BLOCK_ICONS: readonly { slug: string; label: string }[]`, `PRACTICAL_BLOCK_ICON_SLUGS: ReadonlyArray<string>`, `DEFAULT_PRACTICAL_BLOCK_ICON: string` (consommés par Tasks 4, 7).
  - Types `PracticalBlockInput { id?: string; title: string; body: string | null; icon: string; photo_url: string | null; sort_order: number }` et `PracticalBlockResponse { id: string; title: string; body: string | null; icon: string; photo_url: string | null; sort_order: number }` ; `practical_blocks?` sur `LodgingCustomizationInput`, `practical_blocks` sur `LodgingCustomizationResponse` (consommés par Tasks 3, 4, 5, 6, 7, 8).

- [ ] **Step 1: Écrire le test du catalogue (échoue)**

Créer `tests/unit/guide-customization.practical-block-icons.test.ts` :

```ts
import {
  PRACTICAL_BLOCK_ICONS,
  PRACTICAL_BLOCK_ICON_SLUGS,
  DEFAULT_PRACTICAL_BLOCK_ICON,
} from '@/features/guide-customization/lib/practical-block-icons'

describe('practical block icon catalog', () => {
  it('exposes a non-empty catalog with unique slugs and labels', () => {
    expect(PRACTICAL_BLOCK_ICONS.length).toBeGreaterThan(0)
    const slugs = PRACTICAL_BLOCK_ICONS.map(i => i.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(PRACTICAL_BLOCK_ICONS.every(i => i.label.trim().length > 0)).toBe(true)
  })

  it('derives the slug list from the catalog', () => {
    expect(PRACTICAL_BLOCK_ICON_SLUGS).toEqual(PRACTICAL_BLOCK_ICONS.map(i => i.slug))
  })

  it('uses a default icon that exists in the catalog', () => {
    expect(PRACTICAL_BLOCK_ICON_SLUGS).toContain(DEFAULT_PRACTICAL_BLOCK_ICON)
  })
})
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npx jest tests/unit/guide-customization.practical-block-icons.test.ts`
Expected: FAIL — `Cannot find module '.../practical-block-icons'`.

- [ ] **Step 3: Créer le module catalogue**

Créer `src/features/guide-customization/lib/practical-block-icons.ts` :

```ts
export interface PracticalBlockIcon {
  /** Slug kebab-case d'une icône Lucide (rendu via CategoryIcon). */
  slug: string
  /** Libellé FR affiché dans le sélecteur. */
  label: string
}

export const PRACTICAL_BLOCK_ICONS: readonly PracticalBlockIcon[] = [
  { slug: 'info', label: 'Information' },
  { slug: 'star', label: 'À ne pas manquer' },
  { slug: 'utensils', label: 'Restauration' },
  { slug: 'bed', label: 'Couchage' },
  { slug: 'bath', label: 'Salle de bain' },
  { slug: 'tv', label: 'Multimédia' },
  { slug: 'thermometer', label: 'Chauffage' },
  { slug: 'key', label: 'Accès / clés' },
  { slug: 'dog', label: 'Animaux' },
  { slug: 'baby', label: 'Enfants' },
  { slug: 'leaf', label: 'Tri / écologie' },
  { slug: 'map-pin', label: 'Lieu' },
] as const

export const PRACTICAL_BLOCK_ICON_SLUGS: ReadonlyArray<string> =
  PRACTICAL_BLOCK_ICONS.map(icon => icon.slug)

export const DEFAULT_PRACTICAL_BLOCK_ICON = 'info'
```

- [ ] **Step 4: Lancer le test (passe)**

Run: `npx jest tests/unit/guide-customization.practical-block-icons.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Ajouter les types**

Dans `src/features/guide-customization/types.ts`, ajouter après l'interface `FeaturedPoiResponse` :

```ts
export interface PracticalBlockInput {
  id?: string
  title: string
  body: string | null
  icon: string
  photo_url: string | null
  sort_order: number
}

export interface PracticalBlockResponse {
  id: string
  title: string
  body: string | null
  icon: string
  photo_url: string | null
  sort_order: number
}
```

Dans la même fichier, modifier `LodgingCustomizationInput` pour ajouter la propriété :

```ts
export interface LodgingCustomizationInput extends PracticalInfoInput {
  welcome_message?: string | null
  category_order: string[]
  featured_pois: FeaturedPoiInput[]
  practical_blocks?: PracticalBlockInput[]
}
```

et `LodgingCustomizationResponse` pour ajouter :

```ts
export interface LodgingCustomizationResponse extends PracticalInfoFields {
  lodging_id: string
  welcome_message: string | null
  category_order: string[]
  featured_pois: FeaturedPoiResponse[]
  ignored_category_slugs: string[]
  practical_blocks: PracticalBlockResponse[]
}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: des erreurs sont attendues là où `LodgingCustomizationResponse` est construit sans `practical_blocks` (queries customization) — elles seront résolues en Task 5. Vérifier qu'AUCUNE erreur n'apparaît dans `practical-block-icons.ts` ni `types.ts` eux-mêmes. (Si tu préfères un typecheck vert ici, cette task peut être committée et Task 5 enchaînée immédiatement ; ne PAS « réparer » les queries dans cette task.)

- [ ] **Step 7: Commit**

```bash
git add src/features/guide-customization/lib/practical-block-icons.ts \
        src/features/guide-customization/types.ts \
        tests/unit/guide-customization.practical-block-icons.test.ts
git commit -m "feat(guide-customization): practical-block icon catalog + types

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Normaliseur pur des blocs

**Files:**
- Modify: `src/features/guide-customization/lib/validation.ts`
- Test: `tests/unit/guide-customization.practical-blocks-normalize.test.ts`

**Interfaces:**
- Consumes: `PracticalBlockInput` (Task 2).
- Produces: `normalizePracticalBlocks(blocks: PracticalBlockInput[] | undefined): NormalizedPracticalBlock[]` où `NormalizedPracticalBlock = { title: string; body: string | null; icon: string; photo_url: string | null; sort_order: number }` (consommé par Task 5).

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/unit/guide-customization.practical-blocks-normalize.test.ts` :

```ts
import { normalizePracticalBlocks } from '@/features/guide-customization/lib/validation'

describe('normalizePracticalBlocks', () => {
  it('trims titles, nulls empty body/photo, drops untitled blocks, reindexes sort_order', () => {
    const result = normalizePracticalBlocks([
      { title: '  Plage  ', body: 'À 5 min', icon: 'star', photo_url: '', sort_order: 9 },
      { title: '   ', body: 'orphan', icon: 'info', photo_url: null, sort_order: 3 },
      { title: 'Vélos', body: '   ', icon: 'bike', photo_url: 'https://x/y.webp', sort_order: 1 },
    ])

    expect(result).toEqual([
      { title: 'Plage', body: 'À 5 min', icon: 'star', photo_url: null, sort_order: 0 },
      { title: 'Vélos', body: null, icon: 'bike', photo_url: 'https://x/y.webp', sort_order: 1 },
    ])
  })

  it('returns [] for undefined or empty input', () => {
    expect(normalizePracticalBlocks(undefined)).toEqual([])
    expect(normalizePracticalBlocks([])).toEqual([])
  })
})
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npx jest tests/unit/guide-customization.practical-blocks-normalize.test.ts`
Expected: FAIL — `normalizePracticalBlocks is not a function` / import introuvable.

- [ ] **Step 3: Implémenter le normaliseur**

Dans `src/features/guide-customization/lib/validation.ts`, ajouter en haut un import de type :

```ts
import type { PracticalBlockInput } from '../types'
```

puis, à la fin du fichier :

```ts
export interface NormalizedPracticalBlock {
  title: string
  body: string | null
  icon: string
  photo_url: string | null
  sort_order: number
}

/**
 * Nettoie et réordonne les blocs « Infos pratiques » personnalisés.
 * - rejette les blocs sans titre (après trim),
 * - trim le titre, nulle body/photo_url vides,
 * - réindexe sort_order par la position dans le tableau (l'ordre client fait foi).
 */
export function normalizePracticalBlocks(
  blocks: PracticalBlockInput[] | undefined,
): NormalizedPracticalBlock[] {
  if (!blocks || blocks.length === 0) return []
  const clean = (value: string | null | undefined): string | null =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : null

  return blocks
    .filter(block => clean(block.title) !== null)
    .map((block, index) => ({
      title: clean(block.title) as string,
      body: clean(block.body),
      icon: block.icon,
      photo_url: clean(block.photo_url),
      sort_order: index,
    }))
}
```

- [ ] **Step 4: Lancer le test (passe)**

Run: `npx jest tests/unit/guide-customization.practical-blocks-normalize.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/guide-customization/lib/validation.ts \
        tests/unit/guide-customization.practical-blocks-normalize.test.ts
git commit -m "feat(guide-customization): normalizePracticalBlocks helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Schéma Zod `practical_blocks` (route customization)

**Files:**
- Modify: `src/app/api/dashboard/lodgings/[id]/customization/route.ts`
- Modify (test existant): `tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts`

**Interfaces:**
- Consumes: `PRACTICAL_BLOCK_ICON_SLUGS` (Task 2).
- Produces: la route accepte et transmet `practical_blocks` à `saveLodgingCustomization` ; un payload sans blocs reçoit `practical_blocks: []` (défaut Zod).

- [ ] **Step 1: Mettre à jour le test de contrat existant (le faire échouer d'abord)**

Dans `tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts`, dans le test `AC-01-01`, l'assertion actuelle `expect(mockSaveCustomization).toHaveBeenCalledWith('owner-1', 'lodging-1', { welcome_message: 'Bienvenue au chalet', category_order: ['restaurants'], featured_pois: [] })` doit devenir :

```ts
    expect(mockSaveCustomization).toHaveBeenCalledWith('owner-1', 'lodging-1', {
      welcome_message: 'Bienvenue au chalet',
      category_order: ['restaurants'],
      featured_pois: [],
      practical_blocks: [],
    })
```

Puis ajouter, à la fin du `describe`, deux nouveaux tests :

```ts
  it('forwards valid practical_blocks to the save query', async () => {
    mockSaveCustomization.mockResolvedValue(responseBody)

    const res = await PUT(
      makeRequest('PUT', {
        category_order: [],
        featured_pois: [],
        practical_blocks: [
          { title: 'La plage', body: 'À 5 min à pied', icon: 'star', photo_url: '', sort_order: 0 },
        ],
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockSaveCustomization).toHaveBeenCalledWith(
      'owner-1',
      'lodging-1',
      expect.objectContaining({
        practical_blocks: [
          { title: 'La plage', body: 'À 5 min à pied', icon: 'star', photo_url: null, sort_order: 0 },
        ],
      }),
    )
  })

  it('rejects a practical block with an icon outside the catalog', async () => {
    const res = await PUT(
      makeRequest('PUT', {
        category_order: [],
        featured_pois: [],
        practical_blocks: [
          { title: 'X', body: null, icon: 'not-a-real-icon', photo_url: null, sort_order: 0 },
        ],
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(400)
    expect(mockSaveCustomization).not.toHaveBeenCalled()
  })
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npx jest tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts`
Expected: FAIL — `practical_blocks` absent du payload transmis / icône invalide non rejetée (400 attendu, 200 obtenu).

- [ ] **Step 3: Étendre le schéma Zod de la route**

Dans `src/app/api/dashboard/lodgings/[id]/customization/route.ts` :

a) Ajouter l'import en haut :

```ts
import { PRACTICAL_BLOCK_ICON_SLUGS } from '@/features/guide-customization/lib/practical-block-icons'
```

b) Avant `const customizationSchema = z.object({`, ajouter :

```ts
const practicalBlockSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  body: z
    .string()
    .max(4000)
    .nullable()
    .optional()
    .transform(value => (value && value.trim().length > 0 ? value : null)),
  icon: z
    .string()
    .trim()
    .refine(value => PRACTICAL_BLOCK_ICON_SLUGS.includes(value), { message: 'Icône inconnue' }),
  photo_url: z
    .union([
      z.string().trim().url(),
      z.string().trim().length(0).transform(() => null),
      z.null(),
    ])
    .optional()
    .transform(value => value ?? null),
  sort_order: z.number().int().min(0),
})
```

c) À l'intérieur de `customizationSchema`, après la ligne `useful_services: practicalText(4000),`, ajouter :

```ts
  practical_blocks: z.array(practicalBlockSchema).default([]),
```

- [ ] **Step 4: Lancer le test (passe)**

Run: `npx jest tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts`
Expected: PASS (tous les tests du fichier, y compris les 2 nouveaux).

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/dashboard/lodgings/[id]/customization/route.ts" \
        tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts
git commit -m "feat(api): accept practical_blocks in lodging customization payload

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Persistance (save + get) des blocs

**Files:**
- Modify: `src/features/guide-customization/queries/customization.ts`
- Test: `tests/unit/guide-customization.practical-blocks-save.test.ts`

**Interfaces:**
- Consumes: `normalizePracticalBlocks` (Task 3), `prisma.lodgingPracticalBlock` (Task 1), types `PracticalBlockResponse` (Task 2).
- Produces: `saveLodgingCustomization` et `getLodgingCustomization` renvoient `practical_blocks: PracticalBlockResponse[]` triés par `sort_order`. La sauvegarde fait un remplacement complet (soft-delete + recréation).

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/unit/guide-customization.practical-blocks-save.test.ts` :

```ts
const tx = {
  lodgingCustomization: { upsert: jest.fn() },
  lodgingFeaturedPoi: { updateMany: jest.fn(), upsert: jest.fn() },
  lodgingPracticalBlock: { updateMany: jest.fn(), create: jest.fn() },
}

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    category: { findMany: jest.fn() },
    pointOfInterest: { findMany: jest.fn() },
    lodgingFeaturedPoi: { findMany: jest.fn() },
    lodgingPracticalBlock: { findMany: jest.fn() },
    $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { saveLodgingCustomization } from '@/features/guide-customization/queries/customization'

describe('saveLodgingCustomization — practical blocks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({
      id: 'lodging-1',
      owner_id: 'owner-1',
      city_id: 'city-1',
      city: { latitude: 45, longitude: 6 },
    } as never)
    jest.mocked(prisma.category.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([
      { id: 'b1', title: 'La plage', body: 'À 5 min', icon: 'star', photo_url: null, sort_order: 0 },
    ] as never)
  })

  it('soft-deletes existing blocks then recreates one row per normalized block', async () => {
    const result = await saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [],
      practical_blocks: [
        { title: '  La plage  ', body: 'À 5 min', icon: 'star', photo_url: '', sort_order: 7 },
        { title: '', body: 'orphan', icon: 'info', photo_url: null, sort_order: 2 },
      ],
    })

    expect(tx.lodgingPracticalBlock.updateMany).toHaveBeenCalledWith({
      where: { lodging_id: 'lodging-1', deleted_at: null },
      data: { deleted_at: expect.any(Date) },
    })
    expect(tx.lodgingPracticalBlock.create).toHaveBeenCalledTimes(1)
    expect(tx.lodgingPracticalBlock.create).toHaveBeenCalledWith({
      data: {
        lodging_id: 'lodging-1',
        title: 'La plage',
        body: 'À 5 min',
        icon: 'star',
        photo_url: null,
        sort_order: 0,
      },
    })
    expect(result.practical_blocks).toEqual([
      { id: 'b1', title: 'La plage', body: 'À 5 min', icon: 'star', photo_url: null, sort_order: 0 },
    ])
  })
})
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npx jest tests/unit/guide-customization.practical-blocks-save.test.ts`
Expected: FAIL — `tx.lodgingPracticalBlock.updateMany` jamais appelé / `result.practical_blocks` undefined.

- [ ] **Step 3: Brancher la persistance**

Dans `src/features/guide-customization/queries/customization.ts` :

a) Ajouter à l'import depuis `../lib/validation` la fonction `normalizePracticalBlocks` (ajouter le nom à l'import existant `{ filterValidCategoryOrder, groupFeaturedPoisByCategory, isPoiWithinGuideScope }`) et à l'import de types `PracticalBlockResponse`.

b) Dans `getLodgingCustomization`, avant le `return`, ajouter la lecture des blocs :

```ts
  const practicalBlocks = await prisma.lodgingPracticalBlock.findMany({
    where: { lodging_id: lodgingId, deleted_at: null },
    orderBy: { sort_order: 'asc' },
    select: { id: true, title: true, body: true, icon: true, photo_url: true, sort_order: true },
  })
```

et ajouter `practical_blocks: practicalBlocks,` dans l'objet retourné.

c) Dans `saveLodgingCustomization`, après `const practicalInfo = pickPracticalInfo(input)`, ajouter :

```ts
  const practicalBlocks = normalizePracticalBlocks(input.practical_blocks)
```

d) Dans la transaction (`prisma.$transaction(async tx => { ... })`), après la boucle `for (const featuredPoi of featuredPois)`, ajouter :

```ts
    await tx.lodgingPracticalBlock.updateMany({
      where: { lodging_id: lodgingId, deleted_at: null },
      data: { deleted_at: new Date() },
    })

    for (const block of practicalBlocks) {
      await tx.lodgingPracticalBlock.create({
        data: {
          lodging_id: lodgingId,
          title: block.title,
          body: block.body,
          icon: block.icon,
          photo_url: block.photo_url,
          sort_order: block.sort_order,
        },
      })
    }
```

e) Après le `await prisma.$transaction(...)` (donc hors transaction), avant le `return`, relire les blocs persistés :

```ts
  const savedBlocks = await prisma.lodgingPracticalBlock.findMany({
    where: { lodging_id: lodgingId, deleted_at: null },
    orderBy: { sort_order: 'asc' },
    select: { id: true, title: true, body: true, icon: true, photo_url: true, sort_order: true },
  })
```

et ajouter `practical_blocks: savedBlocks,` dans l'objet retourné par `saveLodgingCustomization`.

- [ ] **Step 4: Lancer le test (passe)**

Run: `npx jest tests/unit/guide-customization.practical-blocks-save.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Non-régression + typecheck**

Run: `npx jest tests/unit/guide-customization.AC-02-01-02-03.poi-featured-order.test.ts tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts && npx tsc --noEmit`
Expected: suites vertes ; `tsc` sans erreur (les `LodgingCustomizationResponse` incluent désormais `practical_blocks`).

- [ ] **Step 6: Commit**

```bash
git add src/features/guide-customization/queries/customization.ts \
        tests/unit/guide-customization.practical-blocks-save.test.ts
git commit -m "feat(guide-customization): persist practical blocks (replace-all)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Rendu public sur /le-logement

**Files:**
- Modify: `src/app/(public)/le-logement/page.tsx`
- Test: `tests/integration/le-logement.practical-blocks.test.tsx`

**Interfaces:**
- Consumes: `prisma.lodgingPracticalBlock` (Task 1), `CategoryIcon` (`@/features/city-guide/lib/category-icon`), `MarkdownText` (`@/shared/components/MarkdownText`).
- Produces: les blocs s'affichent après les sections fixes ; `hasContent` est vrai si une section fixe OU au moins un bloc a du contenu.

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/integration/le-logement.practical-blocks.test.tsx` :

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import LeLogementPage from '@/app/(public)/le-logement/page'
import { prisma } from '@/shared/lib/prisma'

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => ({
    lodgingId: 'lodging-1',
    lodgingName: 'Chalet MyStay',
    citySlug: 'saint-gervais',
    cityName: 'Saint-Gervais-les-Bains',
    ownerName: 'Alice Martin',
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodgingCustomization: { findFirst: jest.fn() },
    lodgingPracticalBlock: { findMany: jest.fn() },
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

describe('/le-logement — blocs personnalisés', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders custom blocks after the fixed sections, with markdown and photo', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      lodging_address: '1 rue des Alpes',
      wifi_ssid: null, wifi_password: null, parking_info: null, equipment_info: null,
      checkout_instructions: null, trash_info: null, trash_location: null,
      house_rules: null, emergency_contacts: null, useful_services: null,
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([
      { id: 'b1', title: 'La plage', body: 'À **5 min** à pied', icon: 'star', photo_url: 'https://cdn.test/plage.webp', sort_order: 0 },
    ] as never)

    render(await LeLogementPage())

    expect(screen.getByText('La plage')).toBeInTheDocument()
    expect(screen.getByText(/5 min/)).toBeInTheDocument()
    expect(screen.getByAltText('La plage')).toHaveAttribute('src', 'https://cdn.test/plage.webp')
  })

  it('treats blocks as content (no empty state when only blocks exist)', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue(null as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([
      { id: 'b1', title: 'Bons plans', body: null, icon: 'info', photo_url: null, sort_order: 0 },
    ] as never)

    render(await LeLogementPage())

    expect(screen.getByText('Bons plans')).toBeInTheDocument()
    expect(screen.queryByText(/n'a pas encore renseigné/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npx jest tests/integration/le-logement.practical-blocks.test.tsx`
Expected: FAIL — `prisma.lodgingPracticalBlock.findMany is not a function` ou bloc non rendu.

- [ ] **Step 3: Charger et rendre les blocs**

Dans `src/app/(public)/le-logement/page.tsx` :

a) Ajouter les imports nécessaires en haut :

```ts
import Image from 'next/image'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
```

b) Après la requête `const customization = await prisma.lodgingCustomization.findFirst({ ... })`, ajouter :

```ts
  const practicalBlocks = await prisma.lodgingPracticalBlock.findMany({
    where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
    orderBy: { sort_order: 'asc' },
    select: { id: true, title: true, body: true, icon: true, photo_url: true, sort_order: true },
  })
```

c) Remplacer la ligne `const hasContent = sections.some(section => section.hasValue)` par :

```ts
  const hasContent = sections.some(section => section.hasValue) || practicalBlocks.length > 0
```

d) Dans le JSX, à l'intérieur du bloc `) : (` (branche `hasContent` vraie), après la `<div className="space-y-4 pb-8">` contenant `sections.filter(...).map(...)`, insérer le rendu des blocs personnalisés **dans la même `<div className="space-y-4 pb-8">`**, juste après le `.map` des sections fixes :

```tsx
            {practicalBlocks.map(block => (
              <section key={block.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-charcoal/5 text-charcoal">
                    <CategoryIcon iconSlug={block.icon} className="h-5 w-5" />
                  </span>
                  <div className="flex-1 pt-1">
                    <h2 className="font-serif italic text-lg text-charcoal">{block.title}</h2>
                    {block.photo_url && (
                      <div className="relative mt-3 aspect-[16/10] overflow-hidden rounded-xl">
                        <Image src={block.photo_url} alt={block.title} fill unoptimized sizes="(max-width: 430px) 100vw, 430px" className="object-cover" />
                      </div>
                    )}
                    {block.body && (
                      <div className="mt-2 text-sm leading-relaxed text-charcoal/70">
                        <MarkdownText source={block.body} />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ))}
```

(Le type local de `practicalBlocks` est inféré depuis Prisma ; aucune déclaration de type supplémentaire n'est nécessaire.)

- [ ] **Step 4: Lancer le test (passe)**

Run: `npx jest tests/integration/le-logement.practical-blocks.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(public)/le-logement/page.tsx" \
        tests/integration/le-logement.practical-blocks.test.tsx
git commit -m "feat(le-logement): render custom practical blocks after fixed sections

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Composant éditeur `PracticalBlocksEditor`

**Files:**
- Create: `src/features/guide-customization/components/PracticalBlocksEditor.tsx`
- Test: `tests/unit/guide-customization.practical-blocks-editor.test.tsx`

**Interfaces:**
- Consumes: `PracticalBlockInput` (Task 2), `PRACTICAL_BLOCK_ICONS` / `DEFAULT_PRACTICAL_BLOCK_ICON` (Task 2), `CategoryIcon`, `ImageUpload` (`@/shared/components/ImageUpload`).
- Produces: `export function PracticalBlocksEditor(props: { value: PracticalBlockInput[]; onChange: (next: PracticalBlockInput[]) => void; lodgingId: string }): JSX.Element` (consommé par Task 8).

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/unit/guide-customization.practical-blocks-editor.test.tsx` :

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { PracticalBlocksEditor } from '@/features/guide-customization/components/PracticalBlocksEditor'
import type { PracticalBlockInput } from '@/features/guide-customization/types'

jest.mock('@/shared/components/ImageUpload', () => ({
  ImageUpload: () => <div data-testid="image-upload" />,
}))

function Harness() {
  const [value, setValue] = useState<PracticalBlockInput[]>([])
  return (
    <>
      <PracticalBlocksEditor value={value} onChange={setValue} lodgingId="lodging-1" />
      <pre data-testid="state">{JSON.stringify(value)}</pre>
    </>
  )
}

describe('PracticalBlocksEditor', () => {
  it('adds a block, edits its title, and removes it', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /ajouter un bloc/i }))
    const titleInput = screen.getByLabelText(/titre du bloc/i)
    await user.type(titleInput, 'La plage')

    expect(screen.getByTestId('state').textContent).toContain('"title":"La plage"')
    expect(screen.getByTestId('state').textContent).toContain('"icon":"info"')

    await user.click(screen.getByRole('button', { name: /supprimer le bloc/i }))
    expect(screen.getByTestId('state').textContent).toBe('[]')
  })
})
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npx jest tests/unit/guide-customization.practical-blocks-editor.test.tsx`
Expected: FAIL — module `PracticalBlocksEditor` introuvable.

- [ ] **Step 3: Implémenter le composant**

Créer `src/features/guide-customization/components/PracticalBlocksEditor.tsx` :

```tsx
'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { ImageUpload } from '@/shared/components/ImageUpload'
import { MarkdownHint } from '@/shared/components/MarkdownHint'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import {
  PRACTICAL_BLOCK_ICONS,
  DEFAULT_PRACTICAL_BLOCK_ICON,
} from '@/features/guide-customization/lib/practical-block-icons'
import type { PracticalBlockInput } from '@/features/guide-customization/types'

interface Props {
  value: PracticalBlockInput[]
  onChange: (next: PracticalBlockInput[]) => void
  lodgingId: string
}

export function PracticalBlocksEditor({ value, onChange, lodgingId }: Props) {
  function addBlock() {
    onChange([
      ...value,
      { title: '', body: null, icon: DEFAULT_PRACTICAL_BLOCK_ICON, photo_url: null, sort_order: value.length },
    ])
  }

  function updateBlock(index: number, patch: Partial<PracticalBlockInput>) {
    onChange(value.map((block, i) => (i === index ? { ...block, ...patch } : block)))
  }

  function removeBlock(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">Blocs personnalisés</h3>
          <p className="text-xs text-gray-500">Ajoutez vos propres rubriques (titre, texte, photo).</p>
        </div>
        <button
          type="button"
          onClick={addBlock}
          className="inline-flex items-center gap-1.5 rounded-full bg-charcoal px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter un bloc
        </button>
      </div>

      {value.map((block, index) => (
        <div key={index} className="space-y-3 rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`block-title-${index}`} className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Titre du bloc
            </Label>
            <button
              type="button"
              onClick={() => removeBlock(index)}
              aria-label="Supprimer le bloc"
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:border-red-300 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </button>
          </div>

          <Input
            id={`block-title-${index}`}
            value={block.title}
            maxLength={120}
            placeholder="Ex. La plage, Les commerces, Bons plans…"
            onChange={event => updateBlock(index, { title: event.target.value })}
          />

          <div>
            <Label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">Icône</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRACTICAL_BLOCK_ICONS.map(icon => {
                const selected = block.icon === icon.slug
                return (
                  <button
                    key={icon.slug}
                    type="button"
                    aria-label={icon.label}
                    aria-pressed={selected}
                    title={icon.label}
                    onClick={() => updateBlock(index, { icon: icon.slug })}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                      selected ? 'border-charcoal bg-charcoal text-white' : 'border-gray-200 text-charcoal'
                    }`}
                  >
                    <CategoryIcon iconSlug={icon.slug} className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label htmlFor={`block-body-${index}`} className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Texte
            </Label>
            <Textarea
              id={`block-body-${index}`}
              value={block.body ?? ''}
              rows={4}
              onChange={event => updateBlock(index, { body: event.target.value })}
            />
            <MarkdownHint />
          </div>

          <div className="space-y-2">
            <Label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">Photo (optionnelle)</Label>
            <ImageUpload
              endpoint={`/api/dashboard/lodgings/${lodgingId}/cover-photo`}
              onUploaded={url => updateBlock(index, { photo_url: url })}
              label="Téléverser une photo"
            />
            {block.photo_url && (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.photo_url} alt="Aperçu du bloc" className="h-16 w-24 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => updateBlock(index, { photo_url: null })}
                  className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-500"
                >
                  Retirer la photo
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Lancer le test (passe)**

Run: `npx jest tests/unit/guide-customization.practical-blocks-editor.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur. (Si `MarkdownHint` n'accepte pas d'être rendu sans prop, vérifier sa signature dans `src/shared/components/MarkdownHint.tsx` et l'appeler comme dans `CustomizationForm`.)

- [ ] **Step 6: Commit**

```bash
git add src/features/guide-customization/components/PracticalBlocksEditor.tsx \
        tests/unit/guide-customization.practical-blocks-editor.test.tsx
git commit -m "feat(guide-customization): PracticalBlocksEditor component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Brancher l'éditeur dans `CustomizationForm`

**Files:**
- Modify: `src/features/guide-customization/components/CustomizationForm.tsx`
- Test: `tests/unit/guide-customization.customization-form-blocks.test.tsx`

**Interfaces:**
- Consumes: `PracticalBlocksEditor` (Task 7), `PracticalBlockInput` (Task 2).
- Produces: le formulaire inclut `practical_blocks` dans le payload `PUT` et réhydrate l'état depuis la réponse.

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/unit/guide-customization.customization-form-blocks.test.tsx` :

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

describe('CustomizationForm — practical blocks payload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...baseCustomization }),
    }) as jest.Mock
  })

  it('adds a block and includes practical_blocks in the PUT payload', async () => {
    const user = userEvent.setup()
    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais"
        categories={[]}
        pois={[]}
        initialCustomization={baseCustomization}
      />,
    )

    await user.click(screen.getByRole('button', { name: /ajouter un bloc/i }))
    await user.type(screen.getByLabelText(/titre du bloc/i), 'La plage')
    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const putCall = (global.fetch as jest.Mock).mock.calls.find(
      ([, init]) => init?.method === 'PUT',
    )
    expect(putCall).toBeTruthy()
    const payload = JSON.parse((putCall![1] as RequestInit).body as string)
    expect(payload.practical_blocks).toEqual([
      expect.objectContaining({ title: 'La plage', icon: 'info', sort_order: 0 }),
    ])
  })
})
```

(Si le bouton d'enregistrement porte un autre libellé, adapter le `name` du `getByRole` au texte réel du bouton dans `CustomizationForm`.)

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npx jest tests/unit/guide-customization.customization-form-blocks.test.tsx`
Expected: FAIL — bouton « Ajouter un bloc » absent / `practical_blocks` absent du payload.

- [ ] **Step 3: Brancher l'éditeur et le payload**

Dans `src/features/guide-customization/components/CustomizationForm.tsx` :

a) Ajouter les imports :

```ts
import { PracticalBlocksEditor } from '@/features/guide-customization/components/PracticalBlocksEditor'
import type { PracticalBlockInput } from '../types'
```

b) Dans le composant `CustomizationForm`, ajouter un état initialisé depuis la réponse :

```ts
  const [practicalBlocks, setPracticalBlocks] = useState<PracticalBlockInput[]>(
    initialCustomization.practical_blocks ?? [],
  )
```

c) Dans `saveCustomization`, ajouter `practical_blocks: practicalBlocks` à l'objet `payload` envoyé dans le `body` du `fetch` PUT (à côté de `category_order`, `featured_pois`, etc.).

d) Toujours dans `saveCustomization`, après réception de la réponse (là où les autres champs sont réhydratés depuis `payload`/la réponse), réhydrater les blocs :

```ts
      setPracticalBlocks(data.practical_blocks ?? [])
```

(utiliser le nom de la variable de réponse JSON réellement employé dans la fonction — `data`, `json`, ou équivalent).

e) Dans le JSX, sous la carte « Infos pratiques » (après `<PracticalInfoCard ... />`), insérer :

```tsx
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <PracticalBlocksEditor value={practicalBlocks} onChange={setPracticalBlocks} lodgingId={lodgingId} />
      </div>
```

- [ ] **Step 4: Lancer le test (passe)**

Run: `npx jest tests/unit/guide-customization.customization-form-blocks.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Non-régression ciblée + typecheck**

Run: `npx jest tests/unit/guide-customization.practical-blocks-editor.test.tsx tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts && npx tsc --noEmit`
Expected: vert + `tsc` sans erreur.

- [ ] **Step 6: Commit**

```bash
git add src/features/guide-customization/components/CustomizationForm.tsx \
        tests/unit/guide-customization.customization-form-blocks.test.tsx
git commit -m "feat(guide-customization): wire PracticalBlocksEditor into the form

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage :**
- Modèle `LodgingPracticalBlock` + migration → Task 1. ✅
- Catalogue d'icônes + types → Task 2. ✅
- Normalisation/réindexation (titre requis, body/photo nullés, sort_order par position) → Task 3. ✅
- API Zod `practical_blocks` (titre, body, icône ∈ catalogue, photo_url) → Task 4. ✅
- Persistance remplacement complet (soft-delete + recréation) + lecture triée → Task 5. ✅
- Rendu public après sections fixes (icône + markdown + photo) + `hasContent` → Task 6. ✅
- Formulaire owner (ajout/suppression/icône/upload) + payload → Tasks 7 & 8. ✅
- Réordonnancement entre blocs : l'ordre du tableau fait foi et `sort_order` est réindexé par position (Task 3/5) ; l'éditeur conserve l'ordre d'ajout. ⚠️ Le **drag-and-drop** (dnd-kit) mentionné dans la spec n'est PAS implémenté dans Task 7 (l'ordre suit l'ordre d'ajout/suppression). Voir note ci-dessous.

**Placeholder scan :** aucun TBD/TODO d'implémentation ; tout le code est fourni. Les seules notes conditionnelles (« si le bouton porte un autre libellé… ») concernent l'adaptation à des libellés réels et sont explicites.

**Type consistency :** `PracticalBlockInput`/`PracticalBlockResponse` (Task 2) sont utilisés tels quels par Tasks 3–8. `normalizePracticalBlocks` (Task 3) renvoie `NormalizedPracticalBlock` consommé en Task 5. `PracticalBlocksEditor` (Task 7) a la signature `{ value, onChange, lodgingId }` consommée en Task 8.

**Écart spec ↔ plan à arbitrer (réordonnancement par drag-and-drop) :** la spec prévoit un réordonnancement via dnd-kit. Pour limiter le risque et la taille de Task 7, le plan livre d'abord un éditeur où l'ordre = ordre d'ajout (réindexé en `sort_order`). Le drag-and-drop peut être ajouté ensuite (réutilisation du pattern `dnd-kit` déjà présent dans `CustomizationForm`). À valider avec le demandeur : livrer sans drag-and-drop d'abord, ou l'inclure dès Task 7 ?
