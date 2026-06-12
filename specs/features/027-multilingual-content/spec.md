# Spec — 027 Multilingual Content

## Metadata

```yaml
id: 027-multilingual-content
title: "Contenu multilingue évolutif"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-06-12
updated_at: 2026-06-12
depends_on:
  - 001-city-guide
  - 002-categories
  - 003-poi-list
  - 004-poi-detail
  - 012-guide-customization
  - 017-admin-taxonomy
  - 018-poi-acquisition-pipeline
  - 019-trails-acquisition
  - 022-admin-poi-management
  - 025-weather
bounded_context: content
i18n_strategy: nextjs_locale_routing
translation_provider: deepl_api_pro
i18n_source_locale: fr
i18n_target_locales: [en, it, es, nl]
```

---

## Context

StayLocal sert des Tourists internationaux, mais le contenu public évolue en continu : POI validés ou corrigés par l'Admin, descriptions générées depuis des sources vérifiées, événements importés, informations pratiques saisies par les Owners et futurs contenus Merchant.

Une traduction statique page par page ne fonctionne pas pour ce produit. Le besoin est de traduire uniquement les contenus qui ont changé, de savoir quelles traductions sont à jour, et de garantir un fallback public propre quand une traduction n'existe pas encore.

Cette spec introduit une architecture multilingue en deux couches :

1. **i18n applicatif** : routage localisé Next.js, locale courante, cookie de préférence, metadata SEO, formats et libellés d'interface traduits par clés versionnées dans le code.
2. **Traduction de contenu vivant** : champs éditoriaux en base traduits champ par champ via DeepL API Pro, avec hash du texte source, statut, jobs asynchrones et revue admin selon la criticité.

Le français reste la source canonique du contenu public. Les traductions sont des versions dérivées, invalidables et régénérables. Cette spec ne change pas les sources métier : Google Places, Mapbox, IGN, Overpass et DATAtourisme restent responsables des données factuelles selon les ADR existantes. Les traductions ne doivent jamais inventer, compléter ou recalculer une donnée.

`i18n` ne désigne pas un prestataire de traduction : c'est l'architecture de localisation du site. DeepL API Pro est le prestataire serveur retenu pour générer les traductions automatiques initiales du contenu vivant. Les intégrations doivent passer par un adaptateur interne afin de pouvoir remplacer le prestataire sans modifier les appels métier.

---

## Glossary References

- **Guide** : ensemble des contenus affichés pour une City.
- **POI** : lieu, établissement, activité ou service référencé dans l'application.
- **City** : ville référencée, périmètre géographique du Guide.
- **Category** : regroupement thématique de POI.
- **SubCategory** : subdivision d'une Category.
- **Lodging** : logement dont l'Owner peut personnaliser le Guide.
- **Owner** : propriétaire ou gestionnaire d'un ou plusieurs Lodgings.
- **Merchant** : professionnel local gérant une fiche POI revendiquée.
- **Admin** : membre StayLocal avec accès Super-admin.
- **Tourist** : utilisateur final sans compte requis pour le Guide public.
- **Locale** : langue d'affichage supportée par StayLocal.
- **Source Content** : texte français canonique utilisé comme base des traductions.
- **Translatable Field** : champ texte explicitement déclaré traduisible.
- **Content Translation** : version traduite d'un Translatable Field pour une Locale cible.
- **Source Hash** : empreinte du Source Content normalisé.
- **Translation Job** : tâche serveur asynchrone de traduction ou retraduction.
- **Soft Delete** : suppression logique via `deleted_at`.

---

## User Stories

### US-01 — Choix de langue public

**As a** Tourist  
**I want to** consulter le guide dans ma langue  
**So that** je comprenne les recommandations locales sans friction

#### Acceptance Criteria

- **AC-01-01**: Given un Tourist sur une route publique, When il choisit `English`, `Italiano`, `Español` ou `Nederlands`, Then la locale est conservée dans un cookie `staylocal_locale` pendant 180 jours et les routes publiques utilisent la locale choisie.
- **AC-01-02**: Given une locale supportée dans l'URL (`/en/guide/[city-slug]`), When la page se charge, Then les UI strings et les champs de contenu traduits disponibles sont affichés dans cette locale.
- **AC-01-03**: Given une locale non supportée dans l'URL, When la route publique est demandée, Then la réponse est une 404 claire et aucun fallback silencieux vers une langue arbitraire n'est effectué.
- **AC-01-04**: Given une traduction manquante ou non publiable pour un champ public, When le Tourist consulte la page, Then le champ utilise le fallback défini par la politique du champ sans casser le rendu.

### US-02 — Traduction incrémentale du contenu vivant

**As an** Admin  
**I want to** traduire uniquement les champs modifiés  
**So that** le contenu reste multilingue sans retraduire tout le site

#### Acceptance Criteria

- **AC-02-01**: Given un champ traduisible en français, When son texte source change, Then le système calcule un nouveau `source_text_hash` et marque les traductions existantes du champ comme `stale`.
- **AC-02-02**: Given un champ traduisible nouveau ou obsolète, When la synchronisation multilingue s'exécute, Then un `TranslationJob` est créé uniquement pour les locales cibles manquantes ou obsolètes.
- **AC-02-03**: Given un POI dont seule la `description` change, When la synchronisation s'exécute, Then seuls les jobs de traduction de `PointOfInterest.description` sont créés ; le nom, l'adresse, les photos et les données géographiques ne sont pas retraduits.
- **AC-02-04**: Given un contenu archivé ou supprimé logiquement, When la synchronisation s'exécute, Then aucun nouveau job de traduction n'est créé pour ce contenu.

### US-03 — Revue et publication des traductions

**As an** Admin  
**I want to** voir les traductions à relire, approuver ou corriger  
**So that** les contenus publics importants gardent une qualité éditoriale maîtrisée

#### Acceptance Criteria

- **AC-03-01**: Given un Admin authentifié, When il ouvre `/admin/translations`, Then il voit les filtres `locale`, `status`, `entity_type`, `city_id`, `field_name`, `publication_policy` et une liste paginée de traductions.
- **AC-03-02**: Given une traduction `needs_review`, When l'Admin modifie le texte puis approuve, Then `status = approved`, `reviewed_by`, `reviewed_at` et un audit log sont enregistrés.
- **AC-03-03**: Given une traduction `auto_translated` sur un champ `review_required`, When la page publique est rendue, Then cette traduction n'est pas utilisée tant qu'elle n'est pas `approved`.
- **AC-03-04**: Given une traduction `auto_translated` sur un champ `auto_publish`, When la page publique est rendue, Then cette traduction peut être affichée sans revue manuelle si son `source_text_hash` correspond au Source Content courant.

### US-04 — Traitement asynchrone fiable

**As an** Admin  
**I want to** traiter les traductions en arrière-plan avec retries  
**So that** l'expérience Tourist reste rapide même quand beaucoup de contenu change

#### Acceptance Criteria

- **AC-04-01**: Given des `TranslationJob` en attente, When le cron interne lance `/api/internal/translations/process`, Then les jobs sont traités par lots avec verrouillage, retries et limite de durée d'exécution.
- **AC-04-02**: Given un appel prestataire échoue temporairement, When le job échoue, Then `attempts` est incrémenté, `last_error` est enregistré et `next_run_at` est repoussé par backoff.
- **AC-04-03**: Given un job dépasse le nombre maximum de tentatives, When il échoue encore, Then son statut devient `failed` et la traduction cible reste absente ou inchangée selon son état précédent.
- **AC-04-04**: Given deux workers lancent le traitement en même temps, When ils sélectionnent des jobs, Then un même job ne peut pas être traité simultanément.
- **AC-04-05**: Given un `TranslationJob` prêt à traiter, When le worker appelle le prestataire, Then l'appel passe par l'adaptateur serveur DeepL avec `source_lang = FR`, `target_lang` correspondant à la locale cible et aucune clé API exposée au client.

### US-05 — SEO multilingue contrôlé

**As a** Tourist international venant de Google  
**I want to** arriver sur une page cohérente dans ma langue  
**So that** le résultat de recherche corresponde au contenu consulté

#### Acceptance Criteria

- **AC-05-01**: Given une page publique traduite avec couverture suffisante, When `generateMetadata` s'exécute, Then la page expose `alternates.languages` pour `fr`, `en`, `it`, `es`, `nl` et une canonical locale correcte.
- **AC-05-02**: Given une page locale dont les champs critiques ne sont pas traduits, When les metadata sont générées, Then la page reste rendue pour l'utilisateur mais reçoit `robots: { index: false, follow: true }`.
- **AC-05-03**: Given une page française source, When les metadata sont générées, Then elle reste la canonical source et conserve le comportement SEO existant.

### US-06 — Séparation données factuelles / traduction

**As a** Product Owner  
**I want to** empêcher les traductions de modifier les faits  
**So that** StayLocal reste fiable et conforme aux ADR existantes

#### Acceptance Criteria

- **AC-06-01**: Given un champ non déclaré traduisible, When la synchronisation multilingue s'exécute, Then ce champ n'est jamais envoyé au prestataire de traduction.
- **AC-06-02**: Given des coordonnées, distances, dénivelés, durées, prix numériques, horaires structurés, URLs, emails, téléphones ou identifiants source, When la synchronisation s'exécute, Then ces valeurs ne sont jamais traduites ni reformulées.
- **AC-06-03**: Given une traduction retournée par le prestataire contient une modification de valeur protégée détectable, When la validation serveur s'exécute, Then la traduction est marquée `failed` ou `needs_review` selon la politique du champ.

---

## Business Rules

- **BR-01**: Le français (`fr`) est la seule locale source canonique pour le contenu public en MVP 2.
- **BR-02**: Les locales cibles initiales sont `en`, `it`, `es`, `nl`, conformément à la trajectoire définie dans `001-city-guide`.
- **BR-03**: Les UI strings stables sont traduites par clés dans le code. Elles ne sont pas stockées dans `ContentTranslation`.
- **BR-04**: Le contenu vivant est traduit champ par champ via `ContentTranslation`.
- **BR-05**: Seuls les champs listés dans `TranslationFieldPolicy` avec `is_active = true` sont traduisibles.
- **BR-06**: Une modification du Source Content invalide uniquement les traductions du même `entity_type`, `entity_id` et `field_name`.
- **BR-07**: Les slugs restent identiques dans toutes les langues en MVP 2. Les routes localisées traduisent le contenu affiché, pas les identifiants d'URL.
- **BR-08**: Les routes françaises existantes restent valides : `/guide/[city-slug]` est la route source. Les routes localisées utilisent un préfixe locale : `/en/guide/[city-slug]`, `/it/guide/[city-slug]`, `/es/guide/[city-slug]`, `/nl/guide/[city-slug]`.
- **BR-09**: `?lang=` n'est pas une URL canonical. Si `?lang=` est reçu sur une route publique, le serveur redirige vers la route préfixée correspondante quand la locale est supportée.
- **BR-10**: Un contenu `deleted_at != null`, `is_active = false` ou non publiable selon sa spec source ne crée pas de nouveau `TranslationJob`.
- **BR-11**: Les traductions ne doivent jamais modifier les coordonnées, distances, dénivelés, durées, horaires structurés, prix numériques, URLs, emails, téléphones, identifiants source, `google_place_id`, GPX, GeoJSON ou attributions.
- **BR-12**: Les noms propres de POI, City, Lodging, Merchant et sources officielles sont conservés par défaut. Ils ne sont traduisibles que si une policy dédiée le permet explicitement.
- **BR-13**: Les données temporaires ou non publiées de Google Places (`google_review_payload`) ne doivent jamais être envoyées au système de traduction.
- **BR-14**: Les champs publics finaux StayLocal peuvent être traduits après validation du pipeline source, mais la traduction ne remplace jamais le Source Content français.
- **BR-15**: Pour une policy `review_required`, seule une traduction `approved` dont le `source_text_hash` est courant peut être affichée publiquement.
- **BR-16**: Pour une policy `auto_publish`, une traduction `auto_translated` ou `approved` dont le `source_text_hash` est courant peut être affichée publiquement.
- **BR-17**: Une traduction `stale` ne peut être affichée que si la policy du champ définit `stale_behavior = show_stale`. Sinon le fallback est `fallback_source` ou `hide_field`.
- **BR-18**: Le fallback public par défaut est `fallback_source` : afficher le texte français canonique si aucune traduction publiable n'existe.
- **BR-19**: Les champs critiques SEO d'une page localisée sont : titre de page, description principale et au moins un contenu principal visible dans la locale cible. Si un champ critique manque, la page localisée est `noindex`.
- **BR-20**: La couverture SEO suffisante pour indexer une page localisée est au moins 80 % des champs traduisibles visibles au-dessus du premier scroll, plus tous les champs critiques.
- **BR-21**: Les jobs de traduction sont asynchrones et ne bloquent jamais le rendu public.
- **BR-22**: Les appels au prestataire de traduction sont faits uniquement côté serveur via un adaptateur interne `translation-provider`.
- **BR-23**: Le prestataire de traduction automatique retenu pour MVP 2 est DeepL API Pro.
- **BR-24**: Les secrets DeepL sont stockés en variables d'environnement serveur (`DEEPL_API_KEY`, `DEEPL_API_BASE_URL`) et jamais exposés au client.
- **BR-25**: Sous l'ADR-006 actuelle, Gemini ne doit pas être utilisé comme moteur de traduction général. Si le Product Owner souhaite utiliser Gemini pour la traduction plus tard, `ADR-006` doit être amendée avant toute implémentation.
- **BR-26**: Tous les crons de traduction doivent être déclarés dans `vercel.json`, jamais uniquement dans une section infrastructure isolée.
- **BR-27**: Toutes les mutations admin de traduction créent un `TranslationAuditLog`.
- **BR-28**: Aucune suppression physique de traduction, job ou audit log n'est autorisée ; utiliser `deleted_at`.
- **BR-29**: Les erreurs API suivent le format standard du projet : `{ "error": { "code": "...", "message": "...", "details": {} } }`.
- **BR-30**: Les contenus saisis par Owner dans `LodgingCustomization` sont traduisibles uniquement pour les champs textuels utiles au Tourist (`welcome_message`, `parking_info`, `equipment_info`, `checkout_instructions`, `trash_info`, `trash_location`, `house_rules`, `emergency_contacts`, `useful_services`). `wifi_ssid`, `wifi_password`, URLs, téléphones et adresses ne sont pas traduits.
- **BR-31**: Les traductions Merchant futures doivent utiliser le même modèle, mais aucun workflow Merchant de revue traduction n'est inclus dans cette spec.

---

## Data Model

Cette spec ajoute un modèle générique de traduction par champ. Les entités source ne reçoivent pas de relation Prisma directe vers `ContentTranslation`, car la cible est polymorphe (`entity_type` + `entity_id`).

```prisma
enum SupportedLocale {
  fr
  en
  it
  es
  nl
}

enum TranslationStatus {
  queued
  auto_translated
  needs_review
  approved
  stale
  rejected
  failed
}

enum TranslationPublicationPolicy {
  review_required
  auto_publish
}

enum TranslationStaleBehavior {
  fallback_source
  show_stale
  hide_field
}

enum TranslationJobStatus {
  queued
  running
  succeeded
  failed
  cancelled
}

model TranslationFieldPolicy {
  id                 String   @id @default(uuid())
  created_at         DateTime @default(now())
  updated_at         DateTime @updatedAt
  deleted_at         DateTime?

  entity_type        String
  field_name         String
  source_locale      SupportedLocale @default(fr)
  publication_policy TranslationPublicationPolicy @default(review_required)
  stale_behavior     TranslationStaleBehavior @default(fallback_source)
  is_active          Boolean @default(true)
  max_chars          Int?
  help_text          String?

  @@unique([entity_type, field_name])
  @@index([entity_type, is_active])
}

model ContentTranslation {
  id                String   @id @default(uuid())
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  deleted_at        DateTime?

  entity_type       String
  entity_id         String
  field_name        String
  source_locale     SupportedLocale @default(fr)
  target_locale     SupportedLocale
  source_text_hash  String
  source_updated_at DateTime

  translated_text   String
  status            TranslationStatus @default(queued)

  provider          String?
  provider_request_id String?
  generated_at      DateTime?

  reviewed_by       String?
  reviewer          User? @relation("ContentTranslationReviewedBy", fields: [reviewed_by], references: [id])
  reviewed_at       DateTime?
  review_note       String?

  error_code        String?
  error_message     String?

  @@unique([entity_type, entity_id, field_name, target_locale])
  @@index([target_locale, status])
  @@index([entity_type, entity_id])
  @@index([source_text_hash])
  @@index([deleted_at])
}

model TranslationJob {
  id                String   @id @default(uuid())
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  deleted_at        DateTime?

  entity_type       String
  entity_id         String
  field_name        String
  source_locale     SupportedLocale @default(fr)
  target_locale     SupportedLocale
  source_text_hash  String

  status            TranslationJobStatus @default(queued)
  attempts          Int @default(0)
  max_attempts      Int @default(3)
  next_run_at       DateTime @default(now())
  locked_at         DateTime?
  locked_by         String?
  last_error        String?

  @@unique([entity_type, entity_id, field_name, target_locale, source_text_hash])
  @@index([status, next_run_at])
  @@index([entity_type, entity_id])
  @@index([deleted_at])
}

model TranslationAuditLog {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  actor_user_id String?
  actor         User? @relation("TranslationAuditLogs", fields: [actor_user_id], references: [id])
  action        String // translation_approved | translation_rejected | translation_edited | jobs_enqueued | policy_updated
  target_type   String // content_translation | translation_job | translation_field_policy
  target_id     String?
  before        Json?
  after         Json?

  @@index([actor_user_id])
  @@index([target_type, target_id])
  @@index([action])
}

model User {
  content_translation_reviews ContentTranslation[] @relation("ContentTranslationReviewedBy")
  translation_audit_logs      TranslationAuditLog[] @relation("TranslationAuditLogs")
}
```

### Initial TranslationFieldPolicy Seed

| Entity type | Field | Publication policy | Stale behavior |
|---|---|---|---|
| `Category` | `name` | `review_required` | `fallback_source` |
| `SubCategory` | `name` | `review_required` | `fallback_source` |
| `PointOfInterest` | `description` | `review_required` | `fallback_source` |
| `PointOfInterest` | `tags` | `review_required` | `fallback_source` |
| `TrailDetail` | `parking_info` | `review_required` | `fallback_source` |
| `TrailDetail` | `best_season` | `review_required` | `fallback_source` |
| `LodgingCustomization` | `welcome_message` | `review_required` | `fallback_source` |
| `LodgingCustomization` | `parking_info` | `review_required` | `fallback_source` |
| `LodgingCustomization` | `equipment_info` | `review_required` | `fallback_source` |
| `LodgingCustomization` | `checkout_instructions` | `review_required` | `fallback_source` |
| `LodgingCustomization` | `trash_info` | `review_required` | `fallback_source` |
| `LodgingCustomization` | `trash_location` | `review_required` | `fallback_source` |
| `LodgingCustomization` | `house_rules` | `review_required` | `fallback_source` |
| `LodgingCustomization` | `emergency_contacts` | `review_required` | `fallback_source` |
| `LodgingCustomization` | `useful_services` | `review_required` | `fallback_source` |
| `Event` | `title` | `auto_publish` | `fallback_source` |
| `Event` | `description` | `auto_publish` | `fallback_source` |
| `Event` | `price_info` | `auto_publish` | `fallback_source` |

---

## API Contract

```yaml
paths:
  /api/admin/translations/coverage:
    get:
      summary: "Consulter la couverture de traduction"
      tags: [multilingual-content]
      security:
        - bearerAuth: []
      parameters:
        - name: locale
          in: query
          required: true
          schema:
            type: string
            enum: [en, it, es, nl]
        - name: city_id
          in: query
          required: false
          schema:
            type: string
            format: uuid
        - name: entity_type
          in: query
          required: false
          schema:
            type: string
      responses:
        "200":
          description: Couverture de traduction
          content:
            application/json:
              schema:
                type: object
                required: [locale, total_fields, approved_fields, stale_fields, missing_fields, failed_fields, coverage_ratio]
                properties:
                  locale:
                    type: string
                    enum: [en, it, es, nl]
                  total_fields:
                    type: integer
                  approved_fields:
                    type: integer
                  stale_fields:
                    type: integer
                  missing_fields:
                    type: integer
                  failed_fields:
                    type: integer
                  coverage_ratio:
                    type: number
                    minimum: 0
                    maximum: 1
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/translations:
    get:
      summary: "Lister les traductions"
      tags: [multilingual-content]
      security:
        - bearerAuth: []
      parameters:
        - name: locale
          in: query
          required: false
          schema:
            type: string
            enum: [en, it, es, nl]
        - name: status
          in: query
          required: false
          schema:
            type: string
            enum: [queued, auto_translated, needs_review, approved, stale, rejected, failed]
        - name: entity_type
          in: query
          required: false
          schema:
            type: string
        - name: city_id
          in: query
          required: false
          schema:
            type: string
            format: uuid
        - name: field_name
          in: query
          required: false
          schema:
            type: string
        - name: publication_policy
          in: query
          required: false
          schema:
            type: string
            enum: [review_required, auto_publish]
        - name: page
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 50
      responses:
        "200":
          description: Liste paginée
          content:
            application/json:
              schema:
                type: object
                required: [data, pagination]
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/ContentTranslation"
                  pagination:
                    $ref: "#/components/schemas/Pagination"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/translations/{id}:
    patch:
      summary: "Modifier, approuver ou rejeter une traduction"
      tags: [multilingual-content]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [action]
              properties:
                action:
                  type: string
                  enum: [edit, approve, reject]
                translated_text:
                  type: string
                  maxLength: 12000
                review_note:
                  type: string
                  maxLength: 1000
      responses:
        "200":
          description: Traduction mise à jour
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ContentTranslation"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/Conflict"

  /api/admin/translations/jobs:
    post:
      summary: "Créer des jobs de traduction incrémentaux"
      tags: [multilingual-content]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [target_locales]
              properties:
                target_locales:
                  type: array
                  minItems: 1
                  items:
                    type: string
                    enum: [en, it, es, nl]
                entity_type:
                  type: string
                entity_ids:
                  type: array
                  maxItems: 500
                  items:
                    type: string
                    format: uuid
                city_id:
                  type: string
                  format: uuid
                stale_only:
                  type: boolean
                  default: true
      responses:
        "202":
          description: Jobs créés
          content:
            application/json:
              schema:
                type: object
                required: [created_jobs, skipped_fields]
                properties:
                  created_jobs:
                    type: integer
                  skipped_fields:
                    type: integer
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/internal/translations/process:
    post:
      summary: "Traiter un lot de jobs de traduction"
      tags: [multilingual-content]
      security:
        - cronSecret: []
      requestBody:
        required: false
        content:
          application/json:
            schema:
              type: object
              properties:
                limit:
                  type: integer
                  minimum: 1
                  maximum: 100
                  default: 25
      responses:
        "200":
          description: Traitement terminé
          content:
            application/json:
              schema:
                type: object
                required: [processed, succeeded, failed, retried]
                properties:
                  processed:
                    type: integer
                  succeeded:
                    type: integer
                  failed:
                    type: integer
                  retried:
                    type: integer
        "401":
          $ref: "#/components/responses/Unauthorized"
        "500":
          $ref: "#/components/responses/InternalServerError"

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    cronSecret:
      type: apiKey
      in: header
      name: x-cron-secret
  schemas:
    ContentTranslation:
      type: object
      required:
        - id
        - entity_type
        - entity_id
        - field_name
        - source_locale
        - target_locale
        - source_text_hash
        - translated_text
        - status
      properties:
        id:
          type: string
          format: uuid
        entity_type:
          type: string
        entity_id:
          type: string
        field_name:
          type: string
        source_locale:
          type: string
          enum: [fr]
        target_locale:
          type: string
          enum: [en, it, es, nl]
        source_text_hash:
          type: string
        translated_text:
          type: string
        status:
          type: string
          enum: [queued, auto_translated, needs_review, approved, stale, rejected, failed]
        reviewed_at:
          type: string
          format: date-time
          nullable: true
    Pagination:
      type: object
      required: [page, limit, total]
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message, details]
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
  responses:
    BadRequest:
      description: Bad Request
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Forbidden:
      description: Forbidden
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    NotFound:
      description: Not Found
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Conflict:
      description: Conflict
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    InternalServerError:
      description: Internal Server Error
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
```

---

## UI Behaviour

### Public Routes — Locale Selection

- **Default state**: les routes françaises existantes restent inchangées (`/guide/[city-slug]`, `/mes-favoris`).
- **Localized state**: les routes localisées ajoutent un préfixe `/{locale}` pour `en`, `it`, `es`, `nl`.
- **Language selector**: visible dans le menu public, libellé par nom natif de langue (`Français`, `English`, `Italiano`, `Español`, `Nederlands`).
- **Persistence**: le choix écrit le cookie `staylocal_locale` et redirige vers la route locale équivalente.
- **Fallback state**: si un champ n'a pas de traduction publiable, le composant affiche le fallback de sa policy sans layout shift.
- **Mobile behaviour**: le sélecteur doit rester utilisable à partir de 375px sans scroll horizontal.

### Public Guide / POI Detail

- **Guide home**: catégorie, sous-catégorie, accroches et textes éditoriaux utilisent les traductions publiables de la locale courante.
- **POI list**: `PointOfInterest.description` et tags affichés utilisent la locale courante ; nom, adresse, téléphone, site web, photos et distances restent source.
- **POI detail**: le contenu long traduit s'affiche quand il est publiable ; sinon le français est affiché.
- **Weather page**: les données météo factuelles ne sont pas traduites par `ContentTranslation`; seules les UI strings météo utilisent les clés i18n.

### Admin Translations — `/admin/translations`

- **Loading state**: skeleton table avec filtres désactivés.
- **Empty state**: message différent pour "aucune traduction", "aucun stale", "aucun résultat pour ces filtres".
- **List state**: table desktop avec colonnes `Locale`, `Entity`, `Field`, `Status`, `Updated`, `Policy`, actions.
- **Review state**: panneau latéral affichant Source Content français, traduction courante, policy, hash, date de génération, erreurs et actions `Approuver`, `Modifier`, `Rejeter`, `Relancer`.
- **Bulk state**: actions groupées pour créer des jobs sur les traductions manquantes ou stale.
- **Error state**: les erreurs API sont affichées en toast et dans le panneau concerné quand elles affectent une traduction précise.
- **Mobile behaviour**: l'admin reste desktop-first selon les specs dashboard, mais la table ne doit pas casser le layout sous 768px.

### Admin Translation Coverage

- **Dashboard state**: affiche par locale le ratio de couverture, les traductions stale, failed, missing et needs_review.
- **City filter**: permet de prioriser une City pilote.
- **CTA state**: propose `Créer jobs manquants`, `Voir à relire`, `Voir erreurs`.

---

## Acceptance Criteria Summary

| ID | Description | Test type | Test file |
|---|---|---|---|
| AC-01-01 | Choix langue public persistant dans `staylocal_locale` | e2e | `tests/e2e/multilingual-content.AC-01-01.locale-cookie.test.ts` |
| AC-01-02 | Route préfixée locale affiche UI + contenu traduit disponible | integration | `tests/integration/multilingual-content.AC-01-02.localized-route.test.tsx` |
| AC-01-03 | Locale URL non supportée retourne 404 | integration | `tests/integration/multilingual-content.AC-01-03.unsupported-locale.test.ts` |
| AC-01-04 | Fallback public pour traduction manquante ou non publiable | unit | `tests/unit/multilingual-content.AC-01-04.fallback-policy.test.ts` |
| AC-02-01 | Changement Source Content marque les traductions stale | unit | `tests/unit/multilingual-content.AC-02-01.source-hash-stale.test.ts` |
| AC-02-02 | Sync crée jobs uniquement pour champs manquants ou stale | integration | `tests/integration/multilingual-content.AC-02-02.incremental-jobs.test.ts` |
| AC-02-03 | Changement d'un seul champ ne retraduit pas toute l'entité | unit | `tests/unit/multilingual-content.AC-02-03.field-scoped-invalidation.test.ts` |
| AC-02-04 | Contenus archivés ou non publiables exclus des jobs | unit | `tests/unit/multilingual-content.AC-02-04.archived-content-skipped.test.ts` |
| AC-03-01 | `/admin/translations` liste et filtre les traductions | integration | `tests/integration/multilingual-content.AC-03-01.admin-list.test.tsx` |
| AC-03-02 | Approbation admin enregistre statut, reviewer et audit log | integration | `tests/integration/multilingual-content.AC-03-02.approve-audit.test.ts` |
| AC-03-03 | `review_required` bloque `auto_translated` en public | unit | `tests/unit/multilingual-content.AC-03-03.review-required-publication.test.ts` |
| AC-03-04 | `auto_publish` autorise une traduction auto à hash courant | unit | `tests/unit/multilingual-content.AC-03-04.auto-publish.test.ts` |
| AC-04-01 | Cron traite les jobs par lots avec verrouillage | integration | `tests/integration/multilingual-content.AC-04-01.process-jobs.test.ts` |
| AC-04-02 | Échec temporaire incrémente attempts et backoff | unit | `tests/unit/multilingual-content.AC-04-02.retry-backoff.test.ts` |
| AC-04-03 | Échec définitif passe le job en failed sans effacer l'ancien contenu | unit | `tests/unit/multilingual-content.AC-04-03.final-failure.test.ts` |
| AC-04-04 | Deux workers ne traitent pas le même job simultanément | integration | `tests/integration/multilingual-content.AC-04-04.job-locking.test.ts` |
| AC-04-05 | Worker utilise l'adaptateur serveur DeepL avec source FR et locale cible | unit | `tests/unit/multilingual-content.AC-04-05.deepl-provider.test.ts` |
| AC-05-01 | Metadata localisées exposent hreflang et canonical | unit | `tests/unit/multilingual-content.AC-05-01.localized-metadata.test.ts` |
| AC-05-02 | Page locale sous couverture critique est noindex | unit | `tests/unit/multilingual-content.AC-05-02.noindex-low-coverage.test.ts` |
| AC-05-03 | Page française reste canonical source | unit | `tests/unit/multilingual-content.AC-05-03.french-canonical.test.ts` |
| AC-06-01 | Champs non déclarés traduisibles exclus du prestataire | unit | `tests/unit/multilingual-content.AC-06-01.policy-allowlist.test.ts` |
| AC-06-02 | Données factuelles protégées jamais traduites | unit | `tests/unit/multilingual-content.AC-06-02.protected-values.test.ts` |
| AC-06-03 | Modification détectable de valeur protégée bloque ou force review | unit | `tests/unit/multilingual-content.AC-06-03.translation-guardrails.test.ts` |

---

## Out of Scope

- Traduction des slugs ou génération d'URLs localisées par langue.
- Traduction des coordonnées, métriques géographiques, GPX, GeoJSON, itinéraires, horaires structurés ou données Mapbox / IGN / Overpass.
- Traduction du `google_review_payload`, des données Google temporaires ou des fiches Google brutes.
- Traduction temps réel de messages Tourist, conversations, emails entrants ou support client.
- Interface Merchant de revue traduction.
- CMS complet, workflow éditorial multi-rôles ou historique de versions éditoriales complet.
- Détection automatique de la langue source saisie par Owner ou Merchant.
- Traduction juridique certifiée, conditions générales, politique de confidentialité ou mentions légales.
- Localisation des formats monétaires avancés au-delà de l'affichage déjà fourni par les APIs métier.

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | Quel prestataire de traduction serveur utiliser pour MVP 2 : DeepL, Google Cloud Translation, autre prestataire dédié, ou mode manuel sans traduction automatique ? | Product Owner | 2026-06-12 | Résolu — i18n est l'architecture de localisation du site ; DeepL API Pro est retenu comme prestataire serveur pour la traduction automatique du contenu vivant. |
