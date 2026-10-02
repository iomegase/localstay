# Spec — 055 Facilibus Transport

## Metadata

```yaml
id: 055-facilibus-transport
title: "Se déplacer : navettes Facilibus en temps réel et transports de la ville"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-02
updated_at: 2026-10-02
depends_on:
  - 012-guide-customization
  - 045-public-demo-private-guide-reference
  - 054-private-guide-stay-redesign
bounded_context: guide-app
implementation_gate: "Décisions du Product Owner du 2026-10-02 : autorisation d'usage des données Facilibus/Pysae obtenue (A) ; écran « Se déplacer » du handoff, carte navette → page horaires, prochains départs sur la page Séjour à la place de la ligne « Se déplacer » quand le logement est localisé (B) ; démo avec données réelles ; cartes transports éditables par ville."
```

## Context

Le handoff « Le 305 » prévoit un écran « Se déplacer » (exclu de la spec 054).
Le réseau de navettes gratuites **Facilibus** relie Saint-Gervais-les-Bains et
Saint-Nicolas-de-Véroce. Ses données sont publiées par le fournisseur technique
**Pysae** (vérifiées le 2026-10-02, sans authentification) :

| Endpoint (`https://api.pysae.com/api/v4/groups/saint-gervais`) | Contrat observé |
|---|---|
| `/gtfs/pub` | archive GTFS zip (agency, routes, stops, trips, stop_times, calendar, calendar_dates, shapes), fuseau `Europe/Paris` |
| `/stop-times?stop_id=…` | JSON, **journée de service en cours uniquement** (paramètre de date ignoré) ; `departure_ts` / `estimated_departure_ts` / `recorded_departure_ts` en secondes Unix ; `current_status: "PASSED"` ; `start_date` `YYYYMMDD` ; contient `device_id` (jamais exposé) |
| `/gtfs-rt/trip-update?format=plaintext` | JSON GTFS-RT (malgré `plaintext`), `header.timestamp` en secondes |
| `/gtfs-rt/vehicle-position?format=plaintext` | JSON GTFS-RT, `vehicle.timestamp` en secondes, `currentStatus`, `stopId` ; contient `licensePlate` (jamais exposé) |

Limites constatées : calendrier publié jusqu'au 2026-12-18 ; `eta` et
`estimated_stop` non documentés (non exploités) ; estimations observées égales
à l'horaire théorique ; aucune licence publiée (autorisation obtenue par le PO).

## Glossary References

- **Lodging**, **Guide**, **Tourist**, **City** (glossary.md).
- **Réseau** : offre de transport (Facilibus). **Fournisseur** : source technique (Pysae).
- **Station physique** : lieu d'arrêt regroupant un ou plusieurs **quais** GTFS.

## User Stories

### US-01 — Voir les prochaines navettes depuis la page Séjour

#### Acceptance Criteria

- **AC-01-01**: Given un logement aux coordonnées précises (adresse géocodée,
  spec 012) dont une station Facilibus est à moins de 800 m à vol d'oiseau,
  When la page Séjour s'affiche, Then une carte « Prochaines navettes » remplace
  la ligne « Se déplacer » : nom de la station, « N m à vol d'oiseau », jusqu'à
  3 prochains départs (ligne, direction, heure Europe/Paris) et le lien « Tous
  les transports ».
- **AC-01-02**: Given un logement sans coordonnées précises, hors périmètre ou
  sans données exploitables, When la page Séjour s'affiche, Then la ligne
  « Se déplacer » est affichée (si la ville a des transports) et aucune donnée
  n'est inventée.

### US-02 — Consulter les horaires Facilibus

- **AC-02-01**: Given l'écran « Se déplacer » d'une ville desservie, When on
  touche « Navette gratuite », Then la page Facilibus présente la station la
  plus proche (si le logement est localisé), jusqu'à 2 alternatives à moins de
  800 m, et un choix parmi toutes les stations. Une légende rappelle chaque
  ligne (pastille aux couleurs GTFS + nom officiel, ex. « Télécabines / Le
  Châtelet ↔ Saint Nicolas de Véroce ») — ajout PO du 2026-10-02.
- **AC-02-02**: Given une station, When ses départs sont demandés, Then
  `GET /api/transport/facilibus/departures?stationId=…` agrège tous ses quais
  et retourne au plus 5 passages sur 24 h, toutes directions confondues, triés
  par horaire exploitable, chacun avec sa ligne, sa direction et son quai.
- **AC-02-03**: Given un passage enregistré comme effectué (`PASSED` ou heure
  réelle de départ), annulé ou non desservi, When les départs sont calculés,
  Then il est exclu, même si son horaire théorique est futur.
- **AC-02-04**: Given une estimation fraîche (≤ 90 s) différente de l'horaire
  théorique, When le passage s'affiche, Then les deux heures sont distinguées
  et le retard (« +2 min ») ou l'avance (« −1 min ») est indiqué ; le badge
  « Temps réel » n'apparaît que pour une estimation fraîche.
- **AC-02-05**: Given une navette dont la position date de moins de 2 min et
  dont la course correspond au passage (course + date de service), When le
  passage s'affiche, Then « Navette en circulation » est indiqué ; aucune durée
  d'arrivée n'est calculée à partir d'une distance.

### US-03 — Transports de la ville

- **AC-03-01**: Given l'écran « Se déplacer », When il s'affiche, Then il liste
  la carte « Navette gratuite » (villes desservies par Facilibus) puis les
  cartes saisies par l'admin pour la ville (titre, étiquette, texte).
- **AC-03-02**: Given l'admin, When il édite les transports d'une ville, Then il
  peut ajouter, modifier, réordonner et supprimer (soft delete) des cartes
  (titre 1–80, étiquette ≤ 24, texte 1–400, 12 cartes max).

### US-04 — API et robustesse

- **AC-04-01**: `GET /api/transport/facilibus/nearby?lat&lng` valide les
  coordonnées, retourne jusqu'à 3 stations à moins de 800 m (distance au quai le
  plus proche) et l'état `outside_coverage` sinon.
- **AC-04-02**: Toute réponse transport suit l'enveloppe
  `{ status, data, meta: { fetchedAt, sourceUpdatedAt, freshness, coverage } }`
  avec `status ∈ available | no_departures | outside_coverage | stale | unavailable`.
- **AC-04-03**: Une panne du flux véhicules ou des estimations n'empêche pas
  l'affichage des horaires théoriques ; une panne des horaires renvoie
  `unavailable` (jamais un tableau vide présenté comme « aucun passage »).
- **AC-04-04**: Les réponses ne contiennent jamais `licensePlate`, `device_id`
  ni objet brut Pysae ; l'identifiant véhicule est opaque.

### US-05 — Démo

- **AC-05-01**: Given la démo publique, When elle s'ouvre, Then la page Séjour
  affiche la ligne « Se déplacer » sans aucun appel réseau ; l'écran « Se
  déplacer » utilise des cartes de démonstration statiques ; la page Facilibus,
  ouverte par le visiteur, appelle uniquement `/api/transport/facilibus/*`
  (ressource publique autorisée, amende 045 AC-02-04 / BR-07).

## Business Rules

- **BR-01**: Distances uniquement à vol d'oiseau (Haversine) ; jamais de temps
  de marche ni de durée avant arrivée calculée.
- **BR-02**: Quais regroupés seulement via `parent_station` / `location_type` ;
  jamais par nom ni par suffixe `_R`.
- **BR-03**: Horaires calculés par date de service GTFS (midi − 12 h, Europe/Paris),
  horaires > 24 h et changements d'heure gérés ; les horaires d'un jour ne sont
  jamais réutilisés pour un autre.
- **BR-04**: Tous les appels Pysae passent par le serveur, sur une base URL fixe.
- **BR-05**: Les coordonnées d'un logement ne sont jamais exposées par un
  nouvel endpoint ; seul le client du guide privé les transmet à `nearby`.
- **BR-06**: Soft delete des cartes transports.

## Data Model

```prisma
model CityTransportCard {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?
  city_id    String
  city       City      @relation(fields: [city_id], references: [id])
  title      String
  tag        String?
  body       String
  sort_order Int       @default(0)

  @@index([city_id, deleted_at])
}
```

`GuideLodging` expose `locationPrecise` (coordonnées géocodées, pas le centre-ville).

## API Contract

```yaml
/api/transport/facilibus/nearby:
  get: { params: [lat, lng], responses: { 200: TransportEnvelope<NearbyStations>, 400: VALIDATION_ERROR } }
/api/transport/facilibus/stops:
  get: { responses: { 200: TransportEnvelope<Station[]> } }
/api/transport/facilibus/departures:
  get: { params: [stationId, limit (1–10, défaut 5)], responses: { 200: TransportEnvelope<Departure[]>, 400, 404 } }
/api/transport/facilibus/vehicles:
  get: { responses: { 200: TransportEnvelope<Vehicle[]> } }
/api/admin/cities/{slug}/transport-cards:
  get: { responses: { 200, 401, 403, 404 } }
  put: { body: { cards: [{ id?, title, tag, body }] }, responses: { 200, 400, 401, 403, 404 } }
```

Cache : arrêts / GTFS 1 h, passages 30 s, véhicules 15 s (mémoire par instance,
requêtes mutualisées) + `Cache-Control: s-maxage` partagé côté CDN. Polling
client 30 s, suspendu onglet masqué, recul exponentiel après erreur.

## UI Behaviour

Tokens et écrans secondaires de la spec 054. Carte « Prochaines navettes » :
pastille de ligne aux couleurs GTFS, heure en gras, direction, badge
« Temps réel » / retard. Page Facilibus : sélecteur de station, liste
chronologique, état vide « Aucun départ dans les prochaines 24 h » (ou
« Horaires disponibles jusqu'au … » si couverture partielle), état panne
« Horaires momentanément indisponibles ».

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01, AC-01-02 | integration |
| AC-02-01 | integration |
| AC-02-02, AC-02-03, AC-02-04, AC-02-05 | unit + contract |
| AC-03-01 | integration |
| AC-03-02 | contract |
| AC-04-01 … AC-04-04 | unit + contract |
| AC-05-01 | integration |

## Out of Scope

- Itinéraires piétons, temps de marche, carte interactive des navettes.
- Autres réseaux (SNCF, tramway du Mont-Blanc) en temps réel.
- Géocodage automatique des logements sans adresse.

## Open Questions

Aucune.
