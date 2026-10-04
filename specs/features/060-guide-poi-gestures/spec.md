# Spec — 060 Gestes tactiles sur la fiche lieu du guide

## Metadata

```yaml
id: 060-guide-poi-gestures
title: "Fiche lieu du guide : swipe photos, swipe retour, tirer vers le bas pour fermer"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-04
updated_at: 2026-10-04
depends_on:
  - 054-private-guide-stay-redesign
  - 057-guide-travel-times
bounded_context: guide-app
implementation_gate: "Décisions du PO du 2026-10-04 : sur la fiche lieu du guide, swipe des photos + swipe retour depuis le bord gauche + tirer vers le bas pour fermer ; flèches photo masquées sur écran tactile, conservées à la souris."
```

## Context

Dans le guide de séjour, la fiche lieu (`GuidePoiDetails`) ne se manipule qu'avec
des boutons : flèches ‹ › sur la photo et bouton ← en haut à gauche. Sur
téléphone, et surtout dans le guide installé (spec 059) qui n'a pas de geste
retour du navigateur, le PO veut des gestes naturels.

## Glossary References

- **POI** / lieu, **Guide privé** (`/sejour`, spec 054), **Fiche lieu** : vue
  `poi` de `GuideApp` (`GuidePoiDetails`).

## User Stories

### US-01 — Parcourir et quitter une fiche lieu au doigt

- **AC-01-01**: Given une fiche lieu avec au moins 2 photos, When le voyageur
  glisse horizontalement sur la photo d'au moins 40 px (vers la gauche), Then la
  photo suivante s'affiche ; vers la droite, la précédente (bouclage identique
  aux flèches, pastilles mises à jour).
- **AC-01-02**: Given un écran tactile (`pointer: coarse`), When la fiche
  s'affiche, Then les flèches ‹ › de la photo sont masquées ; avec une souris
  (`pointer: fine`) elles restent visibles et cliquables.
- **AC-01-03**: Given un toucher qui commence à moins de 24 px du bord gauche
  de la fiche, When le doigt glisse vers la droite, Then la fiche suit le doigt ;
  au relâcher au-delà de 80 px, la fiche se ferme comme le bouton ← (même
  destination) ; en deçà, elle revient en place. Ce geste prime sur le swipe
  photo.
- **AC-01-04**: Given la fiche défilée tout en haut, When le doigt tire la fiche
  vers le bas depuis la photo, Then elle suit le doigt ; au relâcher au-delà de
  120 px, la fiche se ferme comme le bouton ← ; en deçà, elle revient en place.
  Si la fiche n'est pas tout en haut, le défilement normal s'applique.
- **AC-01-05**: Given un geste dont la direction dominante ne correspond pas
  (ex. défilement vertical), When il se termine, Then aucune action n'est
  déclenchée. Le bouton ← et les flèches (souris) restent disponibles.

## Business Rules

- **BR-01**: Les gestes déclenchent exactement les mêmes actions que les
  boutons existants (pas de nouvelle destination).
- **BR-02**: Mouvement réduit (`prefers-reduced-motion`) : pas d'animation de
  suivi ni de retour, l'action reste déclenchée.
- **BR-03**: Périmètre : fiche lieu du guide (`GuidePoiDetails`). Les autres
  usages du carrousel (journal, agenda, pages POI publiques, randonnées) sont
  inchangés.

## Data Model

Aucun changement.

## API Contract

Aucun changement.

## UI Behaviour

Seuils : swipe photo 40 px, zone de bord 24 px, retour 80 px, fermeture 120 px ;
direction verrouillée après 10 px de mouvement (axe dominant). Suivi du doigt par
`transform` ; retour en place animé 200 ms.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 à AC-01-05 | unit (classification du geste) + integration (événements tactiles) |

## Out of Scope

- Gestes sur les pages POI publiques, le journal, l'agenda, les randonnées.
- Zoom par pincement, double-tap, swipe entre fiches de lieux différents.

## Open Questions

Aucune.
