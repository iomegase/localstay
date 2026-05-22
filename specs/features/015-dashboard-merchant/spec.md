# Spec — 015 Dashboard Merchant

## Metadata

```yaml
id: 015-dashboard-merchant
title: "Dashboard Merchant — Shadcn/ui"
status: draft
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-05-22
depends_on: [014-auth-merchant, 004-poi-detail]
```

---

## Context

Le dashboard Merchant permet au commerçant de gérer sa fiche POI, consulter ses statistiques de visibilité, créer des offres spéciales et gérer son abonnement. Construit avec Shadcn/ui. En MVP 2, les réservations ne sont pas encore actives (MVP 4).

---

## Glossary References

- **Merchant** : commerçant gérant sa fiche via `/merchant`
- **POI** : fiche du Merchant revendiquée et validée
- **Offer** : offre spéciale créée par le Merchant (ex: -10% sur présentation de l'app)

---

## User Stories

### US-01 — Gestion de la fiche

**As a** Merchant
**I want to** modifier les informations de ma fiche
**So that** les Tourists voient des informations à jour

#### Acceptance Criteria

- **AC-01-01**: Given la page `/merchant/profile`, When le Merchant modifie nom, description, horaires, téléphone, site web, Then les changements sont sauvegardés et visibles sur la fiche publique
- **AC-01-02**: Given la fiche, When le Merchant uploade jusqu'à 5 photos, Then elles s'affichent dans le carousel de la fiche POI publique

### US-02 — Statistiques de visibilité

**As a** Merchant
**I want to** voir combien de Tourists ont consulté ma fiche
**So that** je mesure ma visibilité sur la plateforme

#### Acceptance Criteria

- **AC-02-01**: Given la page `/merchant/stats`, When le Merchant la consulte, Then il voit : vues de fiche (30 jours), clics téléphone, clics itinéraire, clics site web
- **AC-02-02**: Given les stats, When elles s'affichent, Then un graphique Recharts montre l'évolution des vues sur 30 jours

### US-03 — Offres spéciales

**As a** Merchant
**I want to** créer des offres spéciales pour les Tourists
**So that** j'attire plus de clients depuis l'application

#### Acceptance Criteria

- **AC-03-01**: Given le formulaire d'offre, When le Merchant crée une offre (titre + description + date de fin), Then l'offre s'affiche sur sa fiche POI publique
- **AC-03-02**: Given une offre expirée, When la date de fin est dépassée, Then l'offre est masquée automatiquement de la fiche publique

---

## Business Rules

- **BR-01**: Un Merchant ne peut modifier que sa propre fiche POI
- **BR-02**: Maximum 5 photos uploadées par Merchant
- **BR-03**: Les photos sont stockées dans Supabase Storage
- **BR-04**: Maximum 3 offres actives simultanément
- **BR-05**: Une offre expirée est masquée mais pas supprimée (soft delete)
- **BR-06**: Les modifications de fiche sont appliquées immédiatement sans validation admin
- **BR-07**: Les statistiques sont calculées depuis les événements `Analytics` — même table que spec 010

---

## Data Model

```prisma
model MerchantOffer {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  poi_id      String
  poi         PointOfInterest @relation(fields: [poi_id], references: [id])
  title       String
  description String
  ends_at     DateTime
  is_active   Boolean  @default(true)
}
```

---

## API Contract

```yaml
paths:
  /api/merchant/profile:
    get:
      summary: "Récupérer la fiche du Merchant"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []
    patch:
      summary: "Modifier la fiche"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []

  /api/merchant/photos:
    post:
      summary: "Uploader une photo"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []

  /api/merchant/stats:
    get:
      summary: "Statistiques de visibilité"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []

  /api/merchant/offers:
    get:
      summary: "Liste des offres actives"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []
    post:
      summary: "Créer une offre spéciale"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []

  /api/merchant/offers/{id}:
    delete:
      summary: "Supprimer une offre (soft delete)"
      tags: [dashboard-merchant]
      security:
        - bearerAuth: []
```

---

## UI Behaviour

### Layout `/merchant`
- Sidebar Shadcn (desktop) + bottom nav (mobile)
- Navigation : Ma fiche · Statistiques · Offres · Mon abonnement

### Page `/merchant/profile`
- Formulaire Shadcn : description, horaires (par jour), téléphone, site web
- Upload photos : drag-and-drop, max 5, preview instantané
- Bouton "Voir ma fiche publique"

### Page `/merchant/stats`
- Cards : vues fiche, clics tel, clics itinéraire, clics web
- Graphique Recharts : vues 30 jours

### Page `/merchant/offers`
- Liste des offres avec statut (active / expirée)
- Formulaire création : titre (60 chars) + description (200 chars) + date de fin
- Badge "Offre spéciale" visible sur la fiche publique

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Modification fiche sauvegardée et visible | integration |
| AC-01-02 | Upload photos visible dans carousel public | integration |
| AC-02-01 | Stats vues, clics téléphone, itinéraire, web | integration |
| AC-02-02 | Graphique Recharts 30 jours | unit |
| AC-03-01 | Offre créée visible sur fiche publique | integration |
| AC-03-02 | Offre expirée masquée automatiquement | unit |

---

## Out of Scope

- Réservations entrantes (MVP 4 — spec 019)
- Abonnement Merchant payant (spec 016)
- Messages clients (MVP 4)
- Réponse aux avis (MVP 3)

---

## Open Questions

Aucune — spec complète et prête pour review.
