# Guide Favorites Sticky Filters — Design

## Contexte

La vue « Nos coups de cœur » du `GuideApp` possède une introduction puis une
rangée horizontale de filtres. Quand la liste des POI défile, cette rangée doit
rester accessible juste sous le header de l’application.

## Comportement validé

- Le titre, l’eyebrow et le texte d’introduction défilent normalement.
- La rangée de filtres reste dans le conteneur scrollable principal du
  `GuideApp`.
- Quand elle atteint le haut de ce conteneur, elle devient sticky à `top: 0`.
  Le header de 68 px étant placé au-dessus et hors du conteneur scrollable, la
  rangée s’arrête visuellement juste sous celui-ci.
- Le fond blanc légèrement translucide et dépoli protège la lisibilité des
  filtres au-dessus des cartes.
- Le scroll horizontal tactile et trackpad des catégories reste disponible,
  avec une scrollbar masquée.
- Le comportement s’applique au composant partagé `GuideFavoritesPage` et reste
  identique en modes `demo` et `private`.

## Architecture

La solution utilise uniquement le positionnement CSS natif Tailwind sur un
wrapper dédié dans `GuideFavoritesPage`. Aucun listener de scroll, observer,
calcul de hauteur ou état React supplémentaire n’est nécessaire.

La hiérarchie de calques reste :

1. header du `GuideApp` ;
2. rangée sticky des filtres ;
3. contenu et cartes de POI ;
4. navigation inférieure existante.

## Accessibilité et responsive

- Les filtres restent des boutons avec `aria-pressed`.
- La rangée conserve son libellé accessible.
- Le focus clavier reste visible et chaque catégorie reste atteignable.
- Le wrapper n’ajoute aucun débordement horizontal à la page ou au modal.

## Vérification

- Test d’intégration des classes sticky, du fond, du z-index et de la scrollbar
  masquée.
- Test E2E : après scroll du contenu, le titre quitte la zone visible tandis
  que la rangée reste alignée immédiatement sous le header.
- Contrôle mobile, tablette et desktop dans le modal de démonstration.

## Hors périmètre

- Modification du header, de la navigation inférieure ou des cartes POI.
- Animation liée à la direction du scroll.
- Refonte des filtres de la vue carte.
- Changement des routes ou des mécanismes d’accès privé.
