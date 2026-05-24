# Spec — 010 Dashboard Owner

## Metadata

```yaml
id: 010-dashboard-owner
title: "Dashboard hébergeur — Shadcn/ui"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-05-23
last_contract_review_at: 2026-05-24
depends_on: [009-auth-owner, 001-city-guide, 002-categories]
```

---

## Context

Le dashboard Owner est l'espace central de l'hébergeur. Il lui permet de visualiser ses logements, consulter les statistiques de consultation de son guide, personnaliser les recommandations affichées aux Tourists, et gérer ses QR codes. Construit avec Shadcn/ui pour une cohérence visuelle et une maintenabilité optimale.

---

## Glossary References

- **Owner** : hébergeur authentifié accédant à `/dashboard`
- **Lodging** : logement rattaché à un Owner et une City
- **Guide** : ensemble des catégories et POI affichés pour une City
- **Subscription** : abonnement Owner (statut `trial` en MVP 2)

---

## User Stories

### US-01 — Vue d'ensemble

**As an** Owner
**I want to** voir un résumé de mon activité au premier coup d'œil
**So that** je comprends comment mon guide est utilisé

#### Acceptance Criteria

- **AC-01-01**: Given un Owner connecté, When il accède à `/dashboard`, Then il voit : nombre de logements, nombre de scans QR code (7 derniers jours), catégories les plus consultées, POI les plus cliqués — avec distinction zone primaire (≤15km) et alentours (15-30km)
- **AC-01-02**: Given un Owner sans logement, When il accède à `/dashboard`, Then un empty state l'invite à créer son premier logement

### US-02 — Gestion des logements

**As an** Owner
**I want to** gérer mes logements
**So that** chaque logement a son propre QR code et ses propres recommandations

#### Acceptance Criteria

- **AC-02-01**: Given la page `/dashboard/lodgings`, When l'Owner la consulte, Then il voit la liste de ses logements avec : nom, ville, statut QR code, nombre de scans
- **AC-02-02**: Given le formulaire de création, When l'Owner soumet nom + ville, Then un Lodging est créé et associé à son compte
- **AC-02-03**: Given un Lodging existant, When l'Owner clique "Modifier", Then il peut changer le nom et la ville

### US-03 — Statistiques

**As an** Owner
**I want to** consulter les statistiques de consultation de mon guide
**So that** je comprends ce qui intéresse mes Tourists

#### Acceptance Criteria

- **AC-03-01**: Given la page `/dashboard/stats`, When l'Owner la consulte, Then il voit : scans QR par jour (graphique 30 jours), top 5 catégories, top 10 POI cliqués
- **AC-03-02**: Given les stats, When elles s'affichent, Then les graphiques utilisent les composants Recharts via Shadcn/ui chart

---

## Business Rules

- **BR-01**: Un Owner ne voit que ses propres logements et statistiques — jamais ceux d'un autre Owner
- **BR-02**: Les statistiques sont calculées uniquement sur les logements de l'Owner connecté
- **BR-03**: Un Owner en statut `trial` a accès à toutes les fonctionnalités du dashboard (gratuit 12 mois)
- **BR-04**: Toute l'interface dashboard utilise Shadcn/ui — pas de composants custom sauf si spec l'impose
- **BR-05**: Le dashboard est responsive — utilisable sur mobile et desktop

---

## Data Model

```prisma
// Extension du modèle QrCode (spec 006) :
// - city_id perd son @unique (une ville peut avoir plusieurs QR codes, un par logement)
// - lodging_id nullable (null = QR code ville niveau spec 006, non null = QR code logement)
model QrCode {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  city_id     String    // @unique retiré — voir décision Gap-2 spec 010
  city        City      @relation(fields: [city_id], references: [id])
  lodging_id  String?
  lodging     Lodging?  @relation(fields: [lodging_id], references: [id])
  url         String
  storage_url String
  is_active   Boolean   @default(true)
}

model Lodging {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  name        String
  owner_id    String
  owner       User     @relation(fields: [owner_id], references: [id])
  city_id     String
  city        City     @relation(fields: [city_id], references: [id])
  is_active   Boolean  @default(true)

  qr_codes    QrCode[]
  analytics   Analytics[]
}

// Analytics est append-only — les événements ne sont jamais modifiés.
// updated_at est volontairement absent (décision Gap-3 spec 010).
model Analytics {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())

  lodging_id  String?
  lodging     Lodging? @relation(fields: [lodging_id], references: [id])
  city_id     String
  city        City     @relation(fields: [city_id], references: [id])
  event_type  String   // qr_scan | category_click | poi_click | phone_click | directions_click
  category_id String?
  poi_id      String?
}

// Ajout sur User (spec 009) — relation lodgings :
model User {
  // ...champs existants spec 009...
  lodgings      Lodging[]
}

// Ajout sur City — relations Lodging et Analytics :
model City {
  // ...champs existants...
  lodgings    Lodging[]
  analytics   Analytics[]
}
```

---

## API Contract

> Authentification : session Supabase par cookie, gérée par `proxy.ts`.
> Chaque route lit la session via `createSupabaseRouteClient()` et vérifie `role === 'owner'`.

```yaml
paths:
  /api/dashboard/overview:
    get:
      summary: "Vue d'ensemble du dashboard Owner"
      tags: [dashboard-owner]
      responses:
        "200":
          description: Métriques principales
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/DashboardOverview"
        "401":
          description: Non authentifié
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "403":
          description: Rôle insuffisant (non owner)
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /api/dashboard/lodgings:
    get:
      summary: "Liste des logements de l'Owner"
      tags: [dashboard-owner]
      responses:
        "200":
          description: Liste des logements avec stats
          content:
            application/json:
              schema:
                type: object
                required: [lodgings]
                properties:
                  lodgings:
                    type: array
                    items:
                      $ref: "#/components/schemas/LodgingItem"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
    post:
      summary: "Créer un logement"
      tags: [dashboard-owner]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, city_id]
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 100
                city_id:
                  type: string
                  format: uuid
                is_active:
                  type: boolean
                  enum: [false]
                  description: "Désactivation uniquement. `true` n'est pas accepté par ce endpoint."
      responses:
        "201":
          description: Logement créé
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LodgingItem"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/dashboard/lodgings/{id}:
    patch:
      summary: "Modifier un logement"
      tags: [dashboard-owner]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 100
                city_id:
                  type: string
                  format: uuid
      responses:
        "200":
          description: Logement mis à jour
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LodgingItem"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"

  /api/dashboard/stats:
    get:
      summary: "Statistiques du guide Owner"
      tags: [dashboard-owner]
      parameters:
        - name: days
          in: query
          schema:
            type: integer
            default: 30
            minimum: 1
            maximum: 365
      responses:
        "200":
          description: Statistiques sur la période
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/DashboardStats"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

components:
  schemas:
    LodgingItem:
      type: object
      required: [id, name, city_id, city_name, is_active, qr_code_status, qr_scan_count, created_at]
      properties:
        id:
          type: string
        name:
          type: string
        city_id:
          type: string
        city_name:
          type: string
        is_active:
          type: boolean
        qr_code_status:
          type: string
          enum: [generated, missing]
          description: "Statut d'affichage uniquement. La génération, régénération et téléchargement relèvent de la spec 011."
        qr_scan_count:
          type: integer
        created_at:
          type: string
          format: date-time

    DashboardOverview:
      type: object
      required: [lodging_count, qr_scans_7d, top_categories, top_pois]
      properties:
        lodging_count:
          type: integer
        qr_scans_7d:
          type: integer
        top_categories:
          $ref: "#/components/schemas/ZoneMetricSet"
        top_pois:
          $ref: "#/components/schemas/ZoneMetricSet"

    ZoneMetricSet:
      type: object
      required: [primary, nearby]
      properties:
        primary:
          type: array
          items:
            $ref: "#/components/schemas/MetricItem"
        nearby:
          type: array
          items:
            $ref: "#/components/schemas/MetricItem"

    MetricItem:
      type: object
      required: [name, clicks]
      properties:
        name: { type: string }
        clicks: { type: integer }

    DashboardStats:
      type: object
      required: [scans_by_day, top_categories, top_pois]
      properties:
        scans_by_day:
          type: array
          items:
            type: object
            required: [date, count]
            properties:
              date: { type: string, format: date }
              count: { type: integer }
        top_categories:
          type: array
          items:
            type: object
            required: [name, clicks]
            properties:
              name: { type: string }
              clicks: { type: integer }
        top_pois:
          type: array
          items:
            type: object
            required: [name, clicks]
            properties:
              name: { type: string }
              clicks: { type: integer }

    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code: { type: string }
            message: { type: string }

  responses:
    Unauthorized:
      description: Non authentifié
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Forbidden:
      description: Rôle insuffisant
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    BadRequest:
      description: Paramètre manquant ou invalide
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    NotFound:
      description: Ressource introuvable ou n'appartient pas à cet Owner
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
```

---

## UI Behaviour

### Layout `/dashboard`
- Sidebar Shadcn/ui (desktop) + bottom nav (mobile)
- Navigation : Accueil · Logements · Statistiques
- Header avec nom de l'Owner + bouton déconnexion
- QR Codes et Mon abonnement : liens désactivés (specs 012 et 013, out of scope MVP 2)

### Page `/dashboard` — Overview
- Cards Shadcn `<Card>` : scans 7j, nombre de logements, catégorie top, POI top
- Les tops catégories et POI distinguent visuellement `zone primaire` et `alentours`; les sections alentours vides ne sont pas affichées.
- Graphique Recharts (via Shadcn `<ChartContainer>`) : scans par jour (30 jours)
- Empty state si `lodging_count === 0` : message + bouton vers `/dashboard/lodgings`

### Page `/dashboard/lodgings`
- `<Table>` Shadcn/ui avec colonnes : Nom, Ville, Statut QR, Scans, Actions
- Bouton "Ajouter un logement" → `<Dialog>` Shadcn avec formulaire nom + sélecteur ville
- Actions : Modifier (ouvre `<Dialog>` pré-rempli), Désactiver (soft delete `is_active = false` + `deleted_at = now()`)
- La page logements affiche seulement le statut QR (`generated` ou `missing`). La génération, régénération et téléchargement restent dans la spec 011.

### Page `/dashboard/stats`
- `<Card>` pour chaque métrique
- `<ChartContainer>` Recharts `BarChart` : scans par jour
- Top 5 catégories et top 10 POI en listes simples

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Overview affiche métriques correctes | integration |
| AC-01-02 | Empty state si aucun logement | unit |
| AC-02-01 | Liste logements avec stats | integration |
| AC-02-02 | Création logement fonctionne | integration |
| AC-02-03 | Modification logement fonctionne | integration |
| AC-03-01 | Stats 30 jours affichées | integration |
| AC-03-02 | Graphiques Recharts via Shadcn | unit |

---

## Out of Scope

- Personnalisation du guide (spec 012)
- QR codes par logement — génération et téléchargement (spec 011)
- Abonnement et facturation (spec 013)
- Ajout manuel de POI (MVP 3)

---

## Open Questions

Aucune — spec complète et approuvée.
