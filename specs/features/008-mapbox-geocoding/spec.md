# Spec — 008 Mapbox Geocoding

## Metadata

```yaml
id: 008-mapbox-geocoding
title: "Géocodage des POI via Mapbox API"
status: approved
mvp: 2
owner: ""
created_at: 2026-05-22
updated_at: 2026-05-22
depends_on: [007-gemini-fetch]
```

---

## Context

Les POI créés par le pipeline Gemini Fetch (spec 007) reçoivent les coordonnées du centre-ville comme placeholder (`city_latitude`, `city_longitude`). Cela provoque deux problèmes visibles :

1. **Itinéraire** — le bouton "Itinéraire" de chaque fiche POI envoie vers le même point (centre-ville), quelle que soit l'adresse réelle du POI
2. **Distance** — la distance affichée sur les cards POI est identique pour tous les POI d'une ville, rendant le tri par distance inutile

Ce spec couvre l'enrichissement automatique des coordonnées de chaque POI via l'API Mapbox Geocoding, déclenchée de manière **asynchrone** après chaque Gemini Fetch via une route interne dédiée.

---

## Glossary References

- **Geocoding** : conversion d'une adresse texte en coordonnées GPS (latitude, longitude)
- **Placeholder coords** : coordonnées centre-ville utilisées par défaut quand le géocodage n'a pas encore été effectué
- **Mapbox Geocoding API** : `https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json`
- **geocodeStatus** : état du géocodage d'un POI (`pending` | `success` | `failed` | `rejected`)

---

## User Stories

### US-01 — Coordonnées précises sur les fiches POI

**As a** Tourist
**I want to** que l'itinéraire et la distance de chaque POI soient exacts
**So that** je puisse naviguer vers le bon endroit et trier par distance réelle

#### Acceptance Criteria

- **AC-01-01**: Given un POI avec `geocode_status = pending`, When le géocodage s'exécute, Then ses coordonnées sont mises à jour et `geocode_status` passe à `success`
- **AC-01-02**: Given un POI avec `geocode_status = success`, When le endpoint est appelé, Then ce POI est ignoré (idempotence)
- **AC-01-03**: Given une adresse non trouvée par Mapbox, When le géocodage échoue, Then les coordonnées placeholder sont conservées, `geocode_status` passe à `failed`, l'erreur est loggée et `geocode_attempts` est incrémenté

### US-02 — Validation géographique

**As a** System
**I want to** valider que les coordonnées retournées par Mapbox sont cohérentes
**So that** les POI ne se retrouvent pas géolocalisés à l'autre bout de la France

#### Acceptance Criteria

- **AC-02-01**: Given un résultat Mapbox, When les coordonnées sont à plus de 30 km du centre-ville, Then elles sont rejetées, `geocode_status` passe à `rejected`
- **AC-02-02**: Given un résultat Mapbox valide, When la confidence score est inférieure à 0.5, Then les coordonnées sont rejetées, `geocode_status` passe à `rejected`

---

## Business Rules

- **BR-01**: Le géocodage est déclenché côté serveur uniquement — jamais côté client
- **BR-02**: Seuls les POI avec `geocode_status = pending` sont traités (idempotence)
- **BR-03**: Le token Mapbox utilisé est `NEXT_PUBLIC_MAPBOX_TOKEN` (déjà présent en `.env.local`)
- **BR-04**: Maximum 10 POI géocodés par appel au endpoint (protection coût et timeout)
- **BR-05**: Les erreurs de géocodage sont loggées mais ne bloquent pas — le endpoint retourne toujours 200
- **BR-06**: Le rayon de validation géographique est fixé à 30 km , mais seuls les POI situes dans un rayond de 15 km sont affiches. pour les autres POI situes hors du rayon de 15 km , les affiches en option (autres activites aux alentours)
- **BR-07**: Le endpoint est protégé par `INTERNAL_API_SECRET` (même mécanisme que `/api/internal/gemini-fetch`)
- **BR-08**: Le endpoint est relançable par cron sans effet de bord (idempotent)
- **BR-09**: L'architecture est compatible avec une future queue (Inngest, Trigger.dev, BullMQ) sans changer l'interface

---

## Data Model

Nouveaux champs sur `PointOfInterest` :

```prisma
model PointOfInterest {
  // ... champs existants ...
  geocode_status    String    @default("pending") // pending | success | failed | rejected
  geocoded_at       DateTime?
  geocode_provider  String?   // "mapbox" — prévu pour multi-provider futur
  geocode_error     String?
  geocode_attempts  Int       @default(0)
}
```

---

## API Contract

### POST /api/internal/geocode-pois

Route interne — appelée en fire-and-forget après chaque Gemini Fetch réussi, ou par cron.

```yaml
security:
  - Authorization: Bearer ${INTERNAL_API_SECRET}

requestBody:
  required: false
  properties:
    city_id:
      type: string
      description: Si fourni, limite le batch à cette ville
    limit:
      type: integer
      default: 10
      description: Nombre max de POI à géocoder par appel

responses:
  "200":
    properties:
      geocoded: integer   # POI géocodés avec succès
      failed: integer     # POI en erreur
      rejected: integer   # POI rejetés (hors périmètre ou confidence trop faible)
      skipped: integer    # POI déjà géocodés (idempotence)
```

### Mapbox Geocoding API utilisée

```
GET https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json
  ?country=fr
  &proximity={city_longitude},{city_latitude}
  &limit=1
  &access_token={NEXT_PUBLIC_MAPBOX_TOKEN}
```

---

## UI Behaviour

Invisible pour le Tourist. Après géocodage :
- Les distances sur les cards POI reflètent la vraie distance depuis la ville
- Le bouton "Itinéraire" ouvre Google Maps sur la bonne adresse
- La carte (spec 005) place les markers aux coordonnées exactes

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | POI pending → coordonnées mises à jour, status = success | integration |
| AC-01-02 | POI déjà success → ignoré (idempotence) | unit |
| AC-01-03 | Adresse introuvable → status = failed, erreur loggée, attempts++ | unit |
| AC-02-01 | Résultat > 30 km → status = rejected | unit |
| AC-02-02 | Confidence < 0.5 → status = rejected | unit |

---

## Out of Scope

- Géocodage inversé (coordonnées → adresse)
- Géolocalisation GPS du Tourist (spec séparée)
- Mise à jour automatique des coordonnées si l'adresse d'un POI change (MVP 3+)
- Tracé d'itinéraire Mapbox (spec 005 déjà couvre la carte)

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | Faut-il géocoder en synchrone (dans le Gemini Fetch) ou en asynchrone (job séparé) ? | owner | - | ✅ Asynchrone — route interne `/api/internal/geocode-pois` appelée en fire-and-forget après Gemini Fetch, relançable par cron, compatible future queue |
| OQ-02 | Faut-il stocker la confidence score Mapbox en base pour audit ? | owner | - | ✅ Non pour MVP 2 — loggée côté serveur uniquement. En revanche : `geocode_status`, `geocoded_at`, `geocode_provider`, `geocode_error`, `geocode_attempts` stockés en base |
