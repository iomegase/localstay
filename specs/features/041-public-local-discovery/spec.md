# Spec — 041 Public Local Discovery

## Metadata

```yaml
id: 041-public-local-discovery
title: "Découverte locale publique et sélection éditoriale SEO des POI"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-08-20
updated_at: 2026-08-24
depends_on:
  - 001-city-guide
  - 002-categories
  - 003-poi-list
  - 004-poi-detail
  - 022-admin-poi-management
  - 031-public-marketing-site
  - 032-approved-brand-identity
  - 034-private-guide-app
bounded_context: public-discovery
implementation_gate: "Spec approuvée par le Product Owner le 2026-08-20"
```

---

## Context

MyStay est d'abord une conciergerie locative en Haute-Savoie dont le site
public vise l'acquisition de propriétaires. Le guide d'arrivée numérique est
un élément différenciant de cette offre et l'expérience réelle du voyageur
reste privée sous `/sejour`, après activation par QR code.

Les routes historiques `/guide/{ville}`, `/guide/{ville}/{categorie}` et
`/guide/{ville}/{categorie}/{poi}` mélangent actuellement découverte publique
et expérience de séjour. Cette feature crée une surface éditoriale publique
séparée sous `/decouvrir`, indexable et intégrée au site marketing MyStay :

- `/decouvrir` comme hub des villes possédant du contenu public éligible ;
- `/decouvrir/[city-slug]` pour la destination locale ;
- `/decouvrir/[city-slug]/[category-slug]` pour une sélection thématique ;
- `/decouvrir/[city-slug]/[category-slug]/[poi-slug]` pour une fiche POI
  sélectionnée et enrichie.

Tous les POI actifs du Guide ne sont pas publiés automatiquement. Le
Super-admin valide séparément chaque POI destiné à la découverte publique. Une
validation stricte de complétude bloque toute publication insuffisante.

La migration est immédiate : les anciennes URL publiques génériques
`/guide/...` redirigent de manière permanente vers `/decouvrir/...` lorsqu'une
destination publique existe. Les routes QR et le séjour privé restent sous
`/guide/{city}?lodging={uuid}` puis `/sejour`.

---

## Glossary References

- **City** : ville de rattachement de la découverte locale
- **Category** : regroupement thématique de POI
- **SubCategory** : filtre éditorial secondaire d'une Category
- **POI** : lieu ou activité locale validé dans MyStay
- **Guide** : contenu de séjour historique, désormais distinct de la découverte publique
- **Tourist** : visiteur anonyme ou voyageur en séjour
- **QR Code** : autorité d'activation du séjour privé
- **GEO** : optimisation de contenus publics factuels, structurés et citables
- **Soft Delete** : archivage logique via `deleted_at`
- **Server Component** : rendu serveur par défaut des pages publiques

---

## User Stories

### US-01 — Découvrir une ville publiquement

**As a** visiteur anonyme  
**I want to** consulter une sélection locale MyStay par ville  
**So that** je prépare mon séjour et découvre l'expertise locale de la conciergerie

#### Acceptance Criteria

- **AC-01-01**: Given une City active contenant au moins un POI au statut
  `PUBLISHED`, When `/decouvrir/{city}` est ouverte, Then la page répond HTTP
  200 et affiche le nom de la ville, une introduction locale, les catégories
  publiées et leurs POI.
- **AC-01-02**: Given une City inexistante, inactive, supprimée ou sans POI
  `PUBLISHED`, When `/decouvrir/{city}` est ouverte, Then la route répond 404 et
  n'est pas présente dans le sitemap.
- **AC-01-03**: Given plusieurs catégories publiées, When la page ville est
  rendue, Then elles sont ordonnées par `Category.sort_order` et chaque lien
  pointe vers `/decouvrir/{city}/{category}`.
- **AC-01-04**: Given une largeur de 375, 768 ou 1440 px, When la page ville
  s'affiche, Then elle utilise le `MarketingShell` MyStay sans débordement
  horizontal et sans reprendre la coque privée de 430 px.
- **AC-01-05**: Given la page ville publique, When son HTML est inspecté, Then
  elle possède un H1 unique, une canonical auto-référente, des metadata Open
  Graph/Twitter propres et un JSON-LD `BreadcrumbList` avec un `ItemList` des
  POI visibles.

### US-02 — Consulter une sélection éditoriale par catégorie

**As a** visiteur anonyme  
**I want to** parcourir les adresses sélectionnées d'une catégorie  
**So that** je trouve rapidement des lieux locaux pertinents

#### Acceptance Criteria

- **AC-02-01**: Given au moins un POI `PUBLISHED` dans une Category active pour
  la City, When `/decouvrir/{city}/{category}` est ouverte, Then la page répond
  HTTP 200 et affiche exclusivement les POI publiés de cette paire.
- **AC-02-02**: Given aucun POI publié pour la paire City/Category, When la
  route est demandée, Then elle répond 404 et reste absente du sitemap.
- **AC-02-03**: Given des POI publiés dans les zones primaire et alentours,
  When la page catégorie s'affiche, Then les règles géographiques globales
  restent appliquées : liste principale jusqu'à 15 km et section « Aux
  alentours » entre 15 et 30 km uniquement si non vide.
- **AC-02-04**: Given la page catégorie, When elle est rendue, Then son H1
  exprime la catégorie et la ville, ses cards affichent uniquement des faits
  existants et chaque card pointe vers `/decouvrir/{city}/{category}/{poi}`.
- **AC-02-05**: Given la page catégorie, When son HTML est inspecté, Then elle
  possède une canonical auto-référente, des metadata sociales propres et les
  JSON-LD `BreadcrumbList` et `ItemList` correspondant au contenu visible.

### US-03 — Consulter une fiche POI publique enrichie

**As a** visiteur anonyme  
**I want to** consulter une fiche locale fiable  
**So that** je puisse décider de visiter ce lieu

#### Acceptance Criteria

- **AC-03-01**: Given un POI actif et `PUBLISHED` dont la City et la Category
  sont actives, When sa route `/decouvrir/{city}/{category}/{poi}` est ouverte,
  Then la page répond HTTP 200 et affiche son nom, sa description, sa photo
  principale, son adresse et les actions réellement disponibles.
- **AC-03-02**: Given un POI qui n'est pas `PUBLISHED`, inactif, archivé ou
  rattaché à une City/Category inactive, When sa route publique est demandée,
  Then elle répond 404 sans exposer ses données.
- **AC-03-03**: Given un téléphone ou un site officiel absent, When la fiche
  s'affiche, Then l'action correspondante est absente. L'itinéraire utilise
  l'adresse puis les coordonnées en fallback conformément à la spec 004.
- **AC-03-04**: Given la fiche publique, When son HTML est inspecté, Then elle
  possède un H1 unique, une canonical auto-référente, des metadata sociales
  propres, un `BreadcrumbList` et un type JSON-LD POI approprié dont les
  données correspondent au contenu visible.
- **AC-03-05**: Given aucun séjour actif, When une fiche publique est affichée,
  Then aucun commentaire Owner, identifiant de Lodging, contenu privé ou
  information propre à un séjour n'est chargé ni rendu.

### US-04 — Piloter la publication SEO depuis l'administration

**As an** Admin  
**I want to** publier ou retirer un POI de la découverte publique  
**So that** seules les fiches éditorialement complètes soient indexables

#### Acceptance Criteria

- **AC-04-01**: Given un Admin sur `/admin/pois/{id}`, When la section
  « Découverte publique » s'affiche, Then elle indique le statut `DRAFT` ou
  `PUBLISHED`, la date de publication éventuelle et une checklist de
  complétude.
- **AC-04-02**: Given un POI satisfaisant toutes les règles de complétude, When
  l'Admin confirme « Publier dans Découvrir », Then le statut passe à
  `PUBLISHED`, `discovery_published_at` est renseigné et un audit log est créé.
- **AC-04-03**: Given au moins une règle de complétude non satisfaite, When
  l'Admin tente de publier, Then la mutation est refusée avec
  `409 DISCOVERY_PUBLICATION_INCOMPLETE`, la checklist indique les champs
  manquants et aucune valeur n'est modifiée.
- **AC-04-04**: Given un POI `PUBLISHED`, When l'Admin confirme « Retirer de
  Découvrir », Then son statut repasse à `DRAFT`, sa date de publication est
  vidée, ses URL disparaissent du sitemap et deviennent 404.
- **AC-04-05**: Given un POI publié dont une modification rend la fiche
  incomplète, inactive ou archivée, When la sauvegarde est appliquée, Then le
  POI est automatiquement retiré de Découvrir dans la même transaction et
  l'audit explique la cause.
- **AC-04-06**: Given la liste `/admin/pois`, When elle s'affiche, Then un badge
  et un filtre `discovery_status` permettent d'identifier les POI `DRAFT` et
  `PUBLISHED` pour la City sélectionnée.

### US-05 — Migrer les anciennes URL sans casser le séjour

**As a** moteur de recherche ou visiteur anonyme  
**I want to** atteindre la nouvelle URL publique canonique  
**So that** les signaux SEO soient consolidés sur `/decouvrir`

#### Acceptance Criteria

- **AC-05-01**: Given un accès anonyme à une ancienne page ville disposant
  d'au moins un POI public, When `/guide/{city}` est demandée sans paramètre
  `lodging`, Then une redirection permanente cible `/decouvrir/{city}`.
- **AC-05-02**: Given un accès anonyme à une ancienne catégorie ou fiche dont
  l'équivalent public existe, When l'ancienne URL est demandée, Then une
  redirection permanente conserve les slugs et cible l'URL `/decouvrir`
  équivalente.
- **AC-05-03**: Given un accès anonyme à une ancienne catégorie ou fiche sans
  équivalent `PUBLISHED`, When l'ancienne URL est demandée, Then elle répond
  404 et n'expose pas le contenu privé.
- **AC-05-04**: Given `/guide/{city}?lodging={uuid}` avec un Lodging valide,
  When le QR est ouvert, Then le cookie est posé et la redirection vers
  `/sejour?lodging={uuid}` reste inchangée.
- **AC-05-05**: Given un séjour valide, When le voyageur ouvre une fiche POI
  depuis `/sejour`, Then les routes privées existantes restent accessibles et
  peuvent afficher le commentaire de son hôte.
- **AC-05-06**: Given le sitemap, When il est généré, Then les anciennes pages
  ville/catégorie/POI sous `/guide` en sont absentes et seules les URL
  `/decouvrir` dérivées de POI `PUBLISHED` y sont ajoutées, sans doublon.

### US-06 — Parcourir les villes publiées

**As a** visiteur anonyme\
**I want to** voir les villes pour lesquelles MyStay possède une sélection\
publique\
**So that** j'accède aux adresses locales

#### Acceptance Criteria

- **AC-06-01**: Given des POI `PUBLISHED` éligibles dans plusieurs villes,
  When `/decouvrir` est ouverte, Then une seule lecture Prisma dédiée est
  effectuée, sans N+1, la page répond HTTP 200, les villes sont triées avec
  `Intl.Collator('fr', { sensitivity: 'base' })` puis le slug canonique de la
  ville, et seules les villes possédant au moins un POI visible sont affichées.
- **AC-06-02**: Given plus de cinq POI visibles dans une ville, When le hub est
  rendu, Then seuls les cinq premiers selon l'ordre public du hub — zone
  primaire puis zone alentours, distance croissante, comparaison du nom avec
  `Intl.Collator('fr', { sensitivity: 'base' })`, puis slug canonique du POI
  comme départage déterministe — sont affichés, avec un lien canonique vers la
  ville et des liens canoniques vers les fiches POI.
- **AC-06-03**: Given aucun POI public éligible, When `/decouvrir` est ouverte,
  Then la page répond HTTP 200 avec l'état éditorial vide exact `De nouvelles adresses arrivent bientôt.` et n'invente aucune ville.
- **AC-06-04**: Given le hub public, When son HTML est inspecté, Then il utilise
  le `MarketingShell`, possède exactement un H1 `Découvrir les bonnes adresses locales.`, une canonical `/decouvrir`, des metadata OG/Twitter, un
  `BreadcrumbList` Accueil → Découvrir et un `ItemList` contenant exactement une
  entrée par ville visible dans l'ordre rendu, avec uniquement des URLs de
  villes canoniques.
- **AC-06-05**: Given le footer marketing, When son lien de découverte est
  rendu, Then son libellé exact est « Découvrir », sa cible est `/decouvrir` et
  cette URL apparaît exactement une fois dans le sitemap.
- **AC-06-06**: Given une publication, un retrait ou une dépublication
  automatique, When la mutation est commitée, Then les caches de `/decouvrir`,
  des chemins locaux affectés et de `/sitemap.xml` sont invalidés. Given un
  déplacement de ville, catégorie ou slug, When la mutation est commitée, Then
  les deux contextes de routes ville/catégorie/POI, ancien et nouveau, sont
  invalidés, avec déduplication des chemins.

---

## Business Rules

- **BR-01**: `discovery_status` est indépendant de `is_active`. Un POI doit être
  actif, non supprimé et `PUBLISHED` pour apparaître sous `/decouvrir`.
- **BR-02**: Le statut par défaut est `DRAFT`. Aucune migration ne publie
  automatiquement les POI existants.
- **BR-03**: Seul un Admin actif peut modifier `discovery_status`.
- **BR-04**: La publication est autorisée uniquement lorsque toutes les
  conditions suivantes sont vraies :
  - POI actif et `deleted_at = null` ;
  - City active et non supprimée ;
  - Category active et non supprimée ;
  - SubCategory active et non supprimée lorsqu'elle est renseignée ;
  - description non vide après trim ;
  - au moins une URL photo exploitable selon la règle de la spec 022 ;
  - adresse non vide ;
  - `geocode_status = success` et coordonnées numériques valides ;
  - téléphone non vide ou site officiel HTTP(S) valide.
- **BR-05**: Toute perte d'une condition BR-04 retire automatiquement le POI
  de la découverte publique dans la même transaction.
- **BR-06**: Une City devient publique dès son premier POI `PUBLISHED`. Une
  Category devient publique pour une City dès son premier POI `PUBLISHED`.
- **BR-07**: Les pages publiques n'utilisent jamais de POI `DRAFT` comme
  contenu, JSON-LD, lien interne, compteur ou entrée de sitemap.
- **BR-08**: Les queries publiques filtrent également `deleted_at`,
  `is_active`, `geocode_status`, City, Category et SubCategory afin qu'un
  statut périmé ne suffise jamais à exposer une fiche invalide.
- **BR-09**: Le tri ville et catégorie utilise `Category.sort_order`, puis
  distance depuis le centre-ville, puis nom. Aucun contexte Lodging n'influence
  ce tri public.
- **BR-10**: Les zones géographiques globales restent : principale jusqu'à
  15 km, alentours entre 15 et 30 km, exclusion au-delà de 30 km.
- **BR-11**: La surface `/decouvrir` n'utilise aucun cookie de séjour, aucun
  commentaire Owner, aucune recommandation de Lodging et aucune donnée privée.
- **BR-12**: Aucune géolocalisation n'est déclenchée automatiquement. Toute
  activation GPS future exige une action explicite du visiteur.
- **BR-13**: Le style public réutilise `MarketingShell`, le header, le footer,
  `MyStayLogo`, les couleurs, rayons, ombres, largeurs et CTA de la spec 031.
- **BR-14**: Les pages sont des Server Components par défaut. Les composants
  clients sont limités aux interactions explicitement nécessaires.
- **BR-15**: Les textes factuels proviennent exclusivement des champs MyStay
  validés. Gemini ne calcule aucune donnée géographique et ne publie rien.
- **BR-16**: Les metadata et JSON-LD ne contiennent que des informations
  visibles sur la page et utilisent `/decouvrir` comme URL canonique.
- **BR-17**: Les anciennes URL génériques `/guide` redirigent de manière
  permanente seulement lorsqu'un équivalent public existe. Sans équivalent,
  elles répondent 404 pour un visiteur anonyme.
- **BR-18**: La branche QR `?lodging={uuid}` reste prioritaire sur toute
  redirection SEO et continue vers `/sejour`.
- **BR-19**: Un séjour valide conserve l'accès aux fiches POI privées et à
  leurs données contextuelles. La migration publique ne modifie pas le contrat
  de `/sejour`.
- **BR-20**: Les routes logement publiques existantes sous
  `/guide/{city}/logements/*` restent inchangées dans cette feature, selon la
  spec 031. Leur migration future vers `/logements/*` est hors périmètre.
- **BR-21**: Les routes agenda, carte et randonnée de séjour ne sont pas
  déplacées par cette feature. Elles ne sont jamais ajoutées au sitemap par
  041.
- **BR-22**: Une désactivation ou un archivage remet
  `discovery_status = DRAFT` et `discovery_published_at = null`. Une restauration
  ne republie jamais automatiquement le POI.
- **BR-23**: Chaque publication, retrait ou retrait automatique crée un
  `PoiAcquisitionAuditLog` avec une action explicite, les valeurs avant/après
  et un acteur typé `ADMIN`, `MERCHANT` ou `SYSTEM`. `ADMIN` et `MERCHANT`
  référencent obligatoirement le `User` ayant déclenché la mutation via le
  champ historique `admin_id`. `SYSTEM` est réservé aux automatisations sans
  session utilisateur (photo healer, persister Gemini legacy, géocodage) et
  impose `admin_id = null`. Une mutation et son éventuel retrait automatique
  sont atomiques ; la revalidation des URL publiques intervient uniquement
  après le commit.
- **BR-24**: La publication publique utilise le français canonique existant.
  L'ajout de versions multilingues reste régi par la spec 027.
- **BR-25**: Cette spec remplace les URL publiques définies par les specs 001,
  002, 003 et 004 pour les accès anonymes. Leurs contrats de données, actions
  POI et règles géographiques restent applicables lorsqu'ils ne contredisent
  pas 041.
- **BR-26**: La découverte publique préserve le contrat photo de la spec 022 :
  toute URL distante `http(s)` exploitable reste admissible, sans allowlist
  d'hôtes, re-hébergement ni proxy d'optimisation. Les photos `/decouvrir`
  utilisent donc un élément `<img>` natif responsive plutôt que `next/image`,
  avec dimensions intrinsèques, ratio réservé, texte alternatif et politique
  de référent restrictive. Le navigateur tente l'URL distante telle quelle ;
  si elle échoue ou est bloquée (notamment après traitement mixed-content
  d'une source HTTP), le composant affiche une ressource locale MyStay
  déterministe sans modifier l'URL stockée ni republier l'image. Cette
  exception explicite à BR-13 et au standard marketing évite de rendre un POI
  inéligible uniquement selon l'hôte de sa photo ; les contrôles
  favicon/logo/placeholder de la spec 022 restent applicables.
- **BR-27**: Le hub dérive ses villes uniquement des POI satisfaisant BR-04,
  BR-08 et BR-10 au moment de la lecture ; une ville vide est omise et un POI
  `DRAFT` ne contribue jamais au rendu ni au JSON-LD.
- **BR-28**: Par dérogation spécifique au hub à BR-09, le hub effectue une seule lecture Prisma ; les villes sont triées avec `Intl.Collator('fr', { sensitivity: 'base' })` puis le slug canonique de la ville et, dans chaque ville, les POI suivent la zone primaire puis la zone alentours, la distance croissante, la comparaison du nom avec `Intl.Collator('fr', { sensitivity: 'base' })`, puis le slug canonique du POI comme départage déterministe, avec un maximum de cinq POI.
- **BR-29**: La racine reste publique et répond HTTP 200 avec un état éditorial
  vide lorsqu'elle ne contient aucun contenu ; elle ne lit aucun cookie, Lodging,
  Owner ou séjour.
- **BR-30**: Le libellé exact du lien footer est « Découvrir » ; le libellé
  rejeté « Découvrir nos destinations » n'est jamais utilisé.
- **BR-31**: Les mutations modifiant l'appartenance au hub invalident après
  commit `/decouvrir`, les chemins locaux affectés et `/sitemap.xml`. Lors d'un
  déplacement de ville, catégorie ou slug, les contextes de routes ville,
  catégorie et POI anciens comme nouveaux sont tous invalidés, avec
  déduplication des chemins.

---

## Data Model

Cette feature ajoute un statut de publication éditoriale distinct sur
`PointOfInterest`. Elle ne crée aucune nouvelle table.

```prisma
enum PoiDiscoveryStatus {
  DRAFT
  PUBLISHED
}

enum PoiAuditActorType {
  ADMIN
  MERCHANT
  SYSTEM
}

model PointOfInterest {
  id                       String             @id @default(uuid())
  created_at               DateTime           @default(now())
  updated_at               DateTime           @updatedAt
  deleted_at               DateTime?

  // Champs existants conservés sans modification
  name                     String
  slug                     String
  description              String?
  address                  String
  latitude                 Float
  longitude                Float
  phone                    String?
  website                  String?
  photos                   String[]
  is_active                Boolean            @default(true)
  geocode_status           String             @default("pending")

  // Spec 041
  discovery_status         PoiDiscoveryStatus @default(DRAFT)
  discovery_published_at   DateTime?

  @@index([discovery_status, deleted_at, is_active, updated_at])
  @@index([city_id, category_id, discovery_status, deleted_at, is_active])
}

model PoiAcquisitionAuditLog {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  // Nom de colonne historique conservé pour compatibilité.
  admin_id  String?
  admin     User?             @relation("PoiAcquisitionAuditLogs", fields: [admin_id], references: [id], onDelete: Restrict)
  actor_type PoiAuditActorType @default(ADMIN)

  // Champs existants conservés sans modification.
  action       String
  target_type  String
  target_id    String?
  before       Json?
  after        Json?
}
```

Invariants :

- `DRAFT` implique `discovery_published_at = null` ;
- `PUBLISHED` implique `discovery_published_at != null` ;
- une mutation qui enfreint BR-04 force `DRAFT` dans la même transaction ;
- aucune suppression physique n'est introduite.
- `actor_type = SYSTEM` implique `admin_id = null` ;
- `actor_type IN (ADMIN, MERCHANT)` implique `admin_id != null` ; cette
  contrainte est ajoutée par la migration PostgreSQL et également construite
  explicitement par les services TypeScript.
- la relation vers un acteur `User` utilise `ON DELETE RESTRICT` afin de
  préserver l'identité historique de l'audit ; les comptes restent gérés par
  soft delete.

---

## API Contract

La lecture publique reste réalisée directement par des Server Components et
des queries Prisma dédiées. Une route admin est ajoutée pour isoler la mutation
de publication du PATCH généraliste de la spec 022.

```yaml
paths:
  /api/admin/pois/{id}/discovery-publication:
    patch:
      summary: "Publier ou retirer un POI de la découverte publique"
      tags: [admin-pois, public-discovery]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              additionalProperties: false
              required: [status]
              properties:
                status:
                  type: string
                  enum: [DRAFT, PUBLISHED]
      responses:
        "200":
          description: "Statut appliqué"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/PoiDiscoveryPublication"
        "400":
          description: "Payload ou UUID invalide"
        "401":
          description: "Session absente ou expirée"
        "403":
          description: "Rôle Admin requis"
        "404":
          description: "POI introuvable"
        "409":
          description: "Publication impossible car la fiche est incomplète"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

components:
  schemas:
    PoiDiscoveryPublication:
      type: object
      required: [id, discovery_status, discovery_published_at, eligibility]
      properties:
        id: { type: string, format: uuid }
        discovery_status:
          type: string
          enum: [DRAFT, PUBLISHED]
        discovery_published_at:
          type: string
          format: date-time
          nullable: true
        public_url:
          type: string
          nullable: true
        eligibility:
          $ref: "#/components/schemas/PoiDiscoveryEligibility"

    PoiDiscoveryEligibility:
      type: object
      required: [eligible, checks]
      properties:
        eligible: { type: boolean }
        checks:
          type: object
          additionalProperties:
            type: boolean

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
              enum: [DISCOVERY_PUBLICATION_INCOMPLETE]
            message: { type: string }
            details:
              type: object
              properties:
                missing:
                  type: array
                  items: { type: string }
```

Extensions du contrat `022` :

- `GET /api/admin/pois` accepte `discovery_status = DRAFT | PUBLISHED` ;
- `AdminPoiListItem` expose `discovery_status` et
  `discovery_published_at` ;
- `AdminPoiDetail` expose également `discovery_eligibility` et
  `discovery_public_url` ;
- les payloads sont validés par Zod avant toute mutation.

Le type d'acteur d'audit est interne et n'ajoute aucun champ aux DTO publics ou
aux réponses de l'API de publication. Les automatisations sans utilisateur
écrivent `actor_type = SYSTEM` et `admin_id = null`.

---

## UI Behaviour

### Page `/decouvrir/[city-slug]`

- Utilise `MarketingShell`, `MarketingHeader` et `MarketingFooter`.
- Hero éditorial clair avec eyebrow « Découvrir », H1
  `Découvrir {ville}` et introduction factuelle construite à partir du nom,
  département et région disponibles.
- Grille de catégories publiée avec nom, icône, nombre de POI et lien public.
- Sélection de POI illustrés utilisant la première photo exploitable.
- Bloc final sombre avec CTA principal `Confier mon logement` et lien vers
  `/concept` pour relier l'expertise locale à l'offre de conciergerie.
- Aucun menu, bottom navigation ou contenu appartenant au séjour privé.

### Page `/decouvrir`

- Utilise `MarketingShell`, `MarketingHeader` et `MarketingFooter`, sans coque
  privée ni contenu de séjour.
- Hero éditorial clair avec H1 exact `Découvrir les bonnes adresses locales.`.
- Les villes éligibles sont affichées alphabétiquement ; chaque ville possède
  un lien canonique vers `/decouvrir/{city-slug}` et au maximum cinq cards POI
  canoniques vers `/decouvrir/{city-slug}/{category-slug}/{poi-slug}`.
- Lorsqu'aucune ville n'est éligible, l'état éditorial affiche exactement
  `De nouvelles adresses arrivent bientôt.`.

### Page `/decouvrir/[city-slug]/[category-slug]`

- Breadcrumb visible Accueil → Ville → Catégorie.
- Eyebrow « Les adresses MyStay », H1 `{catégorie} à {ville}` et introduction
  courte sans fait inventé.
- Cards publiques responsive avec photo, nom, sous-catégorie, adresse, note si
  présente et distance depuis le centre-ville.
- Section « Aux alentours » distincte uniquement lorsqu'elle contient au moins
  un POI publié.
- Aucun accordéon contenant des informations privées et aucune personnalisation
  Lodging.

### Page `/decouvrir/[city-slug]/[category-slug]/[poi-slug]`

- Breadcrumb visible et lien de retour vers la sélection de catégorie.
- Hero photo arrondi cohérent avec les pages logement et article marketing.
- Titre, catégorie, description, adresse, horaires et données publiques
  présentes uniquement si renseignées.
- Actions compactes Appeler, Itinéraire et Site officiel selon disponibilité.
- Mini-carte statique ou composant existant conforme à ADR-001.
- Bloc final de conversion vers `/confier-mon-logement`, sans recommandation
  Owner ni données de séjour.

### Administration `/admin/pois`

- Filtre `Découverte : tous / brouillons / publiés` dans la liste par City.
- Badge `Découvrir` avec variantes `Brouillon` et `Publié` dans chaque ligne.
- La fiche `/admin/pois/{id}` ajoute une Card Shadcn « Découverte publique ».
- La Card affiche une checklist lisible de BR-04, l'URL publique éventuelle,
  la date de publication et une action confirmée Publier/Retirer.
- En cas de `409`, les éléments manquants sont affichés sans perdre les champs
  actuellement saisis dans le formulaire.

### États communs

- Slug inconnu ou contenu non publié : `notFound()` et metadata non indexables.
- Erreur serveur transitoire : erreur générique sans détail Prisma.
- Images absentes : impossibilité de publier, donc aucun fallback éditorial ne
  rend une fiche éligible à lui seul.
- Images distantes : rendu natif responsive conformément à BR-26 ; les cards
  chargent paresseusement et la hero prioritaire réserve son ratio sans
  débordement. L'éligibilité garantit une URL exploitable, pas sa disponibilité
  réseau dans chaque navigateur ; un échec bascule une seule fois sur le
  fallback MyStay local.
- Responsive : 375 px minimum, aucun scroll horizontal.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Ville avec au moins un POI publié → 200 et contenu public | integration |
| AC-01-02 | Ville invalide ou sans POI publié → 404 et hors sitemap | integration + contract |
| AC-01-03 | Catégories triées et liens `/decouvrir` | unit + integration |
| AC-01-04 | `MarketingShell` responsive | integration + e2e |
| AC-01-05 | H1, canonical, OG/Twitter et JSON-LD ville | integration |
| AC-02-01 | Catégorie affiche seulement ses POI publiés | integration |
| AC-02-02 | Catégorie vide/non publiée → 404 | integration |
| AC-02-03 | Zones primaire et alentours respectées | unit + integration |
| AC-02-04 | H1 descriptif et cards vers les fiches publiques | integration |
| AC-02-05 | Metadata et JSON-LD catégorie cohérents | integration |
| AC-03-01 | Fiche publiée rend uniquement ses données publiques | integration |
| AC-03-02 | POI non publié/invalide → 404 sans fuite | security regression + integration |
| AC-03-03 | Actions conditionnelles et itinéraire | unit + e2e |
| AC-03-04 | Metadata et JSON-LD POI cohérents | integration |
| AC-03-05 | Aucun contenu Owner/Lodging | security regression |
| AC-04-01 | Statut, date et checklist admin visibles | integration |
| AC-04-02 | Publication éligible transactionnelle et auditée | contract + integration |
| AC-04-03 | Publication incomplète refusée en 409 | unit + contract |
| AC-04-04 | Retrait supprime sitemap et rend les URL 404 | contract + integration |
| AC-04-05 | Perte d'éligibilité retire automatiquement | unit + integration |
| AC-04-06 | Filtre et badge admin | unit + integration |
| AC-05-01 | Ancienne ville → redirection permanente | e2e |
| AC-05-02 | Ancienne catégorie/fiche publiée → redirection permanente | e2e |
| AC-05-03 | Ancienne URL non publiée → 404 | security regression + e2e |
| AC-05-04 | QR → cookie et `/sejour` inchangés | regression + e2e |
| AC-05-05 | Séjour valide conserve les fiches privées | regression + e2e |
| AC-05-06 | Sitemap uniquement `/decouvrir` publié, sans doublon | unit + contract |
| AC-06-01 | Hub 200 avec uniquement les villes possédant des POI visibles | integration |
| AC-06-02 | Cinq POI maximum, tri public et liens canoniques | unit + integration |
| AC-06-03 | Hub vide → 200 et état éditorial | integration |
| AC-06-04 | MarketingShell, H1, metadata et JSON-LD du hub | integration + e2e |
| AC-06-05 | Footer exact et sitemap racine unique | unit + integration |
| AC-06-06 | Invalidation du hub après changement d'appartenance | contract + integration |

---

## Out of Scope

- Migration des fiches logement publiques vers `/logements/{slug}`.
- Refonte des pages `/logements`, `/seminaires`, `/concept` ou du blog.
- Déplacement des routes agenda, carte ou navigation randonnée.
- Nouveau contenu éditorial spécifique par City ou Category en base.
- Éditeur SEO distinct pour les titres et descriptions des POI.
- Publication automatique selon un score ou un seuil supérieur à un POI.
- Géolocalisation automatique, compte Tourist ou favoris publics.
- Réservation, prix, disponibilité ou paiement.
- Modification des données privées du séjour ou des recommandations Owner.
- Traductions supplémentaires.

---

## Open Questions

Aucune question ouverte. Décisions du Product Owner du 2026-08-20 :

- seuls les POI validés séparément sont publiés sur `/decouvrir` ;
- le contrôle et le statut de publication sont intégrés à l'administration ;
- la complétude stricte est obligatoire avant publication ;
- les pages City et Category sont publiées dès le premier POI validé ;
- la migration des anciennes URL publiques est immédiate avec redirections SEO ;
- la découverte publique et le séjour privé restent strictement séparés.
- les photos publiques conservent les URLs `http(s)` arbitraires autorisées par
  la spec 022 ; le rendu natif `<img>` est l'exception validée à `next/image`,
  sans re-hébergement ni réduction de l'éligibilité par allowlist ; chaque URL
  est tentée nativement et un échec navigateur affiche le fallback MyStay
  local, sans promettre que toute source HTTP distante peut être chargée.
- les dépublications automatiques sans session sont auditées avec
  `actor_type = SYSTEM` et `admin_id = null`; les actions Admin/Merchant
  conservent l'identifiant du `User` déclencheur.
- le hub racine `/decouvrir`, son lien footer « Découvrir » et la limite de
  cinq POI par ville ont été validés le 2026-08-24 ; le libellé « Découvrir nos
  destinations » est exclu.
