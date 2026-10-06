# Spec — 083 Erreurs affichées sous les champs (pages Guide et Logement)

## Metadata

```yaml
id: 083-inline-form-errors
title: "Indiquer en rouge, sous chaque champ, les éléments manquants ou invalides"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 077-owner-lodgings-guide-ui
  - 079-owner-lodging-page-ui
  - 080-lodging-structured-address
bounded_context: dashboard-owner
implementation_gate: "PO 2026-10-06 : « indiquez en rouge dans le formulaire les éléments manquants sous les champs manquants » (ex. « arrival_instructions - Le texte de l'instruction est requis. »)."
```

## Context

Les erreurs de validation s'affichent en une phrase technique dans la barre du bas
(« arrival_instructions - Le texte de l'instruction est requis. ») sans indiquer quelle
instruction ni quel champ corriger.

## User Stories

### US-01 — Page Guide

- **AC-01-01**: Given une sauvegarde, When une instruction d'arrivée n'a pas de texte, un bloc
  personnalisé n'a pas de titre, un code postal n'a pas 5 chiffres ou un lien vidéo n'est pas
  YouTube, Then le message s'affiche en rouge sous le champ concerné (champ bordé de rouge,
  `aria-invalid`), l'enregistrement n'est pas envoyé et la page défile jusqu'à la première erreur.
- **AC-01-02**: Given une erreur renvoyée par l'API, When elle revient, Then elle s'affiche sous
  le champ désigné par son chemin (`arrival_instructions.0.text`…) ; l'API ajoute `issues`
  (`path`, `message`) au détail de l'erreur, sans retirer le format existant.
- **AC-01-03**: Given des erreurs affichées, When le champ est corrigé, Then son message
  disparaît sans attendre une nouvelle sauvegarde ; la barre indique « N champ(s) à corriger ».

- **AC-01-04** (PO 2026-10-06, amende 054) : Given une étape d'arrivée, When elle n'a pas de
  texte mais a un titre, une photo, une vidéo, une sous-étape ou un repère, Then elle est
  acceptée (texte facultatif) ; seule une étape entièrement vide est signalée (« Étape vide :
  ajoutez un titre, un texte ou une photo. »).

### US-02 — Page Logement

- **AC-02-01**: Given une sauvegarde refusée (`fieldErrors`) ou une demande de publication
  incomplète (`missingFields`), When elle revient, Then chaque message s'affiche en rouge sous
  le champ ou la section concernés (titre, descriptions, type, voyageurs, équipements, photos /
  couverture, lien de réservation, SEO…), en plus du récapitulatif existant.
- **AC-02-02**: Given un champ signalé, When il est modifié, Then son message disparaît.

## Business Rules

- **BR-01**: Règles de validation inchangées (seul l'affichage change).
- **BR-02**: Messages en français ; aucun nom technique (`arrival_instructions`) affiché.

## Data Model

Aucun changement.

## API Contract

`PUT /api/dashboard/lodgings/{id}/customization` 400 : `details.issues: { path: string;
message: string }[]` ajouté (champs existants `fieldErrors` / `formErrors` conservés).

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..03 | Guide : erreurs sous les champs, chemin API, effacement à la correction | unit + contract + integration |
| AC-02-01..02 | Logement : erreurs et champs manquants sous les champs | integration |

## Out of Scope

- Nouvelles règles de validation.

## Open Questions

Aucune.
