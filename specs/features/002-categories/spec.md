# Spec — 002 Categories

## Metadata

```yaml
id: 002-categories
title: "Menu catégories avec masquage dynamique"
status: review
mvp: 1
owner: ""
created_at: 2026-05-20
updated_at: 2026-05-21
depends_on: [001-city-guide]
```

---

## Context

Le Tourist, une fois sur le guide d'une ville, navigue via un menu de catégories thématiques (Manger, Explorer, Sport, etc.). Ces catégories sont dynamiques : elles ne s'affichent que si elles contiennent au moins un POI pour la ville concernée. Ce mécanisme garantit une interface toujours pertinente, sans catégories vides ou trompeuses.

---

## Glossary References

- **Category** : regroupement thématique de POI
- **SubCategory** : subdivision d'une Category
- **POI** : point d'intérêt appartenant à une Category et SubCategory
- **Guide** : ensemble des catégories visibles pour une City

---

## User Stories

### US-01 — Affichage des catégories disponibles

**As a** Tourist
**I want to** voir uniquement les catégories qui contiennent des POI dans ma ville
**So that** je ne navigue pas vers des sections vides

#### Acceptance Criteria

- **AC-01-01**: Given un Guide chargé, When la liste des catégories s'affiche, Then seules les catégories ayant au moins 1 POI actif sont visibles
- **AC-01-02**: Given une catégorie avec 0 POI, When la page s'affiche, Then cette catégorie est totalement absente du DOM
- **AC-01-03**: Given une catégorie visible, When elle s'affiche, Then elle montre : icône, nom, nombre de POI

### US-02 — Navigation vers une catégorie

**As a** Tourist
**I want to** cliquer sur une catégorie
**So that** je vois la liste des POI correspondants

#### Acceptance Criteria

- **AC-02-01**: Given une catégorie visible, When le Tourist clique dessus, Then il est redirigé vers `/guide/[city-slug]/[category-slug]`
- **AC-02-02**: Given une navigation vers une catégorie, When la page charge, Then les sous-catégories disponibles sont affichées comme filtres

### US-03 — Filtrage par sous-catégorie

**As a** Tourist
**I want to** filtrer les POI par sous-catégorie
**So that** je trouve rapidement ce que je cherche (ex : uniquement les restaurants gastronomiques)

#### Acceptance Criteria

- **AC-03-01**: Given une catégorie avec plusieurs sous-catégories, When le Tourist sélectionne une sous-catégorie, Then seuls les POI de cette sous-catégorie s'affichent
- **AC-03-02**: Given un filtre sous-catégorie actif, When le Tourist le désélectionne, Then tous les POI de la catégorie s'affichent à nouveau

---

## Business Rules

- **BR-01**: Une catégorie est masquée si `poi_count = 0` pour la City courante
- **BR-02**: L'ordre des catégories est fixe et défini par le champ `sort_order` en base
- **BR-03**: Les icônes sont définies en base (slug d'icône Lucide React), pas en dur dans le code
- **BR-04**: Une sous-catégorie vide (0 POI dans la City) est également masquée

---

## Data Model

```prisma
model Category {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  name        String
  slug        String   @unique
  icon        String                  # slug Lucide React (ex: "utensils", "mountain")
  sort_order  Int      @default(0)
  is_active   Boolean  @default(true)

  subcategories SubCategory[]
  pois          PointOfInterest[]
}

model SubCategory {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  name        String
  slug        String   @unique
  category_id String
  category    Category @relation(fields: [category_id], references: [id])
  sort_order  Int      @default(0)
  is_active   Boolean  @default(true)

  pois        PointOfInterest[]
}
```

---

## API Contract

```yaml
paths:
  /api/cities/{slug}/categories:
    get:
      summary: "Liste des catégories disponibles pour une ville"
      tags: [categories]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Catégories avec POI count > 0 uniquement
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/CategoryWithCount"
        "404":
          $ref: "#/components/responses/NotFound"

  /api/cities/{slug}/categories/{category-slug}:
    get:
      summary: "Détail d'une catégorie avec ses sous-catégories disponibles"
      tags: [categories]
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
      responses:
        "200":
          description: Catégorie avec sous-catégories et POI count
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: "#/components/schemas/CategoryDetail"
        "404":
          $ref: "#/components/responses/NotFound"

components:
  schemas:
    CategoryWithCount:
      type: object
      required: [id, name, slug, icon, sort_order, poi_count]
      properties:
        id:
          type: string
        name:
          type: string
        slug:
          type: string
        icon:
          type: string
        sort_order:
          type: integer
        poi_count:
          type: integer
          minimum: 1

    CategoryDetail:
      allOf:
        - $ref: "#/components/schemas/CategoryWithCount"
        - type: object
          properties:
            subcategories:
              type: array
              items:
                $ref: "#/components/schemas/SubCategoryWithCount"

    SubCategoryWithCount:
      type: object
      required: [id, name, slug, poi_count]
      properties:
        id:
          type: string
        name:
          type: string
        slug:
          type: string
        poi_count:
          type: integer
          minimum: 1
```

---

## Mockup de référence

> Placer les fichiers HTML dans `docs/DAT/diagrams/mockups/002-categories/`
> Référencer chaque mockup dans la section UI Behaviour ci-dessous.

## UI Behaviour

### Composant : CategoryGrid

- Grille 2 colonnes sur mobile, 3-4 sur desktop
- Chaque card : icône (Lucide), nom, badge poi_count
- Animation au tap (scale légère)
- Ordre défini par `sort_order`

### Composant : SubCategoryFilter

- Chips horizontaux scrollables sur mobile
- Chip "Tous" toujours présent et actif par défaut
- Chip sélectionné : couleur primaire
- Masquage des chips sans POI

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Seules catégories avec POI affichées | unit |
| AC-01-02 | Catégorie vide absente du DOM | unit |
| AC-01-03 | Icône + nom + count visibles | integration |
| AC-02-01 | Clic → redirection category page | e2e |
| AC-02-02 | Sous-catégories affichées comme filtres | integration |
| AC-03-01 | Filtre sous-catégorie fonctionne | e2e |
| AC-03-02 | Désélection filtre → tous POI | e2e |

---

## Out of Scope

- Catégories personnalisées par hébergeur (MVP 2)
- Ordre personnalisé par hébergeur (MVP 2)
- Ajout de catégories par l'admin (MVP 2+)

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | Faut-il une page catégorie dédiée ou un drawer/modal sur mobile ? | owner | 2026-05-21 | ✅ **Résolu** — Page dédiée. Chaque catégorie navigue vers `/guide/[city-slug]/[category-slug]`. Le bouton retour revient à `/guide/[city-slug]`. Pas de drawer ni de modal. |
