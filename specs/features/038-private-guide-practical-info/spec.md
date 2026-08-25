# Spec — 038 Private Guide Practical Information

## Metadata

```yaml
id: 038-private-guide-practical-info
title: "Informations pratiques du logement"
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

La carte `Informations pratiques` du nouveau livret privé ouvre encore la page
historique. La vue `practical` du `GuideApp` de démonstration est déjà validée
et doit devenir l'interface canonique de
`/sejour/logement/informations-pratiques`, alimentée par les données réelles du
Lodging actif.

## Glossary References

- **Guide**
- **Lodging**
- **Tourist**

## User Stories

### US-01 — Consulter les informations pratiques

**As a** Tourist disposant d'un séjour actif  
**I want to** consulter le Wi-Fi, les équipements et les contacts  
**So that** je dispose des informations utiles pendant mon séjour

#### Acceptance Criteria

- **AC-01-01**: Given un séjour actif, When la nouvelle route est demandée,
  Then le `GuideApp` partagé est rendu en `mode="private"` avec
  `initialView="practical"`.
- **AC-01-02**: Given la page affichée, Then le header, le retour Guide, le hero
  `Informations pratiques`, la carte Wi-Fi, les cartes pratiques et les numéros
  utiles reprennent le design de la démonstration MyStay.
- **AC-01-03**: Given les données du Lodging actif, Then le Wi-Fi, les cartes,
  vidéos, téléphones et numéros utiles affichés proviennent de l'adaptateur
  privé et aucune donnée de démonstration n'est importée.
- **AC-01-04**: Given aucun séjour valide, Then aucune donnée privée n'est
  chargée et l'écran d'accès réservé est utilisé.

### US-02 — Naviguer depuis le livret

**As a** Tourist  
**I want to** ouvrir et quitter les informations pratiques depuis le guide  
**So that** la hiérarchie privée reste cohérente

#### Acceptance Criteria

- **AC-02-01**: Given `/sejour/logement`, When `Informations pratiques` est
  activé, Then la destination est
  `/sejour/logement/informations-pratiques`.
- **AC-02-02**: Given la page enfant, When `Guide logement` est activé, Then la
  destination est `/sejour/logement`.
- **AC-02-03**: Given la page enfant, Then l'onglet Guide reste actif.

## Business Rules

- **BR-01**: La route exige un cookie séjour `lodging_id` valide.
- **BR-02**: La page réutilise `PrivateGuidePage`, `GuideApp` et la branche
  `practical` de `GuideLodgingViews`, sans duplication visuelle.
- **BR-03**: La source reste `getPrivateGuideData`; aucune donnée de démo.
- **BR-04**: Les secrets Wi-Fi sont affichés uniquement dans ce contexte privé.
- **BR-05**: Les vidéos, appels et liens existants conservent leur comportement.
- **BR-06**: Le shell reste limité à 430 px sans zoom ni scale CSS.
- **BR-07**: Aucune migration Prisma ni nouvelle API.
- **BR-08**: Une carte pratique portant l'icône `recycle` appartient à
  `Informations pratiques`. Elle n'est ni rendue dans `Équipements`, ni incluse
  dans le compteur d'équipements du sommaire. Les autres cartes pratiques
  restent dans `Équipements`.

## Data Model

Aucune migration. La page utilise les champs adaptés `wifiName`,
`wifiPassword`, `practicalCards` et `usefulNumbers` des modèles existants.

## API Contract

Aucune nouvelle API. La route est un Server Component privé.

## UI Behaviour

- Header MyStay et menu partagé.
- Retour `Guide logement` vers `/sejour/logement`.
- Hero bleu nuit avec icône rose.
- Carte Wi-Fi bleu nuit, cartes pratiques blanches ou bleu nuit selon leur
  fonction, et bloc `Numéros utiles`.
- Navigation basse avec l'onglet Guide actif et scroll vertical interne.

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
| BR-08 | unit + integration |

## Out of Scope

- Migration de la page Consignes ou Départ.
- Édition des données pratiques par le voyageur.
- Modification du modèle de données ou des secrets Wi-Fi.

## Open Questions

Aucune question ouverte pour cet incrément.
