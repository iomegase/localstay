# Spec — 021 Trail Navigation

## Metadata

```yaml
id: 021-trail-navigation
title: "Navigation randonnée Mapbox et guidage GPS local"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-25
updated_at: 2026-05-25
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

Cette spec corrige explicitement une ambiguïté historique de `004-poi-detail` : les randonnées ne doivent pas utiliser Google Maps comme fallback d'itinéraire. L'expérience randonnée utilise Mapbox, conformément à `005-map`, `ADR-001` et au choix produit inspiré des usages type AllTrails.

`021` ne modifie pas l'acquisition des randonnées. Les données de tracé, départ, distance, dénivelé, source et attribution restent produites et validées par `019-trails-acquisition`.

---

## Glossary References

- **Tourist** : utilisateur public sans compte.
- **Trail** : randonnée publiable dans le Guide.
- **Trail Detail** : données spécialisées d'une randonnée publiée.
- **Trail Navigation** : mode de guidage randonnée côté navigateur, basé sur Mapbox et la géolocalisation consentie.
- **Trail Navigation Session** : session locale temporaire ouverte quand le Tourist clique "Commencer la rando".
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
- **AC-01-02**: Given le Tourist clique "Rejoindre le départ", When il accepte la géolocalisation navigateur, Then une carte Mapbox affiche un itinéraire entre sa position courante et le point de départ.
- **AC-01-03**: Given le Tourist refuse la géolocalisation ou que le navigateur ne la supporte pas, When il clique "Rejoindre le départ", Then la carte Mapbox affiche au minimum le marker du départ, son libellé et ses coordonnées utiles.
- **AC-01-04**: Given une randonnée sans point de départ fiable, When la fiche randonnée s'affiche, Then le CTA "Rejoindre le départ" est masqué.
- **AC-01-05**: Given le Tourist utilise une fiche randonnée, When il demande l'itinéraire vers le départ, Then aucune URL Google Maps ou Apple Maps n'est ouverte.

### US-02 — Commencer une randonnée guidée

**As a** Tourist  
**I want to** démarrer une carte de guidage pendant ma randonnée  
**So that** je puisse suivre le tracé et savoir où je suis

#### Acceptance Criteria

- **AC-02-01**: Given une randonnée publiée avec `TrailDetail.geometry_geojson` valide, When la fiche randonnée s'affiche, Then le CTA principal "Commencer la rando" est visible.
- **AC-02-02**: Given le Tourist clique "Commencer la rando", When la randonnée possède une géométrie valide, Then il est dirigé vers `/guide/[city-slug]/rando/[trail-slug]/start`.
- **AC-02-03**: Given le mode randonnée démarre, When la page charge, Then une carte Mapbox `outdoors` plein écran affiche le tracé, le point de départ, l'arrivée si détectable, et la position utilisateur si consentie.
- **AC-02-04**: Given le Tourist refuse la géolocalisation, When le mode randonnée est ouvert, Then le tracé reste visible mais le guidage live est remplacé par un état "GPS indisponible".
- **AC-02-05**: Given une randonnée sans géométrie fiable, When la fiche randonnée s'affiche, Then le CTA "Commencer la rando" est masqué et aucun mode guidage n'est accessible.

### US-03 — Suivre sa progression sur le tracé

**As a** Tourist  
**I want to** voir ma position et mon écart au tracé  
**So that** je puisse rester orienté pendant la randonnée

#### Acceptance Criteria

- **AC-03-01**: Given le GPS est autorisé, When le navigateur retourne une position, Then la position utilisateur est affichée sur la carte sous forme de marker dynamique.
- **AC-03-02**: Given le GPS est autorisé et le tracé existe, When la position change, Then la distance approximative au tracé est calculée côté client.
- **AC-03-03**: Given la distance au tracé dépasse le seuil de sécurité défini par l'interface, When l'état est recalculé, Then un message "Vous semblez vous éloigner du tracé" est affiché sans bloquer la navigation.
- **AC-03-04**: Given le GPS est autorisé, When la position progresse le long du tracé, Then l'interface affiche une progression indicative : distance parcourue estimée ou pourcentage de tracé.
- **AC-03-05**: Given la précision GPS retournée par le navigateur est faible, When la position est affichée, Then l'interface montre un état "Précision GPS faible" au lieu de prétendre à un guidage fiable.

### US-04 — Préserver vie privée, batterie et sécurité

**As a** Tourist  
**I want to** comprendre les limites du guidage  
**So that** je puisse l'utiliser sans croire qu'il remplace une carte officielle ou ma vigilance

#### Acceptance Criteria

- **AC-04-01**: Given le Tourist ouvre le mode randonnée, When la géolocalisation est demandée, Then le consentement est demandé via l'API navigateur et aucune position n'est récupérée avant accord.
- **AC-04-02**: Given une position GPS est obtenue, When le mode randonnée est actif, Then cette position reste en mémoire navigateur et n'est jamais persistée en base.
- **AC-04-03**: Given le mode randonnée est actif, When l'interface s'affiche, Then un avertissement sécurité indique que StayLocal ne remplace pas une carte officielle, la météo, le balisage terrain ou l'équipement adapté.
- **AC-04-04**: Given le Tourist quitte ou termine le mode randonnée, When la session locale se ferme, Then le suivi GPS navigateur est arrêté.
- **AC-04-05**: Given le Tourist consulte le Guide public, When il n'ouvre pas explicitement le mode randonnée, Then aucun tracking GPS live n'est lancé.

---

## Business Rules

- **BR-01**: Les randonnées utilisent exclusivement Mapbox pour les cartes et le guidage public ; Google Maps et Apple Maps sont interdits pour les actions randonnée de `021`.
- **BR-02**: Le libellé public pour l'accès au point de départ est "Rejoindre le départ". Le libellé "Itinéraire" ne doit pas être utilisé sur une fiche randonnée.
- **BR-03**: "Rejoindre le départ" cible toujours `TrailDetail.start_latitude` / `TrailDetail.start_longitude`, jamais un centroid arbitraire du tracé.
- **BR-04**: "Commencer la rando" est disponible uniquement si `TrailDetail.geometry_geojson` est valide et si `TrailDetail.data_quality_status` n'interdit pas le guidage.
- **BR-05**: La géolocalisation du Tourist requiert un consentement explicite navigateur.
- **BR-06**: La position GPS du Tourist n'est jamais envoyée à Gemini, Overpass, IGN, ni persistée en base en MVP 2.
- **BR-07**: Les seules requêtes externes autorisées depuis le navigateur pour `021` sont Mapbox GL / tiles et, si nécessaire, Mapbox Directions pour rejoindre le départ.
- **BR-08**: Aucune requête frontend directe vers Overpass, IGN / Géoplateforme ou site officiel n'est autorisée.
- **BR-09**: La carte du mode randonnée utilise un style Mapbox outdoor adapté au contexte montagne.
- **BR-10**: Les calculs de distance au tracé et progression sont indicatifs, calculés côté client, et ne constituent pas une donnée géographique officielle.
- **BR-11**: Le guidage live doit pouvoir fonctionner sans compte Tourist et sans session authentifiée.
- **BR-12**: La fermeture du mode randonnée doit appeler l'arrêt du `watchPosition` navigateur.
- **BR-13**: Les erreurs Mapbox, GPS refusé, GPS indisponible ou tracé absent doivent produire des états UI explicites sans page blanche.
- **BR-14**: L'interface doit prévenir le Tourist des limites sécurité et batterie avant ou au moment du démarrage du guidage.

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
  mapbox_directions:
    purpose: "Itinéraire vers le point de départ uniquement"
    env: NEXT_PUBLIC_MAPBOX_TOKEN
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

- Si GPS accepté : afficher une route Mapbox entre la position courante et le point de départ.
- Si GPS refusé : afficher le point de départ, le libellé et les coordonnées.
- Si Mapbox Directions échoue : garder la carte centrée sur le départ et afficher une alerte non bloquante.

### Mode "Commencer la rando"

La route `/guide/[city-slug]/rando/[trail-slug]/start` est une expérience plein écran mobile-first.

Éléments attendus :

- carte Mapbox `outdoors` plein écran ;
- tracé GeoJSON visible avec style contrasté ;
- marker départ ;
- marker arrivée si le tracé permet de l'inférer ;
- marker position utilisateur après consentement ;
- bouton recentrer sur position ;
- panneau bas avec titre randonnée, distance/durée/dénivelé, état GPS et état de suivi ;
- bouton "Terminer" ou "Quitter la rando" ;
- avertissement sécurité accessible avant ou pendant le démarrage.

États UI obligatoires :

- `ready`: tracé chargé, GPS pas encore demandé ;
- `gps_prompt`: consentement en cours ;
- `tracking`: position utilisateur suivie ;
- `off_track`: distance au tracé supérieure au seuil UI ;
- `low_accuracy`: précision GPS faible ;
- `gps_denied`: GPS refusé ;
- `map_error`: Mapbox indisponible ;
- `missing_geometry`: tracé absent ou invalide.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | CTA Rejoindre le départ visible si départ fiable | integration |
| AC-01-02 | Rejoindre le départ affiche route Mapbox après consentement GPS | e2e |
| AC-01-03 | GPS refusé affiche départ sans route live | e2e |
| AC-01-04 | Pas de départ fiable → CTA masqué | unit |
| AC-01-05 | Aucune URL Google Maps / Apple Maps sur fiche randonnée | unit |
| AC-02-01 | CTA Commencer visible si géométrie valide | integration |
| AC-02-02 | CTA Commencer navigue vers `/start` | e2e |
| AC-02-03 | Mode randonnée affiche Mapbox outdoor + tracé + markers | e2e |
| AC-02-04 | GPS refusé garde le tracé mais désactive guidage live | e2e |
| AC-02-05 | Pas de géométrie fiable → CTA Commencer masqué | unit |
| AC-03-01 | Position utilisateur affichée après `watchPosition` | unit |
| AC-03-02 | Distance au tracé calculée côté client | unit |
| AC-03-03 | Alerte off-track affichée au-delà du seuil | unit |
| AC-03-04 | Progression indicative affichée | unit |
| AC-03-05 | Précision GPS faible affichée explicitement | unit |
| AC-04-01 | Consentement navigateur requis avant position | e2e |
| AC-04-02 | Position non persistée en base/API | contract |
| AC-04-03 | Avertissement sécurité visible | integration |
| AC-04-04 | Fermeture arrête `watchPosition` | unit |
| AC-04-05 | Aucun tracking GPS sans ouverture explicite du mode randonnée | e2e |

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

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | `Itinéraire` doit-il désigner l'accès au départ ou le suivi du tracé ? | Product Owner | 2026-05-25 | Résolu : accès au départ uniquement, renommé "Rejoindre le départ". |
| OQ-02 | Le mode randonnée peut-il utiliser Google Maps ? | Product Owner | 2026-05-25 | Résolu : non, Mapbox uniquement. |
| OQ-03 | La position GPS doit-elle être persistée en MVP 2 ? | Product Owner + Architecture | 2026-05-25 | Résolu : non, suivi local navigateur uniquement. |
| OQ-04 | La navigation live appartient-elle à `019-trails-acquisition` ? | Architecture | 2026-05-25 | Résolu : non, `019` reste acquisition ; `021` couvre la navigation. |
