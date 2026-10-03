# Spec — 057 Guide Travel Times

## Metadata

```yaml
id: 057-guide-travel-times
title: "Temps de trajet réels et position GPS dans l'onglet Guide"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-02
updated_at: 2026-10-02
depends_on:
  - 003-poi-list
  - 004-poi-detail
  - 056-guide-tab-search
  - 045-public-demo-private-guide-reference
bounded_context: guide-app
implementation_gate: "Décisions du Product Owner du 2026-10-02 : temps réels MapBox depuis le logement, un seul mode sur la grille et les deux sur la fiche ; « Utiliser ma position » avec distance à vol d'oiseau « de vous » (règle 003 BR-01a / 004 BR-10) ; durées fictives de la démo remplacées par des temps calculés."
```

## Context

La spec 056 affiche une distance à vol d'oiseau depuis le logement. Le PO
préfère de vrais temps de trajet et rappelle la règle des specs 003/004 : la
position GPS du voyageur, s'il l'active, prime sur le logement. La carte
« Activer mon GPS » ayant disparu avec la spec 054, un accès est rétabli dans
l'onglet Guide.

## Glossary References

- **POI**, **Lodging**, **Guide**, **Tourist** (glossary.md).

## User Stories

### US-01 — Savoir combien de temps il faut pour y aller

- **AC-01-01**: Given un logement aux coordonnées précises, When l'onglet Guide
  s'affiche, Then chaque carte montre un seul temps réel depuis le logement :
  à pied (icône marcheur) si le trajet à pied dure 25 min ou moins, sinon en
  voiture (icône voiture), avec la mention « Temps de trajet estimés depuis le
  logement ».
- **AC-01-02**: Given la fiche d'un lieu, When les temps sont connus, Then elle
  affiche les deux : « À pied 6 min · En voiture 2 min depuis le logement ».
- **AC-01-03**: Given le calcul indisponible (MapBox en échec, logement non
  localisé), When la grille s'affiche, Then elle revient à la distance à vol
  d'oiseau depuis le logement s'il est localisé, sinon n'affiche rien.

### US-02 — Utiliser ma position

- **AC-02-01**: Given l'onglet Guide du guide privé, When le voyageur touche
  « Utiliser ma position » et l'autorise, Then chaque carte affiche la distance
  à vol d'oiseau depuis sa position (« 350 m de vous ») avec la mention
  « Distances à vol d'oiseau depuis votre position » ; « Ne plus utiliser ma
  position » revient aux temps depuis le logement.
- **AC-02-02**: Given la démo, When elle s'affiche, Then aucun bouton de
  position n'est proposé (045 BR-08).

### US-04 — Accès à l'arrêt de navette *(ajout PO du 2026-10-02)*

- **AC-04-01**: Given un voyageur en séjour, When l'accordéon Navette gratuite
  affiche l'arrêt le plus proche, Then le temps
  réel MapBox jusqu'au quai remplace la distance à vol d'oiseau (à pied si
  ≤ 25 min, sinon en voiture) ; sans séjour ou si MapBox échoue, la distance à
  vol d'oiseau reste affichée. Le calcul n'est jamais déclenché sans séjour
  actif (maîtrise du coût).

### US-03 — Démo

- **AC-03-01**: Given les lieux de démonstration, When ils s'affichent, Then les
  durées fictives (« À 4 min ») sont remplacées par des temps MapBox calculés
  une fois depuis l'adresse vitrine et figés dans les constantes de démo.

## Business Rules

- **BR-01**: Temps et distances de trajet issus de MapBox (Matrix API) uniquement,
  jamais de Gemini (ADR-006) ni inventés.
- **BR-02**: Calcul côté serveur depuis le logement de la session, mis en cache
  7 jours par jeu (coordonnées logement + lieux) ; aucune coordonnée de logement
  n'est acceptée du client.
- **BR-03**: La position GPS reste sur l'appareil (003 BR-01b) et n'est jamais
  envoyée au serveur ni à MapBox.

## Data Model

Aucun changement.

## API Contract

```yaml
/api/guide/travel-times:
  get:
    summary: Temps de trajet depuis le logement de la session vers ses coups de cœur
    responses:
      '200':
        schema:
          status: available | outside_coverage | unavailable
          data: { [poiId]: { walkingSeconds: number | null, drivingSeconds: number | null } }
      '401': UNAUTHORIZED (aucun séjour actif)
```

## UI Behaviour

Icônes Lucide `Footprints` / `Car` / `MapPin`. Durées : « 6 min », « 1 h 05 ».
Bouton « Utiliser ma position » (icône `LocateFixed`) sous la recherche.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 … AC-01-03 | unit + integration + contract |
| AC-02-01, AC-02-02 | integration |
| AC-03-01 | unit |

## Out of Scope

- Temps de trajet depuis la position GPS (appels par voyageur).
- Transports en commun, vélo.

## Open Questions

Aucune.
