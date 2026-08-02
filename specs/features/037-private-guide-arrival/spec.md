# Spec — 037 Private Guide Arrival

## Metadata

```yaml
id: 037-private-guide-arrival
title: "Accéder au logement"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-08-02
updated_at: 2026-08-02
depends_on:
  - 012-guide-customization
  - 034-private-guide-app
  - 036-private-guide-lodging-home
bounded_context: private-guide
implementation_gate: "Demande explicite du Product Owner du 2026-08-02"
```

## Context

La page parent `/sejour/logement` doit ouvrir une page enfant privée dédiée à
l'arrivée. La vue `arrival` existe déjà dans le `GuideApp` de démonstration et
doit devenir l'interface canonique de `/sejour/logement/arrivee`, avec les
instructions et coordonnées réelles du Lodging actif.

## Glossary References

- **Guide**
- **Lodging**
- **Tourist**

## User Stories

### US-01 — Accéder au logement

**As a** Tourist disposant d'un séjour actif  
**I want to** consulter les informations d'arrivée  
**So that** je trouve le logement et suis les consignes de mon hôte

#### Acceptance Criteria

- **AC-01-01**: Given un séjour actif, When
  `/sejour/logement/arrivee` est demandé, Then le `GuideApp` partagé est rendu
  en `mode="private"` avec `initialView="arrival"`.
- **AC-01-02**: Given la page affichée, Then elle reprend le header, le retour
  Guide, le bloc `Bienvenue`, la liste numérotée d'instructions, la carte
  d'adresse et le bouton Google Maps de la démonstration.
- **AC-01-03**: Given les données du Lodging actif, Then l'adresse, les
  coordonnées et les instructions affichées sont réelles et aucune donnée de
  démonstration n'est importée.
- **AC-01-04**: Given aucun séjour valide, Then l'écran d'accès réservé est
  utilisé sans charger les données logement.

### US-02 — Naviguer depuis le parent

**As a** Tourist  
**I want to** ouvrir et quitter la page d'arrivée depuis le livret  
**So that** la hiérarchie privée reste claire

#### Acceptance Criteria

- **AC-02-01**: Given `/sejour/logement`, When la carte `Arrivée` ou
  `Accéder au logement` est activée, Then la destination est
  `/sejour/logement/arrivee`.
- **AC-02-02**: Given la page d'arrivée, When le retour `Guide logement` est
  activé, Then la destination est `/sejour/logement`.
- **AC-02-03**: Given la page d'arrivée, Then l'onglet Guide reste actif dans la
  navigation basse.

## Business Rules

- **BR-01**: La route exige le cookie privé `lodging_id` valide.
- **BR-02**: La page réutilise `PrivateGuidePage`, `GuideApp` et la branche
  `arrival` de `GuideLodgingViews`, sans interface dupliquée.
- **BR-03**: La source reste `getPrivateGuideData`; aucune donnée démo.
- **BR-04**: Google Maps reçoit uniquement les coordonnées déjà stockées ;
  aucune géolocalisation ou donnée externe n'est inventée.
- **BR-05**: Le shell reste limité à 430 px sans zoom ni mise à l'échelle CSS.
- **BR-06**: Aucune migration Prisma ni nouvelle API.

## Data Model

Aucune migration. Les champs adaptés `arrivalInstructions`, `addressLabel`,
`latitude` et `longitude` proviennent des modèles privés existants.

## API Contract

Aucune nouvelle API. La route est un Server Component privé.

## UI Behaviour

- Header MyStay et menu partagé.
- Retour textuel `Guide logement` vers `/sejour/logement`.
- Hero bleu nuit `Bienvenue` avec icône rose.
- Instructions numérotées dans une carte blanche.
- Adresse réelle puis bouton rose `Google Maps` ouvrant un nouvel onglet.
- Navigation basse avec `Guide` actif et scroll vertical interne.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | integration |
| AC-01-02 | integration + e2e |
| AC-01-03 | unit + integration |
| AC-01-04 | integration |
| AC-02-01 | integration |
| AC-02-02 | integration |
| AC-02-03 | integration |

## Out of Scope

- Modification ou édition des consignes d'arrivée.
- Migration des pages Informations pratiques, Consignes et Départ.
- Géolocalisation automatique ou calcul d'itinéraire interne.

## Open Questions

Aucune question ouverte pour cet incrément.
