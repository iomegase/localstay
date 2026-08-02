# Spec — 035 Private Guide Favorites

## Metadata

```yaml
id: 035-private-guide-favorites
title: "Coups de cœur privés MyStay"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-08-02
updated_at: 2026-08-02
depends_on:
  - 004-poi-detail
  - 012-guide-customization
  - 033-guide-featured-bento
  - 034-private-guide-app
bounded_context: private-guide
implementation_gate: "Demande explicite du Product Owner du 2026-08-02"
```

## Context

La home privée `/sejour` utilise désormais l'application mobile partagée de la
démonstration, mais son accès « Explorer Saint-Gervais » ouvre encore l'ancienne
page `/nos-recommandations`. Ce deuxième incrément crée la page canonique
`/sejour/coups-de-coeur` avec la même vue de favoris que la démonstration MyStay,
alimentée exclusivement par les recommandations réelles du Lodging actif.

## Glossary References

- **Guide**
- **Lodging**
- **Owner Recommendation Comment**
- **POI**
- **Tourist**

## User Stories

### US-01 — Explorer les coups de cœur du séjour

**As a** Tourist disposant d'un séjour actif  
**I want to** ouvrir les coups de cœur depuis la home privée  
**So that** je consulte les recommandations réelles avec l'interface MyStay

#### Acceptance Criteria

- **AC-01-01**: Given un séjour actif, When `/sejour/coups-de-coeur` est
  demandé, Then le `GuideApp` partagé est rendu en `mode="private"` avec
  `initialView="favorites"` et les POI du Lodging actif.
- **AC-01-02**: Given la page affichée, Then son header, ses filtres horizontaux,
  ses cartes bento illustrées et sa navigation basse sont ceux de la
  démonstration MyStay, avec l'onglet cœur actif.
- **AC-01-03**: Given un POI possédant une galerie, Then sa hero image réelle est
  affichée ; Given aucune image exploitable, Then le fallback de catégorie
  existant est affiché et aucune carte ne reste blanche.
- **AC-01-04**: Given les catégories des POI privés, When un filtre est activé,
  Then seules les cartes de cette catégorie restent visibles et le défilement
  horizontal des filtres conserve sa barre masquée.
- **AC-01-05**: Given aucun séjour valide, When la route est demandée, Then
  l'écran d'accès réservé est utilisé et aucune donnée privée n'est chargée.

### US-02 — Utiliser la route canonique depuis tous les accès privés

**As a** Tourist  
**I want to** atteindre la même page depuis Explorer, le cœur et le menu  
**So that** la navigation privée reste cohérente

#### Acceptance Criteria

- **AC-02-01**: Given `/sejour`, When « Explorer Saint-Gervais », l'onglet cœur
  ou « Coups de cœur » est activé, Then la destination est
  `/sejour/coups-de-coeur`.
- **AC-02-02**: Given un ancien lien `/nos-recommandations` avec un séjour actif,
  When il est ouvert, Then il redirige vers `/sejour/coups-de-coeur`.
- **AC-02-03**: Given la nouvelle route, Then le proxy conserve le contrôle
  d'accès privé et le layout public historique ne rajoute ni ancien header ni
  ancienne navigation.

## Business Rules

- **BR-01**: `/sejour/coups-de-coeur` exige le cookie privé `lodging_id` valide.
- **BR-02**: La page réutilise `GuideApp` et `GuideFavoritesPage`; aucune copie
  de leur interface n'est autorisée.
- **BR-03**: Les données proviennent de `getPrivateGuideData` et ne doivent
  importer aucune donnée de démonstration.
- **BR-04**: Les POI affichés restent les `LodgingFeaturedPoi` actifs, non
  supprimés et ordonnés selon la spec 034.
- **BR-05**: La largeur du guide privé reste limitée à 430 px, sans `zoom` ni
  `transform: scale()`.
- **BR-06**: Les fiches POI et la carte ouvertes depuis la page restent gérées
  dans le `GuideApp` partagé sans exposer une route publique.
- **BR-07**: `/nos-recommandations` devient un alias de compatibilité et ne rend
  plus l'ancienne interface pour un séjour actif.
- **BR-08**: Aucune migration, API, donnée sensible ou modification du contrôle
  d'accès n'est introduite.

## Data Model

Aucune migration Prisma. Les modèles `Lodging`, `LodgingCustomization`,
`LodgingFeaturedPoi`, `Poi`, `PoiGallery` et `Category` existants sont lus via
l'adaptateur privé de la spec 034.

## API Contract

Aucune nouvelle API. La route est un Server Component privé qui résout le
Lodging actif puis transmet les données typées au `GuideApp` partagé.

## UI Behaviour

### Page `/sejour/coups-de-coeur`

- Shell mobile privé `max-w-[430px]`, `100dvh`, fond blanc et ombre existante.
- Header MyStay approuvé et nouveau menu identiques à la démonstration.
- Titre `Nos coups de cœur`.
- Filtres `Tous` puis catégories réelles, en défilement horizontal sans barre.
- Grille bento carrée réutilisant les variantes et images existantes.
- Navigation basse avec cœur actif.
- Clic carte : fiche POI partagée ; bouton carte : vue carte partagée centrée.

### États

- Aucun POI : titre et filtres restent utilisables, grille vide sans donnée démo.
- POI sans image : fallback de catégorie existant.
- Contexte invalide : `/acces-reserve` via le contrôle existant.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | integration |
| AC-01-02 | integration + e2e |
| AC-01-03 | unit + regression |
| AC-01-04 | unit + integration |
| AC-01-05 | integration |
| AC-02-01 | integration |
| AC-02-02 | unit |
| AC-02-03 | unit + integration |

## Out of Scope

- Refonte du guide logement, de la carte ou des fiches POI.
- Création de `/sejour/favoris` pour les favoris personnels.
- Modification des données, catégories ou recommandations choisies par l'Owner.
- Nouvelle règle de randonnée ou de géolocalisation.

## Open Questions

Aucune question ouverte pour cet incrément.
