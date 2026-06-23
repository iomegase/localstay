# Recommandations POI inter-villes (cross-city) — Design

**Date:** 2026-06-22
**Statut:** approuvé (brainstorming), à planifier

> Mise à jour du 2026-06-23 : la restriction d'affichage à
> `/nos-recommandations` est partiellement remplacée par
> `2026-06-23-cross-city-owner-comments-lodging-showcase-design.md`. Les POI
> inter-villes restent exclus des listes géographiques du Guide, mais sont aussi
> affichés sur la fiche publique du logement.

## Objectif

Permettre à l'owner de recommander des POI situés dans d'**autres villes** que celle de son logement, et de les afficher dans ses recommandations. Aujourd'hui le formulaire ne propose que les POI de la ville du logement (rayon 30 km) et `validateFeaturedPois` rejette tout POI hors périmètre.

## Décisions de cadrage (issues du brainstorming)

- **Périmètre de sélection** : l'owner choisit une ou plusieurs *villes d'intérêt*, puis pioche leurs POI.
- **Surface d'affichage initiale** : les POI cross-city apparaissent sur la page dédiée `/nos-recommandations`, pas dans les listes géo-scopées `/guide/[ville]`. La fiche publique du logement a été ajoutée comme seconde surface par la décision du 2026-06-23.
- **Regroupement** : recos locales groupées par catégorie (comme aujourd'hui) ; en dessous, une section **« À découvrir ailleurs »** groupée par ville.
- **Limite** : max **5 POI par ville d'intérêt** (toutes catégories confondues) pour la section ailleurs ; les locaux gardent 5 par catégorie.
- **Approche A retenue** : aucun changement de schéma ; le bucket local/ailleurs est **dérivé** de la ville du POI.

## Modèle & bucketing

- Stockage inchangé : `lodgingFeaturedPoi(lodging_id, poi_id, sort_order)`. Un POI cross-city y est rangé comme les autres ; aucune migration.
- **Règle de bucket (source de vérité unique)** : un featured POI est *local* si `poi.city_id === lodging.city_id`, sinon *ailleurs*. Cette règle sert à la validation, à l'affichage et au comptage des limites. Aucun flag stocké, aucune table de « villes d'intérêt » : les villes affichées dans le form se dérivent des POI cross-city déjà enregistrés.
- Conséquence : les POI locaux conservent exactement le comportement actuel.

## Validation serveur (`validateFeaturedPois`, `src/features/guide-customization/queries/customization.ts`)

Comportement actuel : rejet de tout POI hors périmètre via `isPoiWithinGuideScope` (rayon `GUIDE_RADIUS_KM = 30`).

Nouveau comportement :
1. Charger chaque POI demandé (`id, city_id, category {slug}, is_active, deleted_at`). Rejeter (erreur de validation) les inexistants, `deleted_at != null`, ou `is_active = false`.
2. Bucketer par `poi.city_id === lodging.city_id` :
   - **local** → règle inchangée : max 5 par catégorie (`groupFeaturedPoisByCategory` / `FEATURED_POI_LIMIT_PER_CATEGORY`).
   - **ailleurs** → max **5 par `poi.city_id`** (nouveau garde-fou `FEATURED_POI_LIMIT_PER_OTHER_CITY = 5`), toutes catégories confondues. Dépassement → erreur de validation.
3. Le rejet « hors périmètre 30 km » est **abandonné** (cœur de la feature). `isPoiWithinGuideScope` n'est plus utilisé pour bloquer le cross-city.

**Impact tests existants** : les suites qui asservissent le rejet hors-scope — `tests/unit/guide-customization.BR-08-10.validation.test.ts` et l'aspect scope de `tests/unit/guide-customization.AC-02-01-02-03.poi-featured-order.test.ts` — sont mises à jour pour la nouvelle sémantique (cross-city accepté, limite 5/ville). Conséquence assumée et documentée.

## UX du formulaire owner

Page `src/app/(dashboard)/dashboard/lodgings/[id]/customize/page.tsx` + `CustomizationForm`.

- Sous la carte « Mes recommandations » existante (POI locaux par catégorie, **inchangée**), ajouter une carte **« Recommandations ailleurs »** (nouveau composant client, ex: `OtherCityRecommendations.tsx`).
- Champ **recherche de ville** (autocomplete via `GET /api/cities/search`), excluant la ville du logement. L'owner ajoute une ou plusieurs villes.
- Pour chaque ville ajoutée : charger ses POI via `GET /api/cities/[slug]/pois` et les proposer à la sélection (cases à cocher), avec **compteur 5/ville** (au-delà : sélection bloquée + message).
- Les POI cross-city sélectionnés rejoignent le **même payload** `featured_pois` (`poi_id` + `sort_order`) à l'enregistrement ; le serveur fait le bucketing. Carte locale et carte ailleurs alimentent une seule liste à la sauvegarde.
- **Chargement initial** : la page `customize` calcule côté serveur les featured POIs cross-city du logement (`poi.city_id !== lodging.city_id`), enrichis de `poi.name`, catégorie et `city {name, slug}`, et les passe au form (`initialOtherCityPois`). Les villes déjà utilisées et leurs POI cochés s'affichent d'emblée, sans fetch au montage ; ajouter une nouvelle ville déclenche le fetch à la volée.

> Note de planification : confirmer les formes de réponse de `/api/cities/search` et `/api/cities/[slug]/pois` au début du plan (champs `slug`, `name`, et pour les POI `id, name, category`).

## Affichage public (`src/app/(public)/nos-recommandations/page.tsx`)

- Enrichir la requête featured POIs de `poi.city { id, name, slug }` (en plus de `poi.category`).
- **Bucketing** : `poi.city.slug === lodgingContext.citySlug` → *local* ; sinon → *ailleurs*.
- Rendu :
  - *Local* : groupes par catégorie, **identique à aujourd'hui** (aucune régression visuelle).
  - *Ailleurs* : nouvelle section **« À découvrir ailleurs »** sous les recos locales, un sous-groupe par ville (titre « À {nom de ville} »), listant ses POI.
- **Correction de lien** : le lien vers le détail POI utilise désormais `poi.city.slug` (et non `lodgingContext.citySlug`). Identique pour les locaux, correct pour les cross-city.

## Tests

- **Validation (unit, `customization.ts`)** : cross-city accepté ; limite 5/ville appliquée (6e rejeté) ; local toujours 5/catégorie ; POI inexistant/inactif/supprimé rejeté.
- **Mise à jour** des suites de scope : `BR-08-10.validation`, aspect scope d'`AC-02-01-02-03`.
- **Contrat route** (`tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts`) : un POI cross-city transmis dans `featured_pois` est relayé à la query de sauvegarde.
- **Formulaire (jsdom)** : ajouter une ville (mock `fetch` de `/api/cities/search` + `/api/cities/[slug]/pois`), cocher un POI → présent dans le payload PUT ; cap 5/ville en UI.
- **Public `/nos-recommandations` (intégration jsdom)** : POI cross-city rendus sous « À découvrir ailleurs » groupés par ville, liens construits avec `poi.city.slug` ; recos locales inchangées.

## Hors périmètre (YAGNI)

- Pas de table « villes d'intérêt » persistée (B), pas de colonne de bucket (C).
- Pas d'affichage des POI cross-city dans le guide `/guide/[ville]`.
- Pas de carte/distances pour les POI cross-city.
- Pas de changement de modèle de données ni de migration.
