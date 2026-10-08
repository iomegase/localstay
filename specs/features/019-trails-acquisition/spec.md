# Spec — 019 Trails Acquisition

## Metadata

```yaml
id: 019-trails-acquisition
title: "Acquisition, enrichissement et validation des randonnées"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-25
updated_at: 2026-09-30
depends_on: [003-poi-list, 004-poi-detail, 005-map, 007-gemini-fetch, 017-admin-taxonomy, 018-poi-acquisition-pipeline]
bounded_context: trails
```

---

## Context

Les randonnées ne peuvent pas être acquises comme des POI classiques. Une randonnée n'est pas toujours présente dans Google Places, et ses données essentielles ne sont pas une fiche d'établissement : tracé, point de départ, distance, durée, dénivelé, difficulté, source et attribution.

StayLocal doit donc créer un pipeline dédié pour récupérer le maximum d'informations utiles depuis :

- sites web officiels ou locaux existants, par exemple office de tourisme, site de station ou page municipale ;
- Overpass / OpenStreetMap pour les chemins, relations, points de départ et objets géographiques ;
- IGN / Géoplateforme pour les données altimétriques et les informations géographiques fiables en France ;
- Gemini uniquement pour la découverte éditoriale et la génération de descriptions ;
- saisie manuelle Super-admin quand les sources automatiques sont incomplètes.

Le résultat public reste compatible avec le Guide : une randonnée publiée apparaît comme un `PointOfInterest` dans la catégorie `Rando`, mais ses données spécialisées vivent dans le bounded context `trails`.

Références de cadrage :

- `docs/guides/impl-api-randonnees.md`
- `docs/DAT/adr/ADR-006-trails-data-source.md`
- `docs/DAT/adr/ADR-007-business-scalability-bounded-contexts.md`

### Clarifications d'implémentation

- `TrailDetail` devient le modèle canonique pour les nouvelles randonnées. L'ancien `HikingDetail` défini par `004-poi-detail` reste lisible en fallback tant que des données historiques existent.
- Une randonnée publiée doit avoir au minimum : titre, City active, Category active `Rando`, point de départ avec coordonnées, difficulté, source principale et attribution.
- Une géométrie complète GeoJSON / GPX est fortement recommandée, mais peut manquer si l'Admin confirme explicitement une publication incomplète. Dans ce cas `data_quality_status = incomplete`.
- La distance de zone StayLocal (`primary`, `nearby`, `out_of_range`) est calculée depuis le point de départ de la randonnée, jamais depuis un centroid arbitraire du tracé.
- Une randonnée peut être multi-sources : site officiel pour contenu, Overpass / GPX pour géométrie, IGN pour altimétrie, Gemini pour description. Le modèle stocke une source principale et une liste de références de sources.
- Overpass ne crée un candidat randonnée que pour une relation `route=hiking` ou un chemin nommé avec signaux randonnée forts. Les objets bruts `highway=path`, parkings, refuges, sommets et points d'eau servent d'enrichissement, pas de publication automatique.
- Les sites web sont analysés uniquement depuis une URL fournie par l'Admin. Il n'y a pas de crawl massif, pas d'extraction depuis AllTrails, et aucune source sans attribution conservée.

---

## Glossary References

- **POI** : point d'intérêt public utilisé comme point d'entrée dans le Guide.
- **City** : ville ou commune de référence pour l'acquisition et l'affichage.
- **Category** : catégorie globale ; `Rando` classe les randonnées publiées.
- **SubCategory** : sous-catégorie globale ; `Facile`, `Moyen`, `Difficile` peuvent filtrer les randonnées.
- **Trail** : randonnée publiable dans le Guide.
- **Trail Candidate** : randonnée candidate avant validation Super-admin.
- **Trail Import Run** : exécution d'acquisition randonnée pour une ville, une zone ou une source.
- **Trail Detail** : données spécialisées d'une randonnée publiée.
- **Trail Source** : référence de source utilisée pour une randonnée ou un candidat : site officiel, Overpass, IGN, Gemini, GPX ou saisie manuelle.
- **Admin** : rôle Super-admin autorisé à importer, corriger, publier ou rejeter.
- **Gemini Fetch** : découverte et descriptif uniquement.
- **Soft Delete** : suppression logique via `deleted_at`.

---

## User Stories

### US-01 — Lancer une acquisition randonnée multi-sources

**As an** Admin  
**I want to** lancer une acquisition de randonnées pour une ville ou une zone  
**So that** StayLocal récupère le maximum de parcours locaux exploitables

#### Acceptance Criteria

- **AC-01-01**: Given une City active, When l'Admin lance une acquisition randonnée, Then un `TrailImportRun` est créé avec `status = running`.
- **AC-01-02**: Given un run avec source web officielle, When le backend analyse la source, Then les randonnées détectées deviennent des `TrailCandidate` avec `primary_source_type = official_website` et une entrée `source_refs`.
- **AC-01-03**: Given un run Overpass, When Overpass retourne une relation `route=hiking` ou un chemin nommé avec signaux randonnée forts, Then l'objet utile est conservé dans `raw_payload` et normalisé en `TrailCandidate`.
- **AC-01-04**: Given un run avec Gemini activé, When Gemini propose des noms ou descriptions de randonnées, Then ces données sont utilisées uniquement comme découverte ou texte éditorial, jamais comme métrique géographique.
- **AC-01-05**: Given une acquisition échouée partiellement, When au moins une source a répondu, Then le run se termine en `partial_success` et conserve les erreurs par source.

- **AC-01-06**: Les candidats dédupliqués sont persistés après la découverte, avant les enrichissements, puis après chaque phase. Les identifiants restent stables ; une modification/revue concurrente par un Admin n'est jamais écrasée.
- **AC-01-07**: Une source ou phase trop lente est bornée et signalée dans `source_errors`. Le run conserve les résultats disponibles et termine en `partial_success` (ou `failed` sans candidat). Une exception inattendue clôt aussi le run avec une erreur explicite.
- **AC-01-08**: Un run `running` sans mise à jour depuis 10 minutes est clôturé à la prochaine consultation admin : `partial_success` avec candidats, `failed` sinon, avec explication d'interruption. Les candidats et les runs terminés sont conservés. La clôture compare aussi `updated_at` pour ne pas interrompre un run qui vient de progresser.

### US-02 — Enrichir les candidats avec données géographiques fiables

**As a** System  
**I want to** enrichir les candidats randonnée avec tracé, départ, distance et dénivelé  
**So that** les fiches publiées soient fiables et utiles aux touristes

#### Acceptance Criteria

- **AC-02-01**: Given un candidat avec géométrie Overpass ou GPX, When il est enrichi, Then `geometry_geojson` est stocké côté serveur.
- **AC-02-02**: Given un candidat avec géométrie valide, When l'altimétrie IGN / Géoplateforme est disponible, Then `elevation_gain_m` est calculé ou importé depuis cette source fiable.
- **AC-02-03**: Given un candidat sans géométrie fiable mais avec point de départ fiable, When l'Admin tente de publier, Then la publication est bloquée sauf confirmation explicite qui crée une randonnée avec `data_quality_status = incomplete`.
- **AC-02-04**: Given une distance ou un dénivelé provenant de Gemini, When la donnée est traitée, Then elle est rejetée et n'est jamais persistée comme donnée fiable.
- **AC-02-05**: Given une source officielle contenant distance, durée ou difficulté, When la donnée est importée, Then elle est stockée avec `metric_source = official_website` et reste modifiable par l'Admin.

### Complément validé — acquisition des photos (demande propriétaire du 30/09/2026)

- **AC-02-06** : Les photos disponibles dans les galeries des sources (Camptocamp, fiches officielles, Geotrek) sont conservées dans `raw_payload.acquired_photos`, sans plafond arbitraire de huit images, avec URL, page source, légende et attribution disponibles. Les fichiers GPX eux-mêmes ne contiennent pas la galerie : celle-ci est récupérée depuis leur source.
- **AC-02-07** : La publication et la fusion copient les URL de photos acquises sans remplacer les photos existantes vers `PointOfInterest.photos`, quelle que soit la source principale du candidat. Les crédits et références des photos sont conservés dans `TrailDetail.source_refs`. Les anciennes associations d'images Camptocamp restent lisibles. Les photos restent acquises lors d'une déduplication multi-sources.
- **AC-02-08** : La revue admin montre la galerie, le nombre de photos et les crédits disponibles. Une absence reste explicite ; aucune image générique ni image d'une recommandation sans lien avec le parcours n'est ajoutée automatiquement.
- Format photo dans le JSON existant et dans le DTO admin `photos` : `{ url, source_url, attribution, caption?, license? }`. Aucune migration de base n'est nécessaire. La récupération rétrospective conserve les photos déjà présentes ; elle peut compléter les POI déjà publiés sans publier de nouveaux parcours.

### US-03 — Revoir, corriger et publier les randonnées

**As an** Admin  
**I want to** revoir les randonnées candidates avant publication  
**So that** seules les randonnées fiables soient visibles dans le Guide

#### Acceptance Criteria

- **AC-03-01**: Given `/admin/trails/runs/{id}`, When l'Admin ouvre un run, Then il voit chaque candidat avec source, statut géométrie, statut altimétrie, doublons possibles et statut de review.
- **AC-03-02**: Given un candidat complet, When l'Admin clique "Publier", Then un `PointOfInterest` actif est créé ou lié et un `TrailDetail` actif est créé.
- **AC-03-03**: Given un candidat doublon probable, When l'Admin fusionne avec une randonnée existante, Then aucun nouveau POI n'est créé et le candidat est marqué `merged`.
- **AC-03-04**: Given un candidat non fiable, When l'Admin clique "Rejeter", Then `review_status = rejected` et aucune randonnée publique n'est créée.
- **AC-03-05**: Given une action admin sur un candidat, When elle est enregistrée, Then un `TrailAuditLog` conserve l'action, l'admin, la cible et les valeurs utiles avant/après.

### US-04 — Créer ou compléter une randonnée manuellement

**As an** Admin  
**I want to** créer ou compléter une randonnée manuellement  
**So that** StayLocal puisse couvrir les parcours absents des sources automatiques

#### Acceptance Criteria

- **AC-04-01**: Given `/admin/trails/new`, When l'Admin renseigne nom, City, difficulté et point de départ, Then le formulaire est validé côté serveur avec Zod.
- **AC-04-02**: Given une géométrie GeoJSON ou un GPX XML importé manuellement, When elle est valide, Then elle est convertie si nécessaire et attachée au `TrailCandidate` sous forme `geometry_geojson`.
- **AC-04-03**: Given un candidat manuel sans géométrie complète, When l'Admin sauvegarde, Then il reste en `review_status = needs_review`.
- **AC-04-04**: Given une randonnée manuelle publiée, When elle s'affiche dans le Guide, Then elle porte `primary_source_type = manual`, `source_refs` contient une attribution StayLocal et `data_quality_status` reflète son niveau de complétude.

### US-05 — Afficher les randonnées publiées dans le Guide

**As a** Tourist  
**I want to** consulter les randonnées publiées dans la catégorie Rando  
**So that** je puisse choisir une sortie adaptée

#### Acceptance Criteria

- **AC-05-01**: Given une randonnée publiée, When le Tourist ouvre la catégorie `Rando`, Then elle apparaît comme POI public avec difficulté, durée, distance, dénivelé si disponibles et zone calculée depuis son point de départ.
- **AC-05-02**: Given une randonnée avec `TrailDetail`, When le Tourist ouvre la fiche POI, Then le bloc randonnée affiche difficulté, durée, distance, dénivelé, point de départ, source et attribution.
- **AC-05-03**: Given une randonnée avec géométrie, When la fiche détail s'affiche, Then le tracé peut être affiché sur une carte selon les règles de `005-map`.
- **AC-05-04**: Given une randonnée rejetée, inactive ou supprimée logiquement, When le Guide public s'affiche, Then elle n'apparaît jamais.

### US-06 — Respecter les sources et leurs limites

**As a** System  
**I want to** tracer les sources et limiter les appels externes  
**So that** StayLocal reste fiable, légal et scalable

#### Acceptance Criteria

- **AC-06-01**: Given une donnée importée depuis un site officiel, Overpass, IGN ou Gemini, When elle est persistée, Then sa source et son attribution sont conservées.
- **AC-06-02**: Given une page publique, When elle affiche une randonnée, Then l'attribution nécessaire est visible ou accessible.
- **AC-06-03**: Given un utilisateur public, When il consulte le Guide, Then aucune requête directe vers Overpass ou IGN n'est déclenchée depuis le navigateur.
- **AC-06-04**: Given plusieurs acquisitions proches, When le backend appelle une source externe, Then il utilise cache, déduplication ou rate limiting.

---

## Business Rules

- **BR-01**: Les randonnées publiées utilisent `PointOfInterest` comme entrée publique, mais leurs données spécialisées vivent dans `TrailDetail`.
- **BR-02**: `TrailDetail` est canonique pour les nouvelles randonnées ; `HikingDetail` reste un fallback de lecture hérité de `004-poi-detail`.
- **BR-03**: Google Places n'est pas une source de référence pour acquérir des randonnées.
- **BR-04**: Gemini est autorisé uniquement pour découvrir des noms de randonnées et générer des descriptions éditoriales.
- **BR-05**: Gemini ne fournit jamais coordonnées GPS, tracés, distance, durée, dénivelé, difficulté calculée ou métrique géographique fiable.
- **BR-06**: Les tracés viennent uniquement de sources spécialisées : Overpass / OSM, GPX importé, source officielle, IGN / Géoplateforme ou saisie admin validée.
- **BR-07**: Les distances et dénivelés viennent uniquement de la géométrie validée, d'IGN / Géoplateforme, d'un GPX validé ou d'une source officielle explicitement attribuée.
- **BR-08**: Une randonnée stocke `primary_source_type` pour sa source éditoriale principale et `source_refs` pour tracer toutes les sources utilisées.
- **BR-09**: Les sites web officiels ou locaux existants peuvent être utilisés uniquement si l'URL est renseignée par l'Admin, l'attribution est conservée et aucun crawl massif n'est réalisé.
- **BR-10**: Le scraping de sites dont les conditions l'interdisent est hors scope ; AllTrails est explicitement interdit.
- **BR-11**: Aucune randonnée n'est publiée automatiquement. La validation Super-admin est obligatoire.
- **BR-12**: Un `TrailCandidate` publié doit être rattaché à une City active, à la Category active `Rando` et à une SubCategory active si renseignée.
- **BR-13**: Une randonnée publiée doit avoir un point de départ fiable (`start_latitude`, `start_longitude`). Ce point devient la latitude/longitude du `PointOfInterest`.
- **BR-14**: Une randonnée sans géométrie fiable peut rester candidate, mais ne peut être publiée que si l'Admin confirme explicitement une publication incomplète. Elle reçoit alors `data_quality_status = incomplete`.
- **BR-15**: Toute donnée publique doit distinguer les données mesurées, importées, calculées et saisies manuellement.
- **BR-16**: Les imports externes sont exécutés côté serveur uniquement, jamais depuis le frontend public.
- **BR-17**: Les appels Overpass, IGN / Géoplateforme et analyse de sites web doivent être cachés ou rate-limités.
- **BR-18**: Toute action admin sur une randonnée candidate ou publiée est auditée.
- **BR-19**: Aucune suppression physique n'est autorisée ; `deleted_at` est obligatoire pour les suppressions logiques.
- **BR-20**: Les zones géographiques globales StayLocal s'appliquent depuis le point de départ : primary zone ≤ 15 km, nearby zone 15-30 km, out of range > 30 km rejeté ou non publié.
- **BR-21**: Overpass ne crée un candidat publiable que pour une relation `route=hiking` ou un chemin nommé avec signaux randonnée forts. Les chemins bruts, parkings, refuges, sommets et points d'eau servent d'enrichissement.
- **BR-22**: Les difficultés canoniques sont `easy`, `medium`, `hard`, `expert`, `unknown`. Le mapping public vers `Facile`, `Moyen`, `Difficile` est géré par la SubCategory active correspondante quand elle existe.
- **BR-24**: Correctif technique approuvé en conversation le 2026-09-30 : découverte des sources en parallèle, budget global 210 s pour les appels externes, maximum 65 s par source de découverte et 35 s par phase d'enrichissement. Route d'import configurée à 300 s pour laisser le temps de sauvegarder. Aucun nouvel appel n'est lancé après expiration ; une réponse tardive ne modifie pas les résultats persistés. Les imports restent synchrones ; aucune dépendance à une tâche détachée non durable.
- **BR-25**: Les checkpoints utilisent les modèles existants, sans migration. Seuls les candidats encore non revus et inchangés depuis le précédent checkpoint peuvent être mis à jour. Aucune publication automatique. La récupération des imports anciens ne supprime ni candidat ni historique.
- **BR-23**: Les sources doivent être suffisamment explicites pour permettre une vérification manuelle ultérieure par le Super-admin.

---

## Data Model

```prisma
model PointOfInterest {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  name        String
  slug        String
  description String?
  address     String
  latitude    Float
  longitude   Float
  photos      String[]
  tags        String[]
  is_active   Boolean @default(true)

  city_id        String
  category_id    String
  subcategory_id String?

  trail_detail TrailDetail?
}

model TrailImportRun {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  city_id     String
  status      String   @default("running") // running | completed | partial_success | failed
  source_types String[] // official_website | overpass | ign | gemini | gpx | manual
  source_url  String?
  zone_radius_km Float?
  started_by  String?
  error        String?
  source_errors Json?

  candidates  TrailCandidate[]
}

model TrailCandidate {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  run_id      String?
  run         TrailImportRun? @relation(fields: [run_id], references: [id])

  city_id     String
  primary_source_type String // official_website | overpass | ign | gemini | gpx | manual
  source_refs Json // TrailSourceRef[]
  raw_payload Json?

  title       String
  slug        String?
  description String?
  difficulty  String? // easy | medium | hard | expert | unknown
  distance_km Float?
  elevation_gain_m Int?
  estimated_duration_min Int?
  loop_type String? // loop | out_and_back | point_to_point | unknown
  activity_type String @default("hiking") // hiking | trail | walk | bike
  data_quality_status String @default("draft") // draft | complete | incomplete

  start_label String?
  start_latitude Float?
  start_longitude Float?
  geometry_geojson Json?
  metric_source String? // official_website | ign | gpx | computed_geometry | manual
  geometry_status String @default("missing") // missing | valid | invalid | needs_review
  elevation_status String @default("missing") // missing | valid | failed | needs_review
  parking_info String?
  kids_friendly Boolean?
  pets_friendly Boolean?
  best_season String[] @default([])

  duplicate_poi_ids String[] @default([])
  review_status String @default("needs_review") // needs_review | published | merged | rejected
  published_poi_id String?
  trail_detail_id String?

  reviewed_by String?
  reviewed_at DateTime?
  admin_note  String?
}

model TrailDetail {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  poi_id      String   @unique
  poi         PointOfInterest @relation(fields: [poi_id], references: [id])

  difficulty  String
  distance_km Float?
  elevation_gain_m Int?
  estimated_duration_min Int?
  loop_type String?
  activity_type String @default("hiking")
  data_quality_status String @default("complete") // complete | incomplete

  start_label String?
  start_latitude Float
  start_longitude Float
  geometry_geojson Json?

  primary_source_type String
  source_refs Json // TrailSourceRef[]
  metric_source String?
  parking_info String?
  kids_friendly Boolean?
  pets_friendly Boolean?
  best_season String[] @default([])
  gpx_url String?

  is_active Boolean @default(true)
}

model TrailAuditLog {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  admin_id    String
  action      String // import_started | candidate_published | candidate_merged | candidate_rejected | trail_updated
  target_type String // TrailImportRun | TrailCandidate | TrailDetail
  target_id   String
  before      Json?
  after       Json?
}
```

Notes :

- `TrailDetail` est le modèle canonique des nouvelles randonnées.
- Aucune migration destructrice de `HikingDetail` n'est réalisée dans cette spec ; `HikingDetail` reste lu en fallback d'affichage.
- Les champs `String` de statut pourront devenir des enums Prisma si le plan d'implémentation le juge stable.
- `source_refs` est un tableau JSON d'objets `{ type, name, url, attribution, used_for }`. `used_for` peut contenir `content`, `geometry`, `elevation`, `description`, `manual_review`.
- `TrailDetail` reprend les champs touristiques utiles de `HikingDetail` (`parking_info`, `kids_friendly`, `pets_friendly`, `best_season`, `gpx_url`) afin de devenir le modèle canonique sans régression d'affichage.

---

## API Contract

```yaml
paths:
  /api/admin/trails/import-runs:
    get:
      summary: "Lister les runs d'acquisition randonnée"
      tags: [admin-trails]
      responses:
        "200":
          description: Liste des runs
    post:
      summary: "Créer un run d'acquisition randonnée"
      tags: [admin-trails]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [city_id, source_types]
              properties:
                city_id:
                  type: string
                source_types:
                  type: array
                  items:
                    type: string
                    enum: [official_website, overpass, ign, gemini, gpx, manual]
                source_url:
                  type: string
                  nullable: true
                zone_radius_km:
                  type: number
                  nullable: true
      responses:
        "201":
          description: Run créé
        "400":
          $ref: "#/components/responses/ValidationError"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/trails/import-runs/{id}:
    get:
      summary: "Consulter un run et ses candidats"
      tags: [admin-trails]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Run avec candidats
        "404":
          $ref: "#/components/responses/NotFound"

  /api/admin/trails/candidates/{id}/publish:
    post:
      summary: "Publier une randonnée candidate"
      tags: [admin-trails]
      requestBody:
        required: false
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/TrailPublishRequest"
      responses:
        "200":
          description: POI et TrailDetail créés ou liés
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/TrailReviewResponse"
        "400":
          $ref: "#/components/responses/ValidationError"
        "409":
          description: Doublon ou données géographiques insuffisantes

  /api/admin/trails/candidates/{id}/merge:
    post:
      summary: "Fusionner un candidat avec une randonnée existante"
      tags: [admin-trails]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [poi_id]
              properties:
                poi_id:
                  type: string
      responses:
        "200":
          description: Candidat fusionné
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/TrailReviewResponse"

  /api/admin/trails/candidates/{id}/reject:
    post:
      summary: "Rejeter une randonnée candidate"
      tags: [admin-trails]
      requestBody:
        required: false
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/TrailRejectRequest"
      responses:
        "200":
          description: Candidat rejeté
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/TrailReviewResponse"

  /api/admin/trails/manual:
    post:
      summary: "Créer un candidat randonnée manuel"
      tags: [admin-trails]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/TrailManualCandidateCreate"
      responses:
        "201":
          description: Candidat manuel créé
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/TrailCandidateResponse"

  /api/cities/{slug}/trails:
    get:
      summary: "Lister les randonnées publiées d'une ville"
      tags: [public-trails]
      responses:
        "200":
          description: Liste des randonnées publiées

  /api/cities/{slug}/trails/{trail-slug}:
    get:
      summary: "Consulter une randonnée publiée"
      tags: [public-trails]
      responses:
        "200":
          description: Détail randonnée publié
        "404":
          $ref: "#/components/responses/NotFound"

components:
  schemas:
    TrailSourceRef:
      type: object
      required: [type, attribution, used_for]
      properties:
        type:
          type: string
          enum: [official_website, overpass, ign, gemini, gpx, manual]
        name:
          type: string
          nullable: true
        url:
          type: string
          nullable: true
        attribution:
          type: string
        used_for:
          type: array
          items:
            type: string
            enum: [content, geometry, elevation, description, manual_review, photos]
    TrailPhoto:
      type: object
      required: [url, source_url, attribution]
      properties:
        url:
          type: string
          format: uri
        source_url:
          type: string
          format: uri
        attribution:
          type: string
        caption:
          type: string
        license:
          type: string
    TrailCandidate:
      type: object
      required: [id, city_id, title, primary_source_type, source_refs, geometry_status, elevation_status, review_status, photos]
      properties:
        photos:
          type: array
          items:
            $ref: "#/components/schemas/TrailPhoto"
        id:
          type: string
        city_id:
          type: string
        title:
          type: string
        description:
          type: string
          nullable: true
        difficulty:
          type: string
          nullable: true
          enum: [easy, medium, hard, expert, unknown]
        primary_source_type:
          type: string
          enum: [official_website, overpass, ign, gemini, gpx, manual]
        source_refs:
          type: array
          items:
            $ref: "#/components/schemas/TrailSourceRef"
        start_label:
          type: string
          nullable: true
        start_latitude:
          type: number
          nullable: true
        start_longitude:
          type: number
          nullable: true
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
          enum: [draft, complete, incomplete]
        geometry_status:
          type: string
          enum: [missing, valid, invalid, needs_review]
        elevation_status:
          type: string
          enum: [missing, valid, failed, needs_review]
        review_status:
          type: string
          enum: [needs_review, published, merged, rejected]
    TrailDetail:
      type: object
      required: [id, poi_id, difficulty, start_latitude, start_longitude, primary_source_type, source_refs, data_quality_status]
      properties:
        id:
          type: string
        poi_id:
          type: string
        difficulty:
          type: string
          enum: [easy, medium, hard, expert, unknown]
        distance_km:
          type: number
          nullable: true
        elevation_gain_m:
          type: integer
          nullable: true
        estimated_duration_min:
          type: integer
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
        gpx_xml:
          type: string
          nullable: true
        data_quality_status:
          type: string
          enum: [complete, incomplete]
        primary_source_type:
          type: string
        source_refs:
          type: array
          items:
            $ref: "#/components/schemas/TrailSourceRef"
    TrailManualCandidateCreate:
      type: object
      required: [city_id, title, difficulty, start_latitude, start_longitude]
      properties:
        city_id:
          type: string
        title:
          type: string
        description:
          type: string
          nullable: true
        difficulty:
          type: string
          enum: [easy, medium, hard, expert, unknown]
        start_label:
          type: string
          nullable: true
        start_latitude:
          type: number
        start_longitude:
          type: number
        source_refs:
          type: array
          items:
            $ref: "#/components/schemas/TrailSourceRef"
        geometry_geojson:
          type: object
          nullable: true
    TrailPublishRequest:
      type: object
      properties:
        confirm_duplicate:
          type: boolean
        confirm_incomplete_geometry:
          type: boolean
    TrailRejectRequest:
      type: object
      properties:
        admin_note:
          type: string
          nullable: true
    TrailCandidateResponse:
      type: object
      required: [data]
      properties:
        data:
          $ref: "#/components/schemas/TrailCandidate"
    TrailReviewResponse:
      type: object
      required: [data]
      properties:
        data:
          $ref: "#/components/schemas/TrailCandidate"
  responses:
    ValidationError:
      description: Erreur de validation
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: object
                required: [code, message, details]
    Forbidden:
      description: Rôle insuffisant
    NotFound:
      description: Ressource introuvable
```

---

## UI Behaviour

### `/admin/trails`

- Le lancement informe que l’import peut prendre quelques minutes et les erreurs réseau sont affichées. Les runs interrompus montrent une erreur et peuvent être relancés via le formulaire existant.
- Liste des runs récents : ville, sources, statut, nombre de candidats, erreurs éventuelles.
- Formulaire de lancement : City, rayon, sources activées, URL officielle optionnelle.
- Les sources proposées sont : site officiel, Overpass, IGN, Gemini descriptif, GPX, manuel.
- L'UI affiche la source principale et les références de sources (`source_refs`) pour chaque candidat.
- L'UI rappelle que Gemini ne fournit aucune donnée géographique fiable.

### `/admin/trails/runs/{id}`

- Tableau de candidats avec : titre, source principale, références de sources, statut géométrie, statut altimétrie, difficulté, distance, qualité de donnée, doublons, statut de review.
- Actions : ouvrir, corriger, publier, fusionner, rejeter.
- Les candidats incomplets sont visuellement distingués et ne sont publiables qu'avec confirmation explicite.

### `/admin/trails/new`

- Formulaire de création manuelle : titre, ville, point de départ avec coordonnées, difficulté, distance, dénivelé, durée, sources, attribution, géométrie optionnelle.
- Collage GeoJSON ou GPX XML accepté pour la saisie manuelle. Le GPX est converti en GeoJSON côté serveur avant stockage.
- Sauvegarde en candidat `needs_review` par défaut.

### Guide public

- Les randonnées publiées apparaissent dans la catégorie `Rando`.
- La fiche détail affiche le bloc randonnée si `TrailDetail` existe.
- Si `TrailDetail` est absent mais `HikingDetail` existe, l'affichage hérité de `004-poi-detail` reste utilisé en fallback.
- Les informations de source et attribution sont visibles ou accessibles.
- Le tracé n'est affiché que si `geometry_geojson` est valide.
- Les routes `/api/cities/{slug}/trails` et `/api/cities/{slug}/trails/{trail-slug}` sont des endpoints spécialisés ; le Guide public continue aussi de fonctionner via les routes catégorie/POI existantes.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Création d'un run randonnée | contract |
| AC-01-02 | Source web officielle vers candidats | integration |
| AC-01-03 | Overpass relations/chemins nommés vers candidats normalisés | integration |
| AC-01-04 | Gemini limité à découverte/descriptif | unit |
| AC-01-05 | Run partiel conserve erreurs par source | integration |
| AC-01-06 | Checkpoints avant et pendant enrichissement, protection des éditions | integration |
| AC-01-07 | Budget temporel et échec explicite avec résultats conservés | integration |
| AC-01-08 | Clôture des imports interrompus à la consultation admin | integration |
| AC-02-01 | Géométrie GeoJSON stockée côté serveur | unit |
| AC-02-02 | Dénivelé via source fiable | unit |
| AC-02-03 | Publication bloquée sans géométrie fiable | contract |
| AC-02-04 | Métriques Gemini rejetées | unit |
| AC-02-05 | Métriques source officielle tracées | unit |
| AC-02-06 | Galeries acquises sans plafond arbitraire avec provenance | unit |
| AC-02-07 | Photos multi-sources préservées et copiées à la publication | integration |
| AC-02-08 | Galerie et crédits visibles en revue admin | integration |
| AC-03-01 | UI admin liste statuts candidats | e2e |
| AC-03-02 | Publication crée POI + TrailDetail | integration |
| AC-03-03 | Fusion sans nouveau POI | integration |
| AC-03-04 | Rejet sans publication | integration |
| AC-03-05 | Audit log des actions admin | integration |
| AC-04-01 | Candidat manuel validé Zod | contract |
| AC-04-02 | GeoJSON / GPX manuel attachable | unit |
| AC-04-03 | Manuel incomplet reste en review | integration |
| AC-04-04 | Manuel publié avec source manuelle multi-référencée | integration |
| AC-05-01 | Liste Rando affiche trails publiés | integration |
| AC-05-02 | Fiche détail affiche TrailDetail | integration |
| AC-05-03 | Tracé affiché si géométrie valide | e2e |
| AC-05-04 | Trails rejetés/inactifs masqués | integration |
| AC-06-01 | Source et attribution conservées | integration |
| AC-06-02 | Attribution visible ou accessible | e2e |
| AC-06-03 | Pas d'appel frontend vers Overpass / IGN | unit |
| AC-06-04 | Cache ou rate limiting sources externes | unit |

---

### Révision 2026-10-08 (runs « partiels », durées manquantes)

- **BR-R1**: Durée : Naismith est calculé d'abord pour tous les candidats ayant une distance (local,
  instantané), puis ORS l'affine sur les tracés ; ORS n'est plus appelé après un refus de quota (429).
  Un échec ORS n'est compté que si aucune durée n'a pu être calculée.
- **BR-R2**: Ordre des enrichissements : IGN (dénivelé), durée, descriptions Gemini, puis géocodage du
  départ. Les descriptions (120 à 300 mots, spec 093) ont leur propre délai de 120 s, 8 en parallèle ;
  budget de travail 270 s sur les 300 s de la route.
- **BR-R3**: Les descriptions Camptocamp sont ramenées à du Markdown standard (balises `[img=…]`,
  liens wiki `[[…|…]]`, BBCode, titres « ##Titre » sans espace).
- Un candidat sans tracé ni distance (certains itinéraires Camptocamp, propositions Gemini) reste sans
  durée : aucune métrique n'est inventée (ADR-006).
- **BR-R4** (audit sur run réel, Les Contamines, 2026-10-08) : l'étape descriptions ne traite que les
  candidats sans description (un candidat déjà décrit n'est plus réécrit pour son seul lieu de départ),
  tracés d'abord, 12 en parallèle ; dénivelé IGN : 60 s. Mesure avant / après sur 35 tracés OSM :
  descriptions 0 → 32, dénivelé 31 → 35, run 190 s.
- **AC-02-09** (PO 2026-10-08 : « les POI rando n'ont majoritairement pas de photos ») : étape
  « photos » après la durée, pour les candidats sans photo — itinéraire Camptocamp : photos de ses lieux
  associés (3 au plus) ; autre source : lieu Camptocamp de même nom (identique, ou inclus avec au moins
  deux mots) à 10 km au plus du départ ; 8 photos au plus, créditées (CC-BY-SA, page source). Mesuré sur
  run réel : 3 → 21 randonnées sur 34 (prototype), Camptocamp 17 → 32 sur 38. La récupération du
  30/09 (galeries d'offices de tourisme, Geotrek) était une opération ponctuelle, effacée par la
  réinitialisation de la base du 06/10 ; elle n'est pas reconduite (droits des galeries non vérifiés).
- **BR-R5**: Overpass : seule une requête invalide (400) est définitive ; toute autre erreur fait essayer
  le serveur suivant. Échec de tous les serveurs : « OpenStreetMap indisponible … relancez plus tard ».

## Out of Scope

- Scraping AllTrails ou copie de bases propriétaires non autorisées.
- Navigation GPS temps réel.
- Conditions de sentier en temps réel.
- Avis utilisateurs, photos utilisateurs et signalements communautaires.
- Favoris tourist connectés ou offline mobile.
- Réservation d'activité ou guide de montagne.
- Calcul d'itinéraire dynamique entre la position du Tourist et le tracé.
- Création d'un moteur cartographique complet hors règles `005-map`.
- Import massif sans validation admin.
- Modification de la taxonomie `Rando`, couverte par `017-admin-taxonomy`.

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | Les sites web officiels ou locaux peuvent-ils être utilisés comme source d'acquisition randonnée ? | Product Owner | 2026-05-25 | Résolu : oui, pour récupérer le maximum d'informations, avec source et attribution conservées. |
| OQ-02 | Overpass + IGN + saisie admin manuelle sont-ils inclus dans le premier périmètre de `019` ? | Product Owner | 2026-05-25 | Résolu : oui. |
| OQ-03 | Gemini peut-il fournir distance, dénivelé, coordonnées ou tracé ? | Architecture | 2026-05-25 | Résolu : non, interdit par ADR-006. |
| OQ-04 | Une randonnée doit-elle rester affichable comme POI public ? | Architecture | 2026-05-25 | Résolu : oui, via `PointOfInterest` + extension `TrailDetail`. |
