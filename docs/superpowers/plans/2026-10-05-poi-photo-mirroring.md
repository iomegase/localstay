# Copie et optimisation des photos des POI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Copier une fois les photos des POI publiés dans Supabase `guide-photos` (WebP ≤ 1600 px) et les servir à la place des URL tierces, avec un crédit « Photos : <nom> » sur la fiche.

**Architecture:** Une table `PoiPhotoMirror` relie `source_url` → `storage_url` sans toucher `PointOfInterest.photos`. Un service télécharge en sécurité, convertit avec `sharp`, envoie dans Supabase et enregistre la correspondance ; il est appelé à la publication (`after()`), par une tâche quotidienne et par un script de reprise. À l'affichage, une table de correspondance mise en cache (`unstable_cache`, tag `poi-photo-mirrors`) remplace chaque URL d'origine par sa copie ; `RemotePoiImage` passe par `next/image` pour les copies.

**Tech Stack:** Next.js 16 App Router, Prisma 5 / PostgreSQL (Supabase), Supabase Storage, `sharp`, Zod, Jest + Testing Library.

**Spec:** `specs/features/063-poi-photo-mirroring/spec.md` (approved 2026-10-05)

## Global Constraints

- Copie : WebP, largeur ≤ 1600 px, `rotate()` EXIF, qualité 82 ; chemin `guide-photos/pois/<poiId>/<empreinte>.webp`.
- Téléchargement : `https` uniquement ; hôtes privés/locaux/réservés refusés (y compris après résolution DNS et à chaque redirection, 3 redirections max) ; `image/*` ; 8 Mo max ; 10 s max.
- `PointOfInterest.photos` n'est jamais modifié par la copie (BR-02).
- Une URL déjà hébergée par le stockage Supabase du projet n'est jamais recopiée (BR-03).
- Échec ou absence de copie → URL d'origine, sans erreur visible (BR-04).
- Aucune suppression physique (BR-05) ; toute table a `id` uuid, `created_at`, `updated_at`, `deleted_at`.
- Tâche quotidienne : 40 photos max par exécution (BR-06), `15 4 * * *`, auth `Authorization: Bearer ${INTERNAL_API_SECRET}`, erreur `{ error: { code, message, details } }`.
- Crédit : « Photos : <nom du POI> », après la description et avant les boutons ; lien `website` en `rel="nofollow noopener"` + nouvel onglet, sinon nom seul ; absent si aucune photo tierce.
- TypeScript strict, pas de `any`, Zod sur les entrées des routes, Gemini non utilisé.

## Review Focus

- Une photo tierce qui redirige vers une adresse interne (ex. `http://169.254.169.254`) doit être refusée au saut de redirection, pas seulement à l'URL initiale → test dans Task 2.
- Un serveur qui annonce un petit `content-length` mais envoie plus de 8 Mo doit être coupé pendant la lecture → test dans Task 2.
- Deux exécutions concurrentes (publication + tâche quotidienne) sur la même photo ne doivent pas créer de doublon ni d'erreur → `upsert` sur (`poi_id`, `source_url`), test dans Task 3.
- Une copie Supabase qui renvoie 404 (fichier supprimé à la main) doit retomber sur l'image de secours, pas sur une image cassée → test dans Task 6.
- Les URL relatives ou `/fallback/...` du guide privé ne doivent pas être prises pour des photos tierces (ni copiées, ni créditées) → tests dans Tasks 3 et 7.

---

## File Structure

| Fichier | Rôle |
|---|---|
| `prisma/schema.prisma` | Modèle `PoiPhotoMirror` + relation inverse |
| `prisma/migrations/20261005150000_poi_photo_mirror/migration.sql` | Migration additive |
| `src/features/poi-photos/lib/storage-url.ts` | `isMyStayStorageUrl(url)` (client + serveur) |
| `src/features/poi-photos/services/safe-image-download.ts` | Téléchargement sécurisé (SSRF, taille, durée, type) |
| `src/features/poi-photos/services/mirror-poi-photos.ts` | `mirrorPoiPhotos(poiId)`, `mirrorPendingPoiPhotos(limit)` |
| `src/features/poi-photos/queries/photo-mirror-map.ts` | Table de correspondance en cache + `resolvePoiPhotoUrl` / `resolvePoiPhotoList` |
| `src/app/api/internal/poi-photo-mirrors/sync/route.ts` | Tâche quotidienne |
| `scripts/mirror-poi-photos.ts` | Reprise initiale |
| `src/app/api/admin/pois/[id]/discovery-publication/route.ts` | Déclenchement `after()` à la publication |
| `src/features/public-discovery/queries/public-discovery.ts` | Résolution des photos + `photo_credit` |
| `src/features/public-discovery/types.ts` | Champ `photo_credit` |
| `src/features/public-discovery/components/RemotePoiImage.tsx` | Branche `next/image` pour les copies |
| `src/features/public-discovery/components/DiscoveryPoiView.tsx` | Ligne de crédit |
| `src/features/categories/queries/poi-cards.ts`, `all-poi-cards.ts`, `src/features/city-guide/queries/cities.ts`, `src/features/guide-app/queries/private-guide-data.ts` | Résolution des photos (guide) |
| `vercel.json` | Tâche planifiée |

---

### Task 1: Modèle `PoiPhotoMirror` et migration

**Files:**
- Modify: `prisma/schema.prisma` (modèle `PointOfInterest` + nouveau modèle)
- Create: `prisma/migrations/20261005150000_poi_photo_mirror/migration.sql`

**Interfaces:**
- Produces: `prisma.poiPhotoMirror` (`id`, `created_at`, `updated_at`, `deleted_at`, `poi_id`, `source_url`, `storage_url`, `width`, `bytes`), unique `poi_id_source_url`.

- [ ] **Step 1: Ajouter le modèle**

Dans `model PointOfInterest`, ajouter la relation inverse à côté des autres relations :

```prisma
  photo_mirrors PoiPhotoMirror[]
```

À la fin du fichier :

```prisma
// Spec 063 — copie des photos tierces des POI publiés dans le stockage MyStay.
// `PointOfInterest.photos` reste la source ; cette table ne fait que la correspondance.
model PoiPhotoMirror {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  poi_id      String
  poi         PointOfInterest @relation(fields: [poi_id], references: [id])
  source_url  String
  storage_url String
  width       Int
  bytes       Int

  @@unique([poi_id, source_url])
  @@index([source_url])
}
```

- [ ] **Step 2: Écrire la migration additive**

`prisma/migrations/20261005150000_poi_photo_mirror/migration.sql` :

```sql
-- Spec 063 — Copie des photos des POI (additif, idempotent)
CREATE TABLE IF NOT EXISTS "PoiPhotoMirror" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "poi_id" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,
    CONSTRAINT "PoiPhotoMirror_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PoiPhotoMirror_poi_id_source_url_key" ON "PoiPhotoMirror"("poi_id", "source_url");
CREATE INDEX IF NOT EXISTS "PoiPhotoMirror_source_url_idx" ON "PoiPhotoMirror"("source_url");

DO $$ BEGIN
  ALTER TABLE "PoiPhotoMirror" ADD CONSTRAINT "PoiPhotoMirror_poi_id_fkey"
    FOREIGN KEY ("poi_id") REFERENCES "PointOfInterest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

- [ ] **Step 3: Valider et générer le client**

Run: `npx prisma validate && npx prisma generate`
Expected: `The schema at prisma/schema.prisma is valid` puis client généré, sans erreur.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20261005150000_poi_photo_mirror/migration.sql
git commit -m "feat(063): modèle PoiPhotoMirror et migration additive"
```

> La migration est appliquée en production à la Task 9 (`prisma migrate deploy`, cf. mémoire « Appliquer les migrations DB »).

---

### Task 2: URL MyStay et téléchargement sécurisé

**Files:**
- Create: `src/features/poi-photos/lib/storage-url.ts`
- Create: `src/features/poi-photos/services/safe-image-download.ts`
- Test: `tests/unit/poi-photo-mirroring.AC-02-01-03.safe-download.test.ts`

**Interfaces:**
- Produces:
  - `isMyStayStorageUrl(url: string): boolean`
  - `isThirdPartyPhotoUrl(url: string): boolean` — `https?` absolu et non MyStay
  - `downloadImageSafely(url: string, deps?: DownloadDeps): Promise<DownloadResult>` avec
    `type DownloadResult = { ok: true; body: Buffer; contentType: string } | { ok: false; reason: 'NOT_HTTPS' | 'PRIVATE_HOST' | 'TOO_MANY_REDIRECTS' | 'HTTP_ERROR' | 'NOT_IMAGE' | 'TOO_LARGE' | 'TIMEOUT' | 'NETWORK' }`
    et `type DownloadDeps = { fetch: typeof fetch; lookup: (host: string) => Promise<string[]> }`.

- [ ] **Step 1: Write the failing test**

```ts
import {
  downloadImageSafely,
  type DownloadDeps,
} from '@/features/poi-photos/services/safe-image-download'
import { isMyStayStorageUrl, isThirdPartyPhotoUrl } from '@/features/poi-photos/lib/storage-url'

const SUPABASE = 'https://abcdefgh.supabase.co'
beforeAll(() => { process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE })

function imageResponse(body: Uint8Array, headers: Record<string, string> = {}) {
  return new Response(body, { status: 200, headers: { 'content-type': 'image/jpeg', ...headers } })
}
function deps(over: Partial<DownloadDeps> = {}): DownloadDeps {
  return {
    fetch: jest.fn(async () => imageResponse(new Uint8Array([1, 2, 3]))) as unknown as typeof fetch,
    lookup: jest.fn(async () => ['93.184.216.34']),
    ...over,
  }
}

describe('063 — URL MyStay', () => {
  it('reconnaît une copie publique du stockage du projet', () => {
    expect(isMyStayStorageUrl(`${SUPABASE}/storage/v1/object/public/guide-photos/pois/p/a.webp`)).toBe(true)
    expect(isMyStayStorageUrl('https://autre.supabase.co/storage/v1/object/public/x.webp')).toBe(false)
    expect(isMyStayStorageUrl('/fallback/restaurant.webp')).toBe(false)
  })

  it('ne considère comme tierces que les URL http(s) absolues hors MyStay', () => {
    expect(isThirdPartyPhotoUrl('https://www.restaurant-leroyal.com/a.jpg')).toBe(true)
    expect(isThirdPartyPhotoUrl(`${SUPABASE}/storage/v1/object/public/guide-photos/a.webp`)).toBe(false)
    expect(isThirdPartyPhotoUrl('/fallback/restaurant.webp')).toBe(false)
    expect(isThirdPartyPhotoUrl('')).toBe(false)
  })
})

describe('063 — téléchargement sécurisé', () => {
  it('AC-02-01: refuse une URL non https sans requête réseau', async () => {
    const d = deps()
    await expect(downloadImageSafely('http://site.fr/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'NOT_HTTPS' })
    expect(d.fetch).not.toHaveBeenCalled()
  })

  it.each(['https://localhost/a.jpg', 'https://127.0.0.1/a.jpg', 'https://10.0.0.5/a.jpg', 'https://169.254.169.254/a.jpg', 'https://[::1]/a.jpg'])(
    'AC-02-02: refuse l’hôte interne %s sans requête réseau',
    async url => {
      const d = deps()
      await expect(downloadImageSafely(url, d)).resolves.toEqual({ ok: false, reason: 'PRIVATE_HOST' })
      expect(d.fetch).not.toHaveBeenCalled()
    },
  )

  it('AC-02-02: refuse un nom de domaine qui résout vers une adresse privée', async () => {
    const d = deps({ lookup: jest.fn(async () => ['192.168.1.10']) })
    await expect(downloadImageSafely('https://piege.example/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'PRIVATE_HOST' })
    expect(d.fetch).not.toHaveBeenCalled()
  })

  it('AC-02-02: revalide chaque redirection et refuse une cible interne', async () => {
    const fetchMock = jest.fn(async () => new Response(null, { status: 302, headers: { location: 'https://169.254.169.254/latest' } }))
    const d = deps({ fetch: fetchMock as unknown as typeof fetch })
    await expect(downloadImageSafely('https://site.fr/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'PRIVATE_HOST' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('suit une redirection https publique', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: 'https://cdn.site.fr/a.jpg' } }))
      .mockResolvedValueOnce(imageResponse(new Uint8Array([9])))
    const result = await downloadImageSafely('https://site.fr/a.jpg', deps({ fetch: fetchMock as unknown as typeof fetch }))
    expect(result).toMatchObject({ ok: true, contentType: 'image/jpeg' })
  })

  it('AC-02-03: refuse un contenu qui n’est pas une image', async () => {
    const d = deps({ fetch: jest.fn(async () => new Response('<html>', { headers: { 'content-type': 'text/html' } })) as unknown as typeof fetch })
    await expect(downloadImageSafely('https://site.fr/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'NOT_IMAGE' })
  })

  it('AC-02-03: refuse un content-length supérieur à 8 Mo', async () => {
    const d = deps({ fetch: jest.fn(async () => imageResponse(new Uint8Array([1]), { 'content-length': String(9 * 1024 * 1024) })) as unknown as typeof fetch })
    await expect(downloadImageSafely('https://site.fr/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'TOO_LARGE' })
  })

  it('AC-02-03: coupe un flux qui dépasse 8 Mo malgré un content-length mensonger', async () => {
    const big = new Uint8Array(9 * 1024 * 1024)
    const d = deps({ fetch: jest.fn(async () => imageResponse(big, { 'content-length': '10' })) as unknown as typeof fetch })
    await expect(downloadImageSafely('https://site.fr/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'TOO_LARGE' })
  })

  it('AC-02-03: renvoie TIMEOUT quand la requête est interrompue', async () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' })
    const d = deps({ fetch: jest.fn(async () => { throw abortError }) as unknown as typeof fetch })
    await expect(downloadImageSafely('https://site.fr/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'TIMEOUT' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/poi-photo-mirroring.AC-02-01-03.safe-download.test.ts`
Expected: FAIL — `Cannot find module '@/features/poi-photos/services/safe-image-download'`.

- [ ] **Step 3: Implémenter `storage-url.ts`**

```ts
/** Spec 063 — URL hébergées par le stockage Supabase public du projet (copies MyStay). */
export function isMyStayStorageUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base || !url) return false
  try {
    const parsed = new URL(url)
    return parsed.hostname === new URL(base).hostname
      && parsed.pathname.startsWith('/storage/v1/object/public/')
  } catch {
    return false
  }
}

/** Photo d'origine tierce : URL http(s) absolue qui n'est pas une copie MyStay. */
export function isThirdPartyPhotoUrl(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && !isMyStayStorageUrl(url)
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Implémenter `safe-image-download.ts`**

```ts
import { lookup as dnsLookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export const MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024
const TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 3

export type DownloadFailure =
  | 'NOT_HTTPS' | 'PRIVATE_HOST' | 'TOO_MANY_REDIRECTS' | 'HTTP_ERROR'
  | 'NOT_IMAGE' | 'TOO_LARGE' | 'TIMEOUT' | 'NETWORK'
export type DownloadResult =
  | { ok: true; body: Buffer; contentType: string }
  | { ok: false; reason: DownloadFailure }
export type DownloadDeps = {
  fetch: typeof fetch
  lookup: (host: string) => Promise<string[]>
}

const defaultDeps: DownloadDeps = {
  fetch: (...args) => fetch(...args),
  lookup: async host => (await dnsLookup(host, { all: true })).map(entry => entry.address),
}

function isPrivateAddress(address: string): boolean {
  const ip = address.replace(/^\[|\]$/g, '').toLowerCase()
  if (isIP(ip) === 6) {
    if (ip === '::1' || ip === '::') return true
    if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    return mapped ? isPrivateAddress(mapped[1]) : false
  }
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(part => Number.isNaN(part))) return true
  const [a, b] = parts
  return a === 0 || a === 10 || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || a >= 224
}

async function isAllowedHost(hostname: string, deps: DownloadDeps): Promise<boolean> {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost')) return false
  if (isIP(host)) return !isPrivateAddress(host)
  try {
    const addresses = await deps.lookup(host)
    return addresses.length > 0 && addresses.every(address => !isPrivateAddress(address))
  } catch {
    return false
  }
}

async function readCapped(response: Response): Promise<Buffer | null> {
  if (!response.body) return Buffer.alloc(0)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_DOWNLOAD_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}

/**
 * Spec 063 US-02 — télécharge une image tierce en refusant les cibles internes
 * (à chaque redirection), les contenus non image, > 8 Mo ou > 10 s.
 */
export async function downloadImageSafely(url: string, deps: DownloadDeps = defaultDeps): Promise<DownloadResult> {
  let current: URL
  try {
    current = new URL(url)
  } catch {
    return { ok: false, reason: 'NOT_HTTPS' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      if (current.protocol !== 'https:') return { ok: false, reason: 'NOT_HTTPS' }
      if (!(await isAllowedHost(current.hostname, deps))) return { ok: false, reason: 'PRIVATE_HOST' }

      const response = await deps.fetch(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { accept: 'image/*' },
      })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (!location) return { ok: false, reason: 'HTTP_ERROR' }
        current = new URL(location, current)
        continue
      }
      if (!response.ok) return { ok: false, reason: 'HTTP_ERROR' }

      const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
      if (!contentType.startsWith('image/')) return { ok: false, reason: 'NOT_IMAGE' }
      const declared = Number(response.headers.get('content-length') ?? '0')
      if (declared > MAX_DOWNLOAD_BYTES) return { ok: false, reason: 'TOO_LARGE' }

      const body = await readCapped(response)
      if (!body) return { ok: false, reason: 'TOO_LARGE' }
      return { ok: true, body, contentType }
    }
    return { ok: false, reason: 'TOO_MANY_REDIRECTS' }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return { ok: false, reason: 'TIMEOUT' }
    return { ok: false, reason: 'NETWORK' }
  } finally {
    clearTimeout(timer)
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest tests/unit/poi-photo-mirroring.AC-02-01-03.safe-download.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/poi-photos/lib/storage-url.ts src/features/poi-photos/services/safe-image-download.ts tests/unit/poi-photo-mirroring.AC-02-01-03.safe-download.test.ts
git commit -m "feat(063): téléchargement sécurisé des photos tierces"
```

---

### Task 3: Service de copie `mirrorPoiPhotos` / `mirrorPendingPoiPhotos`

**Files:**
- Create: `src/features/poi-photos/lib/mirror-cache-tag.ts`
- Create: `src/features/poi-photos/services/mirror-poi-photos.ts`
- Test: `tests/unit/poi-photo-mirroring.AC-01-02-03.mirror-service.test.ts`

**Interfaces:**
- Consumes: `downloadImageSafely`, `isThirdPartyPhotoUrl` (Task 2), `prisma.poiPhotoMirror` (Task 1).
- Produces:
  - `type MirrorReport = { mirrored: number; skipped: number; failed: number }`
  - `mirrorPoiPhotos(poiId: string, deps?: MirrorDeps, budget?: number): Promise<MirrorReport>` (`budget` = nombre max de copies tentées, illimité par défaut)
  - `mirrorPendingPoiPhotos(limit: number, deps?: MirrorDeps): Promise<MirrorReport>`
  - `type MirrorDeps = { download: typeof downloadImageSafely; upload: (path: string, body: Buffer) => Promise<string | null>; revalidate: (poiId: string) => void }`
  - `POI_PHOTO_MIRROR_TAG = 'poi-photo-mirrors'` exporté par `src/features/poi-photos/lib/mirror-cache-tag.ts` (fichier sans dépendance, pour ne pas charger `sharp` côté affichage)

- [ ] **Step 1: Write the failing test**

```ts
import sharp from 'sharp'

const mockPoiFindFirst = jest.fn()
const mockPoiFindMany = jest.fn()
const mockMirrorFindMany = jest.fn()
const mockMirrorUpsert = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: {
      findFirst: (...a: unknown[]) => mockPoiFindFirst(...a),
      findMany: (...a: unknown[]) => mockPoiFindMany(...a),
    },
    poiPhotoMirror: {
      findMany: (...a: unknown[]) => mockMirrorFindMany(...a),
      upsert: (...a: unknown[]) => mockMirrorUpsert(...a),
    },
  },
}))

import { mirrorPendingPoiPhotos, mirrorPoiPhotos, type MirrorDeps } from '@/features/poi-photos/services/mirror-poi-photos'

const SUPABASE = 'https://abcdefgh.supabase.co'
beforeAll(() => { process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE })

async function jpeg(width: number, height: number): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: '#c08080' } }).jpeg().toBuffer()
}

function makeDeps(body: Buffer): MirrorDeps & { upload: jest.Mock; download: jest.Mock; revalidate: jest.Mock } {
  return {
    download: jest.fn(async () => ({ ok: true as const, body, contentType: 'image/jpeg' })),
    upload: jest.fn(async (path: string) => `${SUPABASE}/storage/v1/object/public/guide-photos/${path}`),
    revalidate: jest.fn(),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockMirrorFindMany.mockResolvedValue([])
  mockMirrorUpsert.mockResolvedValue({})
})

describe('063 — mirrorPoiPhotos', () => {
  it('AC-01-02: convertit en WebP ≤ 1600 px, envoie dans pois/<id>/ et enregistre la correspondance', async () => {
    mockPoiFindFirst.mockResolvedValue({ id: 'poi-1', photos: ['https://site.fr/a.jpg'] })
    const deps = makeDeps(await jpeg(3000, 2000))

    const report = await mirrorPoiPhotos('poi-1', deps)

    expect(report).toEqual({ mirrored: 1, skipped: 0, failed: 0 })
    const [path, body] = deps.upload.mock.calls[0] as [string, Buffer]
    expect(path).toMatch(/^pois\/poi-1\/[0-9a-f]{16}\.webp$/)
    const meta = await sharp(body).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.width).toBe(1600)
    expect(mockMirrorUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { poi_id_source_url: { poi_id: 'poi-1', source_url: 'https://site.fr/a.jpg' } },
      create: expect.objectContaining({ poi_id: 'poi-1', source_url: 'https://site.fr/a.jpg', width: 1600 }),
    }))
    expect(deps.revalidate).toHaveBeenCalledWith('poi-1')
  })

  it('AC-01-02: ne grossit pas une petite image', async () => {
    mockPoiFindFirst.mockResolvedValue({ id: 'poi-1', photos: ['https://site.fr/a.jpg'] })
    const deps = makeDeps(await jpeg(500, 500))
    await mirrorPoiPhotos('poi-1', deps)
    const meta = await sharp(deps.upload.mock.calls[0][1] as Buffer).metadata()
    expect(meta.width).toBe(500)
  })

  it('AC-01-03: ignore une photo déjà copiée, sans téléchargement ni revalidation', async () => {
    mockPoiFindFirst.mockResolvedValue({ id: 'poi-1', photos: ['https://site.fr/a.jpg'] })
    mockMirrorFindMany.mockResolvedValue([{ source_url: 'https://site.fr/a.jpg' }])
    const deps = makeDeps(await jpeg(10, 10))

    await expect(mirrorPoiPhotos('poi-1', deps)).resolves.toEqual({ mirrored: 0, skipped: 1, failed: 0 })
    expect(deps.download).not.toHaveBeenCalled()
    expect(deps.revalidate).not.toHaveBeenCalled()
  })

  it('BR-03: ne recopie jamais une URL MyStay ni un chemin relatif', async () => {
    mockPoiFindFirst.mockResolvedValue({
      id: 'poi-1',
      photos: [`${SUPABASE}/storage/v1/object/public/guide-photos/x.webp`, '/fallback/restaurant.webp'],
    })
    const deps = makeDeps(await jpeg(10, 10))
    await expect(mirrorPoiPhotos('poi-1', deps)).resolves.toEqual({ mirrored: 0, skipped: 2, failed: 0 })
    expect(deps.download).not.toHaveBeenCalled()
  })

  it('AC-02-03: compte un échec de téléchargement ou un contenu indécodable sans rien enregistrer', async () => {
    mockPoiFindFirst.mockResolvedValue({ id: 'poi-1', photos: ['https://site.fr/a.jpg', 'https://site.fr/b.jpg'] })
    const deps = makeDeps(Buffer.from('pas une image'))
    deps.download.mockResolvedValueOnce({ ok: false, reason: 'NOT_IMAGE' })
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})

    await expect(mirrorPoiPhotos('poi-1', deps)).resolves.toEqual({ mirrored: 0, skipped: 0, failed: 2 })
    expect(mockMirrorUpsert).not.toHaveBeenCalled()
    expect(errorLog).toHaveBeenCalledWith('POI_PHOTO_MIRROR_FAILED', expect.objectContaining({ poiId: 'poi-1' }))
    errorLog.mockRestore()
  })

  it('compte un échec d’envoi Supabase', async () => {
    mockPoiFindFirst.mockResolvedValue({ id: 'poi-1', photos: ['https://site.fr/a.jpg'] })
    const deps = makeDeps(await jpeg(10, 10))
    deps.upload.mockResolvedValue(null)
    jest.spyOn(console, 'error').mockImplementation(() => {})
    await expect(mirrorPoiPhotos('poi-1', deps)).resolves.toEqual({ mirrored: 0, skipped: 0, failed: 1 })
  })

  it('renvoie un rapport vide pour un POI introuvable ou non publié', async () => {
    mockPoiFindFirst.mockResolvedValue(null)
    await expect(mirrorPoiPhotos('absent', makeDeps(await jpeg(10, 10)))).resolves.toEqual({ mirrored: 0, skipped: 0, failed: 0 })
  })
})

describe('063 — mirrorPendingPoiPhotos', () => {
  it('AC-01-04 / BR-06: s’arrête à la limite et ignore les photos déjà copiées', async () => {
    mockPoiFindMany.mockResolvedValue([
      { id: 'poi-1', photos: ['https://site.fr/1.jpg', 'https://site.fr/2.jpg'], photo_mirrors: [{ source_url: 'https://site.fr/1.jpg' }] },
      { id: 'poi-2', photos: ['https://site.fr/3.jpg', 'https://site.fr/4.jpg'], photo_mirrors: [] },
    ])
    mockPoiFindFirst.mockImplementation(async ({ where }: { where: { id: string } }) =>
      where.id === 'poi-1'
        ? { id: 'poi-1', photos: ['https://site.fr/1.jpg', 'https://site.fr/2.jpg'] }
        : { id: 'poi-2', photos: ['https://site.fr/3.jpg', 'https://site.fr/4.jpg'] })
    mockMirrorFindMany.mockImplementation(async ({ where }: { where: { poi_id: string } }) =>
      where.poi_id === 'poi-1' ? [{ source_url: 'https://site.fr/1.jpg' }] : [])
    const deps = makeDeps(await jpeg(10, 10))

    const report = await mirrorPendingPoiPhotos(2, deps)

    expect(report.mirrored).toBe(2)
    expect(deps.download).toHaveBeenCalledTimes(2)
    expect(mockPoiFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ discovery_status: 'PUBLISHED', deleted_at: null }),
      orderBy: { discovery_published_at: 'asc' },
    }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/poi-photo-mirroring.AC-01-02-03.mirror-service.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter l'étiquette de cache puis le service**

`src/features/poi-photos/lib/mirror-cache-tag.ts` :

```ts
/** Spec 063 — étiquette de cache de la table de correspondance des copies de photos. */
export const POI_PHOTO_MIRROR_TAG = 'poi-photo-mirrors'
```

`src/features/poi-photos/services/mirror-poi-photos.ts` :

```ts
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/shared/lib/prisma'
import { createSupabaseServer } from '@/shared/lib/supabase'
import { isThirdPartyPhotoUrl } from '../lib/storage-url'
import { downloadImageSafely } from './safe-image-download'
import { safelyRevalidateDiscoveryPaths } from '@/features/public-discovery/lib/revalidation'
import { POI_PHOTO_MIRROR_TAG } from '../lib/mirror-cache-tag'

const BUCKET = 'guide-photos'
const MAX_WIDTH = 1600

export type MirrorReport = { mirrored: number; skipped: number; failed: number }
export type MirrorDeps = {
  download: typeof downloadImageSafely
  upload: (path: string, body: Buffer) => Promise<string | null>
  revalidate: (poiId: string) => void
}

async function uploadToGuidePhotos(path: string, body: Buffer): Promise<string | null> {
  const supabase = createSupabaseServer()
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (error || !data) return null
  return supabase.storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl
}

async function revalidatePoi(poiId: string): Promise<void> {
  try {
    revalidateTag(POI_PHOTO_MIRROR_TAG, 'max')
  } catch (error) {
    console.error('POI_PHOTO_MIRROR_REVALIDATION_FAILED', { poiId, error })
  }
  const poi = await prisma.pointOfInterest.findFirst({
    where: { id: poiId },
    select: { slug: true, city: { select: { slug: true } }, category: { select: { slug: true } } },
  })
  if (poi) {
    safelyRevalidateDiscoveryPaths([
      `/decouvrir/${poi.city.slug}`,
      `/decouvrir/${poi.city.slug}/${poi.category.slug}`,
      `/decouvrir/${poi.city.slug}/${poi.category.slug}/${poi.slug}`,
    ])
  }
}

const defaultDeps: MirrorDeps = {
  download: downloadImageSafely,
  upload: uploadToGuidePhotos,
  revalidate: poiId => { void revalidatePoi(poiId) },
}

function photoHash(sourceUrl: string): string {
  return createHash('sha256').update(sourceUrl).digest('hex').slice(0, 16)
}

async function mirrorOne(poiId: string, sourceUrl: string, deps: MirrorDeps): Promise<boolean> {
  const download = await deps.download(sourceUrl)
  if (!download.ok) {
    console.error('POI_PHOTO_MIRROR_FAILED', { poiId, sourceUrl, reason: download.reason })
    return false
  }
  try {
    const { data, info } = await sharp(download.body)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true })
    const storageUrl = await deps.upload(`pois/${poiId}/${photoHash(sourceUrl)}.webp`, data)
    if (!storageUrl) {
      console.error('POI_PHOTO_MIRROR_FAILED', { poiId, sourceUrl, reason: 'UPLOAD_FAILED' })
      return false
    }
    await prisma.poiPhotoMirror.upsert({
      where: { poi_id_source_url: { poi_id: poiId, source_url: sourceUrl } },
      create: { poi_id: poiId, source_url: sourceUrl, storage_url: storageUrl, width: info.width, bytes: info.size },
      update: { storage_url: storageUrl, width: info.width, bytes: info.size, deleted_at: null },
    })
    return true
  } catch (error) {
    console.error('POI_PHOTO_MIRROR_FAILED', { poiId, sourceUrl, reason: 'CONVERSION_FAILED', error })
    return false
  }
}

/** Spec 063 AC-01-01..03 — copie les photos tierces d'un POI publié qui n'ont pas encore de copie. */
export async function mirrorPoiPhotos(poiId: string, deps: MirrorDeps = defaultDeps, budget = Number.POSITIVE_INFINITY): Promise<MirrorReport> {
  const report: MirrorReport = { mirrored: 0, skipped: 0, failed: 0 }
  const poi = await prisma.pointOfInterest.findFirst({
    where: { id: poiId, discovery_status: 'PUBLISHED', deleted_at: null },
    select: { id: true, photos: true },
  })
  if (!poi) return report

  const existing = await prisma.poiPhotoMirror.findMany({
    where: { poi_id: poiId, deleted_at: null },
    select: { source_url: true },
  })
  const mirroredUrls = new Set(existing.map(row => row.source_url))

  for (const sourceUrl of poi.photos) {
    if (!isThirdPartyPhotoUrl(sourceUrl) || mirroredUrls.has(sourceUrl)) {
      report.skipped += 1
      continue
    }
    if (report.mirrored + report.failed >= budget) break
    if (await mirrorOne(poiId, sourceUrl, deps)) {
      report.mirrored += 1
      mirroredUrls.add(sourceUrl)
    } else {
      report.failed += 1
    }
  }

  if (report.mirrored > 0) deps.revalidate(poiId)
  return report
}

/** Spec 063 AC-01-04 / BR-06 — tâche quotidienne : au plus `limit` copies tentées. */
export async function mirrorPendingPoiPhotos(limit: number, deps: MirrorDeps = defaultDeps): Promise<MirrorReport> {
  const total: MirrorReport = { mirrored: 0, skipped: 0, failed: 0 }
  const pois = await prisma.pointOfInterest.findMany({
    where: { discovery_status: 'PUBLISHED', deleted_at: null },
    orderBy: { discovery_published_at: 'asc' },
    select: { id: true, photos: true, photo_mirrors: { where: { deleted_at: null }, select: { source_url: true } } },
  })

  for (const poi of pois) {
    const remaining = limit - total.mirrored - total.failed
    if (remaining <= 0) break
    const mirrored = new Set(poi.photo_mirrors.map(row => row.source_url))
    if (!poi.photos.some(url => isThirdPartyPhotoUrl(url) && !mirrored.has(url))) continue

    const report = await mirrorPoiPhotos(poi.id, deps, remaining)
    total.mirrored += report.mirrored
    total.skipped += report.skipped
    total.failed += report.failed
  }
  return total
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/unit/poi-photo-mirroring.AC-01-02-03.mirror-service.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/poi-photos/lib/mirror-cache-tag.ts src/features/poi-photos/services/mirror-poi-photos.ts tests/unit/poi-photo-mirroring.AC-01-02-03.mirror-service.test.ts
git commit -m "feat(063): service de copie des photos des POI publiés"
```

---

### Task 4: Tâche quotidienne, script de reprise et `vercel.json`

**Files:**
- Create: `src/app/api/internal/poi-photo-mirrors/sync/route.ts`
- Create: `scripts/mirror-poi-photos.ts`
- Modify: `vercel.json` (ajout d'une entrée `crons`)
- Test: `tests/contract/poi-photo-mirroring.AC-01-04.sync-route.test.ts`

**Interfaces:**
- Consumes: `mirrorPendingPoiPhotos(limit)` (Task 3).
- Produces: `GET /api/internal/poi-photo-mirrors/sync` → `200 { mirrored, skipped, failed }` | `401 { error: { code: 'UNAUTHORIZED', message, details } }`.

- [ ] **Step 1: Write the failing test**

```ts
import { NextRequest } from 'next/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const mockPending = jest.fn()
jest.mock('@/features/poi-photos/services/mirror-poi-photos', () => ({
  mirrorPendingPoiPhotos: (...a: unknown[]) => mockPending(...a),
}))

import { GET } from '@/app/api/internal/poi-photo-mirrors/sync/route'

const request = (auth?: string) => new NextRequest('http://localhost/api/internal/poi-photo-mirrors/sync', {
  headers: auth ? { authorization: auth } : {},
})

beforeEach(() => {
  process.env.INTERNAL_API_SECRET = 'secret-test'
  mockPending.mockReset().mockResolvedValue({ mirrored: 3, skipped: 5, failed: 1 })
})

describe('063 — tâche quotidienne de copie', () => {
  it('AC-01-04: traite un lot de 40 photos et renvoie le rapport', async () => {
    const response = await GET(request('Bearer secret-test'))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ mirrored: 3, skipped: 5, failed: 1 })
    expect(mockPending).toHaveBeenCalledWith(40)
  })

  it.each([undefined, 'Bearer mauvais'])('refuse un appel sans le bon secret (%s)', async auth => {
    const response = await GET(request(auth))
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Secret interne absent ou invalide', details: {} },
    })
    expect(mockPending).not.toHaveBeenCalled()
  })

  it('est planifiée dans vercel.json à 04:15', () => {
    const config = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')) as { crons: Array<{ path: string; schedule: string }> }
    expect(config.crons).toContainEqual({ path: '/api/internal/poi-photo-mirrors/sync', schedule: '15 4 * * *' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/contract/poi-photo-mirroring.AC-01-04.sync-route.test.ts`
Expected: FAIL — route introuvable.

- [ ] **Step 3: Implémenter la route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { mirrorPendingPoiPhotos } from '@/features/poi-photos/services/mirror-poi-photos'

// Spec 063 BR-06 : au plus 40 photos par exécution.
const BATCH_LIMIT = 40
export const maxDuration = 300

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET
  return Boolean(secret) && req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Secret interne absent ou invalide', details: {} } },
      { status: 401 },
    )
  }
  const report = await mirrorPendingPoiPhotos(BATCH_LIMIT)
  return NextResponse.json(report)
}
```

- [ ] **Step 4: Ajouter la tâche dans `vercel.json`**

Dans le tableau `crons`, après l'entrée `/api/internal/geocode-pois` :

```json
    {
      "path": "/api/internal/poi-photo-mirrors/sync",
      "schedule": "15 4 * * *"
    },
```

- [ ] **Step 5: Écrire le script de reprise**

`scripts/mirror-poi-photos.ts` :

```ts
/**
 * Spec 063 AC-01-05 — reprise initiale : copie toutes les photos tierces des POI
 * publiés, par lots, jusqu'à ce qu'il n'en reste plus.
 * Usage : npx tsx --env-file=.env.local scripts/mirror-poi-photos.ts
 */
import { mirrorPendingPoiPhotos } from '@/features/poi-photos/services/mirror-poi-photos'
import { prisma } from '@/shared/lib/prisma'

async function main() {
  const total = { mirrored: 0, skipped: 0, failed: 0 }
  for (let pass = 1; pass <= 20; pass += 1) {
    const report = await mirrorPendingPoiPhotos(40)
    total.mirrored += report.mirrored
    total.failed += report.failed
    console.log(`Lot ${pass} : ${report.mirrored} copiées, ${report.failed} en échec`)
    if (report.mirrored === 0) break
  }
  console.log(`Total : ${total.mirrored} copiées, ${total.failed} en échec`)
  await prisma.$disconnect()
}

main().catch(async error => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
```

> Hors runtime Next, `revalidateTag` lève une erreur : elle est déjà capturée et journalisée par `revalidatePoi` (Task 3). La revalidation se fera par la tâche quotidienne ou une republication.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest tests/contract/poi-photo-mirroring.AC-01-04.sync-route.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add src/app/api/internal/poi-photo-mirrors/sync/route.ts scripts/mirror-poi-photos.ts vercel.json tests/contract/poi-photo-mirroring.AC-01-04.sync-route.test.ts
git commit -m "feat(063): tâche quotidienne et script de reprise de copie des photos"
```

---

### Task 5: Copie lancée à la publication

**Files:**
- Modify: `src/app/api/admin/pois/[id]/discovery-publication/route.ts`
- Test: `tests/integration/poi-photo-mirroring.AC-01-01.publication-trigger.test.ts`

**Interfaces:**
- Consumes: `mirrorPoiPhotos(poiId)` (Task 3).

- [ ] **Step 1: Write the failing test**

```ts
import { NextRequest } from 'next/server'

const afterCallbacks: Array<() => unknown> = []
jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  after: (callback: () => unknown) => { afterCallbacks.push(callback) },
}))
jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: jest.fn(async () => ({ user: { id: 'admin-1' }, error: null })),
}))
const mockUpdate = jest.fn()
jest.mock('@/features/public-discovery/queries/admin-publication', () => ({
  updatePoiDiscoveryPublication: (...a: unknown[]) => mockUpdate(...a),
}))
jest.mock('@/features/public-discovery/lib/revalidation', () => ({ safelyRevalidateDiscoveryPaths: jest.fn() }))
const mockMirror = jest.fn()
jest.mock('@/features/poi-photos/services/mirror-poi-photos', () => ({
  mirrorPoiPhotos: (...a: unknown[]) => mockMirror(...a),
}))

import { PATCH } from '@/app/api/admin/pois/[id]/discovery-publication/route'

const POI_ID = '3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f'
const call = (status: 'DRAFT' | 'PUBLISHED') => PATCH(
  new NextRequest(`http://localhost/api/admin/pois/${POI_ID}/discovery-publication`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  { params: Promise.resolve({ id: POI_ID }) },
)

beforeEach(() => {
  afterCallbacks.length = 0
  mockMirror.mockReset().mockResolvedValue({ mirrored: 1, skipped: 0, failed: 0 })
  mockUpdate.mockImplementation(async (_id: string, status: string) => ({
    id: POI_ID, discovery_status: status, discovery_published_at: null,
    public_url: null, invalidation_paths: [], eligibility: { eligible: true, reasons: [] },
  }))
})

describe('063 AC-01-01 — copie à la publication', () => {
  it('programme la copie après la réponse quand le POI est publié', async () => {
    const response = await call('PUBLISHED')
    expect(response.status).toBe(200)
    expect(mockMirror).not.toHaveBeenCalled()
    expect(afterCallbacks).toHaveLength(1)
    await afterCallbacks[0]()
    expect(mockMirror).toHaveBeenCalledWith(POI_ID)
  })

  it('ne programme rien quand le POI repasse en brouillon', async () => {
    await call('DRAFT')
    expect(afterCallbacks).toHaveLength(0)
  })

  it('n’expose pas d’erreur si la copie échoue en arrière-plan', async () => {
    mockMirror.mockRejectedValue(new Error('storage down'))
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
    const response = await call('PUBLISHED')
    expect(response.status).toBe(200)
    await expect(afterCallbacks[0]()).resolves.toBeUndefined()
    expect(errorLog).toHaveBeenCalledWith('POI_PHOTO_MIRROR_FAILED', expect.objectContaining({ poiId: POI_ID }))
    errorLog.mockRestore()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/integration/poi-photo-mirroring.AC-01-01.publication-trigger.test.ts`
Expected: FAIL — `afterCallbacks` reste vide.

- [ ] **Step 3: Implémenter**

Dans la route, remplacer l'import `NextRequest, NextResponse` et ajouter le service :

```ts
import { NextRequest, NextResponse, after } from 'next/server'
import { mirrorPoiPhotos } from '@/features/poi-photos/services/mirror-poi-photos'
```

Après `safelyRevalidateDiscoveryPaths(invalidationPaths)` :

```ts
    // Spec 063 AC-01-01 : copie des photos en arrière-plan, sans retarder la réponse.
    if (result.discovery_status === 'PUBLISHED') {
      after(async () => {
        try {
          await mirrorPoiPhotos(result.id)
        } catch (error) {
          console.error('POI_PHOTO_MIRROR_FAILED', { poiId: result.id, error })
        }
      })
    }
```

- [ ] **Step 4: Run tests**

Run: `npx jest tests/integration/poi-photo-mirroring.AC-01-01.publication-trigger.test.ts $(ls tests/**/*discovery-publication* 2>/dev/null)`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/admin/pois/[id]/discovery-publication/route.ts" tests/integration/poi-photo-mirroring.AC-01-01.publication-trigger.test.ts
git commit -m "feat(063): copie des photos lancée à la publication d'un POI"
```

---

### Task 6: Table de correspondance et `RemotePoiImage`

**Files:**
- Create: `src/features/poi-photos/queries/photo-mirror-map.ts`
- Modify: `src/features/public-discovery/components/RemotePoiImage.tsx`
- Test: `tests/unit/poi-photo-mirroring.AC-03-02-03.resolution.test.tsx`

**Interfaces:**
- Consumes: `prisma.poiPhotoMirror` (Task 1), `POI_PHOTO_MIRROR_TAG` de `lib/mirror-cache-tag.ts` (Task 3), `isMyStayStorageUrl` (Task 2).
- Produces:
  - `type PoiPhotoMirrorMap = ReadonlyMap<string, string>`
  - `getPoiPhotoMirrorMap(): Promise<PoiPhotoMirrorMap>` (mise en cache, tag `poi-photo-mirrors`)
  - `resolvePoiPhotoUrl(url: string, map: PoiPhotoMirrorMap): string`
  - `resolvePoiPhotoList(urls: readonly string[], map: PoiPhotoMirrorMap): string[]`

- [ ] **Step 1: Write the failing test**

```tsx
/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'

jest.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))
const mockFindMany = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: { poiPhotoMirror: { findMany: (...a: unknown[]) => mockFindMany(...a) } } }))

import { getPoiPhotoMirrorMap, resolvePoiPhotoList, resolvePoiPhotoUrl } from '@/features/poi-photos/queries/photo-mirror-map'
import { RemotePoiImage } from '@/features/public-discovery/components/RemotePoiImage'

const SUPABASE = 'https://abcdefgh.supabase.co'
const COPY = `${SUPABASE}/storage/v1/object/public/guide-photos/pois/p/abc.webp`
beforeAll(() => { process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE })

describe('063 — résolution des URL', () => {
  it('AC-03-01 / AC-03-02: remplace par la copie quand elle existe, sinon garde l’original', async () => {
    mockFindMany.mockResolvedValue([{ source_url: 'https://site.fr/a.jpg', storage_url: COPY }])
    const map = await getPoiPhotoMirrorMap()
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { deleted_at: null } }))
    expect(resolvePoiPhotoUrl('https://site.fr/a.jpg', map)).toBe(COPY)
    expect(resolvePoiPhotoUrl('https://site.fr/b.jpg', map)).toBe('https://site.fr/b.jpg')
    expect(resolvePoiPhotoList(['https://site.fr/a.jpg', '/fallback/x.webp'], map)).toEqual([COPY, '/fallback/x.webp'])
  })

  it('BR-04: une erreur de lecture renvoie une table vide', async () => {
    mockFindMany.mockRejectedValue(new Error('db down'))
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const map = await getPoiPhotoMirrorMap()
    expect(map.size).toBe(0)
  })
})

describe('063 AC-03-03 — RemotePoiImage', () => {
  it('passe par l’optimiseur next/image pour une copie MyStay', () => {
    render(<RemotePoiImage src={COPY} alt="Le Royal" width={1200} height={900} loading="eager" fetchPriority="high" />)
    const img = screen.getByRole('img', { name: 'Le Royal' })
    expect(img.getAttribute('src')).toContain(`/_next/image?url=${encodeURIComponent(COPY)}`)
    expect(img).toHaveAttribute('fetchpriority', 'high')
  })

  it('garde le <img> direct pour une URL tierce', () => {
    render(<RemotePoiImage src="https://site.fr/a.jpg" alt="Tiers" width={600} height={400} loading="lazy" />)
    expect(screen.getByRole('img', { name: 'Tiers' })).toHaveAttribute('src', 'https://site.fr/a.jpg')
  })

  it('retombe sur l’image de secours quand une copie est introuvable', () => {
    render(<RemotePoiImage src={COPY} alt="Cassée" width={600} height={400} loading="lazy" />)
    fireEvent.error(screen.getByRole('img', { name: 'Cassée' }))
    expect(screen.getByRole('img', { name: 'Cassée' }).getAttribute('src')).toContain('og-mystay.png')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/poi-photo-mirroring.AC-03-02-03.resolution.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter `photo-mirror-map.ts`**

```ts
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/shared/lib/prisma'
import { POI_PHOTO_MIRROR_TAG } from '../lib/mirror-cache-tag'

export type PoiPhotoMirrorMap = ReadonlyMap<string, string>

const loadMirrorPairs = unstable_cache(
  async (): Promise<Array<[string, string]>> => {
    const rows = await prisma.poiPhotoMirror.findMany({
      where: { deleted_at: null },
      select: { source_url: true, storage_url: true },
    })
    return rows.map(row => [row.source_url, row.storage_url])
  },
  ['poi-photo-mirror-map'],
  { tags: [POI_PHOTO_MIRROR_TAG], revalidate: 86_400 },
)

/** Spec 063 — correspondance URL d'origine → copie MyStay, une lecture par requête. */
export const getPoiPhotoMirrorMap = cache(async (): Promise<PoiPhotoMirrorMap> => {
  try {
    return new Map(await loadMirrorPairs())
  } catch (error) {
    console.error('POI_PHOTO_MIRROR_MAP_UNAVAILABLE', error)
    return new Map()
  }
})

export function resolvePoiPhotoUrl(url: string, map: PoiPhotoMirrorMap): string {
  return map.get(url) ?? url
}

export function resolvePoiPhotoList(urls: readonly string[], map: PoiPhotoMirrorMap): string[] {
  return urls.map(url => resolvePoiPhotoUrl(url, map))
}
```

> `photo-mirror-map.ts` n'importe que l'étiquette (`lib/mirror-cache-tag.ts`), jamais le service : l'affichage ne charge ni `sharp` ni Supabase Storage.

- [ ] **Step 4: Adapter `RemotePoiImage`**

Remplacer le contenu du composant par :

```tsx
'use client'

/* eslint-disable @next/next/no-img-element -- Spec 041 BR-26 preserves arbitrary remote http(s) images from spec 022. */
import Image from 'next/image'
import { useState } from 'react'
import { isMyStayStorageUrl } from '@/features/poi-photos/lib/storage-url'

const MYSTAY_IMAGE_FALLBACK = '/og-mystay.png'

type RemotePoiImageProps = {
  src: string
  alt: string
  width: number
  height: number
  loading: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  decoding?: 'sync' | 'async' | 'auto'
  className?: string
}

export function RemotePoiImage({
  src,
  alt,
  width,
  height,
  loading,
  fetchPriority,
  decoding = 'async',
  className,
}: RemotePoiImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const failed = failedSource === src
  const renderedSource = failed ? MYSTAY_IMAGE_FALLBACK : src

  // Spec 063 AC-03-03 : une copie MyStay passe par l'optimiseur next/image.
  if (!failed && isMyStayStorageUrl(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        sizes={`(max-width: 768px) 100vw, ${width}px`}
        className={className}
        onError={() => setFailedSource(src)}
      />
    )
  }

  return (
    <img
      src={renderedSource}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding={decoding}
      referrerPolicy="no-referrer"
      className={className}
      onError={event => {
        if (event.currentTarget.getAttribute('src') !== MYSTAY_IMAGE_FALLBACK) {
          setFailedSource(src)
        }
      }}
    />
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest tests/unit/poi-photo-mirroring.AC-03-02-03.resolution.test.tsx tests/integration/public-discovery.AC-01-03.pages.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/poi-photos/queries/photo-mirror-map.ts src/features/public-discovery/components/RemotePoiImage.tsx tests/unit/poi-photo-mirroring.AC-03-02-03.resolution.test.tsx
git commit -m "feat(063): résolution des copies et affichage optimisé des photos de POI"
```

---

### Task 7: Brancher la résolution dans les requêtes et ajouter le crédit

**Files:**
- Modify: `src/features/public-discovery/types.ts` (`DiscoveryPoiDetail` : `photo_credit`)
- Modify: `src/features/public-discovery/queries/public-discovery.ts` (`getDiscoveryIndex`, `getDiscoveryCity`, catégorie, détail)
- Modify: `src/features/public-discovery/components/DiscoveryPoiView.tsx` (ligne de crédit)
- Modify: `src/features/categories/queries/poi-cards.ts`, `src/features/categories/queries/all-poi-cards.ts`, `src/features/city-guide/queries/cities.ts`, `src/features/guide-app/queries/private-guide-data.ts`
- Test: `tests/integration/poi-photo-mirroring.AC-03-01-AC-04.surfaces-and-credit.test.tsx`

**Interfaces:**
- Consumes: `getPoiPhotoMirrorMap`, `resolvePoiPhotoUrl`, `resolvePoiPhotoList` (Task 6), `isThirdPartyPhotoUrl` (Task 2).
- Produces: `DiscoveryPoiDetail.photo_credit: { name: string; website: string | null } | null`.

- [ ] **Step 1: Write the failing test**

```tsx
/** @jest-environment jsdom */
import { render, screen, within } from '@testing-library/react'
import { DiscoveryPoiView } from '@/features/public-discovery/components/DiscoveryPoiView'
import type { DiscoveryPoiDetail } from '@/features/public-discovery/types'

jest.mock('next/navigation', () => ({ usePathname: () => '/decouvrir/saint-gervais-les-bains/diner/le-royal' }))

function poi(over: Partial<DiscoveryPoiDetail> = {}): DiscoveryPoiDetail {
  return {
    name: 'Brasserie du Mont Blanc', slug: 'brasserie-du-mont-blanc', address: '31 Av. du Mont Paccard',
    latitude: 45.89, longitude: 6.71, rating: null, rating_count: null, is_open_now: null,
    category: { id: 'c', slug: 'diner', name: 'Restaurant' }, subcategory: null,
    distance_km: 0.4, zone: 'PRIMARY',
    description: 'Cuisine savoyarde et classiques de brasserie.',
    phone: null, website: 'https://www.brasserie.example', hours: null,
    photos: ['https://www.brasserie.example/a.jpg'], hero_photo_url: 'https://www.brasserie.example/a.jpg',
    city: { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains' },
    photo_credit: { name: 'Brasserie du Mont Blanc', website: 'https://www.brasserie.example' },
    ...over,
  } as DiscoveryPoiDetail
}

describe('063 US-04 — crédit des photos', () => {
  it('AC-04-01 / AC-04-02: ligne de crédit après la description, avant les boutons, avec lien', () => {
    render(<DiscoveryPoiView poi={poi()} />)
    const credit = screen.getByTestId('poi-photo-credit')
    expect(credit).toHaveTextContent('Photos : Brasserie du Mont Blanc')
    const link = within(credit).getByRole('link', { name: 'Brasserie du Mont Blanc' })
    expect(link).toHaveAttribute('href', 'https://www.brasserie.example')
    expect(link).toHaveAttribute('rel', 'nofollow noopener')
    expect(link).toHaveAttribute('target', '_blank')
    const description = screen.getByText('Cuisine savoyarde et classiques de brasserie.')
    expect(description.compareDocumentPosition(credit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('AC-04-02: nom seul sans site', () => {
    render(<DiscoveryPoiView poi={poi({ photo_credit: { name: 'Brasserie du Mont Blanc', website: null } })} />)
    expect(within(screen.getByTestId('poi-photo-credit')).queryByRole('link')).not.toBeInTheDocument()
  })

  it('AC-04-03: aucun crédit sans photo tierce', () => {
    render(<DiscoveryPoiView poi={poi({ photo_credit: null })} />)
    expect(screen.queryByTestId('poi-photo-credit')).not.toBeInTheDocument()
  })
})
```

Ajouter dans le même fichier un test de requête qui simule Prisma, sur le modèle de `tests/integration/public-discovery.AC-01-03.pages.test.tsx` (réutiliser sa fixture de ligne POI) :

```tsx
jest.mock('@/features/poi-photos/queries/photo-mirror-map', () => ({
  getPoiPhotoMirrorMap: jest.fn(async () => new Map([['https://www.brasserie.example/a.jpg', 'https://abcdefgh.supabase.co/storage/v1/object/public/guide-photos/pois/p/a.webp']])),
  resolvePoiPhotoUrl: (url: string, map: ReadonlyMap<string, string>) => map.get(url) ?? url,
  resolvePoiPhotoList: (urls: string[], map: ReadonlyMap<string, string>) => urls.map(url => map.get(url) ?? url),
}))

it('AC-03-01: la fiche, les cartes et le JSON-LD utilisent la copie ; le crédit part de l’origine', async () => {
  // Fixture POI publié avec photos: ['https://www.brasserie.example/a.jpg'] et website renseigné,
  // fournie au mock prisma.pointOfInterest.findMany comme dans public-discovery.AC-01-03.pages.test.tsx.
  const detail = await getDiscoveryPoi('saint-gervais-les-bains', 'diner', 'brasserie-du-mont-blanc')
  expect(detail?.hero_photo_url).toContain('/storage/v1/object/public/guide-photos/pois/')
  expect(detail?.photos[0]).toContain('/storage/v1/object/public/guide-photos/pois/')
  expect(detail?.photo_credit).toEqual({ name: 'Brasserie du Mont Blanc', website: 'https://www.brasserie.example/' })
  const city = await getDiscoveryCity('saint-gervais-les-bains')
  expect(city?.categories[0].pois[0].photo_url).toContain('/guide-photos/pois/')
})
```

> L'exécutant reprend la fixture `row` et le mock Prisma exacts de `tests/integration/public-discovery.AC-01-03.pages.test.tsx` (en remplaçant le nom, le slug, `website` et `photos`), et importe `getDiscoveryPoi` / `getDiscoveryCity` depuis `@/features/public-discovery/queries/public-discovery` (noms exportés réels à vérifier dans ce fichier : `getDiscoveryIndex`, `getDiscoveryCity`, puis les exports catégorie et POI).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/integration/poi-photo-mirroring.AC-03-01-AC-04.surfaces-and-credit.test.tsx`
Expected: FAIL — pas de `poi-photo-credit`, `photo_credit` indéfini.

- [ ] **Step 3: Ajouter `photo_credit` au type**

Dans `src/features/public-discovery/types.ts`, dans `DiscoveryPoiDetail` :

```ts
  /** Spec 063 US-04 : origine tierce des photos affichées, ou null si photos MyStay uniquement. */
  photo_credit: { name: string; website: string | null } | null
```

- [ ] **Step 4: Résoudre les photos dans `public-discovery.ts`**

Ajouter les imports :

```ts
import { getPoiPhotoMirrorMap, resolvePoiPhotoList, resolvePoiPhotoUrl } from '@/features/poi-photos/queries/photo-mirror-map'
import { isThirdPartyPhotoUrl } from '@/features/poi-photos/lib/storage-url'
```

Dans le retour du détail POI (bloc `return { ...detailCard, ... }` vu plus haut, ~l.405), charger la table puis résoudre :

```ts
    const mirrorMap = await getPoiPhotoMirrorMap()
    const website = sanitizeWebsite(mapped.row.website)

    return {
      ...detailCard,
      is_open_now: computeIsOpenNow(hours) ?? detailCard.is_open_now,
      description: mapped.row.description!.trim(),
      phone: mapped.row.phone?.trim() || null,
      website,
      hours,
      photos: resolvePoiPhotoList(mapped.photos, mirrorMap),
      hero_photo_url: resolvePoiPhotoUrl(heroPhotoUrl, mirrorMap),
      photo_credit: mapped.photos.some(isThirdPartyPhotoUrl)
        ? { name: detailCard.name, website }
        : null,
      city: toCitySummary(mapped.row),
    }
```

Dans chaque fonction exportée qui renvoie des cartes (`getDiscoveryIndex`, `getDiscoveryCity`, la fonction catégorie), juste avant le `return`, charger `const mirrorMap = await getPoiPhotoMirrorMap()` et remplacer chaque `photo_url` de carte par `resolvePoiPhotoUrl(card.photo_url, mirrorMap)` à l'endroit où les cartes `mapped.card` sont collectées (rechercher `.card` dans le fichier ; appliquer `({ ...m.card, photo_url: resolvePoiPhotoUrl(m.card.photo_url, mirrorMap) })`).

- [ ] **Step 5: Ajouter la ligne de crédit dans `DiscoveryPoiView`**

Juste après `<p className="mt-7 text-base leading-8 text-slate-600">{poi.description}</p>` :

```tsx
            {poi.photo_credit ? (
              <p data-testid="poi-photo-credit" className="mt-3 text-xs leading-6 text-slate-500">
                Photos :{' '}
                {poi.photo_credit.website ? (
                  <a
                    href={poi.photo_credit.website}
                    target="_blank"
                    rel="nofollow noopener"
                    className="underline decoration-slate-300 underline-offset-2 hover:text-pink-600"
                  >
                    {poi.photo_credit.name}
                  </a>
                ) : poi.photo_credit.name}
              </p>
            ) : null}
```

- [ ] **Step 6: Résoudre les photos du guide**

Dans chacun des fichiers suivants, ajouter `import { getPoiPhotoMirrorMap, resolvePoiPhotoList, resolvePoiPhotoUrl } from '@/features/poi-photos/queries/photo-mirror-map'`, charger `const mirrorMap = await getPoiPhotoMirrorMap()` au début de la fonction exportée asynchrone qui lit les POI, puis :

- `src/features/categories/queries/poi-cards.ts:167-168` et `all-poi-cards.ts:111-112` :

```ts
        photo_url: (() => { const photo = selectPrimaryPoiPhoto(p.photos); return photo ? resolvePoiPhotoUrl(photo, mirrorMap) : null })(),
        photos: resolvePoiPhotoList(p.photos, mirrorMap),
```

- `src/features/city-guide/queries/cities.ts:179` :

```ts
      photo: poi.photos[0] ? resolvePoiPhotoUrl(poi.photos[0], mirrorMap) : null,
```

- `src/features/guide-app/queries/private-guide-data.ts` : dans la fonction de mappage des POI (`photos: poi.photos` l.362 et `photos: [photo, ...]` l.378), passer `mirrorMap` en paramètre depuis `getPrivateGuideData` et remplacer par `resolvePoiPhotoList(poi.photos, mirrorMap)` (l.362) et `resolvePoiPhotoList([photo, ...poi.photos.filter(candidate => candidate !== photo)], mirrorMap)` (l.378).

- [ ] **Step 7: Run tests**

Run: `npx jest tests/integration/poi-photo-mirroring.AC-03-01-AC-04.surfaces-and-credit.test.tsx tests/integration/public-discovery tests/unit/public-discovery tests/integration/private-guide tests/unit/categories tests/unit/city-guide`
Expected: PASS ; si un test existant échoue faute de mock `photo-mirror-map`, y ajouter le mock de Step 1 (table vide : `new Map()`), sans changer ses assertions.

- [ ] **Step 8: Typecheck + commit**

```bash
npx tsc --noEmit -p .
git add src/features/public-discovery src/features/categories/queries src/features/city-guide/queries/cities.ts src/features/guide-app/queries/private-guide-data.ts tests/integration/poi-photo-mirroring.AC-03-01-AC-04.surfaces-and-credit.test.tsx
git commit -m "feat(063): photos de POI servies depuis les copies + crédit sur la fiche"
```

---

### Task 8: Traçabilité

**Files:**
- Modify: `docs/traceability-matrix.md` (nouvelle section `## 063 — Copie et optimisation des photos des POI`)

- [ ] **Step 1: Ajouter la section**

```markdown
## 063 — Copie et optimisation des photos des POI

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Copie lancée en arrière-plan à la publication | `src/app/api/admin/pois/[id]/discovery-publication/route.ts` | `tests/integration/poi-photo-mirroring.AC-01-01.publication-trigger.test.ts` | ✅ done |
| AC-01-02 / AC-01-03 | WebP ≤ 1600 px + PoiPhotoMirror, idempotent | `src/features/poi-photos/services/mirror-poi-photos.ts` | `tests/unit/poi-photo-mirroring.AC-01-02-03.mirror-service.test.ts` | ✅ done |
| AC-01-04 | Tâche quotidienne (40 max) | `src/app/api/internal/poi-photo-mirrors/sync/route.ts`<br>`vercel.json` | `tests/contract/poi-photo-mirroring.AC-01-04.sync-route.test.ts` | ✅ done |
| AC-01-05 | Script de reprise | `scripts/mirror-poi-photos.ts` | — (exécution manuelle, Task 9) | ✅ done |
| AC-02-01..04 | Téléchargement sécurisé, échec retenté | `src/features/poi-photos/services/safe-image-download.ts` | `tests/unit/poi-photo-mirroring.AC-02-01-03.safe-download.test.ts` | ✅ done |
| AC-03-01..03 | Copies utilisées partout, retour à l'original, next/image | `src/features/poi-photos/queries/photo-mirror-map.ts`<br>`src/features/public-discovery/components/RemotePoiImage.tsx`<br>`src/features/public-discovery/queries/public-discovery.ts` | `tests/unit/poi-photo-mirroring.AC-03-02-03.resolution.test.tsx`<br>`tests/integration/poi-photo-mirroring.AC-03-01-AC-04.surfaces-and-credit.test.tsx` | ✅ done |
| AC-03-04 | Revalidation après copie | `src/features/poi-photos/services/mirror-poi-photos.ts` | `tests/unit/poi-photo-mirroring.AC-01-02-03.mirror-service.test.ts` | ✅ done |
| AC-04-01..03 | Crédit « Photos : <nom> » | `src/features/public-discovery/components/DiscoveryPoiView.tsx` | `tests/integration/poi-photo-mirroring.AC-03-01-AC-04.surfaces-and-credit.test.tsx` | ✅ done |
```

- [ ] **Step 2: Suite complète**

Run: `npx tsc --noEmit -p . && npx jest 2>&1 | grep -E "^(FAIL|Tests:|Test Suites:)"`
Expected: aucune nouvelle suite en échec par rapport à la référence de session.

- [ ] **Step 3: Commit**

```bash
git add docs/traceability-matrix.md
git commit -m "docs(063): traçabilité copie des photos des POI"
```

---

### Task 9: Mise en service (avec accord explicite du PO)

- [ ] **Step 1: Appliquer la migration en production** — `npx prisma migrate deploy` (migration additive, cf. mémoire « Appliquer les migrations DB »). Vérifier : `npx prisma migrate status` → « Database schema is up to date ».
- [ ] **Step 2: Pousser** `main` sur `origin` (déploiement Vercel, nouvelle tâche planifiée active).
- [ ] **Step 3: Reprise** — `npx tsx --env-file=.env.local scripts/mirror-poi-photos.ts` ; attendu : ~100 copiées, échecs listés.
- [ ] **Step 4: Vérifier en production** — sur `/decouvrir/saint-gervais-les-bains/diner/le-royal` : image principale servie via `/_next/image?url=…guide-photos%2Fpois…`, ligne « Photos : Le Royal », JSON-LD `image` pointant vers la copie.
