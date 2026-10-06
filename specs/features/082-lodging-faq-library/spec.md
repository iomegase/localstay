# Spec — 082 Bibliothèque de FAQ génériques pour les logements

## Metadata

```yaml
id: 082-lodging-faq-library
title: "Rendre génériques les questions-réponses de FAQ et les proposer à tous les logements"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 028-lodging-showcase-seo
  - 079-owner-lodging-page-ui
bounded_context: lodging-showcase
implementation_gate: "PO 2026-10-06 : « rendre mes questions et réponses des FAQ génériques et les mettre à disposition pour les logements »."
```

## Context

Le PO a rédigé 13 questions-réponses sur le logement « Le 305 ». Elles valent pour la plupart
des logements MyStay, à quelques valeurs près (ville, capacité, chambres, règles propres).

## User Stories

### US-01 — Bibliothèque générique

- **AC-01-01**: Given la bibliothèque, When elle est consultée, Then elle contient les 13
  questions du PO réécrites de façon générique (capacité, couchages, horaires, arrivée
  autonome, linge, ménage, parking, accès en hiver, animaux, bébés, pistes, centre-ville,
  services MyStay).
- **AC-01-02**: Given un logement, When une question est ajoutée, Then `{ville}`,
  `{voyageurs}` et `{chambres}` sont remplacés par la ville, la capacité et le nombre de
  chambres du logement (forme générique si l'information manque).
- **AC-01-03**: Given une réponse contenant encore un passage `[à adapter]`, When elle
  s'affiche dans le formulaire, Then elle porte un badge « À adapter ».

### US-02 — Ajout depuis la page Logement

- **AC-02-01**: Given la section FAQ, When le propriétaire clique « Ajouter depuis la
  bibliothèque », Then la liste des questions de la bibliothèque absentes de sa FAQ s'affiche
  avec des cases à cocher, « Tout sélectionner » et « Ajouter (N) ».
- **AC-02-02**: Given des questions ajoutées, When le brouillon est sauvegardé, Then elles sont
  enregistrées comme les autres questions (modifiables, supprimables) ; une question déjà
  présente (même intitulé) n'est jamais ajoutée deux fois.

## Business Rules

- **BR-01**: Les FAQ existantes des logements ne sont pas modifiées.
- **BR-02**: Bibliothèque versionnée dans le code (`lib/faq-library.ts`).
- **BR-03**: Horaires par défaut alignés sur le guide : arrivée 16 h, départ 10 h.

## Data Model / API Contract

Aucun changement (les questions ajoutées passent par le `PUT` du brouillon existant).

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..03 | Bibliothèque, remplissage, badge « À adapter » | unit + integration |
| AC-02-01..02 | Ajout depuis la bibliothèque, pas de doublon | integration |

## Out of Scope

- Édition de la bibliothèque depuis l'admin ; traduction.

## Open Questions

Aucune.
