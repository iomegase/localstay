# Spec — 091 Lightbox plein écran des photos du logement

## Metadata

```yaml
id: 091-lodging-photo-lightbox
title: "Afficher les photos de la fiche logement en plein écran"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-07
updated_at: 2026-10-07
depends_on:
  - 028-lodging-showcase-seo
bounded_context: lodging-showcase
implementation_gate: "PO 2026-10-07 : « mettre en place une lightbox pour afficher les photos en plein écran si l'utilisateur clique sur LodgingRoomsGrid ou LodgingMarketingGallery »."
```

## Context

Les photos de la fiche publique (galerie du haut, grille par pièce) sont recadrées et petites ; le
voyageur ne peut pas les agrandir.

## User Stories

- **AC-01**: Given la galerie du haut, When le voyageur clique une photo, Then une lightbox plein écran
  s'ouvre sur cette photo et permet de parcourir toutes les photos publiées du logement.
- **AC-02**: Given une carte de pièce de la grille, When il clique la photo affichée, Then la lightbox
  s'ouvre sur cette photo et parcourt les photos de cette pièce ; le libellé de la pièce est affiché.
- **AC-03**: Dans la lightbox : photo entière (non recadrée) sur fond sombre, compteur « n / total »,
  texte alternatif en légende, photo précédente / suivante par boutons, flèches du clavier et glisser
  au doigt ; fermeture par bouton, touche Échap ou clic sur le fond.
- **AC-04**: Accessibilité : dialogue modal nommé, focus placé sur « Fermer » à l'ouverture et rendu
  à l'élément cliqué à la fermeture ; la page ne défile pas derrière la lightbox ; chaque photo
  cliquable est un bouton « Agrandir la photo … ».

## Business Rules

- **BR-01**: Aucune photo supplémentaire n'est chargée tant que la lightbox n'est pas ouverte.

## Data Model / API Contract

Aucun changement.

## UI Behaviour

Voir AC-01 à AC-04.

## Acceptance Criteria

AC-01 à AC-04.

## Out of Scope

Zoom par pincement dédié, partage, téléchargement, diaporama automatique.

## Open Questions

Aucune.
