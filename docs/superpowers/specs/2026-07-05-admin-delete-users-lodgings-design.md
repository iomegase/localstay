# Admin — Suppression définitive de comptes & logements

**Date :** 2026-07-05
**Statut :** Design approuvé (approche A)

## Contexte

La page `/admin/users` est aujourd'hui en consultation seule (« pas de désactivation,
changement de rôle ou impersonation »). On veut permettre à un admin de **supprimer
définitivement** (hard-delete) un compte owner/merchant et, de facto, tous les logements
associés — ainsi qu'un logement individuel.

Un compte vit à deux endroits : **Supabase Auth** (login) et la table **`User`** (Prisma).
Une suppression doit traiter les deux.

## Décisions (issues du brainstorming)

1. **Sémantique : hard-delete** (purge définitive, irréversible). Pas de soft-delete ici.
2. **Portée : user (+ ses logements) ET logement seul.** Supprimer un compte purge d'office
   tous ses logements ; on peut aussi supprimer un logement isolé sans toucher au compte.
3. **Garde-fou : owners/merchants uniquement.** Les comptes `admin` ne sont pas supprimables
   via cette UI. (Ce garde-fou élimine aussi tout risque de FK orphelines : les relations
   `reviewer/author/admin/started_by/reviewed_by` sont nullables et alimentées uniquement par
   des admins, donc jamais par un owner/merchant.)
4. **Confirmation simple** (non retenue en « forte » : pas de saisie d'email) : une modale de
   confirmation avant l'action irréversible.
5. **Approche technique : A — purge applicative transactionnelle**, sans migration
   (la DB directe est injoignable depuis le sandbox ; on évite tout DDL live).

## Tables concernées (owner/merchant uniquement)

**Côté merchant** (FK `merchant_id` → User) :
- `MerchantProfile` (1-1, requis)
- `MerchantClaim` relation `MerchantClaims` (claimant, requis)
- `MissingPoiRequest` relation `MissingPoiRequests` (requis)

**Côté owner** (FK vers User) :
- `Subscription` (`user_id`, requis)
- `Lodging` (`owner_id`, requis) + tous ses enfants
- `ContactMessage` relation `ContactMessageOwner` (`owner_id`, nullable)

**Enfants d'un `Lodging`** :
- `QrCode`, `Analytics`, `AnalyticsInteractionEvent`, `LodgingCustomization`,
  `LodgingFeaturedPoi`, `LodgingPracticalBlock`, `ContactMessage` (par `lodging_id`),
  `LodgingPublicProfile` (+ ses photos).

> Les relations admin-only (`BlogArticle` author, `*AuditLog`, `PoiAcquisition*`,
> `TrailImport*`, `MerchantClaimReviews`, `MissingPoiRequestReviews`) ne sont jamais
> référencées par un owner/merchant → hors périmètre.

## Architecture

### 1. Couche métier — `src/features/admin/lib/hard-delete.ts`

```ts
// Supprime un logement et tous ses enfants. À appeler DANS une transaction.
async function hardDeleteLodging(tx: Prisma.TransactionClient, lodgingId: string): Promise<void>

// Purge complète d'un compte owner/merchant + ses logements, puis le compte Supabase Auth.
// Retourne un résumé { deletedLodgings, authDeleted }.
async function hardDeleteUserAccount(userId: string): Promise<{ deletedLodgings: number; authDeleted: boolean }>
```

**`hardDeleteLodging(tx, lodgingId)`** — ordre de suppression (enfants → parent) :
1. `lodgingPublicProfilePhoto` (via `public_profile`) puis `lodgingPublicProfile`
2. `qrCode`, `analytics`, `analyticsInteractionEvent`, `lodgingCustomization`,
   `lodgingFeaturedPoi`, `lodgingPracticalBlock`, `contactMessage` (where `lodging_id`)
3. `lodging` (delete)

**`hardDeleteUserAccount(userId)`** :
1. Ouvre `prisma.$transaction(async tx => { ... })` :
   - charge le user (`select: { id, role, supabase_id }`) ; si absent → throw `NotFound`.
   - récupère les `lodging.id` du user → `for (id of lodgings) await hardDeleteLodging(tx, id)`
   - supprime `subscription`, `merchantProfile`, `merchantClaim` (merchant_id),
     `missingPoiRequest` (merchant_id), `contactMessage` (owner_id restants)
   - `tx.user.delete({ where: { id } })`
   - renvoie `{ deletedLodgings, supabaseId }`
2. **Après commit** : `supabase.auth.admin.deleteUser(supabaseId)` (client service_role).
   - si erreur Auth → log + `authDeleted: false` (la DB est déjà purgée ; l'admin est averti
     et peut retenter la suppression Auth manuellement).

Le client Supabase admin réutilise `createSupabaseServer()` de `src/shared/lib/supabase.ts`
(clé service_role) ; `auth.admin.deleteUser` est disponible dessus.

### 2. API

**`DELETE /api/admin/users/[id]/route.ts`**
- `getSessionAdmin()` → 401/403 si non-admin.
- charge le `User` cible → 404 si introuvable.
- **si `role === 'admin'` → 403** (`apiError('FORBIDDEN', 'Compte admin non supprimable', 403)`).
- `await hardDeleteUserAccount(id)`.
- `200 { deleted_lodgings, auth_deleted }` (200 avec warning si `auth_deleted === false`).

**`DELETE /api/admin/lodgings/[id]/route.ts`**
- `getSessionAdmin()`.
- vérifie l'existence du logement → 404 sinon.
- `await prisma.$transaction(tx => hardDeleteLodging(tx, id))`.
- `200 { message }`.

Validation des `id` via `z.string().uuid()`. Réponses via les helpers existants
(`apiError`, `validationError`).

### 3. UI

**`/admin/users`** — la table (server component) rend une nouvelle **action client** par ligne :
- Composant `DeleteUserButton` (client) : visible seulement si `role !== 'admin'`.
- Icône corbeille → modale de confirmation :
  « Supprimer définitivement **{email}** et ses **{N}** logement(s) ? Action irréversible. »
- Sur confirmation → `fetch(DELETE /api/admin/users/{id})` → toast succès/erreur → refresh.
- `N` = `active_lodging_count` déjà exposé par `getAdminUsers` (à confirmer dans la query ;
  sinon on l'ajoute au select).

**`/admin/lodgings`** — bouton corbeille par logement, même schéma de confirmation, appelant
`DELETE /api/admin/lodgings/{id}`.

### 4. Tests

- **Unitaire** `hard-delete.ts` (DB de test) :
  - `hardDeleteLodging` supprime bien tous les enfants listés puis le logement.
  - `hardDeleteUserAccount` d'un owner avec 2 logements → user + 2 logements + enfants purgés,
    `deletedLodgings === 2`.
  - `hardDeleteUserAccount` d'un merchant → merchant_profile / claims / missing_poi_requests purgés.
- **Route** :
  - `DELETE /api/admin/users/[id]` sans session admin → 401/403.
  - cible `role = admin` → 403, aucune suppression.
  - cible inexistante → 404.
  - cas nominal → 200 + `deleted_lodgings`.
  - `DELETE /api/admin/lodgings/[id]` : auth requise, 404 si absent, 200 nominal.
- Le mock du client Supabase Auth vérifie l'appel `admin.deleteUser(supabase_id)`.

## Hors périmètre

- Restauration / corbeille (c'est du hard-delete assumé).
- Suppression de comptes admin.
- Réassignation de logements à un autre owner.
- Confirmation par saisie d'email (retenue « simple »).
