# Spec — 040 Private Guide Contained Maps

## Metadata

```yaml
id: 040-private-guide-contained-maps
title: "Cartes du guide contenues dans la frame smartphone"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-08-02
updated_at: 2026-08-02
depends_on:
  - 005-map
  - 021-trail-navigation
  - 034-private-guide-app
  - 039-private-guide-departure-frame
bounded_context: private-guide
implementation_gate: "Validation explicite de l'approche 1 par le Product Owner le 2026-08-02"
```

## Context

Le nouveau guide privé partage déjà `GuideMapView` avec la démonstration, mais
son onglet Carte redirige encore vers l'ancienne route `/map`. Cette navigation
quitte la frame smartphone et affiche l'ancien composant du guide privé.

La navigation randonnée `TrailNavigationMap` utilise également une hauteur
`h-screen`, ce qui remplit le navigateur au lieu de rester dans la frame
430 × 820 px validée pour le nouveau guide. Les deux cartes doivent conserver
leurs comportements métier tout en étant visuellement contenues dans le cadre
de téléphone.

Cette spec remplace uniquement, pour la présentation visuelle concernée, la
mention plein écran de `021-trail-navigation`. Le moteur Mapbox, le tracé, le
GPS, les contrôles et les règles de session de `021` restent inchangés.

## Glossary References

- **Guide**
- **Lodging**
- **POI**
- **Trail**
- **Trail Navigation**
- **Tourist**

## User Stories

### US-01 — Ouvrir la carte partagée depuis le guide privé

**As a** Tourist disposant d'un séjour actif  
**I want to** ouvrir la même carte que dans la démonstration  
**So that** je conserve la nouvelle interface sans quitter la frame téléphone

#### Acceptance Criteria

- **AC-01-01**: Given le `GuideApp` privé est affiché, When le Tourist active
  l'onglet Carte du bottom nav, Then `GuideMapView` est rendu dans le
  `GuideApp` sans navigation vers `/map`.
- **AC-01-02**: Given un POI est ouvert, When le Tourist active « Voir sur la
  carte », Then le même `GuideMapView` s'ouvre, le POI reste sélectionné et sa
  carte d'aperçu est affichée.
- **AC-01-03**: Given la carte privée est rendue, Then sa hauteur reste limitée
  à l'espace interne de la frame smartphone et aucune hauteur viewport
  `h-screen` n'est appliquée par la carte.
- **AC-01-04**: Given l'ancienne route `/map` existe, Then elle reste accessible
  pour les anciens liens mais n'est plus ciblée par le bottom nav du nouveau
  `GuideApp` privé.

### US-02 — Afficher la navigation randonnée dans la frame

**As a** Tourist démarrant une randonnée  
**I want to** conserver la carte et ses contrôles dans le cadre du téléphone  
**So that** l'expérience reste cohérente avec le nouveau guide MyStay

#### Acceptance Criteria

- **AC-02-01**: Given une randonnée publiée avec une géométrie fiable, When la
  navigation démarre, Then `TrailNavigationMap` est rendu dans une frame de
  largeur maximale 430 px et de hauteur maximale 820 px, bornée par le
  viewport dynamique.
- **AC-02-02**: Given la navigation randonnée est contenue, Then sa racine
  utilise la hauteur disponible de la frame et non `h-screen`.
- **AC-02-03**: Given la route directe ou la route interceptée de démarrage est
  utilisée, Then la carte conserve la bordure blanche de 5 px, les coins
  fortement arrondis, l'ombre et `overflow-hidden`.
- **AC-02-04**: Given la carte est contenue, Then le tracé Mapbox Outdoor, le
  relief, le HUD, le consentement GPS, le suivi local, Stop et le récapitulatif
  conservent les comportements approuvés dans `021`.
- **AC-02-05**: Given un petit écran, Then la frame reste inférieure au viewport
  avec une marge extérieure et sans débordement horizontal.

## Business Rules

- **BR-01**: `PRIVATE_GUIDE_ROUTES` ne définit plus de destination `map`; sans
  route externe, `GuideApp` utilise sa navigation interne vers `GuideMapView`.
- **BR-02**: L'onglet Carte et « Voir sur la carte » utilisent une seule
  implémentation `GuideMapView`; aucun second composant de carte privée n'est
  créé.
- **BR-03**: La route historique `/map` n'est ni supprimée ni modifiée dans cet
  incrément.
- **BR-04**: La frame smartphone est extraite dans un composant partagé afin
  d'éviter la duplication entre `PrivateGuidePage`, la route randonnée directe
  et la route interceptée.
- **BR-05**: La frame conserve exactement une largeur
  `min(430px, calc(100vw - 24px))`, une hauteur
  `min(820px, calc(100dvh - 24px))`, une bordure blanche de 5 px, des coins
  fortement arrondis et une ombre prononcée.
- **BR-06**: `TrailNavigationMap` expose un mode contenu qui remplace uniquement
  sa hauteur `h-screen` par `h-full`; sa logique métier et sa cartographie ne
  sont pas dupliquées.
- **BR-07**: Aucun `zoom`, aucun `transform: scale()` et aucune hauteur fixe
  supérieure au viewport ne sont autorisés.
- **BR-08**: Aucune règle GPS, géométrie, statistique de session, source Mapbox
  ou donnée randonnée n'est modifiée.
- **BR-09**: Aucune migration Prisma et aucune nouvelle API ne sont nécessaires.

## Data Model

Aucune modification. Les cartes consomment les données `GuidePoi`,
`GuideLodging` et `TrailNavigationData` déjà validées.

## API Contract

Aucun nouvel endpoint. Les routes de démarrage randonnée existantes continuent
d'utiliser `getPublishedTrail`. L'ancienne route `/map` reste inchangée.

## UI Behaviour

### Carte du guide

- L'onglet Carte active la vue interne `map` du `GuideApp`.
- Le header, les filtres et la navigation basse partagés restent dans la frame.
- Un POI transmis par « Voir sur la carte » reste sélectionné et centré.
- L'URL de la page privée ne change pas au clic sur l'onglet Carte.

### Carte randonnée

- La scène extérieure centre la frame sur un fond slate clair.
- La frame conserve les tokens de `039` : 430 × 820 maximum, bordure blanche
  5 px, rayon `2.75rem`, ombre et overflow masqué.
- `TrailNavigationMap` remplit uniquement l'intérieur disponible avec `h-full`.
- Les contrôles flottants restent cliquables et le contenu Mapbox est rogné par
  les coins de la frame.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | integration |
| AC-01-02 | integration |
| AC-01-03 | integration |
| AC-01-04 | unit + integration |
| AC-02-01 | integration |
| AC-02-02 | unit + integration |
| AC-02-03 | integration |
| AC-02-04 | regression integration |
| AC-02-05 | integration + e2e |

## Out of Scope

- Refonte visuelle de `GuideMapView` ou de `TrailNavigationMap`.
- Modification du style Mapbox Outdoor ou ajout d'un fond IGN.
- Modification des règles de consentement ou de suivi GPS.
- Suppression de la route historique `/map`.
- Ajout d'une nouvelle navigation basse dans le mode randonnée.

## Open Questions

Aucune question ouverte.
