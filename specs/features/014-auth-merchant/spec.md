# Spec — 014 Auth Merchant

## Metadata

```yaml
id: 014-auth-merchant
title: "Authentification et onboarding Merchant"
status: draft
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-05-22
depends_on: [009-auth-owner]
```

---

## Context

Les Merchants (restaurateurs, prestataires, spas, loueurs, etc.) accèdent à leur propre espace `/merchant/*`. L'authentification est commune avec les Owners (spec 009 — même table `User`, rôle `merchant`). Cette spec couvre uniquement les spécificités du Merchant : l'onboarding (rattachement à un POI existant) et la revendication de fiche.

---

## Glossary References

- **Merchant** : commerçant local gérant sa fiche POI
- **Claim** : action de revendiquer un POI existant pour le rattacher à son compte Merchant
- **POI** : point d'intérêt que le Merchant revendique et gère

---

## User Stories

### US-01 — Inscription Merchant

**As a** Merchant
**I want to** créer un compte StayLocal
**So that** je gère ma fiche et reçois des réservations

#### Acceptance Criteria

- **AC-01-01**: Given la page `/auth/register` avec rôle `merchant`, When le Merchant soumet ses informations, Then un compte est créé avec le rôle `merchant` et il est redirigé vers `/merchant/onboarding`
- **AC-01-02**: Given la page `/merchant/onboarding`, When le Merchant recherche son établissement par nom ou adresse, Then une liste de POI correspondants s'affiche
- **AC-01-03**: Given un POI trouvé, When le Merchant clique "Revendiquer cet établissement", Then une demande de revendication est créée avec statut `pending`
- **AC-01-04**: Given une revendication `pending`, When l'admin la valide, Then le POI est rattaché au compte Merchant et il accède à `/merchant/dashboard`

---

## Business Rules

- **BR-01**: Un POI ne peut être revendiqué que par un seul Merchant à la fois
- **BR-02**: La revendication nécessite une validation manuelle par l'admin (Super-Admin)
- **BR-03**: En attente de validation, le Merchant voit un écran d'attente — pas d'accès au dashboard
- **BR-04**: Un Merchant peut revendiquer un seul POI en MVP 2 (multi-établissements post-MVP)
- **BR-05**: Un `Subscription` `trial` est créé à l'inscription (même logique que Owner)

---

## Data Model

```prisma
model MerchantClaim {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  merchant_id String
  merchant    User            @relation(fields: [merchant_id], references: [id])
  poi_id      String
  poi         PointOfInterest @relation(fields: [poi_id], references: [id])
  status      String   @default("pending")  # pending | approved | rejected
  admin_note  String?
  reviewed_at DateTime?
  reviewed_by String?
}
```

---

## API Contract

```yaml
paths:
  /api/merchant/onboarding/search:
    get:
      summary: "Rechercher un POI à revendiquer"
      tags: [auth-merchant]
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
            minLength: 3

  /api/merchant/onboarding/claim:
    post:
      summary: "Revendiquer un POI"
      tags: [auth-merchant]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [poi_id]
              properties:
                poi_id:
                  type: string
```

---

## UI Behaviour

### Page `/merchant/onboarding`
- Étape 1 : Recherche du POI (champ autocomplete)
- Étape 2 : Confirmation du POI sélectionné (nom, adresse, catégorie)
- Étape 3 : Confirmation de revendication
- Étape 4 : Écran d'attente "Votre demande est en cours de validation"
- Stepper Shadcn/ui pour les étapes

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Inscription merchant → redirect onboarding | integration |
| AC-01-02 | Recherche POI par nom/adresse fonctionne | integration |
| AC-01-03 | Revendication créée en pending | integration |
| AC-01-04 | Validation admin → accès dashboard merchant | integration |

---

## Out of Scope

- Multi-établissements pour un Merchant (post-MVP)
- Revendication sans POI existant (ajout nouveau commerce) — post-MVP

---

## Open Questions

Aucune — spec complète et prête pour review.
