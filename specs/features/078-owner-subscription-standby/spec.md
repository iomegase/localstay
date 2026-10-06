# Spec — 078 Abonnement propriétaire en veille

## Metadata

```yaml
id: 078-owner-subscription-standby
title: "Mettre /dashboard/subscription en veille tant que l'abonnement n'est pas actif"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 020-subscription-owner
bounded_context: dashboard-owner
implementation_gate: "PO 2026-10-06 : « subscription n'est pas encore actif. peut-on juste réparer l'erreur et mettre cette page en veille ? »"
```

## Context

Depuis la réinitialisation de la base (2026-10-06), les propriétaires n'ont plus de ligne
`Subscription` : la page lève `SUBSCRIPTION_NOT_FOUND` et plante. L'abonnement n'est pas
encore commercialisé.

## User Stories

### US-01 — Page en veille

- **AC-01-01**: Given un propriétaire, When il ouvre /dashboard/subscription, Then la page
  affiche « L'abonnement arrive bientôt » sans erreur, qu'il ait ou non une ligne d'abonnement.
- **AC-01-02**: Given le menu du tableau de bord, When il s'affiche, Then l'entrée « Abonnement »
  n'apparaît plus.

## Business Rules

- **BR-01**: Le code des abonnements (requêtes, API, plans, cron) est conservé tel quel.
- **BR-02**: Aucune donnée créée ni modifiée.

## Data Model

Aucun changement.

## API Contract

Inchangé.

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..02 | Page en veille sans erreur, entrée de menu masquée | integration |

## Out of Scope

- Créer les abonnements manquants ; réactivation de la page (spec ultérieure).

## Open Questions

Aucune.
