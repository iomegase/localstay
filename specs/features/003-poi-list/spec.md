# Spec — 003 POI List

## Metadata

```yaml
id: 003-poi-list
title: "Liste des POI avec filtres"
status: approved
mvp: 1
owner: "Product Owner"
created_at: 2026-05-20
updated_at: 2026-05-22
depends_on: [001-city-guide, 002-categories]
```

---

## Context

Après avoir sélectionné une catégorie, le Tourist consulte la liste des POI disponibles. Cette liste doit être triée par pertinence (distance, note), filtrable, et afficher suffisamment d'informations pour permettre un choix rapide sans ouvrir chaque fiche. L'expérience doit être fluide sur mobile.

---

## Glossary References

- **POI** : point d'intérêt avec nom, adresse, coordonnées, horaires, note, distance
- **Category** : filtre principal de la liste
- **SubCategory** : filtre secondaire de la liste
- **Tourist** : utilisateur sans compte

---

## User Stories

### US-01 — Consulter la liste des POI d'une catégorie

**As a** Tourist
**I want to** voir la liste des POI d'une catégorie
**So that** je puisse choisir où aller

#### Acceptance Criteria

- **AC-01-01**: Given une catégorie avec POI, When la liste s'affiche, Then les POI sont triés par distance croissante par défaut
- **AC-01-02**: Given une liste de POI, When elle s'affiche, Then chaque card affiche : nom, sous-catégorie, adresse courte, note, distance, photo principale
- **AC-01-03**: Given une liste de POI, When elle s'affiche, Then les POI fermés actuellement sont visuellement différenciés (badge "Fermé")

### US-02 — Filtrer et trier les POI

**As a** Tourist
**I want to** filtrer et trier les POI
**So that** je trouve rapidement ce qui correspond à mes envies

#### Acceptance Criteria

- **AC-02-01**: Given une liste de POI, When le Tourist sélectionne "Trier par note", Then les POI sont triés par note décroissante
- **AC-02-02**: Given une liste de POI, When le Tourist filtre par sous-catégorie, Then seuls les POI de cette sous-catégorie s'affichent
- **AC-02-03**: Given un filtre actif, When le Tourist le supprime, Then la liste revient à son état initial

### US-03 — Accéder à la fiche détaillée

**As a** Tourist
**I want to** cliquer sur un POI de la liste
**So that** je voie toutes ses informations

#### Acceptance Criteria

- **AC-03-01**: Given une card POI, When le Tourist clique dessus, Then il est redirigé vers `/guide/[city-slug]/[category-slug]/[poi-slug]`

---

## Business Rules

- **BR-01**: La distance est calculée depuis le centre géographique de la City (MVP 1) — pas depuis la position GPS du Tourist (opt-in uniquement si autorisé)
- **BR-02**: Un POI avec `is_active = false` n'apparaît jamais dans la liste
- **BR-03**: Un POI `deleted_at non null` n'apparaît jamais dans la liste
- **BR-04**: Le tri par défaut est `distance ASC`
- **BR-05**: Maximum 50 POI affichés au total — pas de pagination (OQ-01 résolu)

---

## Data Model

```prisma
model PointOfInterest {
  id              String      @id @default(uuid())
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt
  deleted_at      DateTime?

  name            String
  slug            String
  description     String?
  address         String
  latitude        Float
  longitude       Float
  phone           String?
  website         String?
  rating          Float?
  rating_count    Int         @default(0)
  is_active       Boolean     @default(true)
  is_open_now     Boolean?
  hours           Json?       # { mon: "09:00-19:00", tue: ... }
  photos          String[]    # tableau d'URLs
  tags            String[]

  city_id         String
  city            City        @relation(fields: [city_id], references: [id])
  category_id     String
  category        Category    @relation(fields: [category_id], references: [id])
  subcategory_id  String?
  subcategory     SubCategory? @relation(fields: [subcategory_id], references: [id])

  gemini_cache    GeminiCache?

  @@unique([city_id, slug])
}
```

---

## API Contract

```yaml
paths:
  /api/cities/{slug}/categories/{category-slug}/pois:
    get:
      summary: "Liste des POI d'une catégorie pour une ville"
      tags: [poi-list]
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
        - name: subcategory
          in: query
          required: false
          schema:
            type: string
        - name: sort
          in: query
          required: false
          schema:
            type: string
            enum: [distance, rating]
            default: distance
      responses:
        "200":
          description: Liste de POI (max 50, non paginée)
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/PoiCard"
        "404":
          $ref: "#/components/responses/NotFound"

components:
  schemas:
    PoiCard:
      type: object
      required: [id, name, slug, address, latitude, longitude, category_id]
      properties:
        id:
          type: string
        name:
          type: string
        slug:
          type: string
        address:
          type: string
        latitude:
          type: number
        longitude:
          type: number
        phone:
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
        distance_km:
          type: number
          nullable: true
        photo_url:
          type: string
          nullable: true
        subcategory:
          type: string
          nullable: true

```

---

## Mockup de référence

> - `docs/DAT/diagrams/mockups/003-poi-list/listing-cafes.html` — Liste POI cafés avec cards, filtres, distance
> - `docs/DAT/diagrams/mockups/003-poi-list/listing-randos.html` — Liste POI randonnées avec badges difficulté
>
> **Design system observé :** cards avec photo hero, badge sous-catégorie, distance, note. Header sticky glassmorphism. Même charte que home.html.

## UI Behaviour

### Page : `/guide/[city-slug]/[category-slug]`

> **Relation spec 002** : cette page existe déjà (catégorie + SubCategoryFilter). Spec 003 remplace la liste `<ul>/<li>` simple par des `PoiCard` riches. Le SubCategoryFilter reste inchangé.

- **Loading state**: 6 skeleton cards empilées
- **Empty state**: "Aucun résultat pour cette catégorie" + bouton retour
- **Pas de pagination** — tous les POI chargés en une fois, max 50 (OQ-01 résolu)
- Sticky header avec nom de catégorie + filtres de tri
- Bouton flottant "Voir la carte" en bas à droite (hors scope spec 003 — spec 005)

### Composant : PoiCard

- Photo principale en thumbnail (ratio 16:9)
- Badge "Fermé" si `is_open_now = false`
- Badge "Sponsorisé" si POI mis en avant (logique métier présente, inactive MVP 1)
- Distance en km depuis le centre ville
- Note avec étoile et nombre d'avis

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Tri par distance par défaut | unit |
| AC-01-02 | Card affiche nom, sous-cat, adresse, note, distance, photo | integration |
| AC-01-03 | POI fermé visuellement différencié | unit |
| AC-02-01 | Tri par note fonctionne | unit |
| AC-02-02 | Filtre sous-catégorie fonctionne | integration |
| AC-02-03 | Suppression filtre → reset liste | unit |
| AC-03-01 | Clic card → redirection fiche POI | e2e |

---

## Out of Scope

- Géolocalisation GPS du Tourist (consentement requis, hors MVP 1)
- Favoris Tourist (nécessite un compte)
- Filtres avancés (ouvert maintenant, note minimum, etc.) — MVP 2+

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | Infinite scroll ou pagination classique sur mobile ? | owner | 2026-05-22 | ✅ **Résolu** — Pas de pagination. Tous les POI chargés en une seule requête, cap à 50 côté serveur. |
| OQ-02 | Afficher la distance depuis le centre ville ou proposer l'accès GPS optionnel ? | owner | 2026-05-22 | ✅ **Résolu** — Distance depuis le centre géographique de la City (BR-01). GPS optionnel hors scope MVP 1. |
