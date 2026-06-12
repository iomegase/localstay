# Agenda public des sorties — Design

**Date :** 2026-06-12
**Statut :** Design validé (structure d'ensemble approuvée), en attente de relecture spec.
**Contexte :** Suite de la Spec 026 (ingestion DATAtourisme, feature `events-acquisition`). Ce spec couvre **l'affichage public** des événements, qui n'existait pas encore (la 026 était « pipeline data uniquement »).

## Objectif

Mettre les « Sorties culturelles & manifestations » à disposition des visiteurs du guide, **par ville**, via une page agenda dédiée et une page de détail par événement.

## Décisions produit (validées)

- **Point d'entrée :** une **page agenda dédiée par ville**, accessible via une tuile « Sorties culturelles » dans la rangée des catégories.
- **Détail :** chaque événement a une **page de détail dédiée** (URL propre, donc slug requis).
- **Organisation de la liste :** **chronologique** (le plus proche en premier) **+ filtre par type** (Tout / Culturel / Sport / Marché…).

## Architecture

Le guide actuel suit le tube `City → Category → PointOfInterest → POI détail`. Les événements sont d'une **autre nature** (modèle `Event` séparé, datés, non-POI), donc ils ont leur **propre rail** parallèle, sans passer par `Category`/`PointOfInterest`.

Nouvelle feature **`events-public`** (distincte de `events-acquisition` qui reste côté ingestion/admin), avec ses propres `queries` et `components`.

```
City ──(insee_code / city_id)── Event ──(slug)── page détail
                                  │
                         page agenda /guide/[ville]/agenda
                                  ▲
                         tuile « Sorties » dans CategoryRow
```

## Couche 1 — Lien événement ↔ ville (prérequis data)

**Problème :** `Event.city_id` est aujourd'hui souvent `null` car les `City.insee_code` des 3 communes ne sont pas seedés. Une page agenda **par ville** a besoin d'un rattachement fiable.

**Décision :**
1. **Seeder `City.insee_code`** pour les communes concernées : Chamonix-Mont-Blanc `74056`, Saint-Gervais-les-Bains `74236`, Les Contamines-Montjoie `74085`. (Idempotent : `update` par slug.)
2. La requête agenda filtre les événements d'une ville par **`city_id = city.id` OU `commune_insee = city.insee_code`** (le `OR` couvre les événements ingérés avant le seed, dont `city_id` est resté `null`).
3. Ne garder que les événements **à venir et actifs** : `end_date >= début du jour` ET `is_active = true` ET `deleted_at = null`.

Aucune migration de schéma ici : `City.insee_code` et toutes les colonnes `Event` existent déjà.

## Couche 2 — Slug d'événement

**Décision :** ajouter une colonne `Event.slug String?`.

- **Génération :** `slugify(title)` + suffixe court dérivé du `source_id` (ex. 4 caractères) pour garantir l'unicité même si deux événements partagent un titre → ex. `concert-au-theatre-a1b2`.
- **Quand :** généré à l'**ingestion** (dans `ingest-runner` / `toRow`) **et** par un **backfill one-shot** pour les événements déjà en base.
- **Contrainte :** unicité applicative (le suffixe issu du `source_id` la garantit en pratique). On ne met **pas** de contrainte `@unique` SQL stricte dans un premier temps pour éviter de bloquer un backfill sur une collision résiduelle ; l'unicité est assurée par construction. Index simple `@@index([slug])` pour la lecture.
- **Migration :** ajout colonne `slug` (nullable) + index. DDL appliqué en prod selon [[reference_db_migration_apply]] (db execute + migrate resolve).

## Couche 3 — Pages & composants (`events-public`)

### Entrée : tuile « Sorties culturelles »
- Ajoutée dans la `CategoryRow` de la page ville, **affichée uniquement si la ville a ≥ 1 événement à venir** (parallèle de la règle « catégorie masquée si `poi_count = 0 `»).
- Visuellement distincte des catégories POI (c'est un lien spécial, pas une `Category`).
- Lien → `/guide/[ville]/agenda`.

### Page agenda — `/guide/[ville]/agenda`
- Server component. Récupère les événements à venir de la ville.
- **Filtre par type** en tête, réutilisant le style de `SubCategoryFilter` (POI). Filtre via query param `?type=` ; « Tout » par défaut.
- Liste **chronologique** (tri `start_date asc`). Chaque **carte d'événement** : photo (ou placeholder — DATAtourisme a peu de photos pour ces communes), titre, dates formatées (FR), lieu (`venue_name` / `commune_name`).
- Lien carte → page détail.
- État vide : si aucun événement, message « Aucune sortie à venir » (cohérent avec `guide.empty_state`).

### Page détail — `/guide/[ville]/agenda/[event-slug]`
- Server component. Calquée sur `PoiDetailBody`.
- Contenu : hero photo (carrousel si plusieurs images, sinon placeholder), titre, dates/horaires, lieu + adresse, description complète, bouton « Site officiel / billetterie » (`website`), contact si présent.
- `notFound()` (404) si le slug est inconnu ou si l'événement est passé/inactif.

## Données / requêtes — `events-public/queries/agenda.ts`

- `getCityAgenda(citySlug, { type? }): Promise<AgendaListItem[] | null>` — résout la ville (par slug), retourne `null` si ville inconnue ; sinon les événements à venir filtrés par ville (`city_id` OR `insee`) et par type optionnel, triés `start_date asc`.
- `getEventBySlug(citySlug, eventSlug): Promise<AgendaEventDetail | null>` — événement par slug, restreint à la ville et aux événements à venir/actifs ; `null` sinon.
- `cityHasUpcomingEvents(cityId, insee): Promise<boolean>` (ou compteur) — pour décider l'affichage de la tuile.
- **Mapping des types :** les `event_types` bruts DATAtourisme (ex. `CulturalEvent`, `SportsEvent`, `LocalAnimation`…) sont mappés vers un petit ensemble de **libellés de filtre lisibles** (Culturel / Sport / Marché / Autre) dans un helper `lib/event-type-labels.ts`. Le filtre `?type=` opère sur ces libellés.

## Formatage des dates

Helper `lib/format-event-date.ts` : affichage FR lisible (« ven. 13 juin », « du 13 au 15 juin »), gérant l'événement 1 jour vs. multi-jours. Pas de dépendance lourde (Intl.DateTimeFormat `fr-FR`).

## Tests

- **Requêtes** (`tests/integration`) : filtrage par ville (city_id OR insee), exclusion des événements passés/inactifs, filtre par type, ville inconnue → `null`.
- **Slug** (`tests/unit`) : génération déterministe, unicité via suffixe `source_id`, caractères accentués/spéciaux nettoyés.
- **Type labels** (`tests/unit`) : mapping des `event_types` bruts → libellés, fallback « Autre ».
- **Format date** (`tests/unit`) : 1 jour, multi-jours, même mois / mois différents.
- **Pages** (`tests/integration` ou contract) : agenda rend la liste filtrée ; détail rend l'événement ; slug inconnu → 404 ; ville sans événement → état vide / pas de tuile.

## Hors scope (YAGNI)

- Agenda multi-villes / global.
- Carte des événements.
- Favoris, inscription, notifications, rappels.
- Achat de billets intégré (on renvoie vers le site externe).
- Pagination / scroll infini (volume faible : Chamonix ~97, autres < 10). À ajouter si le volume grossit.

## Dépendances & risques

- **Couverture data faible** (constat Spec 026) : Saint-Gervais ≈ 7 événements, peu/pas de photos. L'UI doit bien gérer le placeholder et les listes courtes. La vraie richesse viendra d'Apidae plus tard (autre source, même rail d'affichage).
- **Seed `insee_code` + backfill slug** doivent tourner **avant** que les pages soient utiles ; appliqués en prod par l'utilisateur (DB directe injoignable du sandbox, cf. [[reference_db_migration_apply]]).

## Ordre d'implémentation suggéré

1. Migration `Event.slug` + seed `City.insee_code` + backfill slug.
2. Génération slug à l'ingestion (`ingest-runner`).
3. Helpers (`event-type-labels`, `format-event-date`) + tests.
4. Requêtes `agenda.ts` + tests.
5. Page agenda + carte + filtre.
6. Page détail.
7. Tuile « Sorties » dans `CategoryRow`.
8. Revue finale.
