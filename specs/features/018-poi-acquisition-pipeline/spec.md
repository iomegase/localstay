# Spec — 018 POI Acquisition Pipeline

## Metadata

```yaml
id: 018-poi-acquisition-pipeline
title: "Pipeline hybride d'acquisition et validation des POI"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-24
updated_at: 2026-05-24
depends_on: [003-poi-list, 004-poi-detail, 007-gemini-fetch, 008-mapbox-geocoding, 014-auth-merchant, 017-admin-taxonomy]
bounded_context: admin
```

---

## Context

StayLocal doit enrichir rapidement les Guides tout en évitant les POI manquants, les doublons, les erreurs de coordonnées et les fiches revendiquées par erreur.

Le pipeline retenu est hybride :

- **Gemini** découvre des POI et rédige des descriptions.
- **Google Places** vérifie l'existence, aide au matching et fournit un `google_place_id`.
- **Mapbox** géocode les adresses et fournit les coordonnées GPS stockées.
- **Super-admin** valide les candidats, crée manuellement des POI si nécessaire et arbitre les doublons.
- **Merchant** peut signaler un POI absent pendant l'onboarding.

Cette spec ne remplace pas `007-gemini-fetch`. Elle ajoute une étape de validation et d'acquisition exploitable par l'admin avant publication définitive.

---

## Glossary References

- **POI** : point d'intérêt affichable dans le Guide public.
- **City** : ville de référence du Guide.
- **Category** : catégorie globale administrée par `017-admin-taxonomy`.
- **SubCategory** : sous-catégorie globale administrée par `017-admin-taxonomy`.
- **Merchant** : commerçant pouvant revendiquer un POI.
- **MerchantClaim** : demande de revendication d'un POI.
- **Gemini Fetch** : découverte et description de POI.
- **Soft Delete** : suppression logique via `deleted_at`.

---

## User Stories

### US-01 — Acquisition hybride City + Category

**As an** Admin  
**I want to** lancer une acquisition de POI pour une ville et une catégorie  
**So that** StayLocal enrichisse le Guide avec des établissements vérifiés

#### Acceptance Criteria

- **AC-01-01**: Given une City active et une Category active, When l'Admin lance une acquisition, Then un `PoiAcquisitionRun` est créé avec `status = running`.
- **AC-01-02**: Given un run lancé, When Gemini retourne des POI, Then chaque POI devient un `PoiAcquisitionCandidate` avec `source = gemini`.
- **AC-01-03**: Given un candidat Gemini avec nom + adresse, When Google Places trouve une correspondance probable, Then le candidat reçoit `google_place_id` et `match_status = matched`.
- **AC-01-04**: Given un candidat avec adresse, When Mapbox géocode l'adresse avec une confiance suffisante, Then le candidat reçoit `latitude`, `longitude`, `geocode_status = success`.
- **AC-01-05**: Given un candidat ambigu ou doublon probable, When le run termine, Then le candidat reste en `review_status = needs_review` et n'est pas publié automatiquement.

### US-02 — Validation admin des candidats

**As an** Admin  
**I want to** valider, fusionner ou rejeter les candidats POI  
**So that** seuls les POI fiables soient publiés

#### Acceptance Criteria

- **AC-02-01**: Given `/admin/poi-acquisition/runs/{id}`, When l'Admin consulte le run, Then il voit les candidats avec source, statut Google, statut Mapbox, doublons possibles et statut de review.
- **AC-02-02**: Given un candidat complet sans doublon actif, When l'Admin clique "Publier", Then un `PointOfInterest` est créé avec `is_active = true`.
- **AC-02-03**: Given un candidat doublon probable, When l'Admin choisit un POI existant, Then le candidat est marqué `merged` et aucun nouveau POI n'est créé.
- **AC-02-04**: Given un candidat invalide, When l'Admin clique "Rejeter", Then `review_status = rejected` et aucun POI public n'est créé.
- **AC-02-05**: Given une validation admin, When elle est enregistrée, Then un audit log conserve l'admin, l'action, le candidat et les valeurs avant/après.

### US-03 — POI manquant pendant onboarding Merchant

**As a** Merchant  
**I want to** signaler que mon établissement n'apparaît pas  
**So that** l'équipe StayLocal puisse créer ou rattacher la bonne fiche

#### Acceptance Criteria

- **AC-03-01**: Given une recherche onboarding sans résultat correct, When le Merchant clique "Mon établissement n'apparaît pas", Then un formulaire POI manquant s'affiche.
- **AC-03-02**: Given un formulaire valide, When le Merchant soumet nom + adresse, Then un `MissingPoiRequest` est créé avec `status = pending`.
- **AC-03-03**: Given une demande POI manquant, When Google Places trouve une correspondance, Then la demande stocke `google_place_id` et les métadonnées de matching autorisées.
- **AC-03-04**: Given une demande POI manquant, When Mapbox géocode l'adresse, Then la demande stocke coordonnées et `geocode_status`.
- **AC-03-05**: Given une demande validée par l'Admin, When aucun POI existant ne correspond, Then un POI est créé et une `MerchantClaim` peut être approuvée vers ce POI.

### US-04 — Création manuelle Super-admin

**As an** Admin  
**I want to** créer un POI manuellement  
**So that** je puisse corriger immédiatement un manque sans attendre Gemini

#### Acceptance Criteria

- **AC-04-01**: Given `/admin/pois/new`, When l'Admin renseigne nom, adresse, City, Category et optionnellement SubCategory, Then le formulaire est validé côté serveur avec Zod.
- **AC-04-02**: Given une adresse valide, When l'Admin sauvegarde, Then Mapbox géocode l'adresse côté serveur avant création.
- **AC-04-03**: Given un résultat Mapbox fiable, When la création réussit, Then un `PointOfInterest` est créé avec `geocode_status = success`.
- **AC-04-04**: Given un résultat Mapbox ambigu, When la confiance est insuffisante, Then la création est bloquée ou créée en `geocode_status = pending_review` selon choix admin explicite.
- **AC-04-05**: Given un doublon probable, When l'Admin tente de créer, Then l'API retourne les doublons candidats et demande confirmation explicite.
- **AC-04-06**: Given un POI créé manuellement, When un Merchant le recherche ensuite, Then il apparaît comme revendicable si `is_active = true`, `deleted_at = null`, `geocode_status != rejected` et aucun `MerchantProfile` actif n'existe.

### US-05 — Respect des contraintes Google Places

**As a** System  
**I want to** utiliser Google Places sans violer ses règles  
**So that** StayLocal garde une intégration légale, maintenable et économique

#### Acceptance Criteria

- **AC-05-01**: Given une réponse Google Places, When elle est traitée, Then seul `google_place_id` est stocké durablement comme identifiant de rapprochement.
- **AC-05-02**: Given des données Google temporaires utiles à la review, When elles sont stockées, Then elles expirent selon TTL court et ne sont pas utilisées comme copie permanente de fiche.
- **AC-05-03**: Given une UI admin affichant des données Google, When elles sont visibles, Then l'attribution requise par Google est affichée.
- **AC-05-04**: Given un POI public StayLocal, When il est affiché aux Tourists, Then il affiche les données StayLocal validées, pas une copie brute d'une Google card.

---

## Business Rules

- **BR-01**: Gemini reste limité à la découverte de POI et à la génération de descriptions.
- **BR-02**: Gemini ne fournit jamais les coordonnées GPS, distances, tracés, dénivelés ou métriques géographiques.
- **BR-03**: Mapbox est la source des coordonnées GPS stockées pour les POI généralistes.
- **BR-04**: Google Places est utilisé pour le matching, l'anti-doublon, la vérification d'existence et le `google_place_id`.
- **BR-05**: Le contenu Google Places ne doit pas être recopié durablement comme contenu public StayLocal, hors champs explicitement autorisés et conformité aux règles Google.
- **BR-06**: Les données Google temporaires de review expirent automatiquement et sont séparées des champs publics du POI.
- **BR-07**: Aucun candidat d'acquisition n'est publié si `geocode_status = rejected`.
- **BR-08**: Un POI créé ou publié doit appartenir à une City active, une Category active et, si renseignée, une SubCategory active.
- **BR-09**: Toute création de POI par Admin vérifie les doublons par nom normalisé, adresse, distance géographique et `google_place_id` si disponible.
- **BR-10**: Les doublons probables nécessitent une confirmation admin ou une fusion explicite.
- **BR-11**: Une demande Merchant de POI manquant ne crée jamais directement un POI public.
- **BR-12**: Seul le rôle `admin` peut créer manuellement un POI ou publier un candidat.
- **BR-13**: Les actions admin sont auditées.
- **BR-14**: Toutes les suppressions utilisent `deleted_at`; les candidats rejetés sont conservés pour audit.
- **BR-15**: Les routes internes d'acquisition ne sont jamais appelées depuis le client public.
- **BR-16**: Les coûts API doivent être maîtrisés par déduplication, cache de run et rate limiting.

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
  phone       String?
  website     String?
  photos      String[]
  tags        String[]

  google_place_id String?
  review_source   ReviewSource @default(MANUAL)

  geocode_status   String @default("pending") // pending | success | failed | rejected | pending_review
  geocoded_at      DateTime?
  geocode_provider String?
  geocode_error    String?

  is_active   Boolean @default(true)

  city_id        String
  category_id    String
  subcategory_id String?
}

model PoiAcquisitionRun {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  city_id     String
  category_id String
  status      String   @default("running") // running | completed | failed
  source      String   @default("hybrid") // hybrid | gemini | admin
  started_by  String?
  error       String?

  candidates  PoiAcquisitionCandidate[]
}

model PoiAcquisitionCandidate {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  run_id      String
  run         PoiAcquisitionRun @relation(fields: [run_id], references: [id])

  source      String   // gemini | google_places | manual | merchant_missing
  name        String
  address     String
  description String?
  phone       String?
  website     String?
  category_id String
  subcategory_id String?

  google_place_id String?
  google_review_payload Json?
  google_review_expires_at DateTime?

  latitude    Float?
  longitude   Float?
  geocode_status String @default("pending") // pending | success | failed | rejected | pending_review
  geocode_provider String?
  geocode_confidence Float?

  duplicate_poi_ids String[]
  match_status String @default("unmatched") // unmatched | matched | duplicate_candidate
  review_status String @default("needs_review") // needs_review | published | merged | rejected
  published_poi_id String?

  reviewed_by String?
  reviewed_at DateTime?
  admin_note  String?
}

model MissingPoiRequest {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  merchant_id String
  name        String
  address     String
  phone       String?
  website     String?
  city_id     String
  category_id String?

  google_place_id String?
  latitude    Float?
  longitude   Float?
  geocode_status String @default("pending")

  status      String @default("pending") // pending | linked_existing | created_poi | rejected
  linked_poi_id String?
  reviewed_by String?
  reviewed_at DateTime?
  admin_note  String?
}
```

Notes :

- `google_review_payload` est temporaire et ne doit pas alimenter directement le contenu public.
- Une tâche de nettoyage supprimera ou vide les payloads Google expirés.
- `PointOfInterest.google_place_id` sert à éviter les doublons et à réconcilier les données.

---

## API Contract

```yaml
paths:
  /api/admin/poi-acquisition/runs:
    post:
      summary: "Lancer une acquisition hybride City + Category"
      tags: [poi-acquisition]
      security:
        - bearerAuth: []
    get:
      summary: "Lister les runs d'acquisition"
      tags: [poi-acquisition]
      security:
        - bearerAuth: []

  /api/admin/poi-acquisition/runs/{id}:
    get:
      summary: "Détail d'un run et de ses candidats"
      tags: [poi-acquisition]
      security:
        - bearerAuth: []

  /api/admin/poi-acquisition/candidates/{id}/publish:
    post:
      summary: "Publier un candidat comme POI"
      tags: [poi-acquisition]
      security:
        - bearerAuth: []

  /api/admin/poi-acquisition/candidates/{id}/merge:
    post:
      summary: "Fusionner un candidat avec un POI existant"
      tags: [poi-acquisition]
      security:
        - bearerAuth: []

  /api/admin/poi-acquisition/candidates/{id}/reject:
    post:
      summary: "Rejeter un candidat"
      tags: [poi-acquisition]
      security:
        - bearerAuth: []

  /api/admin/pois:
    post:
      summary: "Créer un POI manuellement avec géocodage Mapbox"
      tags: [admin-pois]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, address, city_id, category_id]
              properties:
                name: { type: string, minLength: 1, maxLength: 160 }
                address: { type: string, minLength: 5, maxLength: 255 }
                city_id: { type: string, format: uuid }
                category_id: { type: string, format: uuid }
                subcategory_id: { type: string, format: uuid, nullable: true }
                phone: { type: string, nullable: true }
                website: { type: string, format: uri, nullable: true }
                description: { type: string, nullable: true }
                confirm_duplicate: { type: boolean, default: false }

  /api/merchant/onboarding/missing-poi:
    post:
      summary: "Déclarer un POI manquant pendant l'onboarding Merchant"
      tags: [auth-merchant]
      security:
        - bearerAuth: []
```

### Error Codes

```yaml
errors:
  - INVALID_CITY
  - INVALID_CATEGORY
  - INVALID_SUBCATEGORY
  - MAPBOX_GEOCODE_FAILED
  - MAPBOX_GEOCODE_AMBIGUOUS
  - DUPLICATE_POI_CANDIDATE
  - GOOGLE_PLACES_UNAVAILABLE
  - GOOGLE_POLICY_VIOLATION
  - CANDIDATE_NOT_REVIEWABLE
  - FORBIDDEN
```

---

## UI Behaviour

### `/admin/poi-acquisition`

- Liste des runs avec City, Category, statut, nombre de candidats, nombre publiés, nombre à revoir.
- CTA "Lancer acquisition".

### `/admin/poi-acquisition/runs/{id}`

- Table candidats :
  - nom ;
  - adresse ;
  - source ;
  - statut Google ;
  - statut Mapbox ;
  - doublons probables ;
  - statut review ;
  - actions publier / fusionner / rejeter.
- Un candidat `needs_review` doit afficher pourquoi il n'est pas auto-publiable.

### `/admin/pois/new`

- Formulaire manuel : nom, adresse, ville, catégorie, sous-catégorie, téléphone, site web, description.
- Preview Mapbox du résultat géocodé.
- Alerte doublons probables avant création.
- Confirmation explicite si l'Admin veut créer malgré un doublon probable.

### `/merchant/onboarding`

- Après une recherche sans résultat satisfaisant, afficher "Mon établissement n'apparaît pas".
- Formulaire POI manquant : nom, adresse, téléphone, site web.
- Écran d'attente après soumission.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Run acquisition créé | integration |
| AC-01-02 | Candidats Gemini créés | integration |
| AC-01-03 | Matching Google Places alimente `google_place_id` | integration |
| AC-01-04 | Géocodage Mapbox candidat | integration |
| AC-01-05 | Ambigus/doublons restent en review | integration |
| AC-02-01 | UI admin liste candidats et statuts | integration |
| AC-02-02 | Publication candidat crée POI | integration |
| AC-02-03 | Fusion candidat n'ajoute pas de doublon | integration |
| AC-02-04 | Rejet candidat sans POI public | integration |
| AC-02-05 | Audit validation admin | integration |
| AC-03-01 | Bouton POI manquant onboarding | unit |
| AC-03-02 | MissingPoiRequest créé | integration |
| AC-03-03 | Matching Google demande manquante | integration |
| AC-03-04 | Géocodage Mapbox demande manquante | integration |
| AC-03-05 | Validation admin crée/rattache POI | integration |
| AC-04-01 | Formulaire admin POI validé Zod | contract |
| AC-04-02 | Création admin appelle Mapbox | integration |
| AC-04-03 | POI créé si géocodage fiable | integration |
| AC-04-04 | Géocodage ambigu bloqué ou pending_review | integration |
| AC-04-05 | Doublons probables exigent confirmation | integration |
| AC-04-06 | POI manuel revendicable par Merchant | integration |
| AC-05-01 | Seul `google_place_id` stocké durablement | unit |
| AC-05-02 | Payload Google temporaire expire | integration |
| AC-05-03 | Attribution Google en UI admin | unit |
| AC-05-04 | Public affiche données StayLocal validées | integration |

---

## Out of Scope

- Import massif non supervisé depuis Google Places.
- Copie permanente de Google cards comme contenu public.
- Achat ou gestion de licence de données tierces.
- Randonnées GPX / dénivelé : source spécialisée Overpass / IGN dans une spec dédiée.
- Données temps réel : pharmacies de garde, événements live, disponibilités.
- Réservations et paiements Merchant.

---

## External Service Notes

- Google Places Text Search / Nearby Search peut être utilisé pour trouver des établissements et récupérer un `place_id`.
- Les règles Google Places limitent le préchargement, la mise en cache et le stockage des contenus Places. Le `place_id` est l'identifiant durable prévu pour la réconciliation.
- Toute UI affichant des données Google temporaires doit respecter les règles d'attribution Google.
- Mapbox reste la source de coordonnées stockées dans `PointOfInterest.latitude` et `PointOfInterest.longitude`.

Références :

- Google Places API Text Search: https://developers.google.com/maps/documentation/places/web-service/search-text
- Google Maps Platform Policies: https://developers.google.com/maps/documentation/places/web-service/policies

---

## Open Questions

Aucune question bloquante. Spec prête pour review Product Owner.
