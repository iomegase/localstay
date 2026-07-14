# Spec — 021 Trail Navigation

## Metadata

```yaml
id: 021-trail-navigation
title: "Navigation randonnée Mapbox et guidage GPS local"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-25
updated_at: 2026-07-14
depends_on:
  - 004-poi-detail
  - 005-map
  - 019-trails-acquisition
bounded_context: trails
```

---

## Context

La fiche randonnée doit distinguer deux intentions utilisateur qui étaient trop proches dans l'interface :

- **Rejoindre le départ** : aider le Tourist à aller jusqu'au point de départ de la randonnée.
- **Commencer la rando** : ouvrir une expérience de guidage outdoor pendant la randonnée, avec carte Mapbox, tracé, position GPS et suivi local.

Le mockup de référence est `docs/DAT/diagrams/mockups/004-poi-detail/rando_details.html`. Il définit le contrat visuel de la fiche randonnée : hero image, sheet arrondie, stats rapides, galerie, carte outdoor, section "Comment s'y rendre", CTA principal "Commencer la rando" et CTA secondaire "Rejoindre le départ".

Cette spec corrige explicitement une ambiguïté historique de `004-poi-detail` : l'accès au départ et le suivi de randonnée sont deux intentions distinctes. "Rejoindre le départ" peut ouvrir Google Maps vers les coordonnées du départ, comme une action d'accès externe. "Commencer la rando" reste une expérience StayLocal basée sur Mapbox, conformément à `005-map`, `ADR-001` et au choix produit inspiré des usages type AllTrails.

`021` ne modifie pas l'acquisition des randonnées. Les données de tracé, départ, distance, dénivelé, source et attribution restent produites et validées par `019-trails-acquisition`.

Décision PO du 2026-05-26 : le mode "Commencer la rando" ne déclenche pas le GPS automatiquement au chargement. Il affiche d'abord le tracé en état `ready`, puis demande le consentement uniquement après une action explicite "Activer le suivi GPS". Si le Tourist est loin du départ ou du tracé, l'interface doit l'indiquer comme pré-départ plutôt que comme une erreur de guidage.

Décision PO du 2026-05-26 : le CTA "Rejoindre le départ" ouvre un itinéraire Google Maps vers `TrailDetail.start_latitude` / `TrailDetail.start_longitude`. Cette action ne démarre pas le guidage randonnée, ne demande pas le GPS StayLocal et ne remplace pas le mode "Commencer la rando".

Décision PO du 2026-07-14 : après activation explicite du GPS, le Tourist peut démarrer une session depuis sa position courante s'il se trouve à 1 500 m ou moins du point le plus proche de l'ensemble du tracé. Cette règle permet une entrée au départ officiel comme à mi-parcours. La position GPS fiable disponible au clic "Démarrer ici" devient le départ réel de la session locale ; la distance parcourue et la durée repartent de zéro à cet instant et incluent la phase d'approche restante vers le tracé.

Décision PO du 2026-07-14 : la session ne se termine pas automatiquement à l'arrivée officielle ou à la fermeture d'une boucle. Le Tourist utilise un bouton "Stop" toujours accessible après le démarrage. L'arrêt fige les statistiques locales, arrête `watchPosition` et ouvre un récapitulatif. Les métriques indisponibles ou qui ne satisfont pas les seuils de `BR-26`, notamment le nombre de pas et le dénivelé quand l'altitude ne peut pas être exploitée, sont entièrement masquées.

---

## Glossary References

- **Tourist** : utilisateur public sans compte.
- **Trail** : randonnée publiable dans le Guide.
- **Trail Detail** : données spécialisées d'une randonnée publiée.
- **Trail Navigation** : mode de guidage randonnée côté navigateur, basé sur Mapbox et la géolocalisation consentie.
- **Trail Navigation Session** : session locale temporaire démarrée quand le Tourist clique "Démarrer ici" avec un GPS actif et une position fiable.
- **Map Load** : chargement d'une carte Mapbox.
- **POI** : entrée publique du Guide, utilisée comme point d'accès à la randonnée.
- **Client Component** : composant interactif rendu côté client.

---

## User Stories

### US-01 — Rejoindre le départ d'une randonnée

**As a** Tourist  
**I want to** obtenir un itinéraire vers le point de départ  
**So that** je puisse me rendre au bon endroit avant de commencer la randonnée

#### Acceptance Criteria

- **AC-01-01**: Given une randonnée publiée avec `TrailDetail.start_latitude` et `TrailDetail.start_longitude`, When la fiche randonnée s'affiche, Then le CTA secondaire "Rejoindre le départ" est visible.
- **AC-01-02**: Given le Tourist clique "Rejoindre le départ", When un point de départ fiable existe, Then une URL Google Maps s'ouvre avec `destination={start_latitude},{start_longitude}`.
- **AC-01-03**: Given le Tourist clique "Rejoindre le départ", When l'action est rendue, Then aucune géolocalisation navigateur StayLocal n'est demandée pour cette action.
- **AC-01-04**: Given une randonnée sans point de départ fiable, When la fiche randonnée s'affiche, Then le CTA "Rejoindre le départ" est masqué.
- **AC-01-05**: Given le Tourist utilise une fiche randonnée, When il clique "Commencer la rando", Then aucune URL Google Maps ou Apple Maps n'est ouverte et le mode StayLocal Mapbox est utilisé.

### US-02 — Commencer une randonnée guidée

**As a** Tourist  
**I want to** démarrer une carte de guidage pendant ma randonnée  
**So that** je puisse suivre le tracé et savoir où je suis

#### Acceptance Criteria

- **AC-02-01**: Given une randonnée publiée avec `TrailDetail.geometry_geojson` valide, When la fiche randonnée s'affiche, Then le CTA principal "Commencer la rando" est visible.
- **AC-02-02**: Given le Tourist clique "Commencer la rando", When la randonnée possède une géométrie valide, Then il est dirigé vers `/guide/[city-slug]/rando/[trail-slug]/start`.
- **AC-02-03**: Given le mode randonnée démarre, When la page charge, Then une carte Mapbox `outdoors` plein écran affiche le tracé, le point de départ et l'arrivée si détectable en état `ready`, sans lancer `watchPosition`.
- **AC-02-04**: Given le Tourist refuse la géolocalisation, When le mode randonnée est ouvert, Then le tracé reste visible mais le guidage live est remplacé par un état "GPS indisponible".
- **AC-02-05**: Given une randonnée sans géométrie fiable, When la fiche randonnée s'affiche, Then le CTA "Commencer la rando" est masqué et aucun mode guidage n'est accessible.
- **AC-02-06**: Given le mode randonnée est en état `ready`, When le Tourist clique "Activer le suivi GPS" et accepte la géolocalisation navigateur, Then `watchPosition` démarre et la position utilisateur s'affiche sur la carte.

### US-03 — Suivre sa progression sur le tracé

**As a** Tourist  
**I want to** voir ma position et mon écart au tracé  
**So that** je puisse rester orienté pendant la randonnée

#### Acceptance Criteria

- **AC-03-01**: Given le GPS est autorisé, When le navigateur retourne une position, Then la position utilisateur est affichée sur la carte sous forme de marker dynamique.
- **AC-03-02**: Given le GPS est autorisé et le tracé existe, When la position change, Then la distance approximative au tracé est calculée côté client.
- **AC-03-03**: Given la position GPS est loin du départ ou du tracé au démarrage, When l'état est recalculé, Then l'interface affiche "Vous n'êtes pas encore au départ" avec un accès à l'action "Rejoindre le départ".
- **AC-03-06**: Given le Tourist a déjà rejoint la zone de randonnée puis s'éloigne du tracé, When la distance au tracé dépasse le seuil de sécurité défini par l'interface, Then un message "Vous semblez vous éloigner du tracé" est affiché sans bloquer la navigation.
- **AC-03-04**: Given le GPS est autorisé mais la session n'a pas démarré, When une entrée à mi-parcours est proposée, Then l'interface peut afficher le pourcentage du tracé correspondant au point d'entrée sans le présenter comme une distance déjà parcourue par le Tourist.
- **AC-03-05**: Given la précision GPS retournée par le navigateur est faible, When la position est affichée, Then l'interface montre un état "Précision GPS faible" au lieu de prétendre à un guidage fiable.

### US-04 — Préserver vie privée, batterie et sécurité

**As a** Tourist  
**I want to** comprendre les limites du guidage  
**So that** je puisse l'utiliser sans croire qu'il remplace une carte officielle ou ma vigilance

#### Acceptance Criteria

- **AC-04-01**: Given le Tourist ouvre le mode randonnée, When il n'a pas encore cliqué "Activer le suivi GPS", Then aucune géolocalisation n'est demandée et aucune position n'est récupérée.
- **AC-04-02**: Given une position GPS est obtenue, When le mode randonnée est actif, Then cette position reste en mémoire navigateur et n'est jamais persistée en base.
- **AC-04-03**: Given le mode randonnée est actif, When l'interface s'affiche, Then un avertissement sécurité indique que StayLocal ne remplace pas une carte officielle, la météo, le balisage terrain ou l'équipement adapté.
- **AC-04-04**: Given le Tourist quitte ou termine le mode randonnée, When la session locale se ferme, Then le suivi GPS navigateur est arrêté.
- **AC-04-05**: Given le Tourist consulte le Guide public, When il n'ouvre pas explicitement le mode randonnée, Then aucun tracking GPS live n'est lancé.

### US-05 — Démarrer depuis sa position et terminer manuellement

**As a** Tourist
**I want to** choisir ma position GPS courante comme départ réel puis arrêter moi-même la session
**So that** je puisse rejoindre une randonnée depuis le point du tracé le plus proche, y compris à mi-parcours, et connaître la distance réellement parcourue

#### Acceptance Criteria

- **AC-05-01**: Given le GPS n'est pas actif, la dernière position date de plus de 10 secondes ou sa précision horizontale est supérieure à 30 m, When le mode randonnée s'affiche, Then "Démarrer ici" n'est pas disponible.
- **AC-05-02**: Given le GPS est actif avec une position fiable, When la distance entre cette position et le point le plus proche de l'ensemble du tracé est inférieure ou égale à 1 500 m, Then "Démarrer ici" est disponible, y compris si ce point se situe à mi-parcours.
- **AC-05-03**: Given la position fiable est à plus de 1 500 m du point le plus proche du tracé, When l'état est recalculé, Then le démarrage reste bloqué et l'interface demande au Tourist de se rapprocher.
- **AC-05-04**: Given "Démarrer ici" est disponible, When le Tourist clique ce bouton, Then la dernière position GPS fiable est figée comme départ réel, le temps et les points collectés avant le clic sont exclus des statistiques, et la session passe en `approaching`.
- **AC-05-05**: Given la session a démarré, When des positions GPS acceptées sont reçues, Then la distance de session est la somme des segments acceptés depuis le départ réel, phase d'approche incluse, et non la distance théorique depuis le départ officiel.
- **AC-05-06**: Given la session est en `approaching`, When la distance au tracé devient inférieure ou égale à 35 m, Then la session passe automatiquement en `tracking` et la liaison d'approche disparaît.
- **AC-05-07**: Given une session est active, When l'interface s'affiche, Then un bouton "Stop" reste accessible quel que soit l'état GPS ou la position sur le parcours.
- **AC-05-08**: Given le Tourist clique "Stop", When l'arrêt est traité, Then `watchPosition` est arrêté une seule fois, les statistiques sont figées et une modale "Randonnée terminée" s'affiche.
- **AC-05-09**: Given la modale de fin est affichée, When les statistiques sont rendues, Then la distance et la durée figées sont visibles, le dénivelé positif n'est visible que si au moins trois échantillons d'altitude exploitables ont été retenus, et toute métrique indisponible est absente sans `0`, `n/a` ni emplacement vide.
- **AC-05-10**: Given le signal GPS devient indisponible après le démarrage, When aucune nouvelle position fiable n'est reçue, Then les statistiques acquises restent intactes, aucune distance n'est inventée et "Stop" demeure disponible.
- **AC-05-11**: Given une session est active sur une boucle ou depuis une entrée intermédiaire, When le Tourist atteint l'arrivée officielle, Then la session ne se termine pas automatiquement et attend l'action "Stop".

---

## Business Rules

- **BR-01**: Le guidage randonnée public "Commencer la rando" utilise exclusivement Mapbox ; Google Maps et Apple Maps sont interdits pour le suivi du tracé.
- **BR-02**: Le libellé public pour l'accès au point de départ est "Rejoindre le départ". Le libellé "Itinéraire" ne doit pas être utilisé sur une fiche randonnée.
- **BR-03**: "Rejoindre le départ" cible toujours `TrailDetail.start_latitude` / `TrailDetail.start_longitude`, jamais un centroid arbitraire du tracé.
- **BR-04**: "Commencer la rando" est disponible uniquement si `TrailDetail.geometry_geojson` est valide et si `TrailDetail.data_quality_status` n'interdit pas le guidage.
- **BR-05**: La géolocalisation du Tourist requiert un consentement explicite navigateur.
- **BR-06**: La position GPS du Tourist n'est jamais envoyée à Gemini, Overpass, IGN, ni persistée en base en MVP 2.
- **BR-07**: Les seules requêtes externes autorisées depuis le navigateur pour `021` sont Mapbox GL / tiles pour les cartes, et Google Maps deep-link pour rejoindre le départ.
- **BR-08**: Aucune requête frontend directe vers Overpass, IGN / Géoplateforme ou site officiel n'est autorisée.
- **BR-09**: La carte du mode randonnée utilise un style Mapbox outdoor adapté au contexte montagne.
- **BR-10**: Les calculs de distance au tracé et progression sont indicatifs, calculés côté client, et ne constituent pas une donnée géographique officielle.
- **BR-11**: Le guidage live doit pouvoir fonctionner sans compte Tourist et sans session authentifiée.
- **BR-12**: La fermeture du mode randonnée doit appeler l'arrêt du `watchPosition` navigateur.
- **BR-13**: Les erreurs Mapbox, GPS refusé, GPS indisponible ou tracé absent doivent produire des états UI explicites sans page blanche.
- **BR-14**: L'interface doit prévenir le Tourist des limites sécurité et batterie avant ou au moment du démarrage du guidage.
- **BR-15**: Le mode "Commencer la rando" ne lance jamais `watchPosition` au chargement initial ; il attend une action explicite "Activer le suivi GPS".
- **BR-16**: En mode marche actif avec GPS lancé, après action explicite de démarrage depuis la carte, la caméra Mapbox garde toujours la position du Tourist au centre de la carte, y compris après un déplacement manuel de carte. Tant que le Tourist a seulement activé le GPS mais n'a pas démarré la rando, les états `pre_start` et `ready_to_join` restent explorables et ne recentrent pas automatiquement la carte. Le bouton "Recentrer" recentre sur la dernière position GPS connue. S'il n'existe pas encore de position, il ne déclenche pas de tracking implicite.
- **BR-17**: Une position GPS située à plus de 1 500 m du point le plus proche du tracé au premier calcul est un état pré-départ, pas un état `off_track`.
- **BR-18**: "Rejoindre le départ" ne déclenche jamais `navigator.geolocation` côté StayLocal ; Google Maps gère l'origine de navigation si l'utilisateur l'autorise dans Google.
- **BR-19**: La liaison visuelle d'approche relie la position courante au point le plus proche du tracé avant le démarrage et pendant l'état `approaching`. Elle est retirée quand la session passe en `tracking`, quand le Tourist clique "Stop" ou quand la session est détruite.
- **BR-20**: La zone autorisant "Démarrer ici" est inclusive et couvre toute position fiable située à 1 500 m ou moins du point le plus proche de l'ensemble de `TrailDetail.geometry_geojson`. Elle n'est pas limitée au départ officiel.
- **BR-21**: "Démarrer ici" exige un `watchPosition` actif et une dernière position reçue depuis 10 secondes ou moins, dont la précision horizontale est inférieure ou égale à 30 m. Le bouton ne déclenche jamais implicitement l'activation du GPS.
- **BR-22**: Au clic "Démarrer ici", la dernière position GPS fiable devient le départ réel de la session. Les points et le temps observés avant ce clic sont exclus du récapitulatif.
- **BR-23**: La distance parcourue de session est calculée localement en additionnant les segments entre points acceptés après le départ réel. Un point est accepté seulement si sa précision horizontale est inférieure ou égale à 30 m, si au moins 3 secondes le séparent du point accepté précédent, si le déplacement est d'au moins 5 m et si la vitesse calculée ne dépasse pas 8 m/s.
- **BR-24**: La phase entre le départ réel et l'entrée physique sur le tracé appartient à la session et compte dans la distance parcourue. Le passage de `approaching` à `tracking` intervient à 35 m ou moins du tracé.
- **BR-25**: Une session démarrée ne se termine jamais automatiquement selon la progression du tracé. L'action "Stop" est toujours disponible, idempotente, arrête `watchPosition` et fige définitivement les statistiques de la session.
- **BR-26**: Le récapitulatif de fin affiche la distance parcourue et la durée. Un échantillon d'altitude est exploitable seulement si `altitude` et `altitudeAccuracy` sont des nombres finis, si `altitudeAccuracy <= 20 m` et si le point GPS horizontal associé respecte `BR-23`. Le dénivelé positif est affiché seulement avec au moins trois échantillons exploitables ; les altitudes sont lissées par médiane glissante sur trois échantillons et seuls les gains successifs d'au moins 3 m sont additionnés. Sinon le champ dénivelé est absent. Le nombre de pas n'est pas calculé en MVP 2 et reste absent.
- **BR-27**: Une perte de signal GPS après le démarrage ne réinitialise pas la session, n'ajoute aucune distance synthétique et ne masque pas l'action "Stop".
- **BR-28**: Le départ réel, les points GPS, les altitudes et le récapitulatif restent en mémoire navigateur uniquement et sont détruits à la fermeture du mode randonnée. Ils ne sont envoyés à aucune API StayLocal ou tierce et ne sont pas persistés.

---

## Data Model

Cette spec n'introduit **aucun** nouveau modèle Prisma et ne modifie pas le schéma existant.

`021` réutilise les données publiées par `019-trails-acquisition` :

```prisma
model PointOfInterest {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  name        String
  slug        String
  latitude    Float
  longitude   Float
  is_active   Boolean @default(true)

  city_id      String
  category_id  String

  trail_detail TrailDetail?
}

model TrailDetail {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  poi_id      String   @unique

  difficulty  String
  distance_km Float?
  elevation_gain_m Int?
  estimated_duration_min Int?
  data_quality_status String

  start_label String?
  start_latitude Float
  start_longitude Float
  geometry_geojson Json?

  primary_source_type String
  source_refs Json
  is_active Boolean @default(true)
}
```

Notes :

- Aucune table `TrailNavigationSession` n'est créée en MVP 2.
- Aucune position GPS Tourist n'est stockée.
- La session locale conserve uniquement en mémoire : la position et l'heure du clic "Démarrer ici", les points GPS acceptés après ce clic, les altitudes exploitables éventuellement fournies, l'heure d'arrêt et le récapitulatif figé.
- Une future persistance de session, historique de trace, partage de progression ou analytics randonnée nécessitera une spec dédiée.

---

## API Contract

`021` n'ajoute aucune route API de mutation.

La page de navigation randonnée consomme les données publiques existantes issues de `019`.

```yaml
paths:
  /api/cities/{slug}/trails/{trail-slug}:
    get:
      summary: "Consulter une randonnée publiée avec ses données de navigation"
      tags: [trail-navigation]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
        - name: trail-slug
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Randonnée publiée utilisable par la fiche détail et le mode navigation
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: "#/components/schemas/TrailNavigationData"
        "404":
          description: Randonnée inexistante, inactive, supprimée ou non publiée

components:
  schemas:
    TrailNavigationData:
      type: object
      required:
        - id
        - slug
        - name
        - start_latitude
        - start_longitude
        - data_quality_status
        - source_refs
      properties:
        id:
          type: string
        slug:
          type: string
        name:
          type: string
        description:
          type: string
          nullable: true
        start_label:
          type: string
          nullable: true
        start_latitude:
          type: number
        start_longitude:
          type: number
        geometry_geojson:
          type: object
          nullable: true
        difficulty:
          type: string
        distance_km:
          type: number
          nullable: true
        elevation_gain_m:
          type: integer
          nullable: true
        estimated_duration_min:
          type: integer
          nullable: true
        data_quality_status:
          type: string
          enum: [complete, incomplete]
        source_refs:
          type: array
          items:
            type: object
```

Routes frontend attendues :

```yaml
frontend_routes:
  /guide/[city-slug]/rando/[trail-slug]:
    purpose: "Fiche détail randonnée, spécialisation de la route existante /guide/[city-slug]/[category-slug]/[poi-slug] avec category-slug = rando"
  /guide/[city-slug]/rando/[trail-slug]/start:
    purpose: "Mode Commencer la rando"
```

Services externes utilisés côté navigateur :

```yaml
external_services:
  mapbox_gl:
    purpose: "Carte outdoor et affichage du tracé"
    env: NEXT_PUBLIC_MAPBOX_TOKEN
  google_maps_deeplink:
    purpose: "Itinéraire externe vers le point de départ uniquement"
    env: none
  browser_geolocation:
    purpose: "Position utilisateur après consentement"
    persistence: "none"
```

---

## UI Behaviour

### Fiche randonnée

La fiche randonnée suit le mockup `docs/DAT/diagrams/mockups/004-poi-detail/rando_details.html`.

Éléments attendus :

- hero image plein écran mobile avec actions flottantes ;
- image fallback `/fallback/fallback-rando.png` dans le hero si la randonnée n'a aucune photo POI ;
- sheet arrondie `rounded-t-[56px]` sur fond `#FAF9F6` ;
- badge difficulté, badge ville, titre serif italic, description ;
- stats rapides : dénivelé, durée, niveau ou distance selon données disponibles ;
- galerie horizontale si photos disponibles ;
- carte Mapbox outdoor ou image statique avec tracé si `geometry_geojson` existe ;
- section "Comment s'y rendre" avec départ conseillé, accès et avertissement ;
- CTA principal : "Commencer la rando" ;
- CTA secondaire : "Rejoindre le départ".

Le CTA "Réserver" n'est pas utilisé pour une randonnée dans `021`.

### Action "Rejoindre le départ"

- Le CTA est un lien externe Google Maps construit avec `https://www.google.com/maps/dir/?api=1&destination={start_latitude},{start_longitude}`.
- L'origine n'est pas fournie par StayLocal ; Google Maps utilise la position utilisateur seulement si l'utilisateur l'autorise dans Google.
- Aucun état `gps_prompt`, `gps_denied` ou route Mapbox n'est affiché par StayLocal pour cette action.

### Mode "Commencer la rando"

La route `/guide/[city-slug]/rando/[trail-slug]/start` est une expérience plein écran mobile-first. Sur desktop et tablette, cette expérience reste contrainte à la coque publique mobile `max-w-[430px]` centrée ; la carte est plein écran dans cette coque, pas sur toute la largeur du viewport navigateur.

Éléments attendus :

- carte Mapbox `outdoors` plein écran ;
- tracé GeoJSON visible avec style contrasté ;
- marker départ ;
- marker arrivée si le tracé permet de l'inférer ;
- bouton "Activer le suivi GPS" visible en état `ready` ;
- marker position utilisateur après activation du suivi et consentement ;
- caméra centrée en continu sur la position utilisateur pendant la marche active, seulement après démarrage explicite depuis la carte ;
- calcul du point le plus proche sur l'ensemble du tracé, y compris sur un segment intermédiaire ;
- bouton "Démarrer ici" disponible uniquement avec GPS actif, position reçue depuis 10 secondes ou moins, précision horizontale ≤ 30 m et distance au tracé ≤ 1 500 m ;
- liaison d'approche vers le point le plus proche conservée pendant `approaching`, puis retirée en `tracking` ;
- bouton recentrer sur position ;
- panneau bas avec titre randonnée, données théoriques du parcours avant démarrage, puis distance et durée réelles de session après "Démarrer ici" ; si le Tourist rabat ou rouvre ce panneau manuellement, les changements ultérieurs d'état GPS ne doivent pas écraser ce choix ;
- bouton "Stop" toujours accessible après démarrage ;
- modale "Randonnée terminée" après arrêt, avec actions "Voir le tracé" et "Quitter la rando" ;
- avertissement sécurité accessible avant ou pendant le démarrage.

États UI obligatoires :

- `ready`: tracé chargé, GPS pas encore demandé, bouton "Activer le suivi GPS" visible ;
- `gps_prompt`: consentement en cours ;
- `ready_to_join`: GPS fiable actif et position située à 1 500 m ou moins du point le plus proche du tracé, bouton "Démarrer ici" visible ;
- `approaching`: session démarrée depuis la position GPS du Tourist, mais tracé pas encore atteint à 35 m ou moins ;
- `tracking`: session démarrée et position située à 35 m ou moins du tracé au moins une fois ;
- `pre_start`: GPS actif mais position située à plus de 1 500 m du point le plus proche du tracé ;
- `off_track`: distance au tracé supérieure au seuil UI après démarrage effectif sur la zone de randonnée ;
- `low_accuracy`: précision GPS supérieure à 30 m ou dernière position reçue depuis plus de 10 secondes ;
- `gps_denied`: GPS refusé ;
- `stopped`: session arrêtée, statistiques figées et récapitulatif affichable ;
- `map_error`: Mapbox indisponible ;
- `missing_geometry`: tracé absent ou invalide.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | CTA Rejoindre le départ visible si départ fiable | integration |
| AC-01-02 | Rejoindre le départ ouvre Google Maps vers les coordonnées du départ | unit |
| AC-01-03 | Rejoindre le départ ne demande pas la géolocalisation StayLocal | unit |
| AC-01-04 | Pas de départ fiable → CTA masqué | unit |
| AC-01-05 | Commencer la rando n'ouvre aucune URL Google Maps / Apple Maps | unit |
| AC-02-01 | CTA Commencer visible si géométrie valide | integration |
| AC-02-02 | CTA Commencer navigue vers `/start` | e2e |
| AC-02-03 | Mode randonnée affiche Mapbox outdoor + tracé + markers | e2e |
| AC-02-04 | GPS refusé garde le tracé mais désactive guidage live | e2e |
| AC-02-05 | Pas de géométrie fiable → CTA Commencer masqué | unit |
| AC-02-06 | Activation explicite démarre `watchPosition` | unit |
| AC-03-01 | Position utilisateur affichée après activation GPS | unit |
| AC-03-02 | Distance au tracé calculée côté client | unit |
| AC-03-03 | Position initiale éloignée affiche l'état pré-départ | unit |
| AC-03-04 | Point d'entrée localisé sur le parcours sans distance parcourue fictive | unit |
| AC-03-05 | Précision GPS faible affichée explicitement | unit |
| AC-03-06 | Alerte off-track affichée au-delà du seuil après démarrage effectif | unit |
| BR-16 | Caméra centrée en continu sur le Tourist pendant la marche active | unit |
| BR-19 | Liaison d'approche conservée pendant `approaching`, puis retirée en `tracking` | unit |
| AC-04-01 | Consentement navigateur requis avant position | e2e |
| AC-04-02 | Position non persistée en base/API | contract |
| AC-04-03 | Avertissement sécurité visible | integration |
| AC-04-04 | Fermeture arrête `watchPosition` | unit |
| AC-04-05 | Aucun tracking GPS sans ouverture explicite du mode randonnée | e2e |
| AC-05-01 | Aucun démarrage sans GPS actif, position récente et précision ≤ 30 m | unit |
| AC-05-02/AC-05-03 | Seuil inclusif de 1 500 m calculé depuis le point le plus proche de tout le tracé | unit |
| AC-05-04 | Clic "Démarrer ici" fige la position réelle et remet la session à zéro | unit |
| AC-05-05 | Distance réelle calculée depuis le départ utilisateur, approche incluse | unit |
| AC-05-06 | Passage automatique `approaching` → `tracking` à 35 m ou moins | unit |
| AC-05-07/AC-05-10 | "Stop" reste accessible pendant la session et après perte GPS | integration |
| AC-05-08 | Stop idempotent, arrêt GPS et ouverture de la modale | unit |
| AC-05-09 | Récapitulatif figé et métriques indisponibles masquées | integration |
| AC-05-11 | Aucune fin automatique au point d'arrivée officiel | unit |

---

## Out of Scope

- Persistance de trace GPS utilisateur.
- Historique personnel de randonnée.
- Compte Tourist, favoris connectés ou synchronisation multi-device.
- Navigation vocale turn-by-turn.
- Guidage offline complet.
- Téléchargement de cartes hors ligne.
- Détection automatique d'accident ou appel secours.
- Conditions météo, enneigement, fermeture de sentier ou dangers temps réel.
- Import ou scraping AllTrails.
- Appels frontend vers Overpass, IGN / Géoplateforme, Gemini ou sites officiels.
- Moteur cartographique autre que Mapbox.
- Modification des règles d'acquisition `019`.
- Création d'un modèle Prisma de session navigation.
- Comptage ou estimation du nombre de pas.
- Reprise d'une session après "Stop", fermeture ou rechargement de page.
- Fin automatique fondée sur le départ officiel, l'arrivée officielle ou le bouclage du tracé.

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | `Itinéraire` doit-il désigner l'accès au départ ou le suivi du tracé ? | Product Owner | 2026-05-25 | Résolu : accès au départ uniquement, renommé "Rejoindre le départ". |
| OQ-02 | Le mode randonnée peut-il utiliser Google Maps ? | Product Owner | 2026-05-25 | Résolu : Google Maps est autorisé seulement pour "Rejoindre le départ"; "Commencer la rando" reste Mapbox uniquement. |
| OQ-03 | La position GPS doit-elle être persistée en MVP 2 ? | Product Owner + Architecture | 2026-05-25 | Résolu : non, suivi local navigateur uniquement. |
| OQ-04 | La navigation live appartient-elle à `019-trails-acquisition` ? | Architecture | 2026-05-25 | Résolu : non, `019` reste acquisition ; `021` couvre la navigation. |
| OQ-05 | Quelle distance autorise un départ depuis la position courante ? | Product Owner | 2026-07-14 | Résolu : 1 500 m inclusifs depuis le point le plus proche de l'ensemble du tracé. |
| OQ-06 | Quel point devient le départ de la session ? | Product Owner | 2026-07-14 | Résolu : la position GPS fiable disponible au clic "Démarrer ici". |
| OQ-07 | Comment terminer une session commencée à mi-parcours ou sur une boucle ? | Product Owner | 2026-07-14 | Résolu : uniquement par le bouton "Stop", sans fin automatique. |
| OQ-08 | Que faire des métriques indisponibles dans le récapitulatif ? | Product Owner | 2026-07-14 | Résolu : les masquer entièrement ; aucun nombre de pas n'est calculé en MVP 2. |
