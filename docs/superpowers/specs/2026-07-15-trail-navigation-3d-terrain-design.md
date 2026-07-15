# Trail Navigation 3D Terrain Design

**Date:** 2026-07-15

**Feature:** `021-trail-navigation`

**Status:** Product design approved

## Goal

Donner au mode randonnée le même relief 3D que l'onglet Carte, tout en conservant le fond Mapbox Outdoor, la lisibilité du tracé et le comportement actuel du suivi GPS.

## Product decisions

- Le mode randonnée conserve `mapbox://styles/mapbox/outdoors-v12`.
- Le relief utilise Mapbox Terrain DEM avec une exagération modérée de `1.2`.
- L'état initial `ready` reste à `0°` pour montrer le tracé à plat.
- L'activation explicite du GPS et l'action « Recentrer » conservent le pitch immersif existant de `55°`.
- Le suivi automatique continue de modifier seulement le centre de la caméra et ne réinitialise donc pas le pitch courant.
- Le pitch maximal est limité à `75°`, comme dans l'onglet Carte.
- Aucun fond IGN / Géoplateforme, satellite ou sélecteur de fond n'est ajouté.

## Approaches considered

### 1. Terrain Mapbox sur le fond Outdoor existant — retenu

Ajouter la source DEM et la propriété `terrain` à l'instance Mapbox existante. Cette option réutilise le comportement éprouvé de l'onglet Carte, ne modifie pas la navigation GPS et reste conforme aux règles de confidentialité de `021`.

### 2. Copier tout le sélecteur Plan / IGN / Satellite

Cette option reproduirait plus fidèlement l'onglet Carte, mais introduirait des appels frontend IGN / Géoplateforme interdits par `BR-08`, davantage de contrôles et plus de consommation réseau. Elle est exclue du périmètre.

### 3. Relief activable par un bouton 2D / 3D

Cette option laisserait le choix au Tourist, mais ajouterait un contrôle dans une interface de guidage déjà dense et un nouvel état à maintenir. Elle est exclue tant qu'un besoin utilisateur explicite ne le justifie pas.

## Architecture

Le changement reste local à `TrailNavigationMap` :

1. La carte conserve son instance, son style Outdoor, ses sources GeoJSON et ses contrôles actuels.
2. Une source `raster-dem` nommée `mapbox-dem` utilise `mapbox://mapbox.mapbox-terrain-dem-v1`, `tileSize=512` et `maxzoom=14`.
3. La propriété Mapbox `terrain` référence cette source avec `exaggeration=1.2`.
4. `maxPitch=75` borne les gestes tactiles et les mouvements de caméra.
5. Les lignes du tracé officiel et du parcours utilisateur restent rendues au-dessus du terrain.

Aucun nouveau composant, endpoint, modèle Prisma ou état de session n'est nécessaire.

## Camera and data flow

- Au chargement : centre du départ officiel, zoom `14`, bearing `0`, pitch implicite `0`.
- À « Activer le suivi GPS » : le mouvement existant passe à zoom `16`, pitch `55`.
- À « Recentrer » : le mouvement existant passe à zoom `17.5`, pitch `55`.
- Pendant `approaching` et `tracking` : chaque nouvelle position fiable déplace uniquement le centre ; zoom, bearing et pitch restent inchangés.
- Aucune coordonnée n'est envoyée à un nouveau service. Les seules ressources supplémentaires sont les tuiles DEM Mapbox autorisées par `BR-07`.

## Failure and performance behavior

- Une indisponibilité de la source DEM ne doit pas produire de page blanche : le style Outdoor, le tracé et les contrôles restent utilisables à plat.
- Le relief réutilise le Map Load existant ; il n'instancie aucune seconde carte.
- L'exagération `1.2` limite les déformations visuelles en montagne.
- Aucun bâtiment 3D ni raster IGN n'est ajouté au mode randonnée.

## Testing

Le test unitaire de `TrailNavigationMap` doit vérifier :

- la présence de la source DEM avec son URL, `tileSize` et `maxzoom` ;
- la propriété `terrain` avec la source `mapbox-dem` et l'exagération `1.2` ;
- `maxPitch=75` et le pitch initial `0` ;
- la conservation des mouvements existants à `55°` pour l'activation GPS et « Recentrer » ;
- l'absence de source ou de contrôle IGN dans le mode randonnée ;
- la présence inchangée du tracé officiel, du parcours utilisateur et des comportements de session existants.

La matrice de traçabilité reliera `AC-02-08/BR-30` au composant et au test unitaire correspondant.

## Out of scope

- Sélecteur Plan / IGN / Satellite.
- Appels frontend IGN / Géoplateforme.
- Bouton 2D / 3D.
- Modification de l'exagération par le Tourist.
- Nouvel endpoint ou persistance d'une préférence cartographique.
