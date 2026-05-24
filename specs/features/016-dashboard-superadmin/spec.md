# Spec — 016 Dashboard Super-Admin

## Metadata

```yaml
id: 016-dashboard-superadmin
title: "Dashboard Super-Admin — cockpit MVP"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-05-24
depends_on: [009-auth-owner, 010-dashboard-owner, 013-subscription-owner, 014-auth-merchant, 015-dashboard-merchant]
bounded_context: admin
```

---

## Context

Le Super-Admin est l'espace interne de l'équipe StayLocal. En MVP 2, son rôle n'est pas de concentrer toute l'administration produit, mais de fournir un cockpit fiable pour :

- accéder aux métriques globales essentielles ;
- surveiller les états qui bloquent l'exploitation ;
- traiter les revendications Merchant déjà définies dans `014-auth-merchant` ;
- consulter les utilisateurs sans modification risquée ;
- consulter les villes et leur état général sans déclencher de pipeline lourd.

Cette spec remplace le périmètre initial trop large de `016`. Les capacités spécialisées restent dans leurs specs dédiées :

- `017-admin-taxonomy` pour créer/modifier catégories et sous-catégories ;
- `018-poi-acquisition-pipeline` pour acquisition POI, création manuelle POI, matching Google Places et validation candidats ;
- une future spec billing admin pour facturation réelle, revenus, Stripe et plans commerciaux ;
- une future spec platform-ops pour configuration Gemini avancée, TTL éditables et jobs opérationnels.

---

## Glossary References

- **Admin** : membre de l'équipe StayLocal avec accès à `/admin/*`
- **MerchantClaim** : demande de revendication d'un POI par un Merchant
- **MerchantProfile** : rattachement actif Merchant ↔ POI
- **Subscription** : abonnement Owner ou Merchant, en `trial` en MVP 2
- **City** : ville référencée dans StayLocal
- **Analytics** : événements append-only utilisés pour les statistiques
- **Soft Delete** : suppression logique via `deleted_at`

---

## User Stories

### US-01 — Accéder au cockpit Super-Admin

**As an** Admin  
**I want to** accéder à un espace `/admin` protégé  
**So that** seuls les membres StayLocal puissent piloter la plateforme

#### Acceptance Criteria

- **AC-01-01**: Given un utilisateur `role = admin` authentifié, When il ouvre `/admin`, Then il accède au dashboard Super-Admin.
- **AC-01-02**: Given un utilisateur non authentifié, Owner ou Merchant, When il tente d'accéder à `/admin/*`, Then il est refusé ou redirigé selon les règles d'auth `009`.
- **AC-01-03**: Given le layout `/admin`, When il s'affiche, Then il contient une navigation desktop vers : Vue globale, Revendications, Villes, Utilisateurs.

### US-02 — Vue globale de la plateforme

**As an** Admin  
**I want to** voir les indicateurs essentiels de la plateforme  
**So that** je détecte rapidement les volumes et blocages

#### Acceptance Criteria

- **AC-02-01**: Given la page `/admin`, When l'Admin la consulte, Then il voit les KPI : villes actives, POI actifs, Owners actifs, Merchants actifs, revendications pending, scans QR 30 jours.
- **AC-02-02**: Given la page `/admin`, When elle charge, Then un graphique affiche les scans QR par jour sur 30 jours toutes villes confondues.
- **AC-02-03**: Given des revenus non activés en MVP 2, When la page affiche les abonnements, Then elle indique explicitement "Facturation non activée en MVP 2" et n'affiche aucun revenu réel.

### US-03 — Traiter les revendications Merchant

**As an** Admin  
**I want to** voir et traiter les revendications Merchant en attente  
**So that** les Merchants validés accèdent à leur dashboard

#### Acceptance Criteria

- **AC-03-01**: Given la page `/admin/merchant-claims`, When l'Admin la consulte, Then il voit les claims `pending` avec Merchant, POI, ville et date de demande.
- **AC-03-02**: Given une claim `pending`, When l'Admin l'approuve, Then le comportement est exactement celui de `014-auth-merchant` AC-04-01.
- **AC-03-03**: Given une claim `pending`, When l'Admin la rejette avec un motif, Then le comportement est exactement celui de `014-auth-merchant` AC-04-02.
- **AC-03-04**: Given des claims pending, When l'Admin est sur `/admin`, Then les 5 plus récentes sont visibles en aperçu avec un lien vers `/admin/merchant-claims`.

### US-04 — Consulter les villes

**As an** Admin  
**I want to** consulter les villes référencées et leur état général  
**So that** je sache où la plateforme est active sans lancer d'action lourde

#### Acceptance Criteria

- **AC-04-01**: Given la page `/admin/cities`, When l'Admin la consulte, Then il voit les villes avec nom, code postal, statut actif, nombre de POI actifs, nombre de logements actifs et scans QR 30 jours.
- **AC-04-02**: Given une ville sans POI actif, When elle est listée, Then elle est signalée comme "à enrichir".
- **AC-04-03**: Given une ville listée, When l'Admin clique sur "Voir le guide", Then il ouvre le guide public de la ville.

### US-05 — Consulter les utilisateurs

**As an** Admin  
**I want to** consulter les comptes utilisateurs  
**So that** je puisse diagnostiquer les accès sans modifier de données sensibles

#### Acceptance Criteria

- **AC-05-01**: Given la page `/admin/users`, When l'Admin la consulte, Then il voit les utilisateurs actifs avec email, rôle, statut actif, date d'inscription et statut subscription si disponible.
- **AC-05-02**: Given la page utilisateurs, When l'Admin filtre par rôle (`owner`, `merchant`, `admin`), Then la liste ne retourne que ce rôle.
- **AC-05-03**: Given un utilisateur supprimé logiquement (`deleted_at != null`), When la liste s'affiche, Then il n'apparaît pas par défaut.

---

## Business Rules

- **BR-01**: Seul `User.role = admin`, `is_active = true` et `deleted_at = null` peut accéder aux routes `/admin/*` et `/api/admin/*` de cette spec.
- **BR-02**: Les routes API admin retournent le format d'erreur standard du projet.
- **BR-03**: `016` ne crée, modifie ni supprime aucune City, Category, SubCategory, POI, User ou Subscription.
- **BR-04**: Le traitement approve/reject des claims réutilise les routes et règles de `014-auth-merchant`; `016` ne redéfinit pas cette logique métier.
- **BR-05**: Les montants de revenus réels, appels Stripe, Customer Portal, Checkout et webhooks sont hors scope en MVP 2.
- **BR-06**: Les métriques globales excluent les enregistrements soft-deleted.
- **BR-07**: Les scans QR 30 jours sont calculés depuis `Analytics.event_type = qr_scan`.
- **BR-08**: La page utilisateurs est consultative en MVP 2 : pas de désactivation, changement de rôle, impersonation ou modification de compte dans `016`.
- **BR-09**: La page villes est consultative en MVP 2 : pas de création ville, refresh Gemini, acquisition POI, génération QR ou modification géographique dans `016`.
- **BR-10**: Les actions spécialisées sont accessibles comme liens de navigation uniquement si leur spec dédiée est approved et implémentée.
- **BR-11**: Le dashboard Super-Admin est desktop-first. Il doit rester utilisable en mobile, mais l'optimisation mobile n'est pas prioritaire.

---

## Data Model

Cette spec ne crée pas de nouveau modèle Prisma en MVP 2. Elle réutilise uniquement les modèles existants :

```prisma
model User {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  email       String    @unique
  role        String    @default("owner") // owner | merchant | admin
  is_active   Boolean   @default(true)

  subscriptions Subscription[]
}

model City {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  name        String
  slug        String   @unique
  postal_code String
  is_active   Boolean  @default(true)
}

model PointOfInterest {
  id          String   @id @default(uuid())
  deleted_at  DateTime?
  is_active   Boolean  @default(true)
  city_id     String
}

model Lodging {
  id          String   @id @default(uuid())
  deleted_at  DateTime?
  is_active   Boolean  @default(true)
  city_id     String
}

model Analytics {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  event_type  String
  city_id     String
}

model MerchantClaim {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  deleted_at  DateTime?
  status      String   @default("pending")
}

model MerchantProfile {
  id          String   @id @default(uuid())
  deleted_at  DateTime?
  status      String   @default("active")
}

model Subscription {
  id          String   @id @default(uuid())
  deleted_at  DateTime?
  user_id     String
  status      String
  plan        String
}
```

### Future Audit Note

Les specs `017` et `018` demandent des logs d'audit pour leurs mutations. Ce besoin ne doit pas être implémenté dans `016` tant que les mutations restent hors scope. Si un modèle d'audit transversal est nécessaire, il devra être arbitré avant d'implémenter `017`/`018` pour éviter plusieurs tables de logs concurrentes.

---

## API Contract

```yaml
paths:
  /api/admin/overview:
    get:
      summary: "Métriques globales du cockpit Super-Admin"
      tags: [superadmin]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Overview Super-Admin
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AdminOverview"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/cities:
    get:
      summary: "Liste consultative des villes"
      tags: [superadmin]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Villes avec compteurs d'exploitation
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/AdminCityRow"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/users:
    get:
      summary: "Liste consultative des utilisateurs"
      tags: [superadmin]
      security:
        - bearerAuth: []
      parameters:
        - name: role
          in: query
          required: false
          schema:
            type: string
            enum: [owner, merchant, admin]
      responses:
        "200":
          description: Utilisateurs filtrés
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/AdminUserRow"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

components:
  schemas:
    AdminOverview:
      type: object
      required: [kpis, qr_scans_series, latest_pending_claims, billing_notice]
      properties:
        kpis:
          type: object
          required: [active_cities, active_pois, active_owners, active_merchants, pending_claims, qr_scans_30d]
          properties:
            active_cities: { type: integer }
            active_pois: { type: integer }
            active_owners: { type: integer }
            active_merchants: { type: integer }
            pending_claims: { type: integer }
            qr_scans_30d: { type: integer }
        qr_scans_series:
          type: array
          minItems: 30
          maxItems: 30
          items:
            type: object
            required: [date, count]
            properties:
              date: { type: string, format: date }
              count: { type: integer }
        latest_pending_claims:
          type: array
          maxItems: 5
          items:
            $ref: "#/components/schemas/AdminPendingClaim"
        billing_notice:
          type: string
          enum: ["Facturation non activée en MVP 2"]

    AdminPendingClaim:
      type: object
      required: [id, merchant_email, poi_name, city_name, created_at]
      properties:
        id: { type: string }
        merchant_email: { type: string, format: email }
        poi_name: { type: string }
        city_name: { type: string }
        created_at: { type: string, format: date-time }

    AdminCityRow:
      type: object
      required: [id, name, slug, postal_code, is_active, active_poi_count, active_lodging_count, qr_scans_30d, status_label]
      properties:
        id: { type: string }
        name: { type: string }
        slug: { type: string }
        postal_code: { type: string }
        is_active: { type: boolean }
        active_poi_count: { type: integer }
        active_lodging_count: { type: integer }
        qr_scans_30d: { type: integer }
        status_label:
          type: string
          enum: [active, inactive, needs_enrichment]

    AdminUserRow:
      type: object
      required: [id, email, role, is_active, created_at, subscription_status]
      properties:
        id: { type: string }
        email: { type: string, format: email }
        role:
          type: string
          enum: [owner, merchant, admin]
        is_active: { type: boolean }
        created_at: { type: string, format: date-time }
        subscription_status:
          type: string
          nullable: true
```

---

## UI Behaviour

### Layout `/admin`

- Layout desktop-first avec sidebar Shadcn/ui.
- Navigation MVP 2 : Vue globale, Revendications, Villes, Utilisateurs.
- Les liens vers Taxonomie ou Acquisition POI peuvent être absents tant que `017`/`018` ne sont pas implémentées.
- Un badge affiche le nombre de revendications pending à côté de "Revendications".

### Page `/admin` — Vue globale

- 6 KPI cards Shadcn : villes actives, POI actifs, Owners actifs, Merchants actifs, revendications pending, scans QR 30j.
- Graphique Recharts des scans QR sur 30 jours.
- Bloc "Facturation" consultatif affichant "Facturation non activée en MVP 2".
- Table des 5 dernières revendications pending avec lien vers `/admin/merchant-claims`.

### Page `/admin/merchant-claims`

- Réutilise le comportement déjà défini par `014-auth-merchant`.
- Table avec colonnes : Merchant, POI, Ville, Date demande, Actions.
- Actions : approuver, rejeter avec motif.

### Page `/admin/cities`

- Table consultative : ville, CP, statut actif, POI actifs, logements actifs, scans QR 30j, statut.
- Statut `needs_enrichment` si la ville est active mais `active_poi_count = 0`.
- Lien "Voir le guide" vers `/guide/{city.slug}`.

### Page `/admin/users`

- Table consultative : email, rôle, statut actif, date création, statut subscription.
- Filtre par rôle.
- Aucune action destructive ou mutation de rôle en MVP 2.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Admin authentifié accède à `/admin` | integration |
| AC-01-02 | Non-admin refusé sur `/admin/*` et `/api/admin/*` | contract |
| AC-01-03 | Layout admin contient navigation MVP | integration |
| AC-02-01 | Overview affiche 6 KPI globaux | contract |
| AC-02-02 | Graphique scans QR 30 jours | unit |
| AC-02-03 | Facturation affichée comme non activée MVP2 | integration |
| AC-03-01 | Claims pending visibles sur `/admin/merchant-claims` | integration |
| AC-03-02 | Approve claim réutilise `014` | contract |
| AC-03-03 | Reject claim réutilise `014` | contract |
| AC-03-04 | Overview affiche 5 dernières claims pending | contract |
| AC-04-01 | Liste villes consultative avec compteurs | contract |
| AC-04-02 | Ville sans POI actif signalée à enrichir | unit |
| AC-04-03 | Lien vers guide public ville | integration |
| AC-05-01 | Liste utilisateurs consultative | contract |
| AC-05-02 | Filtre utilisateurs par rôle | contract |
| AC-05-03 | Users soft-deleted exclus par défaut | contract |

---

## Out of Scope

- Création, modification ou désactivation de villes.
- Refresh Gemini manuel, TTL Gemini éditable, prompts Gemini ou configuration IA.
- Création, édition, désactivation ou réordonnancement des catégories/sous-catégories : couvert par `017-admin-taxonomy`.
- Acquisition POI, création manuelle POI, matching Google Places, validation candidats ou demandes POI manquants : couvert par `018-poi-acquisition-pipeline`.
- Paiements Stripe réels, revenus, factures, Customer Portal, Checkout, webhooks, commissions.
- Désactivation de comptes, changement de rôle, impersonation utilisateur.
- Logs d'audit consultables.
- Modération d'avis Tourist.

---

## Open Questions

Aucune — spec prête pour validation Product Owner.
