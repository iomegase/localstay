# Spec — 088 Carte de la zone du logement (fiche publique)

## Metadata

```yaml
id: 088-lodging-approximate-map
title: "Petite carte Mapbox de la zone approximative du logement sur sa fiche publique"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 028-lodging-showcase-seo
  - 055-lodging-address-geocoding
  - 080-lodging-structured-address
bounded_context: lodging-showcase
implementation_gate: "PO 2026-10-06 : « rajouter une petite carte Mapbox sur la page des logements » ; choix : fiche d'un logement, zone approximative."
```

## Context

La carte existante de la fiche (028) n'apparaît que si une « localisation précise publique » est
renseignée, ce que rien ne permet de faire : aucune carte n'est jamais affichée. L'adresse du
logement (page Guide) est géocodée (055) mais reste privée.

## User Stories

- **AC-01**: Given un logement dont l'adresse est géocodée, When sa fiche publique s'affiche, Then
  une petite carte « Situer le logement » montre un cercle d'environ 50 m (sans repère exact ni
  itinéraire), sans bandeau de légende sous la carte (révision PO 2026-10-06 ; quartier/ville en libellé accessible).
- **AC-02**: Given le centre du cercle, When il est calculé, Then il est décalé de 15 à 35 m (révision PO 2026-10-06 : cercle réduit à 50 m) de
  la position réelle, de façon stable pour un logement donné (recharger la page ne le déplace pas).
- **AC-03**: Given les coordonnées exactes, When la fiche ou l'API publique répondent, Then elles
  ne sont jamais transmises (seul le centre décalé, arrondi à 4 décimales, l'est).
- **AC-04**: Given un logement sans adresse géocodée, When la fiche s'affiche, Then aucune carte.
- **AC-05**: Given un logement en localisation précise publique (028), When la fiche s'affiche,
  Then la carte précise existante reste utilisée.

## Business Rules

- **BR-01**: Carte compacte (≈ 260 px de haut), zoom molette désactivé (la page défile).
- **BR-02** (révision PO 2026-10-07): Cartes de la fiche (zone approximative et position précise)
  inclinées (pitch 55°) avec bâtiments en 3D sous les libellés ; boussole/inclinaison dans les contrôles.
- **BR-02**: Mapbox uniquement (ADR-006).

## Data Model

Aucun changement (lecture de `LodgingCustomization.lodging_latitude/longitude`).

## API Contract

`GET /api/cities/{slug}/lodgings/{lodgingSlug}` : champ ajouté
`approximate_location: { latitude: number; longitude: number; radius_m: number } | null`.

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01, AC-04, AC-05 | Affichage de la carte selon les données | integration |
| AC-02, AC-03 | Décalage stable, aucune coordonnée exacte transmise | unit |

## Out of Scope

- Carte sur la liste /logements ; carte dans le guide privé (inchangée).

## Open Questions

Aucune.
