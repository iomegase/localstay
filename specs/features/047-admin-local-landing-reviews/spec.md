# Spec — 047 Admin Local Landing Reviews

## Metadata

```yaml
id: 047-admin-local-landing-reviews
title: "Administration des avis des landing pages locales"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-09-08
updated_at: 2026-09-08
depends_on:
  - 016-dashboard-superadmin
  - 046-local-seo-city-cluster
bounded_context: local-seo
implementation_gate: "Architecture, publication immédiate et absence de confirmation validées par le Product Owner le 2026-09-08"
```

## Context

Les avis voyageurs des landings conciergerie sont actuellement des collections
TypeScript vides. Le Super-admin doit pouvoir les administrer sans déploiement.

## Glossary References

- **City**
- **Local Landing Review**
- **Admin**
- **Soft Delete**

## User Stories

### US-01 — Lister les villes référencées

**As a** Admin
**I want to** ouvrir un onglet Landing pages
**So that** je voie les quatre destinations SEO et leurs avis

#### Acceptance Criteria

- **AC-01-01**: L'entrée `Landing pages` mène à `/admin/landing-pages`.
- **AC-01-02**: La page liste exactement les destinations du catalogue local et
  indique pour chacune son statut de landing conciergerie et son nombre d'avis.

### US-02 — Administrer les avis

**As a** Admin
**I want to** créer, modifier, archiver et restaurer un avis rattaché à une ville
**So that** son contenu public reste à jour

#### Acceptance Criteria

- **AC-02-01**: Un avis valide est créé et publié immédiatement.
- **AC-02-02**: Auteur, texte, date facultative, source, note facultative et ordre
  sont modifiables.
- **AC-02-03**: Une destination inconnue, une note hors 1–5 ou un contenu invalide
  renvoie `VALIDATION_ERROR` sans écriture.
- **AC-02-04**: Archiver renseigne `deleted_at` et masque l'avis ; restaurer remet
  `deleted_at` à `null` et le rend actif.
- **AC-02-05**: Toutes les routes refusent une session non Admin.

### US-03 — Afficher les avis publics

**As a** visiteur
**I want to** lire les avis de la ville consultée
**So that** je dispose d'éléments de confiance pertinents

#### Acceptance Criteria

- **AC-03-01**: La landing charge au plus trois avis actifs et non supprimés de
  son slug, triés par `sort_order` puis `created_at`.
- **AC-03-02**: La section reste absente sans avis.
- **AC-03-03**: Chaque mutation revalide `/conciergerie/[city-slug]`.
- **AC-03-04**: Aucun avis n'est ajouté au JSON-LD.

## Business Rules

- **BR-01**: Les slugs autorisés sont ceux du catalogue de la spec 046.
- **BR-02**: Un avis appartient à une destination, jamais à un logement.
- **BR-03**: La publication est immédiate, sans statut brouillon.
- **BR-04**: Aucune confirmation supplémentaire n'est demandée à l'Admin.
- **BR-05**: `author` contient 2 à 80 caractères et `quote` 10 à 1200 caractères.
- **BR-06**: `rating` est facultatif et, lorsqu'il existe, vaut un entier de 1 à 5.
- **BR-07**: `source` vaut `AIRBNB` ou `DIRECT`.
- **BR-08**: `sort_order` est un entier compris entre 0 et 9999.
- **BR-09**: La query publique exclut toujours `deleted_at != null` et
  `is_active = false`, puis limite le résultat à trois.
- **BR-10**: Aucune suppression physique n'est autorisée.
- **BR-11**: Aucun scraping ou import Airbnb n'est réalisé.

## Data Model

```prisma
enum LocalLandingReviewSource {
  AIRBNB
  DIRECT
}

model LocalLandingReview {
  id               String                   @id @default(uuid())
  created_at       DateTime                 @default(now())
  updated_at       DateTime                 @updatedAt
  deleted_at       DateTime?
  destination_slug String
  author           String
  quote            String
  stay_date        String?
  source           LocalLandingReviewSource
  rating           Int?
  sort_order       Int                      @default(0)
  is_active        Boolean                  @default(true)

  @@index([destination_slug, deleted_at, is_active, sort_order, created_at])
}
```

## API Contract

```yaml
openapi: 3.1.0
paths:
  /api/admin/landing-page-reviews:
    get:
      responses:
        '200': { description: Destinations et avis }
        '403': { description: Accès refusé }
    post:
      requestBody: { required: true }
      responses:
        '201': { description: Avis publié }
        '400': { description: VALIDATION_ERROR }
        '403': { description: Accès refusé }
  /api/admin/landing-page-reviews/{id}:
    patch:
      responses:
        '200': { description: Avis mis à jour }
        '400': { description: VALIDATION_ERROR }
        '404': { description: NOT_FOUND }
    delete:
      responses:
        '200': { description: Avis archivé }
        '404': { description: NOT_FOUND }
  /api/admin/landing-page-reviews/{id}/restore:
    post:
      responses:
        '200': { description: Avis restauré }
        '404': { description: NOT_FOUND }
```

Toutes les erreurs ont la forme `{ "error": { "code", "message", "details" } }`.

## UI Behaviour

- `/admin/landing-pages` est protégé comme les autres pages Admin.
- La liste des villes provient du catalogue SEO local partagé.
- Le formulaire est utilisable dès 375 px et permet création ou édition.
- Les actions `Modifier`, `Archiver` et `Restaurer` rafraîchissent les données.
- Une landing non publiée peut recevoir des avis préparatoires, sans rendre la
  landing accessible publiquement.

## Acceptance Criteria

Les critères AC-01-01 à AC-03-04 sont tous couverts par les tests unitaires,
contractuels et d'intégration associés.

## Out of Scope

- Avis rattachés à un logement.
- Import ou synchronisation Airbnb.
- Workflow brouillon/relecture.
- Confirmation juridique ou consentement dans le formulaire.
- Agrégat de notes et JSON-LD `Review`/`AggregateRating`.
- Édition des textes SEO des landings.

## Open Questions

Aucune question ouverte.

