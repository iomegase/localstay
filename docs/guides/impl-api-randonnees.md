# Instructions — Utiliser IGN, OpenStreetMap et Overpass pour une app type AllTrails / StayLocal

## Objectif

Construire une base de randonnées et de points d’intérêt locaux sans dépendre d’AllTrails, en utilisant des sources publiques et en créant une couche métier propriétaire.

L’objectif n’est pas de simplement “fetcher des randos”, mais de récupérer des données géographiques brutes, les normaliser, les enrichir, puis les exposer via votre propre API.

---

## Sources de données

| Source | API publique | Usage principal | Rôle dans StayLocal |
|---|---:|---|---|
| OpenStreetMap | Oui | Données cartographiques ouvertes | Base géographique générale |
| Overpass API | Oui | Requêter les données OpenStreetMap | Récupérer sentiers, chemins, POI |
| IGN / Géoplateforme | Oui | Cartes, tuiles, altimétrie, géocodage, données France | Fonds de carte, altitude, données officielles françaises |

---

## 1. OpenStreetMap

OpenStreetMap possède une API publique, mais elle est surtout pensée pour l’édition et la consultation ponctuelle des données.

Pour une application publique, il ne faut pas appeler directement l’API principale OpenStreetMap pour alimenter massivement l’interface.

### Usage recommandé

```txt
OpenStreetMap
→ source de données géographiques ouverte
→ chemins, routes, lieux, POI, tags
```

### Usage non recommandé

```txt
Frontend Next.js
→ appel direct massif vers l’API OpenStreetMap
```

### Bonne pratique

Utiliser OpenStreetMap comme base de données ouverte, mais passer par Overpass ou des exports/extraits pour les requêtes de lecture.

---

## 2. Overpass API

Overpass API est l’outil le plus adapté pour interroger les données OpenStreetMap.

Elle permet de récupérer des objets selon :

- une zone géographique
- un rayon autour d’un point GPS
- des tags OpenStreetMap
- un type d’objet : node, way, relation
- des éléments comme chemins, parkings, refuges, points d’eau, sommets, belvédères

### Exemples de données utiles

```txt
highway=path
highway=track
route=hiking
tourism=viewpoint
tourism=alpine_hut
amenity=parking
natural=peak
natural=spring
```

### Ce qu’Overpass fournit

```txt
Objets géographiques bruts
→ coordonnées
→ chemins
→ relations
→ tags
→ noms éventuels
→ types de lieux
```

### Ce qu’Overpass ne fournit pas directement

```txt
Fiche randonnée complète
→ description éditoriale
→ difficulté fiable
→ durée estimée parfaite
→ photos
→ avis utilisateurs
→ score de popularité
→ conditions récentes
```

---

## 3. IGN / Géoplateforme

L’IGN via la Géoplateforme est très utile pour une app française.

Elle peut servir pour :

- fonds de carte
- tuiles WMTS / WMS / TMS
- données vectorielles WFS
- géocodage
- autocomplétion d’adresse
- calcul altimétrique
- itinéraires
- isochrones
- téléchargement de jeux de données

### Usage recommandé

```txt
IGN / Géoplateforme
→ fonds de carte France
→ données officielles
→ altitude / dénivelé
→ géocodage
→ couches géographiques fiables
```

### Points d’attention

Les services IGN/Géoplateforme peuvent avoir :

- des quotas
- des limites de requêtes par seconde
- des conditions d’utilisation spécifiques
- des clés ou jetons selon les services
- des règles de cache ou d’attribution

Avant production, vérifier systématiquement la documentation officielle.

---

## Architecture recommandée pour StayLocal

Ne pas appeler directement Overpass ou IGN depuis le frontend pour chaque utilisateur.

Préférer une architecture avec backend et cache.

```txt
Frontend Next.js
→ /api/trails
→ /api/trails/[slug]
→ /api/trails/nearby

Backend Next.js
→ appelle Overpass
→ appelle IGN / Géoplateforme
→ normalise les données

Base de données
→ MongoDB / PostgreSQL / Prisma
→ trails
→ trail_points
→ POI
→ reviews
→ photos
→ favorites

Admin
→ enrichissement manuel
→ validation des parcours
→ ajout de photos
→ ajout SEO
→ modération
```

---

## Flux de données recommandé

```txt
1. L’administrateur choisit une zone
   Exemple : Chamonix, Saint-Gervais, Megève

2. Le backend interroge Overpass
   Recherche de sentiers, chemins, parkings, refuges, sommets, points d’eau

3. Les données brutes sont stockées en cache
   Aucune dépendance directe à l’API au moment de l’affichage utilisateur

4. L’admin sélectionne les parcours utiles
   Nettoyage, fusion, correction, suppression des doublons

5. Le système calcule les données utiles
   Distance, durée estimée, dénivelé, coordonnées, difficulté

6. L’admin enrichit la fiche
   Description, conseils, photos, catégorie, saison, SEO

7. L’app affiche les randonnées
   Carte interactive, fiche détail, itinéraire, favoris, avis
```

---

## Modèle de données minimal

### Trail

```ts
type Trail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  difficulty: "easy" | "medium" | "hard";
  distanceKm: number;
  elevationGainM: number;
  estimatedDurationMin: number;
  activityType: "hiking" | "trail" | "bike" | "walk";
  loopType: "loop" | "out_and_back" | "point_to_point";
  startPoint: {
    lat: number;
    lng: number;
  };
  geojson: object;
  images: string[];
  tags: string[];
  source: "manual" | "osm" | "ign" | "imported_gpx";
  status: "draft" | "published";
};
```

### POI

```ts
type POI = {
  id: string;
  title: string;
  type: "parking" | "viewpoint" | "refuge" | "water" | "peak" | "restaurant";
  lat: number;
  lng: number;
  description?: string;
  source: "osm" | "ign" | "manual";
};
```

---

## Routes API recommandées

```txt
GET /api/trails
GET /api/trails/[slug]
GET /api/trails/nearby?lat=45.9237&lng=6.8694&radius=10000
GET /api/trails/search?difficulty=easy&type=hiking
GET /api/pois?lat=45.9237&lng=6.8694&radius=5000
POST /api/admin/trails/import-osm
POST /api/admin/trails/import-gpx
PATCH /api/admin/trails/[id]
DELETE /api/admin/trails/[id]
```

---

## Exemple de workflow MVP

### MVP 1 — Base randonnée locale

```txt
Objectif :
Créer une première base de randonnées locales validées manuellement.

Étapes :
1. Importer une zone via Overpass
2. Stocker les chemins et POI en base
3. Créer une interface admin
4. Sélectionner les parcours utiles
5. Ajouter titre, description générée par l'IA (gemini pro), difficulté, photos
6. Publier les fiches
7. Afficher les randonnées sur une carte
```

### MVP 2 — Navigation et carte

```txt
Objectif :
Permettre à l’utilisateur de consulter une randonnée avec carte interactive.

Étapes :
1. Afficher le tracé GeoJSON
2. Afficher les POI autour du parcours
3. Ajouter distance, dénivelé, durée
4. Ajouter bouton “ouvrir dans Google Maps”
5. Ajouter favoris
```

### MVP 3 — Expérience communautaire

```txt
Objectif :
Créer de la valeur propriétaire.

Étapes :
1. Avis utilisateurs
2. Photos utilisateurs dans un second temps 
3. Signalement d’état du sentier
4. Notes de difficulté ressentie
5. Conditions récentes
```

---

## Stack technique recommandée

```txt
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
Framer Motion
MapLibre GL ou Leaflet
PostgreSQL + PostGIS ou MongoDB
Prisma ou Mongoose
Overpass API
IGN / Géoplateforme
Cloudinary ou S3/R2 pour les images
```

### Pour les cartes

```txt
Option simple :
Leaflet + OpenStreetMap tiles

Option plus moderne :
MapLibre GL + tuiles vectorielles

Option France officielle :
IGN / Géoplateforme en fond cartographique
```

---

## Règle importante

Ne pas scraper AllTrails.

Raisons :

- risque juridique
- dépendance fragile
- blocage anti-bot possible
- données non propriétaires
- aucune valeur différenciante durable

La bonne stratégie est de construire une base propriétaire à partir de sources ouvertes et d’enrichissement éditorial.

---

## Sources officielles à consulter

- OpenStreetMap API : https://wiki.openstreetmap.org/wiki/API
- Overpass API : https://wiki.openstreetmap.org/wiki/Overpass_API
- Géoplateforme IGN : https://cartes.gouv.fr
- Géoservices IGN : https://geoservices.ign.fr

---

## Conclusion

Oui, IGN, OpenStreetMap et Overpass proposent des accès publics.

Mais pour créer une application type AllTrails, il faut construire une couche métier propriétaire :

```txt
Données publiques
→ normalisation
→ stockage local
→ enrichissement admin
→ fiches randonnée
→ avis / photos / favoris
→ API propriétaire StayLocal
```

C’est cette couche propriétaire qui donnera de la valeur à l’application.
