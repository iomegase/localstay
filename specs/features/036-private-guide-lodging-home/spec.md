# Spec — 036 Private Guide Lodging Home

## Metadata

```yaml
id: 036-private-guide-lodging-home
title: "Accueil du livret logement privé"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-08-02
updated_at: 2026-08-02
depends_on:
  - 012-guide-customization
  - 034-private-guide-app
  - 035-private-guide-favorites
bounded_context: private-guide
implementation_gate: "Demande explicite du Product Owner du 2026-08-02"
```

## Context

Le deuxième onglet du nouveau guide privé ouvre encore l'ancienne page
`/le-logement`. La démonstration possède déjà une vue parent `lodging` validée,
avec les horaires d'arrivée et de départ et quatre accès thématiques. Ce nouvel
incrément rend cette même vue sous la route canonique `/sejour/logement`, sans
dupliquer son interface et sans modifier les pages enfants historiques.

## Glossary References

- **Guide**
- **Lodging**
- **Tourist**

## User Stories

### US-01 — Ouvrir l'accueil du livret logement

**As a** Tourist disposant d'un séjour actif  
**I want to** ouvrir le premier écran du guide logement  
**So that** je retrouve rapidement les horaires et les informations du séjour

#### Acceptance Criteria

- **AC-01-01**: Given un séjour actif, When `/sejour/logement` est demandé,
  Then le `GuideApp` partagé est rendu en `mode="private"` avec
  `initialView="lodging"` et les données du Lodging actif.
- **AC-01-02**: Given la page affichée, Then elle reprend le header MyStay, deux
  cartes Arrivée/Départ, quatre cartes d'accès bleu nuit et la navigation basse
  de la démonstration, avec l'onglet Guide actif.
- **AC-01-03**: Given les données du Lodging, Then les heures et le nombre
  d'équipements affichés proviennent du modèle privé adapté et aucune donnée de
  démonstration n'est chargée.
- **AC-01-04**: Given aucun séjour valide, When la route est demandée, Then
  l'écran d'accès réservé est utilisé avant tout chargement de données privées.

### US-02 — Utiliser la route parent canonique

**As a** Tourist  
**I want to** atteindre la même page depuis la home, l'onglet et le menu  
**So that** la nouvelle hiérarchie `/sejour` reste cohérente

#### Acceptance Criteria

- **AC-02-01**: Given `/sejour`, When « Découvrir le livret d'accueil » ou
  l'onglet Guide est activé, Then la destination est `/sejour/logement`.
- **AC-02-02**: Given le menu privé, When « Livret d'accueil » est activé, Then
  la destination est `/sejour/logement`.
- **AC-02-03**: Given un accès Arrivée, Informations pratiques, Équipements ou
  Départ, Then la fonctionnalité historique correspondante reste accessible
  jusqu'à la migration de chaque page enfant.

## Business Rules

- **BR-01**: `/sejour/logement` reste privée et soumise au cookie `lodging_id`.
- **BR-02**: La page réutilise `PrivateGuidePage`, `GuideApp` et
  `GuideLodgingViews`; aucune interface parallèle n'est créée.
- **BR-03**: La source des données reste `getPrivateGuideData` et ne doit jamais
  importer le logement de démonstration.
- **BR-04**: La largeur reste limitée à 430 px, sans `zoom` ni
  `transform: scale()`.
- **BR-05**: Les routes enfants historiques restent actives pendant cet
  incrément pour éviter toute régression avant leur migration.
- **BR-06**: Aucune migration Prisma, API ou modification du contrôle d'accès.
- **BR-07**: La vue interne `rules` est présentée au Tourist sous le libellé
  `Équipements`. La carte du hub affiche le nombre de blocs pratiques avec la
  forme `1 équipement` au singulier et `N équipements` dans tous les autres
  cas. L'icône Lucide `HousePlug` identifie cette vue dans l'onglet, la carte du
  hub et l'en-tête. La route `/sejour/logement/consignes` reste inchangée.

## Data Model

Aucune migration. La page lit le `GuideLodging` déjà adapté depuis les modèles
`Lodging`, `LodgingCustomization`, `LodgingEquipment` et `HouseRule` existants.

## API Contract

Aucune nouvelle API. La route est un Server Component privé.

## UI Behaviour

- Header MyStay et menu partagé.
- Rangée de deux cartes blanches arrondies : `Arrivée` et `Départ`.
- Quatre cartes bleu nuit : `Accéder au logement`, `Informations pratiques`,
  `Équipements`, `Préparer le départ`.
- Icônes circulaires roses, flèche à droite, ombre et espacements identiques à
  la démonstration.
- Navigation basse : onglet `Guide` actif.
- Défilement vertical interne et absence de débordement horizontal.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | integration |
| AC-01-02 | integration + e2e |
| AC-01-03 | unit + integration |
| AC-01-04 | integration |
| AC-02-01 | integration |
| AC-02-02 | integration |
| AC-02-03 | regression |
| BR-07 | unit + integration |

## Out of Scope

- Migration des pages Arrivée, Informations pratiques, Équipements et Départ.
- Refonte du contenu ou ajout de nouvelles données logement.
- Suppression immédiate de `/le-logement`.

## Open Questions

Aucune question ouverte pour cet incrément.
