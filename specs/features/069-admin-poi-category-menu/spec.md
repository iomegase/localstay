# Spec — 069 Admin POI : menu de catégories et sous-catégories

## Metadata

```yaml
id: 069-admin-poi-category-menu
title: "Filtrer la liste admin des POI par catégorie et sous-catégorie en un clic"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 022-admin-poi-management
  - 068-admin-poi-edit-panel
bounded_context: admin-ui
implementation_gate: "PO 2026-10-06 : « peut-on créer un sous-menu des catégories pour mieux filtrer les résultats » → choix « Admin › POI » (pastilles catégories puis sous-catégories, filtre au clic)."
```

---

## Context

Dans `/admin/pois`, la catégorie se choisit dans un menu déroulant qui ne s'applique
qu'après clic sur « Filtrer », sans indication du nombre de POI par catégorie. Le
filtre par sous-catégorie existe côté serveur (`subcategory_id`) mais n'a aucune
interface. Ranger les POI dans la taxonomie (ex. « Location de ski ») impose donc de
parcourir toute une catégorie.

---

## Glossary References

- **Taxonomie** — catégories et sous-catégories d'Admin › Taxonomie (ordre `sort_order`).
- **Filtres de liste** — paramètres d'URL de `/admin/pois` (spec 068 BR-03).

---

## User Stories

### US-01 — Filtrer par catégorie en un clic

#### Acceptance Criteria

- **AC-01-01**: Given la liste d'une ville, When elle s'affiche, Then une rangée de
  pastilles « Toutes (N) » puis une pastille par catégorie (ordre taxonomie) avec son
  nombre de POI remplace le menu déroulant « Catégorie ».
- **AC-01-02**: Given les pastilles, When les nombres sont calculés, Then ils tiennent
  compte de la ville, de la recherche et des filtres de statut, de publication, de
  photo, de géocodage et de source, mais pas de la catégorie ni de la sous-catégorie.
  Une catégorie à 0 POI n'est pas affichée, sauf si elle est sélectionnée.
- **AC-01-03**: Given un clic sur une pastille, When la liste se recharge, Then le
  filtre s'applique immédiatement (lien, sans bouton « Filtrer »), la page revient à
  1, la sous-catégorie est retirée et tous les autres filtres sont conservés.
- **AC-01-04**: Given la catégorie active, When la rangée s'affiche, Then sa pastille
  est mise en évidence et annoncée (`aria-current="page"`).

### US-02 — Affiner par sous-catégorie

#### Acceptance Criteria

- **AC-02-01**: Given une catégorie sélectionnée, When la liste s'affiche, Then une
  seconde rangée propose « Toutes (N) », chaque sous-catégorie de la taxonomie ayant
  au moins un POI (avec son nombre), puis « Sans sous-catégorie (N) » si N > 0.
- **AC-02-02**: Given un clic sur une sous-catégorie, When la liste se recharge, Then
  seuls ses POI sont listés, page 1, autres filtres conservés.
- **AC-02-03**: Given « Sans sous-catégorie », When elle est choisie, Then seuls les
  POI de la catégorie sans sous-catégorie sont listés (`subcategory_id=none`), pour
  faciliter leur classement.
- **AC-02-04**: Given aucune catégorie sélectionnée, When la liste s'affiche, Then la
  rangée des sous-catégories n'est pas affichée.

---

## Business Rules

- **BR-01**: Les libellés et l'ordre viennent de la taxonomie admin ; rien n'est codé
  en dur.
- **BR-02**: Les filtres restent portés par l'URL (068 BR-03) ; les pastilles sont des
  liens, utilisables au clavier et ouvrables dans un nouvel onglet.
- **BR-03**: `subcategory_id=none` filtre `subcategory_id IS NULL` ; toute autre valeur
  garde le comportement actuel.
- **BR-04**: Aucune modification du schéma ni des routes API.

---

## Data Model

Aucun changement.

---

## API Contract

Pas de nouvelle route. Requête serveur `getAdminPoiTaxonomyCounts(filters)` (lecture
Prisma `groupBy` sur `category_id`, `subcategory_id`).

---

## UI Behaviour

- Sous le formulaire de filtres : rangée « Catégories », puis rangée
  « Sous-catégories » quand une catégorie est choisie ; pastilles arrondies, défilement
  horizontal sur mobile ; le menu déroulant « Catégorie » est retiré du formulaire.
- Shadcn/ui, Tailwind, style des pastilles admin existantes.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01 | Pastilles « Toutes » + catégories (ordre taxonomie) avec nombres | integration |
| AC-01-02 | Nombres selon les autres filtres ; catégories vides masquées | unit |
| AC-01-03 | Lien : page 1, sous-catégorie retirée, filtres conservés | unit + integration |
| AC-01-04 | Pastille active mise en évidence + aria-current | integration |
| AC-02-01 | Rangée sous-catégories + « Sans sous-catégorie » | integration |
| AC-02-02 | Filtre sous-catégorie, page 1 | integration |
| AC-02-03 | `subcategory_id=none` → sans sous-catégorie | unit |
| AC-02-04 | Pas de rangée sans catégorie choisie | integration |

---

## Out of Scope

- Sélection multiple de catégories.
- Pastilles sur la page publique `/decouvrir` (déjà traitée par la spec 065).
- Recatégorisation en masse.

---

## Open Questions

Aucune.
