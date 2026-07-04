# Spec — 017 Admin Taxonomy

## Metadata

```yaml
id: 017-admin-taxonomy
title: "Super-admin — Gestion des catégories et sous-catégories"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-24
updated_at: 2026-05-24
depends_on: [002-categories]
bounded_context: admin
```

---

## Context

StayLocal utilise des `Category` et `SubCategory` pour structurer le Guide public et classer les POI collectés ou enrichis par Gemini. La taxonomie actuelle est seedée en base, mais le produit doit pouvoir évoluer : restaurants, cafés, randonnées, soins, shopping, culture, loisirs, bars, mobilité, famille, urgences, puis d'autres catégories si le marché le demande.

Cette spec donne au rôle `admin` la capacité de gérer cette taxonomie depuis le Super-Admin, sans figer définitivement la liste initiale et sans laisser les Owners ou Merchants modifier la structure globale du Guide.

La liste fournie par le Product Owner est une **taxonomie initiale recommandée**, pas une règle métier immuable. Elle peut être seedée, modifiée, étendue ou désactivée par le Super-Admin selon les besoins.

---

## Glossary References

- **Admin** : membre de l'équipe StayLocal avec accès complet à `/admin`
- **Category** : regroupement thématique de POI
- **SubCategory** : subdivision d'une Category
- **POI** : point d'intérêt appartenant à une Category et SubCategory
- **Guide** : ensemble des catégories visibles pour une City
- **Soft Delete** : suppression logique via `deleted_at`
- **Gemini Fetch** : récupération de POI par City + Category
- **Cache TTL** : durée de validité d'un résultat Gemini par Category

---

## User Stories

### US-01 — Lister la taxonomie

**As an** Admin  
**I want to** consulter les catégories et sous-catégories configurées  
**So that** je comprenne la structure utilisée par le Guide public et Gemini

#### Acceptance Criteria

- **AC-01-01**: Given un Admin authentifié, When il ouvre `/admin/taxonomy`, Then il voit toutes les catégories actives et inactives triées par `sort_order`
- **AC-01-02**: Given une catégorie listée, When elle s'affiche, Then elle montre : nom, slug, icône, ordre, statut, nombre de sous-catégories, nombre de POI actifs
- **AC-01-03**: Given une catégorie listée, When l'Admin l'ouvre, Then ses sous-catégories sont affichées triées par `sort_order`

### US-02 — Créer une catégorie

**As an** Admin  
**I want to** créer une nouvelle catégorie  
**So that** StayLocal puisse couvrir de nouveaux types de POI

#### Acceptance Criteria

- **AC-02-01**: Given un formulaire valide, When l'Admin crée une Category, Then elle est créée avec `is_active = true`, `deleted_at = null` et un `sort_order` défini
- **AC-02-02**: Given un slug déjà utilisé par une Category existante ou supprimée logiquement, When l'Admin soumet le formulaire, Then l'API retourne `409 SLUG_ALREADY_EXISTS`
- **AC-02-03**: Given un icon slug Lucide invalide ou vide, When l'Admin soumet le formulaire, Then l'API retourne `400 INVALID_ICON`

### US-03 — Modifier une catégorie

**As an** Admin  
**I want to** modifier une catégorie existante  
**So that** je puisse adapter l'affichage public sans déploiement

#### Acceptance Criteria

- **AC-03-01**: Given une Category existante, When l'Admin modifie `name`, `icon`, `sort_order` ou `is_active`, Then les modifications sont sauvegardées
- **AC-03-02**: Given une Category liée à au moins 1 POI actif, When l'Admin tente de modifier son `slug`, Then l'API retourne `409 SLUG_LOCKED`
- **AC-03-03**: Given une Category sans POI actif et sans dépendance active, When l'Admin modifie son `slug`, Then le nouveau slug est sauvegardé s'il est unique
- **AC-03-04**: Given une Category désactivée, When le Guide public s'affiche, Then cette Category n'apparaît jamais, même si elle contient des POI

### US-04 — Créer et modifier les sous-catégories

**As an** Admin  
**I want to** gérer les sous-catégories d'une catégorie  
**So that** le Tourist puisse filtrer les POI avec une granularité pertinente

#### Acceptance Criteria

- **AC-04-01**: Given une Category active, When l'Admin crée une SubCategory valide, Then elle est rattachée à cette Category avec `is_active = true`
- **AC-04-02**: Given un slug déjà utilisé par une SubCategory existante ou supprimée logiquement, When l'Admin soumet le formulaire, Then l'API retourne `409 SLUG_ALREADY_EXISTS`
- **AC-04-03**: Given une SubCategory liée à au moins 1 POI actif, When l'Admin tente de modifier son `slug`, Then l'API retourne `409 SLUG_LOCKED`
- **AC-04-04**: Given une SubCategory désactivée, When une page catégorie publique s'affiche, Then cette SubCategory n'apparaît pas dans les filtres

### US-05 — Désactiver sans supprimer physiquement

**As an** Admin  
**I want to** désactiver une catégorie ou sous-catégorie  
**So that** elle disparaisse du Guide sans perte d'historique

#### Acceptance Criteria

- **AC-05-01**: Given une Category, When l'Admin clique "Désactiver", Then `is_active = false` et aucun enregistrement n'est supprimé physiquement
- **AC-05-02**: Given une SubCategory, When l'Admin clique "Désactiver", Then `is_active = false` et aucun enregistrement n'est supprimé physiquement
- **AC-05-03**: Given une Category désactivée, When Gemini Fetch cherche les catégories à enrichir, Then cette Category n'est pas utilisée
- **AC-05-04**: Given une SubCategory désactivée, When un POI conserve cette référence historique, Then le POI reste valide mais la SubCategory n'est pas proposée comme filtre public

### US-06 — Initialiser une taxonomie recommandée

**As an** Admin  
**I want to** disposer d'une taxonomie initiale cohérente  
**So that** StayLocal puisse démarrer avec une structure éditable

#### Acceptance Criteria

- **AC-06-01**: Given une base sans catégories, When le seed de taxonomie est exécuté, Then les catégories recommandées sont créées avec leurs sous-catégories
- **AC-06-02**: Given une base contenant déjà des catégories, When le seed est exécuté, Then il utilise des upserts non destructifs et ne désactive pas les catégories existantes
- **AC-06-03**: Given le Guide public, When les catégories seedées n'ont aucun POI visible dans une City, Then elles restent absentes du Guide conformément à `002-categories`

---

## Business Rules

- **BR-01**: Seul le rôle `admin` peut accéder aux routes `/admin/taxonomy` et `/api/admin/taxonomy/*`.
- **BR-02**: `Owner`, `Merchant` et `Tourist` ne peuvent jamais créer, modifier, désactiver ou réordonner la taxonomie globale.
- **BR-03**: `Tous` est un filtre UI public, jamais une `Category` en base.
- **BR-04**: La taxonomie recommandée est éditable par l'Admin et ne constitue pas une liste figée.
- **BR-05**: `Category.slug` et `SubCategory.slug` sont globalement uniques, y compris après soft delete, pour éviter de recycler une URL publique historique.
- **BR-06**: Un slug est modifiable uniquement tant que l'entité n'a aucun POI actif et aucune dépendance active (`GeminiCache`, `CacheTtlConfig`, personnalisation Owner, analytics exploitable).
- **BR-07**: Les noms, icônes, ordres et statuts sont modifiables même si l'entité est utilisée par des POI.
- **BR-08**: Toute désactivation utilise `is_active = false`. Aucune suppression physique n'est autorisée.
- **BR-09**: Les enregistrements supprimés logiquement utilisent `deleted_at`, mais l'action par défaut exposée en UI est la désactivation, pas la suppression.
- **BR-10**: Une Category inactive est exclue du Guide public, des pages catégories, des filtres Owner `012`, et des déclenchements Gemini.
- **BR-11**: Une SubCategory inactive est exclue des filtres publics et des formulaires admin de classification, mais les POI existants peuvent conserver leur référence historique.
- **BR-12**: Les icônes sont stockées comme slugs Lucide React validés côté serveur.
- **BR-13**: Le réordonnancement est persistant via `sort_order` et ne dépend jamais de l'ordre d'insertion en base.
- **BR-14**: Les changements de taxonomie sont audités avec l'Admin, l'action, la cible et les valeurs avant/après.
- **BR-15**: Cette spec ne change pas les règles d'affichage dynamique de `002-categories` : une catégorie active avec 0 POI visible reste masquée.
- **BR-16**: Gemini reste limité à la découverte et au descriptif de POI ; l'Admin ne configure ici ni prompts libres ni données géographiques.

---

## Initial Recommended Taxonomy

Cette taxonomie sert de seed initial recommandé. Elle peut évoluer depuis le Super-Admin.

| Sort | Category name | Suggested slug | Icon | SubCategories |
|---:|---|---|---|---|
| 1 | Restaurant | `diner` | `utensils` | Restaurants, Gastronomie locale, Ouvert maintenant, Recommandé par l'hôte |
| 2 | Cafés | `cafes` | `coffee` | Petit-déjeuner, Café, Salon de thé |
| 3 | Rando | `rando` | `mountain` | Toutes, Facile, Moyen, Difficile |
| 4 | Soin | `soin` | `sparkles` | Spa, Massage, Bien-être |
| 5 | Shopping | `shopping` | `shopping-bag` | Boutiques locales, Souvenirs, Produits régionaux |
| 6 | Culture | `culture` | `landmark` | Patrimoine, Musées, Monuments |
| 7 | Loisirs | `loisirs` | `bike` | Activités outdoor, Activités indoor, Expériences locales |
| 8 | Bars | `bars` | `wine` | Apéritif, Bar à vin, Sorties |
| 9 | Mobilité | `mobilite` | `car` | Taxi, Navettes, Parking, Gare / transport |
| 10 | Famille | `famille` | `baby` | Activités enfants, Balades faciles, Lieux adaptés famille |
| 11 | Urgences | `urgences` | `cross` | Pharmacie, Médecin, Vétérinaire, Numéros utiles |

Notes :

- `Tous` est rendu par l'UI publique et n'est pas seedé.
- Les slugs ci-dessus sont des suggestions initiales, pas une contrainte définitive.
- Les labels peuvent être renommés sans casser les URLs tant que les slugs restent inchangés.

---

## Data Model

Cette spec réutilise les modèles `Category` et `SubCategory` définis par `002-categories`. Elle ajoute uniquement un modèle d'audit pour les mutations admin et une relation depuis `User`.

```prisma
model Category {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  name        String
  slug        String   @unique
  icon        String
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

model User {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  supabase_id String    @unique
  email       String    @unique
  role        String    @default("owner")
  first_name  String?
  last_name   String?
  phone       String?
  is_active   Boolean   @default(true)

  subscriptions Subscription[]
  lodgings      Lodging[]
  taxonomy_change_logs TaxonomyChangeLog[]
}

model TaxonomyChangeLog {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  admin_id    String
  admin       User     @relation(fields: [admin_id], references: [id])
  action      String   // category_created | category_updated | category_disabled | subcategory_created | subcategory_updated | subcategory_disabled | taxonomy_reordered | seed_applied
  target_type String   // category | subcategory | taxonomy_seed
  target_id   String?
  before      Json?
  after       Json?
}
```

---

## API Contract

```yaml
paths:
  /api/admin/taxonomy:
    get:
      summary: "Lister la taxonomie complète"
      tags: [admin-taxonomy]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Catégories et sous-catégories triées
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/AdminCategory"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/taxonomy/categories:
    post:
      summary: "Créer une catégorie"
      tags: [admin-taxonomy]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CategoryCreateInput"
      responses:
        "201":
          description: Catégorie créée
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/AdminCategory"
        "400":
          $ref: "#/components/responses/ValidationError"
        "409":
          $ref: "#/components/responses/Conflict"

  /api/admin/taxonomy/categories/{id}:
    patch:
      summary: "Modifier une catégorie"
      tags: [admin-taxonomy]
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
              $ref: "#/components/schemas/CategoryPatchInput"
      responses:
        "200":
          description: Catégorie modifiée
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/AdminCategory"
        "400":
          $ref: "#/components/responses/ValidationError"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/Conflict"

  /api/admin/taxonomy/categories/{id}/subcategories:
    post:
      summary: "Créer une sous-catégorie"
      tags: [admin-taxonomy]
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
              $ref: "#/components/schemas/SubCategoryCreateInput"
      responses:
        "201":
          description: Sous-catégorie créée
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/AdminSubCategory"
        "400":
          $ref: "#/components/responses/ValidationError"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/Conflict"

  /api/admin/taxonomy/subcategories/{id}:
    patch:
      summary: "Modifier une sous-catégorie"
      tags: [admin-taxonomy]
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
              $ref: "#/components/schemas/SubCategoryPatchInput"
      responses:
        "200":
          description: Sous-catégorie modifiée
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/AdminSubCategory"
        "400":
          $ref: "#/components/responses/ValidationError"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/Conflict"

components:
  schemas:
    AdminCategory:
      type: object
      required: [id, name, slug, icon, sort_order, is_active, slug_locked, poi_count, subcategory_count, subcategories]
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
        is_active:
          type: boolean
        slug_locked:
          type: boolean
        poi_count:
          type: integer
        subcategory_count:
          type: integer
        subcategories:
          type: array
          items:
            $ref: "#/components/schemas/AdminSubCategory"

    AdminSubCategory:
      type: object
      required: [id, category_id, name, slug, sort_order, is_active, slug_locked, poi_count]
      properties:
        id:
          type: string
        category_id:
          type: string
        name:
          type: string
        slug:
          type: string
        sort_order:
          type: integer
        is_active:
          type: boolean
        slug_locked:
          type: boolean
        poi_count:
          type: integer

    CategoryCreateInput:
      type: object
      required: [name, slug, icon, sort_order]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 80
        slug:
          type: string
          pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
        icon:
          type: string
          minLength: 1
        sort_order:
          type: integer
        is_active:
          type: boolean
          default: true

    CategoryPatchInput:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 80
        slug:
          type: string
          pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
        icon:
          type: string
          minLength: 1
        sort_order:
          type: integer
        is_active:
          type: boolean

    SubCategoryCreateInput:
      type: object
      required: [name, slug, sort_order]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 80
        slug:
          type: string
          pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
        sort_order:
          type: integer
        is_active:
          type: boolean
          default: true

    SubCategoryPatchInput:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 80
        slug:
          type: string
          pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
        sort_order:
          type: integer
        is_active:
          type: boolean

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
              enum: [UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, SLUG_ALREADY_EXISTS, SLUG_LOCKED, INVALID_ICON]
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
    NotFound:
      description: "Ressource introuvable"
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
    Conflict:
      description: "Conflit métier"
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"
```

---

## UI Behaviour

### Page `/admin/taxonomy`

- Interface desktop-first Shadcn/ui.
- Table principale des catégories avec colonnes : ordre, icône, nom, slug, statut, POI actifs, sous-catégories, actions.
- Ligne expandable ou panneau latéral pour afficher les sous-catégories.
- Bouton "Nouvelle catégorie".
- Bouton "Nouvelle sous-catégorie" disponible dans le détail d'une Category.
- Badges visibles : `active`, `inactive`, `slug locked`.
- Action de désactivation avec Dialog de confirmation.
- Aucun bouton de suppression physique.

### Formulaire Category

- Champs : `name`, `slug`, `icon`, `sort_order`, `is_active`.
- Prévisualisation de l'icône Lucide si le slug est valide.
- Le champ `slug` est désactivé si `slug_locked = true`.
- Message explicite si le slug est verrouillé : "Slug verrouillé car cette catégorie est utilisée par des POI ou dépendances actives."

### Formulaire SubCategory

- Champs : `name`, `slug`, `sort_order`, `is_active`.
- Parent Category non modifiable dans cette spec après création.
- Le champ `slug` est désactivé si `slug_locked = true`.

### Etats

- Loading : skeleton table.
- Empty state : "Aucune catégorie configurée" avec CTA "Créer une catégorie".
- Unauthorized : redirection vers `/auth/login`.
- Forbidden : message d'accès refusé.
- Conflict : erreur inline sur le champ concerné.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Liste catégories actives/inactives triées | integration |
| AC-01-02 | Metadata catégorie visible en admin | integration |
| AC-01-03 | Sous-catégories triées affichées | integration |
| AC-02-01 | Création Category valide | contract |
| AC-02-02 | Slug Category unique | contract |
| AC-02-03 | Icon slug validé | unit |
| AC-03-01 | Modification name/icon/order/status | contract |
| AC-03-02 | Slug Category verrouillé si POI actif | contract |
| AC-03-03 | Slug Category modifiable si aucune dépendance | contract |
| AC-03-04 | Category inactive exclue du public | integration |
| AC-04-01 | Création SubCategory valide | contract |
| AC-04-02 | Slug SubCategory unique | contract |
| AC-04-03 | Slug SubCategory verrouillé si POI actif | contract |
| AC-04-04 | SubCategory inactive exclue des filtres publics | integration |
| AC-05-01 | Désactivation Category sans suppression physique | contract |
| AC-05-02 | Désactivation SubCategory sans suppression physique | contract |
| AC-05-03 | Category inactive exclue Gemini Fetch | unit |
| AC-05-04 | POI historique conserve SubCategory inactive | integration |
| AC-06-01 | Seed initial crée la taxonomie recommandée | integration |
| AC-06-02 | Seed idempotent non destructif | integration |
| AC-06-03 | Catégories seedées sans POI masquées publiquement | integration |

---

## Out of Scope

- Gestion complète du dashboard Super-Admin général (`016-dashboard-superadmin`).
- Gestion des villes, claims Merchant, utilisateurs, abonnements et logs globaux.
- Création ou modification de POI.
- Configuration avancée des prompts Gemini.
- Redirections historiques automatiques après changement de slug public.
- Traductions multi-langues de la taxonomie.
- Taxonomie personnalisée par Owner : `012-guide-customization` reste limité à l'ordre et à la sélection du Guide d'un Lodging.
- Données spécialisées randonnées (`TrailDetail`, GPX, dénivelé), réservées à une spec trails dédiée.

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | Les slugs déjà utilisés doivent-ils rester verrouillés, ou faut-il implémenter des redirections historiques ? | Product Owner | 2026-05-24 | Résolu : slugs verrouillés dès qu'ils ont des dépendances actives ; redirections historiques hors scope. |
| OQ-02 | La taxonomie recommandée doit-elle remplacer progressivement les 5 catégories seedées actuelles ou coexister pendant une phase de migration ? | Product Owner | 2026-05-24 | Résolu : migration non destructive par upsert, sans désactivation automatique. |
