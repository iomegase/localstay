# Cartes du guide contenues dans la frame smartphone

## Objectif

Les deux expériences cartographiques du nouveau guide MyStay doivent rester
dans la frame téléphone 430 × 820 px :

1. la carte des POI ouverte depuis le bottom nav ou « Voir sur la carte » ;
2. la carte de navigation randonnée ouverte avec « Démarrer ».

Aucune des deux ne doit utiliser toute la hauteur du navigateur.

## Approche retenue

### Carte des POI

Le routage `map: '/map'` est retiré de `PRIVATE_GUIDE_ROUTES`. Le mécanisme déjà
présent dans `GuideApp` bascule alors vers sa vue interne `map` et rend
`GuideMapView`, exactement comme la démonstration. « Voir sur la carte » utilise
déjà ce chemin et continue de transmettre le POI sélectionné.

L'ancienne page `/map` reste intacte pour les liens historiques.

### Navigation randonnée

La frame actuellement codée dans `PrivateGuidePage` devient un composant de
présentation partagé. Elle enveloppe également les rendus directs et interceptés
de la navigation randonnée.

`TrailNavigationMap` reçoit une variante contenue. Cette variante ne change que
la taille de sa racine : `h-full` remplace `h-screen`. Le composant Mapbox, les
couches, le tracé, les marqueurs, le HUD et la session GPS restent les mêmes.

## Composants

- `PrivateGuideFrame` : scène slate et coque 430 × 820, rayon fort, bordure
  blanche 5 px, ombre et overflow masqué.
- `PrivateGuidePage` : réutilise `PrivateGuideFrame` autour de `GuideApp`.
- `GuideApp` : conserve la navigation interne `map` quand aucune route `map`
  n'est fournie.
- `TrailNavigationMap` : accepte un mode `contained` qui remplit son parent.
- Routes `.../[poi-slug]/start` directe et interceptée : enveloppent la carte
  contenue dans `PrivateGuideFrame`.

## Flux

```text
Bottom nav Carte ─┐
                  ├─> GuideApp activeView="map" ─> GuideMapView dans la frame
Voir sur la carte ┘

Démarrer randonnée ─> route /start ─> PrivateGuideFrame
                                      └─> TrailNavigationMap contained
```

## Garde-fous

- Aucun changement du tracé ou du suivi GPS.
- Aucun nouveau composant cartographique.
- Aucun changement de données ou d'API.
- Aucun `zoom` ou `transform: scale()`.
- La démo conserve son comportement actuel.
- L'ancienne route `/map` reste disponible mais n'est plus liée au bottom nav
  du nouveau guide privé.

## Tests

- Le bottom nav privé n'appelle plus `router.push('/map')` et affiche
  `GuideMapView`.
- « Voir sur la carte » conserve la sélection du POI.
- La frame partagée conserve les dimensions et la bordure validées.
- Les routes randonnée rendent `TrailNavigationMap` en mode contenu.
- La racine contenue utilise `h-full` et non `h-screen`.
- Les tests de session GPS de `021` restent verts.
