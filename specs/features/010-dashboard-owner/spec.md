# Spec — 010 Dashboard Owner

## Metadata

```yaml
id: 010-dashboard-owner
title: "Dashboard hébergeur — Shadcn/ui"
status: draft
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-05-22
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
- **AC-03-02**: Given les stats, When elles s'affichent, Then les graphiques utilisent les composants Recharts via Shadcn/ui

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

model Analytics {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())

  lodging_id  String?
  lodging     Lodging? @relation(fields: [lodging_id], references: [id])
  city_id     String
  city        City     @relation(fields: [city_id], references: [id])
  event_type  String   # qr_scan | category_click | poi_click | phone_click | directions_click
  category_id String?
  poi_id      String?
}
```

---

## API Contract

```yaml
paths:
  /api/dashboard/overview:
    get:
      summary: "Vue d'ensemble du dashboard Owner"
      tags: [dashboard-owner]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Métriques principales
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/DashboardOverview"

  /api/dashboard/lodgings:
    get:
      summary: "Liste des logements de l'Owner"
      tags: [dashboard-owner]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Liste des logements
    post:
      summary: "Créer un logement"
      tags: [dashboard-owner]
      security:
        - bearerAuth: []
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
                city_id:
                  type: string

  /api/dashboard/lodgings/{id}:
    patch:
      summary: "Modifier un logement"
      tags: [dashboard-owner]
      security:
        - bearerAuth: []

  /api/dashboard/stats:
    get:
      summary: "Statistiques du guide Owner"
      tags: [dashboard-owner]
      security:
        - bearerAuth: []
      parameters:
        - name: days
          in: query
          schema:
            type: integer
            default: 30

components:
  schemas:
    DashboardOverview:
      type: object
      properties:
        lodging_count:
          type: integer
        qr_scans_7d:
          type: integer
        top_categories:
          type: array
          items:
            type: object
            properties:
              name: { type: string }
              clicks: { type: integer }
        top_pois:
          type: array
          items:
            type: object
            properties:
              name: { type: string }
              clicks: { type: integer }
```

---

## UI Behaviour

### Layout `/dashboard`
- Sidebar Shadcn/ui (desktop) + bottom nav (mobile)
- Navigation : Accueil · Logements · Statistiques · QR Codes · Mon abonnement
- Header avec nom de l'Owner + bouton déconnexion

### Page `/dashboard` — Overview
- Cards Shadcn : scans 7j, logements, catégorie top, POI top
- Graphique Recharts : scans par jour (30 jours)
- Empty state si aucun logement

### Page `/dashboard/lodgings`
- Table Shadcn/ui avec colonnes : Nom, Ville, QR Code statut, Scans
- Bouton "Ajouter un logement" → Sheet/Dialog Shadcn
- Actions : Modifier, Voir QR code, Supprimer (soft delete)

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

- Personnalisation du guide (spec 011)
- QR codes (spec 012)
- Abonnement et facturation (spec 013)
- Ajout manuel de POI (MVP 3)

---

## Open Questions

Aucune — spec complète et prête pour review.
