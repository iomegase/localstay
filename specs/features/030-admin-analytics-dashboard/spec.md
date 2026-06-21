# Spec — 030 Admin Analytics Dashboard

## Metadata

```yaml
id: 030-admin-analytics-dashboard
title: "Cockpit admin analytics SEO/GEO"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-06-19
updated_at: 2026-06-21
depends_on:
  - 001-city-guide
  - 011-qr-code-owner
  - 016-dashboard-superadmin
  - 024-contact-messages
  - 028-lodging-showcase-seo
bounded_context: admin
implementation_gate: "Code generation allowed only while status stays approved"
```

---

## Context

StayLocal dispose déjà de pages publiques orientées acquisition locale, d'événements métier internes (`qr_scan`) et de premiers CTA utiles à la mesure (`contact`, email direct, réservation externe). En revanche, l'équipe ne dispose pas encore d'un cockpit unique pour comprendre à la fois :

- la visibilité SEO dans Google ;
- les signaux GEO utiles aux expériences de recherche générative ;
- l'engagement des visiteurs sur les pages publiques ;
- les micro-conversions business déjà disponibles avant l'arrivée des abonnements Stripe.

Le besoin n'est pas de remplacer les outils natifs Google ou Vercel, mais d'agréger leurs métriques indispensables dans l'espace admin StayLocal, avec un historique stable et une lecture orientée décision produit.

Cette spec introduit :

1. une page admin additive `/admin/analytics` ;
2. des snapshots journaliers consolidés comme source de vérité du cockpit ;
3. un bloc `live` séparé pour le trafic récent ;
4. une mesure consent-gated des interactions client tierces ;
5. un mécanisme de synchronisation et d'état des sources ;
6. une segmentation par `City` uniquement quand l'URL publique est rattachable de façon déterministe.

Le dashboard `/admin` actuel reste régi par `016-dashboard-superadmin` et n'est pas remplacé par cette spec.

---

## Glossary References

- **Admin** : membre de l'équipe StayLocal avec accès à `/admin/*`.
- **City** : ville ou commune référencée dans StayLocal.
- **Guide** : ensemble des contenus publics affichés pour une City.
- **Analytics** : événements append-only déjà utilisés dans l'application pour certaines statistiques métier.
- **Analytics Snapshot** : agrégat journalier normalisé servant de source de vérité au cockpit admin analytics.
- **Analytics Source Sync** : trace d'une synchronisation de source analytics externe ou interne.
- **Analytics Interaction Event** : événement first-party capturant une interaction publique mesurable côté produit.
- **Google Analytics 4 (GA4)** : source de mesure d'engagement et d'événements côté site, activée uniquement après consentement.
- **Google Search Console** : source de métriques d'acquisition SEO depuis Google Search.
- **Vercel Analytics** : source de trafic, visiteurs, pages vues et dimensions web récentes.
- **Vercel Speed Insights** : source de métriques de performance basées sur les Core Web Vitals.
- **Consent Banner** : composant public demandant le consentement analytics avant toute mesure tierce côté client.
- **Contact Message** : message de contact public créé depuis `/contact` ou une fiche logement.
- **GEO** : optimisation pour les expériences de recherche générative.
- **Soft Delete** : suppression logique via `deleted_at`.

---

## User Stories

### US-01 — Accéder à un cockpit analytics dédié

**As an** Admin  
**I want to** accéder à une page `/admin/analytics` distincte du cockpit MVP 2  
**So that** je consulte les métriques SEO/GEO sans perturber la vue admin existante

#### Acceptance Criteria

- **AC-01-01**: Given un utilisateur `role = admin` authentifié, When il ouvre `/admin/analytics`, Then il accède au cockpit analytics.
- **AC-01-02**: Given un utilisateur non authentifié, Owner ou Merchant, When il tente d'accéder à `/admin/analytics` ou `/api/admin/analytics/*`, Then l'accès est refusé ou redirigé selon les règles d'auth existantes.
- **AC-01-03**: Given la navigation admin desktop, When elle s'affiche, Then elle contient une entrée additive `Analytics SEO/GEO` sans retirer les entrées prévues par `016-dashboard-superadmin`.
- **AC-01-04**: Given le cockpit analytics se charge, When les sources sont évaluées, Then une barre d'état affiche pour chaque source son état (`connected`, `not_configured`, `stale`, `failed`) et sa dernière synchronisation réussie si disponible.

### US-02 — Consulter un overview consolidé acquisition + engagement + conversion

**As an** Admin  
**I want to** voir dans un seul écran les KPI consolidés essentiels  
**So that** je détecte rapidement ce qui progresse ou se dégrade sur le SEO/GEO et l'engagement

#### Acceptance Criteria

- **AC-02-01**: Given des snapshots journaliers disponibles, When l'Admin charge `/admin/analytics`, Then il voit un bloc KPI acquisition avec `impressions SEO`, `clics SEO`, `CTR SEO`, `position moyenne` et `landing pages actives`.
- **AC-02-02**: Given des snapshots journaliers disponibles, When l'Admin charge `/admin/analytics`, Then il voit un bloc KPI engagement/conversion avec `sessions`, `users`, `page_views`, `engagement_rate`, `contact_leads`, `lodging_contact_clicks`, `external_booking_clicks` et `qr_scans`.
- **AC-02-03**: Given des métriques récentes Vercel sont disponibles, When l'overview s'affiche, Then un bloc `live` séparé affiche le trafic récent sans fusionner ces chiffres avec les KPI consolidés journaliers.
- **AC-02-04**: Given une source a échoué lors de la dernière synchro mais qu'un snapshot valide plus ancien existe, When l'overview s'affiche, Then le cockpit affiche le dernier snapshot valide avec un indicateur `stale` au lieu de masquer tout le dashboard.
- **AC-02-05**: Given une source n'est pas configurée, When l'overview s'affiche, Then le cockpit reste utilisable et le bloc concerné affiche explicitement un état de configuration manquante plutôt qu'une fausse valeur `0`.
- **AC-02-06**: Given des métriques GA4 du jour sont lisibles côté serveur, When l'Admin charge `/admin/analytics`, Then il voit un bloc `GA4 aujourd'hui` séparé avec `sessions`, `users`, `page_views` et `engagement_rate`, sans fusion avec les KPI consolidés journaliers ni avec le bloc `live` Vercel.

### US-03 — Analyser les pages, requêtes, villes et performances

**As an** Admin  
**I want to** explorer les pages, requêtes, villes et métriques de performance  
**So that** je sache quelles routes publiques, quelles recherches et quelles villes contribuent le plus au trafic et aux conversions

#### Acceptance Criteria

- **AC-03-01**: Given la section Pages, When l'Admin filtre par période et éventuellement par `city_id`, Then la table retourne les pages publiques avec `page_path`, `page_type`, `city`, `sessions`, `clics SEO` et `conversions`.
- **AC-03-02**: Given la section Requêtes, When l'Admin filtre par période et éventuellement par `city_id`, Then la table retourne les requêtes Search Console avec `query`, `clicks`, `impressions`, `ctr` et `avg_position`.
- **AC-03-03**: Given la section Villes, When l'Admin consulte le cockpit, Then les métriques par ville n'incluent que les pages dont l'URL est rattachable de façon déterministe à `City.slug`.
- **AC-03-04**: Given une page publique n'est pas rattachable à une City, When ses métriques sont consolidées, Then elles restent visibles au niveau global avec `city_id = null` et n'apparaissent pas dans les agrégats ville.
- **AC-03-05**: Given des métriques de performance sont disponibles, When la section Performance s'affiche, Then l'Admin voit un résumé `Core Web Vitals` et les routes/pages les plus dégradées ; sinon le bloc affiche un état `not_configured` ou `no_data` sans faire échouer la page.

### US-04 — Mesurer les interactions publiques avec consentement explicite

**As a** Product Owner  
**I want to** mesurer les interactions publiques utiles à l'acquisition sans activer le tracking tiers avant consentement  
**So that** StayLocal reste exploitable pour le SEO/GEO tout en respectant la décision de consentement produit

#### Acceptance Criteria

- **AC-04-01**: Given un visiteur sur une page publique et aucun choix de consentement enregistré, When la page se charge, Then une `Consent Banner` analytics s'affiche.
- **AC-04-02**: Given le visiteur accepte le consentement analytics, When le choix est enregistré, Then l'état `accepted` est persisté et GA4 peut être chargé côté client sur les pages publiques.
- **AC-04-03**: Given le visiteur refuse le consentement analytics, When le choix est enregistré, Then l'état `refused` est persisté et GA4 ne se charge pas côté client.
- **AC-04-04**: Given le consentement vaut `accepted`, When le visiteur déclenche `owner_email_click`, `mystay_email_click`, `lodging_contact_click` ou `lodging_external_booking_click`, Then l'interaction est envoyée à GA4 et enregistrée comme `AnalyticsInteractionEvent` first-party.
- **AC-04-05**: Given le consentement vaut `unset` ou `refused`, When le visiteur déclenche ces interactions publiques, Then aucun événement analytics côté client n'est envoyé à GA4 ni à l'endpoint public de tracking.
- **AC-04-06**: Given un `ContactMessage` public valide est créé ou qu'un `qr_scan` serveur est enregistré, When les snapshots journaliers sont consolidés, Then ces conversions apparaissent dans le cockpit même sans dépendre d'un événement client tiers.

### US-05 — Synchroniser et fiabiliser les données analytics

**As an** Admin  
**I want to** que le cockpit utilise des snapshots et un état de synchro explicite  
**So that** je distingue facilement une baisse réelle d'une panne d'alimentation des données

#### Acceptance Criteria

- **AC-05-01**: Given le job de synchro quotidien s'exécute, When il importe GA4, Search Console, Vercel Analytics et Vercel Speed Insights, Then il crée ou met à jour les snapshots journaliers normalisés et une trace `AnalyticsSourceSync` par source.
- **AC-05-02**: Given une source échoue pendant la synchro, When la trace est enregistrée, Then le statut de cette source passe à `failed` ou `partial`, l'erreur est conservée et les autres sources peuvent rester exploitables.
- **AC-05-03**: Given la synchro traite des URLs publiques, When elle consolide les métriques, Then le mapping ville utilise uniquement les patterns de routes approuvés : `/guide/[city-slug]`, `/guide/[city-slug]/contact`, `/guide/[city-slug]/logements/[lodging-slug]`.
- **AC-05-04**: Given l'endpoint interne de synchro est appelé avec un secret invalide ou absent, When la requête arrive, Then l'API refuse l'exécution.
- **AC-05-05**: Given le bloc `live` n'a pas de chemin de récupération supporté pour Vercel sur l'environnement courant, When le cockpit s'affiche, Then le bloc `live` se dégrade proprement en état de configuration ou indisponibilité sans casser le reste du dashboard.
- **AC-05-06**: Given un chemin de lecture serveur supporté est disponible pour Vercel sur le projet courant, When le bloc `live` est chargé, Then il retourne les métriques récentes Vercel (`visitors`, `page_views`, top pages, top referrers) sans les fusionner avec les snapshots consolidés ni avec le bloc `GA4 aujourd'hui`.

---

## Business Rules

- **BR-01**: Le cockpit analytics est additif. Il ne remplace ni ne modifie implicitement le contrat métier de `016-dashboard-superadmin`.
- **BR-02**: Les routes `/api/admin/analytics/*` sont accessibles uniquement à `User.role = admin`, `is_active = true`, `deleted_at = null`.
- **BR-03**: Le dashboard principal lit les `Analytics Snapshot` internes. Il ne lit pas GA4 ni Search Console directement au rendu de la page.
- **BR-04**: Le bloc `live` est séparé visuellement et sémantiquement des snapshots consolidés. Les chiffres récents ne doivent jamais être fusionnés dans les KPI journaliers.
- **BR-05**: Le consentement côté client peut prendre uniquement les valeurs `unset`, `accepted`, `refused`.
- **BR-06**: Aucune librairie ou requête tierce GA4 ne doit être chargée côté client tant que le consentement n'est pas `accepted`.
- **BR-07**: L'endpoint public d'enregistrement des interactions (`AnalyticsInteractionEvent`) refuse tout événement quand le consentement transmis n'est pas `accepted`.
- **BR-08**: Les interactions publiques mesurées en V1 sont limitées à `owner_email_click`, `mystay_email_click`, `lodging_contact_click`, `lodging_external_booking_click`.
- **BR-09**: `contact_form_submit` n'est pas compté via un événement client. Les leads contact sont dérivés des `ContactMessage` créés côté serveur.
- **BR-10**: `qr_scans` sont dérivés du modèle `Analytics` existant avec `event_type = qr_scan`, conformément aux specs owner/admin déjà approuvées.
- **BR-11**: Les métriques par ville existent uniquement si la route publique est rattachable de façon déterministe à `City.slug`.
- **BR-12**: Une route non rattachable à une City reste visible au niveau global, avec `city_id = null`.
- **BR-13**: Les snapshots journaliers ne doivent pas créer de doublons pour une même date, une même source logique et un même niveau d'agrégation.
- **BR-14**: Chaque exécution de synchro source conserve un statut, une période, un horodatage de succès/échec et un message d'erreur exploitable en admin si besoin.
- **BR-15**: Si une source analytics externe n'est pas configurée, le cockpit affiche `not_configured` ; il ne remplace jamais cette absence par un `0` silencieux.
- **BR-16**: Si une source analytics externe échoue mais qu'un snapshot antérieur valide existe, le cockpit expose ce snapshot et marque le bloc `stale`.
- **BR-17**: Les sources externes utilisées en V1 sont `ga4`, `gsc`, `vercel_analytics`, `vercel_speed_insights`.
- **BR-18**: Le job de synchro quotidien est centralisé via `vercel.json` et appelle une route interne protégée par secret. Aucun cron implicite ne doit être défini ailleurs.
- **BR-19**: Les erreurs API suivent le format standard du projet : `{ "error": { "code": "...", "message": "...", "details": {} } }`.
- **BR-20**: Les filtres admin exposés par cette spec sont validés avec Zod avant toute lecture de données.
- **BR-21**: Les données de performance et de trafic recent Vercel ne bloquent pas l'overview global si leur accès n'est pas disponible ; seule leur section passe en état dégradé.
- **BR-22**: Les futures métriques d'abonnement Stripe, de conversion payante ou de revenus sont hors scope. Cette spec ne doit pas inventer de KPI monétaires avant leur spec dédiée.
- **BR-23**: Cette spec n'autorise aucun export public ni aucune exposition des credentials analytics au navigateur.
- **BR-24**: Le bloc `GA4 aujourd'hui` est un direct-read intraday côté serveur. Il n'écrit pas dans les modèles `Analytics*Snapshot` en V1.
- **BR-25**: Le bloc `GA4 aujourd'hui` est distinct du bloc `live` Vercel. Les deux ne doivent jamais être fusionnés dans une même carte ou un même total.
- **BR-26**: `Google Search Console` reste une source différée SEO et ne participe pas au feedback intraday produit.
- **BR-27**: Le bloc `live` Vercel ne peut utiliser qu'un chemin de lecture serveur supporté. Le scraping HTML du dashboard Vercel et les API privées non documentées sont interdits.

---

## Data Model

```prisma
enum AnalyticsSourceKind {
  ga4
  gsc
  vercel_analytics
  vercel_speed_insights
}

enum AnalyticsSourceSyncStatus {
  success
  partial
  failed
  stale
  not_configured
}

enum AnalyticsInteractionEventType {
  owner_email_click
  mystay_email_click
  lodging_contact_click
  lodging_external_booking_click
}

enum AnalyticsConsentState {
  accepted
  refused
}

model AnalyticsSourceSync {
  id              String                    @id @default(uuid())
  created_at      DateTime                  @default(now())
  updated_at      DateTime                  @updatedAt
  deleted_at      DateTime?

  source          AnalyticsSourceKind
  status          AnalyticsSourceSyncStatus
  period_start    DateTime?
  period_end      DateTime?
  started_at      DateTime?
  finished_at     DateTime?
  last_success_at DateTime?
  error_code      String?
  error_message   String?
  details_json    Json?

  @@index([source, created_at])
  @@index([status, created_at])
}

model AnalyticsDailySnapshot {
  id                     String   @id @default(uuid())
  created_at             DateTime @default(now())
  updated_at             DateTime @updatedAt
  deleted_at             DateTime?

  snapshot_date          DateTime
  sessions               Int      @default(0)
  users                  Int      @default(0)
  page_views             Int      @default(0)
  engagement_rate        Float?
  seo_impressions        Int      @default(0)
  seo_clicks             Int      @default(0)
  seo_ctr                Float?
  seo_avg_position       Float?
  active_landing_pages   Int      @default(0)
  contact_leads          Int      @default(0)
  lodging_contact_clicks Int      @default(0)
  external_booking_clicks Int     @default(0)
  owner_email_clicks     Int      @default(0)
  mystay_email_clicks    Int      @default(0)
  qr_scans               Int      @default(0)

  @@unique([snapshot_date])
  @@index([snapshot_date])
}

model AnalyticsPageDailySnapshot {
  id                     String   @id @default(uuid())
  created_at             DateTime @default(now())
  updated_at             DateTime @updatedAt
  deleted_at             DateTime?

  snapshot_date          DateTime
  page_path              String
  page_type              String
  city_id                String?
  city                   City?    @relation(fields: [city_id], references: [id])
  sessions               Int      @default(0)
  users                  Int      @default(0)
  page_views             Int      @default(0)
  engagement_rate        Float?
  seo_impressions        Int      @default(0)
  seo_clicks             Int      @default(0)
  seo_ctr                Float?
  seo_avg_position       Float?
  contact_leads          Int      @default(0)
  conversions            Int      @default(0)

  @@unique([snapshot_date, page_path])
  @@index([snapshot_date, city_id])
}

model AnalyticsQueryDailySnapshot {
  id              String   @id @default(uuid())
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  deleted_at      DateTime?

  snapshot_date   DateTime
  query           String
  page_path       String?
  city_id         String?
  city            City?    @relation(fields: [city_id], references: [id])
  clicks          Int      @default(0)
  impressions     Int      @default(0)
  ctr             Float?
  avg_position    Float?

  @@unique([snapshot_date, query, page_path])
  @@index([snapshot_date, city_id])
}

model AnalyticsCityDailySnapshot {
  id                     String   @id @default(uuid())
  created_at             DateTime @default(now())
  updated_at             DateTime @updatedAt
  deleted_at             DateTime?

  snapshot_date          DateTime
  city_id                String
  city                   City     @relation(fields: [city_id], references: [id])
  sessions               Int      @default(0)
  users                  Int      @default(0)
  page_views             Int      @default(0)
  seo_impressions        Int      @default(0)
  seo_clicks             Int      @default(0)
  seo_ctr                Float?
  seo_avg_position       Float?
  contact_leads          Int      @default(0)
  lodging_contact_clicks Int      @default(0)
  external_booking_clicks Int     @default(0)
  qr_scans               Int      @default(0)

  @@unique([snapshot_date, city_id])
  @@index([city_id, snapshot_date])
}

model AnalyticsPerfDailySnapshot {
  id                        String   @id @default(uuid())
  created_at                DateTime @default(now())
  updated_at                DateTime @updatedAt
  deleted_at                DateTime?

  snapshot_date             DateTime
  page_path                 String?
  city_id                   String?
  city                      City?    @relation(fields: [city_id], references: [id])
  core_web_vitals_pass_rate Float?
  lcp                       Float?
  inp                       Float?
  cls                       Float?

  @@unique([snapshot_date, page_path])
  @@index([snapshot_date, city_id])
}

model AnalyticsInteractionEvent {
  id              String                       @id @default(uuid())
  created_at      DateTime                     @default(now())
  updated_at      DateTime                     @updatedAt
  deleted_at      DateTime?

  event_type      AnalyticsInteractionEventType
  consent_state   AnalyticsConsentState
  page_path       String
  city_id         String?
  city            City?                        @relation(fields: [city_id], references: [id])
  lodging_id      String?
  lodging         Lodging?                     @relation(fields: [lodging_id], references: [id])

  @@index([event_type, created_at])
  @@index([city_id, created_at])
  @@index([lodging_id, created_at])
}
```

### Data Notes

- `AnalyticsInteractionEvent` est append-only ; aucune suppression physique n'est autorisée.
- Les `Analytics*Snapshot` servent uniquement au reporting consolidé admin.
- Les blocs intraday (`GA4 aujourd'hui`, `live` Vercel) sont lus à la demande et ne modifient pas les snapshots consolidés en V1.
- Les credentials analytics restent dans les variables d'environnement ou la configuration Vercel ; ils ne sont pas stockés dans ces modèles.

---

## API Contract

```yaml
openapi: 3.1.0
info:
  title: Admin Analytics Dashboard
  version: 1.0.0
paths:
  /api/admin/analytics/overview:
    get:
      summary: "Overview consolidé du cockpit analytics admin"
      tags: [admin-analytics]
      security:
        - bearerAuth: []
      parameters:
        - name: date_from
          in: query
          required: false
          schema: { type: string, format: date }
        - name: date_to
          in: query
          required: false
          schema: { type: string, format: date }
      responses:
        "200":
          description: Overview consolidé
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AdminAnalyticsOverview"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/analytics/live:
    get:
      summary: "Bloc trafic récent séparé"
      tags: [admin-analytics]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Trafic récent ou état dégradé
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AdminAnalyticsLiveBlock"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/analytics/ga4-today:
    get:
      summary: "Bloc intraday GA4 du jour"
      tags: [admin-analytics]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Métriques GA4 du jour ou état dégradé
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AdminAnalyticsGa4TodayBlock"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/analytics/pages:
    get:
      summary: "Analyse pages publiques"
      tags: [admin-analytics]
      security:
        - bearerAuth: []
      parameters:
        - name: date_from
          in: query
          required: false
          schema: { type: string, format: date }
        - name: date_to
          in: query
          required: false
          schema: { type: string, format: date }
        - name: city_id
          in: query
          required: false
          schema: { type: string, format: uuid }
        - name: limit
          in: query
          required: false
          schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
      responses:
        "200":
          description: Lignes pages
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/AdminAnalyticsPageRow"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/analytics/queries:
    get:
      summary: "Analyse Search Console par requête"
      tags: [admin-analytics]
      security:
        - bearerAuth: []
      parameters:
        - name: date_from
          in: query
          required: false
          schema: { type: string, format: date }
        - name: date_to
          in: query
          required: false
          schema: { type: string, format: date }
        - name: city_id
          in: query
          required: false
          schema: { type: string, format: uuid }
        - name: limit
          in: query
          required: false
          schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
      responses:
        "200":
          description: Lignes requêtes
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/AdminAnalyticsQueryRow"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/analytics/cities:
    get:
      summary: "Analyse par ville"
      tags: [admin-analytics]
      security:
        - bearerAuth: []
      parameters:
        - name: date_from
          in: query
          required: false
          schema: { type: string, format: date }
        - name: date_to
          in: query
          required: false
          schema: { type: string, format: date }
      responses:
        "200":
          description: Lignes ville
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/AdminAnalyticsCityRow"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/analytics/performance:
    get:
      summary: "Performance et Core Web Vitals"
      tags: [admin-analytics]
      security:
        - bearerAuth: []
      parameters:
        - name: date_from
          in: query
          required: false
          schema: { type: string, format: date }
        - name: date_to
          in: query
          required: false
          schema: { type: string, format: date }
        - name: city_id
          in: query
          required: false
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Bloc performance
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AdminAnalyticsPerformanceBlock"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/analytics/sources:
    get:
      summary: "Etat des sources et des synchros"
      tags: [admin-analytics]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Statut des sources
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/AdminAnalyticsSourceStatus"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/public/analytics/events:
    post:
      summary: "Enregistrer une interaction publique consentie"
      tags: [admin-analytics-public]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [event_type, consent_state, page_path]
              additionalProperties: false
              properties:
                event_type:
                  type: string
                  enum: [owner_email_click, mystay_email_click, lodging_contact_click, lodging_external_booking_click]
                consent_state:
                  type: string
                  enum: [accepted]
                page_path:
                  type: string
                  minLength: 1
                  maxLength: 500
                city_slug:
                  type: string
                  nullable: true
                lodging_id:
                  type: string
                  format: uuid
                  nullable: true
      responses:
        "201":
          description: Evénement enregistré
          content:
            application/json:
              schema:
                type: object
                required: [id, status]
                properties:
                  id: { type: string, format: uuid }
                  status: { type: string, enum: [recorded] }
        "400":
          $ref: "#/components/responses/ValidationError"

  /api/internal/analytics/sync:
    post:
      summary: "Déclencher une synchro consolidée analytics"
      tags: [admin-analytics-internal]
      security:
        - internalSyncSecret: []
      requestBody:
        required: false
        content:
          application/json:
            schema:
              type: object
              additionalProperties: false
              properties:
                source:
                  type: string
                  enum: [ga4, gsc, vercel_analytics, vercel_speed_insights, all]
      responses:
        "200":
          description: Synchro exécutée
          content:
            application/json:
              schema:
                type: object
                required: [status, synced_sources]
                properties:
                  status: { type: string, enum: [ok, partial] }
                  synced_sources:
                    type: array
                    items: { type: string }
        "401":
          description: Secret manquant ou invalide
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

components:
  schemas:
    AdminAnalyticsOverview:
      type: object
      required: [period, acquisition_kpis, engagement_kpis, freshness]
      properties:
        period:
          type: object
          required: [date_from, date_to]
          properties:
            date_from: { type: string, format: date }
            date_to: { type: string, format: date }
        acquisition_kpis:
          type: object
          required: [seo_impressions, seo_clicks, seo_ctr, seo_avg_position, active_landing_pages]
          properties:
            seo_impressions: { type: integer }
            seo_clicks: { type: integer }
            seo_ctr: { type: number, nullable: true }
            seo_avg_position: { type: number, nullable: true }
            active_landing_pages: { type: integer }
        engagement_kpis:
          type: object
          required: [sessions, users, page_views, engagement_rate, contact_leads, lodging_contact_clicks, external_booking_clicks, qr_scans]
          properties:
            sessions: { type: integer }
            users: { type: integer }
            page_views: { type: integer }
            engagement_rate: { type: number, nullable: true }
            contact_leads: { type: integer }
            lodging_contact_clicks: { type: integer }
            external_booking_clicks: { type: integer }
            qr_scans: { type: integer }
        freshness:
          type: array
          items:
            $ref: "#/components/schemas/AdminAnalyticsSourceStatus"

    AdminAnalyticsLiveBlock:
      type: object
      required: [status]
      properties:
        status:
          type: string
          enum: [connected, not_configured, failed, stale, no_data]
        window_label:
          type: string
          nullable: true
        visitors:
          type: integer
          nullable: true
        page_views:
          type: integer
          nullable: true
        top_pages:
          type: array
          items:
            type: object
            required: [page_path, page_views]
            properties:
              page_path: { type: string }
              page_views: { type: integer }
        top_referrers:
          type: array
          items:
            type: object
            required: [referrer, visitors]
            properties:
              referrer: { type: string }
              visitors: { type: integer }

    AdminAnalyticsGa4TodayBlock:
      type: object
      required: [status]
      properties:
        status:
          type: string
          enum: [connected, not_configured, failed, stale, no_data]
        window_label:
          type: string
          nullable: true
        sessions:
          type: integer
          nullable: true
        users:
          type: integer
          nullable: true
        page_views:
          type: integer
          nullable: true
        engagement_rate:
          type: number
          nullable: true

    AdminAnalyticsPageRow:
      type: object
      required: [page_path, page_type, sessions, seo_clicks, conversions]
      properties:
        page_path: { type: string }
        page_type: { type: string }
        city_id: { type: string, format: uuid, nullable: true }
        city_name: { type: string, nullable: true }
        sessions: { type: integer }
        seo_clicks: { type: integer }
        conversions: { type: integer }

    AdminAnalyticsQueryRow:
      type: object
      required: [query, clicks, impressions]
      properties:
        query: { type: string }
        page_path: { type: string, nullable: true }
        city_id: { type: string, format: uuid, nullable: true }
        city_name: { type: string, nullable: true }
        clicks: { type: integer }
        impressions: { type: integer }
        ctr: { type: number, nullable: true }
        avg_position: { type: number, nullable: true }

    AdminAnalyticsCityRow:
      type: object
      required: [city_id, city_name, sessions, seo_clicks, conversions]
      properties:
        city_id: { type: string, format: uuid }
        city_name: { type: string }
        sessions: { type: integer }
        seo_clicks: { type: integer }
        conversions: { type: integer }
        top_page_path: { type: string, nullable: true }

    AdminAnalyticsPerformanceBlock:
      type: object
      required: [status, rows]
      properties:
        status:
          type: string
          enum: [connected, not_configured, failed, stale, no_data]
        rows:
          type: array
          items:
            type: object
            required: [page_path]
            properties:
              page_path: { type: string }
              city_id: { type: string, format: uuid, nullable: true }
              city_name: { type: string, nullable: true }
              core_web_vitals_pass_rate: { type: number, nullable: true }
              lcp: { type: number, nullable: true }
              inp: { type: number, nullable: true }
              cls: { type: number, nullable: true }

    AdminAnalyticsSourceStatus:
      type: object
      required: [source, status]
      properties:
        source:
          type: string
          enum: [ga4, gsc, vercel_analytics, vercel_speed_insights]
        status:
          type: string
          enum: [connected, not_configured, failed, stale, partial]
        last_success_at:
          type: string
          format: date-time
          nullable: true
        error_code:
          type: string
          nullable: true
        error_message:
          type: string
          nullable: true

    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code: { type: string }
            message: { type: string }
            details: { type: object, nullable: true }

  responses:
    Unauthorized:
      description: Non authentifié
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Forbidden:
      description: Rôle insuffisant
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    ValidationError:
      description: Paramètres invalides
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
```

---

## UI Behaviour

### Layout admin

- La navigation admin existante reste intacte et gagne un lien additif `Analytics SEO/GEO`.
- La route principale de cette spec est `/admin/analytics`.
- La page est desktop-first, cohérente avec `016-dashboard-superadmin`, tout en restant consultable sur mobile.

### Page `/admin/analytics`

- **Loading state**: skeletons pour la barre d'état sources, les cartes KPI, le bloc `GA4 aujourd'hui`, le bloc `live`, et les tableaux.
- **Empty state**: si aucune source n'est configurée et qu'aucun snapshot n'existe, la page affiche un état `Aucune source analytics configurée` avec la liste des variables attendues ou une consigne de configuration.
- **Partial state**: si certaines sources sont configurées et d'autres non, chaque bloc expose son propre état ; la page ne masque pas les blocs exploitables.
- **Error state**: si une route admin analytics retourne une erreur structurée, la section concernée affiche un composant d'alerte lisible sans stack trace brute.
- **Success state**: la page affiche :
  - une barre d'état des sources ;
  - une rangée KPI acquisition ;
  - une rangée KPI engagement/conversion ;
  - un bloc `GA4 aujourd'hui` séparé ;
  - un bloc `live` séparé ;
  - une table Pages ;
  - une table Requêtes ;
  - une table Villes ;
  - un bloc Performance.
- **Mobile behaviour**: les cartes KPI s'empilent, les blocs `GA4 aujourd'hui` et `live` restent séparés visuellement, et les tableaux sont scrollables horizontalement dans leur conteneur.

### Consent Banner publique

- S'affiche uniquement sur les routes publiques concernées tant qu'aucun choix n'a été persisté.
- Actions disponibles : `Accepter` et `Refuser`.
- Une fois un choix persisté, la bannière ne se réaffiche plus à chaque navigation tant que le choix n'est pas effacé.
- Le choix `accepted` permet le chargement client du tracking GA4.
- Le choix `refused` conserve le site pleinement utilisable sans charger GA4.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Admin authentifié accède à `/admin/analytics` | integration |
| AC-01-02 | Non-admin refusé sur `/admin/analytics` et `/api/admin/analytics/*` | contract |
| AC-01-03 | Navigation admin contient l'entrée additive `Analytics SEO/GEO` | integration |
| AC-01-04 | Barre d'état sources expose statut + dernière synchro | contract |
| AC-02-01 | Overview affiche les KPI acquisition consolidés | contract |
| AC-02-02 | Overview affiche les KPI engagement/conversion consolidés | contract |
| AC-02-03 | Bloc `live` séparé des snapshots consolidés | integration |
| AC-02-04 | Dernier snapshot valide conservé en cas de source stale/failed | unit |
| AC-02-05 | Source non configurée affichée explicitement sans faux zéro | integration |
| AC-02-06 | Bloc `GA4 aujourd'hui` séparé des snapshots et du live Vercel | integration |
| AC-03-01 | Table Pages filtrable par période et ville | contract |
| AC-03-02 | Table Requêtes issue de Search Console | contract |
| AC-03-03 | Agrégats Villes limités aux URLs déterministes | unit |
| AC-03-04 | URLs non rattachables conservées au niveau global uniquement | unit |
| AC-03-05 | Bloc Performance supporte données ou état dégradé | integration |
| AC-04-01 | Bannière consentement affichée quand état unset | integration |
| AC-04-02 | Acceptation persiste et autorise le chargement GA4 | integration |
| AC-04-03 | Refus persiste et interdit le chargement GA4 | integration |
| AC-04-04 | Interactions publiques consenties créent un `AnalyticsInteractionEvent` et déclenchent le tracking GA4 | contract |
| AC-04-05 | Sans consentement accepté, aucun événement client analytics n'est envoyé | unit |
| AC-04-06 | `ContactMessage` et `qr_scan` alimentent les conversions des snapshots | integration |
| AC-05-01 | Job de synchro crée snapshots + traces source | integration |
| AC-05-02 | Echec partiel d'une source ne bloque pas les autres | unit |
| AC-05-03 | Mapping ville limité aux patterns approuvés | unit |
| AC-05-04 | Endpoint interne de synchro refuse secret invalide | contract |
| AC-05-05 | Bloc `live` se dégrade proprement si Vercel n'est pas exploitable | integration |
| AC-05-06 | Bloc `live` Vercel lit un flux récent supporté quand disponible | integration |

---

## Out of Scope

- Revenus, MRR, ARR, Stripe, Checkout, Customer Portal, webhooks de paiement.
- Attribution publicitaire, campagnes Ads, Meta Ads ou tracking UTM avancé multi-canal au-delà des métriques déjà fournies par les sources sélectionnées.
- Export CSV ou PDF du cockpit analytics.
- Interface admin d'édition des credentials analytics.
- Segmentation ville probabiliste, fuzzy matching de contenus, enrichissement manuel de requêtes.
- Modification fonctionnelle du cockpit `/admin` existant hors ajout du lien `Analytics SEO/GEO`.
- A/B testing, experimentation framework, feature flags analytics.

---

## Open Questions

Aucune — spec complète et approuvée pour implémentation.
