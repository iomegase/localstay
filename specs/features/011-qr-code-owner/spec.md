# Spec — 011 QR Code Owner

## Metadata

```yaml
id: 011-qr-code-owner
title: "QR code personnalisé par logement"
status: draft
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-05-22
depends_on: [006-qr-code, 010-dashboard-owner]
```

---

## Context

En MVP 1, un seul QR code est généré par ville par l'admin. En MVP 2, chaque Owner peut générer un QR code par logement depuis son dashboard. Le QR code encode l'URL `/guide/[city-slug]?lodging=[lodging-id]` permettant de tracker les scans par logement. L'Owner peut télécharger et imprimer son QR code.

---

## Glossary References

- **QR Code** : code QR lié à un Lodging, encode l'URL du guide avec le `lodging_id`
- **Lodging** : logement de l'Owner auquel le QR code est rattaché
- **Map Load** : le QR code ne déclenche pas de Map Load supplémentaire

---

## User Stories

### US-01 — Générer un QR code par logement

**As an** Owner
**I want to** générer un QR code pour chaque logement
**So that** je peux tracker les scans par logement et offrir une expérience personnalisée

#### Acceptance Criteria

- **AC-01-01**: Given un Lodging sans QR code, When l'Owner clique "Générer le QR code", Then un QR code PNG est généré encodant `https://[domain]/guide/[city-slug]?lodging=[lodging-id]`
- **AC-01-02**: Given un QR code généré, When l'Owner clique "Télécharger", Then un fichier PNG 1000×1000px minimum est téléchargé
- **AC-01-03**: Given un QR code existant, When l'Owner clique "Régénérer" et confirme, Then un nouveau QR code est généré et l'ancien est archivé

### US-02 — Tracker les scans

**As an** Owner
**I want to** savoir combien de fois mon QR code a été scanné
**So that** je mesure l'engagement des Tourists

#### Acceptance Criteria

- **AC-02-01**: Given un scan du QR code avec `?lodging=[id]`, When la page guide charge, Then un événement `qr_scan` est enregistré dans `Analytics` avec le `lodging_id`
- **AC-02-02**: Given le dashboard stats, When l'Owner consulte les stats par logement, Then le nombre de scans par logement est affiché

---

## Business Rules

- **BR-01**: 1 QR code actif maximum par Lodging à tout moment
- **BR-02**: Le QR code est stocké dans Supabase Storage, URL publique
- **BR-03**: Le paramètre `?lodging=[id]` est utilisé uniquement pour le tracking — il ne change pas le contenu du guide en MVP 2
- **BR-04**: La génération est côté serveur (Server Action) — jamais côté client
- **BR-05**: Un Owner ne peut générer que les QR codes de ses propres logements

---

## Data Model

```prisma
model QrCode {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  city_id     String?
  city        City?    @relation(fields: [city_id], references: [id])
  lodging_id  String?
  lodging     Lodging? @relation(fields: [lodging_id], references: [id])
  url         String
  storage_url String
  is_active   Boolean  @default(true)
  type        String   @default("city")  # city | lodging
}
```

---

## API Contract

```yaml
paths:
  /api/dashboard/lodgings/{id}/qr-code:
    post:
      summary: "Générer ou régénérer le QR code d'un logement"
      tags: [qr-code-owner]
      security:
        - bearerAuth: []
    get:
      summary: "Récupérer le QR code d'un logement"
      tags: [qr-code-owner]
      security:
        - bearerAuth: []

components:
  schemas:
    QrCodeResult:
      type: object
      properties:
        id: { type: string }
        lodging_id: { type: string }
        url: { type: string }
        storage_url: { type: string }
        created_at: { type: string, format: date-time }
```

---

## UI Behaviour

### Page `/dashboard/lodgings/[id]/qr-code`
- Aperçu du QR code (image centrée)
- URL encodée affichée en clair
- Bouton "Télécharger PNG"
- Bouton "Régénérer" avec Dialog de confirmation Shadcn
- Date de génération
- Compteur de scans (7 derniers jours)

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | QR code généré avec URL correcte | integration |
| AC-01-02 | Téléchargement PNG 1000×1000px | unit |
| AC-01-03 | Régénération archive l'ancien | integration |
| AC-02-01 | Scan enregistré dans Analytics | integration |
| AC-02-02 | Stats scans par logement affichées | integration |

---

## Out of Scope

- QR code avec branding personnalisé (logo Owner) — post-MVP
- QR code avec contenu personnalisé par logement (spec 012)

---

## Open Questions

Aucune — spec complète et prête pour review.
