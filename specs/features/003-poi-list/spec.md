# Spec — 003 POI List

## Metadata

```yaml
id: 003-poi-list
title: "Liste des POI avec filtres"
status: approved
mvp: 1
owner: "Product Owner"
created_at: 2026-05-20
updated_at: 2026-06-06
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
- **AC-01-02**: Given une liste de POI, When elle s'affiche, Then chaque card affiche : nom, sous-catégorie, adresse courte, note, distance, photo principale. La photo principale publique est la première URL exploitable de `photos`, en ignorant logos, favicons, placeholders et images vides ; elle reste centrée dans le header visuel. Les photos portrait ou carrées sont rendues en `object-cover`; les photos paysage sont rendues en `object-contain` pour préserver leur cadrage.
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

- **BR-01**: Les zones géographiques (`primary` / `nearby`) et le tri serveur par défaut sont calculés depuis le centre géographique de la City.
- **BR-01a**: La distance affichée dans les cards est recalculée depuis la position GPS du Tourist uniquement après consentement explicite via le navigateur. Si le Tourist refuse, si le navigateur ne supporte pas la géolocalisation, ou si la récupération échoue, l'interface conserve la distance depuis le centre-ville.
- **BR-01b**: La position GPS du Tourist n'est jamais persistée en base, jamais envoyée à Gemini, et n'est utilisée que côté client pour l'affichage de distance.
- **BR-02**: Un POI avec `is_active = false` n'apparaît jamais dans la liste
- **BR-03**: Un POI `deleted_at non null` n'apparaît jamais dans la liste
- **BR-04**: Le tri par défaut est `distance ASC`
- **BR-05**: Maximum 50 POI affichés par page et par zone. La pagination est progressive via un bouton "Charger plus" ; l'infinite scroll automatique est hors MVP 1.
- **BR-05a**: Exception validée le 2026-06-04 : la vue "Tous les POI" de la home Guide (`/guide/[city-slug]`) utilise un infinite scroll automatique par lots de 10 POI. Cette exception ne modifie pas les listes par catégorie, qui restent couvertes par BR-05.
- **BR-06**: Les POI sont séparés en deux zones géographiques selon leur distance depuis le centre-ville :
  - **Zone primaire (≤ 15 km)** : affichés dans la liste principale de la catégorie
  - **Zone alentours (15-30 km)** : affichés dans une section distincte "Autres activités aux alentours" en bas de page
  - **Hors périmètre (> 30 km)** : exclus de l'affichage (geocode_status = rejected)
- **BR-07**: La section "Aux alentours" n'est affichée que si elle contient au moins 1 POI
- **BR-08**: Le tri et les filtres s'appliquent indépendamment dans chaque zone

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
  /api/cities/{slug}/pois:
    get:
      summary: "Vue Tous les POI d'une ville pour la home Guide"
      tags: [poi-list]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
        - name: sort
          in: query
          required: false
          schema:
            type: string
            enum: [distance, rating]
            default: distance
        - name: page
          in: query
          required: false
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            default: 10
            maximum: 50
      responses:
        "200":
          description: Liste paginée plate de POI pour infinite scroll
        "404":
          $ref: "#/components/responses/NotFound"

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
        - name: page
          in: query
          required: false
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            default: 20
            maximum: 50
      responses:
        "200":
          description: Liste paginée de POI avec séparation zones primaire / alentours
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: object
                    properties:
                      primary:
                        type: array
                        description: "POI dans un rayon de 15 km"
                        items:
                          $ref: "#/components/schemas/PoiCard"
                      nearby:
                        type: array
                        description: "POI entre 15 et 30 km — section Aux alentours"
                        items:
                          $ref: "#/components/schemas/PoiCard"
                  meta:
                    $ref: "#/components/schemas/PaginationMeta"
        "404":
          $ref: "#/components/responses/NotFound"

components:
  schemas:
    PoiCard:
      type: object
      required: [id, name, slug, address, latitude, longitude, rating_count, is_open_now, distance_km, photo_url, subcategory_name]
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
        subcategory_name:
          type: string
          nullable: true

    PaginationMeta:
      type: object
      required: [total, page, limit, total_pages, primary_total, nearby_total, primary_total_pages, nearby_total_pages]
      properties:
        total:
          type: integer
        page:
          type: integer
        limit:
          type: integer
        total_pages:
          type: integer
          description: "Maximum de primary_total_pages et nearby_total_pages"
        primary_total:
          type: integer
        nearby_total:
          type: integer
        primary_total_pages:
          type: integer
        nearby_total_pages:
          type: integer
```

---

## Mockup de référence

> - `docs/DAT/diagrams/mockups/003-poi-list/listing-cafes.html` — Liste POI cafés avec cards, filtres, distance
> - `docs/DAT/diagrams/mockups/003-poi-list/listing-randos.html` — Liste POI randonnées avec badges difficulté
>
> **Design system observé :** cards avec photo hero, badge sous-catégorie, distance, note. Header sticky glassmorphism. Même charte que home.html.

## UI Behaviour

### Page : `/guide/[city-slug]/[category-slug]`

- **Loading state**: 6 skeleton cards empilées
- **Empty state**: "Aucun résultat pour cette catégorie" + bouton retour
- **Error state**: message erreur + bouton réessayer
- Pagination progressive via bouton "Charger plus" si `meta.total_pages > meta.page`
- Sticky header avec nom de catégorie + filtres de tri
- Bouton flottant "Voir la carte" en bas à droite
- Bouton "Utiliser ma position" visible dans la vue liste. Au clic, le navigateur demande l'autorisation GPS ; si acceptée, les distances affichées dans les cards utilisent la position du Tourist. Aucun stockage de cette position.
- **Section principale** : POI ≤ 15 km — liste normale
- **Section "Aux alentours"** : séparateur visuel + titre "Autres activités aux alentours" + POI entre 15 et 30 km — affichée uniquement si non vide

### Composant : PoiCard

- Photo principale en header visuel : première URL exploitable hors logo/placeholder, position centrée ; rendu `object-cover` pour les photos portrait ou carrées, rendu `object-contain` pour les photos paysage.
- Badge "Fermé" si `is_open_now = false`
- Badge "Sponsorisé" si POI mis en avant (logique métier présente, inactive MVP 1)
- Distance en km depuis le centre ville par défaut, ou depuis la position GPS du Tourist après consentement explicite
- Note avec étoile et nombre d'avis
- Le panneau détaillé de la card fonctionne en accordéon : une seule card POI peut être ouverte à la fois dans une même liste (catégorie ou vue "Tous les POI")

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Tri par distance par défaut | unit |
| AC-01-02 | Card affiche nom, sous-cat, adresse, note, distance, photo exploitable centrée, avec cover en portrait/carré et contain en paysage | integration |
| AC-01-03 | POI fermé visuellement différencié | unit |
| AC-02-01 | Tri par note fonctionne | unit |
| AC-02-02 | Filtre sous-catégorie fonctionne | integration |
| AC-02-03 | Suppression filtre → reset liste | unit |
| AC-03-01 | Clic card → redirection fiche POI | e2e |
| BR-01a | Distance affichée depuis GPS après opt-in, fallback centre-ville | unit |
| BR-01b | Une seule card POI ouverte à la fois par liste | unit |
| BR-05 | Pagination progressive "Charger plus" avec limite max 50 | contract + unit |
| BR-05a | Infinite scroll home Guide "Tous les POI" par lots de 10 | contract + unit |

---

## Out of Scope

- Stockage, tracking ou historisation de la position GPS du Tourist
- Géolocalisation GPS en arrière-plan ou sans interaction explicite
- Favoris Tourist (nécessite un compte)
- Filtres avancés (ouvert maintenant, note minimum, etc.) — MVP 2+

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | Infinite scroll ou pagination classique sur mobile ? | owner | 2026-05-24 / 2026-06-04 | Catégories : pagination progressive via bouton "Charger plus". Home Guide "Tous les POI" : infinite scroll par lots de 10. |
| OQ-02 | Afficher la distance depuis le centre ville ou proposer l'accès GPS optionnel ? | owner | 2026-05-24 | Zones et tri serveur depuis centre-ville ; distance affichée depuis GPS après opt-in, fallback centre-ville |
