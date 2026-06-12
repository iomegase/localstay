# Agenda Public des Sorties — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exposer publiquement les événements (modèle `Event`) via une page agenda par ville (`/guide/[ville]/agenda`), une page de détail par événement, et une tuile d'entrée dans la rangée des catégories.

**Architecture:** Nouvelle feature `src/features/events-public` (lecture seule, distincte de `events-acquisition`). Les événements ont leur propre rail parallèle au tube POI : `City → agenda → event détail`, relié à la ville par `city_id` OU `commune_insee = city.insee_code`. Un slug d'événement (nouvelle colonne) donne des URLs propres.

**Tech Stack:** Next.js 16 (App Router, Server Components), Prisma + PostgreSQL (Supabase), TypeScript, Jest + ts-jest, Tailwind.

**Spec source:** `docs/superpowers/specs/2026-06-12-agenda-public-events-design.md`

---

## Conventions (lire avant de commencer)

- **Répertoire de travail :** le chemin du projet a un **espace final**. Toujours `cd "/Users/daviddevillers/sites/staylocal "` (guillemets inclus) pour toute commande `npx`/`jest`/`git`.
- **Lancer un test :** `cd "/Users/daviddevillers/sites/staylocal " && npx jest <chemin> --silent=false`
- **Vérif TS (autorité) :** `cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit` (l'IDE affiche des diagnostics périmés sur le client Prisma — ignorer, le CLI fait foi).
- **Alias d'import :** `@/` → `src/`. Ex. `@/shared/lib/prisma`, `@/features/...`.
- **Branche :** travailler sur `main` (consentement explicite donné dans la session précédente). Commits fréquents.
- **DB prod :** l'URL directe (5432) est injoignable du sandbox. Les migrations/seed DDL sont **appliqués en prod par l'utilisateur** (cf. mémoire `reference_db_migration_apply`). Les tâches DB ci-dessous précisent ce que l'utilisateur doit lancer.
- **`event_types` en base est DÉJÀ normalisé** vers `EventType` (`'cultural' | 'sport' | 'market' | 'festival' | 'social' | 'other'`) — défini dans `src/features/events-acquisition/types.ts`. On ne remappe donc PAS du DATAtourisme brut côté public ; on mappe `EventType → libellé FR`.

---

## File Structure

**Créés :**
- `src/features/events-public/types.ts` — types d'affichage (`AgendaListItem`, `AgendaEventDetail`, `AgendaTypeFacet`).
- `src/features/events-public/lib/event-slug.ts` — `slugify()` + `buildEventSlug(title, sourceId)`.
- `src/features/events-public/lib/event-type-labels.ts` — `EventType → libellé FR` + facettes de filtre.
- `src/features/events-public/lib/format-event-date.ts` — `formatEventDate(start, end)` en FR.
- `src/features/events-public/queries/agenda.ts` — `getCityAgenda`, `getEventBySlug`, `cityHasUpcomingEvents`.
- `src/features/events-public/components/EventCard.tsx` — carte d'un événement dans la liste.
- `src/features/events-public/components/EventTypeFilter.tsx` — filtre par type (client).
- `src/app/(public)/guide/[city-slug]/agenda/page.tsx` — page liste agenda.
- `src/app/(public)/guide/[city-slug]/agenda/[event-slug]/page.tsx` — page détail.
- `prisma/migrations/20260612120000_event_slug/migration.sql` — ajout colonne `slug` + index.
- Tests : `tests/unit/events-public.event-slug.test.ts`, `tests/unit/events-public.event-type-labels.test.ts`, `tests/unit/events-public.format-event-date.test.ts`, `tests/integration/events-public.agenda-queries.test.ts`.

**Modifiés :**
- `prisma/schema.prisma` — ajoute `slug String?` + `@@index([slug])` au modèle `Event`.
- `src/features/events-acquisition/services/ingest-runner.ts` — génère le slug dans `toRow`.
- `src/app/(public)/guide/[city-slug]/page.tsx` — insère la tuile « Sorties culturelles » conditionnelle.

---

## Task 1: Schéma — colonne `Event.slug`

**Files:**
- Modify: `prisma/schema.prisma` (modèle `Event`, autour des lignes 757-794)
- Create: `prisma/migrations/20260612120000_event_slug/migration.sql`

- [ ] **Step 1: Ajouter le champ `slug` au modèle `Event`**

Dans `prisma/schema.prisma`, dans le modèle `Event`, juste après la ligne `source_updated_at DateTime?` (≈ ligne 760), ajouter :

```prisma
  slug              String?
```

Puis, dans le bloc d'index en bas du modèle (après `@@index([end_date])`), ajouter :

```prisma
  @@index([slug])
```

- [ ] **Step 2: Générer le client Prisma**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx prisma generate`
Expected: `Generated Prisma Client` sans erreur.

- [ ] **Step 3: Écrire la migration SQL à la main**

Créer `prisma/migrations/20260612120000_event_slug/migration.sql` :

```sql
-- Spec agenda public : slug d'événement pour les URLs publiques.
ALTER TABLE "Event" ADD COLUMN "slug" TEXT;
CREATE INDEX "Event_slug_idx" ON "Event"("slug");
```

- [ ] **Step 4: Vérifier la compilation TS**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit`
Expected: aucune erreur (le client régénéré expose `event.slug`).

- [ ] **Step 5: Commit**

```bash
cd "/Users/daviddevillers/sites/staylocal "
git add prisma/schema.prisma prisma/migrations/20260612120000_event_slug
git commit -m "feat(events): add Event.slug column + migration"
```

> **NOTE OPÉRATIONNELLE (utilisateur) :** appliquer en prod via `prisma db execute --file prisma/migrations/20260612120000_event_slug/migration.sql --schema prisma/schema.prisma` puis `prisma migrate resolve --applied 20260612120000_event_slug`. Le backfill des slugs existants est en Task 3.

---

## Task 2: Helper de slug d'événement

**Files:**
- Create: `src/features/events-public/lib/event-slug.ts`
- Test: `tests/unit/events-public.event-slug.test.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `tests/unit/events-public.event-slug.test.ts` :

```ts
import { slugify, buildEventSlug } from '@/features/events-public/lib/event-slug'

describe('slugify', () => {
  it('met en minuscules, retire les accents et remplace les espaces par des tirets', () => {
    expect(slugify('Concert à la Médiathèque')).toBe('concert-a-la-mediatheque')
  })
  it('supprime la ponctuation et fusionne les tirets', () => {
    expect(slugify('Marché  artisanal !! (centre-ville)')).toBe('marche-artisanal-centre-ville')
  })
  it('rogne les tirets en début/fin', () => {
    expect(slugify('  --Trail--  ')).toBe('trail')
  })
  it('renvoie "evenement" pour une chaîne sans caractère alphanumérique', () => {
    expect(slugify('!!!')).toBe('evenement')
  })
})

describe('buildEventSlug', () => {
  it('combine le titre slugifié et un suffixe court dérivé du sourceId', () => {
    const slug = buildEventSlug('Concert au théâtre', 'https://data.datatourisme.fr/abc/DEF12345')
    expect(slug).toMatch(/^concert-au-theatre-[a-z0-9]{6}$/)
  })
  it('est déterministe pour un même (titre, sourceId)', () => {
    const a = buildEventSlug('Festival', 'src-123')
    const b = buildEventSlug('Festival', 'src-123')
    expect(a).toBe(b)
  })
  it('produit des suffixes différents pour le même titre mais des sourceId différents', () => {
    const a = buildEventSlug('Festival', 'src-123')
    const b = buildEventSlug('Festival', 'src-999')
    expect(a).not.toBe(b)
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/unit/events-public.event-slug.test.ts`
Expected: FAIL — `Cannot find module '@/features/events-public/lib/event-slug'`.

- [ ] **Step 3: Implémenter le helper**

Créer `src/features/events-public/lib/event-slug.ts` :

```ts
import { createHash } from 'node:crypto'

/** Slug lisible : minuscules, sans accents, alphanumérique + tirets. */
export function slugify(input: string): string {
  const cleaned = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || 'evenement'
}

/**
 * Slug d'événement = titre slugifié + suffixe court déterministe dérivé du
 * sourceId. Le suffixe garantit l'unicité même quand deux événements partagent
 * le même titre.
 */
export function buildEventSlug(title: string, sourceId: string): string {
  const suffix = createHash('sha1').update(sourceId).digest('hex').slice(0, 6)
  return `${slugify(title)}-${suffix}`
}
```

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/unit/events-public.event-slug.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
cd "/Users/daviddevillers/sites/staylocal "
git add src/features/events-public/lib/event-slug.ts tests/unit/events-public.event-slug.test.ts
git commit -m "feat(events-public): event slug helper"
```

---

## Task 3: Génération du slug à l'ingestion + backfill

**Files:**
- Modify: `src/features/events-acquisition/services/ingest-runner.ts` (fonction `toRow`, lignes 104-131)
- Create: `prisma/backfill-event-slugs.ts`
- Test: `tests/integration/events-acquisition.ingest-runner.test.ts` (ajout d'une assertion)

- [ ] **Step 1: Ajouter une assertion de slug au test du runner existant**

Dans `tests/integration/events-acquisition.ingest-runner.test.ts`, dans le test `'admin: strict — ...'` (après la ligne `expect(call.create.city_id).toBe('city-cha')`), ajouter :

```ts
    expect(call.create.slug).toBe('event-a-' + require('node:crypto').createHash('sha1').update('A').digest('hex').slice(0, 6))
```

(Le titre mappé est `Event A` → slug `event-a`, et `sourceId` est `A`.)

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/integration/events-acquisition.ingest-runner.test.ts -t "strict"`
Expected: FAIL — `call.create.slug` est `undefined`.

- [ ] **Step 3: Générer le slug dans `toRow`**

Dans `src/features/events-acquisition/services/ingest-runner.ts` :

En haut du fichier, après la ligne `import { resolveCommune } from '../lib/commune-geo'`, ajouter :

```ts
import { buildEventSlug } from '@/features/events-public/lib/event-slug'
```

Puis dans la fonction `toRow`, ajouter le champ `slug` à l'objet retourné, juste après `source_id: e.sourceId,` :

```ts
    slug: buildEventSlug(e.title, e.sourceId),
```

- [ ] **Step 4: Lancer le test pour vérifier le succès**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/integration/events-acquisition.ingest-runner.test.ts`
Expected: PASS (tous les tests du runner).

- [ ] **Step 5: Écrire le script de backfill**

Créer `prisma/backfill-event-slugs.ts` :

```ts
// Backfill one-shot : renseigne Event.slug pour les événements déjà en base.
// Usage (utilisateur, env prod) : npx tsx prisma/backfill-event-slugs.ts
import { PrismaClient } from '@prisma/client'
import { buildEventSlug } from '../src/features/events-public/lib/event-slug'

const prisma = new PrismaClient()

async function main() {
  const events = await prisma.event.findMany({
    where: { slug: null },
    select: { id: true, title: true, source_id: true },
  })
  console.log(`Backfilling ${events.length} event slug(s)...`)
  for (const e of events) {
    await prisma.event.update({
      where: { id: e.id },
      data: { slug: buildEventSlug(e.title, e.source_id) },
    })
  }
  console.log('Done.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 6: Vérifier la compilation TS**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 7: Commit**

```bash
cd "/Users/daviddevillers/sites/staylocal "
git add src/features/events-acquisition/services/ingest-runner.ts prisma/backfill-event-slugs.ts tests/integration/events-acquisition.ingest-runner.test.ts
git commit -m "feat(events): generate slug on ingest + backfill script"
```

> **NOTE OPÉRATIONNELLE (utilisateur) :** après la migration Task 1, lancer en prod `npx tsx prisma/backfill-event-slugs.ts` (renseigne les slugs des événements existants), et `npm run db:seed` si les `insee_code` des 3 villes ne sont pas encore en prod (le seed est déjà écrit dans `prisma/seed.ts`).

---

## Task 4: Libellés des types d'événement

**Files:**
- Create: `src/features/events-public/lib/event-type-labels.ts`
- Test: `tests/unit/events-public.event-type-labels.test.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `tests/unit/events-public.event-type-labels.test.ts` :

```ts
import { typeLabel, buildTypeFacets } from '@/features/events-public/lib/event-type-labels'

describe('typeLabel', () => {
  it('mappe chaque EventType vers son libellé FR', () => {
    expect(typeLabel('cultural')).toBe('Culturel')
    expect(typeLabel('sport')).toBe('Sport')
    expect(typeLabel('market')).toBe('Marché')
    expect(typeLabel('festival')).toBe('Festival')
    expect(typeLabel('social')).toBe('Animation')
    expect(typeLabel('other')).toBe('Autre')
  })
})

describe('buildTypeFacets', () => {
  it('compte les types présents et trie par compteur décroissant', () => {
    const facets = buildTypeFacets([
      ['cultural'],
      ['cultural', 'festival'],
      ['sport'],
    ])
    expect(facets).toEqual([
      { type: 'cultural', label: 'Culturel', count: 2 },
      { type: 'festival', label: 'Festival', count: 1 },
      { type: 'sport', label: 'Sport', count: 1 },
    ])
  })
  it('renvoie un tableau vide quand il n’y a aucun événement', () => {
    expect(buildTypeFacets([])).toEqual([])
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/unit/events-public.event-type-labels.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

Créer `src/features/events-public/lib/event-type-labels.ts` :

```ts
import type { EventType } from '@/features/events-acquisition/types'
import type { AgendaTypeFacet } from '../types'

const LABELS: Record<EventType, string> = {
  cultural: 'Culturel',
  sport: 'Sport',
  market: 'Marché',
  festival: 'Festival',
  social: 'Animation',
  other: 'Autre',
}

export function typeLabel(type: EventType): string {
  return LABELS[type] ?? 'Autre'
}

/**
 * Construit les facettes de filtre à partir des types de chaque événement.
 * Trié par compteur décroissant puis par libellé, pour un ordre stable.
 */
export function buildTypeFacets(eventTypeLists: EventType[][]): AgendaTypeFacet[] {
  const counts = new Map<EventType, number>()
  for (const list of eventTypeLists) {
    for (const t of list) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, label: typeLabel(type), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}
```

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/unit/events-public.event-type-labels.test.ts`
Expected: PASS. (Dépend du type `AgendaTypeFacet` — défini en Task 6. Si le test échoue à la compilation pour cette raison, faire Task 6 d'abord puis revenir. Voir la note d'ordre en bas.)

- [ ] **Step 5: Commit**

```bash
cd "/Users/daviddevillers/sites/staylocal "
git add src/features/events-public/lib/event-type-labels.ts tests/unit/events-public.event-type-labels.test.ts
git commit -m "feat(events-public): event type labels + facets"
```

---

## Task 5: Formatage des dates d'événement

**Files:**
- Create: `src/features/events-public/lib/format-event-date.ts`
- Test: `tests/unit/events-public.format-event-date.test.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `tests/unit/events-public.format-event-date.test.ts` :

```ts
import { formatEventDate } from '@/features/events-public/lib/format-event-date'

describe('formatEventDate', () => {
  it('affiche une seule date pour un événement d’un jour', () => {
    expect(formatEventDate(new Date('2026-06-13'), new Date('2026-06-13'))).toBe('13 juin 2026')
  })
  it('affiche une plage « du … au … » dans le même mois', () => {
    expect(formatEventDate(new Date('2026-06-13'), new Date('2026-06-15'))).toBe('du 13 au 15 juin 2026')
  })
  it('affiche les deux mois quand ils diffèrent', () => {
    expect(formatEventDate(new Date('2026-06-30'), new Date('2026-07-02'))).toBe('du 30 juin au 2 juillet 2026')
  })
  it('affiche les deux années quand elles diffèrent', () => {
    expect(formatEventDate(new Date('2026-12-31'), new Date('2027-01-01'))).toBe('du 31 décembre 2026 au 1 janvier 2027')
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/unit/events-public.format-event-date.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

Créer `src/features/events-public/lib/format-event-date.ts` :

```ts
const DAY = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', timeZone: 'UTC' })
const DAY_MONTH = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })
const FULL = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

function sameDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate()
}

/** Date FR lisible : un jour → « 13 juin 2026 » ; plage → « du 13 au 15 juin 2026 ». */
export function formatEventDate(start: Date, end: Date): string {
  if (sameDay(start, end)) return FULL.format(start)
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear()
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth()
  if (sameMonth) return `du ${DAY.format(start)} au ${FULL.format(end)}`
  if (sameYear) return `du ${DAY_MONTH.format(start)} au ${FULL.format(end)}`
  return `du ${FULL.format(start)} au ${FULL.format(end)}`
}
```

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/unit/events-public.format-event-date.test.ts`
Expected: PASS (4 tests).

> Note : `Intl` `fr-FR` rend les mois en minuscules (« juin ») et sans « 1er » (rend « 1 »), ce qui correspond aux assertions ci-dessus.

- [ ] **Step 5: Commit**

```bash
cd "/Users/daviddevillers/sites/staylocal "
git add src/features/events-public/lib/format-event-date.ts tests/unit/events-public.format-event-date.test.ts
git commit -m "feat(events-public): FR event date formatting"
```

---

## Task 6: Types d'affichage `events-public`

**Files:**
- Create: `src/features/events-public/types.ts`

- [ ] **Step 1: Créer le fichier de types**

Créer `src/features/events-public/types.ts` :

```ts
import type { EventType } from '@/features/events-acquisition/types'

/** Facette de filtre par type sur la page agenda. */
export interface AgendaTypeFacet {
  type: EventType
  label: string
  count: number
}

/** Un événement tel qu'affiché dans la liste agenda. */
export interface AgendaListItem {
  id: string
  slug: string
  title: string
  dateLabel: string
  types: EventType[]
  venueName: string | null
  communeName: string
  imageUrl: string | null
}

/** Détail complet d'un événement pour sa page dédiée. */
export interface AgendaEventDetail {
  id: string
  slug: string
  title: string
  description: string | null
  dateLabel: string
  types: EventType[]
  venueName: string | null
  address: string | null
  communeName: string
  images: string[]
  website: string | null
  phone: string | null
  email: string | null
  priceInfo: string | null
}
```

- [ ] **Step 2: Vérifier la compilation TS**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
cd "/Users/daviddevillers/sites/staylocal "
git add src/features/events-public/types.ts
git commit -m "feat(events-public): display types"
```

> **Ordre conseillé :** faire Task 6 avant Task 4 (Task 4 importe `AgendaTypeFacet`). Le contrôleur subagent-driven peut réordonner ; les deux sont indépendants des autres.

---

## Task 7: Requêtes agenda

**Files:**
- Create: `src/features/events-public/queries/agenda.ts`
- Test: `tests/integration/events-public.agenda-queries.test.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `tests/integration/events-public.agenda-queries.test.ts` :

```ts
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: jest.fn() },
    event: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { getCityAgenda, getEventBySlug, cityHasUpcomingEvents } from '@/features/events-public/queries/agenda'

const CITY = { id: 'city-1', insee_code: '74056', name: 'Chamonix-Mont-Blanc' }

function dbEvent(over: Record<string, unknown> = {}) {
  return {
    id: 'e1', slug: 'concert-abc', title: 'Concert',
    description: 'desc', event_types: ['cultural'],
    start_date: new Date('2026-07-01'), end_date: new Date('2026-07-01'),
    venue_name: 'Salle', address: '1 rue', commune_name: 'Chamonix-Mont-Blanc',
    images: ['https://img/a.jpg'], website: 'https://x', phone: null, email: null, price_info: null,
    ...over,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.city.findFirst as jest.Mock).mockResolvedValue(CITY)
  ;(prisma.event.findMany as jest.Mock).mockResolvedValue([dbEvent()])
  ;(prisma.event.findFirst as jest.Mock).mockResolvedValue(dbEvent())
  ;(prisma.event.count as jest.Mock).mockResolvedValue(3)
})

describe('getCityAgenda', () => {
  it('renvoie null si la ville est introuvable', async () => {
    ;(prisma.city.findFirst as jest.Mock).mockResolvedValue(null)
    expect(await getCityAgenda('inconnue')).toBeNull()
  })

  it('filtre par ville (city_id OU insee), à venir et actif, trié par date', async () => {
    await getCityAgenda('chamonix-mont-blanc')
    const args = (prisma.event.findMany as jest.Mock).mock.calls[0][0]
    expect(args.where.OR).toEqual([{ city_id: 'city-1' }, { commune_insee: '74056' }])
    expect(args.where.is_active).toBe(true)
    expect(args.where.deleted_at).toBeNull()
    expect(args.where.end_date.gte).toBeInstanceOf(Date)
    expect(args.orderBy).toEqual({ start_date: 'asc' })
  })

  it('mappe les événements vers AgendaListItem avec dateLabel et imageUrl', async () => {
    const res = await getCityAgenda('chamonix-mont-blanc')
    expect(res!.items[0]).toMatchObject({
      id: 'e1', slug: 'concert-abc', title: 'Concert',
      types: ['cultural'], venueName: 'Salle', imageUrl: 'https://img/a.jpg',
    })
    expect(typeof res!.items[0].dateLabel).toBe('string')
  })

  it('expose les facettes de type et applique le filtre type', async () => {
    ;(prisma.event.findMany as jest.Mock).mockResolvedValue([
      dbEvent({ id: 'a', event_types: ['cultural'] }),
      dbEvent({ id: 'b', event_types: ['sport'] }),
    ])
    const res = await getCityAgenda('chamonix-mont-blanc', { type: 'sport' })
    expect(res!.facets.map((f) => f.type).sort()).toEqual(['cultural', 'sport'])
    // le filtre type est appliqué après calcul des facettes (facettes = tous types)
    expect(res!.items.every((i) => i.types.includes('sport'))).toBe(true)
    expect(res!.items).toHaveLength(1)
  })
})

describe('getEventBySlug', () => {
  it('renvoie null si la ville est introuvable', async () => {
    ;(prisma.city.findFirst as jest.Mock).mockResolvedValue(null)
    expect(await getEventBySlug('x', 'y')).toBeNull()
  })
  it('renvoie null si aucun événement ne correspond', async () => {
    ;(prisma.event.findFirst as jest.Mock).mockResolvedValue(null)
    expect(await getEventBySlug('chamonix-mont-blanc', 'inconnu')).toBeNull()
  })
  it('mappe vers AgendaEventDetail', async () => {
    const res = await getEventBySlug('chamonix-mont-blanc', 'concert-abc')
    expect(res).toMatchObject({ id: 'e1', slug: 'concert-abc', title: 'Concert', website: 'https://x' })
    const args = (prisma.event.findFirst as jest.Mock).mock.calls[0][0]
    expect(args.where.slug).toBe('concert-abc')
    expect(args.where.OR).toEqual([{ city_id: 'city-1' }, { commune_insee: '74056' }])
  })
})

describe('cityHasUpcomingEvents', () => {
  it('vrai quand le compteur est > 0', async () => {
    expect(await cityHasUpcomingEvents('city-1', '74056')).toBe(true)
  })
  it('faux quand le compteur est 0', async () => {
    ;(prisma.event.count as jest.Mock).mockResolvedValue(0)
    expect(await cityHasUpcomingEvents('city-1', '74056')).toBe(false)
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/integration/events-public.agenda-queries.test.ts`
Expected: FAIL — module `queries/agenda` introuvable.

- [ ] **Step 3: Implémenter les requêtes**

Créer `src/features/events-public/queries/agenda.ts` :

```ts
import { prisma } from '@/shared/lib/prisma'
import type { EventType } from '@/features/events-acquisition/types'
import type { AgendaListItem, AgendaEventDetail, AgendaTypeFacet } from '../types'
import { buildTypeFacets } from '../lib/event-type-labels'
import { formatEventDate } from '../lib/format-event-date'

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** Condition « événement de cette ville » : lié par city_id OU par INSEE. */
function cityScope(cityId: string, insee: string | null) {
  const or: Array<Record<string, string>> = [{ city_id: cityId }]
  if (insee) or.push({ commune_insee: insee })
  return or
}

async function resolveCity(citySlug: string) {
  return prisma.city.findFirst({
    where: { slug: citySlug, is_active: true, deleted_at: null },
    select: { id: true, insee_code: true, name: true },
  })
}

export interface CityAgenda {
  items: AgendaListItem[]
  facets: AgendaTypeFacet[]
}

export async function getCityAgenda(
  citySlug: string,
  options: { type?: EventType } = {},
): Promise<CityAgenda | null> {
  const city = await resolveCity(citySlug)
  if (!city) return null

  const rows = await prisma.event.findMany({
    where: {
      OR: cityScope(city.id, city.insee_code),
      is_active: true,
      deleted_at: null,
      end_date: { gte: startOfToday() },
    },
    orderBy: { start_date: 'asc' },
    select: {
      id: true, slug: true, title: true, event_types: true,
      start_date: true, end_date: true, venue_name: true,
      commune_name: true, images: true,
    },
  })

  // Les facettes reflètent TOUS les types présents (avant filtrage), pour que
  // l'utilisateur voie les autres types disponibles même après avoir filtré.
  const facets = buildTypeFacets(rows.map((r) => r.event_types as EventType[]))

  const filtered = options.type
    ? rows.filter((r) => (r.event_types as EventType[]).includes(options.type!))
    : rows

  const items: AgendaListItem[] = filtered.map((r) => ({
    id: r.id,
    slug: r.slug ?? r.id, // garde-fou si un slug manque (avant backfill)
    title: r.title,
    dateLabel: formatEventDate(r.start_date, r.end_date),
    types: r.event_types as EventType[],
    venueName: r.venue_name,
    communeName: r.commune_name,
    imageUrl: r.images[0] ?? null,
  }))

  return { items, facets }
}

export async function getEventBySlug(
  citySlug: string,
  eventSlug: string,
): Promise<AgendaEventDetail | null> {
  const city = await resolveCity(citySlug)
  if (!city) return null

  const e = await prisma.event.findFirst({
    where: {
      slug: eventSlug,
      OR: cityScope(city.id, city.insee_code),
      is_active: true,
      deleted_at: null,
      end_date: { gte: startOfToday() },
    },
  })
  if (!e) return null

  return {
    id: e.id,
    slug: e.slug ?? e.id,
    title: e.title,
    description: e.description,
    dateLabel: formatEventDate(e.start_date, e.end_date),
    types: e.event_types as EventType[],
    venueName: e.venue_name,
    address: e.address,
    communeName: e.commune_name,
    images: e.images,
    website: e.website,
    phone: e.phone,
    email: e.email,
    priceInfo: e.price_info,
  }
}

export async function cityHasUpcomingEvents(cityId: string, insee: string | null): Promise<boolean> {
  const count = await prisma.event.count({
    where: {
      OR: cityScope(cityId, insee),
      is_active: true,
      deleted_at: null,
      end_date: { gte: startOfToday() },
    },
  })
  return count > 0
}
```

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/integration/events-public.agenda-queries.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Vérifier la compilation TS**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
cd "/Users/daviddevillers/sites/staylocal "
git add src/features/events-public/queries/agenda.ts tests/integration/events-public.agenda-queries.test.ts
git commit -m "feat(events-public): agenda queries (list, detail, has-upcoming)"
```

---

## Task 8: Composant `EventCard`

**Files:**
- Create: `src/features/events-public/components/EventCard.tsx`

- [ ] **Step 1: Implémenter la carte (server component pur, sans état)**

Créer `src/features/events-public/components/EventCard.tsx` :

```tsx
import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'
import type { AgendaListItem } from '../types'
import { typeLabel } from '../lib/event-type-labels'

export function EventCard({
  event,
  citySlug,
  lodgingId,
}: {
  event: AgendaListItem
  citySlug: string
  lodgingId?: string
}) {
  const href = lodgingId
    ? `/guide/${citySlug}/agenda/${event.slug}?lodging=${encodeURIComponent(lodgingId)}`
    : `/guide/${citySlug}/agenda/${event.slug}`

  return (
    <Link
      href={href}
      data-testid={`event-card-${event.slug}`}
      className="group flex gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition active:scale-[0.99]"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <CalendarDays className="h-7 w-7" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-1">
          {event.types.map((t) => (
            <span
              key={t}
              className="rounded-full bg-pine/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-pine"
            >
              {typeLabel(t)}
            </span>
          ))}
        </div>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium text-charcoal">{event.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-gold">
          <CalendarDays className="h-3 w-3" /> {event.dateLabel}
        </p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-400">
          <MapPin className="h-3 w-3 shrink-0" /> {event.venueName ?? event.communeName}
        </p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Vérifier la compilation TS**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
cd "/Users/daviddevillers/sites/staylocal "
git add src/features/events-public/components/EventCard.tsx
git commit -m "feat(events-public): EventCard component"
```

---

## Task 9: Composant `EventTypeFilter`

**Files:**
- Create: `src/features/events-public/components/EventTypeFilter.tsx`

- [ ] **Step 1: Implémenter le filtre (client component, calqué sur SubCategoryFilter)**

Créer `src/features/events-public/components/EventTypeFilter.tsx` :

```tsx
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Grid2x2 } from 'lucide-react'
import type { AgendaTypeFacet } from '../types'

export function EventTypeFilter({ facets }: { facets: AgendaTypeFacet[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get('type')

  function select(type: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (type) params.set('type', type)
    else params.delete('type')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  if (facets.length === 0) return null

  return (
    <section className="mt-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5">
        <button
          onClick={() => select(null)}
          className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 shadow-sm transition ${
            !active ? 'bg-charcoal text-white' : 'border border-gray-100 bg-white text-gray-400'
          }`}
        >
          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${!active ? 'bg-white/15' : 'bg-gray-100'}`}>
            <Grid2x2 className="h-2.5 w-2.5" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Tout</span>
        </button>

        {facets.map((f) => {
          const isActive = active === f.type
          return (
            <button
              key={f.type}
              data-testid={`event-type-${f.type}`}
              onClick={() => select(f.type)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 shadow-sm transition ${
                isActive ? 'bg-charcoal text-white' : 'border border-gray-100 bg-white text-charcoal/70'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/15 text-white' : 'bg-pine/15 text-pine'
                }`}
              >
                {f.count}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{f.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Vérifier la compilation TS**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
cd "/Users/daviddevillers/sites/staylocal "
git add src/features/events-public/components/EventTypeFilter.tsx
git commit -m "feat(events-public): EventTypeFilter component"
```

---

## Task 10: Page agenda

**Files:**
- Create: `src/app/(public)/guide/[city-slug]/agenda/page.tsx`

- [ ] **Step 1: Implémenter la page liste**

Créer `src/app/(public)/guide/[city-slug]/agenda/page.tsx` :

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { EventType } from '@/features/events-acquisition/types'
import { getCityAgenda } from '@/features/events-public/queries/agenda'
import { EventCard } from '@/features/events-public/components/EventCard'
import { EventTypeFilter } from '@/features/events-public/components/EventTypeFilter'

interface Props {
  params: Promise<{ 'city-slug': string }>
  searchParams?: Promise<{ type?: string; lodging?: string }>
}

const VALID_TYPES: EventType[] = ['cultural', 'sport', 'market', 'festival', 'social', 'other']

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'city-slug': slug } = await params
  return { title: `Agenda des sorties — ${slug}`, description: 'Sorties culturelles et manifestations à venir.' }
}

export default async function AgendaPage({ params, searchParams }: Props) {
  const { 'city-slug': slug } = await params
  const sp = (await searchParams) ?? {}
  const type = VALID_TYPES.includes(sp.type as EventType) ? (sp.type as EventType) : undefined
  const lodging = sp.lodging

  const agenda = await getCityAgenda(slug, { type })
  if (!agenda) {
    notFound()
    return null
  }

  return (
    <>
      <div className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gold">Le guide</p>
        <h1 className="text-2xl font-light uppercase text-charcoal">Sorties &amp; manifestations</h1>
      </div>

      <EventTypeFilter facets={agenda.facets} />

      {agenda.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
          <p className="text-sm leading-relaxed text-gray-500">Aucune sortie à venir pour le moment.</p>
          <Link
            href={`/guide/${slug}`}
            className="text-xs font-bold uppercase tracking-widest text-gold underline underline-offset-4"
          >
            Retour au guide
          </Link>
        </div>
      ) : (
        <section className="mt-4 flex flex-col gap-3 px-4 pb-10">
          {agenda.items.map((event) => (
            <EventCard key={event.id} event={event} citySlug={slug} lodgingId={lodging} />
          ))}
        </section>
      )}
    </>
  )
}
```

- [ ] **Step 2: Vérifier la compilation TS**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
cd "/Users/daviddevillers/sites/staylocal "
git add "src/app/(public)/guide/[city-slug]/agenda/page.tsx"
git commit -m "feat(events-public): agenda list page"
```

---

## Task 11: Page détail d'événement

**Files:**
- Create: `src/app/(public)/guide/[city-slug]/agenda/[event-slug]/page.tsx`

- [ ] **Step 1: Implémenter la page détail**

Créer `src/app/(public)/guide/[city-slug]/agenda/[event-slug]/page.tsx` :

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CalendarDays, MapPin, ExternalLink, ArrowLeft } from 'lucide-react'
import { getEventBySlug } from '@/features/events-public/queries/agenda'
import { typeLabel } from '@/features/events-public/lib/event-type-labels'

interface Props {
  params: Promise<{ 'city-slug': string; 'event-slug': string }>
  searchParams?: Promise<{ lodging?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'city-slug': citySlug, 'event-slug': eventSlug } = await params
  const event = await getEventBySlug(citySlug, eventSlug)
  if (!event) return { title: 'Événement introuvable', robots: { index: false } }
  return { title: event.title, description: event.description ?? undefined }
}

export default async function EventDetailPage({ params, searchParams }: Props) {
  const { 'city-slug': citySlug, 'event-slug': eventSlug } = await params
  const sp = (await searchParams) ?? {}
  const lodging = sp.lodging

  const event = await getEventBySlug(citySlug, eventSlug)
  if (!event) {
    notFound()
    return null
  }

  const agendaHref = lodging
    ? `/guide/${citySlug}/agenda?lodging=${encodeURIComponent(lodging)}`
    : `/guide/${citySlug}/agenda`
  const hero = event.images[0] ?? null

  return (
    <article className="pb-12">
      <div className="relative h-64 w-full overflow-hidden bg-gray-100">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <CalendarDays className="h-12 w-12" />
          </div>
        )}
        <Link
          href={agendaHref}
          aria-label="Retour à l'agenda"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-charcoal shadow-lg backdrop-blur-md"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-1">
          {event.types.map((t) => (
            <span
              key={t}
              className="rounded-full bg-pine/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-pine"
            >
              {typeLabel(t)}
            </span>
          ))}
        </div>

        <h1 className="mt-2 text-2xl font-light text-charcoal">{event.title}</h1>

        <p className="mt-3 flex items-center gap-2 text-sm text-gold">
          <CalendarDays className="h-4 w-4" /> {event.dateLabel}
        </p>
        {(event.venueName || event.address) && (
          <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4 shrink-0" />
            {[event.venueName, event.address, event.communeName].filter(Boolean).join(' · ')}
          </p>
        )}

        {event.description && (
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-charcoal">{event.description}</p>
        )}

        {event.priceInfo && <p className="mt-4 text-sm text-gray-500">Tarif : {event.priceInfo}</p>}

        {event.website && (
          <a
            href={event.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white"
          >
            Site officiel / billetterie <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Vérifier la compilation TS**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
cd "/Users/daviddevillers/sites/staylocal "
git add "src/app/(public)/guide/[city-slug]/agenda/[event-slug]/page.tsx"
git commit -m "feat(events-public): event detail page"
```

---

## Task 12: Tuile « Sorties culturelles » sur la page ville

**Files:**
- Modify: `src/app/(public)/guide/[city-slug]/page.tsx`

L'objectif : afficher un lien/tuile vers `/guide/[ville]/agenda` sous la rangée des catégories, **uniquement si la ville a des événements à venir**. On réutilise `getCityGuide` (qui renvoie déjà `city`) et on appelle `cityHasUpcomingEvents`.

- [ ] **Step 1: Importer la requête et résoudre la condition**

Dans `src/app/(public)/guide/[city-slug]/page.tsx` :

Ajouter l'import en tête (avec les autres imports de features) :

```tsx
import { cityHasUpcomingEvents } from '@/features/events-public/queries/agenda'
```

Le `guide` renvoyé par `getCityGuide` expose `city`. Vérifier le type de `city` : il doit contenir `id` et `insee_code`. Si `insee_code` n'est pas déjà sélectionné par `getCityGuide`, regarder `src/features/city-guide/queries/cities.ts` et l'ajouter au `select`/type. (Le `city.id` est nécessaire ; `insee_code` peut être `null`.)

Après le bloc qui calcule `forecast` (≈ ligne 57-59), ajouter :

```tsx
  const hasEvents = await cityHasUpcomingEvents(city.id, city.insee_code ?? null)
  const agendaHref = lodging ? `/guide/${slug}/agenda?lodging=${encodeURIComponent(lodging)}` : `/guide/${slug}/agenda`
```

> Si `city` exposé par `getCityGuide` n'a pas `id`/`insee_code`, ajouter ces champs au `select` de `getCityGuide` dans `src/features/city-guide/queries/cities.ts` et au type `CityGuide` correspondant dans `src/features/city-guide/types.ts`. Montrer l'ajout exact :
> - dans le `select` de la ville : `id: true, insee_code: true,` (en plus des champs existants) ;
> - dans le type : `id: string` et `insee_code: string | null`.

- [ ] **Step 2: Insérer la tuile dans le rendu**

Juste après la `<section className="mb-10"><CategoryRow ... /></section>` (≈ ligne 112-114), ajouter un bloc conditionnel :

```tsx
          {hasEvents && (
            <section className="mb-8 px-4">
              <Link
                href={agendaHref}
                data-testid="agenda-tile"
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition active:scale-[0.99]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
                    <CalendarDays className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-charcoal">Sorties &amp; manifestations</span>
                    <span className="block text-xs text-gray-400">L&apos;agenda des événements à venir</span>
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </Link>
            </section>
          )}
```

> `Link`, `ChevronRight` sont déjà importés dans ce fichier. Ajouter `CalendarDays` à l'import existant `lucide-react` : la ligne `import { ChevronLeft, ChevronRight } from 'lucide-react'` devient `import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'`.

- [ ] **Step 3: Vérifier la compilation TS**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Lancer toute la suite de tests**

Run: `cd "/Users/daviddevillers/sites/staylocal " && npm test`
Expected: tous les tests passent (suite existante + nouveaux tests events-public).

- [ ] **Step 5: Commit**

```bash
cd "/Users/daviddevillers/sites/staylocal "
git add "src/app/(public)/guide/[city-slug]/page.tsx" src/features/city-guide
git commit -m "feat(events-public): agenda tile on city guide page"
```

---

## Revue finale

Après la dernière tâche, dispatcher un reviewer sur l'ensemble de l'implémentation (toutes les nouveautés `events-public` + modifications `ingest-runner`/page ville), puis utiliser `superpowers:finishing-a-development-branch`.

**Checklist de couverture spec :**
- ✅ Page agenda par ville (Task 10) ; ✅ détail par événement avec slug (Task 1-3, 11) ; ✅ tri chrono + filtre type (Task 4, 7, 9, 10) ; ✅ lien ville↔événement par city_id/insee (Task 7) ; ✅ tuile d'entrée conditionnelle (Task 12) ; ✅ libellés FR & dates (Task 4-5) ; ✅ placeholder photo (Task 8, 11).
- ⚠️ **Opérations prod (utilisateur, hors code)** : appliquer la migration `slug` (Task 1), lancer le backfill slug + le seed `insee_code` (Task 3). Sans ces étapes, les pages fonctionnent mais peuvent être vides.
