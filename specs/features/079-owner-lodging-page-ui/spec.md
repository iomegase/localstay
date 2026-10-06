# Spec — 079 Page « Logement » propriétaire : refonte et simplification

## Metadata

```yaml
id: 079-owner-lodging-page-ui
title: "Refonte UI de /dashboard/lodgings/<id>/showcase ; retrait des droits contenus ; un seul lien de réservation"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 028-lodging-showcase-seo
  - 077-owner-lodgings-guide-ui
bounded_context: lodging-showcase
implementation_gate: "PO 2026-10-06 : refonte UI à l'instar de la page Guide ; « Droits contenus ne sert à rien, on peut tout supprimer » ; « Annonce externe et Lien externe sont en doublon »."
```

---

## Context

La page empile neuf cartes sans ordre logique. « Annonce externe » (URL Airbnb/Booking source)
et « Lien externe » (URL de réservation) demandent la même adresse. « Droits contenus »
(case + « version de déclaration ») bloque la demande de publication sans valeur pour le PO.

---

## User Stories

### US-01 — Droits contenus supprimés

- **AC-01-01**: Given la page Logement, When elle s'affiche, Then il n'y a plus de bloc
  « Droits contenus ».
- **AC-01-02**: Given une demande de publication, When la fiche est complète, Then elle est
  acceptée sans confirmation de droits (règle `content_rights_confirmation` retirée, y compris
  dans l'évaluation admin).
- **AC-01-03**: Given la route `POST …/public-profile/rights-confirmation`, When elle est
  appelée, Then elle n'existe plus (404).

### US-02 — Un seul lien de réservation

- **AC-02-01**: Given la page, When elle s'affiche, Then un seul champ « Lien de réservation
  (Airbnb, Booking…) » subsiste, enregistré dans `external_booking_url` avec le brouillon ;
  le bloc « Annonce externe » et la route `…/public-profile/source-url` disparaissent.
- **AC-02-02**: Given une fiche sans lien de réservation mais avec une ancienne URL source,
  When la page s'affiche, Then le champ est pré-rempli avec cette URL.
- **AC-02-03** (PO 2026-10-06) : Given un lien saisi sans préfixe (`airbnb.fr/h/saint-gervaist2`)
  ou en `http://`, When le brouillon est enregistré, Then il est accepté et normalisé en
  `https://…` ; une adresse sans domaine valide reste refusée.

### US-03 — Page réorganisée (comme la page Guide)

- **AC-03-01**: Given la page, When elle s'affiche, Then les contenus sont regroupés en
  sections numérotées avec sommaire fixe : Présentation (titre, descriptions, rédaction
  assistée), Caractéristiques, Équipements, Photos, FAQ, Réservation et contact, Référencement
  (compteurs 30–70 / 80–180 et aperçu Google).
- **AC-03-02**: Given la barre fixe, When elle s'affiche, Then elle indique le statut en
  français (Brouillon, En revue, Publiée, Archivée), l'état des modifications, et propose
  « Sauvegarder le brouillon » et « Demander la publication » (propriétaire).
- **AC-03-03**: Given une demande refusée pour champs manquants, When elle revient, Then les
  champs sont listés en français.
- **AC-03-05** (PO 2026-10-06) : Given un texte alternatif saisi dans « Ajouter des photos »,
  When le propriétaire clique « Appliquer aux photos existantes », Then chaque photo reçoit
  « <pièce> — <texte> » (modification enregistrée avec le brouillon) ; le champ précise qu'il
  s'applique aux photos importées ensuite.
- **AC-03-04**: Given une fiche publiée, When la page s'affiche, Then l'en-tête propose « Voir
  la fiche publique ».

---

## Business Rules

- **BR-01**: Aucune donnée supprimée : colonnes `source_listing_*` et `content_rights_*`
  conservées, non modifiées (aucune migration).
- **BR-02**: Les autres règles de complétude (028) sont inchangées.
- **BR-03**: Le mode admin (même formulaire) n'affiche ni demande de publication ni
  rédaction assistée, comme avant.

---

## Data Model

Aucun changement.

---

## API Contract

- Supprimées : `POST /api/dashboard/lodgings/{id}/public-profile/rights-confirmation`,
  `POST /api/dashboard/lodgings/{id}/public-profile/source-url`.
- `POST …/public-profile/submit` : `content_rights_confirmation` n'apparaît plus dans
  `missingFields`.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..03 | Droits retirés (UI, complétude, route) | unit + integration |
| AC-02-01..02 | Lien de réservation unique, pré-rempli | integration |
| AC-03-01..04 | Sections + sommaire, barre de statut, champs manquants, lien public | integration |

---

## Out of Scope

- Suppression des colonnes en base ; refonte de la fiche publique.

---

## Open Questions

Aucune.
