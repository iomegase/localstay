# Spec — 096 Numéros de téléphone au format international (+33)

## Metadata

```yaml
id: 096-phone-e164
title: "Tous les numéros enregistrés au format international E.164 (+33…, sans 0 ni espaces)"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-08
updated_at: 2026-10-08
bounded_context: shared
implementation_gate: "PO 2026-10-08 : « normer tous les numéros avec +33 et le reste du numéro sans le zéro et les espaces » (un opérateur français comprend aussi +33)."
```

## Context

44 des 45 numéros de lieux étaient enregistrés au format national (« 04 50 47 78 95 ») et la plupart
des liens d'appel composaient ce format (`tel:0450…`) : depuis un téléphone étranger en itinérance,
l'appel peut échouer. Seuls les « Numéros utiles » du guide utilisaient déjà `tel:+33…`.

## User Stories

- **AC-01**: Tout numéro français enregistré (lieux, candidats d'acquisition, demandes de POI
  manquants, événements, commerçants, messages de contact, utilisateurs, « Numéros utiles » du guide)
  est stocké en `+33` suivi des 9 chiffres, sans 0 ni espace (`04 50 47 78 95`, `0033 4 50…`,
  `+33 (0)4 50…` → `+33450477895`).
- **AC-02**: Un numéro étranger est stocké avec son indicatif, sans espace (`+41 22 …` → `+4122…`,
  `0041…` → `+41…`). Les numéros courts (15, 112, 3624…) et les textes non reconnus restent inchangés.
- **AC-03**: Les liens d'appel composent toujours le numéro stocké (`tel:+33450477895`), partout
  (guide privé, fiches publiques, équipements, numéros utiles).
- **AC-04**: Les numéros sont affichés lisiblement par groupes : `+33 4 50 47 78 95`.
- **AC-05**: Les numéros existants sont convertis une fois (script idempotent, avant/après journalisés).

## Business Rules
- **BR-01**: Conversion à chaque écriture (acquisition Google — numéro international de Google en
  priorité —, saisies admin, propriétaire, commerçant, formulaires de contact, DATAtourisme).
- **BR-02**: Aucun numéro n'est perdu : une valeur non reconnue est conservée telle quelle.

## Data Model / API Contract
Aucun changement de schéma. Les champs texte existants reçoivent la forme normalisée.

## Acceptance Criteria
AC-01 à AC-05.

## Out of Scope
Validation de l'existence du numéro ; formats d'affichage par pays étranger (affiché tel que stocké).

## Open Questions
Aucune.
