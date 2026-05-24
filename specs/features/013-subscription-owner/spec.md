# Spec — 013 Subscription Owner

## Metadata

```yaml
id: 013-subscription-owner
title: "Abonnement Owner — trial et plans indicatifs"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-05-24
depends_on: [009-auth-owner, 010-dashboard-owner]
```

---

## Context

En MVP 2, tous les abonnements Owner sont en `trial` gratuit 12 mois. Cette spec informe l'Owner sur son plan actuel, sa date de fin de période gratuite et les offres commerciales envisagées.

La monétisation réelle n'est pas activée dans cette spec : aucun Checkout Stripe, aucun Customer Portal, aucun webhook et aucun appel API Stripe ne sont exécutés en MVP 2. Les plans affichés sont un tableau statique typé côté code, avec prix indicatifs non contractuels.

---

## Glossary References

- **Subscription** : abonnement Owner avec plan, statut et dates
- **Plan** : offre tarifaire indicative (`discovery` | `basic` | `pro` | `concierge`)
- **Trial** : période gratuite de 12 mois à partir de l'inscription
- **Stripe Customer Portal** : portail Stripe futur pour gérer son abonnement, hors MVP 2

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

- **AC-02-01**: Given la page abonnement, When l'Owner consulte les plans, Then il voit une grille tarifaire statique : Découverte (gratuit), Basic (9-19€/logement), Pro (29-49€/logement), Conciergerie (99-299€), avec mention "prix indicatifs non contractuels"
- **AC-02-02**: Given un Owner cliquant "Choisir ce plan", When il est en `trial`, Then un message l'informe que la facturation démarrera à la fin de la période gratuite — aucun paiement immédiat

---

## Business Rules

- **BR-01**: En MVP 2, aucun paiement n'est déclenché.
- **BR-02**: Aucun appel Stripe n'est effectué en MVP 2 : pas de Checkout, pas de Customer Portal, pas de webhook, pas de création de Customer Stripe.
- **BR-03**: `trial_ends_at` = date d'inscription + 12 mois — calculé à l'inscription (spec 009)
- **BR-04**: Quand `trial_ends_at` est dépassé, le statut passe automatiquement à `past_due` (cron job)
- **BR-05**: Le bouton "Gérer ma facturation" est désactivé en MVP 2 et n'appelle aucune route Stripe.
- **BR-06**: Les plans affichés sont définis dans un tableau statique typé côté code, pas en base.
- **BR-07**: Les prix affichés sont indicatifs et non contractuels tant qu'une spec billing dédiée n'est pas approuvée.

---

## Data Model

```prisma
// Existing model from 009-auth-owner.
model Subscription {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  user_id       String
  user          User     @relation(fields: [user_id], references: [id])
  plan          String   @default("trial")
  status        String   @default("trial") // trial | active | past_due | cancelled
  trial_ends_at DateTime
  started_at    DateTime @default(now())
  ends_at       DateTime?
}
```

### Static Owner Plan Catalog

Les plans affichés sur `/dashboard/subscription` sont déclarés côté code dans un tableau typé, par exemple `src/features/subscription-owner/plans.ts`.

```ts
type OwnerPlanDisplay = {
  slug: 'discovery' | 'basic' | 'pro' | 'concierge'
  name: string
  price_label: string
  price_disclaimer: 'indicative_non_contractual'
  features: string[]
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
      summary: "Liste statique des plans indicatifs Owner"
      tags: [subscription]
      responses:
        "200":
          description: Plans indicatifs disponibles pour les Owners
        "401":
          description: Non authentifié
        "403":
          description: Réservé au rôle Owner

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
    OwnerPlanDisplay:
      type: object
      required: [slug, name, price_label, price_disclaimer, features]
      properties:
        slug:
          type: string
          enum: [discovery, basic, pro, concierge]
        name:
          type: string
        price_label:
          type: string
          description: "Prix indicatif non contractuel"
        price_disclaimer:
          type: string
          enum: [indicative_non_contractual]
        features:
          type: array
          items:
            type: string
```

---

## Infrastructure

Le cron de détection des trials expirés est centralisé dans `vercel.json` :

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

Tous les jours à 9h, il vérifie les `Subscription` dont `trial_ends_at < now` et `status = trial`, puis les passe à `past_due`.

---

## UI Behaviour

### Page `/dashboard/subscription`
- Card Shadcn : plan actif + badge statut (`Trial` en vert)
- Barre de progression : jours restants / 365
- Message : "Votre accès gratuit se termine le [date]"
- Grille tarifaire indicative (3 colonnes desktop, 1 mobile) avec Shadcn Card
- Mention visible : "Prix indicatifs non contractuels"
- Bouton "Choisir ce plan" → Dialog d'information (pas de paiement en MVP 2)
- Bouton "Gérer ma facturation" → désactivé en MVP 2

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Page abonnement affiche plan + statut + date | integration |
| AC-01-02 | Message "Gratuit jusqu'au [date]" avec jours restants | unit |
| AC-02-01 | Grille tarifaire indicative statique affichée | unit |
| AC-02-02 | Clic "Choisir plan" → message informatif, pas de paiement | unit |

---

## Out of Scope

- Paiement Stripe réel (MVP 3+)
- Stripe Customer Portal actif (MVP 3+)
- Checkout Stripe, webhooks Stripe, Customer Stripe
- Tables `Plan` et `PlanFeature`
- Abonnement Merchant : future spec billing merchant dédiée

---

## Open Questions

Aucune — spec prête pour validation Product Owner.
