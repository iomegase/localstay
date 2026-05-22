# Spec — 013 Subscription Owner

## Metadata

```yaml
id: 013-subscription-owner
title: "Plan d'abonnement et facturation Stripe — Owner"
status: draft
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-05-22
depends_on: [009-auth-owner, 010-dashboard-owner]
```

---

## Context

En MVP 2, tous les abonnements sont en `trial` gratuit 12 mois. La logique métier de monétisation est néanmoins entièrement implémentée en base et dans le code — Stripe est intégré mais aucun paiement n'est déclenché. L'Owner peut consulter son plan actif, voir la date de fin de période gratuite, et accéder à la page de facturation Stripe (Stripe Customer Portal) quand le plan sera activé.

---

## Glossary References

- **Subscription** : abonnement Owner avec plan, statut et dates
- **Plan** : offre tarifaire (`free` | `basic` | `pro` | `concierge`)
- **Trial** : période gratuite de 12 mois à partir de l'inscription
- **Stripe Customer Portal** : portail Stripe pour gérer son abonnement

---

## User Stories

### US-01 — Consulter son abonnement

**As an** Owner
**I want to** voir mon plan actuel et la date de fin de période gratuite
**So that** je sais quand je devrai passer au payant

#### Acceptance Criteria

- **AC-01-01**: Given la page `/dashboard/subscription`, When l'Owner la consulte, Then il voit : plan actif, statut (`trial`), date de fin de période gratuite, fonctionnalités incluses
- **AC-01-02**: Given un Owner en `trial`, When il consulte son abonnement, Then un message indique "Gratuit jusqu'au [date]" avec le nombre de jours restants

### US-02 — Upgrade de plan (logique métier prête)

**As an** Owner
**I want to** voir les plans disponibles et leurs fonctionnalités
**So that** je puisse choisir le bon plan quand la période gratuite se terminera

#### Acceptance Criteria

- **AC-02-01**: Given la page abonnement, When l'Owner consulte les plans, Then il voit la grille tarifaire complète : Découverte (gratuit), Basic (9-19€/logement), Pro (29-49€/logement), Conciergerie (99-299€)
- **AC-02-02**: Given un Owner cliquant "Choisir ce plan", When il est en `trial`, Then un message l'informe que la facturation démarrera à la fin de la période gratuite — aucun paiement immédiat

---

## Business Rules

- **BR-01**: En MVP 2, aucun paiement n'est déclenché — Stripe est intégré mais inactif (`trial`)
- **BR-02**: La table `Subscription` et la table `Plan` existent en base avec toutes les données
- **BR-03**: `trial_ends_at` = date d'inscription + 12 mois — calculé à l'inscription (spec 009)
- **BR-04**: Quand `trial_ends_at` est dépassé, le statut passe automatiquement à `past_due` (cron job)
- **BR-05**: Le Stripe Customer Portal est préparé mais non accessible en MVP 2 (bouton désactivé)
- **BR-06**: Les fonctionnalités autorisées par plan sont définies dans la table `PlanFeature`

---

## Data Model

```prisma
model Plan {
  id            String   @id @default(uuid())
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  slug          String   @unique  # free | basic | pro | concierge
  name          String
  price_monthly Decimal? @db.Decimal(10, 2)
  price_yearly  Decimal? @db.Decimal(10, 2)
  target        String   # owner | merchant
  is_active     Boolean  @default(true)
  stripe_price_id_monthly String?
  stripe_price_id_yearly  String?

  features      PlanFeature[]
}

model PlanFeature {
  id        String  @id @default(uuid())
  plan_id   String
  plan      Plan    @relation(fields: [plan_id], references: [id])
  feature   String  # qr_code_custom | stats | customization | multi_lodging | ...
  enabled   Boolean @default(true)
}
```

---

## API Contract

```yaml
paths:
  /api/dashboard/subscription:
    get:
      summary: "Récupérer l'abonnement actif de l'Owner"
      tags: [subscription]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Abonnement actif
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SubscriptionDetail"

  /api/dashboard/subscription/plans:
    get:
      summary: "Liste des plans disponibles"
      tags: [subscription]
      responses:
        "200":
          description: Plans disponibles pour les Owners

components:
  schemas:
    SubscriptionDetail:
      type: object
      properties:
        plan:
          type: string
        status:
          type: string
        trial_ends_at:
          type: string
          format: date-time
        days_remaining:
          type: integer
        features:
          type: array
          items:
            type: string
```

---

## Infrastructure

Cron job pour détecter les trials expirés :

```json
{
  "crons": [
    {
      "path": "/api/internal/check-subscriptions",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Tous les jours à 9h, vérifie les `Subscription` dont `trial_ends_at < now` et `status = trial` → passe à `past_due`.

---

## UI Behaviour

### Page `/dashboard/subscription`
- Card Shadcn : plan actif + badge statut (`Trial` en vert)
- Barre de progression : jours restants / 365
- Message : "Votre accès gratuit se termine le [date]"
- Grille tarifaire (3 colonnes desktop, 1 mobile) avec Shadcn Card
- Bouton "Choisir ce plan" → Dialog d'information (pas de paiement en MVP 2)
- Bouton "Gérer ma facturation" → désactivé en MVP 2

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Page abonnement affiche plan + statut + date | integration |
| AC-01-02 | Message "Gratuit jusqu'au [date]" avec jours restants | unit |
| AC-02-01 | Grille tarifaire complète affichée | unit |
| AC-02-02 | Clic "Choisir plan" → message informatif, pas de paiement | unit |

---

## Out of Scope

- Paiement Stripe réel (MVP 3+)
- Stripe Customer Portal actif (MVP 3+)
- Abonnement Merchant (spec 016)

---

## Open Questions

Aucune — spec complète et prête pour review.
