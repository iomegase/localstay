# DATAtourisme Events Ingestion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ingérer et tenir à jour (cron quotidien + recherche admin par commune) les fêtes et manifestations DATAtourisme de Haute-Savoie dans un modèle `Event`, sans affichage public.

**Architecture:** Un flux DATAtourisme (territoire 74) est téléchargé en ZIP, dézippé en mémoire, chaque objet JSON-LD est mappé en `ParsedEvent` (fonction pure), puis upserté en base par un runner. Le runner est déclenché par un cron interne (Bearer) pour l'ensemble des communes suivies, et par une route admin pour une commune à la demande. Les événements terminés sont supprimés définitivement.

**Tech Stack:** Next.js (App Router), Prisma/PostgreSQL, Zod, `fflate` (dézippage), Jest. Conventions existantes : `src/features/<name>/{types,lib,services,queries,components}`, routes internes Bearer (`@/shared/lib/prisma`), `getSessionAdmin`/`getPageAdmin`.

**Référence spec :** `docs/superpowers/specs/2026-06-09-datatourisme-events-ingestion-design.md`

---

## File Structure

| Fichier | Responsabilité |
|---------|----------------|
| `prisma/schema.prisma` | `City.insee_code` + modèle `Event` |
| `prisma/migrations/<ts>_events_datatourisme/migration.sql` | DDL (appliqué par l'utilisateur) |
| `prisma/seed.ts` | INSEE des 3 villes |
| `src/features/events-acquisition/types.ts` | `EventType`, `EventPeriod`, `ParsedEvent`, `RunSummary` |
| `src/features/events-acquisition/lib/event-types.ts` | `@type` DATAtourisme → vocabulaire interne |
| `src/features/events-acquisition/lib/commune.ts` | normalisation + matching commune |
| `src/features/events-acquisition/lib/datatourisme-mapper.ts` | 1 objet JSON-LD → `ParsedEvent` (pur) |
| `src/features/events-acquisition/lib/datatourisme-client.ts` | download + unzip flux → objets bruts |
| `src/features/events-acquisition/services/ingest-runner.ts` | orchestration upsert + suppression périmés |
| `src/features/events-acquisition/queries/events.ts` | lecture liste admin |
| `src/features/events-acquisition/components/AdminEventsLauncher.tsx` | champ recherche + bouton fetch |
| `src/app/api/internal/ingest-events/route.ts` | GET cron (Bearer) |
| `src/app/api/admin/events/fetch/route.ts` | POST fetch commune (admin) |
| `src/app/api/admin/events/route.ts` | GET liste (admin) |
| `src/app/admin/events/page.tsx` | page admin |
| `vercel.json` | entrée cron |

**Note d'implémentation (séparation des responsabilités) :** le filtrage temporel (« événement terminé ») vit dans le **runner**, pas dans le mapper. Le mapper renvoie `null` uniquement quand un champ essentiel manque (id, titre, période, commune). C'est plus testable et conforme à la séparation parse/règles métier.

---

## Task 1: Dépendance + schéma Prisma + migration + seed

**Files:**
- Modify: `package.json` (ajout `fflate`)
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260609120000_events_datatourisme/migration.sql`
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Installer fflate**

Run: `npm install fflate`
Expected: `fflate` ajouté à `dependencies` dans `package.json`.

- [ ] **Step 2: Ajouter `insee_code` au modèle `City`**

Dans `prisma/schema.prisma`, modèle `City`, ajouter le champ après `region`:

```prisma
  insee_code  String?   @unique
```

Et ajouter la relation inverse dans la liste des relations de `City` (après `trail_candidates TrailCandidate[]`):

```prisma
  events           Event[]
```

- [ ] **Step 3: Ajouter le modèle `Event`**

À la fin de `prisma/schema.prisma`, ajouter:

```prisma
// ─── Spec 026 — Événements DATAtourisme ─────────────────────────────────────

model Event {
  id                String    @id @default(uuid())
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt
  deleted_at        DateTime?

  source            String    @default("datatourisme")
  source_id         String
  source_updated_at DateTime?

  city_id           String?
  city              City?     @relation(fields: [city_id], references: [id])
  commune_insee     String
  commune_name      String

  title             String
  description       String?
  event_types       String[]

  start_date        DateTime
  end_date          DateTime
  is_recurring      Boolean   @default(false)
  periods           Json?

  venue_name        String?
  address           String?
  postal_code       String?
  latitude          Float?
  longitude         Float?

  images            String[]
  website           String?
  phone             String?
  email             String?
  price_info        String?

  raw_payload       Json?
  is_active         Boolean   @default(true)

  @@unique([source, source_id])
  @@index([commune_insee, end_date])
  @@index([city_id, start_date])
  @@index([end_date])
}
```

- [ ] **Step 4: Générer le client Prisma (hors DB)**

Run: `npx prisma generate`
Expected: `✔ Generated Prisma Client` (fonctionne sans connexion DB).

- [ ] **Step 5: Créer le fichier de migration SQL**

Créer `prisma/migrations/20260609120000_events_datatourisme/migration.sql`:

```sql
ALTER TABLE "City" ADD COLUMN "insee_code" TEXT;
CREATE UNIQUE INDEX "City_insee_code_key" ON "City"("insee_code");

CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'datatourisme',
    "source_id" TEXT NOT NULL,
    "source_updated_at" TIMESTAMP(3),
    "city_id" TEXT,
    "commune_insee" TEXT NOT NULL,
    "commune_name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_types" TEXT[],
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "periods" JSONB,
    "venue_name" TEXT,
    "address" TEXT,
    "postal_code" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "images" TEXT[],
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "price_info" TEXT,
    "raw_payload" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Event_source_source_id_key" ON "Event"("source", "source_id");
CREATE INDEX "Event_commune_insee_end_date_idx" ON "Event"("commune_insee", "end_date");
CREATE INDEX "Event_city_id_start_date_idx" ON "Event"("city_id", "start_date");
CREATE INDEX "Event_end_date_idx" ON "Event"("end_date");
ALTER TABLE "Event" ADD CONSTRAINT "Event_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

> ⚠️ **Application DB par l'utilisateur** : le sandbox ne peut pas joindre la DB directe (cf. mémoire `reference_db_migration_apply`). L'utilisateur applique la migration avec `npx prisma migrate deploy` (ou `prisma db push`) quand la DB est joignable.

- [ ] **Step 6: Ajouter l'INSEE des 3 villes dans le seed**

Dans `prisma/seed.ts`, après l'upsert existant de Saint-Gervais, ajouter (adapter `lat/long` si besoin):

```ts
const CITIES_INSEE: Array<{ slug: string; name: string; postal_code: string; insee_code: string; latitude: number; longitude: number }> = [
  { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains', postal_code: '74170', insee_code: '74236', latitude: 45.8923, longitude: 6.7123 },
  { slug: 'chamonix-mont-blanc', name: 'Chamonix-Mont-Blanc', postal_code: '74400', insee_code: '74056', latitude: 45.9237, longitude: 6.8694 },
  { slug: 'les-contamines-montjoie', name: 'Les Contamines-Montjoie', postal_code: '74170', insee_code: '74085', latitude: 45.8217, longitude: 6.7281 },
]

for (const c of CITIES_INSEE) {
  await prisma.city.upsert({
    where: { slug: c.slug },
    update: { insee_code: c.insee_code },
    create: {
      name: c.name, slug: c.slug, postal_code: c.postal_code,
      department: 'Haute-Savoie', region: 'Auvergne-Rhône-Alpes',
      latitude: c.latitude, longitude: c.longitude, insee_code: c.insee_code,
    },
  })
}
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json prisma/schema.prisma prisma/migrations prisma/seed.ts
git commit -m "feat(events): schema Event + City.insee_code, migration et seed DATAtourisme"
```

---

## Task 2: Types du domaine

**Files:**
- Create: `src/features/events-acquisition/types.ts`

- [ ] **Step 1: Écrire les types**

Créer `src/features/events-acquisition/types.ts`:

```ts
export type EventType = 'cultural' | 'sport' | 'market' | 'festival' | 'social' | 'other'

export interface EventPeriod {
  start: string // ISO date (YYYY-MM-DD)
  end: string
  startTime?: string
  endTime?: string
}

export interface ParsedEvent {
  sourceId: string
  sourceUpdatedAt: string | null
  title: string
  description: string | null
  eventTypes: EventType[]
  startDate: string
  endDate: string
  isRecurring: boolean
  periods: EventPeriod[]
  communeInsee: string
  communeName: string
  venueName: string | null
  address: string | null
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  images: string[]
  website: string | null
  phone: string | null
  email: string | null
  priceInfo: string | null
  raw: unknown
}

export interface RunSummary {
  fetched: number
  matched: number
  upserted: number
  skipped: number
  deleted: number
}
```

- [ ] **Step 2: Vérifier la compilation TS**

Run: `npx tsc --noEmit`
Expected: aucune erreur sur ce fichier.

- [ ] **Step 3: Commit**

```bash
git add src/features/events-acquisition/types.ts
git commit -m "feat(events): types du domaine ParsedEvent/RunSummary"
```

---

## Task 3: Normalisation des types d'événement

**Files:**
- Create: `src/features/events-acquisition/lib/event-types.ts`
- Test: `tests/unit/events-acquisition.event-types.test.ts`

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/unit/events-acquisition.event-types.test.ts`:

```ts
import { normalizeEventTypes } from '@/features/events-acquisition/lib/event-types'

describe('normalizeEventTypes', () => {
  it('mappe les sous-types DATAtourisme préfixés vers le vocabulaire interne', () => {
    expect(normalizeEventTypes(['schema:Event', 'CulturalEvent'])).toEqual(['cultural'])
    expect(normalizeEventTypes(['SportsCompetition'])).toEqual(['sport'])
    expect(normalizeEventTypes(['SaleEvent'])).toEqual(['market'])
  })

  it('déduplique et combine plusieurs types', () => {
    const r = normalizeEventTypes(['CulturalEvent', 'FestivalEvent', 'CulturalEvent'])
    expect(r.sort()).toEqual(['cultural', 'festival'])
  })

  it('renvoie ["other"] quand aucun type connu', () => {
    expect(normalizeEventTypes(['schema:Event', 'Unknown'])).toEqual(['other'])
    expect(normalizeEventTypes([])).toEqual(['other'])
  })
})
```

- [ ] **Step 2: Lancer le test (doit échouer)**

Run: `npx jest tests/unit/events-acquisition.event-types.test.ts`
Expected: FAIL (`Cannot find module '.../event-types'`).

- [ ] **Step 3: Implémenter**

Créer `src/features/events-acquisition/lib/event-types.ts`:

```ts
import type { EventType } from '../types'

const TYPE_MAP: Record<string, EventType> = {
  CulturalEvent: 'cultural',
  ShowEvent: 'cultural',
  Concert: 'cultural',
  Exhibition: 'cultural',
  TheaterEvent: 'cultural',
  ScreeningEvent: 'cultural',
  SportsCompetition: 'sport',
  SportsEvent: 'sport',
  SportsDemonstration: 'sport',
  SaleEvent: 'market',
  Fair: 'market',
  FairOrShow: 'market',
  FestivalEvent: 'festival',
  Festival: 'festival',
  SocialEvent: 'social',
  LocalAnimation: 'social',
  TraditionalCelebration: 'social',
  Carnival: 'social',
}

export function normalizeEventTypes(types: string[]): EventType[] {
  const out = new Set<EventType>()
  for (const t of types) {
    const key = t.includes(':') ? t.split(':').pop()! : t
    const mapped = TYPE_MAP[key]
    if (mapped) out.add(mapped)
  }
  if (out.size === 0) out.add('other')
  return [...out]
}
```

- [ ] **Step 4: Lancer le test (doit passer)**

Run: `npx jest tests/unit/events-acquisition.event-types.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/events-acquisition/lib/event-types.ts tests/unit/events-acquisition.event-types.test.ts
git commit -m "feat(events): normalisation des types DATAtourisme"
```

---

## Task 4: Normalisation et matching de commune

**Files:**
- Create: `src/features/events-acquisition/lib/commune.ts`
- Test: `tests/unit/events-acquisition.commune.test.ts`

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/unit/events-acquisition.commune.test.ts`:

```ts
import { normalizeCommuneName, isInseeCode, communeMatches } from '@/features/events-acquisition/lib/commune'

describe('commune helpers', () => {
  it('normalise accents, casse et séparateurs', () => {
    expect(normalizeCommuneName('Saint-Gervais-les-Bains')).toBe('saint gervais les bains')
    expect(normalizeCommuneName('Les Contamines-Montjoie')).toBe('les contamines montjoie')
  })

  it('reconnaît un code INSEE à 5 chiffres', () => {
    expect(isInseeCode('74236')).toBe(true)
    expect(isInseeCode('chamonix')).toBe(false)
  })

  it('matche par INSEE exact', () => {
    const ev = { communeInsee: '74236', communeName: 'Saint-Gervais-les-Bains' }
    expect(communeMatches('74236', ev)).toBe(true)
    expect(communeMatches('74056', ev)).toBe(false)
  })

  it('matche par nom partiel insensible aux accents/casse', () => {
    const ev = { communeInsee: '74056', communeName: 'Chamonix-Mont-Blanc' }
    expect(communeMatches('chamonix', ev)).toBe(true)
    expect(communeMatches('CHAMONIX', ev)).toBe(true)
    expect(communeMatches('megève', ev)).toBe(false)
  })
})
```

- [ ] **Step 2: Lancer le test (doit échouer)**

Run: `npx jest tests/unit/events-acquisition.commune.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter**

Créer `src/features/events-acquisition/lib/commune.ts`:

```ts
export function normalizeCommuneName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function isInseeCode(value: string): boolean {
  return /^[0-9]{5}$/.test(value.trim())
}

export function communeMatches(
  filter: string,
  event: { communeInsee: string; communeName: string },
): boolean {
  const f = filter.trim()
  if (isInseeCode(f)) return event.communeInsee === f
  return normalizeCommuneName(event.communeName).includes(normalizeCommuneName(f))
}
```

- [ ] **Step 4: Lancer le test (doit passer)**

Run: `npx jest tests/unit/events-acquisition.commune.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/events-acquisition/lib/commune.ts tests/unit/events-acquisition.commune.test.ts
git commit -m "feat(events): normalisation/matching de commune"
```

---

## Task 5: Mapper JSON-LD → ParsedEvent

> **AVANT CETTE TÂCHE — vérifier le format réel :** télécharger un objet réel depuis le flux (`curl -s "$DATATOURISME_FLUX_URL" -o flux.zip && unzip -o flux.zip -d /tmp/flux` puis ouvrir un fichier objet). Comparer ses chemins JSON-LD au fixture ci-dessous. Si les clés diffèrent, **mettre à jour le fixture ET les accesseurs du mapper ensemble** (le test reste alors significatif). Le mapper doit rester tolérant aux champs manquants.

**Files:**
- Create: `src/features/events-acquisition/lib/datatourisme-mapper.ts`
- Test: `tests/unit/events-acquisition.mapper.test.ts`

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/unit/events-acquisition.mapper.test.ts`:

```ts
import { mapDatatourismeObject } from '@/features/events-acquisition/lib/datatourisme-mapper'

function baseObject(): Record<string, unknown> {
  return {
    '@id': 'https://data.datatourisme.fr/23/abc-123',
    'dc:identifier': 'EVT-123',
    '@type': ['schema:Event', 'CulturalEvent'],
    'rdfs:label': { '@language': 'fr', '@value': 'Concert au Théâtre' },
    lastUpdate: '2026-05-30',
    hasDescription: [{ 'dc:description': { '@language': 'fr', '@value': 'Un concert symphonique.' } }],
    takesPlaceAt: [{ startDate: '2026-07-12', endDate: '2026-07-12', startTime: '20:00:00', endTime: '22:00:00' }],
    isLocatedAt: [{
      'schema:name': { '@language': 'fr', '@value': 'Théâtre du Mont-Blanc' },
      'schema:address': [{
        'schema:streetAddress': ['1 Place du Mont-Blanc'],
        'schema:postalCode': '74170',
        'schema:addressLocality': 'Saint-Gervais-les-Bains',
        hasAddressCity: { insee: '74236', 'rdfs:label': { '@language': 'fr', '@value': 'Saint-Gervais-les-Bains' } },
      }],
      'schema:geo': { 'schema:latitude': '45.8923', 'schema:longitude': '6.7123' },
    }],
    hasContact: [{ 'schema:telephone': ['+33450000000'], 'schema:email': ['info@example.com'], 'foaf:homepage': ['https://example.com'] }],
    hasMainRepresentation: [{ 'ebucore:hasRelatedResource': [{ 'ebucore:locator': 'https://img.example.com/a.jpg' }] }],
  }
}

describe('mapDatatourismeObject', () => {
  it('mappe un événement complet', () => {
    const e = mapDatatourismeObject(baseObject())!
    expect(e).not.toBeNull()
    expect(e.sourceId).toBe('EVT-123')
    expect(e.title).toBe('Concert au Théâtre')
    expect(e.description).toBe('Un concert symphonique.')
    expect(e.eventTypes).toEqual(['cultural'])
    expect(e.startDate).toBe('2026-07-12')
    expect(e.endDate).toBe('2026-07-12')
    expect(e.isRecurring).toBe(false)
    expect(e.communeInsee).toBe('74236')
    expect(e.communeName).toBe('Saint-Gervais-les-Bains')
    expect(e.venueName).toBe('Théâtre du Mont-Blanc')
    expect(e.address).toBe('1 Place du Mont-Blanc')
    expect(e.postalCode).toBe('74170')
    expect(e.latitude).toBeCloseTo(45.8923)
    expect(e.longitude).toBeCloseTo(6.7123)
    expect(e.images).toEqual(['https://img.example.com/a.jpg'])
    expect(e.phone).toBe('+33450000000')
    expect(e.email).toBe('info@example.com')
    expect(e.website).toBe('https://example.com')
  })

  it('agrège plusieurs périodes (min start / max end) et marque récurrent', () => {
    const o = baseObject()
    o.takesPlaceAt = [
      { startDate: '2026-07-12', endDate: '2026-07-12' },
      { startDate: '2026-07-20', endDate: '2026-07-21' },
    ]
    const e = mapDatatourismeObject(o)!
    expect(e.startDate).toBe('2026-07-12')
    expect(e.endDate).toBe('2026-07-21')
    expect(e.isRecurring).toBe(true)
    expect(e.periods).toHaveLength(2)
  })

  it('renvoie null si le titre manque', () => {
    const o = baseObject()
    delete o['rdfs:label']
    expect(mapDatatourismeObject(o)).toBeNull()
  })

  it('renvoie null si la commune (INSEE) manque', () => {
    const o = baseObject()
    ;(o.isLocatedAt as any)[0]['schema:address'][0].hasAddressCity = {}
    expect(mapDatatourismeObject(o)).toBeNull()
  })

  it('tolère les contacts/images absents', () => {
    const o = baseObject()
    delete o.hasContact
    delete o.hasMainRepresentation
    const e = mapDatatourismeObject(o)!
    expect(e.images).toEqual([])
    expect(e.phone).toBeNull()
    expect(e.website).toBeNull()
  })
})
```

- [ ] **Step 2: Lancer le test (doit échouer)**

Run: `npx jest tests/unit/events-acquisition.mapper.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter**

Créer `src/features/events-acquisition/lib/datatourisme-mapper.ts`:

```ts
import type { EventPeriod, ParsedEvent } from '../types'
import { normalizeEventTypes } from './event-types'

type Json = Record<string, any>

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}

function firstString(v: any): string | null {
  for (const item of asArray(v)) {
    if (typeof item === 'string') return item
    if (item && typeof item === 'object' && typeof item['@value'] === 'string') return item['@value']
  }
  return null
}

function localized(v: any): string | null {
  for (const item of asArray(v)) {
    if (item && typeof item === 'object' && item['@language'] === 'fr' && typeof item['@value'] === 'string') {
      return item['@value']
    }
  }
  return firstString(v)
}

function num(v: any): number | null {
  const s = Array.isArray(v) ? v[0] : v
  const n = typeof s === 'string' ? parseFloat(s) : typeof s === 'number' ? s : NaN
  return Number.isFinite(n) ? n : null
}

export function mapDatatourismeObject(obj: Json): ParsedEvent | null {
  const sourceId = firstString(obj['dc:identifier']) ?? (typeof obj['@id'] === 'string' ? obj['@id'] : null)
  if (!sourceId) return null

  const title = localized(obj['rdfs:label'])
  if (!title) return null

  const periods: EventPeriod[] = []
  for (const p of asArray(obj['takesPlaceAt'])) {
    const start = firstString(p?.['startDate'])
    if (!start) continue
    const end = firstString(p?.['endDate']) ?? start
    periods.push({
      start,
      end,
      startTime: firstString(p?.['startTime']) ?? undefined,
      endTime: firstString(p?.['endTime']) ?? undefined,
    })
  }
  if (periods.length === 0) return null
  const startDate = periods.map((p) => p.start).sort()[0]
  const endDate = periods.map((p) => p.end).sort().slice(-1)[0]

  const loc = asArray(obj['isLocatedAt'])[0] ?? {}
  const addr = asArray(loc['schema:address'])[0] ?? {}
  const city = asArray(addr['hasAddressCity'])[0] ?? {}
  const communeInsee = firstString(city['insee'])
  const communeName = localized(city['rdfs:label']) ?? firstString(addr['schema:addressLocality'])
  if (!communeInsee || !communeName) return null

  const geo = asArray(loc['schema:geo'])[0] ?? {}

  const descObj = asArray(obj['hasDescription'])[0] ?? {}
  const description =
    localized(descObj['dc:description']) ??
    localized(descObj['shortDescription']) ??
    localized(obj['rdfs:comment'])

  const contact = asArray(obj['hasContact'])[0] ?? {}
  const images: string[] = []
  for (const rep of asArray(obj['hasMainRepresentation'])) {
    for (const res of asArray(rep?.['ebucore:hasRelatedResource'])) {
      const url = firstString(res?.['ebucore:locator'])
      if (url) images.push(url)
    }
  }

  return {
    sourceId,
    sourceUpdatedAt: firstString(obj['lastUpdate']),
    title,
    description,
    eventTypes: normalizeEventTypes(asArray(obj['@type']).filter((t): t is string => typeof t === 'string')),
    startDate,
    endDate,
    isRecurring: periods.length > 1,
    periods,
    communeInsee,
    communeName,
    venueName: localized(loc['schema:name']) ?? localized(loc['rdfs:label']),
    address: firstString(addr['schema:streetAddress']),
    postalCode: firstString(addr['schema:postalCode']),
    latitude: num(geo['schema:latitude']),
    longitude: num(geo['schema:longitude']),
    images,
    website: firstString(contact['foaf:homepage']) ?? firstString(contact['schema:url']),
    phone: firstString(contact['schema:telephone']),
    email: firstString(contact['schema:email']),
    priceInfo: null,
    raw: obj,
  }
}
```

- [ ] **Step 4: Lancer le test (doit passer)**

Run: `npx jest tests/unit/events-acquisition.mapper.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/events-acquisition/lib/datatourisme-mapper.ts tests/unit/events-acquisition.mapper.test.ts
git commit -m "feat(events): mapper JSON-LD DATAtourisme -> ParsedEvent"
```

---

## Task 6: Client de flux (download + unzip)

**Files:**
- Create: `src/features/events-acquisition/lib/datatourisme-client.ts`
- Test: `tests/unit/events-acquisition.client.test.ts`

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/unit/events-acquisition.client.test.ts`:

```ts
import { zipSync, strToU8 } from 'fflate'
import { parseFluxArchive, fetchFluxObjects } from '@/features/events-acquisition/lib/datatourisme-client'

function buildZip(): Uint8Array {
  return zipSync({
    'index.json': strToU8(JSON.stringify([{ file: 'objects/a.json' }])),
    'objects/a.json': strToU8(JSON.stringify({ '@id': 'a', 'dc:identifier': 'A' })),
    'objects/b.json': strToU8(JSON.stringify({ '@id': 'b', 'dc:identifier': 'B' })),
    'context.jsonld': strToU8('{}'),
  })
}

describe('datatourisme-client', () => {
  it('parseFluxArchive: extrait les objets .json hors index/context', () => {
    const objects = parseFluxArchive(buildZip())
    const ids = objects.map((o: any) => o['dc:identifier']).sort()
    expect(ids).toEqual(['A', 'B'])
  })

  it('fetchFluxObjects: télécharge puis parse l’archive', async () => {
    const zip = buildZip()
    const realFetch = global.fetch
    global.fetch = jest.fn(async () => ({
      ok: true,
      arrayBuffer: async () => zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength),
    })) as unknown as typeof fetch
    try {
      const objects = await fetchFluxObjects('https://flux.example/test')
      expect(objects).toHaveLength(2)
    } finally {
      global.fetch = realFetch
    }
  })

  it('fetchFluxObjects: lève une erreur si l’URL est absente', async () => {
    await expect(fetchFluxObjects(undefined)).rejects.toThrow('DATATOURISME_FLUX_URL')
  })
})
```

- [ ] **Step 2: Lancer le test (doit échouer)**

Run: `npx jest tests/unit/events-acquisition.client.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter**

Créer `src/features/events-acquisition/lib/datatourisme-client.ts`:

```ts
import { unzipSync, strFromU8 } from 'fflate'

export function parseFluxArchive(zip: Uint8Array): unknown[] {
  const files = unzipSync(zip)
  const objects: unknown[] = []
  for (const [name, data] of Object.entries(files)) {
    if (!name.endsWith('.json')) continue
    if (name.endsWith('index.json') || name.endsWith('context.jsonld')) continue
    const parsed = JSON.parse(strFromU8(data))
    if (Array.isArray(parsed)) objects.push(...parsed)
    else if (parsed && Array.isArray((parsed as Record<string, unknown>)['@graph'])) {
      objects.push(...((parsed as Record<string, unknown>)['@graph'] as unknown[]))
    } else {
      objects.push(parsed)
    }
  }
  return objects
}

export async function fetchFluxObjects(
  fluxUrl: string | undefined = process.env.DATATOURISME_FLUX_URL,
): Promise<unknown[]> {
  if (!fluxUrl) throw new Error('DATATOURISME_FLUX_URL is not set')
  const res = await fetch(fluxUrl)
  if (!res.ok) throw new Error(`DATAtourisme flux download failed: ${res.status}`)
  const buf = new Uint8Array(await res.arrayBuffer())
  return parseFluxArchive(buf)
}
```

- [ ] **Step 4: Lancer le test (doit passer)**

Run: `npx jest tests/unit/events-acquisition.client.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/events-acquisition/lib/datatourisme-client.ts tests/unit/events-acquisition.client.test.ts
git commit -m "feat(events): client de flux DATAtourisme (download + unzip)"
```

---

## Task 7: Runner d'ingestion

**Files:**
- Create: `src/features/events-acquisition/services/ingest-runner.ts`
- Test: `tests/integration/events-acquisition.ingest-runner.test.ts`

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/integration/events-acquisition.ingest-runner.test.ts`:

```ts
jest.mock('@/features/events-acquisition/lib/datatourisme-client', () => ({
  fetchFluxObjects: jest.fn(),
}))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findUnique: jest.fn(), findMany: jest.fn() },
    event: { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { fetchFluxObjects } from '@/features/events-acquisition/lib/datatourisme-client'
import { runEventIngestion } from '@/features/events-acquisition/services/ingest-runner'

const FUTURE = '2999-01-01'
const PAST = '2000-01-01'

function obj(id: string, insee: string, name: string, end = FUTURE): Record<string, unknown> {
  return {
    'dc:identifier': id,
    '@type': ['schema:Event', 'CulturalEvent'],
    'rdfs:label': { '@language': 'fr', '@value': `Event ${id}` },
    takesPlaceAt: [{ startDate: '2026-07-01', endDate: end }],
    isLocatedAt: [{ 'schema:address': [{ hasAddressCity: { insee, 'rdfs:label': { '@language': 'fr', '@value': name } } }] }],
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.event.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
  ;(prisma.event.findMany as jest.Mock).mockResolvedValue([])
  ;(prisma.city.findMany as jest.Mock).mockResolvedValue([])
  ;(prisma.city.findUnique as jest.Mock).mockResolvedValue(null)
  ;(prisma.event.upsert as jest.Mock).mockResolvedValue({})
})

describe('runEventIngestion', () => {
  it('exclut les événements déjà terminés', async () => {
    ;(fetchFluxObjects as jest.Mock).mockResolvedValue([
      obj('A', '74236', 'Saint-Gervais-les-Bains', FUTURE),
      obj('B', '74236', 'Saint-Gervais-les-Bains', PAST),
    ])
    ;(prisma.city.findMany as jest.Mock).mockResolvedValue([{ insee_code: '74236' }])
    const r = await runEventIngestion({ source: 'cron' })
    expect(r.fetched).toBe(1)
    expect(r.upserted).toBe(1)
  })

  it('cron: ne traite que les communes suivies (City.insee_code ∪ events existants)', async () => {
    ;(fetchFluxObjects as jest.Mock).mockResolvedValue([
      obj('A', '74236', 'Saint-Gervais-les-Bains'),
      obj('B', '74256', 'Sallanches'),
    ])
    ;(prisma.city.findMany as jest.Mock).mockResolvedValue([{ insee_code: '74236' }])
    const r = await runEventIngestion({ source: 'cron' })
    expect(r.matched).toBe(1)
    expect(r.skipped).toBe(1)
    expect(prisma.event.upsert).toHaveBeenCalledTimes(1)
  })

  it('admin: filtre par commune et lie city_id quand la City existe', async () => {
    ;(fetchFluxObjects as jest.Mock).mockResolvedValue([
      obj('A', '74056', 'Chamonix-Mont-Blanc'),
      obj('B', '74236', 'Saint-Gervais-les-Bains'),
    ])
    ;(prisma.city.findUnique as jest.Mock).mockResolvedValue({ id: 'city-cha' })
    const r = await runEventIngestion({ communeFilter: 'chamonix', source: 'admin' })
    expect(r.matched).toBe(1)
    const call = (prisma.event.upsert as jest.Mock).mock.calls[0][0]
    expect(call.create.city_id).toBe('city-cha')
    expect(call.where).toEqual({ source_source_id: { source: 'datatourisme', source_id: 'A' } })
  })

  it('city_id null si aucune City ne correspond à l’INSEE', async () => {
    ;(fetchFluxObjects as jest.Mock).mockResolvedValue([obj('B', '74256', 'Sallanches')])
    ;(prisma.city.findUnique as jest.Mock).mockResolvedValue(null)
    await runEventIngestion({ communeFilter: '74256', source: 'admin' })
    const call = (prisma.event.upsert as jest.Mock).mock.calls[0][0]
    expect(call.create.city_id).toBeNull()
    expect(call.create.commune_insee).toBe('74256')
  })

  it('supprime les événements périmés', async () => {
    ;(fetchFluxObjects as jest.Mock).mockResolvedValue([])
    ;(prisma.event.deleteMany as jest.Mock).mockResolvedValue({ count: 4 })
    const r = await runEventIngestion({ source: 'cron' })
    expect(prisma.event.deleteMany).toHaveBeenCalled()
    expect(r.deleted).toBe(4)
  })
})
```

- [ ] **Step 2: Lancer le test (doit échouer)**

Run: `npx jest tests/integration/events-acquisition.ingest-runner.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter**

Créer `src/features/events-acquisition/services/ingest-runner.ts`:

```ts
import { prisma } from '@/shared/lib/prisma'
import { fetchFluxObjects } from '../lib/datatourisme-client'
import { mapDatatourismeObject } from '../lib/datatourisme-mapper'
import { communeMatches } from '../lib/commune'
import type { ParsedEvent, RunSummary } from '../types'

const SOURCE = 'datatourisme'

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function runEventIngestion(
  params: { communeFilter?: string; source?: 'cron' | 'admin' } = {},
): Promise<RunSummary> {
  const { communeFilter } = params
  const today = startOfToday()
  const objects = await fetchFluxObjects()

  const parsed: ParsedEvent[] = []
  for (const obj of objects) {
    const ev = mapDatatourismeObject(obj as Record<string, unknown>)
    if (ev && new Date(ev.endDate) >= today) parsed.push(ev)
  }
  const fetched = parsed.length

  let selected: ParsedEvent[]
  if (communeFilter) {
    selected = parsed.filter((e) => communeMatches(communeFilter, e))
  } else {
    const targets = await cronTargetInsee()
    selected = parsed.filter((e) => targets.has(e.communeInsee))
  }
  const matched = selected.length

  let upserted = 0
  for (const e of selected) {
    const city = await prisma.city.findUnique({
      where: { insee_code: e.communeInsee },
      select: { id: true },
    })
    const row = toRow(e, city?.id ?? null)
    await prisma.event.upsert({
      where: { source_source_id: { source: SOURCE, source_id: e.sourceId } },
      create: row,
      update: row,
    })
    upserted++
  }

  const del = await prisma.event.deleteMany({ where: { end_date: { lt: today } } })

  return { fetched, matched, upserted, skipped: fetched - matched, deleted: del.count }
}

async function cronTargetInsee(): Promise<Set<string>> {
  const [events, cities] = await Promise.all([
    prisma.event.findMany({
      where: { deleted_at: null },
      select: { commune_insee: true },
      distinct: ['commune_insee'],
    }),
    prisma.city.findMany({
      where: { insee_code: { not: null } },
      select: { insee_code: true },
    }),
  ])
  const set = new Set<string>()
  for (const e of events) set.add(e.commune_insee)
  for (const c of cities) if (c.insee_code) set.add(c.insee_code)
  return set
}

function toRow(e: ParsedEvent, cityId: string | null) {
  return {
    source: SOURCE,
    source_id: e.sourceId,
    source_updated_at: e.sourceUpdatedAt ? new Date(e.sourceUpdatedAt) : null,
    city_id: cityId,
    commune_insee: e.communeInsee,
    commune_name: e.communeName,
    title: e.title,
    description: e.description,
    event_types: e.eventTypes,
    start_date: new Date(e.startDate),
    end_date: new Date(e.endDate),
    is_recurring: e.isRecurring,
    periods: e.periods as unknown as object,
    venue_name: e.venueName,
    address: e.address,
    postal_code: e.postalCode,
    latitude: e.latitude,
    longitude: e.longitude,
    images: e.images,
    website: e.website,
    phone: e.phone,
    email: e.email,
    price_info: e.priceInfo,
    raw_payload: e.raw as object,
  }
}
```

- [ ] **Step 4: Lancer le test (doit passer)**

Run: `npx jest tests/integration/events-acquisition.ingest-runner.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/events-acquisition/services/ingest-runner.ts tests/integration/events-acquisition.ingest-runner.test.ts
git commit -m "feat(events): runner d'ingestion (upsert + suppression des périmés)"
```

---

## Task 8: Query de lecture (liste admin)

**Files:**
- Create: `src/features/events-acquisition/queries/events.ts`

- [ ] **Step 1: Implémenter**

Créer `src/features/events-acquisition/queries/events.ts`:

```ts
import { prisma } from '@/shared/lib/prisma'

export async function listEvents(params: { communeInsee?: string; limit?: number } = {}) {
  return prisma.event.findMany({
    where: {
      deleted_at: null,
      ...(params.communeInsee ? { commune_insee: params.communeInsee } : {}),
    },
    orderBy: { start_date: 'asc' },
    take: params.limit ?? 200,
    select: {
      id: true,
      title: true,
      commune_name: true,
      commune_insee: true,
      start_date: true,
      end_date: true,
      event_types: true,
      source: true,
    },
  })
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/features/events-acquisition/queries/events.ts
git commit -m "feat(events): query liste admin des événements"
```

---

## Task 9: Route cron interne (GET, Bearer)

**Files:**
- Create: `src/app/api/internal/ingest-events/route.ts`
- Test: `tests/contract/events-acquisition.cron.api.test.ts`

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/contract/events-acquisition.cron.api.test.ts`:

```ts
import { NextRequest } from 'next/server'

const mockRun = jest.fn()
jest.mock('@/features/events-acquisition/services/ingest-runner', () => ({
  runEventIngestion: (...a: unknown[]) => mockRun(...a),
}))

import { GET } from '@/app/api/internal/ingest-events/route'

const SECRET = 'test-internal-secret'

function req(auth?: string): NextRequest {
  return new NextRequest('http://localhost/api/internal/ingest-events', {
    method: 'GET',
    headers: auth ? { authorization: auth } : {},
  })
}

describe('GET /api/internal/ingest-events', () => {
  const realSecret = process.env.INTERNAL_API_SECRET
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.INTERNAL_API_SECRET = SECRET
  })
  afterAll(() => {
    if (realSecret === undefined) delete process.env.INTERNAL_API_SECRET
    else process.env.INTERNAL_API_SECRET = realSecret
  })

  it('401 sans Bearer valide et ne lance pas le runner', async () => {
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('200 avec Bearer valide et renvoie le résumé', async () => {
    mockRun.mockResolvedValue({ fetched: 3, matched: 2, upserted: 2, skipped: 1, deleted: 0 })
    const res = await GET(req(`Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { fetched: 3, matched: 2, upserted: 2, skipped: 1, deleted: 0 } })
    expect(mockRun).toHaveBeenCalledWith({ source: 'cron' })
  })
})
```

- [ ] **Step 2: Lancer le test (doit échouer)**

Run: `npx jest tests/contract/events-acquisition.cron.api.test.ts`
Expected: FAIL (route introuvable).

- [ ] **Step 3: Implémenter**

Créer `src/app/api/internal/ingest-events/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { runEventIngestion } from '@/features/events-acquisition/services/ingest-runner'

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return header === `Bearer ${secret}`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await runEventIngestion({ source: 'cron' })
  return NextResponse.json({ data })
}
```

- [ ] **Step 4: Lancer le test (doit passer)**

Run: `npx jest tests/contract/events-acquisition.cron.api.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/internal/ingest-events/route.ts tests/contract/events-acquisition.cron.api.test.ts
git commit -m "feat(events): route cron interne d'ingestion"
```

---

## Task 10: Routes admin (fetch + liste)

**Files:**
- Create: `src/app/api/admin/events/fetch/route.ts`
- Create: `src/app/api/admin/events/route.ts`
- Test: `tests/contract/events-acquisition.admin.api.test.ts`

- [ ] **Step 1: Écrire le test (échoue)**

Créer `tests/contract/events-acquisition.admin.api.test.ts`:

```ts
import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const mockSession = jest.fn()
jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: (...a: unknown[]) => mockSession(...a),
}))
const mockRun = jest.fn()
jest.mock('@/features/events-acquisition/services/ingest-runner', () => ({
  runEventIngestion: (...a: unknown[]) => mockRun(...a),
}))
const mockList = jest.fn()
jest.mock('@/features/events-acquisition/queries/events', () => ({
  listEvents: (...a: unknown[]) => mockList(...a),
}))

import { POST } from '@/app/api/admin/events/fetch/route'
import { GET } from '@/app/api/admin/events/route'

function postReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/events/fetch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSession.mockResolvedValue({ user: { id: 'admin-1' }, error: null })
})

describe('POST /api/admin/events/fetch', () => {
  it('refuse si non-admin', async () => {
    mockSession.mockResolvedValue({ user: null, error: NextResponse.json({ error: 'x' }, { status: 403 }) })
    const res = await POST(postReq({ commune: 'chamonix' }))
    expect(res.status).toBe(403)
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('400 si commune manquante', async () => {
    const res = await POST(postReq({}))
    expect(res.status).toBe(400)
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('lance le runner avec la commune et renvoie le résumé', async () => {
    mockRun.mockResolvedValue({ fetched: 5, matched: 3, upserted: 3, skipped: 2, deleted: 1 })
    const res = await POST(postReq({ commune: 'chamonix' }))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { fetched: 5, matched: 3, upserted: 3, skipped: 2, deleted: 1 } })
    expect(mockRun).toHaveBeenCalledWith({ communeFilter: 'chamonix', source: 'admin' })
  })
})

describe('GET /api/admin/events', () => {
  it('renvoie la liste pour un admin', async () => {
    mockList.mockResolvedValue([{ id: 'e1', title: 'X' }])
    const res = await GET()
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: [{ id: 'e1', title: 'X' }] })
  })
})
```

- [ ] **Step 2: Lancer le test (doit échouer)**

Run: `npx jest tests/contract/events-acquisition.admin.api.test.ts`
Expected: FAIL (routes introuvables).

- [ ] **Step 3: Implémenter la route fetch**

Créer `src/app/api/admin/events/fetch/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { readJson, parsedOrValidationError } from '@/features/poi-acquisition/lib/api'
import { runEventIngestion } from '@/features/events-acquisition/services/ingest-runner'

const FetchSchema = z.object({ commune: z.string().min(1).max(120) })

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(FetchSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  const data = await runEventIngestion({ communeFilter: parsed.commune, source: 'admin' })
  return NextResponse.json({ data })
}
```

- [ ] **Step 4: Implémenter la route liste**

Créer `src/app/api/admin/events/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { listEvents } from '@/features/events-acquisition/queries/events'

export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const data = await listEvents()
  return NextResponse.json({ data })
}
```

- [ ] **Step 5: Lancer le test (doit passer)**

Run: `npx jest tests/contract/events-acquisition.admin.api.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/events tests/contract/events-acquisition.admin.api.test.ts
git commit -m "feat(events): routes admin fetch + liste"
```

---

## Task 11: UI admin (launcher + page)

**Files:**
- Create: `src/features/events-acquisition/components/AdminEventsLauncher.tsx`
- Create: `src/app/admin/events/page.tsx`
- Test: `tests/integration/events-acquisition.admin-launcher.test.tsx`

- [ ] **Step 1: Écrire le test du launcher (échoue)**

Créer `tests/integration/events-acquisition.admin-launcher.test.tsx`:

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdminEventsLauncher } from '@/features/events-acquisition/components/AdminEventsLauncher'

describe('AdminEventsLauncher', () => {
  afterEach(() => jest.restoreAllMocks())

  it('poste la commune et affiche le résumé', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({ data: { fetched: 5, matched: 3, upserted: 3, skipped: 2, deleted: 1 } }),
    }))
    global.fetch = fetchMock as unknown as typeof fetch

    render(<AdminEventsLauncher />)
    fireEvent.change(screen.getByPlaceholderText(/commune/i), { target: { value: 'chamonix' } })
    fireEvent.click(screen.getByRole('button', { name: /fetcher/i }))

    await waitFor(() => expect(screen.getByText(/3 événement/i)).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/events/fetch', expect.objectContaining({ method: 'POST' }))
  })

  it('affiche l’erreur renvoyée par l’API', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({ error: { message: 'Boom' } }),
    })) as unknown as typeof fetch

    render(<AdminEventsLauncher />)
    fireEvent.change(screen.getByPlaceholderText(/commune/i), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: /fetcher/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Boom'))
  })
})
```

- [ ] **Step 2: Lancer le test (doit échouer)**

Run: `npx jest tests/integration/events-acquisition.admin-launcher.test.tsx`
Expected: FAIL (composant introuvable).

- [ ] **Step 3: Implémenter le launcher**

Créer `src/features/events-acquisition/components/AdminEventsLauncher.tsx`:

```tsx
'use client'

import { useState } from 'react'

interface Summary {
  fetched: number
  matched: number
  upserted: number
  skipped: number
  deleted: number
}

export function AdminEventsLauncher() {
  const [commune, setCommune] = useState('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onFetch() {
    setLoading(true)
    setError(null)
    setSummary(null)
    try {
      const res = await fetch('/api/admin/events/fetch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ commune }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error?.message ?? 'Erreur lors de la récupération')
        return
      }
      setSummary(json.data as Summary)
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200/60 bg-white p-4 space-y-3">
      <div className="flex gap-2">
        <input
          value={commune}
          onChange={(e) => setCommune(e.target.value)}
          placeholder="Commune ou code INSEE (ex : Chamonix, 74056)"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={onFetch}
          disabled={loading || commune.trim().length === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Récupération…' : 'Fetcher'}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {summary && (
        <p className="text-sm text-emerald-700">
          {summary.upserted} événement(s) mis à jour, {summary.deleted} périmé(s) supprimé(s).
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Lancer le test (doit passer)**

Run: `npx jest tests/integration/events-acquisition.admin-launcher.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Implémenter la page admin**

Créer `src/app/admin/events/page.tsx`:

```tsx
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { AdminEventsLauncher } from '@/features/events-acquisition/components/AdminEventsLauncher'
import { listEvents } from '@/features/events-acquisition/queries/events'

export default async function AdminEventsPage() {
  await getPageAdmin()
  const events = await listEvents()

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Événements DATAtourisme</h1>
        <p className="text-sm text-gray-500">
          Récupérez les manifestations d’une commune de Haute-Savoie. Le cron quotidien
          rafraîchit automatiquement les communes déjà présentes.
        </p>
      </header>

      <AdminEventsLauncher />

      <div className="overflow-x-auto rounded-xl border border-gray-200/60">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">Titre</th>
              <th className="px-3 py-2">Commune</th>
              <th className="px-3 py-2">Début</th>
              <th className="px-3 py-2">Fin</th>
              <th className="px-3 py-2">Types</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{e.title}</td>
                <td className="px-3 py-2">{e.commune_name}</td>
                <td className="px-3 py-2">{e.start_date.toISOString().slice(0, 10)}</td>
                <td className="px-3 py-2">{e.end_date.toISOString().slice(0, 10)}</td>
                <td className="px-3 py-2">{e.event_types.join(', ')}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                  Aucun événement. Lancez une récupération ci-dessus.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 7: Commit**

```bash
git add src/features/events-acquisition/components/AdminEventsLauncher.tsx src/app/admin/events/page.tsx tests/integration/events-acquisition.admin-launcher.test.tsx
git commit -m "feat(events): UI admin (launcher recherche commune + tableau)"
```

---

## Task 12: Cron Vercel + documentation env

**Files:**
- Modify: `vercel.json`
- Modify: `.env.example` (créer s'il n'existe pas)

- [ ] **Step 1: Ajouter l'entrée cron**

Dans `vercel.json`, ajouter à la fin du tableau `crons` (après l'entrée `refine-trail-geometry`):

```json
    {
      "path": "/api/internal/ingest-events",
      "schedule": "0 5 * * *"
    }
```

- [ ] **Step 2: Documenter la variable d'env**

Ajouter à `.env.example` (créer le fichier si absent):

```bash
# Flux DATAtourisme (territoire Haute-Savoie, type Fête et manifestation)
# Format: https://diffuseur.datatourisme.fr/webservice/<FLUX_ID>/<API_KEY>
DATATOURISME_FLUX_URL=
```

- [ ] **Step 3: Vérifier le JSON**

Run: `node -e "require('./vercel.json'); console.log('vercel.json OK')"`
Expected: `vercel.json OK`.

- [ ] **Step 4: Commit**

```bash
git add vercel.json .env.example
git commit -m "chore(events): cron quotidien + doc DATATOURISME_FLUX_URL"
```

---

## Task 13: Vérification finale

- [ ] **Step 1: Suite de tests complète**

Run: `npx jest`
Expected: tous les tests passent (les nouveaux tests events-acquisition inclus).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: aucune erreur (corriger les warnings éventuels sur les nouveaux fichiers).

- [ ] **Step 4: Rappel actions manuelles utilisateur**

Vérifier que ces points sont communiqués à l'utilisateur (hors code) :
1. Créer le flux DATAtourisme (territoire 74, type Fête et manifestation) → renseigner `DATATOURISME_FLUX_URL`.
2. Appliquer la migration sur la DB (`npx prisma migrate deploy`) + `npx prisma db seed`.
3. Vérifier que `INTERNAL_API_SECRET` est défini en production.

---

## Self-Review (effectuée)

**Couverture spec :**
- Flux 74 + download/unzip → Task 6 ✅
- Modèle Event + City.insee_code + migration + seed → Task 1 ✅
- Mapping JSON-LD → Task 5 ✅ (avec garde « vérifier format réel »)
- Types normalisés → Task 3 ✅
- Runner upsert idempotent + city optionnelle + suppression périmés + exclusion terminés → Task 7 ✅
- Cron quotidien (ensemble suivi) → Task 9 + Task 12 ✅
- Recherche admin par commune (toute commune 74) → Task 10 + Task 11 ✅
- Suppression définitive des périmés → Task 7 ✅
- Tests unit/integration/contract → Tasks 3-11 ✅

**Cohérence des types :** `runEventIngestion({ communeFilter?, source })` et `RunSummary {fetched,matched,upserted,skipped,deleted}` identiques entre runner (T7), routes (T9/T10) et UI (T11). Clé d'upsert `source_source_id` cohérente entre runner et test contract. `ParsedEvent` cohérent entre mapper (T5) et runner (T7).

**Placeholders :** aucun. Les champs JSON-LD du mapper sont marqués « à vérifier sur échantillon réel » — c'est une dépendance externe assumée, avec procédure de vérification fournie, pas un trou.
