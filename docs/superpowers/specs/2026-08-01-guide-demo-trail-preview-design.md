# Guide Demo Trail Preview — Design

## Objectif

Enrichir la fiche de démonstration de « L’Alpage de Porcherey » avec l’aperçu
cartographique déjà utilisé par les randonnées du guide privé, tout en gardant
le démarrage et le suivi GPS strictement inactifs.

## Source du parcours

La randonnée publique publiée sous le slug `l-alpage-de-porcherey` possède une
géométrie `MultiLineString` complète et fiable de 926 points. Le tracé provient
du pipeline randonnée spécialisé (géométrie Overpass, métriques enrichies par
IGN). La démonstration conserve un instantané statique de ces seules données
publiques, sans identifiant Prisma, donnée voyageur, requête privée ou contrôle
d’accès.

## Architecture retenue

`GuidePoiDetails` réutilise `TrailPreviewMap`, le même composant de présentation
que les fiches randonnée privées. Le composant reçoit deux adaptations
génériques :

- un mode compact adapté à la largeur du smartphone de démonstration ;
- une variante non interactive qui rend l’aperçu sans `Link` vers la route de
  démarrage.

Le comportement privé existant reste la valeur par défaut : hauteur historique,
lien de démarrage et rendu actuel inchangés.

`GuideTrailSummary` accepte les données publiques optionnelles nécessaires à
l’aperçu : géométrie, coordonnées de départ et fiabilité. Porcherey les fournit
dans l’unique collection `demoPois`. Les autres POI ne changent pas.

## Composition visuelle

Dans le bloc « Les informations du parcours », l’ordre devient :

1. difficulté et titre ;
2. métriques distance, dénivelé et durée ;
3. aperçu compact Mapbox Outdoor du tracé, avec attribution exacte ;
4. bouton « Commencer la randonnée » visible mais désactivé ;
5. mention « Suivi GPS indisponible dans le guide de démonstration ».

Le bouton public « Voir sur la carte » et les actions externes restent après le
bloc randonnée, conformément à `AC-05-13`.

## Sécurité et états de repli

- Le bouton utilise l’attribut HTML `disabled` et `aria-disabled="true"`.
- Aucun gestionnaire de clic, `router.push`, `Link`, appel GPS ou
  `watchPosition` n’est attaché en démonstration.
- Aucun endpoint privé n’est appelé.
- Si le token Mapbox ou l’image statique est indisponible, le fond de repli
  existant reste visible afin de ne jamais produire un bloc blanc.
- Le guide privé et son accès à la navigation randonnée ne sont pas modifiés.

## Vérification

Les tests couvrent :

- la présence d’une géométrie publique valide pour Porcherey ;
- le rendu compact et non interactif de `TrailPreviewMap` ;
- le bouton « Commencer la randonnée » visible et désactivé ;
- l’absence de lien de démarrage et de contrôle GPS en démonstration ;
- la non-régression du rendu interactif privé existant ;
- l’ordre bloc randonnée, bouton Carte et actions externes.
