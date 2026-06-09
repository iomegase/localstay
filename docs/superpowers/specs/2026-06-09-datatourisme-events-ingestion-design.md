# Design — Ingestion des événements DATAtourisme (manifestations Haute‑Savoie)

Date : 2026-06-09
Statut : design validé (en attente relecture spec avant plan d'implémentation)
Périmètre : **pipeline data uniquement** (récupération + stockage + rafraîchissement). Pas d'affichage public dans cette itération.

## 1. Objectif

Récupérer les **fêtes et manifestations** (tous types : culturel, sportif, marchés/foires, fêtes traditionnelles) publiées sur **DATAtourisme** pour les communes de **Haute‑Savoie (74)**, les stocker en base, et les **maintenir à jour automatiquement** (cron quotidien). Ajouter un **champ de recherche admin** permettant de récupérer à la demande les événements de **n'importe quelle commune du 74**.

Communes cibles initiales : Chamonix‑Mont‑Blanc (INSEE 74056), Saint‑Gervais‑les‑Bains (74236), Les Contamines‑Montjoie (74085).

## 2. Source de données : DATAtourisme (flux)

DATAtourisme ne propose pas d'API REST temps réel par commune. Le mécanisme officiel de réutilisation est le **flux** :

1. Compte DATAtourisme → « application » (donne une **clé API**).
2. Définition d'un **flux** filtré côté serveur : **territoire = Haute‑Savoie (74)**, **type = Fête et manifestation**.
3. DATAtourisme régénère une **archive ZIP** (JSON‑LD, un objet par fichier + `index.json`) à une URL webservice stable, **rafraîchie ~quotidiennement**.
4. URL de téléchargement : `https://diffuseur.datatourisme.fr/webservice/<FLUX_ID>/<API_KEY>`.

Approche retenue : **Approche A — flux dédié au département 74** (léger, ciblé, cadence quotidienne native). Rejeté : dump national data.gouv.fr (volumineux, fragile).

### Prérequis manuels (hors code)

1. Créer le compte + l'application + le flux DATAtourisme (territoire 74, type Fête et manifestation) → récupérer l'URL webservice.
2. Configurer la variable d'environnement `DATATOURISME_FLUX_URL`.
3. Renseigner `insee_code` sur les 3 villes cibles (fait via migration + seed, voir §4).

## 3. Architecture & flux de données

```
Vercel Cron (quotidien ~05:00)
   │  POST /api/internal/ingest-events   (Bearer INTERNAL_API_SECRET)
   ▼
ingest-runner (service)
   1. download flux ZIP          ← datatourisme-client (DATATOURISME_FLUX_URL)
   2. unzip (fflate) → index.json → objets JSON-LD
   3. map chaque objet           ← datatourisme-mapper (fonction pure)
   4. ignore les events déjà terminés (end_date < aujourd'hui)
   5. détermine les communes cibles (cron: ensemble rafraîchi ; admin: commune filtrée)
   6. résout la City par INSEE (city_id null si absente) ; upsert Event sur (source, source_id)
   7. DELETE des Event terminés (end_date < aujourd'hui)
   8. renvoie un résumé { fetched, matched, upserted, skipped, deleted }

Admin recherche commune
   │  POST /api/admin/events/fetch  (getSessionAdmin)  body { commune }
   ▼  ingest-runner({ communeFilter })
```

**Ensemble rafraîchi par le cron** = communes déjà présentes dans la table `Event` (distinct `commune_insee`) ∪ communes ayant une `City.insee_code` renseignée. Conséquence : les 3 villes sont toujours rafraîchies, et toute commune cherchée une fois via l'admin reste à jour automatiquement.

### Organisation des fichiers (calquée sur `poi-acquisition` / `trails-acquisition`)

```
src/features/events-acquisition/
  types.ts                       # ParsedEvent + types du domaine
  lib/datatourisme-client.ts     # download + unzip flux → objets JSON-LD bruts
  lib/datatourisme-mapper.ts     # 1 objet JSON-LD → ParsedEvent (pur)
  lib/event-types.ts             # @type DATAtourisme → event_types normalisés
  lib/commune.ts                 # normalisation nom commune (casse/accents) + match
  services/ingest-runner.ts      # orchestration + upsert + suppression des périmés
  queries/events.ts             # lectures (liste admin)
src/app/api/internal/ingest-events/route.ts    # POST, Bearer (cron)
src/app/api/admin/events/route.ts              # GET liste (getSessionAdmin)
src/app/api/admin/events/fetch/route.ts        # POST fetch commune (getSessionAdmin)
src/app/admin/events/page.tsx                  # page admin
src/features/events-acquisition/components/AdminEventsLauncher.tsx
```

## 4. Modèle de données (Prisma)

### `City` — ajout d'un champ

```prisma
insee_code  String?  @unique   // 74056 Chamonix, 74236 St-Gervais, 74085 Les Contamines
```

Migration + mise à jour `prisma/seed.ts` pour poser l'INSEE des 3 villes (création de Chamonix et Les Contamines si absentes).

### Nouveau modèle `Event`

```prisma
model Event {
  id                String    @id @default(uuid())
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt
  deleted_at        DateTime? // soft-hide admin éventuel (les périmés sont hard-deleted, pas soft)

  source            String    @default("datatourisme")
  source_id         String    // dc:identifier stable de l'objet DATAtourisme
  source_updated_at DateTime? // lastUpdate côté source

  city_id           String?   // lié seulement si une City a cet INSEE
  city              City?     @relation(fields: [city_id], references: [id])
  commune_insee     String    // toujours présent (depuis le flux)
  commune_name      String

  title             String
  description       String?
  event_types       String[]  // normalisés: cultural | sport | market | festival | social | other

  start_date        DateTime  // min des occurrences
  end_date          DateTime  // max des occurrences
  is_recurring      Boolean   @default(false)
  periods           Json?     // toutes les occurrences (pour UI future)

  venue_name        String?
  address           String?
  postal_code       String?
  latitude          Float?
  longitude         Float?

  images            String[]
  website           String?
  phone             String?
  email             String?
  price_info        String?

  raw_payload       Json?     // JSON-LD brut (debug / champs futurs)
  is_active         Boolean   @default(true)

  @@unique([source, source_id])
  @@index([commune_insee, end_date])
  @@index([city_id, start_date])
  @@index([end_date])
}
```

Ajout côté `City` : `events Event[]`.

Décisions clés :
- **Upsert idempotent** sur `(source, source_id)`.
- **City optionnelle** : événement rattaché à une `City` quand l'INSEE correspond, sinon `city_id` null + `commune_insee`/`commune_name` portés par l'événement.
- **Rétention = suppression définitive** : un événement dont `end_date` est antérieure à aujourd'hui est supprimé (hard DELETE) ; un objet déjà terminé n'est jamais ingéré. La base ne contient que des événements à venir ou en cours.

## 5. Mapping JSON‑LD → `ParsedEvent`

Fonction pure `mapDatatourismeObject(obj) -> ParsedEvent | null` (null si non mappable / déjà terminé).

| Champ Event        | Source JSON‑LD (à confirmer sur échantillon réel) |
|--------------------|----------------------------------------------------|
| source_id          | `dc:identifier` / `@id` |
| source_updated_at  | `lastUpdate` |
| title              | `rdfs:label` (langue `fr`) |
| description        | `hasDescription` → `dc:description` / `shortDescription` (fr) |
| event_types        | `@type` (mappés via `event-types.ts`) |
| start_date/end_date/periods/is_recurring | `takesPlaceAt` (1..n périodes → min start, max end, liste) |
| venue_name         | `isLocatedAt` → `schema:name` |
| address/postal_code| `isLocatedAt` → `schema:address` (`streetAddress`, `postalCode`) |
| commune_insee      | `isLocatedAt` → `schema:address` → `hasAddressCity` → INSEE |
| commune_name       | `isLocatedAt` → `schema:address` → `addressLocality` / `hasAddressCity` label |
| latitude/longitude | `isLocatedAt` → `schema:geo` (`latitude`, `longitude`) |
| images             | `hasMainRepresentation` → `ebucore:hasRelatedResource` → `ebucore:locator` |
| website/phone/email| `hasContact` |
| price_info         | `hasBookingContact` / `offers` (selon disponibilité) |
| raw_payload        | objet complet |

> **1ʳᵉ tâche d'implémentation** : capturer un échantillon réel du flux (ou un exemple JSON‑LD DATAtourisme représentatif) et figer les chemins exacts ci‑dessus via des fixtures de test. Le mapper doit être tolérant aux champs manquants.

Normalisation des types (`event-types.ts`) : les sous‑types DATAtourisme (`CulturalEvent`, `SportsCompetition`, `SaleEvent`, `SocialEvent`, `LocalAnimation`, …) sont réduits à un vocabulaire interne stable : `cultural | sport | market | festival | social | other`.

## 6. Orchestrateur `ingest-runner`

Signature : `runEventIngestion({ communeFilter?, source }) -> RunSummary`.

- `communeFilter` (string INSEE ou nom de commune, normalisé) : présent pour la recherche admin, absent pour le cron.
- Étapes : download → unzip → map → filtrage temporel (ignore terminés) → sélection communes cibles → upsert → DELETE des périmés → résumé.
- Sélection des communes cibles :
  - admin : la commune filtrée uniquement (match sur INSEE exact ou nom normalisé) ;
  - cron : `distinct Event.commune_insee` ∪ `City.insee_code` renseignés.
- Résumé `RunSummary` : `{ fetched, matched, upserted, skipped, deleted }`.

## 7. Déclencheurs (routes)

- **Cron** `POST /api/internal/ingest-events` : auth `Bearer INTERNAL_API_SECRET` (modèle identique à `geocode-pois`). Corps optionnel `{ dry_run?: boolean }`. Appelle le runner sans `communeFilter`. Ajout dans `vercel.json` : `{ "path": "/api/internal/ingest-events", "schedule": "0 5 * * *" }`.
- **Admin fetch** `POST /api/admin/events/fetch` : `getSessionAdmin`, corps `{ commune: string }` (nom ou INSEE), validation Zod, appelle le runner avec `communeFilter`, renvoie le résumé.
- **Admin liste** `GET /api/admin/events` : `getSessionAdmin`, liste paginée des événements ingérés (filtrables par commune).

## 8. UI admin

`src/app/admin/events/page.tsx` + `AdminEventsLauncher` :
- Champ de recherche **commune** (nom ou INSEE) + bouton « Fetcher » → `POST /api/admin/events/fetch`, affichage du résumé du run.
- Tableau des événements ingérés : titre, commune, dates (début/fin), types, source. Données via `GET /api/admin/events`.

Conforme au pattern existant (`AdminAcquisitionLauncher`, `AdminTrailsLauncher` montés dans `src/app/admin/<feature>/page.tsx`).

## 9. Configuration

- `DATATOURISME_FLUX_URL` : URL webservice du flux (contient FLUX_ID + clé API).
- `INTERNAL_API_SECRET` : déjà utilisé par les autres routes internes.

## 10. Stratégie de test (TDD, jest existant)

- **Unit** `datatourisme-mapper` : fixtures JSON‑LD (événement simple ; récurrent multi‑périodes ; champs manquants ; déjà terminé → null).
- **Unit** `event-types` : mapping des `@type` vers le vocabulaire interne.
- **Unit** `commune` : normalisation/matching nom (accents, casse) et INSEE.
- **Unit** `datatourisme-client` : dézippage d'un ZIP fixture + lecture `index.json`.
- **Integration** `ingest-runner` (DB de test) : idempotence de l'upsert, filtre par commune, liaison `City` par INSEE, `city_id` null si commune sans City, suppression des périmés, exclusion des terminés à l'ingestion.
- **Contract** routes : `/api/internal/ingest-events` 401 sans Bearer / 200 avec ; `/api/admin/events/fetch` auth admin + validation du corps.

## 11. Dépendances

- `fflate` (dézippage pur‑JS, léger, compatible serverless Vercel).

## 12. Hors périmètre (itérations futures)

- Affichage public des événements dans le guide de ville.
- Revue/validation admin des événements (auto‑publication ici).
- Sources complémentaires (Apidae direct, OpenAgenda).
- Communes hors Haute‑Savoie.
