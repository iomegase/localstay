# Spec — 058 Facilibus Map

## Metadata

```yaml
id: 058-facilibus-map
title: "Carte des arrêts, des lignes et des navettes Facilibus"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-02
updated_at: 2026-10-02
depends_on:
  - 055-facilibus-transport
  - 057-guide-travel-times
bounded_context: guide-app
implementation_gate: "Demande du Product Owner du 2026-10-02 : carte MapBox avec un pin et le nom de chaque arrêt, tracé des lignes, sélection au toucher, navettes en temps réel. Amende 055 Out of Scope (carte des navettes). L'écran Carte du guide reste inchangé (054 BR-04)."
```

## Context

La page « Navette gratuite » (spec 055) liste les arrêts dans un sélecteur. Le PO
souhaite les voir sur une carte, avec les lignes et les navettes en circulation.

## Glossary References

- **Station physique**, **Quai**, **Réseau** (spec 055).

## User Stories

### US-01 — Voir le réseau sur une carte

- **AC-01-01**: Given la page Navette, When elle s'affiche, Then une carte MapBox
  (style du guide, 260 px) montre un pin par station physique, le pin du
  logement s'il est localisé, et le tracé des lignes dans leurs couleurs
  officielles (GTFS `shapes`).
- **AC-01-02**: Given la carte, When elle s'affiche, Then le nom de la station
  sélectionnée est toujours visible et ceux des autres stations apparaissent à
  partir du zoom 14.
- **AC-01-03**: Given un pin, When on le touche, Then la station est
  sélectionnée (pin noir), le sélecteur et les prochains départs suivent, et la
  carte se centre sur elle.
- **AC-01-04**: Given des navettes dont la position date de moins de 2 min,
  When la carte est ouverte, Then chacune apparaît avec la couleur et le numéro
  de sa ligne, actualisée toutes les 15 s ; les positions anciennes ou sans
  heure de mesure ne sont jamais affichées.

- **AC-01-05** *(ajout PO du 2026-10-02)*: Given la carte, When on touche
  « Afficher la carte en plein écran », Then elle occupe tout l'écran du guide ;
  « Quitter le plein écran » ou Échap la remet en place.

## Business Rules

- **BR-01**: Données publiques uniquement (arrêts, tracés, positions sans
  plaque ni identifiant de boîtier, spec 055 AC-04-04).
- **BR-02**: Aucun calcul de durée d'arrivée à partir d'une position (055 BR-01).
- **BR-03**: L'écran Carte du guide n'est pas modifié.

## Data Model

Aucun changement.

## API Contract

```yaml
/api/transport/facilibus/lines:
  get:
    responses:
      '200': TransportEnvelope<{ lines: [{ routeId, shortName, longName, color, textColor, paths: [[[lng, lat]]] }] }>
```

## UI Behaviour

Pins arrêts : point blanc bordé ; sélection : pastille `#111111`. Étiquettes
11 px / 600 sur fond blanc. Navettes : pastille à la couleur de la ligne avec
une icône bus et son numéro (ajout PO du 2026-10-02), halo pulsé. Logement : pin rose `#DB2777`.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | unit + contract + integration |
| AC-01-02, AC-01-03 | integration |
| AC-01-04 | integration |

## Out of Scope

- Itinéraire jusqu'à l'arrêt, suivi d'une navette, notifications.

## Open Questions

Aucune.
