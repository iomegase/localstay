# Spec — 062 Avis Google Business Profile

## Metadata

```yaml
id: 062-google-reviews
title: "Importer tous les avis Google de la fiche MyStay et les publier, au choix, sur les landings"
status: review
mvp: 2
owner: "Product Owner"
created_at: 2026-10-05
updated_at: 2026-10-05
depends_on:
  - 046-local-seo-city-cluster
  - 048-admin-local-landing-management
bounded_context: marketing-seo
implementation_gate: "Design validé en conversation par le PO le 2026-10-05 (approche A : table d'import + publication vers LocalLandingReview). Code autorisé uniquement après passage de cette spec en `approved`."
```

---

## Context

MyStay possède une unique fiche Google Business Profile (GBP). Ses avis sont la preuve
sociale la plus crédible pour les landings locales (046), mais ils sont aujourd'hui
recopiés à la main dans `LocalLandingReview` (sources `AIRBNB` / `DIRECT`).

Le Product Owner veut récupérer **tous** les avis Google automatiquement, puis choisir
lui-même, dans l'admin, lesquels publier et sur quelles landings. Rien n'est publié sans
action explicite d'un admin.

L'API Places (clé déjà présente) est écartée : elle ne renvoie que 5 avis par fiche.
L'API Google Business Profile renvoie l'intégralité des avis et des réponses du
propriétaire, au prix d'une autorisation OAuth unique du compte propriétaire et d'une
demande d'accès à l'API auprès de Google.

---

## Glossary References

- **Local Landing** (046 / 048) : page `/conciergerie|seminaires|locations-vacances/[city-slug]`.
- **Local Landing Review** (048) : avis affiché sur une landing via `GuestReviews`.
- **Google Business Review** (nouveau) : copie brute d'un avis de la fiche GBP MyStay,
  synchronisée depuis Google, jamais affichée directement au public.
- **Publication** (nouveau) : `LocalLandingReview` de source `GOOGLE` créé à partir d'un
  Google Business Review pour une destination donnée.

---

## User Stories

### US-01 — Récupérer automatiquement tous les avis Google

**As a** Admin
**I want to** que tous les avis de la fiche Google MyStay soient importés chaque jour
**So that** je dispose de la liste complète et à jour sans recopie manuelle

#### Acceptance Criteria

- **AC-01-01** : Given des identifiants GBP valides en variables d'environnement, When
  `fetchAllGoogleReviews()` est appelée, Then elle parcourt toutes les pages de
  `GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews`
  (`pageSize=50`, `pageToken`) jusqu'à épuisement de `nextPageToken` et renvoie tous les avis.
- **AC-01-02** : Given un avis Google, When il est normalisé, Then `starRating`
  `ONE…FIVE` devient `1…5`, `comment` absent devient `null`, `reviewReply.comment`
  devient `owner_reply` et `createTime` / `updateTime` deviennent des dates.
- **AC-01-03** : Given une synchronisation, When un avis est reçu, Then il est créé ou
  mis à jour par son identifiant Google (`google_review_id` = `review.name`) ; relancer la
  synchronisation sans changement côté Google ne crée aucun doublon et ne modifie rien.
- **AC-01-04** : Given un avis présent en base mais absent de la réponse complète de
  Google, When la synchronisation se termine sans erreur, Then l'avis reçoit `deleted_at`
  et toutes ses publications passent `is_active = false`.
- **AC-01-05** : Given une erreur Google (réseau, 401, 403, 429, 5xx) pendant la
  pagination, When la synchronisation échoue, Then aucune suppression (AC-01-04) n'est
  appliquée, les données existantes restent intactes et l'erreur est renvoyée.
- **AC-01-06** : Given le cron `/api/internal/google-reviews/sync`, When il est appelé
  sans `Authorization: Bearer ${INTERNAL_API_SECRET}`, Then il répond 401
  `UNAUTHORIZED` ; avec le secret, il synchronise et répond le résumé
  `{ fetched, created, updated, deleted }`.

### US-02 — Choisir les avis publiés et leurs landings

**As a** Admin
**I want to** voir tous les avis Google et cocher les landings où publier chacun
**So that** seuls les avis que j'ai choisis apparaissent sur le site

#### Acceptance Criteria

- **AC-02-01** : Given des avis importés, When `/admin/google-reviews` s'ouvre, Then la
  liste affiche, du plus récent au plus ancien, l'auteur, la note, la date, le texte, la
  réponse du propriétaire éventuelle et, pour chaque destination de landing, une case
  « Publié sur [Commune] ». Un filtre par note (toutes, 5, 4, ≤ 3) est disponible.
- **AC-02-02** : Given un avis sans texte (note seule), When la liste s'affiche, Then il
  apparaît avec la mention « Note sans commentaire » et ses cases de publication sont
  désactivées.
- **AC-02-03** : Given un avis avec texte, When l'admin coche une destination, Then un
  `LocalLandingReview` est créé (`source = GOOGLE`, `google_review_id`, `author`,
  `quote` = texte, `rating`, `stay_date` = mois et année de `google_created_at` en français, ex. « octobre 2026 », `is_active = true`)
  pour cette destination ; décocher passe ce `LocalLandingReview` en `is_active = false`.
  Recocher le réactive au lieu d'en créer un second.
- **AC-02-04** : Given un avis publié dont le texte change côté Google, When la
  synchronisation le met à jour, Then le `quote` et la `rating` de ses publications sont
  mis à jour.
- **AC-02-05** : Given un admin, When il clique « Synchroniser maintenant », Then la même
  synchronisation qu'AC-01-06 s'exécute et la liste se rafraîchit avec le résumé.
- **AC-02-06** : Given un utilisateur non admin, When il appelle les routes
  `/api/admin/google-reviews*` ou ouvre `/admin/google-reviews`, Then l'accès est refusé
  (403 / redirection), comme les autres routes admin.

### US-03 — Afficher l'origine Google sur le site

**As a** Tourist
**I want to** savoir qu'un avis vient de Google
**So that** je puisse lui accorder ma confiance

#### Acceptance Criteria

- **AC-03-01** : Given un `LocalLandingReview` actif de source `GOOGLE`, When
  `GuestReviews` le rend, Then la mention « Avis Google » s'affiche au même emplacement et
  dans le même style que « Avis voyageur reçu via Airbnb », sans autre changement visuel.
  Les avis `AIRBNB` / `DIRECT` sont inchangés.
- **AC-03-02** : Given une publication désactivée ou un avis Google supprimé, When la
  landing s'affiche, Then l'avis n'apparaît pas.

---

## Business Rules

- **BR-01** : un seul établissement GBP, défini par `GOOGLE_BUSINESS_ACCOUNT_ID` et
  `GOOGLE_BUSINESS_LOCATION_ID`. Pas de multi-fiche.
- **BR-02** : aucun avis Google n'est publié automatiquement. Seule une case cochée par
  un admin crée une publication.
- **BR-03** : le texte publié est le texte Google tel quel (pas de réécriture ni de
  troncature côté données ; l'affichage peut limiter les lignes).
- **BR-04** : un avis supprimé sur Google est retiré du site au plus tard à la
  synchronisation suivante (AC-01-04).
- **BR-05** : soft delete uniquement (`deleted_at`) ; aucune suppression physique.
- **BR-06** : le refresh token OAuth ne transite jamais par la base ni par le client ; il
  vit uniquement dans les variables d'environnement serveur.
- **BR-07** : les avis Google ne sont pas balisés en données structurées
  `Review` / `AggregateRating` (avis auto-hébergés sur sa propre entreprise : non
  éligibles aux extraits enrichis Google).

---

## Data Model

```prisma
enum LocalLandingReviewSource {
  AIRBNB
  DIRECT
  GOOGLE   // ajout 062
}

model GoogleBusinessReview {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  google_review_id    String   @unique   // review.name côté Google
  author              String
  author_photo_url    String?
  rating              Int                // 1..5
  comment             String?
  owner_reply         String?
  google_created_at   DateTime
  google_updated_at   DateTime
  last_synced_at      DateTime

  publications LocalLandingReview[]

  @@index([deleted_at, google_created_at])
}

model LocalLandingReview {
  // … champs existants inchangés …
  google_review_id String?                                   // ajout 062
  google_review    GoogleBusinessReview? @relation(fields: [google_review_id], references: [google_review_id])

  @@unique([destination_id, google_review_id])               // ajout 062 (une publication par destination)
}
```

Migration additive uniquement (nouvel enum value, nouvelle table, colonne nullable,
contrainte unique sur des valeurs encore toutes nulles).

---

## API Contract

```yaml
openapi: 3.1.0
paths:
  /api/internal/google-reviews/sync:
    get:
      summary: Synchronisation quotidienne (cron Vercel)
      security: [{ bearerInternal: [] }]
      responses:
        '200':
          content:
            application/json:
              schema: { $ref: '#/components/schemas/SyncSummary' }
        '401': { $ref: '#/components/responses/Error' }   # UNAUTHORIZED
        '502': { $ref: '#/components/responses/Error' }   # GOOGLE_API_ERROR
        '503': { $ref: '#/components/responses/Error' }   # GOOGLE_NOT_CONFIGURED

  /api/admin/google-reviews/sync:
    post:
      summary: Synchronisation manuelle (admin)
      responses:
        '200': { content: { application/json: { schema: { $ref: '#/components/schemas/SyncSummary' } } } }
        '403': { $ref: '#/components/responses/Error' }   # FORBIDDEN
        '502': { $ref: '#/components/responses/Error' }
        '503': { $ref: '#/components/responses/Error' }

  /api/admin/google-reviews/{googleReviewId}/publications:
    put:
      summary: Définit l'ensemble des destinations où l'avis est publié
      parameters:
        - { name: googleReviewId, in: path, required: true, schema: { type: string } }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [destination_ids]
              additionalProperties: false
              properties:
                destination_ids: { type: array, items: { type: string, format: uuid }, maxItems: 50 }
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                required: [google_review_id, published_destination_ids]
                properties:
                  google_review_id: { type: string }
                  published_destination_ids: { type: array, items: { type: string, format: uuid } }
        '400': { $ref: '#/components/responses/Error' }   # VALIDATION_ERROR
        '403': { $ref: '#/components/responses/Error' }
        '404': { $ref: '#/components/responses/Error' }   # REVIEW_NOT_FOUND | DESTINATION_NOT_FOUND
        '422': { $ref: '#/components/responses/Error' }   # REVIEW_HAS_NO_TEXT

components:
  schemas:
    SyncSummary:
      type: object
      required: [fetched, created, updated, deleted]
      properties:
        fetched: { type: integer }
        created: { type: integer }
        updated: { type: integer }
        deleted: { type: integer }
  responses:
    Error:
      content:
        application/json:
          schema:
            type: object
            required: [error]
            properties:
              error:
                type: object
                required: [code, message]
                properties:
                  code: { type: string }
                  message: { type: string }
                  details: { type: object }
```

Entrées validées par Zod. La liste admin est rendue côté serveur (Server Component +
query), sans route GET publique.

---

## Infrastructure

- **Client** : `src/shared/lib/google-business.ts` — échange du refresh token contre un
  access token (`https://oauth2.googleapis.com/token`), puis pagination des avis.
- **Variables d'environnement** (serveur uniquement, ajoutées à `.env.example` vides) :
  `GOOGLE_BUSINESS_CLIENT_ID`, `GOOGLE_BUSINESS_CLIENT_SECRET`,
  `GOOGLE_BUSINESS_REFRESH_TOKEN`, `GOOGLE_BUSINESS_ACCOUNT_ID`,
  `GOOGLE_BUSINESS_LOCATION_ID`. Une variable manquante → `GOOGLE_NOT_CONFIGURED` (503).
- **Script** : `scripts/google-business-auth.ts` — flux OAuth local unique (scope
  `https://www.googleapis.com/auth/business.manage`) qui affiche le refresh token et liste
  les comptes / établissements accessibles pour renseigner les identifiants.
- **Cron** : ajout dans `vercel.json` de `{ "path": "/api/internal/google-reviews/sync",
  "schedule": "45 5 * * *" }`.
- **Prérequis côté Google (PO)** : projet Google Cloud, demande d'accès à l'API Business
  Profile approuvée, APIs « My Business Account Management » et « Google My Business »
  activées, client OAuth de type application de bureau.

---

## UI Behaviour

### `/admin/google-reviews` (Shadcn/ui, dashboard admin)

- En-tête : titre « Avis Google », date de la dernière synchronisation, bouton
  « Synchroniser maintenant » (état chargement, puis toast avec le résumé ou l'erreur).
- Filtre par note : Toutes / 5★ / 4★ / 3★ et moins.
- Une carte par avis : auteur (+ photo si disponible), étoiles, date, texte, réponse du
  propriétaire repliable, puis une case par destination de landing
  (« Publié sur Saint-Gervais-les-Bains »…). Chaque changement de case appelle
  `PUT …/publications` avec l'ensemble des destinations cochées ; échec → case remise
  dans son état précédent + toast d'erreur.
- État vide : « Aucun avis importé. Lancez une synchronisation. »
- Configuration absente : bandeau « Connexion Google non configurée » renvoyant aux
  variables d'environnement attendues ; bouton de synchronisation désactivé.
- Lien vers cette page depuis la navigation admin, à côté de « Landing pages ».

### Landings publiques

- `GuestReviews` : mention « Avis Google » pour `source = GOOGLE` (AC-03-01). Rien d'autre.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Pagination complète de l'API GBP | unit |
| AC-01-02 | Normalisation note / texte / réponse / dates | unit |
| AC-01-03 | Upsert idempotent par `google_review_id` | integration |
| AC-01-04 | Avis disparu → soft delete + publications désactivées | integration |
| AC-01-05 | Erreur Google → aucune suppression, données intactes | unit + integration |
| AC-01-06 | Cron protégé et résumé de synchro | contract |
| AC-02-01 | Liste admin triée, filtre par note, cases par destination | integration |
| AC-02-02 | Avis sans texte non publiable | integration |
| AC-02-03 | Cocher / décocher / recocher une destination | contract + integration |
| AC-02-04 | Publications mises à jour quand Google change le texte | integration |
| AC-02-05 | Synchronisation manuelle depuis l'admin | contract |
| AC-02-06 | Accès admin uniquement | contract |
| AC-03-01 | Mention « Avis Google » dans `GuestReviews` | integration |
| AC-03-02 | Publications inactives ou avis supprimés non affichés | integration |

---

## Out of Scope

- Répondre aux avis depuis MyStay.
- Avis Airbnb ou autres plateformes (décision PO du 2026-10-05 : Google uniquement).
- Plusieurs fiches Google, avis par logement.
- Publication automatique selon la note.
- Données structurées `Review` / `AggregateRating` (BR-07).
- Écran « Connecter Google » dans l'admin (remplacé par le script local unique).
- Affichage de la réponse du propriétaire sur le site public.

---

## Open Questions

Aucune. Prérequis Google (accès API) à la charge du PO, non bloquant pour le code :
sans configuration, la page admin affiche l'état « non configurée » (UI Behaviour).
