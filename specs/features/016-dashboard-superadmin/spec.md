# Spec — 016 Dashboard Super-Admin

## Metadata

```yaml
id: 016-dashboard-superadmin
title: "Dashboard Super-Admin — Shadcn/ui"
status: draft
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-05-22
depends_on: [009-auth-owner, 010-dashboard-owner, 014-auth-merchant, 007-gemini-fetch, 008-mapbox-geocoding]
```

---

## Context

Le Super-Admin (équipe StayLocal) dispose d'un dashboard complet pour piloter toute la plateforme : gestion des villes, validation des revendications Merchant, modération des fiches, configuration Gemini, suivi des abonnements et statistiques globales. C'est l'espace `/admin/*`, accessible uniquement au rôle `admin`.

---

## Glossary References

- **Admin** : membre de l'équipe StayLocal avec accès complet à `/admin`
- **MerchantClaim** : demande de revendication d'un POI par un Merchant
- **GeminiCache** : cache des résultats Gemini par City + Category
- **CacheTtlConfig** : configuration des durées de cache par catégorie

---

## User Stories

### US-01 — Vue globale de la plateforme

**As a** Super-Admin
**I want to** voir les métriques clés de la plateforme
**So that** je pilote la croissance et détecte les anomalies

#### Acceptance Criteria

- **AC-01-01**: Given la page `/admin`, When l'Admin y accède, Then il voit : nombre de villes actives, Owners inscrits, Merchants validés, Tourists (scans QR 30j), abonnements actifs, revenus (0€ en trial)
- **AC-01-02**: Given le dashboard, When il charge, Then un graphique Recharts affiche les scans QR par jour sur 30 jours toutes villes confondues

### US-02 — Gestion des villes

**As a** Super-Admin
**I want to** gérer les villes référencées
**So that** je contrôle le déploiement géographique

#### Acceptance Criteria

- **AC-02-01**: Given la page `/admin/cities`, When l'Admin la consulte, Then il voit la liste des villes avec : nom, CP, nb POI zone primaire (≤15km), nb POI alentours (15-30km), nb QR scans, statut cache Gemini
- **AC-02-02**: Given une ville, When l'Admin clique "Forcer le refresh Gemini", Then un nouveau Gemini Fetch est déclenché pour toutes les catégories de cette ville
- **AC-02-03**: Given le formulaire d'ajout, When l'Admin crée une nouvelle ville, Then la ville est créée et le QR code généré automatiquement

### US-03 — Validation des revendications Merchant

**As a** Super-Admin
**I want to** valider ou rejeter les demandes de revendication de fiches
**So that** chaque Merchant est bien associé à son établissement réel

#### Acceptance Criteria

- **AC-03-01**: Given la page `/admin/claims`, When l'Admin la consulte, Then il voit la liste des revendications `pending` avec : nom du Merchant, POI revendiqué, date de demande
- **AC-03-02**: Given une revendication, When l'Admin clique "Valider", Then le POI est rattaché au Merchant et il reçoit un email de confirmation
- **AC-03-03**: Given une revendication, When l'Admin clique "Rejeter" avec un motif, Then le Merchant reçoit un email avec le motif de refus

### US-04 — Configuration Gemini et cache

**As a** Super-Admin
**I want to** configurer les règles Gemini et les durées de cache
**So that** je maîtrise les coûts et la fraîcheur des données

#### Acceptance Criteria

- **AC-04-01**: Given la page `/admin/config/gemini`, When l'Admin modifie le TTL d'une catégorie, Then la nouvelle durée est appliquée aux prochains fetches
- **AC-04-02**: Given le tableau de bord cache, When l'Admin le consulte, Then il voit pour chaque City + Category : date du dernier fetch, statut (frais/expiré/en cours/erreur), TTL configuré

### US-05 — Gestion des utilisateurs

**As a** Super-Admin
**I want to** gérer les comptes utilisateurs
**So that** je peux désactiver un compte ou changer un rôle

#### Acceptance Criteria

- **AC-05-01**: Given la page `/admin/users`, When l'Admin la consulte, Then il voit la liste des utilisateurs avec : email, rôle, statut abonnement, date d'inscription
- **AC-05-02**: Given un utilisateur, When l'Admin clique "Désactiver", Then le compte est désactivé (soft delete) et l'utilisateur ne peut plus se connecter

---

## Business Rules

- **BR-01**: Seul le rôle `admin` accède à `/admin/*` — middleware strict
- **BR-02**: Le Super-Admin ne peut pas se supprimer lui-même
- **BR-03**: Les actions admin sont loggées (table `AdminLog`) pour audit
- **BR-04**: La configuration Gemini (TTL, prompts) est modifiable sans déploiement
- **BR-05**: Le dashboard Super-Admin est desktop-first (pas d'usage mobile prévu)

---

## Data Model

```prisma
model AdminLog {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())

  admin_id    String
  admin       User     @relation(fields: [admin_id], references: [id])
  action      String   # claim_approved | claim_rejected | city_created | user_disabled | cache_refreshed | ...
  target_type String   # user | city | poi | claim | subscription
  target_id   String
  metadata    Json?
}
```

---

## API Contract

```yaml
paths:
  /api/admin/overview:
    get:
      summary: "Métriques globales de la plateforme"
      tags: [superadmin]
      security:
        - bearerAuth: []

  /api/admin/cities:
    get:
      summary: "Liste des villes"
      tags: [superadmin]
      security:
        - bearerAuth: []
    post:
      summary: "Créer une ville"
      tags: [superadmin]
      security:
        - bearerAuth: []

  /api/admin/cities/{slug}/refresh:
    post:
      summary: "Forcer le refresh Gemini d'une ville"
      tags: [superadmin]
      security:
        - bearerAuth: []

  /api/admin/claims:
    get:
      summary: "Liste des revendications pending"
      tags: [superadmin]
      security:
        - bearerAuth: []

  /api/admin/claims/{id}/approve:
    post:
      summary: "Valider une revendication"
      tags: [superadmin]
      security:
        - bearerAuth: []

  /api/admin/claims/{id}/reject:
    post:
      summary: "Rejeter une revendication"
      tags: [superadmin]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [reason]
              properties:
                reason:
                  type: string

  /api/admin/config/gemini:
    get:
      summary: "Configuration TTL par catégorie"
      tags: [superadmin]
      security:
        - bearerAuth: []
    put:
      summary: "Mettre à jour les TTL"
      tags: [superadmin]
      security:
        - bearerAuth: []

  /api/admin/users:
    get:
      summary: "Liste des utilisateurs"
      tags: [superadmin]
      security:
        - bearerAuth: []

  /api/admin/users/{id}/disable:
    post:
      summary: "Désactiver un compte"
      tags: [superadmin]
      security:
        - bearerAuth: []
```

---

## Infrastructure

```json
{
  "crons": [
    {
      "path": "/api/internal/check-subscriptions",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/internal/geocode-pois",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## UI Behaviour

### Layout `/admin`
- Sidebar desktop Shadcn/ui — navigation complète
- Navigation : Vue globale · Villes · Revendications · Utilisateurs · Config Gemini · Abonnements · Logs

### Page `/admin` — Overview
- 6 KPI cards Shadcn : villes, owners, merchants, scans 30j, abonnements, revenus
- Graphique Recharts scans 30j
- Table "Dernières revendications pending" (5 entrées)

### Page `/admin/claims`
- Table Shadcn/ui avec colonnes : Merchant, POI, Ville, Date demande, Actions
- Boutons "Valider" (vert) / "Rejeter" (rouge) + Dialog motif de refus
- Badge compteur en rouge dans la sidebar si revendications pending

### Page `/admin/config/gemini`
- Table éditable : Catégorie | TTL actuel | Dernier fetch | Statut
- Input TTL inline éditable
- Bouton "Forcer refresh" par ligne

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Overview affiche 6 KPI corrects | integration |
| AC-01-02 | Graphique scans 30j | unit |
| AC-02-01 | Liste villes avec statut cache | integration |
| AC-02-02 | Refresh Gemini déclenché | integration |
| AC-02-03 | Création ville + QR code auto | integration |
| AC-03-01 | Liste revendications pending | integration |
| AC-03-02 | Validation → POI rattaché + email | integration |
| AC-03-03 | Rejet → email avec motif | integration |
| AC-04-01 | Modification TTL appliquée | integration |
| AC-04-02 | Tableau cache par City + Category | integration |
| AC-05-01 | Liste utilisateurs avec filtres | integration |
| AC-05-02 | Désactivation compte fonctionne | integration |

---

## Out of Scope

- Modération des avis Tourists (MVP 3)
- Gestion des paiements Stripe réels (MVP 3+)
- Logs d'audit consultables (post-MVP)
- Impersonation d'un utilisateur (post-MVP)

---

## Open Questions

Aucune — spec complète et prête pour review.
