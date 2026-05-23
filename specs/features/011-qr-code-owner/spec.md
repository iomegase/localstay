# Spec — 011 QR Code Owner

## Metadata

```yaml
id: 011-qr-code-owner
title: "QR code personnalisé par logement"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-05-23
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
- **AC-01-03**: Given un QR code existant, When l'Owner clique "Régénérer" et confirme, Then un nouveau QR code est généré, l'ancien reçoit `deleted_at = now()` et `is_active = false`

### US-02 — Tracker les scans

**As an** Owner
**I want to** savoir combien de fois mon QR code a été scanné
**So that** je mesure l'engagement des Tourists

#### Acceptance Criteria

- **AC-02-01**: Given un scan du QR code avec `?lodging=[id]`, When la page guide charge, Then un événement `qr_scan` est enregistré dans `Analytics` avec le `lodging_id` — via la route serveur `GET /api/guide/[city-slug]` qui insère l'événement côté serveur si le paramètre `lodging` est présent
- **AC-02-02**: Given le dashboard stats, When l'Owner consulte les stats par logement, Then le nombre de scans par logement est affiché (déjà couvert par spec 010 AC-02-01)

---

## Business Rules

- **BR-01**: 1 QR code actif (`is_active = true`, `deleted_at = null`) maximum par Lodging à tout moment
- **BR-02**: Le QR code est stocké dans Supabase Storage, URL publique, path `qr-codes/lodgings/[lodging-id].png`
- **BR-03**: Le paramètre `?lodging=[id]` est utilisé uniquement pour le tracking — il ne change pas le contenu du guide en MVP 2
- **BR-04**: La génération est côté serveur (API route) — jamais côté client
- **BR-05**: Un Owner ne peut générer que les QR codes de ses propres logements
- **BR-06**: `uploadQrToStorage` accepte un `lodgingId` optionnel — path Storage : `qr-codes/cities/[slug].png` (existant) ou `qr-codes/lodgings/[id].png` (nouveau)

---

## Data Model

```prisma
// Schéma QrCode existant — aucune modification requise (Gap-1 décision A).
// city_id String non-nullable pour QR codes ville (lodging_id = null)
// lodging_id String? non-null pour QR codes logement (city_id = city du logement)
// deleted_at DateTime? — soft delete (ADR-004)
// is_active Boolean — false quand archivé lors d'une régénération
model QrCode {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  city_id     String
  city        City      @relation(fields: [city_id], references: [id])
  lodging_id  String?
  lodging     Lodging?  @relation(fields: [lodging_id], references: [id])
  url         String
  storage_url String
  is_active   Boolean   @default(true)
}
```

---

## API Contract

> Authentification : session Supabase par cookie, gérée par `proxy.ts`.
> Les routes dashboard lisent la session via `getSessionOwner()`.

```yaml
paths:
  /api/dashboard/lodgings/{id}/qr-code:
    get:
      summary: "Récupérer le QR code actif d'un logement"
      tags: [qr-code-owner]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: QR code actif du logement
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/QrCodeResult"
        "404":
          description: Logement introuvable ou pas de QR code actif
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
    post:
      summary: "Générer ou régénérer le QR code d'un logement"
      tags: [qr-code-owner]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "201":
          description: QR code généré
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/QrCodeResult"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          description: Logement introuvable ou n'appartient pas à cet Owner
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /api/guide/{city-slug}:
    get:
      summary: "Page guide — enregistre un qr_scan si ?lodging est présent"
      tags: [guide, analytics]
      parameters:
        - name: city-slug
          in: path
          required: true
          schema: { type: string }
        - name: lodging
          in: query
          required: false
          schema: { type: string, format: uuid }
          description: "Si présent, enregistre un événement qr_scan dans Analytics pour ce lodging_id"

components:
  schemas:
    QrCodeResult:
      type: object
      required: [id, lodging_id, city_id, url, storage_url, created_at]
      properties:
        id: { type: string }
        lodging_id: { type: string }
        city_id: { type: string }
        url: { type: string }
        storage_url: { type: string }
        created_at: { type: string, format: date-time }

    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code: { type: string }
            message: { type: string }

  responses:
    Unauthorized:
      description: Non authentifié
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Forbidden:
      description: Rôle insuffisant
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
```

---

## UI Behaviour

### Page `/dashboard/lodgings/[id]/qr-code`
- Aperçu du QR code (image centrée, `<img src={storage_url}>`)
- URL encodée affichée en clair sous l'image
- Bouton "Télécharger PNG" — déclenche un téléchargement du fichier via `storage_url`
- Bouton "Régénérer" — ouvre un `<Dialog>` Shadcn de confirmation avant d'appeler POST
- Date de génération (`created_at`)
- Compteur de scans (7 derniers jours) — affiché si disponible
- État vide : si pas de QR code, seul un bouton "Générer le QR code" est affiché

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | QR code généré avec URL correcte | contract |
| AC-01-02 | Téléchargement PNG 1000×1000px | unit |
| AC-01-03 | Régénération archive l'ancien (deleted_at + is_active=false) | contract |
| AC-02-01 | Scan enregistré dans Analytics via page guide côté serveur | contract |
| AC-02-02 | Stats scans par logement — couvert par spec 010 | — |

---

## Out of Scope

- QR code avec branding personnalisé (logo Owner) — post-MVP
- QR code avec contenu personnalisé par logement (spec 012)

---

## Open Questions

Aucune — spec complète et approuvée.
