# Guide Favorites Bento Cards — Design

## Contexte

La vue « Nos coups de cœur » du `GuideApp` utilise actuellement une liste de
cartes horizontales blanches. Elle doit reprendre le langage visuel bento de la
page privée `/nos-recommandations`, sans utiliser ses liens privés ni modifier
son implémentation.

## Choix validé

Un composant dédié `GuideFavoriteBentoCard` adapte le contrat visuel privé au
type `GuidePoi` et aux callbacks internes du `GuideApp`.

La grille reprend la hiérarchie privée :

- deux colonnes avec un espacement de 12 px ;
- première carte carrée sur deux colonnes ;
- toutes les cartes suivantes carrées sur une colonne ;
- aucune carte blanche ou textuelle.

## Présentation des cartes

Chaque carte utilise :

- une image plein cadre avec `object-cover` ;
- le rayon, l’ombre et le dégradé sombre des cartes privées ;
- la catégorie, le nom, la distance et la durée superposés ;
- les badges existants lorsqu’ils s’appliquent ;
- une action principale ouvrant la fiche interne du POI ;
- une action Carte distincte conservant la navigation interne existante.

La première carte peut utiliser une typographie et un espacement plus généreux,
comme la variante `bigImage` privée. Les autres cartes conservent une
composition plus compacte mais restent toutes strictement carrées.

## Images

`getGuidePoiHeroImage` reste la source de sélection :

1. première photo réelle ordonnée par l’administration ;
2. fallback de catégorie si aucune galerie réelle n’existe.

Le composant remplace également une image distante qui échoue au chargement par
le fallback de catégorie. Ainsi, aucune carte ne reste blanche ou sans visuel.
Les images distantes publiques restent chargées directement afin d’éviter le
blocage NAT64 constaté dans l’optimiseur local Next.js.

## Architecture et sécurité

- `GuideFavoritesPage` reste responsable du filtrage et de la grille.
- `GuideFavoriteBentoCard` porte uniquement la présentation et les actions
  d’une carte.
- Aucun `Link`, `router.push()` ou appel vers une route privée n’est ajouté.
- Le clic principal appelle `onSelectPoi`.
- L’action Carte appelle `onShowOnMap`.
- Le composant privé `RecommendationCard` et sa règle de variantes ne sont pas
  modifiés.

## Éléments inchangés

- header du `GuideApp` ;
- titre et introduction ;
- filtres sticky et leur scroll horizontal ;
- navigation inférieure ;
- données et collection `demoPois` ;
- vue carte, fiche POI et contrôles d’accès ;
- page privée `/nos-recommandations`.

## Vérification

- Test unitaire de la règle de variante : premier POI `big`, suivants `compact`.
- Test d’intégration du nombre de cartes, de la grille, du ratio carré, de
  l’absence de variante blanche et des images hero/fallback.
- Test des deux interactions internes : ouverture de la fiche et ouverture sur
  la carte sans changement d’URL.
- Test E2E mobile, tablette et desktop confirmant l’absence de débordement et le
  chargement effectif des images.

## Hors périmètre

- Refonte d’une autre section de la page.
- Modification de l’apparence des filtres.
- Modification des cartes de l’accueil du GuideApp.
- Modification des cartes du guide privé.
- Changement des données ou des routes.
