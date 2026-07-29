# Spec — 033 Guide Featured Bento

## Metadata

```yaml
id: 033-guide-featured-bento
title: "Cartes bento des coups de cœur du GuideApp"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-07-29
updated_at: 2026-07-29
depends_on:
  - 003-categories-pois
  - 031-public-marketing-site
  - 032-approved-brand-identity
bounded_context: guide-app
implementation_gate: "Validation explicite du Product Owner le 2026-07-29"
```

## Context

L'accueil du `GuideApp` affiche trois POI recommandés dans une rangée
horizontale. Les cartes doivent reprendre le langage visuel bento du guide
privé, sans perdre le défilement horizontal et sans afficher de carte blanche.

Lorsqu'un POI possède une galerie, sa photo hero sélectionnée dans
l'administration doit être utilisée. Le fallback de catégorie est réservé aux
POI sans galerie réelle.

## Glossary References

- `POI`
- `Guide`
- `Hébergement`

## User Stories

### US-01 — Explorer les coups de cœur depuis l'accueil

**As a** voyageur ou visiteur de la démonstration  
**I want to** parcourir trois cartes illustrées cohérentes avec le bento MyStay  
**So that** je reconnais immédiatement les lieux recommandés

#### Acceptance Criteria

- **AC-01-01**: Given l'accueil du `GuideApp`, When les recommandations sont
  rendues, Then les trois premiers POI `recommended` sont affichés dans une
  rangée horizontalement scrollable.
- **AC-01-02**: Given la rangée horizontale, When elle est affichée, Then le
  scroll tactile, trackpad et clavier reste fonctionnel, mais aucune barre de
  scroll visuelle n'est affichée.
- **AC-01-03**: Given les trois cartes, When elles sont comparées, Then elles
  possèdent exactement la même largeur et la même hauteur.
- **AC-01-04**: Given une carte, When elle est rendue, Then elle utilise une
  image plein cadre, un dégradé, des coins fortement arrondis, une ombre, le nom
  et la distance du POI ; aucune variante blanche n'est rendue.
- **AC-01-05**: Given un POI avec une galerie réelle, When sa carte est rendue,
  Then `photos[0]`, correspondant à la hero choisie par l'administrateur, est
  utilisée et aucun fallback ne la remplace.
- **AC-01-06**: Given un POI sans galerie réelle, When sa carte est rendue,
  Then son fallback de catégorie est affiché.
- **AC-01-07**: Given une carte, When elle est activée, Then la fiche interne du
  POI s'ouvre sans changement de l'URL de la home marketing.

## Business Rules

- **BR-01**: La rangée contient exactement les trois premiers POI marqués
  `recommended`.
- **BR-02**: Les trois cartes utilisent le même composant, les mêmes classes de
  largeur et les mêmes classes de hauteur.
- **BR-03**: Le scroll horizontal est conservé avec une scrollbar masquée pour
  Firefox, Chromium et Safari ; aucun `overflow-x-hidden` n'est appliqué à la
  rangée.
- **BR-04**: L'ordre du tableau `GuidePoi.photos` est sémantique :
  `photos[0]` est la hero administrée lorsqu'une galerie existe.
- **BR-05**: Un fallback de catégorie n'est présent en première position que si
  aucune galerie réelle n'existe.
- **BR-06**: La démonstration utilise un instantané statique d'URLs d'images
  publiques et ne déclenche aucune query Prisma, API privée ou authentification
  à l'ouverture du modal.
- **BR-07**: Les routes privées, QR codes, cookies séjour, contrôles d'accès et
  autres vues du guide ne sont pas modifiés.
- **BR-08**: `zoom` et `transform: scale()` restent interdits pour dimensionner
  les cartes.

## Data Model

Aucune modification Prisma. Le champ existant `PointOfInterest.photos` reste
un tableau ordonné ; l'administration place déjà la hero choisie en première
position.

## API Contract

Aucune route API créée ou modifiée. La démonstration ne charge pas ses photos
depuis une API au runtime.

## UI Behaviour

- La section conserve son titre, son eyebrow et le bouton « Tout voir ».
- Les trois cartes utilisent une image plein cadre avec un dégradé sombre.
- Le titre et la distance restent lisibles au-dessus de l'image.
- Les cartes utilisent `scroll-snap-align` pour stabiliser le défilement.
- Le clic appelle `onSelectPoi` et conserve la navigation interne du
  `GuideApp`.
- Le carrousel reste accessible au clavier.

## Acceptance Criteria

| ID | Vérification |
|---|---|
| AC-01-01 | Test d'intégration du nombre et de l'ordre des cartes |
| AC-01-02 | Test de classes overflow et scrollbar masquée + E2E responsive |
| AC-01-03 | Test des classes identiques de dimensions |
| AC-01-04 | Test du rendu plein cadre sans variante blanche |
| AC-01-05 | Test de priorité de `photos[0]` sur le fallback |
| AC-01-06 | Test du fallback en absence de galerie |
| AC-01-07 | Test de navigation interne existant |

## Out of Scope

- Refonte de la page complète « Coups de cœur ».
- Refonte des cartes de la route privée `/nos-recommandations`.
- Modification du formulaire d'administration des photos.
- Nouvelle route publique ou privée.
- Chargement dynamique des données POI de démonstration.
- Modification de la carte, des fiches POI ou du suivi de randonnée.

## Open Questions

| ID | Question | Owner | Resolution |
|---|---|---|---|
| OQ-00 | Aucune question ouverte. | Product Owner | resolved |
