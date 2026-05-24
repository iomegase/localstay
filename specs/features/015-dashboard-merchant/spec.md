# Spec — 015 Dashboard Merchant

## Metadata

```yaml
id: 015-dashboard-merchant
title: "Dashboard Merchant — fiche, statistiques et offres"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-05-24
depends_on: [014-auth-merchant, 003-poi-list, 004-poi-detail, 010-dashboard-owner]
bounded_context: merchant
```

---

## Context

Le dashboard Merchant permet à un commerçant validé via `014-auth-merchant` de gérer la fiche publique de son POI, de consulter ses statistiques de visibilité et de publier des offres spéciales simples.

Le Merchant ne crée pas de POI dans cette spec. Il agit uniquement sur le `PointOfInterest` revendiqué et validé par un admin. Les réservations, abonnements payants, commissions Stripe et réponses aux avis restent hors périmètre.

---

## Glossary References

- **Merchant** : commerçant gérant une fiche POI revendiquée et validée.
- **MerchantProfile** : lien actif entre un `User` de rôle `merchant` et un `PointOfInterest`.
- **POI** : fiche publique affichée dans le guide.
- **Offer** : offre spéciale affichée sur la fiche POI publique tant qu'elle est active et non expirée.
- **Analytics** : événement append-only utilisé pour les statistiques.
- **Soft Delete** : suppression logique via `deleted_at`.

---

## User Stories

### US-01 — Gestion de la fiche

**As a** Merchant validé
**I want to** modifier les informations éditables de ma fiche
**So that** les Tourists voient des informations à jour

#### Acceptance Criteria

- **AC-01-01**: Given un Merchant avec `MerchantProfile.status = active`, When il modifie `name`, `description`, `hours`, `phone` ou `website` depuis `/merchant/profile`, Then les changements sont sauvegardés sur son POI et visibles sur la fiche publique.
- **AC-01-02**: Given un Merchant avec moins de 5 photos, When il uploade une photo valide, Then l'URL Supabase Storage est ajoutée aux photos du POI et visible dans le carousel public.
- **AC-01-03**: Given un Merchant avec déjà 5 photos, When il tente d'uploader une photo supplémentaire, Then l'API retourne `PHOTO_LIMIT_REACHED` et ne modifie pas le POI.
- **AC-01-04**: Given un Merchant actif, When il tente de modifier un POI qui n'est pas lié à son `MerchantProfile`, Then la requête est refusée avec `FORBIDDEN`.

### US-02 — Statistiques de visibilité

**As a** Merchant validé
**I want to** voir combien de Tourists ont consulté et utilisé ma fiche
**So that** je mesure ma visibilité sur la plateforme

#### Acceptance Criteria

- **AC-02-01**: Given la page `/merchant/stats`, When le Merchant la consulte, Then il voit les totaux 30 jours: vues fiche, clics téléphone, clics itinéraire, clics site web.
- **AC-02-02**: Given les vues sur 30 jours, When les stats s'affichent, Then un graphique Recharts affiche une série journalière de 30 points.
- **AC-02-03**: Given des événements `Analytics` d'autres POI, When les stats Merchant sont calculées, Then seuls les événements du POI lié au Merchant sont inclus.

### US-03 — Offres spéciales

**As a** Merchant validé
**I want to** créer des offres spéciales pour les Tourists
**So that** j'attire plus de clients depuis l'application

#### Acceptance Criteria

- **AC-03-01**: Given le formulaire d'offre, When le Merchant crée une offre valide (`title`, `description`, `ends_at`), Then l'offre est créée et visible sur sa fiche POI publique.
- **AC-03-02**: Given une offre expirée, When la fiche publique s'affiche, Then l'offre est masquée automatiquement.
- **AC-03-03**: Given un Merchant avec 3 offres actives non expirées, When il tente d'en créer une quatrième, Then l'API retourne `OFFER_LIMIT_REACHED`.
- **AC-03-04**: Given une offre existante du Merchant, When il la supprime, Then `deleted_at` est renseigné et l'offre disparaît de la fiche publique.

---

## Business Rules

- **BR-01**: Seul un utilisateur `role = merchant` avec `MerchantProfile.status = active` peut accéder au dashboard Merchant fonctionnel.
- **BR-02**: Un Merchant ne peut lire et modifier que le POI lié à son `MerchantProfile`.
- **BR-03**: Les champs POI éditables dans cette spec sont limités à `name`, `description`, `hours`, `phone`, `website` et `photos`.
- **BR-04**: Les champs non éditables par le Merchant sont `city_id`, `category_id`, `subcategory_id`, `latitude`, `longitude`, `address`, `rating`, `rating_count`, `geocode_*`, `review_source`.
- **BR-05**: Maximum 5 photos publiques par POI dans cette spec.
- **BR-06**: Les photos sont stockées dans Supabase Storage, bucket `merchant-poi-photos`, puis référencées dans `PointOfInterest.photos`.
- **BR-07**: Les uploads acceptés sont `image/jpeg`, `image/png`, `image/webp`, taille maximale 5 MB.
- **BR-08**: Maximum 3 offres actives non expirées par POI.
- **BR-09**: Une offre expirée est masquée côté public mais n'est pas automatiquement supprimée.
- **BR-10**: Une suppression d'offre est toujours un soft delete via `deleted_at`.
- **BR-11**: Les modifications de fiche sont appliquées immédiatement sans validation admin.
- **BR-12**: Les statistiques sont calculées depuis `Analytics` sur 30 jours glissants, filtrées par `poi_id`.
- **BR-13**: Les événements Merchant utilisés sont `poi_click`, `phone_click`, `directions_click`, `website_click`.
- **BR-14**: Les routes API doivent retourner le format d'erreur standard du projet.

---

## Data Model

### Existing Models Used

```prisma
model MerchantProfile {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  merchant_id String    @unique
  merchant    User      @relation(fields: [merchant_id], references: [id])

  poi_id      String    @unique
  poi         PointOfInterest @relation(fields: [poi_id], references: [id])

  status      String    @default("active") // active | suspended
  approved_claim_id String @unique
}

model PointOfInterest {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  name        String
  description String?
  phone       String?
  website     String?
  hours       Json?
  photos      String[]

  merchant_profile MerchantProfile?
}

model Analytics {
  id          String    @id @default(uuid())
  created_at  DateTime @default(now())
  lodging_id  String?
  city_id     String
  event_type  String
  category_id String?
  poi_id      String?
}
```

### New Model

```prisma
model MerchantOffer {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  poi_id      String
  poi         PointOfInterest @relation(fields: [poi_id], references: [id])

  title       String
  description String
  ends_at     DateTime
  is_active   Boolean  @default(true)

  @@index([poi_id, deleted_at, is_active, ends_at])
}
```

### Model Amendments

```prisma
model PointOfInterest {
  merchant_offers MerchantOffer[]
}
```

---

## API Contract

```yaml
components:
  schemas:
    MerchantProfileResponse:
      type: object
      required: [id, poi]
      properties:
        id:
          type: string
          format: uuid
        poi:
          type: object
          required: [id, name, description, hours, phone, website, photos, public_url]
          properties:
            id: { type: string, format: uuid }
            name: { type: string }
            description: { type: string, nullable: true }
            hours: { type: object, nullable: true }
            phone: { type: string, nullable: true }
            website: { type: string, nullable: true }
            photos:
              type: array
              items: { type: string, format: uri }
            public_url: { type: string }
    MerchantProfilePatchInput:
      type: object
      additionalProperties: false
      properties:
        name: { type: string, minLength: 1, maxLength: 120 }
        description: { type: string, nullable: true, maxLength: 1000 }
        hours: { type: object, nullable: true }
        phone: { type: string, nullable: true, maxLength: 30 }
        website: { type: string, nullable: true, format: uri }
    MerchantStatsResponse:
      type: object
      required: [period_days, totals, views_series]
      properties:
        period_days: { type: integer, enum: [30] }
        totals:
          type: object
          required: [profile_views, phone_clicks, directions_clicks, website_clicks]
          properties:
            profile_views: { type: integer }
            phone_clicks: { type: integer }
            directions_clicks: { type: integer }
            website_clicks: { type: integer }
        views_series:
          type: array
          minItems: 30
          maxItems: 30
          items:
            type: object
            required: [date, count]
            properties:
              date: { type: string, format: date }
              count: { type: integer }
    MerchantOffer:
      type: object
      required: [id, title, description, ends_at, status]
      properties:
        id: { type: string, format: uuid }
        title: { type: string }
        description: { type: string }
        ends_at: { type: string, format: date-time }
        status:
          type: string
          enum: [active, expired]
    MerchantOfferCreateInput:
      type: object
      additionalProperties: false
      required: [title, description, ends_at]
      properties:
        title: { type: string, minLength: 1, maxLength: 60 }
        description: { type: string, minLength: 1, maxLength: 200 }
        ends_at: { type: string, format: date-time }

paths:
  /api/merchant/profile:
    get:
      summary: "Récupérer la fiche du Merchant actif"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: "Fiche Merchant"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/MerchantProfileResponse"
        "401": { description: "Non authentifié" }
        "403": { description: "Rôle non autorisé ou MerchantProfile inactif" }
    patch:
      summary: "Modifier les champs éditables de la fiche"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/MerchantProfilePatchInput"
      responses:
        "200":
          description: "Fiche mise à jour"
        "400": { description: "Payload invalide" }
        "401": { description: "Non authentifié" }
        "403": { description: "Rôle non autorisé ou POI non lié" }

  /api/merchant/photos:
    post:
      summary: "Uploader une photo de fiche"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [file]
              properties:
                file:
                  type: string
                  format: binary
      responses:
        "201":
          description: "Photo ajoutée"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: object
                    required: [url, photos]
                    properties:
                      url: { type: string, format: uri }
                      photos:
                        type: array
                        items: { type: string, format: uri }
        "400": { description: "Fichier invalide" }
        "409": { description: "PHOTO_LIMIT_REACHED" }

  /api/merchant/stats:
    get:
      summary: "Statistiques de visibilité du POI Merchant"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: "Statistiques 30 jours"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/MerchantStatsResponse"

  /api/merchant/offers:
    get:
      summary: "Liste des offres non supprimées du Merchant"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: "Offres"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/MerchantOffer"
    post:
      summary: "Créer une offre spéciale"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/MerchantOfferCreateInput"
      responses:
        "201": { description: "Offre créée" }
        "400": { description: "Payload invalide" }
        "409": { description: "OFFER_LIMIT_REACHED" }

  /api/merchant/offers/{id}:
    delete:
      summary: "Supprimer une offre spéciale en soft delete"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        "204": { description: "Offre supprimée" }
        "403": { description: "Offre non liée au Merchant" }
        "404": { description: "Offre introuvable" }
```

---

## UI Behaviour

### Layout `/merchant`

- Dashboard Shadcn/ui.
- Desktop: sidebar avec `Ma fiche`, `Statistiques`, `Offres`.
- Mobile: bottom nav avec les mêmes entrées.
- `Mon abonnement` n'est pas affiché comme page active dans cette spec. Si le lien existe globalement, il doit être désactivé avec libellé "Bientôt disponible".

### Page `/merchant/dashboard`

- Résumé compact: nom du POI, statut fiche, nombre de vues 30 jours, nombre d'offres actives.
- CTA vers `Ma fiche`, `Statistiques`, `Offres`.

### Page `/merchant/profile`

- Formulaire Shadcn: `name`, `description`, `hours`, `phone`, `website`.
- Upload photo: bouton ou dropzone, preview après succès, max 5 photos.
- Bouton "Voir ma fiche publique" vers l'URL publique du POI.
- Les champs non éditables sont affichés en lecture seule ou absents.

### Page `/merchant/stats`

- Cards: vues fiche, clics téléphone, clics itinéraire, clics site web.
- Graphique Recharts: vues par jour sur 30 jours.
- État vide: valeurs à zéro et graphique vide, sans erreur.

### Page `/merchant/offers`

- Liste des offres non supprimées avec statut `active` ou `expired`.
- Formulaire création: titre 60 chars, description 200 chars, date de fin future.
- Action suppression: soft delete.

### Public POI Detail Integration

- La fiche publique affiche les photos mises à jour depuis `PointOfInterest.photos`.
- La fiche publique affiche les offres actives non expirées du POI.
- Les actions publiques sur la fiche POI enregistrent les événements `Analytics` nécessaires aux statistiques Merchant.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Modification fiche sauvegardée et visible publiquement | integration |
| AC-01-02 | Upload photo visible dans carousel public | integration |
| AC-01-03 | Limite 5 photos appliquée | contract |
| AC-01-04 | Isolation Merchant sur son POI | contract |
| AC-02-01 | Stats 30 jours: vues, téléphone, itinéraire, site web | integration |
| AC-02-02 | Graphique Recharts avec 30 points | unit |
| AC-02-03 | Stats isolées au POI du Merchant | integration |
| AC-03-01 | Offre créée visible sur fiche publique | integration |
| AC-03-02 | Offre expirée masquée publiquement | unit |
| AC-03-03 | Limite 3 offres actives appliquée | contract |
| AC-03-04 | Suppression offre en soft delete | integration |

---

## Out of Scope

- Création ou revendication de POI: couvert par `014-auth-merchant`.
- Validation admin des modifications de fiche.
- Suppression ou réordonnancement de photos.
- Réservations entrantes: future spec dédiée.
- Abonnement Merchant payant, Stripe Connect et facturation: future spec dédiée.
- Messages clients.
- Réponse aux avis.
- Import Gemini, géocodage, modification d'adresse ou de coordonnées GPS.

---

## Open Questions

Aucune question ouverte. Spec prête pour validation Product Owner.
