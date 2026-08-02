# Spec — 039 Private Guide Departure and Smartphone Frame

## Metadata

```yaml
id: 039-private-guide-departure-frame
title: "Préparer le départ et frame smartphone privée"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-08-02
updated_at: 2026-08-02
depends_on:
  - 012-guide-customization
  - 034-private-guide-app
  - 036-private-guide-lodging-home
  - 038-private-guide-practical-info
bounded_context: private-guide
implementation_gate: "Demande explicite du Product Owner du 2026-08-02"
```

## Context

La dernière page enfant du livret à migrer dans cet incrément est `Préparer le
départ`. L'ancien guide privé possède déjà une checklist interactive locale qui
doit être partagée avec le nouveau `GuideApp`. En parallèle, le guide privé doit
être présenté dans le navigateur comme une application smartphone : hauteur
contrainte, coins très arrondis, bordure blanche de 5 px et ombre, selon le
langage visuel du téléphone de la page Notre concept et du modal de démo.

## Glossary References

- **Guide**
- **Lodging**
- **Tourist**

## User Stories

### US-01 — Préparer le départ

**As a** Tourist disposant d'un séjour actif  
**I want to** cocher les consignes avant mon départ  
**So that** je n'oublie aucune action demandée par l'hôte

#### Acceptance Criteria

- **AC-01-01**: Given un séjour actif, When `/sejour/logement/depart` est
  demandé, Then le `GuideApp` partagé est rendu en `mode="private"` avec
  `initialView="departure"`.
- **AC-01-02**: Given des consignes de départ structurées, Then la page affiche
  la checklist partagée, une progression `cochées / total` et une case par
  consigne réelle.
- **AC-01-03**: Given une case activée, Then son état et la progression changent
  localement sans requête serveur ni persistance.
- **AC-01-04**: Given aucun séjour valide, Then aucune consigne privée n'est
  chargée et l'écran d'accès réservé est utilisé.
- **AC-01-05**: Given la page affichée, Then son retour cible
  `/sejour/logement` et l'onglet Guide reste actif.

### US-02 — Afficher le guide dans une frame smartphone

**As a** Tourist utilisant un navigateur  
**I want to** percevoir le guide comme une application mobile  
**So that** son interface reste lisible et cohérente sur grand écran

#### Acceptance Criteria

- **AC-02-01**: Given toute route utilisant `PrivateGuidePage`, Then le guide
  est centré dans une surface de largeur maximale 430 px et de hauteur maximale
  820 px, bornée par le viewport dynamique.
- **AC-02-02**: Given la frame, Then elle possède des coins fortement arrondis,
  une bordure blanche de `5px`, un fond blanc et une ombre portée prononcée.
- **AC-02-03**: Given un petit écran, Then largeur et hauteur restent inférieures
  au viewport avec une marge extérieure, sans débordement horizontal.
- **AC-02-04**: Given le contenu dépasse la frame, Then seul le contenu interne
  du `GuideApp` défile et la navigation basse reste contenue dans la frame.

## Business Rules

- **BR-01**: `/sejour/logement/depart` exige le cookie privé `lodging_id`.
- **BR-02**: La page réutilise `PrivateGuidePage`, `GuideApp` et la branche
  `departure` de `GuideLodgingViews`.
- **BR-03**: La checklist historique est extraite dans un composant partagé ;
  elle ne doit pas être dupliquée.
- **BR-04**: Les consignes proviennent de `getPrivateGuideData` et aucune donnée
  de démonstration n'est importée.
- **BR-05**: L'état coché reste en mémoire React locale, n'est ni persisté ni
  envoyé à une API.
- **BR-06**: La frame utilise une largeur maximale de 430 px, une hauteur
  `min(820px, calc(100dvh - 24px))`, une bordure blanche de 5 px et aucune
  propriété `zoom` ou `transform: scale()`.
- **BR-07**: Le fond extérieur doit rendre la bordure blanche perceptible sans
  modifier les couleurs internes du GuideApp.
- **BR-08**: Aucune migration Prisma ni nouvelle API.

## Data Model

Aucune migration. La page utilise `departureInstructions` du `GuideLodging`,
adapté depuis `LodgingCustomization.checkout_instructions`.

## API Contract

Aucune nouvelle API. La route est un Server Component privé et la checklist
fonctionne entièrement côté client.

## UI Behaviour

### Page `/sejour/logement/depart`

- Header et menu MyStay partagés.
- Retour `Guide logement`.
- Hero bleu nuit `Départ avant {heure}` avec icône rose.
- Carte checklist blanche avec compteur, barre de progression et cases.
- Texte coché barré, case remplie et progression mise à jour immédiatement.
- Navigation basse avec onglet Guide actif.

### Frame privée

- Conteneur extérieur plein viewport, centré, fond slate clair et padding 12 px.
- Frame `w-[min(430px,calc(100vw-24px))]`.
- Frame `h-[min(820px,calc(100dvh-24px))]`.
- Coins `rounded-[2.75rem]`, bordure blanche `5px`, ombre prononcée.
- `overflow-hidden` sur la frame ; scroll vertical conservé dans `GuideApp`.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | integration |
| AC-01-02 | integration |
| AC-01-03 | unit + integration |
| AC-01-04 | integration |
| AC-01-05 | integration |
| AC-02-01 | integration + e2e |
| AC-02-02 | integration + e2e |
| AC-02-03 | integration + e2e |
| AC-02-04 | integration + e2e |

## Out of Scope

- Persistance ou synchronisation de la progression de départ.
- Modification des consignes par le voyageur.
- Refonte des autres vues du guide.
- Ajout d'un visuel matériel réaliste avec encoche ou boutons latéraux.

## Open Questions

Aucune question ouverte pour cet incrément.
