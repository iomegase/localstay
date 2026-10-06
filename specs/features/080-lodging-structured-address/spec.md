# Spec — 080 Adresse du logement structurée

## Metadata

```yaml
id: 080-lodging-structured-address
title: "Saisir l'adresse du logement en numéro / rue / code postal / ville (Guide), réutilisée par la page Logement"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 055-lodging-address-geocoding
  - 077-owner-lodgings-guide-ui
  - 079-owner-lodging-page-ui
bounded_context: guide-customization
implementation_gate: "PO 2026-10-06 : « modifier le formulaire pour l'adresse numéro, rue, code postal, ville » ; périmètre « Les deux » (page Guide + page Logement)."
```

## Context

L'adresse du logement est un champ libre unique (`lodging_address`), géocodé pour la carte
et l'itinéraire du guide. Les saisies sont hétérogènes. La page Logement n'expose qu'une
« zone de localisation publique » libre, sans lien avec l'adresse.

## User Stories

### US-01 — Adresse structurée (page Guide)

- **AC-01-01**: Given la section « Le logement » de la page Guide, When elle s'affiche, Then
  l'adresse se saisit en 4 champs : Numéro, Rue, Code postal (5 chiffres), Ville (pré-remplie
  avec la ville du logement si vide).
- **AC-01-02**: Given un enregistrement, When les champs sont envoyés, Then l'adresse complète
  `"<numéro> <rue>, <code postal> <ville>"` est recomposée côté serveur dans `lodging_address`
  (géocodage inchangé) et les 4 parties sont enregistrées.
- **AC-01-03**: Given une adresse saisie avant cette spec (texte libre), When la page s'affiche,
  Then les 4 champs sont pré-remplis par découpage de l'ancienne adresse quand c'est possible
  (sinon la rue reçoit le texte complet).
- **AC-01-04**: Given un code postal invalide, When on enregistre, Then l'API répond 400.

### US-02 — Réutilisation par la page Logement

- **AC-02-01**: Given la page Logement (propriétaire), When la section Caractéristiques
  s'affiche, Then l'adresse du logement apparaît en lecture seule (« privée, jamais affichée »)
  avec un lien « Modifier dans le Guide » ; sans adresse, un lien invite à la renseigner.
- **AC-02-02**: Given le champ public, When il s'affiche, Then il s'intitule « Quartier affiché
  (facultatif) » : seuls la ville et ce quartier sont publics.

## Business Rules

- **BR-01**: L'adresse exacte n'est jamais publiée (inchangé).
- **BR-02**: `lodging_address` reste la source du géocodage (055) et des pages existantes.

## Data Model

```prisma
model LodgingCustomization {
  address_number      String?
  address_street      String?
  address_postal_code String?
  address_city        String?
}
```

Migration additive.

## API Contract

`PUT /api/dashboard/lodgings/{id}/customization` : champs optionnels `address_number` (≤ 10),
`address_street` (≤ 200), `address_postal_code` (`^\d{5}$` ou vide), `address_city` (≤ 120) ;
s'ils sont présents, `lodging_address` est recomposée. Réponse : les 4 champs.

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..04 | Saisie structurée, recomposition, reprise de l'existant, validation | unit + contract + integration |
| AC-02-01..02 | Adresse en lecture seule sur la page Logement, quartier public | integration |

## Out of Scope

- Autocomplétion d'adresse ; changement du géocodage.

## Open Questions

Aucune.
