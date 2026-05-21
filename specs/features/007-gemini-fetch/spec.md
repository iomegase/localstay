# Spec — 007 Gemini Fetch

## Metadata

```yaml
id: 007-gemini-fetch
title: "Récupération et structuration des données POI via Gemini API"
status: draft
mvp: 1
owner: ""
created_at: 2026-05-20
updated_at: 2026-05-20
depends_on: [001-city-guide, 002-categories]
```

---

## Context

Gemini a exactement deux responsabilités dans StayLocal :

1. **Découverte** — trouver et lister tous les POI existants pour une City et une Category donnée (restaurants, randonnées, commerces, activités, services, etc.)
2. **Descriptif** — générer le texte de description de chaque POI (présentation, ambiance, conseils, spécificités locales)

Gemini ne calcule pas de distances, ne fournit pas de tracés GPX, ne géocode pas et ne gère pas de données temps réel. Ces responsabilités appartiennent à des services spécialisés (Mapbox, IGN, Overpass).

Les résultats sont mis en cache en base de données par City + Category selon une durée variable (Cache TTL). Ce mécanisme garantit la fraîcheur des données tout en maîtrisant les coûts API.

Voir `docs/DAT/adr/ADR-006-trails-data-source.md` pour la décision complète.

---

## Glossary References

- **Gemini Fetch** : action de récupérer et structurer les POI via Gemini API
- **Cache TTL** : durée de validité d'un résultat Gemini en base
- **POI** : point d'intérêt structuré issu du résultat Gemini
- **City** : périmètre géographique de la requête Gemini

---

## User Stories

### US-01 — Récupération automatique des POI

**As a** System
**I want to** interroger Gemini pour une City + Category
**So that** les POI sont disponibles et à jour en base de données

#### Acceptance Criteria

- **AC-01-01**: Given une City + Category sans cache valide, When un Tourist accède à cette section, Then un Gemini Fetch est déclenché automatiquement
- **AC-01-02**: Given un Gemini Fetch réussi, When les résultats arrivent, Then les POI sont structurés et persistés en base selon le modèle `PointOfInterest`
- **AC-01-03**: Given un cache valide (TTL non expiré), When un Tourist accède à la section, Then aucun Gemini Fetch n'est déclenché — les données en cache sont retournées

### US-02 — Qualité et filtrage des résultats

**As a** System
**I want to** filtrer les résultats Gemini selon des critères de qualité
**So that** seuls les meilleurs POI sont présentés aux Tourists

#### Acceptance Criteria

- **AC-02-01**: Given un résultat Gemini, When il est traité, Then les établissements fermés définitivement sont exclus
- **AC-02-02**: Given un résultat Gemini, When il est traité, Then les doublons (même nom + adresse) sont dédupliqués
- **AC-02-03**: Given un résultat Gemini, When il est traité, Then seuls les POI avec au minimum un nom et une adresse sont persistés
- **AC-02-04**: Given un résultat Gemini, When il est traité, Then les POI hors périmètre géographique de la City sont exclus

### US-03 — Gestion du cache

**As a** System
**I want to** gérer le TTL du cache par catégorie
**So that** les données sensibles (pharmacies de garde, événements) sont toujours fraîches

#### Acceptance Criteria

- **AC-03-01**: Given un GeminiCache expiré, When il est détecté, Then un nouveau Gemini Fetch est déclenché en arrière-plan
- **AC-03-02**: Given un Gemini Fetch en cours, When un second Tourist accède à la même section, Then il reçoit les données en cache (même expirées) pendant que le fetch se termine — pas de double fetch
- **AC-03-03**: Given un Gemini Fetch échoué, When l'erreur est détectée, Then les données expirées restent servies et l'erreur est loggée — pas de page blanche

---

## Business Rules

- **BR-01**: Le Gemini Fetch est déclenché côté serveur uniquement (Server Action ou API route) — jamais côté client
- **BR-02**: Le prompt Gemini est versionné en base de données (`GeminiPromptVersion`) pour traçabilité
- **BR-03**: La réponse Gemini doit être au format JSON strict — si le parsing échoue, le cache existant est conservé
- **BR-04**: Un lock optimiste empêche les double-fetch simultanés pour la même City + Category
- **BR-05**: Les TTL par catégorie sont définis dans la table `CacheTtlConfig` (configurable par l'admin)
- **BR-06**: Maximum 20 POI retournés par Gemini Fetch par City + Category

---

## Data Model

```prisma
model GeminiCache {
  id              String          @id @default(uuid())
  created_at      DateTime        @default(now())
  updated_at      DateTime        @updatedAt

  city_id         String
  city            City            @relation(fields: [city_id], references: [id])
  category_id     String
  category        Category        @relation(fields: [category_id], references: [id])

  fetched_at      DateTime        @default(now())
  expires_at      DateTime
  is_fetching     Boolean         @default(false)  # lock anti-double-fetch
  fetch_error     String?

  poi_id          String?         @unique
  poi             PointOfInterest? @relation(fields: [poi_id], references: [id])

  prompt_version  String          # version du prompt utilisé
  raw_response    Json?           # réponse brute Gemini (debug)

  @@unique([city_id, category_id])
}

model CacheTtlConfig {
  id              String   @id @default(uuid())
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  category_slug   String   @unique
  ttl_hours       Int      # durée de cache en heures
  description     String?
}
```

---

## API Contract

```yaml
paths:
  /api/internal/gemini-fetch:
    post:
      summary: "Déclencher un Gemini Fetch pour une City + Category"
      description: "Route interne — appelée par cron ou par la route publique si cache expiré"
      tags: [gemini-fetch]
      security:
        - internalToken: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [city_id, category_id]
              properties:
                city_id:
                  type: string
                category_id:
                  type: string
                force_refresh:
                  type: boolean
                  default: false
      responses:
        "200":
          description: Fetch déclenché ou cache valide retourné
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: "#/components/schemas/GeminiFetchResult"
        "409":
          description: Fetch déjà en cours pour cette City + Category
        "500":
          $ref: "#/components/responses/InternalError"

components:
  schemas:
    GeminiFetchResult:
      type: object
      required: [status, poi_count]
      properties:
        status:
          type: string
          enum: [fetched, cached, error]
        poi_count:
          type: integer
        expires_at:
          type: string
          format: date-time
        error:
          type: string
          nullable: true
```

---

## Prompt Gemini — Structure attendue

Le prompt envoyé à Gemini doit produire une réponse JSON stricte.

**Gemini est interrogé pour DEUX choses uniquement :**
- Lister tous les POI existants de la catégorie dans la ville
- Générer une description pour chaque POI

**Gemini ne doit PAS être interrogé pour :** coordonnées GPS précises, dénivelé, distance calculée, tracé GPX, données temps réel. Ces champs sont soit enrichis par d'autres services, soit laissés null.

```
Tu es un expert local de la ville de {city_name} ({postal_code}), France.

Ta mission est de DEUX types :
1. Lister TOUS les établissements existants de la catégorie "{category_name}" dans cette ville et ses alentours ({radius_km} km).
   Ne filtre pas selon ta préférence — liste exhaustivement ce qui existe réellement.
2. Pour chaque établissement, rédiger une description courte (2-3 phrases) en français,
   mettant en valeur ce qui le rend unique, son ambiance, ses spécialités.

Critères de liste :
- Établissements réellement existants et actifs
- Dans un rayon de {radius_km} km du centre de {city_name}
- Sans doublons
- Sans établissements définitivement fermés

Format de réponse STRICT (JSON uniquement, aucun texte avant ou après) :
{
  "pois": [
    {
      "name": "string",
      "address": "string",
      "phone": "string | null",
      "website": "string | null",
      "description": "string — 2 à 3 phrases rédigées, ton local et chaleureux",
      "subcategory": "string | null",
      "hours": { "mon": "09:00-19:00", "tue": "09:00-19:00", ... } | null,
      "tags": ["tag1", "tag2"]
    }
  ]
}

NE PAS inclure : latitude, longitude, rating, rating_count, photos.
Ces données sont gérées par d'autres services.
```

---

## Mockup de référence

> Placer les fichiers HTML dans `docs/DAT/diagrams/mockups/007-gemini-fetch/`
> Référencer chaque mockup dans la section UI Behaviour ci-dessous.

## UI Behaviour

> Gemini Fetch est un processus serveur invisible pour le Tourist.
> L'UI perçoit uniquement le résultat via le loading state de la liste POI (spec 003).

### Indicateur de fraîcheur (admin uniquement)

- Date du dernier Gemini Fetch par City + Category
- Statut : frais / expiré / en cours / erreur
- Bouton "Forcer le refresh"

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Fetch déclenché si cache absent ou expiré | integration |
| AC-01-02 | POI structurés et persistés en base | integration |
| AC-01-03 | Cache valide → pas de fetch | unit |
| AC-02-01 | Établissements fermés exclus | unit |
| AC-02-02 | Doublons dédupliqués | unit |
| AC-02-03 | POI sans nom ou adresse exclus | unit |
| AC-02-04 | POI hors périmètre exclus | unit |
| AC-03-01 | Cache expiré → nouveau fetch déclenché | integration |
| AC-03-02 | Pas de double fetch simultané | integration |
| AC-03-03 | Fetch échoué → cache expiré servi | integration |

---

## Out of Scope

- Interface de configuration du prompt par l'admin (MVP 2+)
- Enrichissement des POI via Google Places API (MVP 2+)
- Fetch déclenché manuellement par le Merchant (MVP 3+)

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | Utiliser `gemini-1.5-pro` ou `gemini-1.5-flash` pour les fetches ? (coût vs qualité) | owner | - | pending |
| OQ-02 | Faut-il un cron job de pré-fetch des catégories populaires ou uniquement du fetch à la demande ? | owner | - | pending |
| OQ-03 | Radius géographique par défaut : 5km, 10km ou variable selon taille de la ville ? | owner | - | pending |
