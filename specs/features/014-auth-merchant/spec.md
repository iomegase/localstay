# Spec — 014 Auth Merchant

## Metadata

```yaml
id: 014-auth-merchant
title: "Authentification et onboarding Merchant"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-05-24
depends_on: [009-auth-owner, 003-poi-list]
bounded_context: merchant
```

---

## Context

Les Merchants (restaurateurs, prestataires, spas, loueurs, commerces, etc.) accèdent à leur propre espace `/merchant/*`. L'authentification utilise le socle Supabase Auth et la table `User` définis par `009-auth-owner`, avec le rôle `merchant`.

Cette spec couvre uniquement :

- l'inscription et la connexion d'un compte Merchant ;
- l'onboarding Merchant après inscription ;
- la recherche d'un POI existant à revendiquer ;
- la création d'une demande de revendication (`MerchantClaim`) ;
- la validation ou le rejet admin minimal nécessaire pour rattacher un Merchant à un POI ;
- la création du `MerchantProfile`, source de vérité du rattachement Merchant ↔ POI.

Cette spec ne couvre pas encore le dashboard métier Merchant complet, les offres, les réservations, les uploads photo ou les modifications de fiche. Ces capacités relèvent de `015-dashboard-merchant` et de specs futures.

---

## Glossary References

- **Merchant** : commerçant local gérant une fiche POI
- **POI** : point d'intérêt que le Merchant revendique et gère
- **Soft Delete** : suppression logique via `deleted_at`
- **Subscription** : contrat plateforme associé à un User
- **Admin** : membre de l'équipe StayLocal avec accès complet à `/admin`

---

## User Stories

### US-01 — Inscription Merchant

**As a** Merchant  
**I want to** créer un compte StayLocal  
**So that** je puisse revendiquer ma fiche établissement

#### Acceptance Criteria

- **AC-01-01**: Given la page `/auth/register?role=merchant`, When le Merchant soumet un email et un mot de passe valides, Then un compte `User.role = merchant` est créé et il est redirigé vers `/merchant/onboarding`
- **AC-01-02**: Given une inscription Merchant réussie, When le `User` est créé, Then une `Subscription` `trial` est créée selon la logique de `009-auth-owner`
- **AC-01-03**: Given un Merchant connecté sans `MerchantProfile` approuvé, When il tente d'accéder à `/merchant/dashboard`, Then il est redirigé vers `/merchant/onboarding`

### US-02 — Rechercher un POI à revendiquer

**As a** Merchant  
**I want to** rechercher mon établissement existant  
**So that** je puisse demander à gérer la bonne fiche

#### Acceptance Criteria

- **AC-02-01**: Given la page `/merchant/onboarding`, When le Merchant saisit au moins 3 caractères, Then l'API retourne les POI actifs correspondant au nom ou à l'adresse
- **AC-02-02**: Given un POI déjà rattaché à un `MerchantProfile` actif, When il correspond à la recherche, Then il n'est pas proposé comme revendicable
- **AC-02-03**: Given un POI inactif, supprimé ou rejeté géographiquement, When il correspond à la recherche, Then il n'est pas retourné
- **AC-02-04**: Given les résultats de recherche, When ils s'affichent, Then chaque résultat montre : nom, adresse, ville, catégorie, sous-catégorie si disponible

### US-03 — Créer une revendication

**As a** Merchant  
**I want to** revendiquer un POI existant  
**So that** l'équipe StayLocal puisse vérifier que je suis le bon gestionnaire

#### Acceptance Criteria

- **AC-03-01**: Given un POI revendicable, When le Merchant clique "Revendiquer cet établissement", Then une `MerchantClaim` est créée avec `status = pending`
- **AC-03-02**: Given un Merchant qui a déjà une claim `pending`, When il tente d'en créer une seconde, Then l'API retourne `409 CLAIM_ALREADY_PENDING`
- **AC-03-03**: Given un Merchant qui a déjà un `MerchantProfile` actif, When il tente de créer une claim, Then l'API retourne `409 MERCHANT_ALREADY_LINKED`
- **AC-03-04**: Given un POI déjà revendiqué par un `MerchantProfile` actif, When un Merchant tente de le revendiquer, Then l'API retourne `409 POI_ALREADY_CLAIMED`
- **AC-03-05**: Given une claim `pending`, When le Merchant revient sur `/merchant/onboarding`, Then il voit un écran d'attente avec le POI demandé et la date de demande

### US-04 — Validation admin minimale

**As an** Admin  
**I want to** valider ou rejeter une revendication Merchant  
**So that** seul le bon professionnel accède à la fiche POI

#### Acceptance Criteria

- **AC-04-01**: Given une claim `pending`, When un Admin la valide, Then la claim passe à `approved`, un `MerchantProfile` actif est créé, et le Merchant peut accéder à `/merchant/dashboard`
- **AC-04-02**: Given une claim `pending`, When un Admin la rejette avec une note, Then la claim passe à `rejected`, aucun `MerchantProfile` n'est créé, et le Merchant peut refaire une demande
- **AC-04-03**: Given une claim déjà `approved` ou `rejected`, When un Admin tente de la traiter à nouveau, Then l'API retourne `409 CLAIM_ALREADY_REVIEWED`
- **AC-04-04**: Given un utilisateur non-admin, When il appelle une route `/api/admin/merchant-claims/*`, Then l'API retourne `403 FORBIDDEN`

### US-05 — Connexion et routage Merchant

**As a** Merchant  
**I want to** être routé vers le bon écran selon mon état  
**So that** je comprenne où en est mon accès

#### Acceptance Criteria

- **AC-05-01**: Given un Merchant sans claim ni profile, When il se connecte, Then il est redirigé vers `/merchant/onboarding`
- **AC-05-02**: Given un Merchant avec claim `pending`, When il se connecte, Then il est redirigé vers `/merchant/onboarding?status=pending`
- **AC-05-03**: Given un Merchant avec `MerchantProfile.status = active` et `deleted_at = null`, When il se connecte, Then il est redirigé vers `/merchant/dashboard`
- **AC-05-04**: Given un Owner connecté, When il tente d'accéder à `/merchant/onboarding`, Then il reçoit `403` ou une redirection vers son espace Owner

---

## Business Rules

- **BR-01**: Le rôle applicatif du compte Merchant est `merchant`.
- **BR-02**: L'authentification Merchant réutilise Supabase Auth et le modèle `User` de `009-auth-owner`.
- **BR-03**: `MerchantProfile` est la source de vérité du rattachement approuvé Merchant ↔ POI.
- **BR-04**: `MerchantClaim` est une demande vérifiable, pas la source durable d'accès au dashboard.
- **BR-05**: Un Merchant ne peut avoir qu'un seul `MerchantProfile` actif en MVP 2.
- **BR-06**: Un POI ne peut être rattaché qu'à un seul `MerchantProfile` actif.
- **BR-07**: Un Merchant ne peut avoir qu'une seule claim `pending` à la fois.
- **BR-08**: Un POI déjà rattaché à un `MerchantProfile` actif n'est plus revendicable.
- **BR-09**: Les claims suivent uniquement les transitions : `pending -> approved` ou `pending -> rejected`.
- **BR-10**: Une claim rejetée ne bloque pas une nouvelle demande ultérieure.
- **BR-11**: La validation admin minimale est incluse dans cette spec pour débloquer l'onboarding ; le dashboard super-admin complet reste hors scope.
- **BR-12**: Les routes admin de validation/rejet exigent le rôle `admin`.
- **BR-13**: Les POI revendicables doivent être `is_active = true`, `deleted_at = null`, et `geocode_status != rejected`.
- **BR-14**: La recherche onboarding ne retourne jamais de POI supprimé, inactif ou déjà rattaché.
- **BR-15**: Les accès `/merchant/*` exigent une session valide et `User.role = merchant`.
- **BR-16**: Un Merchant sans `MerchantProfile` actif n'accède pas au dashboard Merchant.
- **BR-17**: Les suppressions sont logiques : `deleted_at` uniquement, aucune suppression physique.
- **BR-18**: Les actions de review admin renseignent `reviewed_at`, `reviewed_by`, et peuvent renseigner `admin_note`.
- **BR-19**: Le `Subscription trial` est créé à l'inscription via la même logique que `009`; cette spec ne redéfinit pas les plans ni les prix.
- **BR-20**: Un `MerchantProfile` actif signifie `status = active` et `deleted_at = null`.

---

## Data Model

```prisma
model User {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  supabase_id String    @unique
  email       String    @unique
  role        String    @default("owner") // owner | merchant | admin
  first_name  String?
  last_name   String?
  phone       String?
  is_active   Boolean   @default(true)

  subscriptions Subscription[]
  merchant_profile MerchantProfile?
  merchant_claims MerchantClaim[] @relation("MerchantClaims")
  reviewed_merchant_claims MerchantClaim[] @relation("MerchantClaimReviews")
}

model PointOfInterest {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  name        String
  slug        String
  is_active   Boolean  @default(true)
  geocode_status String @default("pending")

  merchant_profile MerchantProfile?
  merchant_claims MerchantClaim[]
}

model MerchantProfile {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  merchant_id String   @unique
  merchant    User     @relation(fields: [merchant_id], references: [id])

  poi_id      String   @unique
  poi         PointOfInterest @relation(fields: [poi_id], references: [id])

  status      String   @default("active") // active | suspended
  approved_claim_id String @unique
  approved_claim MerchantClaim @relation("ApprovedClaimProfile", fields: [approved_claim_id], references: [id])

  @@index([status])
}

model MerchantClaim {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  merchant_id String
  merchant    User     @relation("MerchantClaims", fields: [merchant_id], references: [id])

  poi_id      String
  poi         PointOfInterest @relation(fields: [poi_id], references: [id])

  status      String   @default("pending") // pending | approved | rejected
  admin_note  String?
  reviewed_at DateTime?
  reviewed_by String?
  reviewer    User?    @relation("MerchantClaimReviews", fields: [reviewed_by], references: [id])

  merchant_profile MerchantProfile? @relation("ApprovedClaimProfile")

  @@index([merchant_id, status])
  @@index([poi_id, status])
}
```

Notes de contraintes :

- Prisma ne permet pas d'exprimer directement un index unique partiel `WHERE status = 'pending'` dans ce fragment. L'unicité "une claim pending par Merchant" et "un POI actif par MerchantProfile" doit être garantie par transaction applicative et tests d'intégration.
- `MerchantProfile.merchant_id @unique` et `MerchantProfile.poi_id @unique` garantissent le MVP 2 : un Merchant actif pour un POI, un POI pour un Merchant.

---

## API Contract

```yaml
paths:
  /api/merchant/onboarding/search:
    get:
      summary: "Rechercher un POI à revendiquer"
      tags: [auth-merchant]
      security:
        - bearerAuth: []
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
            minLength: 3
            maxLength: 120
      responses:
        "200":
          description: "POI revendicables correspondant à la recherche"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/ClaimablePoi"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/merchant/onboarding/claim:
    post:
      summary: "Créer une revendication de POI"
      tags: [auth-merchant]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [poi_id]
              properties:
                poi_id:
                  type: string
      responses:
        "201":
          description: "Claim créée en pending"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/MerchantClaim"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/Conflict"

  /api/merchant/onboarding/status:
    get:
      summary: "Lire l'état d'onboarding du Merchant connecté"
      tags: [auth-merchant]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: "Etat onboarding"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/MerchantOnboardingStatus"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/merchant-claims:
    get:
      summary: "Lister les claims Merchant pending"
      tags: [auth-merchant-admin]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: "Claims pending"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/MerchantClaim"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/merchant-claims/{id}/approve:
    post:
      summary: "Valider une claim Merchant"
      tags: [auth-merchant-admin]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: "Claim approved + MerchantProfile créé"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/MerchantProfile"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/Conflict"

  /api/admin/merchant-claims/{id}/reject:
    post:
      summary: "Rejeter une claim Merchant"
      tags: [auth-merchant-admin]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [admin_note]
              properties:
                admin_note:
                  type: string
                  minLength: 1
                  maxLength: 500
      responses:
        "200":
          description: "Claim rejected"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/MerchantClaim"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/Conflict"

components:
  schemas:
    ClaimablePoi:
      type: object
      required: [id, name, address, city_name, category_name, subcategory_name]
      properties:
        id:
          type: string
        name:
          type: string
        address:
          type: string
        city_name:
          type: string
        category_name:
          type: string
        subcategory_name:
          type: string
          nullable: true

    MerchantClaim:
      type: object
      required: [id, merchant_id, poi_id, status, created_at, reviewed_at, admin_note]
      properties:
        id:
          type: string
        merchant_id:
          type: string
        poi_id:
          type: string
        status:
          type: string
          enum: [pending, approved, rejected]
        created_at:
          type: string
          format: date-time
        reviewed_at:
          type: string
          format: date-time
          nullable: true
        admin_note:
          type: string
          nullable: true

    MerchantProfile:
      type: object
      required: [id, merchant_id, poi_id, status, approved_claim_id]
      properties:
        id:
          type: string
        merchant_id:
          type: string
        poi_id:
          type: string
        status:
          type: string
          enum: [active, suspended]
        approved_claim_id:
          type: string

    MerchantOnboardingStatus:
      type: object
      required: [state, claim, profile]
      properties:
        state:
          type: string
          enum: [needs_claim, pending_review, rejected, approved]
        claim:
          nullable: true
          $ref: "#/components/schemas/MerchantClaim"
        profile:
          nullable: true
          $ref: "#/components/schemas/MerchantProfile"

    ErrorResponse:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message, details]
          properties:
            code:
              type: string
              enum:
                - UNAUTHORIZED
                - FORBIDDEN
                - VALIDATION_ERROR
                - NOT_FOUND
                - CLAIM_ALREADY_PENDING
                - CLAIM_ALREADY_REVIEWED
                - MERCHANT_ALREADY_LINKED
                - POI_ALREADY_CLAIMED
                - POI_NOT_CLAIMABLE
            message:
              type: string
            details:
              type: object

  responses:
    Unauthorized:
      description: "Session absente ou expirée"
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"
    Forbidden:
      description: "Rôle non autorisé"
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"
    ValidationError:
      description: "Entrée invalide"
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"
    NotFound:
      description: "Ressource introuvable"
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"
    Conflict:
      description: "Conflit métier"
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"
```

---

## UI Behaviour

### Page `/auth/register?role=merchant`

- Réutilise l'UI et la logique d'inscription du socle auth.
- Le rôle `merchant` doit être explicite dans la requête validée côté serveur.
- Après succès : redirection vers `/merchant/onboarding`.

### Page `/merchant/onboarding`

- Server route protégée : session valide + rôle `merchant`.
- Si `MerchantProfile.status = active` et `deleted_at = null` existent : redirection vers `/merchant/dashboard`.
- Si claim `pending` existe : écran d'attente.
- Sinon : stepper Shadcn/ui avec recherche puis confirmation.

Étapes :

- Étape 1 : recherche POI par nom ou adresse, minimum 3 caractères.
- Étape 2 : sélection d'un POI revendicable.
- Étape 3 : confirmation "Revendiquer cet établissement".
- Étape 4 : écran d'attente "Votre demande est en cours de validation".

### Page admin minimale `/admin/merchant-claims`

- Liste uniquement les claims `pending`.
- Colonnes : Merchant email, POI, ville, adresse, date de demande.
- Actions : "Valider" et "Rejeter".
- Rejet exige une note admin.
- Cette page est volontairement minimale ; elle pourra être absorbée ou enrichie par une future spec admin.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Inscription merchant → role merchant + onboarding | integration |
| AC-01-02 | Subscription trial créée via logique 009 | integration |
| AC-01-03 | Merchant sans profile redirigé onboarding | integration |
| AC-02-01 | Recherche POI par nom/adresse | contract |
| AC-02-02 | POI déjà rattaché non revendicable | contract |
| AC-02-03 | POI inactif/supprimé/rejeté exclu | contract |
| AC-02-04 | Résultat search affiche metadata POI | integration |
| AC-03-01 | Claim pending créée | contract |
| AC-03-02 | Une seule claim pending par Merchant | contract |
| AC-03-03 | Merchant déjà lié ne peut pas claim | contract |
| AC-03-04 | POI déjà claim actif interdit | contract |
| AC-03-05 | Claim pending affichée en attente | integration |
| AC-04-01 | Admin approve → MerchantProfile actif | integration |
| AC-04-02 | Admin reject → pas de MerchantProfile | integration |
| AC-04-03 | Claim reviewed non retraitable | contract |
| AC-04-04 | Routes admin interdites non-admin | contract |
| AC-05-01 | Login Merchant sans claim/profile → onboarding | e2e |
| AC-05-02 | Login Merchant pending → onboarding pending | e2e |
| AC-05-03 | Login Merchant approved → dashboard | e2e |
| AC-05-04 | Owner interdit sur routes Merchant | e2e |

---

## Out of Scope

- Dashboard Merchant complet (`015-dashboard-merchant`).
- Multi-établissements pour un Merchant.
- Revendication sans POI existant.
- Création ou modification d'un POI par le Merchant.
- Upload de photos Merchant.
- Offres, menus, disponibilités, réservations.
- Emails transactionnels de validation/rejet.
- Dashboard super-admin complet (`016-dashboard-superadmin`).
- Modération avancée et audit admin détaillé.

---

## Open Questions

Aucune — spec approuvée par le Product Owner.
