# Spec — 022 Admin POI Management

## Metadata

```yaml
id: 022-admin-poi-management
title: "Super-admin — Backoffice POI par ville"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-25
updated_at: 2026-05-25
depends_on:
  - 016-dashboard-superadmin
  - 017-admin-taxonomy
  - 018-poi-acquisition-pipeline
  - 019-trails-acquisition
ui_reference:
  - 020-dashboard-redesign
bounded_context: admin
```

---

## Context

Le Super-Admin dispose déjà d'un cockpit consultatif (`016`), d'une gestion taxonomie (`017`), d'un pipeline d'acquisition POI (`018`) et d'un pipeline randonnée (`019`). Il manque cependant un backoffice opérationnel pour piloter les POI **déjà publiés** à l'échelle de plusieurs villes.

Cette spec ajoute une gestion complète des POI publiés, organisée par City, afin de rendre StayLocal scalable :

- consulter les POI par ville avec filtres et pagination ;
- éditer les champs publics généralistes d'un POI ;
- gérer les photos distantes et l'enrichissement depuis site officiel ;
- désactiver ou archiver sans suppression physique ;
- restaurer un POI archivé si ses dépendances restent valides ;
- relier le flux d'acquisition `018` au contexte ville.

`022` ne remplace pas `018` : les candidats d'acquisition restent gérés par `018`. `022` intervient après publication, sur le catalogue public validé.

`020-dashboard-redesign` sert de référence de grammaire UI mais reste en `review`. Cette spec répète donc les règles visuelles nécessaires pour être autonome.

---

## Glossary References

- **Admin** : membre de l'équipe StayLocal avec accès à `/admin/*`
- **POI** : fiche publique consultable dans le Guide
- **City** : ville de référence du Guide
- **Category** : catégorie globale administrée par `017-admin-taxonomy`
- **SubCategory** : sous-catégorie globale administrée par `017-admin-taxonomy`
- **MerchantProfile** : rattachement actif Merchant ↔ POI
- **Trail Detail** : extension métier randonnée liée à un POI
- **Soft Delete** : suppression logique via `deleted_at`
- **Mapbox** : source de géocodage des coordonnées POI généralistes

---

## User Stories

### US-01 — Lister les POI par ville

**As an** Admin  
**I want to** consulter les POI publiés par City  
**So that** je puisse piloter l'enrichissement local ville par ville

#### Acceptance Criteria

- **AC-01-01**: Given un Admin authentifié, When il ouvre `/admin/pois`, Then il voit un sélecteur de City obligatoire, des KPI locaux et une table de POI filtrée sur cette City.
- **AC-01-02**: Given une City sélectionnée, When des filtres sont appliqués, Then la liste accepte `q`, `category_id`, `subcategory_id`, `status`, `geocode_status`, `photo_status`, `review_source`, `page` et `limit`.
- **AC-01-03**: Given plusieurs pages de résultats, When l'Admin navigue, Then la pagination est stable, triée par `updated_at desc`, puis `name asc`.
- **AC-01-04**: Given une City active sans POI visible, When la page s'affiche, Then un empty state propose "Lancer acquisition" et "Créer POI".
- **AC-01-05**: Given un POI archivé, When `status` est absent, `current`, `active` ou `inactive`, Then il n'apparaît pas dans la liste.

### US-02 — Éditer un POI publié

**As an** Admin  
**I want to** modifier les champs publics généralistes d'un POI  
**So that** la fiche publique reste correcte après validation

#### Acceptance Criteria

- **AC-02-01**: Given un POI existant, When l'Admin ouvre `/admin/pois/{id}`, Then il voit les champs : nom, slug en lecture seule, description, adresse, téléphone, site web, Category, SubCategory, tags POI dans une section dédiée, photos, statut, géocodage, Merchant lié et Trail lié si présent.
- **AC-02-02**: Given un payload valide, When l'Admin sauvegarde, Then les champs éditables sont mis à jour et un audit log `poi_updated` conserve avant/après.
- **AC-02-03**: Given un changement d'adresse, When l'Admin sauvegarde, Then le serveur relance Mapbox avant update.
- **AC-02-03b**: Given l'adresse publique est correcte mais les coordonnées sont obsolètes, When l'Admin active "Recalculer coordonnées" puis sauvegarde, Then le serveur relance Mapbox même si le texte d'adresse n'a pas changé.
- **AC-02-04**: Given un géocodage Mapbox ambigu, When `confirm_geocode_pending_review = false`, Then l'API retourne `409 MAPBOX_GEOCODE_AMBIGUOUS` sans modifier le POI.
- **AC-02-05**: Given un POI randonnée avec `trail_detail`, When l'Admin tente de modifier une donnée métier randonnée, Then l'API retourne `409 TRAIL_FIELDS_LOCKED`.
- **AC-02-06**: Given un changement de Category ou SubCategory, When la cible est inactive ou supprimée logiquement, Then l'API retourne `400 INVALID_CATEGORY` ou `400 INVALID_SUBCATEGORY`.
- **AC-02-07**: Given un POI édité, When le Guide public est consulté, Then les nouvelles données publiques sont visibles si le POI est actif.

### US-03 — Gérer les photos d'un POI

**As an** Admin  
**I want to** gérer les photos distantes d'un POI  
**So that** la fiche publique reste attractive sans re-héberger d'images externes

#### Acceptance Criteria

- **AC-03-01**: Given un POI avec photos, When l'Admin édite la fiche, Then il peut réordonner, retirer ou ajouter des URLs distantes `http(s)` dans la limite de 12 photos.
- **AC-03-02**: Given un POI avec `website`, When l'Admin clique "Rafraîchir photos officielles", Then le scraper officiel de `018` est relancé et fusionne les nouvelles URLs sans doublon.
- **AC-03-03**: Given le site officiel est inaccessible ou sans image exploitable, When le refresh échoue, Then l'API retourne `200` avec `photos_added = 0` et n'efface pas les photos existantes.
- **AC-03-04**: Given une fiche publique avec photos et `website`, When le Tourist consulte le détail, Then l'attribution photo reste affichée selon `018`.
- **AC-03-05**: Given une URL non HTTP(S), un favicon, un logo ou un placeholder, When l'Admin sauvegarde les photos, Then l'API retourne `400 INVALID_PHOTO_URL`.
- **AC-03-06**: Given un POI avec plusieurs photos, When l'Admin choisit une hero image, Then cette photo devient la première entrée du tableau `photos` et donc `primary_photo_url`.

### US-04 — Désactiver, archiver et restaurer un POI

**As an** Admin  
**I want to** masquer ou archiver un POI sans suppression physique  
**So that** les erreurs peuvent être corrigées sans perte d'historique

#### Acceptance Criteria

- **AC-04-01**: Given un POI actif, When l'Admin clique "Désactiver", Then `is_active = false`, `deleted_at = null`, le POI disparaît du Guide et reste éditable dans `/admin/pois`.
- **AC-04-02**: Given un POI actif ou inactif, When l'Admin clique "Archiver", Then `is_active = false`, `deleted_at = now()`, le POI disparaît du Guide et de la liste par défaut.
- **AC-04-03**: Given un POI archivé, When l'Admin filtre `status = archived`, Then le POI est visible avec badge `archived`.
- **AC-04-04**: Given un POI archivé avec City, Category et SubCategory valides, When l'Admin clique "Restaurer", Then `deleted_at = null`, `is_active = false` et un audit log `poi_restored` est créé.
- **AC-04-05**: Given un POI archivé dont City, Category ou SubCategory est invalide, When l'Admin tente de restaurer, Then l'API retourne l'erreur contractuelle correspondante sans restaurer.
- **AC-04-06**: Given une action désactiver, archiver ou restaurer, When elle est déclenchée, Then l'UI affiche une confirmation explicite indiquant l'impact public.

### US-05 — Relier gestion POI et acquisition

**As an** Admin  
**I want to** accéder aux actions d'acquisition depuis une City  
**So that** je puisse compléter rapidement une ville sous-enrichie

#### Acceptance Criteria

- **AC-05-01**: Given une City sélectionnée dans `/admin/pois`, When l'Admin consulte le panneau acquisition, Then il voit les runs `018` de cette City, leur statut et le nombre de candidats en review.
- **AC-05-02**: Given une City sélectionnée, When l'Admin clique "Lancer acquisition", Then il est redirigé ou guidé vers le lancement `018` avec la City préremplie.
- **AC-05-03**: Given un run avec candidats en review, When l'Admin clique "Revoir", Then il ouvre `/admin/poi-acquisition/runs/{id}`.

---

## Business Rules

- **BR-01**: Seul `User.role = admin`, `is_active = true`, `deleted_at = null` peut accéder à `/admin/pois` et `/api/admin/pois/*`.
- **BR-02**: La liste principale est toujours filtrée par City ; aucune liste globale non filtrée n'est affichée dans l'UI.
- **BR-03**: `slug` n'est pas éditable dans `022`. Les URLs historiques restent stables.
- **BR-04**: `name`, `description`, `address`, `phone`, `website`, `category_id`, `subcategory_id`, `tags`, `photos` et `is_active` sont éditables selon les règles de cette spec.
- **BR-05**: Toute modification d'adresse relance le géocodage Mapbox côté serveur. L'Admin peut aussi forcer le recalcul des coordonnées via `force_geocode = true` sans modifier l'adresse.
- **BR-06**: Gemini ne fournit jamais de coordonnées, distances, métriques géographiques ou photos.
- **BR-07**: Les photos admin sont des URLs distantes uniquement. Aucun upload, téléchargement, transformation persistante ou re-hébergement n'est inclus.
- **BR-08**: Les photos sont limitées à 12 URLs par POI.
- **BR-09**: `inactive` signifie `is_active = false` et `deleted_at = null`.
- **BR-10**: `archived` signifie `is_active = false` et `deleted_at != null`.
- **BR-11**: Aucune suppression physique n'est autorisée.
- **BR-12**: Les POI inactifs ou archivés n'apparaissent jamais dans le Guide public.
- **BR-13**: La restauration d'un POI archivé restaure en `inactive`, jamais directement en `active`.
- **BR-14**: Toute mutation admin crée un `PoiAcquisitionAuditLog` avec action, admin, cible, valeurs avant/après.
- **BR-15**: Un POI lié à un `MerchantProfile` actif peut être édité, désactivé ou archivé par Admin ; l'UI doit afficher l'impact sur le Merchant lié avant action sensible.
- **BR-16**: Les champs spécialisés randonnée (`TrailDetail`) ne sont pas éditables dans `022`.
- **BR-17**: Les POI avec `trail_detail` restent gérés comme POI pour les champs communs, mais les données de parcours restent dans `019`/`021`.
- **BR-18**: Les catégories et sous-catégories inactives ne peuvent pas être choisies comme nouvelle classification, mais un POI existant peut conserver une référence historique inactive jusqu'à modification.
- **BR-19**: Les erreurs API suivent le format standard du projet.
- **BR-20**: `PATCH is_active = true` peut réactiver uniquement un POI non archivé, avec City, Category et SubCategory valides, et un `geocode_status` différent de `rejected`.
- **BR-21**: Les tags globaux du POI sont édités dans une section dédiée, séparée des photos. Aucun tag par photo n'est géré dans `022` v1.
- **BR-22**: L'image hero est représentée par `photos[0]`. Sélectionner une hero image réordonne le tableau `photos` sans créer de nouveau champ métier.
- **BR-23**: Le select `SubCategory` affiche uniquement les sous-catégories actives de la `Category` sélectionnée. Changer de `Category` réinitialise la `SubCategory`.

---

## Data Model

Cette spec réutilise les modèles existants. Elle ne crée pas de nouveau modèle métier.

Des index Prisma peuvent être ajoutés à `PointOfInterest` pour la scalabilité des listes admin.

```prisma
model PointOfInterest {
  id                String        @id @default(uuid())
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt
  deleted_at        DateTime?

  name              String
  slug              String
  description       String?
  address           String
  latitude          Float
  longitude         Float
  phone             String?
  website           String?
  photos            String[]
  tags              String[]
  is_active         Boolean       @default(true)

  geocode_status    String        @default("pending")
  geocoded_at       DateTime?
  geocode_provider  String?
  geocode_error     String?
  geocode_attempts  Int           @default(0)

  google_place_id   String?
  review_source     ReviewSource  @default(MANUAL)

  city_id           String
  category_id       String
  subcategory_id    String?

  @@unique([city_id, slug])
  @@index([city_id, deleted_at, is_active, updated_at])
  @@index([city_id, category_id, deleted_at, is_active])
  @@index([city_id, subcategory_id, deleted_at, is_active])
  @@index([city_id, geocode_status, deleted_at])
}

model PoiAcquisitionAuditLog {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  admin_id    String
  action      String   // poi_updated | poi_disabled | poi_archived | poi_restored | poi_photos_refreshed
  target_type String   // poi
  target_id   String?
  before      Json?
  after       Json?
}
```

Notes :

- `PoiAcquisitionAuditLog` est réutilisé pour éviter une table d'audit concurrente.
- `deleted_at` reste le mécanisme unique d'archivage.
- Aucun champ `status` n'est ajouté : le statut admin est calculé depuis `is_active` + `deleted_at`.

---

## API Contract

```yaml
paths:
  /api/admin/pois:
    get:
      summary: "Lister les POI admin par City"
      tags: [admin-pois]
      security:
        - bearerAuth: []
      parameters:
        - { name: city_id, in: query, required: true, schema: { type: string, format: uuid } }
        - { name: q, in: query, required: false, schema: { type: string, maxLength: 120 } }
        - { name: category_id, in: query, required: false, schema: { type: string, format: uuid } }
        - { name: subcategory_id, in: query, required: false, schema: { type: string, format: uuid } }
        - { name: status, in: query, required: false, schema: { type: string, enum: [current, active, inactive, archived], default: current } }
        - { name: geocode_status, in: query, required: false, schema: { type: string } }
        - { name: photo_status, in: query, required: false, schema: { type: string, enum: [with_photos, without_photos] } }
        - { name: review_source, in: query, required: false, schema: { type: string, enum: [MANUAL, GOOGLE] } }
        - { name: page, in: query, required: false, schema: { type: integer, minimum: 1, default: 1 } }
        - { name: limit, in: query, required: false, schema: { type: integer, minimum: 10, maximum: 100, default: 25 } }
      responses:
        "200":
          description: Liste paginée des POI admin
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AdminPoiListResponse"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
  /api/admin/pois/{id}:
    get:
      summary: "Détail complet d'un POI admin"
      tags: [admin-pois]
      security:
        - bearerAuth: []
      parameters:
        - { name: id, in: path, required: true, schema: { type: string, format: uuid } }
      responses:
        "200":
          description: Détail POI admin
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/AdminPoiDetail"
        "404":
          $ref: "#/components/responses/NotFound"

    patch:
      summary: "Modifier un POI publié"
      tags: [admin-pois]
      security:
        - bearerAuth: []
      parameters:
        - { name: id, in: path, required: true, schema: { type: string, format: uuid } }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/AdminPoiPatchInput"
      responses:
        "200":
          description: POI modifié
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/AdminPoiDetail"
        "400":
          $ref: "#/components/responses/ValidationError"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/Conflict"

  /api/admin/pois/{id}/disable:
    post:
      summary: "Désactiver un POI sans suppression logique"
      tags: [admin-pois]
      security:
        - bearerAuth: []
      parameters:
        - { name: id, in: path, required: true, schema: { type: string, format: uuid } }
      responses:
        "200":
          $ref: "#/components/responses/AdminPoiMutationSuccess"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/Conflict"

  /api/admin/pois/{id}/archive:
    post:
      summary: "Archiver un POI par soft delete"
      tags: [admin-pois]
      security:
        - bearerAuth: []
      parameters:
        - { name: id, in: path, required: true, schema: { type: string, format: uuid } }
      responses:
        "200":
          $ref: "#/components/responses/AdminPoiMutationSuccess"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/Conflict"

  /api/admin/pois/{id}/restore:
    post:
      summary: "Restaurer un POI archivé en statut inactive"
      tags: [admin-pois]
      security:
        - bearerAuth: []
      parameters:
        - { name: id, in: path, required: true, schema: { type: string, format: uuid } }
      responses:
        "200":
          $ref: "#/components/responses/AdminPoiMutationSuccess"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/Conflict"

  /api/admin/pois/{id}/refresh-official-photos:
    post:
      summary: "Rafraîchir les photos depuis le site officiel du POI"
      tags: [admin-pois]
      security:
        - bearerAuth: []
      parameters:
        - { name: id, in: path, required: true, schema: { type: string, format: uuid } }
      responses:
        "200":
          description: Résultat refresh photos
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: object
                    required: [photos, photos_added]
                    properties:
                      photos:
                        type: array
                        maxItems: 12
                        items: { type: string, format: uri }
                      photos_added:
                        type: integer
                        minimum: 0
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/Conflict"
```

Note : la création manuelle `POST /api/admin/pois` reste le contrat existant de `018-poi-acquisition-pipeline`. `022` peut fournir un CTA vers ce flux, mais ne modifie pas son contrat.

### Components

```yaml
components:
  schemas:
    AdminPoiStatus:
      type: string
      enum: [active, inactive, archived]

    AdminPoiListResponse:
      type: object
      required: [data, pagination, kpis]
      properties:
        data:
          type: array
          items:
            $ref: "#/components/schemas/AdminPoiListItem"
        pagination:
          type: object
          required: [page, limit, total, total_pages]
          properties:
            page: { type: integer }
            limit: { type: integer }
            total: { type: integer }
            total_pages: { type: integer }
        kpis:
          type: object
          required: [active_count, inactive_count, archived_count, without_photos_count, pending_geocode_count]
          properties:
            active_count: { type: integer }
            inactive_count: { type: integer }
            archived_count: { type: integer }
            without_photos_count: { type: integer }
            pending_geocode_count: { type: integer }

    AdminPoiListItem:
      type: object
      required: [id, name, slug, status, city, category, address, geocode_status, photo_count, review_source, updated_at, public_url]
      properties:
        id: { type: string }
        name: { type: string }
        slug: { type: string }
        status: { $ref: "#/components/schemas/AdminPoiStatus" }
        city: { $ref: "#/components/schemas/AdminPoiCity" }
        category: { $ref: "#/components/schemas/AdminPoiCategory" }
        subcategory:
          nullable: true
          $ref: "#/components/schemas/AdminPoiSubCategory"
        address: { type: string }
        geocode_status: { type: string }
        photo_count: { type: integer }
        primary_photo_url: { type: string, nullable: true }
        review_source: { type: string, enum: [MANUAL, GOOGLE] }
        merchant_attached: { type: boolean }
        has_trail_detail: { type: boolean }
        updated_at: { type: string, format: date-time }
        public_url: { type: string }

    AdminPoiDetail:
      allOf:
        - $ref: "#/components/schemas/AdminPoiListItem"
        - type: object
          required: [description, phone, website, photos, tags, latitude, longitude, slug_editable, trail_fields_locked]
          properties:
            description: { type: string, nullable: true }
            phone: { type: string, nullable: true }
            website: { type: string, nullable: true, format: uri }
            photos:
              type: array
              maxItems: 12
              items: { type: string, format: uri }
            tags:
              type: array
              maxItems: 20
              items: { type: string, minLength: 1, maxLength: 40 }
            latitude: { type: number }
            longitude: { type: number }
            slug_editable: { type: boolean, enum: [false] }
            trail_fields_locked: { type: boolean }

    AdminPoiPatchInput:
      type: object
      properties:
        name: { type: string, minLength: 1, maxLength: 160 }
        description: { type: string, nullable: true, maxLength: 2000 }
        address: { type: string, minLength: 5, maxLength: 255 }
        phone: { type: string, nullable: true, maxLength: 40 }
        website: { type: string, nullable: true, format: uri }
        category_id: { type: string, format: uuid }
        subcategory_id: { type: string, format: uuid, nullable: true }
        tags:
          type: array
          maxItems: 20
          items: { type: string, minLength: 1, maxLength: 40 }
        photos:
          type: array
          maxItems: 12
          items: { type: string, format: uri }
        is_active: { type: boolean }
        force_geocode: { type: boolean, default: false }
        confirm_geocode_pending_review: { type: boolean, default: false }

    AdminPoiCity:
      type: object
      required: [id, name, slug]
      properties:
        id: { type: string }
        name: { type: string }
        slug: { type: string }

    AdminPoiCategory:
      type: object
      required: [id, name, slug]
      properties:
        id: { type: string }
        name: { type: string }
        slug: { type: string }

    AdminPoiSubCategory:
      type: object
      required: [id, name, slug]
      properties:
        id: { type: string }
        name: { type: string }
        slug: { type: string }

  responses:
    AdminPoiMutationSuccess:
      description: "Mutation POI appliquée"
      content:
        application/json:
          schema:
            type: object
            required: [data]
            properties:
              data:
                $ref: "#/components/schemas/AdminPoiDetail"
    Unauthorized:
      description: "Session absente ou expirée"
    Forbidden:
      description: "Rôle non autorisé"
    NotFound:
      description: "POI introuvable"
    ValidationError:
      description: "Entrée invalide"
    Conflict:
      description: "Conflit métier"
```

### Error Codes

```yaml
errors:
  - INVALID_CITY
  - INVALID_CATEGORY
  - INVALID_SUBCATEGORY
  - INVALID_STATUS
  - INVALID_PHOTO_URL
  - MAPBOX_GEOCODE_FAILED
  - MAPBOX_GEOCODE_AMBIGUOUS
  - TRAIL_FIELDS_LOCKED
  - POI_NOT_FOUND
  - POI_NOT_ARCHIVED
  - POI_ALREADY_ARCHIVED
  - FORBIDDEN
```

---

## UI Behaviour

### `/admin/pois`

- Desktop-first, large content width.
- Header conforme à `020` : kicker, titre, description courte, actions principales.
- Actions principales : "Lancer acquisition", "Créer POI".
- City selector obligatoire placé dans le header ou dans la première card.
- KPI cards locales : actifs, inactifs, archivés, sans photos, géocodage à revoir.
- Toolbar table : recherche texte, Category, SubCategory, statut, geocode status, photo status, source.
- Table dense Shadcn avec colonnes :
  - photo ;
  - nom ;
  - Category / SubCategory ;
  - statut ;
  - géocodage ;
  - photos ;
  - source ;
  - Merchant ;
  - dernière mise à jour ;
  - actions.
- Actions rapides : voir public, éditer, refresh photos, désactiver, archiver.
- Les POI archivés s'affichent uniquement si `status = archived`.
- Empty state par City avec deux CTA : "Lancer acquisition" et "Créer POI".

### `/admin/pois/{id}`

- Page formulaire ou drawer pleine largeur, mais route dédiée obligatoire pour deep-link.
- Header : nom POI, badge statut, lien "Voir public", badge `slug verrouillé`.
- Formulaire en sections :
  - identité publique ;
  - classification ;
  - localisation ;
  - tags POI ;
  - photos ;
  - statut et impact public.
- `slug` visible en lecture seule.
- Le select `SubCategory` dépend de la `Category` sélectionnée ; il ne doit jamais afficher les sous-catégories des autres catégories.
- Les tags POI sont édités dans une section dédiée avant les photos et ne sont jamais mélangés avec les photos.
- Dans la section photos, la première photo est marquée "Hero actuelle" ; les autres photos proposent l'action "Définir comme hero", qui réordonne `photos`.
- Si `trail_detail` existe, afficher un bloc "Randonnée liée" avec lien vers le backoffice trails et message "Données parcours verrouillées ici".
- Si `MerchantProfile` actif existe, afficher un bloc d'impact avant désactivation ou archivage.
- Confirmations obligatoires pour désactiver, archiver et restaurer.

### Acquisition intégrée

- Depuis `/admin/pois`, le panneau acquisition liste les derniers runs `018` de la City sélectionnée.
- Le lancement d'acquisition réutilise le flux `018`; `022` ne duplique pas le pipeline.
- Les candidats restent revus sur `/admin/poi-acquisition/runs/{id}`.

### États système

- Loading : skeleton cards + skeleton table.
- Empty : message orienté action par City.
- Error : alerte sans stack trace ni payload technique brut.
- Forbidden : accès refusé ou redirection selon helpers admin existants.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Page `/admin/pois` affiche City selector, KPI locaux, table filtrée City | integration |
| AC-01-02 | Filtres liste admin validés et appliqués | contract |
| AC-01-03 | Pagination stable | contract |
| AC-01-04 | Empty state City avec CTA acquisition/création | integration |
| AC-01-05 | Archivés exclus hors filtre archived | contract |
| AC-02-01 | Détail POI admin affiche champs complets et slug readonly | integration |
| AC-02-02 | PATCH met à jour et audite avant/après | contract |
| AC-02-03 | Changement adresse relance Mapbox | contract |
| AC-02-03b | Recalcul forcé relance Mapbox sans changement d'adresse | unit |
| AC-02-04 | Géocodage ambigu retourne 409 sans update | contract |
| AC-02-05 | Champs randonnée verrouillés | unit |
| AC-02-06 | Category/SubCategory invalides rejetées | contract |
| AC-02-07 | POI actif édité visible publiquement | integration |
| AC-03-01 | Photos distantes éditables, réordonnées, limitées à 12 | contract |
| AC-03-02 | Refresh photos officielles fusionne sans doublon | contract |
| AC-03-03 | Refresh sans image n'efface rien | contract |
| AC-03-04 | Attribution photo publique conservée | integration |
| AC-03-05 | URLs photos invalides rejetées | unit |
| AC-03-06 | Sélection hero image via réordonnancement `photos[0]` | integration |
| AC-04-01 | Désactivation masque du Guide sans `deleted_at` | contract |
| AC-04-02 | Archivage soft delete | contract |
| AC-04-03 | Archivés visibles seulement via filtre | contract |
| AC-04-04 | Restauration revient en inactive | contract |
| AC-04-05 | Restauration bloquée si dépendance invalide | contract |
| AC-04-06 | Confirmations actions sensibles | integration |
| AC-05-01 | Runs acquisition visibles par City | integration |
| AC-05-02 | Lancer acquisition préremplit City | integration |
| AC-05-03 | Lien review run ouvre `018` | integration |

---

## Out of Scope

- Suppression physique de POI.
- Édition du slug public et gestion de redirections historiques.
- Upload de fichiers images, stockage Supabase Storage ou re-hébergement d'images distantes.
- Édition des données métier randonnée (`TrailDetail`, géométrie, dénivelé, durée).
- Création ou modification de Category/SubCategory : couvert par `017`.
- Pipeline candidat Gemini/Google/Mapbox : couvert par `018`.
- Import randonnée Overpass/IGN/site officiel : couvert par `019`.
- Modération d'avis Tourist.
- Prompts Gemini avancés, TTL, jobs opérationnels.
- Revenus, billing, Stripe, plans commerciaux.

---

## Open Questions

Aucune question bloquante. Spec prête pour validation Product Owner.
