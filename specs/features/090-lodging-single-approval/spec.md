# Spec — 090 Validation unique à la mise en ligne d'un logement

## Metadata

```yaml
id: 090-lodging-single-approval
title: "Un logement est validé une seule fois par l'Admin, à sa première mise en ligne"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-07
updated_at: 2026-10-07
depends_on:
  - 028-lodging-showcase-seo
  - 079-owner-lodging-page-redesign
bounded_context: lodging-showcase
implementation_gate: "PO 2026-10-07 : « un logement doit être validé une seule fois à la mise en ligne, pas à chaque modification »."
supersedes: "028 AC-05-02 (sauvegarde en draft) et AC-05-11 / BR-12j pour une fiche déjà publiée"
```

## Context

Chaque enregistrement de la page « Logement » par l'Owner repasse la fiche en `draft` : elle disparaît
du site et l'Owner doit redemander une validation au super admin. C'est inutile une fois le logement
validé.

## User Stories

- **AC-01**: Given une fiche `published`, When l'Owner enregistre des modifications, Then elle reste
  `published`, les modifications sont en ligne immédiatement (pages publiques revalidées) et aucune
  demande de validation n'est nécessaire.
- **AC-02**: Given une fiche `draft`, `review` ou `archived`, When l'Owner enregistre, Then son statut
  ne change pas (une fiche en `review` reste dans la file de l'Admin).
- **AC-03**: Given la génération d'une proposition de réécriture MyStay (028 AC-05-10), When elle est
  enregistrée, Then le statut de la fiche ne change pas (la proposition n'est appliquée qu'à
  l'enregistrement par l'Owner).
- **AC-04**: Given une fiche `published`, When l'Owner ouvre la page « Logement », Then le bouton
  principal est « Enregistrer » (au lieu de « Sauvegarder le brouillon »), « Demander la publication »
  n'est pas proposé, et après enregistrement le message indique « Modifications en ligne. ».
- **AC-05**: La première mise en ligne reste soumise à la validation Admin (`draft` → `review` →
  `published`, 028 inchangé), ainsi que la dépublication / l'archivage par l'Admin.

## Business Rules

- **BR-01**: Seuls l'Admin (validation, demande de correction, archivage) et la demande de publication
  de l'Owner modifient `publication_status`.
- **BR-02**: Le slug d'une fiche déjà publiée reste figé (028 BR-13 inchangé).

## Data Model

Aucun changement.

## API Contract

`PUT /api/dashboard/lodgings/{id}/public-profile` : la réponse renvoie le statut inchangé
(`published` reste `published`). Aucun autre changement.

## UI Behaviour

Voir AC-04.

## Acceptance Criteria

AC-01 à AC-05.

## Out of Scope

Historique des versions, modération a posteriori, notification de l'Admin à chaque modification.

## Open Questions

Aucune.
