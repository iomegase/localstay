# Spec — 056 Guide Tab Search

## Metadata

```yaml
id: 056-guide-tab-search
title: "Onglet Guide : en-tête, recherche et distance à vol d'oiseau"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-02
updated_at: 2026-10-02
depends_on:
  - 054-private-guide-stay-redesign
  - 055-facilibus-transport
  - 045-public-demo-private-guide-reference
bounded_context: guide-app
implementation_gate: "Décisions du Product Owner du 2026-10-02 : présentation hybride (A) ; favoris personnels du voyageur reportés à une spec dédiée (A)."
```

## Context

Le handoff « Le 305 » présente l'onglet Guide comme une liste avec recherche. Le
PO conserve la grille photo actuelle des coups de cœur et y ajoute l'en-tête et
la recherche du handoff, ainsi qu'une distance calculée quand le logement est
localisé.

## Glossary References

- **POI**, **Lodging**, **Guide** (glossary.md). **Coup de cœur** : POI mis en avant par l'hôte.

## User Stories

### US-01 — Trouver un lieu rapidement

- **AC-01-01**: Given l'onglet Guide (privé et démo), When il s'affiche, Then il
  présente l'eyebrow « LE GUIDE », la ville en titre (sans le suffixe
  « -les-Bains ») et « Nos coups de cœur pour profiter de votre séjour », puis
  un champ « Rechercher un lieu », les filtres de catégories existants et la
  grille photo existante. *(Écart PO du 2026-10-03, commit 3de3996d : eyebrow
  « LE GUIDE » et sous-titre retirés ; restent le titre ville, la recherche,
  les filtres et la grille.)*
- **AC-01-02**: Given une saisie, When elle change, Then la grille ne garde que
  les lieux dont le nom, la catégorie ou la description contient le texte
  (insensible à la casse et aux accents), combinée au filtre de catégorie.
- **AC-01-03**: Given aucun résultat, When la recherche est active, Then
  « Aucun lieu ne correspond à « … ». » est affiché avec un bouton « Effacer ».
- **AC-01-04**: Given un logement aux coordonnées précises (spec 055), When la
  grille s'affiche, Then chaque carte indique la distance à vol d'oiseau
  (« 350 m », « 1,2 km ») et la mention « Distances à vol d'oiseau depuis le
  logement » apparaît ; sans coordonnées précises, aucune distance n'est
  affichée.

## Business Rules

- **BR-01**: Aucune distance inventée : Haversine depuis les coordonnées
  géocodées du logement uniquement.
- **BR-02**: La recherche est locale (aucun appel réseau) et ne persiste rien.

## Data Model

Aucun changement.

## API Contract

Aucun changement.

## UI Behaviour

Tokens 054 : champ 46 px, rayon 14 px, fond blanc, icône loupe ; eyebrow rose
11 px / .12em ; titre 30 px / 600.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 … AC-01-04 | integration + unit |

## Out of Scope

- Favoris personnels du voyageur (cœur, filtre « Favoris »).
- Liste compacte du handoff, catégories fictives du prototype.

## Open Questions

Aucune.
