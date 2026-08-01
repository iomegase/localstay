# Guide Trail Details Order — Design

## Objectif

Dans la fiche détaillée d’un POI randonnée du `GuideApp`, placer le bloc
« Randonnée facile / Les informations du parcours » avant le bouton
« Voir sur la carte ».

## Ordre validé

Dans la feuille de contenu, l’ordre devient :

1. informations générales, description, recommandation et horaires ;
2. attribution des photos lorsqu’elle existe ;
3. bloc randonnée lorsqu’un `poi.trail` existe ;
4. bouton interne « Voir sur la carte » ;
5. actions externes Itinéraire, Site web ou téléphone.

## Implémentation

Le composant `GuidePoiDetails` déplace physiquement la section randonnée dans
le JSX. Aucune classe CSS `order`, duplication ou condition supplémentaire
n’est introduite. L’ordre DOM, visuel et clavier reste ainsi cohérent.

## Éléments inchangés

- design et dimensions du bloc randonnée ;
- métriques distance, dénivelé et durée ;
- règle `canStartTrail` ;
- suivi GPS désactivé en mode démonstration ;
- bouton Carte et callback `onShowOnMap` ;
- actions Itinéraire et Site web ;
- rendu des POI sans randonnée ;
- autres vues et cartes du GuideApp.

## Vérification

Un test d’intégration vérifie l’ordre DOM suivant pour Porcherey : bloc
randonnée avant bouton Carte, puis actions externes. Les tests existants
confirment que les métriques restent visibles et que le démarrage GPS reste
absent en démonstration.
