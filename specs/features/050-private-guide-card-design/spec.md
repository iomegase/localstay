# Spec — 050 Private Guide Card Design

## Metadata

```yaml
id: 050-private-guide-card-design
title: "Design de cartes de la démo appliqué au guide privé"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-09-29
updated_at: 2026-09-29
depends_on:
  - 034-private-guide-app
  - 037-private-guide-arrival
  - 038-private-guide-practical-info
  - 039-private-guide-departure-frame
  - 045-public-demo-private-guide-reference
bounded_context: private-guide
implementation_gate: "Périmètre et décisions validés par le Product Owner le 2026-09-29"
```

## Context

La démo publique (spec 045, AC-01-07 à AC-01-13) a reçu un nouveau design de
cartes pour les quatre onglets du livret logement : carte navy indigo unique,
pastilles rondes atténuées, aucune carte imbriquée, titres de section masqués,
Wi-Fi « Tapoter pour copier ». Le Product Owner demande de dupliquer
exactement ce design dans le vrai guide privé (`/sejour`, vue logement), sans
perdre les fonctions propres au guide privé (markdown, lightbox photos/vidéo,
liens `tel:`, blocs pratiques saisis par l'Owner).

## Glossary References

- Guide privé : application `/sejour` d'un Tourist disposant d'un séjour actif.
- Livret logement : vues `arrival`, `practical`, `rules`, `departure` de
  `GuideLodgingViews`.
- Bloc pratique : `GuidePracticalCard` saisi par l'Owner.

## User Stories

### US-01 — Retrouver dans le vrai guide le design validé sur la démo

**As a** Tourist disposant d'un séjour actif

**I want to** consulter les onglets Accès, Infos, Équipements et Départ avec
des cartes lisibles et homogènes

**So that** le contenu occupe toute la largeur disponible et le livret soit
cohérent avec la démonstration publique

#### Acceptance Criteria

- **AC-01-01**: Given les quatre onglets du livret privé et leur carte
  d'en-tête, When ils sont rendus, Then toutes leurs cartes utilisent la classe
  `GUIDE_CARD` strictement identique à `DEMO_GUIDE_CARD` (spec 045), portent
  `data-guide-card`, et aucune carte n'est imbriquée dans une autre.
- **AC-01-02**: Given un onglet du livret privé, When il est rendu, Then les
  titres de section hors carte (`Localisation`, `Instructions`, `Urgences`,
  `Numéros utiles`, `Tri des déchets`, `Règlement`, `Équipements`) sont
  masqués à l'écran (`sr-only`) mais présents pour les lecteurs d'écran.
- **AC-01-03**: Given l'onglet Accès, When il est rendu, Then la localisation
  est une carte (pastille, rue en titre, code postal/ville en sous-titre,
  bouton Maps inchangé) et chaque instruction d'arrivée est une carte
  distincte (pastille ronde numérotée, titre, markdown pleine largeur,
  vignettes photo/vidéo ouvrant toujours la lightbox).
- **AC-01-04**: Given l'onglet Infos, When il est rendu, Then le Wi-Fi est une
  carte dont le mot de passe s'affiche dans un encart clair `Tapoter pour
  copier` qui copie le mot de passe dans le presse-papiers et confirme
  `Copié`.
- **AC-01-05**: Given l'onglet Infos, When les urgences sont rendues, Then une
  seule carte `112` est affichée (le `114` n'est plus affiché), cliquable
  vers `tel:112`.
- **AC-01-06**: Given des numéros utiles, When l'onglet Infos est rendu, Then
  chaque numéro est une carte-lien `tel:` (libellé en titre, numéro formaté à
  droite).
- **AC-01-07**: Given un logement avec poubelles configurées, point de tri
  et/ou bloc pratique `recycle`, When l'onglet Infos est rendu, Then aucune
  carte ou ligne par poubelle n'est affichée ; le texte des blocs `recycle`
  reste affiché dans sa carte ; une seule carte `Point de tri` ouvre Google
  Maps (lien `trashLocation` s'il existe, sinon recherche « point de tri
  <ville> »).
- **AC-01-08**: Given l'onglet Équipements, When il est rendu, Then le
  règlement intérieur est une carte à liste séparée par des filets et chaque
  bloc pratique (texte, média « Voir », contact `tel:`) est une carte au
  nouveau design, description pleine largeur.
- **AC-01-09**: Given l'onglet Départ, When il est rendu, Then la checklist est
  une seule carte (pastille, titre, compteur, texte d'introduction, barre de
  progression, lignes séparées par des filets, message de fin), sans carte
  imbriquée.

## Business Rules

- **BR-01**: Le design est dupliqué, pas partagé : le guide privé possède son
  propre module `GuideCard` (le bundle démo ne doit pas importer
  `features/guide-app`, spec 045 BR-02/AC-02-02). Un test garantit l'égalité
  stricte de `GUIDE_CARD` et `DEMO_GUIDE_CARD`.
- **BR-02**: Aucune donnée, requête, route ou migration n'est modifiée. Les
  poubelles restent en base et dans le dashboard Owner ; seul leur affichage
  dans le guide privé est retiré.
- **BR-03**: Les comportements existants sont conservés : markdown, lightbox,
  modal média, liens `tel:` et Maps, checklist locale.
- **BR-04**: La copie du mot de passe Wi-Fi utilise uniquement
  `navigator.clipboard.writeText`, sans persistance ni appel réseau ; en cas
  d'échec, l'encart reste sur `Tapoter pour copier`.
- **BR-05**: L'accueil du livret (cartes horaires, liens) et les autres écrans
  du guide (coups de cœur, carte, fiches POI) sont hors périmètre.

## Data Model

Aucun changement. Types existants de `src/features/guide-app/types.ts`
(`GuideLodging`, `GuideArrivalInstruction`, `GuidePracticalCard`).

## API Contract

Aucun changement.

## UI Behaviour

- Carte : `rounded-[26px] bg-indigo-950 px-5 py-4 text-white` + ombre douce ;
  pastille ronde `h-10 w-10` aux couleurs atténuées de la démo.
- Titres de section hors carte en `sr-only`.
- Accès : carte Localisation puis une carte par instruction.
- Infos : Wi-Fi (encart clair copiable), 112, numéros utiles, blocs
  `recycle`, Point de tri.
- Équipements : Règlement intérieur puis blocs pratiques (ordre actuel).
- Départ : une carte checklist.
- États : sections vides non rendues, comme aujourd'hui.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | integration |
| AC-01-02 | integration |
| AC-01-03 | integration |
| AC-01-04 | integration |
| AC-01-05 | unit + integration |
| AC-01-06 | integration |
| AC-01-07 | integration |
| AC-01-08 | integration |
| AC-01-09 | integration |

## Out of Scope

- Accueil du livret (`view="lodging"`), home `/sejour`, coups de cœur, carte,
  fiches POI, blog, contact.
- Modification des contenus Owner, du dashboard ou du schéma Prisma.
- Refactor commun démo/privé (BR-01).

## Open Questions

Aucune. Décisions du Product Owner du 2026-09-29 : point de tri seul (pas de
poubelles), urgence 112 seule, périmètre limité aux quatre onglets et à leur
carte d'en-tête.
