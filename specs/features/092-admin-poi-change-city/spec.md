# Spec — 092 Changer la ville d'un POI depuis l'admin

## Metadata

```yaml
id: 092-admin-poi-change-city
title: "Rattacher un POI à une autre ville, avec redirection 301 de l'ancienne adresse publique"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-07
updated_at: 2026-10-07
depends_on:
  - 064-discovery-taxonomy
  - 068-admin-poi-edit-panel
bounded_context: admin-pois
implementation_gate: "PO 2026-10-07 : « l'adresse d'un POI enregistré dans la mauvaise ville ne peut pas être modifiée (Cani Smile à Passy, enregistré sous Combloux) » ; choix : redirection 301 de l'ancienne URL ; Cani Smile déplacé immédiatement."
```

## Context

La ville d'un POI est fixée à l'acquisition et n'est modifiable nulle part. Un POI importé depuis une
ville voisine (Cani Smile, Passy, rattaché à Combloux) reste dans la mauvaise ville, avec des
coordonnées et des zones (≤ 15 km / 15–30 km) calculées depuis le mauvais centre.

## User Stories

- **AC-01**: Given l'édition admin d'un POI (section « Classification & Localisation »), When l'Admin
  choisit une autre ville active dans le champ « Ville » et enregistre, Then le POI est rattaché à
  cette ville et ses coordonnées sont recalculées depuis le centre de la nouvelle ville (règles de
  zone globales ; adresse à plus de 30 km → refus `MAPBOX_GEOCODE_FAILED`, rien n'est modifié).
- **AC-02**: Given un slug déjà pris dans la ville cible, When le POI y est déplacé, Then il reçoit un
  slug libre (`slug-2`, `slug-3`…) ; sinon son slug est conservé.
- **AC-03**: Given un POI publié sur /decouvrir, When sa ville change, Then l'ancienne adresse
  `/decouvrir/{ancienne-ville}/{catégorie}/{ancien-slug}` redirige en 301 vers la nouvelle ; les pages
  ville / catégorie / POI anciennes et nouvelles sont revalidées.
- **AC-04**: Given une ancienne adresse dont le POI n'est plus publié (brouillon, désactivé, archivé),
  When elle est visitée, Then elle répond 404 (pas de redirection vers une page absente).
- **AC-05**: Le changement de ville est tracé dans le journal d'audit admin (`poi_updated`, avant/après).

## Business Rules

- **BR-01**: Seules les villes actives et non supprimées sont proposées / acceptées (`INVALID_CITY`).
- **BR-02**: Une redirection est enregistrée (ancienne ville + ancien slug → POI) à chaque changement
  de ville ; elle pointe toujours vers l'adresse actuelle du POI (pas de chaîne de redirections).
- **BR-03**: Une vraie page existante l'emporte toujours sur une redirection.

## Data Model

```prisma
model PoiCityRedirect {
  id           String    @id @default(uuid())
  created_at   DateTime  @default(now())
  updated_at   DateTime  @updatedAt
  deleted_at   DateTime?
  from_city_id String
  from_city    City      @relation(fields: [from_city_id], references: [id])
  from_slug    String
  poi_id       String
  poi          PointOfInterest @relation(fields: [poi_id], references: [id])

  @@unique([from_city_id, from_slug])
  @@index([poi_id])
}
```

Migration additive.

## API Contract

`PATCH /api/admin/pois/{id}` (existant) : champ optionnel `city_id: uuid`. Erreurs existantes :
400 `INVALID_CITY`, 409 `MAPBOX_GEOCODE_FAILED` / `MAPBOX_GEOCODE_AMBIGUOUS`.

## UI Behaviour

Champ « Ville » (liste des villes actives) en tête de « Classification & Localisation ». Changer de
ville relance le calcul des coordonnées à l'enregistrement. Aide : « Changer de ville modifie l'adresse
publique ; l'ancienne redirige vers la nouvelle. »

## Acceptance Criteria

AC-01 à AC-05.

## Out of Scope

Redirections lors d'un changement de catégorie ou de nom ; déplacement en masse.

## Open Questions

Aucune.
