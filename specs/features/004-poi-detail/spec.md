# Spec — 004 POI Detail

## Metadata

```yaml
id: 004-poi-detail
title: "Fiche détaillée d'un POI"
status: approved
mvp: 1
owner: "Product Owner"
created_at: 2026-05-20
updated_at: 2026-05-22
depends_on: [001-city-guide, 002-categories, 003-poi-list]
```

---

## Context

La fiche POI est l'écran central de l'expérience Tourist. Elle doit donner toutes les informations nécessaires pour qu'il décide d'y aller, et lui permettre d'agir immédiatement : appeler, obtenir un itinéraire, visiter le site web, réserver. Pour les randonnées, des informations spécifiques supplémentaires sont affichées.

---

## Glossary References

- **POI** : point d'intérêt avec toutes ses données
- **Tourist** : utilisateur sans compte
- **Reservation** : disponible pour certains POI (MVP 4) — bouton présent mais inactif en MVP 1

---

## User Stories

### US-01 — Consulter la fiche d'un POI

**As a** Tourist
**I want to** voir toutes les informations d'un POI
**So that** je puisse décider d'y aller

#### Acceptance Criteria

- **AC-01-01**: Given un POI valide, When la fiche s'affiche, Then sont visibles : nom, catégorie, adresse, horaires, téléphone, site web, note, nombre d'avis, photos, distance
- **AC-01-02**: Given un POI sans téléphone, When la fiche s'affiche, Then le bouton "Appeler" est masqué
- **AC-01-03**: Given un POI sans site web, When la fiche s'affiche, Then le bouton "Site web" est masqué
- **AC-01-04**: Given un POI avec `is_open_now = true`, When la fiche s'affiche, Then un badge vert "Ouvert" est visible avec l'heure de fermeture

### US-02 — Agir depuis la fiche

**As a** Tourist
**I want to** accéder rapidement aux actions principales
**So that** je ne perde pas de temps

#### Acceptance Criteria

- **AC-02-01**: Given un POI avec téléphone, When le Tourist clique "Appeler", Then le téléphone natif s'ouvre avec le numéro pré-rempli (`tel:` link)
- **AC-02-02**: Given un POI avec coordonnées GPS, When le Tourist clique "Itinéraire", Then Mapbox directions s'ouvre (ou Google Maps en fallback)
- **AC-02-03**: Given un POI avec site web, When le Tourist clique "Site web", Then le site s'ouvre dans un nouvel onglet
- **AC-02-04**: Given tout POI, When le Tourist clique "Partager", Then le Web Share API natif s'ouvre avec l'URL de la fiche

### US-03 — Fiche randonnée enrichie

**As a** Tourist
**I want to** voir les informations spécifiques à une randonnée
**So that** je puisse préparer ma sortie

#### Acceptance Criteria

- **AC-03-01**: Given un POI de type randonnée (subcategory: hiking), When la fiche s'affiche, Then sont visibles : niveau de difficulté, durée, distance, dénivelé, point de départ, parking, compatibilité enfants/animaux, saison recommandée
- **AC-03-02**: ~~Tracé Mapbox~~ — déplacé vers spec 005-map (OQ résolu)

---

## Business Rules

- **BR-01**: Les boutons d'action (appeler, itinéraire, site, réserver) n'apparaissent que si la donnée correspondante existe
- **BR-02**: Le bouton "Réserver" est présent dans le DOM mais désactivé en MVP 1 (logique métier prête pour MVP 4)
- **BR-03**: Les photos sont affichées dans un carousel horizontal
- **BR-04**: Si aucune photo n'est disponible, un placeholder avec l'icône de la catégorie est affiché
- **BR-05**: Les horaires sont affichés jour par jour ; le jour courant est mis en évidence

---

## Data Model

> Le modèle `PointOfInterest` est partagé (spec 003). Ce spec ajoute :
> 1. Trois champs Google Places sur `PointOfInterest` (scaffold pour intégration future — OQ-01)
> 2. Le modèle `HikingDetail` lié par `poi_id`
> 3. L'enum `ReviewSource`

```prisma
enum ReviewSource {
  MANUAL
  GOOGLE
}

// Ajouts sur PointOfInterest (spec 004) :
// google_place_id   String?
// review_source     ReviewSource  @default(MANUAL)
// reviews_synced_at DateTime?
// hiking_detail     HikingDetail?

model HikingDetail {
  id                String          @id @default(uuid())
  created_at        DateTime        @default(now())
  updated_at        DateTime        @updatedAt

  poi_id            String          @unique
  poi               PointOfInterest @relation(fields: [poi_id], references: [id])

  difficulty        String          // easy | moderate | hard | expert
  duration_minutes  Int?
  distance_km       Float?
  elevation_gain_m  Int?
  starting_point    String?
  parking_info      String?
  kids_friendly     Boolean         @default(false)
  pets_friendly     Boolean         @default(false)
  best_season       String[]        // [spring, summer, autumn, winter]
  gpx_url           String?         // URL du tracé GPX
}
```

---

## API Contract

```yaml
paths:
  /api/cities/{slug}/categories/{category-slug}/pois/{poi-slug}:
    get:
      summary: "Fiche complète d'un POI"
      tags: [poi-detail]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
        - name: category-slug
          in: path
          required: true
          schema:
            type: string
        - name: poi-slug
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Fiche complète du POI
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: "#/components/schemas/PoiDetail"
        "404":
          $ref: "#/components/responses/NotFound"

components:
  schemas:
    PoiDetail:
      type: object
      required: [id, name, slug, address, latitude, longitude, category_id]
      properties:
        id:
          type: string
        name:
          type: string
        slug:
          type: string
        description:
          type: string
          nullable: true
        address:
          type: string
        latitude:
          type: number
        longitude:
          type: number
        phone:
          type: string
          nullable: true
        website:
          type: string
          nullable: true
        rating:
          type: number
          nullable: true
        rating_count:
          type: integer
        is_open_now:
          type: boolean
          nullable: true
        hours:
          type: object
          nullable: true
        photos:
          type: array
          items:
            type: string
        distance_km:
          type: number
          nullable: true
        category:
          $ref: "#/components/schemas/CategoryRef"
        subcategory:
          $ref: "#/components/schemas/SubCategoryRef"
          nullable: true
        hiking_detail:
          $ref: "#/components/schemas/HikingDetail"
          nullable: true

    HikingDetail:
      type: object
      properties:
        difficulty:
          type: string
          enum: [easy, moderate, hard, expert]
        duration_minutes:
          type: integer
          nullable: true
        distance_km:
          type: number
          nullable: true
        elevation_gain_m:
          type: integer
          nullable: true
        starting_point:
          type: string
          nullable: true
        parking_info:
          type: string
          nullable: true
        kids_friendly:
          type: boolean
        pets_friendly:
          type: boolean
        best_season:
          type: array
          items:
            type: string
        gpx_url:
          type: string
          nullable: true

    CategoryRef:
      type: object
      required: [id, name, slug, icon]
      properties:
        id:
          type: string
        name:
          type: string
        slug:
          type: string
        icon:
          type: string

    SubCategoryRef:
      type: object
      required: [id, name, slug]
      properties:
        id:
          type: string
        name:
          type: string
        slug:
          type: string
```

---

## Mockup de référence

> - `docs/DAT/diagrams/mockups/004-poi-detail/carte-resto-last.html` — Fiche restaurant complète (hero image, actions, horaires)
> - `docs/DAT/diagrams/mockups/004-poi-detail/carte-massage.html` — Fiche bien-être (même structure, contenu adapté)
> - `docs/DAT/diagrams/mockups/004-poi-detail/rando_details.html` — Fiche randonnée enrichie (difficulté, dénivelé, tracé)
>
> **Design system observé :** hero image `h-[450px]` plein largeur, gradient overlay, sheet content `rounded-t-[40px] -mt-8`, action bar sticky bottom, glassmorphism sur boutons flottants.

## UI Behaviour

### Page : `/guide/[city-slug]/[category-slug]/[poi-slug]`

- **Header** : photo principale en plein écran (hero), avec back button overlay
- **Carousel** : photos horizontales scrollables
- **Action bar** sticky en bas : boutons Appeler / Itinéraire / Site / Partager / Réserver
- **Section horaires** : accordéon, jour courant en gras
- **Section carte** : mini-carte Mapbox avec marker du POI (voir spec 005-map)
- **Section randonnée** : bloc conditionnel visible si `hiking_detail` présent
- **Loading state** : skeleton full-page
- **Error state** : "Ce lieu est introuvable" + retour liste

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Tous les champs visibles si présents | integration |
| AC-01-02 | Bouton Appeler masqué si pas de tel | unit |
| AC-01-03 | Bouton Site masqué si pas de site | unit |
| AC-01-04 | Badge Ouvert avec heure fermeture | unit |
| AC-02-01 | Bouton Appeler → `tel:` link | e2e |
| AC-02-02 | Bouton Itinéraire → Mapbox directions | e2e |
| AC-02-03 | Bouton Site → nouvel onglet | e2e |
| AC-02-04 | Bouton Partager → Web Share API | e2e |
| AC-03-01 | Bloc randonnée visible si hiking_detail | integration |
| AC-03-02 | Tracé Mapbox affiché si gpx_url | integration |

---

## Out of Scope

- Avis et notes déposés par les Tourists (MVP 3+)
- Bouton Réserver fonctionnel (MVP 4)
- Photos uploadées par le Merchant (MVP 3)
- Tracé Mapbox sur la fiche randonnée (→ spec 005-map, AC-03-02 déplacé)

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | Afficher les avis Google Places dans la fiche MVP 1 ? | Product Owner | 2026-05-22 | **Résolu** : rating/count depuis la DB uniquement. Les champs `google_place_id`, `review_source`, `reviews_synced_at` sont ajoutés à `PointOfInterest` comme scaffold pour l'intégration MVP 3+. |
| OQ-02 | Fallback itinéraire : Google Maps ou Apple Maps selon le device ? | Product Owner | 2026-05-22 | **Résolu** : Google Maps URL universelle — `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`. Fonctionne iOS + Android sans détection de device. |
