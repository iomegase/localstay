# Avis Google Business Profile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Importer chaque jour tous les avis de la fiche Google Business Profile MyStay et permettre à un admin de choisir, avis par avis, les landings (destinations) où ils sont publiés.

**Architecture:** Un client HTTP sans dépendance (`src/shared/lib/google-business.ts`) échange le refresh token OAuth et pagine l'API v4 des avis. Un service de synchronisation pur (`syncGoogleReviews`) compare la réponse Google à un *store* injecté (implémentation Prisma en production, mémoire en test) et écrit dans une nouvelle table `GoogleBusinessReview`. Publier un avis crée/réactive un `LocalLandingReview` de source `GOOGLE` relié par `google_review_id` ; l'affichage public existant (`GuestReviews`, landing conciergerie) est réutilisé.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Prisma/Supabase, Zod, Shadcn/ui, Jest + Testing Library.

**Spec:** `specs/features/062-google-reviews/spec.md` (status `approved`)

## Global Constraints

- Une seule fiche GBP : `GOOGLE_BUSINESS_ACCOUNT_ID` + `GOOGLE_BUSINESS_LOCATION_ID` (BR-01).
- Aucun avis publié sans case cochée par un admin (BR-02).
- Texte publié = texte Google tel qu'écrit par l'auteur, sans troncature en données (BR-03).
- Soft delete uniquement (`deleted_at`), jamais de suppression physique (BR-05).
- Refresh token uniquement en variable d'environnement serveur (BR-06).
- Pas de JSON-LD `Review` / `AggregateRating` (BR-07).
- Cron : `{ "path": "/api/internal/google-reviews/sync", "schedule": "45 5 * * *" }` dans `vercel.json`.
- Auth cron : `Authorization: Bearer ${INTERNAL_API_SECRET}` (même convention que `src/app/api/internal/translations/sync/route.ts`).
- Auth admin : `getSessionAdmin()` (routes) / `getPageAdmin()` (pages).
- Erreurs : `apiError(code, message, status, details)` de `@/features/merchant/lib/responses` → `{ error: { code, message, details } }`.
- TypeScript sans `any` ; toute entrée (requête HTTP **et** réponse Google) validée par Zod.
- Tests nommés `google-reviews.<AC>.<sujet>.test.ts(x)` dans `tests/unit|contract|integration/`.
- Ne jamais lancer `prisma migrate deploy` (une migration blog non commitée du PO est en attente) : appliquer **uniquement** la migration 062 via `db execute` + `migrate resolve --applied`.
- Ne pas committer les modifications locales non liées du PO (`prisma/schema.prisma` ligne `concierge` de `BlogArticleCategory`, migration `20261004160000_add_blog_concierge_category`, `docs/traceability-matrix.md` hors lignes 062…) : stager par hunk via `git update-index --cacheinfo` comme dans les commits précédents.

## Review Focus

1. **Avis anonyme ou sans `displayName`** → auteur « Utilisateur Google », jamais une chaîne vide (sinon `LocalLandingReview.author` vide sur le site). Test : Task 2.
2. **Commentaire traduit par Google** (`(Translated by Google) … (Original) …`) → seul le texte original de l'auteur est conservé. Test : Task 2.
3. **Réponse Google vide alors que la base contient des avis actifs** (mauvais `LOCATION_ID`, fiche suspendue) → aucune suppression ; on ne vide pas le site sur une erreur de configuration. Test : Task 3.
4. **Refresh token révoqué** (`invalid_grant` à l'échange du token) → erreur `GOOGLE_API_ERROR` (502) avec un message qui indique de relancer `scripts/google-business-auth.ts` ; aucune écriture. Test : Task 2 + Task 4.
5. **Double envoi du même `PUT …/publications`** (double clic, retry) → toujours une seule publication par (destination, avis). Test : Task 5.

---

## File Structure

| Fichier | Rôle |
|---|---|
| `prisma/schema.prisma` | enum `GOOGLE`, modèle `GoogleBusinessReview`, colonne + relation sur `LocalLandingReview` |
| `prisma/migrations/20261005120000_google_business_reviews/migration.sql` | DDL additif idempotent |
| `src/features/local-seo/types/landing-reviews.ts` | type `StoredLandingReviewSource` (lecture) ≠ `LandingReviewSource` (saisie manuelle) |
| `src/features/local-seo/schemas/landing-reviews.ts` | schéma de réponse accepte `GOOGLE` |
| `src/features/local-seo/queries/landing-reviews.ts` | `toDto` typé avec la source élargie |
| `src/features/local-seo/content/guest-reviews.ts` | `source` inclut `GOOGLE` |
| `src/features/local-seo/components/GuestReviews.tsx` | mention « Avis Google » |
| `src/features/local-seo/components/AdminLandingReviews.tsx` | publications Google en lecture seule (pas de « Modifier ») |
| `src/shared/lib/google-business.ts` | config env, échange de token, pagination, normalisation |
| `src/features/google-reviews/types.ts` | DTO admin + résumé de synchro |
| `src/features/google-reviews/services/sync.ts` | `syncGoogleReviews` pur + interface `GoogleReviewStore` |
| `src/features/google-reviews/queries/store.ts` | `prismaGoogleReviewStore` |
| `src/features/google-reviews/services/run-sync.ts` | assemble config + fetch + store ; mappe les erreurs en réponses HTTP |
| `src/features/google-reviews/schemas.ts` | Zod des routes admin |
| `src/features/google-reviews/queries/publications.ts` | `setGoogleReviewPublications` |
| `src/features/google-reviews/queries/admin.ts` | `getAdminGoogleReviews` |
| `src/features/google-reviews/components/AdminGoogleReviews.tsx` | UI admin (client) |
| `src/app/api/internal/google-reviews/sync/route.ts` | cron |
| `src/app/api/admin/google-reviews/sync/route.ts` | synchro manuelle |
| `src/app/api/admin/google-reviews/[id]/publications/route.ts` | publication |
| `src/app/admin/google-reviews/page.tsx` | page admin |
| `src/app/admin/layout.tsx` | entrée de navigation |
| `scripts/google-business-auth.ts` | OAuth local unique |
| `vercel.json`, `.env.example` | cron + variables |

---

### Task 1: Modèle de données, source `GOOGLE` et mention « Avis Google »

**Files:**
- Modify: `specs/features/062-google-reviews/spec.md` (corrections de contrat, voir Step 1)
- Modify: `prisma/schema.prisma` (enum `LocalLandingReviewSource` l.103-106, modèle `LocalLandingReview` l.162-181, nouveau modèle)
- Create: `prisma/migrations/20261005120000_google_business_reviews/migration.sql`
- Modify: `src/features/local-seo/types/landing-reviews.ts`
- Modify: `src/features/local-seo/schemas/landing-reviews.ts`
- Modify: `src/features/local-seo/queries/landing-reviews.ts` (`toDto`)
- Modify: `src/features/local-seo/content/guest-reviews.ts`
- Modify: `src/features/local-seo/components/GuestReviews.tsx`
- Modify: `src/features/local-seo/components/AdminLandingReviews.tsx`
- Test: `tests/integration/google-reviews.AC-03-01.guest-reviews-label.test.tsx`

**Interfaces:**
- Produces: modèle Prisma `GoogleBusinessReview` (champs de la spec), `LocalLandingReview.google_review_id: string | null`, contrainte composée Prisma `destination_id_google_review_id`, type `StoredLandingReviewSource = 'AIRBNB' | 'DIRECT' | 'GOOGLE'`.

- [ ] **Step 1: Corriger la spec (contrat)**

Dans `specs/features/062-google-reviews/spec.md` :
- API Contract : remplacer le chemin `/api/admin/google-reviews/{googleReviewId}/publications` par `/api/admin/google-reviews/{id}/publications` et le paramètre par `- { name: id, in: path, required: true, schema: { type: string, format: uuid } }` ; ajouter sous le bloc : « `id` = identifiant interne `GoogleBusinessReview.id` : l'identifiant Google (`accounts/…/reviews/…`) contient des `/` et ne peut pas être un segment d'URL. »
- UI Behaviour : remplacer « toast avec le résumé ou l'erreur » et « toast d'erreur » par « message d'état (`role="status"`, convention de l'admin existant) ».
- Infrastructure / prérequis : ajouter l'API « My Business Business Information » (liste des établissements par le script).

- [ ] **Step 2: Écrire le test qui échoue (AC-03-01)**

```tsx
/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { GuestReviews } from '@/features/local-seo/components/GuestReviews'

describe('062 AC-03-01 — mention « Avis Google »', () => {
  it('labels Google reviews and keeps Airbnb / direct labels unchanged', () => {
    render(<GuestReviews reviews={[
      { id: 'g', quote: 'Séjour parfait, accueil au top.', author: 'Julie', source: 'GOOGLE', rating: 5 },
      { id: 'a', quote: 'Très bon séjour au chalet.', author: 'Marc', source: 'AIRBNB' },
      { id: 'd', quote: 'Merci pour tout, à refaire.', author: 'Anne', source: 'DIRECT' },
    ]} />)

    expect(screen.getByText('Avis Google')).toBeInTheDocument()
    expect(screen.getByText('Avis voyageur reçu via Airbnb')).toBeInTheDocument()
    expect(screen.getAllByText(/Avis Google|Avis voyageur reçu via Airbnb/)).toHaveLength(2)
  })
})
```

- [ ] **Step 3: Lancer le test → échec**

Run: `npx jest tests/integration/google-reviews.AC-03-01.guest-reviews-label.test.tsx`
Expected: FAIL — erreur TypeScript/jest sur `source: 'GOOGLE'` ou « Unable to find an element with the text: Avis Google ».

- [ ] **Step 4: Schéma Prisma**

Dans `prisma/schema.prisma`, enum :

```prisma
enum LocalLandingReviewSource {
  AIRBNB
  DIRECT
  GOOGLE
}
```

Dans `model LocalLandingReview`, après `destination LocalLandingDestination @relation(...)` :

```prisma
  // Spec 062 — publication d'un avis Google Business Profile
  google_review_id String?
  google_review    GoogleBusinessReview? @relation(fields: [google_review_id], references: [google_review_id])

  @@unique([destination_id, google_review_id])
```

Nouveau modèle, juste après `LocalLandingReview` :

```prisma
// Spec 062 — copie brute des avis de la fiche Google Business Profile MyStay
model GoogleBusinessReview {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  google_review_id  String   @unique
  author            String
  author_photo_url  String?
  rating            Int
  comment           String?
  owner_reply       String?
  google_created_at DateTime
  google_updated_at DateTime
  last_synced_at    DateTime

  publications LocalLandingReview[]

  @@index([deleted_at, google_created_at])
}
```

- [ ] **Step 5: Migration SQL (le shadow DB est cassé : écrire à la main)**

`prisma/migrations/20261005120000_google_business_reviews/migration.sql` :

```sql
-- Spec 062 — Avis Google Business Profile (additif, idempotent)
ALTER TYPE "LocalLandingReviewSource" ADD VALUE IF NOT EXISTS 'GOOGLE';

CREATE TABLE IF NOT EXISTS "GoogleBusinessReview" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "google_review_id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "author_photo_url" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "owner_reply" TEXT,
    "google_created_at" TIMESTAMP(3) NOT NULL,
    "google_updated_at" TIMESTAMP(3) NOT NULL,
    "last_synced_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GoogleBusinessReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GoogleBusinessReview_google_review_id_key" ON "GoogleBusinessReview"("google_review_id");
CREATE INDEX IF NOT EXISTS "GoogleBusinessReview_deleted_at_google_created_at_idx" ON "GoogleBusinessReview"("deleted_at", "google_created_at");

ALTER TABLE "LocalLandingReview" ADD COLUMN IF NOT EXISTS "google_review_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "LocalLandingReview_destination_id_google_review_id_key" ON "LocalLandingReview"("destination_id", "google_review_id");

DO $$ BEGIN
  ALTER TABLE "LocalLandingReview" ADD CONSTRAINT "LocalLandingReview_google_review_id_fkey"
    FOREIGN KEY ("google_review_id") REFERENCES "GoogleBusinessReview"("google_review_id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

Run: `npx prisma validate && npx prisma generate`
Expected: « The schema at prisma/schema.prisma is valid » puis « Generated Prisma Client ».

- [ ] **Step 6: Types et affichage**

`src/features/local-seo/types/landing-reviews.ts` — garder `LANDING_REVIEW_SOURCES` (saisie manuelle) et ajouter :

```ts
/** Sources lisibles en base : la saisie manuelle reste AIRBNB / DIRECT, GOOGLE vient de la spec 062. */
export const STORED_LANDING_REVIEW_SOURCES = [...LANDING_REVIEW_SOURCES, 'GOOGLE'] as const

export type StoredLandingReviewSource = (typeof STORED_LANDING_REVIEW_SOURCES)[number]
```

et dans `LandingReviewDto` : `source: StoredLandingReviewSource`.

`src/features/local-seo/schemas/landing-reviews.ts` — dans `LandingReviewResponseSchema` uniquement : `source: z.enum(STORED_LANDING_REVIEW_SOURCES),` (importer la constante). `LandingReviewInputSchema` reste sur `LANDING_REVIEW_SOURCES`.

`src/features/local-seo/queries/landing-reviews.ts` — dans la signature de `toDto` : `source: 'AIRBNB' | 'DIRECT' | 'GOOGLE'`.

`src/features/local-seo/content/guest-reviews.ts` : `source?: 'AIRBNB' | 'DIRECT' | 'GOOGLE'`.

`src/features/local-seo/components/GuestReviews.tsx` — sous la ligne Airbnb :

```tsx
              {review.source === 'GOOGLE' && <span className="mt-1 block font-normal text-slate-500">Avis Google</span>}
```

`src/features/local-seo/components/AdminLandingReviews.tsx` :
- libellé de source : `{review.source === 'AIRBNB' ? 'Airbnb' : review.source === 'GOOGLE' ? 'Google' : 'Direct'}`
- bouton « Modifier » : condition `{!review.deleted_at && review.source !== 'GOOGLE' && <Button …>}` et, à la place pour Google : `{review.source === 'GOOGLE' && <p className="text-xs text-slate-500">Avis Google : publication gérée dans « Avis Google ».</p>}`
- `edit()` n'est plus appelable pour `GOOGLE` ; `FormState.source` reste `LandingReviewSource`. Si `tsc` signale `review.source` dans `edit`, écrire `source: review.source === 'GOOGLE' ? 'DIRECT' : review.source,`.

- [ ] **Step 7: Lancer le test + suites voisines**

Run: `npx jest tests/integration/google-reviews.AC-03-01 tests/integration/local-landing-reviews tests/contract/local-landing-reviews && npx tsc --noEmit -p . 2>&1 | grep -E "local-seo|google" ; echo tsc-done`
Expected: PASS, aucune erreur tsc listée.

- [ ] **Step 8: Commit (sans les changements blog du PO)**

```bash
S=/private/tmp/claude-501/-Users-daviddevillers-sites-staylocal-/d20f79aa-b9ce-4bb5-9143-ca8fd97f02b2/scratchpad
# schema.prisma : stager HEAD + uniquement les ajouts 062 (pas la valeur `concierge` du PO)
git show HEAD:prisma/schema.prisma > $S/schema.head && cp prisma/schema.prisma $S/schema.wt
python3 - "$S" <<'EOF'
import sys; S=sys.argv[1]
wt=open(f'{S}/schema.wt').read()
staged=wt.replace('  travel_tips\n  concierge\n}', '  travel_tips\n}')
assert staged != wt
open(f'{S}/schema.staged','w').write(staged)
EOF
git update-index --cacheinfo 100644,$(git hash-object -w $S/schema.staged),prisma/schema.prisma
git add prisma/migrations/20261005120000_google_business_reviews specs/features/062-google-reviews/spec.md src/features/local-seo tests/integration/google-reviews.AC-03-01.guest-reviews-label.test.tsx
git commit -m "feat(google-reviews): modèle GoogleBusinessReview, source GOOGLE et mention « Avis Google » (spec 062 AC-03-01)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Client Google Business Profile

**Files:**
- Create: `src/shared/lib/google-business.ts`
- Modify: `.env.example` (après `GOOGLE_SERVICE_ACCOUNT_KEY=`)
- Test: `tests/unit/google-reviews.AC-01-01-02.google-business-client.test.ts`

**Interfaces:**
- Produces:
  - `type GoogleBusinessConfig = { clientId: string; clientSecret: string; refreshToken: string; accountId: string; locationId: string }`
  - `googleBusinessConfigFromEnv(env?: NodeJS.ProcessEnv): GoogleBusinessConfig | null`
  - `class GoogleBusinessError extends Error { code: 'GOOGLE_NOT_CONFIGURED' | 'GOOGLE_API_ERROR' }`
  - `type NormalizedGoogleReview = { google_review_id: string; author: string; author_photo_url: string | null; rating: number; comment: string | null; owner_reply: string | null; google_created_at: Date; google_updated_at: Date }`
  - `fetchAllGoogleReviews(config: GoogleBusinessConfig, fetchImpl?: typeof fetch): Promise<NormalizedGoogleReview[]>`

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
import {
  fetchAllGoogleReviews, GoogleBusinessError, googleBusinessConfigFromEnv, type GoogleBusinessConfig,
} from '@/shared/lib/google-business'

const config: GoogleBusinessConfig = {
  clientId: 'cid', clientSecret: 'secret', refreshToken: 'refresh', accountId: '111', locationId: '222',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

const rawReview = (id: string, overrides: Record<string, unknown> = {}) => ({
  name: `accounts/111/locations/222/reviews/${id}`,
  reviewId: id,
  reviewer: { displayName: 'Julie M.', profilePhotoUrl: 'https://lh3.googleusercontent.com/a/photo' },
  starRating: 'FIVE',
  comment: 'Séjour parfait.',
  createTime: '2026-09-12T10:00:00Z',
  updateTime: '2026-09-13T08:30:00Z',
  ...overrides,
})

function fetchMock(pages: unknown[]): jest.Mock {
  const mock = jest.fn()
  mock.mockResolvedValueOnce(json({ access_token: 'token', expires_in: 3599 }))
  for (const page of pages) mock.mockResolvedValueOnce(json(page))
  return mock
}

describe('062 AC-01-01 — pagination complète', () => {
  it('exchanges the refresh token then follows nextPageToken until the end', async () => {
    const fetchImpl = fetchMock([
      { reviews: [rawReview('a'), rawReview('b')], nextPageToken: 'p2' },
      { reviews: [rawReview('c')] },
    ])
    const reviews = await fetchAllGoogleReviews(config, fetchImpl)

    expect(reviews.map(review => review.google_review_id)).toEqual([
      'accounts/111/locations/222/reviews/a', 'accounts/111/locations/222/reviews/b', 'accounts/111/locations/222/reviews/c',
    ])
    const [tokenUrl, tokenInit] = fetchImpl.mock.calls[0]
    expect(tokenUrl).toBe('https://oauth2.googleapis.com/token')
    expect(String(tokenInit.body)).toContain('grant_type=refresh_token')
    expect(String(tokenInit.body)).toContain('refresh_token=refresh')
    expect(fetchImpl.mock.calls[1][0]).toBe('https://mybusiness.googleapis.com/v4/accounts/111/locations/222/reviews?pageSize=50')
    expect(fetchImpl.mock.calls[2][0]).toBe('https://mybusiness.googleapis.com/v4/accounts/111/locations/222/reviews?pageSize=50&pageToken=p2')
    expect(fetchImpl.mock.calls[1][1].headers).toEqual({ Authorization: 'Bearer token' })
  })

  it('returns an empty list when the location has no review', async () => {
    expect(await fetchAllGoogleReviews(config, fetchMock([{}]))).toEqual([])
  })

  it('stops with an error when Google keeps returning a next page (loop guard)', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce(json({ access_token: 'token' }))
      .mockImplementation(async () => json({ reviews: [rawReview('a')], nextPageToken: 'same' }))
    await expect(fetchAllGoogleReviews(config, fetchImpl)).rejects.toMatchObject({ code: 'GOOGLE_API_ERROR' })
  })
})

describe('062 AC-01-02 — normalisation', () => {
  it('maps rating, missing comment, owner reply and dates', async () => {
    const [review] = await fetchAllGoogleReviews(config, fetchMock([{ reviews: [
      rawReview('a', { starRating: 'FOUR', comment: undefined, reviewReply: { comment: 'Merci Julie !' } }),
    ] }]))
    expect(review).toEqual({
      google_review_id: 'accounts/111/locations/222/reviews/a',
      author: 'Julie M.',
      author_photo_url: 'https://lh3.googleusercontent.com/a/photo',
      rating: 4,
      comment: null,
      owner_reply: 'Merci Julie !',
      google_created_at: new Date('2026-09-12T10:00:00Z'),
      google_updated_at: new Date('2026-09-13T08:30:00Z'),
    })
  })

  it('skips reviews whose rating is unspecified', async () => {
    const reviews = await fetchAllGoogleReviews(config, fetchMock([{ reviews: [
      rawReview('a', { starRating: 'STAR_RATING_UNSPECIFIED' }), rawReview('b'),
    ] }]))
    expect(reviews.map(review => review.rating)).toEqual([5])
  })

  // Review Focus 1
  it('uses « Utilisateur Google » for anonymous or nameless reviewers', async () => {
    const reviews = await fetchAllGoogleReviews(config, fetchMock([{ reviews: [
      rawReview('a', { reviewer: { isAnonymous: true } }), rawReview('b', { reviewer: { displayName: '   ' } }),
    ] }]))
    expect(reviews.map(review => review.author)).toEqual(['Utilisateur Google', 'Utilisateur Google'])
  })

  // Review Focus 2
  it('keeps only the original text of Google-translated comments', async () => {
    const reviews = await fetchAllGoogleReviews(config, fetchMock([{ reviews: [
      rawReview('a', { comment: '(Translated by Google) Great stay.\n\n(Original)\nSuper séjour.' }),
      rawReview('b', { comment: 'Super chalet.\n\n(Translated by Google)\nGreat chalet.' }),
    ] }]))
    expect(reviews.map(review => review.comment)).toEqual(['Super séjour.', 'Super chalet.'])
  })
})

describe('062 — erreurs et configuration', () => {
  // Review Focus 4
  it('turns a revoked refresh token into GOOGLE_API_ERROR pointing to the auth script', async () => {
    const fetchImpl = jest.fn().mockResolvedValueOnce(json({ error: 'invalid_grant' }, 400))
    const error = await fetchAllGoogleReviews(config, fetchImpl).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(GoogleBusinessError)
    expect(error).toMatchObject({ code: 'GOOGLE_API_ERROR' })
    expect((error as Error).message).toContain('scripts/google-business-auth.ts')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it.each([401, 403, 429, 500])('turns a %s on the reviews endpoint into GOOGLE_API_ERROR', async status => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce(json({ access_token: 'token' }))
      .mockResolvedValueOnce(json({ error: { message: 'nope' } }, status))
    await expect(fetchAllGoogleReviews(config, fetchImpl)).rejects.toMatchObject({ code: 'GOOGLE_API_ERROR' })
  })

  it('turns a network failure or a malformed payload into GOOGLE_API_ERROR', async () => {
    const network = jest.fn().mockRejectedValueOnce(new TypeError('fetch failed'))
    await expect(fetchAllGoogleReviews(config, network)).rejects.toMatchObject({ code: 'GOOGLE_API_ERROR' })
    await expect(fetchAllGoogleReviews(config, fetchMock([{ reviews: [{ name: 'x' }] }]))).rejects.toMatchObject({ code: 'GOOGLE_API_ERROR' })
  })

  it('reads the five variables and returns null when one is missing', () => {
    const env = {
      GOOGLE_BUSINESS_CLIENT_ID: 'cid', GOOGLE_BUSINESS_CLIENT_SECRET: 'secret', GOOGLE_BUSINESS_REFRESH_TOKEN: 'refresh',
      GOOGLE_BUSINESS_ACCOUNT_ID: '111', GOOGLE_BUSINESS_LOCATION_ID: '222',
    } as NodeJS.ProcessEnv
    expect(googleBusinessConfigFromEnv(env)).toEqual(config)
    expect(googleBusinessConfigFromEnv({ ...env, GOOGLE_BUSINESS_REFRESH_TOKEN: '' })).toBeNull()
  })
})
```

- [ ] **Step 2: Lancer → échec**

Run: `npx jest tests/unit/google-reviews.AC-01-01-02.google-business-client.test.ts`
Expected: FAIL — « Cannot find module '@/shared/lib/google-business' ».

- [ ] **Step 3: Implémenter**

`src/shared/lib/google-business.ts` :

```ts
import { z } from 'zod'

// Spec 062 — client Google Business Profile (OAuth refresh token + API v4 des avis).

export type GoogleBusinessConfig = {
  clientId: string
  clientSecret: string
  refreshToken: string
  accountId: string
  locationId: string
}

export type NormalizedGoogleReview = {
  google_review_id: string
  author: string
  author_photo_url: string | null
  rating: number
  comment: string | null
  owner_reply: string | null
  google_created_at: Date
  google_updated_at: Date
}

export class GoogleBusinessError extends Error {
  constructor(public readonly code: 'GOOGLE_NOT_CONFIGURED' | 'GOOGLE_API_ERROR', message: string) {
    super(message)
    this.name = 'GoogleBusinessError'
  }
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REVIEWS_URL = 'https://mybusiness.googleapis.com/v4'
const PAGE_SIZE = 50
const MAX_PAGES = 100
const ANONYMOUS_AUTHOR = 'Utilisateur Google'
const STAR_RATINGS = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 } as const

const TokenSchema = z.object({ access_token: z.string().min(1) })

const RawReviewSchema = z.object({
  name: z.string().min(1),
  reviewer: z.object({
    displayName: z.string().optional(),
    profilePhotoUrl: z.string().optional(),
  }).optional(),
  starRating: z.enum(['STAR_RATING_UNSPECIFIED', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE']),
  comment: z.string().optional(),
  createTime: z.string().datetime({ offset: true }),
  updateTime: z.string().datetime({ offset: true }),
  reviewReply: z.object({ comment: z.string().optional() }).optional(),
})

const RawPageSchema = z.object({
  reviews: z.array(RawReviewSchema).optional(),
  nextPageToken: z.string().optional(),
})

type RawReview = z.infer<typeof RawReviewSchema>

export function googleBusinessConfigFromEnv(env: NodeJS.ProcessEnv = process.env): GoogleBusinessConfig | null {
  const config = {
    clientId: env.GOOGLE_BUSINESS_CLIENT_ID?.trim(),
    clientSecret: env.GOOGLE_BUSINESS_CLIENT_SECRET?.trim(),
    refreshToken: env.GOOGLE_BUSINESS_REFRESH_TOKEN?.trim(),
    accountId: env.GOOGLE_BUSINESS_ACCOUNT_ID?.trim(),
    locationId: env.GOOGLE_BUSINESS_LOCATION_ID?.trim(),
  }
  if (!config.clientId || !config.clientSecret || !config.refreshToken || !config.accountId || !config.locationId) return null
  return {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    refreshToken: config.refreshToken,
    accountId: config.accountId,
    locationId: config.locationId,
  }
}

/** Google ajoute sa traduction au texte : on garde celui écrit par l'auteur. */
function originalComment(comment: string | undefined): string | null {
  if (!comment?.trim()) return null
  const originalMarker = '(Original)'
  const translatedMarker = '(Translated by Google)'
  let text = comment
  if (text.includes(originalMarker)) text = text.slice(text.indexOf(originalMarker) + originalMarker.length)
  else if (text.includes(translatedMarker)) text = text.slice(0, text.indexOf(translatedMarker))
  return text.trim() || null
}

function normalize(raw: RawReview & { starRating: keyof typeof STAR_RATINGS }): NormalizedGoogleReview {
  return {
    google_review_id: raw.name,
    author: raw.reviewer?.displayName?.trim() || ANONYMOUS_AUTHOR,
    author_photo_url: raw.reviewer?.profilePhotoUrl ?? null,
    rating: STAR_RATINGS[raw.starRating],
    comment: originalComment(raw.comment),
    owner_reply: raw.reviewReply?.comment?.trim() || null,
    google_created_at: new Date(raw.createTime),
    google_updated_at: new Date(raw.updateTime),
  }
}

function isRated(raw: RawReview): raw is RawReview & { starRating: keyof typeof STAR_RATINGS } {
  return raw.starRating !== 'STAR_RATING_UNSPECIFIED'
}

async function request(fetchImpl: typeof fetch, url: string, init: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetchImpl(url, init)
  } catch {
    throw new GoogleBusinessError('GOOGLE_API_ERROR', 'Google Business Profile est injoignable.')
  }
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const invalidGrant = typeof body === 'object' && body !== null && 'error' in body && body.error === 'invalid_grant'
    throw new GoogleBusinessError('GOOGLE_API_ERROR', invalidGrant
      ? 'Autorisation Google révoquée ou expirée : relancez scripts/google-business-auth.ts et mettez à jour GOOGLE_BUSINESS_REFRESH_TOKEN.'
      : `Google Business Profile a répondu ${response.status}.`)
  }
  return body
}

async function accessToken(config: GoogleBusinessConfig, fetchImpl: typeof fetch): Promise<string> {
  const body = await request(fetchImpl, TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  })
  const parsed = TokenSchema.safeParse(body)
  if (!parsed.success) throw new GoogleBusinessError('GOOGLE_API_ERROR', 'Réponse OAuth Google inattendue.')
  return parsed.data.access_token
}

export async function fetchAllGoogleReviews(
  config: GoogleBusinessConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedGoogleReview[]> {
  const token = await accessToken(config, fetchImpl)
  const base = `${REVIEWS_URL}/accounts/${encodeURIComponent(config.accountId)}/locations/${encodeURIComponent(config.locationId)}/reviews?pageSize=${PAGE_SIZE}`
  const reviews: NormalizedGoogleReview[] = []
  let pageToken: string | undefined

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = pageToken ? `${base}&pageToken=${encodeURIComponent(pageToken)}` : base
    const parsed = RawPageSchema.safeParse(await request(fetchImpl, url, { headers: { Authorization: `Bearer ${token}` } }))
    if (!parsed.success) throw new GoogleBusinessError('GOOGLE_API_ERROR', 'Réponse Google Business Profile inattendue.')
    reviews.push(...(parsed.data.reviews ?? []).filter(isRated).map(normalize))
    if (!parsed.data.nextPageToken) return reviews
    pageToken = parsed.data.nextPageToken
  }
  throw new GoogleBusinessError('GOOGLE_API_ERROR', `Pagination Google interrompue après ${MAX_PAGES} pages.`)
}
```

`.env.example`, après `GOOGLE_SERVICE_ACCOUNT_KEY=` :

```
# Spec 062 — Avis Google Business Profile (voir scripts/google-business-auth.ts)
GOOGLE_BUSINESS_CLIENT_ID=
GOOGLE_BUSINESS_CLIENT_SECRET=
GOOGLE_BUSINESS_REFRESH_TOKEN=
GOOGLE_BUSINESS_ACCOUNT_ID=
GOOGLE_BUSINESS_LOCATION_ID=
```

- [ ] **Step 4: Lancer → succès**

Run: `npx jest tests/unit/google-reviews.AC-01-01-02.google-business-client.test.ts && npx eslint src/shared/lib/google-business.ts`
Expected: PASS (13 tests), lint sans erreur.

- [ ] **Step 5: Commit**

```bash
git add src/shared/lib/google-business.ts .env.example tests/unit/google-reviews.AC-01-01-02.google-business-client.test.ts
git commit -m "feat(google-reviews): client Google Business Profile — token, pagination, normalisation (spec 062 AC-01-01/02)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Service de synchronisation et store Prisma

**Files:**
- Create: `src/features/google-reviews/types.ts`
- Create: `src/features/google-reviews/services/sync.ts`
- Create: `src/features/google-reviews/queries/store.ts`
- Test: `tests/unit/google-reviews.AC-01-03-05.sync.test.ts`
- Test: `tests/integration/google-reviews.AC-01-04.AC-02-04.prisma-store.test.ts`

**Interfaces:**
- Consumes: `NormalizedGoogleReview` (Task 2).
- Produces:
  - `types.ts` : `type SyncSummary = { fetched: number; created: number; updated: number; deleted: number }`
  - `sync.ts` : `type StoredGoogleReview = NormalizedGoogleReview & { deleted_at: Date | null }`, `type GoogleReviewStore = { listAll(): Promise<StoredGoogleReview[]>; create(review: NormalizedGoogleReview, syncedAt: Date): Promise<void>; update(review: NormalizedGoogleReview, syncedAt: Date): Promise<void>; markSynced(googleReviewIds: string[], syncedAt: Date): Promise<void>; softDelete(googleReviewIds: string[], deletedAt: Date): Promise<void> }`, `syncGoogleReviews(options: { fetchReviews: () => Promise<NormalizedGoogleReview[]>; store: GoogleReviewStore; now?: () => Date }): Promise<SyncSummary>`
  - `store.ts` : `prismaGoogleReviewStore: GoogleReviewStore`

- [ ] **Step 1: Tests unitaires qui échouent (store en mémoire)**

```ts
import type { NormalizedGoogleReview } from '@/shared/lib/google-business'
import { syncGoogleReviews, type GoogleReviewStore, type StoredGoogleReview } from '@/features/google-reviews/services/sync'

const now = new Date('2026-10-05T05:45:00Z')

const review = (id: string, overrides: Partial<NormalizedGoogleReview> = {}): NormalizedGoogleReview => ({
  google_review_id: `accounts/1/locations/2/reviews/${id}`,
  author: 'Julie', author_photo_url: null, rating: 5, comment: 'Parfait.', owner_reply: null,
  google_created_at: new Date('2026-09-01T10:00:00Z'), google_updated_at: new Date('2026-09-01T10:00:00Z'),
  ...overrides,
})

function memoryStore(initial: StoredGoogleReview[] = []) {
  const rows = new Map(initial.map(row => [row.google_review_id, { ...row }]))
  const calls = { create: 0, update: 0, softDelete: [] as string[], markSynced: [] as string[] }
  const store: GoogleReviewStore = {
    listAll: async () => [...rows.values()].map(row => ({ ...row })),
    create: async item => { calls.create += 1; rows.set(item.google_review_id, { ...item, deleted_at: null }) },
    update: async item => { calls.update += 1; rows.set(item.google_review_id, { ...item, deleted_at: null }) },
    markSynced: async ids => { calls.markSynced.push(...ids) },
    softDelete: async (ids, at) => {
      calls.softDelete.push(...ids)
      for (const id of ids) rows.set(id, { ...rows.get(id)!, deleted_at: at })
    },
  }
  return { store, rows, calls }
}

describe('062 AC-01-03 — upsert idempotent', () => {
  it('creates new reviews, then a second identical sync changes nothing', async () => {
    const { store, calls } = memoryStore()
    const fetchReviews = async () => [review('a'), review('b')]

    expect(await syncGoogleReviews({ fetchReviews, store, now: () => now })).toEqual({ fetched: 2, created: 2, updated: 0, deleted: 0 })
    expect(await syncGoogleReviews({ fetchReviews, store, now: () => now })).toEqual({ fetched: 2, created: 0, updated: 0, deleted: 0 })
    expect(calls.create).toBe(2)
    expect(calls.update).toBe(0)
  })

  it('updates a review whose content changed on Google and restores a previously deleted one', async () => {
    const { store, rows } = memoryStore([
      { ...review('a'), deleted_at: null },
      { ...review('b'), deleted_at: new Date('2026-09-20T00:00:00Z') },
    ])
    const summary = await syncGoogleReviews({
      fetchReviews: async () => [review('a', { comment: 'Parfait, merci !', google_updated_at: new Date('2026-10-01T00:00:00Z') }), review('b')],
      store, now: () => now,
    })
    expect(summary).toEqual({ fetched: 2, created: 0, updated: 2, deleted: 0 })
    expect(rows.get(review('a').google_review_id)?.comment).toBe('Parfait, merci !')
    expect(rows.get(review('b').google_review_id)?.deleted_at).toBeNull()
  })
})

describe('062 AC-01-04 — avis disparu de Google', () => {
  it('soft-deletes active reviews absent from the complete response', async () => {
    const { store, calls } = memoryStore([{ ...review('a'), deleted_at: null }, { ...review('gone'), deleted_at: null }])
    const summary = await syncGoogleReviews({ fetchReviews: async () => [review('a')], store, now: () => now })
    expect(summary).toEqual({ fetched: 1, created: 0, updated: 0, deleted: 1 })
    expect(calls.softDelete).toEqual([review('gone').google_review_id])
  })

  it('does not count an already deleted review again', async () => {
    const { store, calls } = memoryStore([{ ...review('a'), deleted_at: null }, { ...review('old'), deleted_at: now }])
    expect((await syncGoogleReviews({ fetchReviews: async () => [review('a')], store, now: () => now })).deleted).toBe(0)
    expect(calls.softDelete).toEqual([])
  })

  // Review Focus 3
  it('never deletes anything when Google returns zero review while active reviews exist', async () => {
    const { store, calls } = memoryStore([{ ...review('a'), deleted_at: null }])
    expect(await syncGoogleReviews({ fetchReviews: async () => [], store, now: () => now }))
      .toEqual({ fetched: 0, created: 0, updated: 0, deleted: 0 })
    expect(calls.softDelete).toEqual([])
  })
})

describe('062 AC-01-05 — erreur Google', () => {
  it('propagates the error without any write', async () => {
    const { store, calls } = memoryStore([{ ...review('a'), deleted_at: null }])
    await expect(syncGoogleReviews({
      fetchReviews: async () => { throw new Error('GOOGLE_API_ERROR') }, store, now: () => now,
    })).rejects.toThrow('GOOGLE_API_ERROR')
    expect(calls).toEqual({ create: 0, update: 0, softDelete: [], markSynced: [] })
  })
})

it('marks every fetched review as synced for the admin « dernière synchronisation » date', async () => {
  const { store, calls } = memoryStore([{ ...review('a'), deleted_at: null }])
  await syncGoogleReviews({ fetchReviews: async () => [review('a'), review('b')], store, now: () => now })
  expect(calls.markSynced.sort()).toEqual([review('a').google_review_id, review('b').google_review_id].sort())
})
```

- [ ] **Step 2: Lancer → échec**

Run: `npx jest tests/unit/google-reviews.AC-01-03-05.sync.test.ts`
Expected: FAIL — module `@/features/google-reviews/services/sync` introuvable.

- [ ] **Step 3: Implémenter `types.ts` et `sync.ts`**

`src/features/google-reviews/types.ts` :

```ts
export type SyncSummary = {
  fetched: number
  created: number
  updated: number
  deleted: number
}

export type AdminGoogleReviewDto = {
  id: string
  google_review_id: string
  author: string
  author_photo_url: string | null
  rating: number
  comment: string | null
  owner_reply: string | null
  google_created_at: string
  published_destination_ids: string[]
}

export type AdminGoogleReviewsData = {
  reviews: AdminGoogleReviewDto[]
  destinations: { id: string; name: string }[]
  lastSyncedAt: string | null
  configured: boolean
}
```

`src/features/google-reviews/services/sync.ts` :

```ts
import type { NormalizedGoogleReview } from '@/shared/lib/google-business'
import type { SyncSummary } from '../types'

export type StoredGoogleReview = NormalizedGoogleReview & { deleted_at: Date | null }

export type GoogleReviewStore = {
  listAll(): Promise<StoredGoogleReview[]>
  create(review: NormalizedGoogleReview, syncedAt: Date): Promise<void>
  update(review: NormalizedGoogleReview, syncedAt: Date): Promise<void>
  markSynced(googleReviewIds: string[], syncedAt: Date): Promise<void>
  softDelete(googleReviewIds: string[], deletedAt: Date): Promise<void>
}

function sameContent(stored: StoredGoogleReview, fetched: NormalizedGoogleReview): boolean {
  return stored.deleted_at === null
    && stored.author === fetched.author
    && stored.author_photo_url === fetched.author_photo_url
    && stored.rating === fetched.rating
    && stored.comment === fetched.comment
    && stored.owner_reply === fetched.owner_reply
    && stored.google_updated_at.getTime() === fetched.google_updated_at.getTime()
}

/**
 * Spec 062 AC-01-03 à AC-01-05 : Google d'abord (aucune écriture si l'appel échoue),
 * puis création / mise à jour par google_review_id et soft delete des avis disparus.
 */
export async function syncGoogleReviews({ fetchReviews, store, now = () => new Date() }: {
  fetchReviews: () => Promise<NormalizedGoogleReview[]>
  store: GoogleReviewStore
  now?: () => Date
}): Promise<SyncSummary> {
  const fetched = await fetchReviews()
  const syncedAt = now()
  const existing = new Map((await store.listAll()).map(review => [review.google_review_id, review]))
  let created = 0
  let updated = 0

  for (const review of fetched) {
    const stored = existing.get(review.google_review_id)
    if (!stored) {
      await store.create(review, syncedAt)
      created += 1
    } else if (!sameContent(stored, review)) {
      await store.update(review, syncedAt)
      updated += 1
    }
  }
  await store.markSynced(fetched.map(review => review.google_review_id), syncedAt)

  const fetchedIds = new Set(fetched.map(review => review.google_review_id))
  const missing = [...existing.values()]
    .filter(review => review.deleted_at === null && !fetchedIds.has(review.google_review_id))
    .map(review => review.google_review_id)
  // Garde-fou : une réponse vide signale plus probablement une mauvaise configuration qu'une fiche vidée.
  const deletable = fetched.length === 0 ? [] : missing
  if (deletable.length > 0) await store.softDelete(deletable, syncedAt)

  return { fetched: fetched.length, created, updated, deleted: deletable.length }
}
```

- [ ] **Step 4: Lancer → succès**

Run: `npx jest tests/unit/google-reviews.AC-01-03-05.sync.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Test d'intégration du store Prisma (qui échoue)**

`tests/integration/google-reviews.AC-01-04.AC-02-04.prisma-store.test.ts` :

```ts
const db = {
  googleBusinessReview: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  localLandingReview: { updateMany: jest.fn() },
}
const mockTransaction = jest.fn(async (callback: (tx: typeof db) => Promise<unknown>) => callback(db))
jest.mock('@/shared/lib/prisma', () => ({ prisma: { ...db, $transaction: (callback: (tx: typeof db) => Promise<unknown>) => mockTransaction(callback) } }))

import { prismaGoogleReviewStore } from '@/features/google-reviews/queries/store'

const syncedAt = new Date('2026-10-05T05:45:00Z')
const item = {
  google_review_id: 'accounts/1/locations/2/reviews/a', author: 'Julie', author_photo_url: null, rating: 4,
  comment: 'Très bien.', owner_reply: null,
  google_created_at: new Date('2026-09-01T10:00:00Z'), google_updated_at: new Date('2026-10-01T10:00:00Z'),
}

beforeEach(() => jest.clearAllMocks())

describe('062 prisma store', () => {
  it('AC-02-04 — update rewrites the review and the quote / rating of its publications', async () => {
    await prismaGoogleReviewStore.update(item, syncedAt)
    expect(db.googleBusinessReview.update).toHaveBeenCalledWith({
      where: { google_review_id: item.google_review_id },
      data: { ...item, deleted_at: null, last_synced_at: syncedAt },
    })
    expect(db.localLandingReview.updateMany).toHaveBeenCalledWith({
      where: { google_review_id: item.google_review_id },
      data: { quote: 'Très bien.', rating: 4, author: 'Julie' },
    })
  })

  it('AC-02-04 — a review that lost its text unpublishes its publications', async () => {
    await prismaGoogleReviewStore.update({ ...item, comment: null }, syncedAt)
    expect(db.localLandingReview.updateMany).toHaveBeenCalledWith({
      where: { google_review_id: item.google_review_id },
      data: { is_active: false, rating: 4, author: 'Julie' },
    })
  })

  it('AC-01-04 — softDelete marks reviews deleted and deactivates their publications', async () => {
    await prismaGoogleReviewStore.softDelete([item.google_review_id], syncedAt)
    expect(db.googleBusinessReview.updateMany).toHaveBeenCalledWith({
      where: { google_review_id: { in: [item.google_review_id] }, deleted_at: null },
      data: { deleted_at: syncedAt },
    })
    expect(db.localLandingReview.updateMany).toHaveBeenCalledWith({
      where: { google_review_id: { in: [item.google_review_id] } },
      data: { is_active: false },
    })
  })

  it('create stores last_synced_at and markSynced only touches last_synced_at', async () => {
    await prismaGoogleReviewStore.create(item, syncedAt)
    expect(db.googleBusinessReview.create).toHaveBeenCalledWith({ data: { ...item, last_synced_at: syncedAt } })
    await prismaGoogleReviewStore.markSynced([item.google_review_id], syncedAt)
    expect(db.googleBusinessReview.updateMany).toHaveBeenCalledWith({
      where: { google_review_id: { in: [item.google_review_id] } },
      data: { last_synced_at: syncedAt },
    })
  })
})
```

Run: `npx jest tests/integration/google-reviews.AC-01-04.AC-02-04.prisma-store.test.ts`
Expected: FAIL — module `@/features/google-reviews/queries/store` introuvable.

- [ ] **Step 6: Implémenter `store.ts`**

```ts
import { prisma } from '@/shared/lib/prisma'
import type { GoogleReviewStore } from '../services/sync'

const storedSelect = {
  google_review_id: true, author: true, author_photo_url: true, rating: true, comment: true, owner_reply: true,
  google_created_at: true, google_updated_at: true, deleted_at: true,
} as const

export const prismaGoogleReviewStore: GoogleReviewStore = {
  listAll: () => prisma.googleBusinessReview.findMany({ select: storedSelect }),

  async create(review, syncedAt) {
    await prisma.googleBusinessReview.create({ data: { ...review, last_synced_at: syncedAt } })
  },

  async update(review, syncedAt) {
    await prisma.$transaction(async tx => {
      await tx.googleBusinessReview.update({
        where: { google_review_id: review.google_review_id },
        data: { ...review, deleted_at: null, last_synced_at: syncedAt },
      })
      // Spec 062 AC-02-04 : les publications suivent le texte Google ; sans texte, elles sont retirées.
      await tx.localLandingReview.updateMany({
        where: { google_review_id: review.google_review_id },
        data: review.comment
          ? { quote: review.comment, rating: review.rating, author: review.author }
          : { is_active: false, rating: review.rating, author: review.author },
      })
    })
  },

  async markSynced(googleReviewIds, syncedAt) {
    if (googleReviewIds.length === 0) return
    await prisma.googleBusinessReview.updateMany({
      where: { google_review_id: { in: googleReviewIds } },
      data: { last_synced_at: syncedAt },
    })
  },

  async softDelete(googleReviewIds, deletedAt) {
    await prisma.$transaction(async tx => {
      await tx.googleBusinessReview.updateMany({
        where: { google_review_id: { in: googleReviewIds }, deleted_at: null },
        data: { deleted_at: deletedAt },
      })
      await tx.localLandingReview.updateMany({
        where: { google_review_id: { in: googleReviewIds } },
        data: { is_active: false },
      })
    })
  },
}
```

- [ ] **Step 7: Lancer → succès**

Run: `npx jest tests/unit/google-reviews.AC-01-03-05.sync.test.ts tests/integration/google-reviews.AC-01-04.AC-02-04.prisma-store.test.ts && npx eslint src/features/google-reviews`
Expected: PASS, lint propre.

- [ ] **Step 8: Commit**

```bash
git add src/features/google-reviews tests/unit/google-reviews.AC-01-03-05.sync.test.ts tests/integration/google-reviews.AC-01-04.AC-02-04.prisma-store.test.ts
git commit -m "feat(google-reviews): synchronisation idempotente et store Prisma (spec 062 AC-01-03..05, AC-02-04)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Routes de synchronisation (cron + admin) et `vercel.json`

**Files:**
- Create: `src/features/google-reviews/services/run-sync.ts`
- Create: `src/app/api/internal/google-reviews/sync/route.ts`
- Create: `src/app/api/admin/google-reviews/sync/route.ts`
- Modify: `vercel.json` (tableau `crons`)
- Test: `tests/contract/google-reviews.AC-01-06.AC-02-05.sync-routes.test.ts`

**Interfaces:**
- Consumes: `googleBusinessConfigFromEnv`, `fetchAllGoogleReviews`, `GoogleBusinessError` (Task 2) ; `syncGoogleReviews`, `prismaGoogleReviewStore` (Task 3) ; `SyncSummary`.
- Produces: `runGoogleReviewsSync(): Promise<SyncSummary>`, `syncErrorResponse(error: unknown): NextResponse` dans `run-sync.ts`.

- [ ] **Step 1: Test de contrat qui échoue**

```ts
import { NextRequest } from 'next/server'

const mockRun = jest.fn()
const mockGetSessionAdmin = jest.fn()
jest.mock('@/features/google-reviews/services/run-sync', () => {
  const actual = jest.requireActual('@/features/google-reviews/services/run-sync')
  return { ...actual, runGoogleReviewsSync: () => mockRun() }
})
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockGetSessionAdmin() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

import { GoogleBusinessError } from '@/shared/lib/google-business'
import { GET as cronSync } from '@/app/api/internal/google-reviews/sync/route'
import { POST as adminSync } from '@/app/api/admin/google-reviews/sync/route'

const summary = { fetched: 12, created: 2, updated: 1, deleted: 0 }
const cron = (authorization?: string) => new NextRequest('http://localhost/api/internal/google-reviews/sync', {
  headers: authorization ? { authorization } : {},
})

beforeEach(() => {
  jest.clearAllMocks()
  process.env.INTERNAL_API_SECRET = 'internal-secret'
})

describe('062 AC-01-06 — cron', () => {
  it.each([undefined, 'Bearer wrong'])('rejects %s with 401 UNAUTHORIZED without syncing', async authorization => {
    const response = await cronSync(cron(authorization))
    expect(response.status).toBe(401)
    expect((await response.json()).error.code).toBe('UNAUTHORIZED')
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('returns the sync summary with the right secret', async () => {
    mockRun.mockResolvedValue(summary)
    const response = await cronSync(cron('Bearer internal-secret'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(summary)
  })

  it.each([
    ['GOOGLE_NOT_CONFIGURED', 503],
    ['GOOGLE_API_ERROR', 502],
  ] as const)('maps %s to %s with the structured error body', async (code, status) => {
    mockRun.mockRejectedValue(new GoogleBusinessError(code, 'message'))
    const response = await cronSync(cron('Bearer internal-secret'))
    expect(response.status).toBe(status)
    expect(await response.json()).toEqual({ error: { code, message: 'message', details: {} } })
  })
})

describe('062 AC-02-05 / AC-02-06 — synchro manuelle admin', () => {
  it('preserves admin authentication errors', async () => {
    const error = Response.json({ error: { code: 'FORBIDDEN', message: 'Accès refusé', details: {} } }, { status: 403 })
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })
    expect((await adminSync()).status).toBe(403)
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('runs the same sync and returns its summary', async () => {
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin' }, error: null })
    mockRun.mockResolvedValue(summary)
    const response = await adminSync()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(summary)
  })
})
```

- [ ] **Step 2: Lancer → échec**

Run: `npx jest tests/contract/google-reviews.AC-01-06.AC-02-05.sync-routes.test.ts`
Expected: FAIL — modules introuvables.

- [ ] **Step 3: Implémenter**

`src/features/google-reviews/services/run-sync.ts` :

```ts
import { revalidatePath } from 'next/cache'
import type { NextResponse } from 'next/server'
import { apiError } from '@/features/merchant/lib/responses'
import { fetchAllGoogleReviews, GoogleBusinessError, googleBusinessConfigFromEnv } from '@/shared/lib/google-business'
import { prismaGoogleReviewStore } from '../queries/store'
import type { SyncSummary } from '../types'
import { syncGoogleReviews } from './sync'

export async function runGoogleReviewsSync(): Promise<SyncSummary> {
  const config = googleBusinessConfigFromEnv()
  if (!config) {
    throw new GoogleBusinessError('GOOGLE_NOT_CONFIGURED', 'Connexion Google Business Profile non configurée.')
  }
  const summary = await syncGoogleReviews({
    fetchReviews: () => fetchAllGoogleReviews(config),
    store: prismaGoogleReviewStore,
  })
  // Les avis publiés s'affichent sur les landings conciergerie.
  if (summary.updated > 0 || summary.deleted > 0) revalidatePath('/conciergerie/[city-slug]', 'page')
  return summary
}

export function syncErrorResponse(error: unknown): NextResponse {
  if (error instanceof GoogleBusinessError) {
    return apiError(error.code, error.message, error.code === 'GOOGLE_NOT_CONFIGURED' ? 503 : 502)
  }
  return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
}
```

`src/app/api/internal/google-reviews/sync/route.ts` :

```ts
import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/features/merchant/lib/responses'
import { runGoogleReviewsSync, syncErrorResponse } from '@/features/google-reviews/services/run-sync'

export const maxDuration = 60

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return header === `Bearer ${secret}`
}

/** Spec 062 AC-01-06 : synchronisation quotidienne des avis Google Business Profile. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) return apiError('UNAUTHORIZED', 'Accès réservé à la tâche planifiée', 401)
  try {
    return NextResponse.json(await runGoogleReviewsSync())
  } catch (error) {
    return syncErrorResponse(error)
  }
}
```

`src/app/api/admin/google-reviews/sync/route.ts` :

```ts
import { NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { runGoogleReviewsSync, syncErrorResponse } from '@/features/google-reviews/services/run-sync'

export const maxDuration = 60

/** Spec 062 AC-02-05 : « Synchroniser maintenant » depuis l'admin. */
export async function POST(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  try {
    return NextResponse.json(await runGoogleReviewsSync())
  } catch (error) {
    return syncErrorResponse(error)
  }
}
```

`vercel.json` — ajouter en fin de `crons` (après `translations/sync`) :

```json
    {
      "path": "/api/internal/google-reviews/sync",
      "schedule": "45 5 * * *"
    }
```

- [ ] **Step 4: Lancer → succès**

Run: `npx jest tests/contract/google-reviews.AC-01-06.AC-02-05.sync-routes.test.ts && node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))" && npx eslint src/features/google-reviews src/app/api/internal/google-reviews src/app/api/admin/google-reviews`
Expected: PASS (8 tests), JSON valide, lint propre.

- [ ] **Step 5: Commit**

```bash
git add src/features/google-reviews/services/run-sync.ts src/app/api/internal/google-reviews src/app/api/admin/google-reviews/sync vercel.json tests/contract/google-reviews.AC-01-06.AC-02-05.sync-routes.test.ts
git commit -m "feat(google-reviews): cron quotidien et synchro manuelle admin (spec 062 AC-01-06, AC-02-05)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Publication d'un avis sur des destinations

**Files:**
- Create: `src/features/google-reviews/schemas.ts`
- Create: `src/features/google-reviews/queries/publications.ts`
- Create: `src/app/api/admin/google-reviews/[id]/publications/route.ts`
- Test: `tests/integration/google-reviews.AC-02-03.publications.test.ts`
- Test: `tests/contract/google-reviews.AC-02-03.AC-02-06.publications-route.test.ts`

**Interfaces:**
- Produces:
  - `schemas.ts` : `GoogleReviewIdSchema = z.string().uuid()`, `PublicationsInputSchema = z.object({ destination_ids: z.array(z.string().uuid()).max(50) }).strict()`
  - `publications.ts` : `class GoogleReviewPublicationError extends Error { code: 'REVIEW_NOT_FOUND' | 'DESTINATION_NOT_FOUND' | 'REVIEW_HAS_NO_TEXT'; status: 404 | 422 }`, `setGoogleReviewPublications(reviewId: string, destinationIds: string[]): Promise<{ google_review_id: string; published_destination_ids: string[] }>`, `frenchStayDate(date: Date): string`

- [ ] **Step 1: Test d'intégration qui échoue**

```ts
const db = {
  googleBusinessReview: { findFirst: jest.fn() },
  localLandingDestination: { findMany: jest.fn() },
  localLandingReview: { updateMany: jest.fn(), upsert: jest.fn() },
}
jest.mock('@/shared/lib/prisma', () => ({ prisma: {
  $transaction: (callback: (tx: typeof db) => Promise<unknown>) => callback(db),
} }))

import {
  frenchStayDate, GoogleReviewPublicationError, setGoogleReviewPublications,
} from '@/features/google-reviews/queries/publications'

const REVIEW_ID = '7b0c6c1e-1f51-4f43-9b3b-2a8f8f3b9d10'
const SG = '0d1f6f9e-5a3c-4c47-8a1e-3a4b5c6d7e8f'
const SN = '1e2f3a4b-5c6d-4e7f-8a9b-0c1d2e3f4a5b'
const review = {
  id: REVIEW_ID, google_review_id: 'accounts/1/locations/2/reviews/a', author: 'Julie', rating: 5,
  comment: 'Séjour parfait.', google_created_at: new Date('2026-10-02T10:00:00Z'),
}

beforeEach(() => {
  jest.clearAllMocks()
  db.googleBusinessReview.findFirst.mockResolvedValue(review)
  db.localLandingDestination.findMany.mockResolvedValue([
    { id: SG, city: { slug: 'saint-gervais-les-bains' } }, { id: SN, city: { slug: 'saint-nicolas-de-veroce' } },
  ])
})

describe('062 AC-02-03 — publier / dépublier', () => {
  it('upserts one active publication per checked destination and deactivates the others', async () => {
    const result = await setGoogleReviewPublications(REVIEW_ID, [SG, SN])

    expect(result).toEqual({ google_review_id: review.google_review_id, published_destination_ids: [SG, SN] })
    expect(db.localLandingReview.updateMany).toHaveBeenCalledWith({
      where: { google_review_id: review.google_review_id, destination_id: { notIn: [SG, SN] }, is_active: true },
      data: { is_active: false },
    })
    expect(db.localLandingReview.upsert).toHaveBeenCalledWith({
      where: { destination_id_google_review_id: { destination_id: SG, google_review_id: review.google_review_id } },
      create: {
        destination_id: SG, destination_slug: 'saint-gervais-les-bains', google_review_id: review.google_review_id,
        source: 'GOOGLE', author: 'Julie', quote: 'Séjour parfait.', rating: 5, stay_date: 'octobre 2026',
        sort_order: 0, is_active: true, deleted_with_destination: false,
      },
      update: {
        destination_slug: 'saint-gervais-les-bains', author: 'Julie', quote: 'Séjour parfait.', rating: 5,
        stay_date: 'octobre 2026', is_active: true, deleted_at: null,
      },
    })
    expect(db.localLandingReview.upsert).toHaveBeenCalledTimes(2)
  })

  it('an empty set unpublishes everywhere without upsert', async () => {
    expect(await setGoogleReviewPublications(REVIEW_ID, [])).toEqual({ google_review_id: review.google_review_id, published_destination_ids: [] })
    expect(db.localLandingReview.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { is_active: false } }))
    expect(db.localLandingReview.upsert).not.toHaveBeenCalled()
  })

  // Review Focus 5
  it('deduplicates destination ids so a double submit never creates two publications', async () => {
    await setGoogleReviewPublications(REVIEW_ID, [SG, SG])
    expect(db.localLandingReview.upsert).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['REVIEW_NOT_FOUND', 404, () => db.googleBusinessReview.findFirst.mockResolvedValue(null), [SG]],
    ['REVIEW_HAS_NO_TEXT', 422, () => db.googleBusinessReview.findFirst.mockResolvedValue({ ...review, comment: null }), [SG]],
    ['DESTINATION_NOT_FOUND', 404, () => db.localLandingDestination.findMany.mockResolvedValue([]), [SG]],
  ] as const)('rejects with %s (%s) and writes nothing', async (code, status, arrange, ids) => {
    arrange()
    await expect(setGoogleReviewPublications(REVIEW_ID, [...ids])).rejects.toEqual(new GoogleReviewPublicationError(code, status))
    expect(db.localLandingReview.upsert).not.toHaveBeenCalled()
    expect(db.localLandingReview.updateMany).not.toHaveBeenCalled()
  })

  it('formats the stay date in French in the Paris time zone', () => {
    expect(frenchStayDate(new Date('2026-10-31T23:30:00Z'))).toBe('novembre 2026')
  })
})
```

Run: `npx jest tests/integration/google-reviews.AC-02-03.publications.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 2: Implémenter `schemas.ts` et `publications.ts`**

`src/features/google-reviews/schemas.ts` :

```ts
import { z } from 'zod'

export const GoogleReviewIdSchema = z.string().uuid()

export const PublicationsInputSchema = z.object({
  destination_ids: z.array(z.string().uuid()).max(50),
}).strict()
```

`src/features/google-reviews/queries/publications.ts` :

```ts
import { prisma } from '@/shared/lib/prisma'

export class GoogleReviewPublicationError extends Error {
  constructor(
    public readonly code: 'REVIEW_NOT_FOUND' | 'DESTINATION_NOT_FOUND' | 'REVIEW_HAS_NO_TEXT',
    public readonly status: 404 | 422,
  ) {
    super(code)
    this.name = 'GoogleReviewPublicationError'
  }
}

const stayDateFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })

export function frenchStayDate(date: Date): string {
  return stayDateFormat.format(date)
}

/** Spec 062 AC-02-03 : l'ensemble envoyé devient l'ensemble exact des destinations publiées. */
export async function setGoogleReviewPublications(
  reviewId: string,
  destinationIds: string[],
): Promise<{ google_review_id: string; published_destination_ids: string[] }> {
  const ids = [...new Set(destinationIds)]
  return prisma.$transaction(async tx => {
    const review = await tx.googleBusinessReview.findFirst({
      where: { id: reviewId, deleted_at: null },
      select: { google_review_id: true, author: true, rating: true, comment: true, google_created_at: true },
    })
    if (!review) throw new GoogleReviewPublicationError('REVIEW_NOT_FOUND', 404)
    if (ids.length > 0 && !review.comment) throw new GoogleReviewPublicationError('REVIEW_HAS_NO_TEXT', 422)

    const destinations = ids.length === 0 ? [] : await tx.localLandingDestination.findMany({
      where: { id: { in: ids }, is_active: true, deleted_at: null, city: { is_active: true, deleted_at: null } },
      select: { id: true, city: { select: { slug: true } } },
    })
    if (destinations.length !== ids.length) throw new GoogleReviewPublicationError('DESTINATION_NOT_FOUND', 404)

    await tx.localLandingReview.updateMany({
      where: { google_review_id: review.google_review_id, destination_id: { notIn: ids }, is_active: true },
      data: { is_active: false },
    })
    const content = {
      author: review.author,
      quote: review.comment ?? '',
      rating: review.rating,
      stay_date: frenchStayDate(review.google_created_at),
    }
    for (const destination of destinations) {
      await tx.localLandingReview.upsert({
        where: { destination_id_google_review_id: { destination_id: destination.id, google_review_id: review.google_review_id } },
        create: {
          destination_id: destination.id,
          destination_slug: destination.city.slug,
          google_review_id: review.google_review_id,
          source: 'GOOGLE',
          ...content,
          sort_order: 0,
          is_active: true,
          deleted_with_destination: false,
        },
        update: { destination_slug: destination.city.slug, ...content, is_active: true, deleted_at: null },
      })
    }
    return { google_review_id: review.google_review_id, published_destination_ids: ids }
  })
}
```

Note : l'objet `create` attendu par le test liste les clés dans l'ordre `destination_id, destination_slug, google_review_id, source, author, quote, rating, stay_date, sort_order, is_active, deleted_with_destination` ; `toHaveBeenCalledWith` ignore l'ordre des clés.

Run: `npx jest tests/integration/google-reviews.AC-02-03.publications.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 3: Test de contrat de la route (qui échoue)**

```ts
import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockSet = jest.fn()
const mockRevalidatePath = jest.fn()
jest.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }))
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockGetSessionAdmin() }))
jest.mock('@/features/google-reviews/queries/publications', () => {
  const actual = jest.requireActual('@/features/google-reviews/queries/publications')
  return { ...actual, setGoogleReviewPublications: (...args: unknown[]) => mockSet(...args) }
})

import { GoogleReviewPublicationError } from '@/features/google-reviews/queries/publications'
import { PUT } from '@/app/api/admin/google-reviews/[id]/publications/route'

const ID = '7b0c6c1e-1f51-4f43-9b3b-2a8f8f3b9d10'
const SG = '0d1f6f9e-5a3c-4c47-8a1e-3a4b5c6d7e8f'
const put = (body: string, id = ID) => PUT(
  new NextRequest(`http://localhost/api/admin/google-reviews/${id}/publications`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body,
  }),
  { params: Promise.resolve({ id }) },
)

beforeEach(() => {
  jest.clearAllMocks()
  mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin' }, error: null })
})

describe('062 AC-02-03 / AC-02-06 — PUT publications', () => {
  it('AC-02-06 preserves admin authentication errors', async () => {
    const error = Response.json({ error: { code: 'FORBIDDEN', message: 'Accès refusé', details: {} } }, { status: 403 })
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })
    expect((await put(JSON.stringify({ destination_ids: [SG] }))).status).toBe(403)
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('sets publications, revalidates concierge landings and returns the contract body', async () => {
    mockSet.mockResolvedValue({ google_review_id: 'accounts/1/locations/2/reviews/a', published_destination_ids: [SG] })
    const response = await put(JSON.stringify({ destination_ids: [SG] }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ google_review_id: 'accounts/1/locations/2/reviews/a', published_destination_ids: [SG] })
    expect(mockSet).toHaveBeenCalledWith(ID, [SG])
    expect(mockRevalidatePath).toHaveBeenCalledWith('/conciergerie/[city-slug]', 'page')
  })

  it.each([
    ['{broken', ID],
    [JSON.stringify({ destination_ids: ['not-a-uuid'] }), ID],
    [JSON.stringify({ destination_ids: [SG], extra: true }), ID],
    [JSON.stringify({ destination_ids: [SG] }), 'not-a-uuid'],
  ])('returns 400 VALIDATION_ERROR for %s', async (body, id) => {
    const response = await put(body, id)
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR')
    expect(mockSet).not.toHaveBeenCalled()
  })

  it.each([
    ['REVIEW_NOT_FOUND', 404],
    ['DESTINATION_NOT_FOUND', 404],
    ['REVIEW_HAS_NO_TEXT', 422],
  ] as const)('maps %s to %s', async (code, status) => {
    mockSet.mockRejectedValue(new GoogleReviewPublicationError(code, status))
    const response = await put(JSON.stringify({ destination_ids: [SG] }))
    expect(response.status).toBe(status)
    expect((await response.json()).error.code).toBe(code)
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
```

Run: `npx jest tests/contract/google-reviews.AC-02-03.AC-02-06.publications-route.test.ts`
Expected: FAIL — route introuvable.

- [ ] **Step 4: Implémenter la route**

`src/app/api/admin/google-reviews/[id]/publications/route.ts` :

```ts
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { GoogleReviewIdSchema, PublicationsInputSchema } from '@/features/google-reviews/schemas'
import { GoogleReviewPublicationError, setGoogleReviewPublications } from '@/features/google-reviews/queries/publications'

type Context = { params: Promise<{ id: string }> }

const MESSAGES = {
  REVIEW_NOT_FOUND: 'Avis Google introuvable.',
  DESTINATION_NOT_FOUND: 'Destination indisponible.',
  REVIEW_HAS_NO_TEXT: 'Un avis sans commentaire ne peut pas être publié.',
} as const

/** Spec 062 AC-02-03 : définit l'ensemble des destinations où l'avis est publié. */
export async function PUT(request: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const { id } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR', 'Corps JSON invalide.', 400)
  }
  const parsedId = GoogleReviewIdSchema.safeParse(id)
  const parsedBody = PublicationsInputSchema.safeParse(body)
  if (!parsedId.success || !parsedBody.success) {
    return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, parsedBody.success ? {} : parsedBody.error.flatten())
  }
  try {
    const result = await setGoogleReviewPublications(parsedId.data, parsedBody.data.destination_ids)
    revalidatePath('/conciergerie/[city-slug]', 'page')
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof GoogleReviewPublicationError) return apiError(error.code, MESSAGES[error.code], error.status)
    return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
  }
}
```

- [ ] **Step 5: Lancer → succès**

Run: `npx jest tests/integration/google-reviews.AC-02-03.publications.test.ts tests/contract/google-reviews.AC-02-03.AC-02-06.publications-route.test.ts && npx eslint src/features/google-reviews "src/app/api/admin/google-reviews"`
Expected: PASS, lint propre.

- [ ] **Step 6: Commit**

```bash
git add src/features/google-reviews/schemas.ts src/features/google-reviews/queries/publications.ts "src/app/api/admin/google-reviews/[id]" tests/integration/google-reviews.AC-02-03.publications.test.ts tests/contract/google-reviews.AC-02-03.AC-02-06.publications-route.test.ts
git commit -m "feat(google-reviews): publication d'un avis sur les destinations choisies (spec 062 AC-02-03, AC-02-06)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Page admin « Avis Google »

**Files:**
- Create: `src/features/google-reviews/queries/admin.ts`
- Create: `src/features/google-reviews/components/AdminGoogleReviews.tsx`
- Create: `src/app/admin/google-reviews/page.tsx`
- Modify: `src/app/admin/layout.tsx` (`NAV_ITEMS`, après `landing-pages` ; import d'icône `MessageSquareQuote`)
- Test: `tests/integration/google-reviews.AC-02-01-02.admin-page.test.tsx`
- Test: `tests/integration/google-reviews.AC-03-02.public-reviews-filter.test.ts`

**Interfaces:**
- Consumes: `AdminGoogleReviewsData`, `AdminGoogleReviewDto`, `SyncSummary` (Task 3) ; routes des Tasks 4 et 5 ; `googleBusinessConfigFromEnv` (Task 2).
- Produces: `getAdminGoogleReviews(): Promise<AdminGoogleReviewsData>`, `<AdminGoogleReviews initialData={AdminGoogleReviewsData} />`.

- [ ] **Step 1: Test UI qui échoue**

```tsx
/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AdminGoogleReviews } from '@/features/google-reviews/components/AdminGoogleReviews'
import type { AdminGoogleReviewsData } from '@/features/google-reviews/types'

const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
const fetchMock = jest.fn()
const reply = (body: unknown, status = 200) => fetchMock.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body })

const SG = '0d1f6f9e-5a3c-4c47-8a1e-3a4b5c6d7e8f'
const SN = '1e2f3a4b-5c6d-4e7f-8a9b-0c1d2e3f4a5b'
const data = (overrides: Partial<AdminGoogleReviewsData> = {}): AdminGoogleReviewsData => ({
  configured: true,
  lastSyncedAt: '2026-10-05T05:45:00.000Z',
  destinations: [{ id: SG, name: 'Saint-Gervais-les-Bains' }, { id: SN, name: 'Saint-Nicolas-de-Véroce' }],
  reviews: [
    { id: 'r-old', google_review_id: 'g/old', author: 'Paul', author_photo_url: null, rating: 3, comment: 'Correct.', owner_reply: null, google_created_at: '2026-08-01T10:00:00.000Z', published_destination_ids: [] },
    { id: 'r-new', google_review_id: 'g/new', author: 'Julie', author_photo_url: null, rating: 5, comment: 'Parfait.', owner_reply: 'Merci Julie !', google_created_at: '2026-10-01T10:00:00.000Z', published_destination_ids: [SG] },
    { id: 'r-empty', google_review_id: 'g/empty', author: 'Léa', author_photo_url: null, rating: 4, comment: null, owner_reply: null, google_created_at: '2026-09-01T10:00:00.000Z', published_destination_ids: [] },
  ],
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = fetchMock
})

describe('062 AC-02-01 — liste admin', () => {
  it('lists reviews newest first with rating, text, owner reply and one checkbox per destination', () => {
    render(<AdminGoogleReviews initialData={data()} />)
    const cards = screen.getAllByRole('article')
    expect(cards.map(card => within(card).getByRole('heading').textContent)).toEqual(['Julie', 'Léa', 'Paul'])
    expect(within(cards[0]).getByLabelText('5 étoiles sur 5')).toBeInTheDocument()
    expect(within(cards[0]).getByText('Merci Julie !')).toBeInTheDocument()
    expect(within(cards[0]).getByRole('checkbox', { name: 'Publié sur Saint-Gervais-les-Bains' })).toBeChecked()
    expect(within(cards[0]).getByRole('checkbox', { name: 'Publié sur Saint-Nicolas-de-Véroce' })).not.toBeChecked()
  })

  it('filters by rating', () => {
    render(<AdminGoogleReviews initialData={data()} />)
    fireEvent.click(screen.getByRole('button', { name: '5★' }))
    expect(screen.getAllByRole('article')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '3★ et moins' }))
    expect(within(screen.getByRole('article')).getByRole('heading')).toHaveTextContent('Paul')
    fireEvent.click(screen.getByRole('button', { name: 'Toutes' }))
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('AC-02-02 shows « Note sans commentaire » and disables publication for reviews without text', () => {
    render(<AdminGoogleReviews initialData={data()} />)
    const lea = screen.getAllByRole('article')[1]
    expect(within(lea).getByText('Note sans commentaire')).toBeInTheDocument()
    within(lea).getAllByRole('checkbox').forEach(checkbox => expect(checkbox).toBeDisabled())
  })

  it('sends the full set of checked destinations when a box changes', async () => {
    reply({ google_review_id: 'g/new', published_destination_ids: [SG, SN] })
    render(<AdminGoogleReviews initialData={data()} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Publié sur Saint-Nicolas-de-Véroce' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/google-reviews/r-new/publications', expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ destination_ids: [SG, SN] }),
    })))
    expect(screen.getAllByRole('checkbox', { name: 'Publié sur Saint-Nicolas-de-Véroce' })[0]).toBeChecked()
  })

  it('restores the previous state and shows the error when publication fails', async () => {
    reply({ error: { code: 'DESTINATION_NOT_FOUND', message: 'Destination indisponible.', details: {} } }, 404)
    render(<AdminGoogleReviews initialData={data()} />)
    const box = screen.getAllByRole('checkbox', { name: 'Publié sur Saint-Nicolas-de-Véroce' })[0]
    fireEvent.click(box)
    expect(await screen.findByRole('status')).toHaveTextContent('Destination indisponible.')
    expect(box).not.toBeChecked()
  })
})

describe('062 AC-02-05 — synchro manuelle et états', () => {
  it('runs the sync, shows the summary and refreshes the page', async () => {
    reply({ fetched: 12, created: 2, updated: 1, deleted: 0 })
    render(<AdminGoogleReviews initialData={data()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Synchroniser maintenant' }))
    expect(await screen.findByRole('status')).toHaveTextContent('12 avis lus · 2 nouveaux · 1 mis à jour · 0 retiré')
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/google-reviews/sync', { method: 'POST' })
    expect(refresh).toHaveBeenCalled()
  })

  it('shows the empty state', () => {
    render(<AdminGoogleReviews initialData={data({ reviews: [] })} />)
    expect(screen.getByText('Aucun avis importé. Lancez une synchronisation.')).toBeInTheDocument()
  })

  it('shows the not-configured banner and disables the sync button', () => {
    render(<AdminGoogleReviews initialData={data({ configured: false })} />)
    expect(screen.getByText('Connexion Google non configurée')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Synchroniser maintenant' })).toBeDisabled()
  })
})
```

Run: `npx jest tests/integration/google-reviews.AC-02-01-02.admin-page.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 2: Implémenter le composant**

`src/features/google-reviews/components/AdminGoogleReviews.tsx` :

```tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Star } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { AdminGoogleReviewDto, AdminGoogleReviewsData, SyncSummary } from '../types'

const FILTERS = [
  { label: 'Toutes', match: () => true },
  { label: '5★', match: (rating: number) => rating === 5 },
  { label: '4★', match: (rating: number) => rating === 4 },
  { label: '3★ et moins', match: (rating: number) => rating <= 3 },
] as const

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' })
const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' })

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count > 1 ? pluralForm : singular}`
}

function summaryMessage(summary: SyncSummary): string {
  return [
    plural(summary.fetched, 'avis lu', 'avis lus'),
    plural(summary.created, 'nouveau', 'nouveaux'),
    plural(summary.updated, 'mis à jour', 'mis à jour'),
    plural(summary.deleted, 'retiré', 'retirés'),
  ].join(' · ')
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body: unknown = await response.json().catch(() => null)
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const error = (body as { error?: { message?: unknown } }).error
    if (typeof error?.message === 'string') return error.message
  }
  return fallback
}

export function AdminGoogleReviews({ initialData }: { initialData: AdminGoogleReviewsData }) {
  const router = useRouter()
  const [reviews, setReviews] = useState<AdminGoogleReviewDto[]>(initialData.reviews)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['label']>('Toutes')
  const [syncing, setSyncing] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const visible = useMemo(() => {
    const active = FILTERS.find(item => item.label === filter) ?? FILTERS[0]
    return [...reviews]
      .filter(review => active.match(review.rating))
      .sort((a, b) => b.google_created_at.localeCompare(a.google_created_at))
  }, [reviews, filter])

  async function sync() {
    setSyncing(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/google-reviews/sync', { method: 'POST' })
      if (!response.ok) {
        setMessage(await errorMessage(response, 'La synchronisation a échoué.'))
        return
      }
      setMessage(summaryMessage(await response.json() as SyncSummary))
      router.refresh()
    } catch {
      setMessage('La synchronisation a échoué.')
    } finally {
      setSyncing(false)
    }
  }

  async function toggle(review: AdminGoogleReviewDto, destinationId: string) {
    const previous = review.published_destination_ids
    const next = previous.includes(destinationId)
      ? previous.filter(id => id !== destinationId)
      : [...previous, destinationId]
    const apply = (ids: string[]) => setReviews(current => current.map(item => (
      item.id === review.id ? { ...item, published_destination_ids: ids } : item
    )))
    apply(next)
    setPendingId(review.id)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/google-reviews/${review.id}/publications`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ destination_ids: next }),
      })
      if (!response.ok) {
        apply(previous)
        setMessage(await errorMessage(response, 'La publication a échoué.'))
      }
    } catch {
      apply(previous)
      setMessage('La publication a échoué.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Avis Google</h1>
          <p className="mt-1 text-sm text-slate-500">
            {initialData.lastSyncedAt
              ? `Dernière synchronisation : ${dateTimeFormat.format(new Date(initialData.lastSyncedAt))}`
              : 'Jamais synchronisé'}
          </p>
        </div>
        <Button type="button" onClick={sync} disabled={syncing || !initialData.configured} className="flex items-center gap-2">
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          Synchroniser maintenant
        </Button>
      </header>

      {!initialData.configured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Connexion Google non configurée</p>
          <p className="mt-1">Renseignez GOOGLE_BUSINESS_CLIENT_ID, GOOGLE_BUSINESS_CLIENT_SECRET, GOOGLE_BUSINESS_REFRESH_TOKEN, GOOGLE_BUSINESS_ACCOUNT_ID et GOOGLE_BUSINESS_LOCATION_ID (voir scripts/google-business-auth.ts).</p>
        </div>
      )}

      {message && <p role="status" className="text-sm text-slate-700">{message}</p>}

      <div className="flex flex-wrap gap-2" aria-label="Filtrer par note">
        {FILTERS.map(item => (
          <Button
            key={item.label}
            type="button"
            variant={filter === item.label ? 'default' : 'outline'}
            size="sm"
            aria-pressed={filter === item.label}
            onClick={() => setFilter(item.label)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
          Aucun avis importé. Lancez une synchronisation.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(review => (
            <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {review.author_photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.author_photo_url} alt="" className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" />
                  )}
                  <div>
                    <h2 className="font-semibold text-slate-950">{review.author}</h2>
                    <p className="text-xs text-slate-500">{dateFormat.format(new Date(review.google_created_at))}</p>
                  </div>
                </div>
                <span aria-label={`${review.rating} étoiles sur 5`} className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                  <Star size={15} fill="currentColor" aria-hidden="true" />{review.rating}
                </span>
              </div>

              {review.comment
                ? <p className="mt-4 whitespace-pre-line text-[13px] leading-6 text-slate-600">{review.comment}</p>
                : <p className="mt-4 text-[13px] italic text-slate-400">Note sans commentaire</p>}

              {review.owner_reply && (
                <details className="mt-3 rounded-xl bg-slate-50 p-3 text-[13px] text-slate-600">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-700">Votre réponse</summary>
                  <p className="mt-2 whitespace-pre-line">{review.owner_reply}</p>
                </details>
              )}

              <fieldset className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4">
                <legend className="sr-only">Publication sur les landings</legend>
                {initialData.destinations.map(destination => (
                  <label key={destination.id} className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-pink-600"
                      checked={review.published_destination_ids.includes(destination.id)}
                      disabled={!review.comment || pendingId === review.id}
                      onChange={() => toggle(review, destination.id)}
                    />
                    Publié sur {destination.name}
                  </label>
                ))}
              </fieldset>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
```

Run: `npx jest tests/integration/google-reviews.AC-02-01-02.admin-page.test.tsx`
Expected: PASS (8 tests). Si `Button` n'accepte pas `variant="outline"` / `size="sm"`, lire `src/shared/components/ui/button.tsx` et utiliser les variantes qui y sont déclarées.

- [ ] **Step 3: Query admin, page et navigation**

`src/features/google-reviews/queries/admin.ts` :

```ts
import { prisma } from '@/shared/lib/prisma'
import { googleBusinessConfigFromEnv } from '@/shared/lib/google-business'
import type { AdminGoogleReviewsData } from '../types'

export async function getAdminGoogleReviews(): Promise<AdminGoogleReviewsData> {
  const [reviews, destinations, lastSync] = await Promise.all([
    prisma.googleBusinessReview.findMany({
      where: { deleted_at: null },
      orderBy: { google_created_at: 'desc' },
      select: {
        id: true, google_review_id: true, author: true, author_photo_url: true, rating: true,
        comment: true, owner_reply: true, google_created_at: true,
        publications: { where: { is_active: true, deleted_at: null }, select: { destination_id: true } },
      },
    }),
    prisma.localLandingDestination.findMany({
      where: { is_active: true, deleted_at: null, city: { is_active: true, deleted_at: null } },
      orderBy: { city: { name: 'asc' } },
      select: { id: true, city: { select: { name: true } } },
    }),
    prisma.googleBusinessReview.aggregate({ _max: { last_synced_at: true } }),
  ])
  return {
    configured: googleBusinessConfigFromEnv() !== null,
    lastSyncedAt: lastSync._max.last_synced_at?.toISOString() ?? null,
    destinations: destinations.map(destination => ({ id: destination.id, name: destination.city.name })),
    reviews: reviews.map(({ publications, google_created_at, ...review }) => ({
      ...review,
      google_created_at: google_created_at.toISOString(),
      published_destination_ids: publications.map(publication => publication.destination_id),
    })),
  }
}
```

`src/app/admin/google-reviews/page.tsx` :

```tsx
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { AdminGoogleReviews } from '@/features/google-reviews/components/AdminGoogleReviews'
import { getAdminGoogleReviews } from '@/features/google-reviews/queries/admin'

export const dynamic = 'force-dynamic'

export default async function AdminGoogleReviewsPage() {
  await getPageAdmin()
  return <AdminGoogleReviews initialData={await getAdminGoogleReviews()} />
}
```

`src/app/admin/layout.tsx` : ajouter `MessageSquareQuote` à l'import `lucide-react` et, juste après l'entrée `landing-pages` de `NAV_ITEMS` :

```ts
  { href: '/admin/google-reviews', label: 'Avis Google', icon: MessageSquareQuote },
```

- [ ] **Step 4: Test AC-03-02 (affichage public filtré) qui doit passer d'emblée**

`tests/integration/google-reviews.AC-03-02.public-reviews-filter.test.ts` — verrouille que la query publique existante exclut les publications inactives (ce que font la dépublication et le soft delete Google) :

```ts
const findMany = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: { localLandingReview: { findMany: (...args: unknown[]) => findMany(...args) } } }))

import { listPublicLandingReviews } from '@/features/local-seo/queries/landing-reviews'

it('062 AC-03-02 — only active, non-deleted publications reach the landing and keep their GOOGLE source', async () => {
  findMany.mockResolvedValue([{ id: 'p', quote: 'Parfait.', author: 'Julie', stay_date: 'octobre 2026', source: 'GOOGLE', rating: 5 }])
  const reviews = await listPublicLandingReviews('saint-gervais-les-bains')
  expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ deleted_at: null, is_active: true, deleted_with_destination: false }),
  }))
  expect(reviews).toEqual([{ id: 'p', quote: 'Parfait.', author: 'Julie', stayDate: 'octobre 2026', source: 'GOOGLE', rating: 5 }])
})
```

Run: `npx jest tests/integration/google-reviews.AC-02-01-02.admin-page.test.tsx tests/integration/google-reviews.AC-03-02.public-reviews-filter.test.ts && npx tsc --noEmit -p . 2>&1 | grep -E "google-reviews|admin/layout" ; npx eslint src/features/google-reviews src/app/admin/google-reviews src/app/admin/layout.tsx`
Expected: PASS, aucune erreur tsc listée, lint propre.

- [ ] **Step 5: Commit**

```bash
git add src/features/google-reviews src/app/admin/google-reviews src/app/admin/layout.tsx tests/integration/google-reviews.AC-02-01-02.admin-page.test.tsx tests/integration/google-reviews.AC-03-02.public-reviews-filter.test.ts
git commit -m "feat(google-reviews): page admin « Avis Google » — liste, filtre, publication, synchro (spec 062 AC-02-01/02/05, AC-03-02)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Script OAuth, migration en base, traçabilité et vérification finale

**Files:**
- Create: `scripts/google-business-auth.ts`
- Modify: `docs/traceability-matrix.md` (lignes 062 uniquement)

**Interfaces:**
- Consumes: tout ce qui précède.

- [ ] **Step 1: Script OAuth local**

`scripts/google-business-auth.ts` :

```ts
/**
 * Spec 062 — autorisation Google Business Profile, à lancer UNE fois en local :
 *   GOOGLE_BUSINESS_CLIENT_ID=… GOOGLE_BUSINESS_CLIENT_SECRET=… npx tsx scripts/google-business-auth.ts
 * Ouvre l'URL affichée, connectez-vous avec le compte propriétaire de la fiche MyStay,
 * puis copiez le refresh token et les identifiants dans les variables Vercel.
 */
import { createServer } from 'node:http'

const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID
const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET
if (!clientId || !clientSecret) {
  console.error('Renseignez GOOGLE_BUSINESS_CLIENT_ID et GOOGLE_BUSINESS_CLIENT_SECRET.')
  process.exit(1)
}

const port = 53682
const redirectUri = `http://127.0.0.1:${port}`
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: 'https://www.googleapis.com/auth/business.manage',
  access_type: 'offline',
  prompt: 'consent',
}).toString()

type TokenResponse = { access_token?: string; refresh_token?: string; error?: string }
type Account = { name: string; accountName?: string }
type Location = { name: string; title?: string }

async function getJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(`${url} → ${response.status} ${await response.text()}`)
  return response.json() as Promise<T>
}

const server = createServer(async (req, res) => {
  const code = new URL(req.url ?? '/', redirectUri).searchParams.get('code')
  if (!code) {
    res.end('Code absent.')
    return
  }
  res.end('Autorisation reçue, vous pouvez fermer cet onglet.')
  server.close()

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code',
    }).toString(),
  })
  const tokens = await tokenResponse.json() as TokenResponse
  if (!tokens.refresh_token || !tokens.access_token) {
    console.error('Échec OAuth :', tokens.error ?? tokens)
    process.exit(1)
  }
  console.log(`\nGOOGLE_BUSINESS_REFRESH_TOKEN=${tokens.refresh_token}\n`)

  const { accounts = [] } = await getJson<{ accounts?: Account[] }>('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', tokens.access_token)
  for (const account of accounts) {
    const { locations = [] } = await getJson<{ locations?: Location[] }>(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title&pageSize=100`,
      tokens.access_token,
    )
    for (const location of locations) {
      console.log(`${location.title ?? '(sans titre)'} — GOOGLE_BUSINESS_ACCOUNT_ID=${account.name.split('/')[1]} GOOGLE_BUSINESS_LOCATION_ID=${location.name.split('/')[1]}`)
    }
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Ouvrez cette URL dans votre navigateur :\n\n${authUrl.toString()}\n`)
})
```

Run: `npx tsc --noEmit --esModuleInterop --skipLibCheck --target es2022 --module esnext --moduleResolution bundler scripts/google-business-auth.ts`
Expected: aucune erreur.

- [ ] **Step 2: Appliquer la migration 062 seule (jamais `migrate deploy`)**

```bash
npx prisma migrate status 2>&1 | tail -8
npx prisma db execute --file prisma/migrations/20261005120000_google_business_reviews/migration.sql --schema prisma/schema.prisma
npx prisma migrate resolve --applied 20261005120000_google_business_reviews
```

Expected : `migrate status` liste `20261005120000_google_business_reviews` (et éventuellement la migration blog du PO) comme non appliquée ; `db execute` → « Script executed successfully » ; `resolve` → « Migration … marked as applied ». Ne pas toucher à `20261004160000_add_blog_concierge_category`.

Vérification par un script jetable créé DANS le projet (`.check-062.mts`, supprimé ensuite) :

```ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
console.log(await prisma.googleBusinessReview.count(), await prisma.localLandingReview.count({ where: { google_review_id: { not: null } } }))
await prisma.$disconnect()
```

Run: `npx tsx .check-062.mts; rm .check-062.mts`
Expected: `0 0`.

- [ ] **Step 3: Matrice de traçabilité (lignes 062 seules)**

Lignes à ajouter en fin de tableau de `docs/traceability-matrix.md` :

```markdown
| `062-google-reviews` | US-01 | AC-01-01/AC-01-02 | Pagination complète GBP v4, normalisation (note, texte original, réponse, auteur anonyme) | `src/shared/lib/google-business.ts` | `tests/unit/google-reviews.AC-01-01-02.google-business-client.test.ts` | ✅ |
| `062-google-reviews` | US-01 | AC-01-03/AC-01-04/AC-01-05 | Upsert idempotent, soft delete des avis disparus (garde-fou réponse vide), aucune écriture sur erreur | `src/features/google-reviews/services/sync.ts`<br>`src/features/google-reviews/queries/store.ts` | `tests/unit/google-reviews.AC-01-03-05.sync.test.ts`<br>`tests/integration/google-reviews.AC-01-04.AC-02-04.prisma-store.test.ts` | ✅ |
| `062-google-reviews` | US-01/US-02 | AC-01-06/AC-02-05 | Cron quotidien protégé + synchro manuelle admin | `src/app/api/internal/google-reviews/sync/route.ts`<br>`src/app/api/admin/google-reviews/sync/route.ts`<br>`src/features/google-reviews/services/run-sync.ts`<br>`vercel.json` | `tests/contract/google-reviews.AC-01-06.AC-02-05.sync-routes.test.ts` | ✅ |
| `062-google-reviews` | US-02 | AC-02-01/AC-02-02 | Page admin « Avis Google » : tri, filtre, avis sans texte non publiable | `src/app/admin/google-reviews/page.tsx`<br>`src/features/google-reviews/components/AdminGoogleReviews.tsx`<br>`src/features/google-reviews/queries/admin.ts` | `tests/integration/google-reviews.AC-02-01-02.admin-page.test.tsx` | ✅ |
| `062-google-reviews` | US-02 | AC-02-03/AC-02-04/AC-02-06 | Publication par destination (upsert, dépublication, réactivation), suivi du texte Google, accès admin | `src/features/google-reviews/queries/publications.ts`<br>`src/app/api/admin/google-reviews/[id]/publications/route.ts` | `tests/integration/google-reviews.AC-02-03.publications.test.ts`<br>`tests/contract/google-reviews.AC-02-03.AC-02-06.publications-route.test.ts` | ✅ |
| `062-google-reviews` | US-03 | AC-03-01/AC-03-02 | Mention « Avis Google », publications inactives masquées | `src/features/local-seo/components/GuestReviews.tsx`<br>`src/features/local-seo/queries/landing-reviews.ts` | `tests/integration/google-reviews.AC-03-01.guest-reviews-label.test.tsx`<br>`tests/integration/google-reviews.AC-03-02.public-reviews-filter.test.ts` | ✅ |
```

Stager uniquement ces lignes (le fichier contient des modifications locales du PO) :

```bash
S=/private/tmp/claude-501/-Users-daviddevillers-sites-staylocal-/d20f79aa-b9ce-4bb5-9143-ca8fd97f02b2/scratchpad
# 1) ajouter les 6 lignes au fichier de travail (Edit), 2) même ajout sur la version HEAD pour l'index :
git show HEAD:docs/traceability-matrix.md > $S/tm.md
python3 - "$S" <<'EOF'
import sys; S=sys.argv[1]
wt=open('docs/traceability-matrix.md').read()
rows=[l for l in wt.splitlines() if l.startswith('| `062-google-reviews`')]
assert len(rows)==6
head=open(f'{S}/tm.md').read().rstrip('\n')+'\n'+'\n'.join(rows)+'\n'
open(f'{S}/tm.md','w').write(head)
EOF
git update-index --cacheinfo 100644,$(git hash-object -w $S/tm.md),docs/traceability-matrix.md
```

- [ ] **Step 4: Vérification complète**

Run:
```bash
npx jest tests/unit/google-reviews* tests/contract/google-reviews* tests/integration/google-reviews* tests/integration/local-landing-reviews* tests/contract/local-landing-reviews* tests/integration/local-seo* tests/unit/local-seo*
npx tsc --noEmit -p .
npx eslint src/features/google-reviews src/shared/lib/google-business.ts src/app/api/internal/google-reviews src/app/api/admin/google-reviews src/app/admin/google-reviews src/features/local-seo
```
Expected: toutes les suites PASS ; `tsc` sans nouvelle erreur (comparer à `git stash`-free baseline : seules les erreurs pré-existantes listées dans la mémoire « drift suite de tests » sont tolérées) ; lint propre.

Puis lancer le dev server et ouvrir `http://localhost:3000/admin/google-reviews` (connecté admin) : bandeau « Connexion Google non configurée » si les variables manquent, état vide « Aucun avis importé ».

- [ ] **Step 5: Commit**

```bash
git add scripts/google-business-auth.ts
git commit -m "feat(google-reviews): script OAuth Business Profile, migration appliquée, traçabilité (spec 062)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
