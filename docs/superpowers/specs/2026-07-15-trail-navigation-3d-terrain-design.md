# Trail Navigation 3D Terrain Design

**Date:** 2026-07-15 — affiné le 2026-07-19

**Feature:** `021-trail-navigation`

**Status:** Product design approved

## Goal

Donner au mode randonnée un relief 3D plus contrasté, inspiré d'un jeu vidéo, tout en conservant le fond Mapbox Outdoor, la lisibilité du tracé et le comportement du suivi GPS.

## Product decisions

- Le mode randonnée conserve `mapbox://styles/mapbox/outdoors-v12`.
- Le relief utilise Mapbox Terrain DEM avec une exagération de `1.4`.
- Une couche `hillshade` issue du même DEM accentue les ombres des versants et les crêtes sans assombrir uniformément la carte.
- L'état initial `ready` reste à `0°` pour montrer le tracé à plat.
- L'activation explicite du GPS et l'action « Recentrer » utilisent un pitch immersif de `60°`.
- Le suivi automatique continue de modifier seulement le centre de la caméra et ne réinitialise donc pas le pitch courant.
- Le pitch maximal est limité à `75°`, comme dans l'onglet Carte.
- Aucun fond IGN / Géoplateforme, satellite ou sélecteur de fond n'est ajouté.

## Approaches considered

### 1. Terrain Mapbox et hillshade contrasté sur le fond Outdoor existant — retenu

Réutiliser la source DEM et la propriété `terrain` de l'instance Mapbox existante, puis ajouter une couche de hillshade directionnelle sous le tracé. Cette option renforce le modelé des versants sans changer de fond, sans deuxième source DEM et sans réduire la lisibilité de l'itinéraire.

### 2. Augmenter fortement la géométrie seule

Une exagération proche de `1.8` rendrait les volumes spectaculaires, mais déformerait la perception des pentes et des distances. Elle est exclue au profit d'une exagération mesurée combinée aux ombres.

### 3. Assombrir tout le fond cartographique

Un style globalement sombre augmenterait le contraste apparent, mais réduirait la lisibilité des chemins, routes et libellés en extérieur. Il est exclu : seules les pentes reçoivent un modelé plus sombre.

## Architecture

Le changement reste local à `TrailNavigationMap` :

1. La carte conserve son instance, son style Outdoor, ses sources GeoJSON et ses contrôles actuels.
2. Une source `raster-dem` nommée `mapbox-dem` utilise `mapbox://mapbox.mapbox-terrain-dem-v1`, `tileSize=512` et `maxzoom=14`.
3. La propriété Mapbox `terrain` référence cette source avec `exaggeration=1.4`.
4. Une couche `hillshade` réutilise `mapbox-dem` avec `hillshade-exaggeration: 0.8`, une illumination à `315°` ancrée à la carte, des ombres `rgba(18, 31, 24, 0.72)`, des hautes lumières `rgba(255, 248, 220, 0.42)` et un accent `rgba(65, 82, 70, 0.55)`.
5. `maxPitch=75` borne les gestes tactiles et les mouvements de caméra.
6. Le hillshade est rendu sous les lignes du tracé officiel et du parcours utilisateur afin que celles-ci restent prioritaires.

Aucun nouveau composant, endpoint, modèle Prisma ou état de session n'est nécessaire.

## Camera and data flow

- Au chargement : centre du départ officiel, zoom `14`, bearing `0`, pitch implicite `0`.
- À « Activer le suivi GPS » : le mouvement passe à zoom `16`, pitch `60`.
- À « Recentrer » : le mouvement passe à zoom `17.5`, pitch `60`.
- Pendant `approaching` et `tracking` : chaque nouvelle position fiable déplace uniquement le centre ; zoom, bearing et pitch restent inchangés.
- Aucune coordonnée n'est envoyée à un nouveau service. Les seules ressources supplémentaires sont les tuiles DEM Mapbox autorisées par `BR-07`.

## Failure and performance behavior

- Une indisponibilité de la source DEM ne doit pas produire de page blanche : le style Outdoor, le tracé et les contrôles restent utilisables à plat.
- Le relief réutilise le Map Load existant ; il n'instancie aucune seconde carte.
- L'exagération `1.4` renforce les volumes sans atteindre le rendu déformant d'une valeur proche de `1.8`.
- Le hillshade réutilise la source `mapbox-dem` déjà chargée ; il n'ajoute ni source DEM ni Map Load.
- Aucun bâtiment 3D ni raster IGN n'est ajouté au mode randonnée.

## Testing

Le test unitaire de `TrailNavigationMap` doit vérifier :

- la présence de la source DEM avec son URL, `tileSize` et `maxzoom` ;
- la propriété `terrain` avec la source `mapbox-dem` et l'exagération `1.4` ;
- la couche `hillshade` placée sous le tracé, sa source DEM partagée, son intensité, sa direction et ses couleurs contractuelles ;
- `maxPitch=75` et le pitch initial `0` ;
- les mouvements à `60°` pour l'activation GPS et « Recentrer » ;
- l'absence de source ou de contrôle IGN dans le mode randonnée ;
- la présence inchangée du tracé officiel, du parcours utilisateur et des comportements de session existants.

La matrice de traçabilité reliera `AC-02-08/BR-30` au composant et au test unitaire correspondant.

## Out of scope

- Sélecteur Plan / IGN / Satellite.
- Appels frontend IGN / Géoplateforme.
- Bouton 2D / 3D.
- Modification de l'exagération par le Tourist.
- Nouvel endpoint ou persistance d'une préférence cartographique.
