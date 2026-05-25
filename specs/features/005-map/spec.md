# Spec — 005 Map

## Metadata

```yaml
id: 005-map
title: "Carte Mapbox interactive"
status: approved
mvp: 1
owner: ""
created_at: 2026-05-20
updated_at: 2026-05-25
depends_on: [003-poi-list, 004-poi-detail]
```

---

## Context

La carte est un accès alternatif aux POI, complémentaire à la liste. Elle permet au Tourist de visualiser spatialement les POI d'une catégorie, de voir ceux qui sont proches de lui, et d'accéder à leur fiche en cliquant sur un marker. Elle est accessible depuis la liste des POI et depuis la fiche détaillée. Chaque chargement de carte est une unité facturée par Mapbox — l'implémentation doit minimiser les rechargements inutiles.

---

## Glossary References

- **Map Load** : chargement d'une instance Mapbox (unité de facturation)
- **POI** : point d'intérêt avec coordonnées GPS (latitude, longitude)
- **Tourist** : utilisateur sans compte

---

## User Stories

### US-01 — Voir les POI sur la carte

**As a** Tourist
**I want to** voir les POI d'une catégorie sur une carte
**So that** je puisse choisir en fonction de leur position géographique

#### Acceptance Criteria

- **AC-01-01**: Given une liste de POI chargée, When le Tourist clique "Voir la carte", Then la carte Mapbox s'affiche avec un marker par POI
- **AC-01-02**: Given la carte affichée, When elle charge, Then elle est centrée sur le centre géographique de la City
- **AC-01-03**: Given plusieurs POI proches, When ils s'affichent, Then un clustering des markers est appliqué (regroupement visuel)

### US-02 — Interagir avec un marker

**As a** Tourist
**I want to** cliquer sur un marker de la carte
**So that** je voie les informations rapides du POI

#### Acceptance Criteria

- **AC-02-01**: Given un marker visible, When le Tourist clique dessus, Then une popup s'affiche avec : nom, photo thumbnail, note, bouton "Voir la fiche"
- **AC-02-02**: Given une popup ouverte, When le Tourist clique "Voir la fiche", Then il est redirigé vers la fiche détaillée du POI
- **AC-02-03**: Given une popup ouverte, When le Tourist clique ailleurs sur la carte, Then la popup se ferme

### US-03 — Carte dans la fiche POI

**As a** Tourist
**I want to** voir la position d'un POI sur une mini-carte dans sa fiche
**So that** je me repère visuellement avant de partir

#### Acceptance Criteria

- **AC-03-01**: Given une fiche POI, When elle s'affiche, Then une mini-carte Mapbox affiche le marker du POI
- **AC-03-02**: Given une mini-carte, When elle est affichée, Then elle est non-interactive (pas de zoom, pas de drag) et utilise un zoom statique rapproché par défaut (`zoom = 16`) pour mieux situer le POI.

---

## Business Rules

- **BR-01**: La carte est un Client Component (`"use client"`) — Mapbox GL JS nécessite le DOM
- **BR-02**: La carte ne se charge qu'au moment où elle devient visible (lazy load / Intersection Observer) pour minimiser les Map Loads
- **BR-03**: Le token Mapbox est exposé côté client via `NEXT_PUBLIC_MAPBOX_TOKEN` — il doit être restreint aux domaines autorisés dans le dashboard Mapbox
- **BR-04**: La mini-carte de la fiche POI est un canvas statique (snapshot Mapbox Static Images API) — pas un Map Load complet
- **BR-05**: Le clustering est activé pour les vues avec plus de 10 markers

---

## Data Model

> Aucun nouveau modèle — les coordonnées sont sur `PointOfInterest` (latitude, longitude).

---

## API Contract

> Aucune route API dédiée — la carte consomme les endpoints existants :
> - `GET /api/cities/{slug}/categories/{category-slug}/pois` pour les markers
> - `GET /api/cities/{slug}/categories/{category-slug}/pois/{poi-slug}` pour la popup

```yaml
# Endpoint Mapbox Static Images (externe, pas de route interne)
# GET https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/
#     pin-s+1a56a0({lng},{lat})/{lng},{lat},{zoom}/{width}x{height}
#     ?access_token={MAPBOX_TOKEN}
# Utilisé pour les mini-cartes statiques dans les fiches POI
```

---

## Mockup de référence

> - `docs/DAT/diagrams/mockups/005-map/carte-liste-des-pois.html` — Vue carte + liste POI en toggle
> - `docs/DAT/diagrams/mockups/005-map/carte.png` — Screenshot carte de référence visuelle
>
> **Design system observé :** carte `h-[520px] rounded-[2.4rem]`, header transparent flottant, bouton filtre glassmorphism, toggle carte/liste en bas.

## UI Behaviour

### Composant : FullMap (carte plein écran)

- Basculement liste ↔ carte via toggle button en haut de page
- Hauteur : 100vh - header height
- Markers custom avec couleur de la catégorie
- Clustering activé si > 10 POI
- Contrôles zoom +/- visibles
- Bouton "Retour à la liste" en overlay

### Composant : MiniMap (carte statique dans fiche POI)

- Image statique Mapbox Static Images API (pas un Map Load)
- Dimensions : 100% largeur × 180px hauteur
- Non-interactive
- Zoom statique par défaut : `16`
- Marker rouge sur le POI
- Lien vers la carte complète au clic

### Composant : Popup (info-bulle marker)

- Photo thumbnail 80×80px
- Nom du POI (max 2 lignes)
- Note avec étoile
- Bouton "Voir la fiche" → navigation vers fiche POI
- Animation slide-up sur mobile

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Carte avec markers affichée au clic | e2e |
| AC-01-02 | Carte centrée sur City | unit |
| AC-01-03 | Clustering si markers proches | unit |
| AC-02-01 | Clic marker → popup avec infos | e2e |
| AC-02-02 | Clic "Voir la fiche" → fiche POI | e2e |
| AC-02-03 | Clic hors popup → fermeture | e2e |
| AC-03-01 | Mini-carte visible dans fiche POI | integration |
| AC-03-02 | Mini-carte non-interactive avec zoom statique rapproché | unit |

---

## Out of Scope

- Géolocalisation GPS du Tourist (consentement requis)
- Tracé d'itinéraire sur la carte plein écran (uniquement fiche randonnée)
- Filtres sur la carte (MVP 2+)

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | Style de carte Mapbox : streets, outdoors, ou custom ? | owner | - | **Resolved** : `outdoors` (adapté au contexte alpin) |
| OQ-02 | Faut-il un toggle liste/carte sur la page catégorie ou une page carte dédiée ? | owner | - | **Resolved** : Toggle sur la page catégorie (même URL, état client) |
