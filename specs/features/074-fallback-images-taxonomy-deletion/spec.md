# Spec — 074 Images de remplacement : suppression d'une catégorie ou sous-catégorie

## Metadata

```yaml
id: 074-fallback-images-taxonomy-deletion
title: "Ne plus perdre les images de remplacement quand une catégorie ou sous-catégorie est supprimée"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 017-admin-taxonomy
  - 070-fallback-image-library
bounded_context: admin-taxonomy
implementation_gate: "PO 2026-10-06 : « ajuste le chantier des fallback » (proposition : sous-catégorie supprimée → images remontent dans la catégorie ; catégorie supprimée → « Non classées » ; nombre d'images dans la confirmation)."
```

---

## Context

Les images de remplacement (070) sont rattachées par identifiant à une catégorie et
éventuellement une sous-catégorie. Renommer ou modifier la taxonomie ne les affecte pas.
En revanche, quand une catégorie ou une sous-catégorie est supprimée (soft delete), ses
images restent rattachées à l'élément supprimé : elles ne servent plus à aucun lieu et
n'apparaissent pas dans « Non classées ».

---

## User Stories

### US-01 — Images reclassées à la suppression

#### Acceptance Criteria

- **AC-01-01**: Given une sous-catégorie avec des images, When elle est supprimée, Then
  ses images restent dans la catégorie parente, sans sous-catégorie (« catégorie seule »,
  070 BR-01), et restent donc attribuables.
- **AC-01-02**: Given une catégorie avec des images (dans la catégorie ou ses
  sous-catégories), When elle est supprimée, Then ses images passent dans « Non classées »
  (catégorie et sous-catégorie vides).
- **AC-01-03**: Given une suppression refusée (POI actifs, 409), When elle échoue, Then
  aucune image n'est modifiée.

### US-02 — Confirmation informée

#### Acceptance Criteria

- **AC-02-01**: Given Admin › Taxonomie, When l'admin ouvre la confirmation de
  suppression d'un élément ayant N images (N > 0), Then elle indique « N image(s) de
  remplacement remonteront dans « <catégorie> » » (sous-catégorie) ou « … repasseront
  dans « Non classées » » (catégorie).

---

## Business Rules

- **BR-01**: Le reclassement a lieu dans la même transaction que la suppression.
- **BR-02**: Les images retirées (soft delete) ne sont pas concernées.
- **BR-03**: Aucun fichier de stockage n'est supprimé (070 BR-06).
- **BR-04**: La désactivation (sans suppression) ne reclasse pas les images.

---

## Data Model

Aucun changement de schéma.

---

## API Contract

- `DELETE /api/admin/taxonomy/categories/{id}` et `/subcategories/{id}` : inchangés.
- `GET /api/admin/taxonomy` : chaque catégorie et sous-catégorie expose
  `fallback_image_count` (images non retirées rattachées ; pour une catégorie, y compris
  celles de ses sous-catégories).

---

## UI Behaviour

Boîte de confirmation de suppression : ligne d'information supplémentaire si N > 0.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..03 | Reclassement à la suppression, rien si refus | unit |
| AC-02-01 | Nombre d'images dans la confirmation | unit + integration |

---

## Out of Scope

- Reclassement à la désactivation.
- Déplacement d'une sous-catégorie vers une autre catégorie.

---

## Open Questions

Aucune.
