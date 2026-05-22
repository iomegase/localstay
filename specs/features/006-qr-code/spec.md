# Spec — 006 QR Code

## Metadata

```yaml
id: 006-qr-code
title: "Génération et scan du QR code"
status: approved
mvp: 1
owner: ""
created_at: 2026-05-20
updated_at: 2026-05-22
depends_on: [001-city-guide]
```

---

## Context

Dans le MVP 1, un QR code est généré par ville. Il est placé physiquement dans les logements touristiques de cette ville. Quand le Tourist le scanne, il est redirigé vers le guide de la ville. Le QR code doit être téléchargeable et imprimable par l'admin ou l'hébergeur. La génération est côté serveur.

---

## Glossary References

- **QR Code** : code QR encodant l'URL `/guide/[city-slug]`
- **City** : ville dont le QR code donne accès au Guide
- **Lodging** : dans le MVP 1, le QR code est lié à la City, pas encore au Lodging

---

## User Stories

### US-01 — Scanner le QR code

**As a** Tourist
**I want to** scanner le QR code affiché dans mon logement
**So that** j'accède instantanément au guide de ma ville

#### Acceptance Criteria

- **AC-01-01**: Given un QR code valide, When le Tourist le scanne, Then il est redirigé vers `/guide/[city-slug]`
- **AC-01-02**: Given la redirection, When elle se produit, Then aucune étape intermédiaire (login, splash) n'est requise
- **AC-01-03**: Given le scan sur iOS ou Android, When la redirection se produit, Then la page s'affiche correctement dans le navigateur natif

### US-02 — Générer le QR code (admin)

**As an** Admin
**I want to** générer le QR code d'une ville
**So that** je puisse le distribuer aux hébergeurs

#### Acceptance Criteria

- **AC-02-01**: Given une City active, When l'admin demande la génération, Then un QR code PNG est généré encodant l'URL `https://[domain]/guide/[city-slug]`
- **AC-02-02**: Given le QR code généré, When l'admin le télécharge, Then le fichier est un PNG 1000×1000px minimum, fond blanc, modules noirs
- **AC-02-03**: Given le QR code généré, When il est imprimé en 10×10cm, Then il reste lisible par tous les scanners standards

---

## Business Rules

- **BR-01**: Dans le MVP 1, 1 QR code = 1 City (pas par logement)
- **BR-02**: L'URL encodée dans le QR code est l'URL de production absolue (`https://domaine.com/guide/[city-slug]`)
- **BR-03**: Le QR code est généré côté serveur (Server Action), pas côté client
- **BR-04**: Le QR code est stocké dans Supabase Storage avec une URL publique
- **BR-05**: Un QR code existant pour une City n'est pas régénéré sauf demande explicite

---

## Data Model

```prisma
model QrCode {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  city_id     String
  city        City     @relation(fields: [city_id], references: [id])
  url         String   # URL encodée dans le QR code
  storage_url String   # URL du PNG dans Supabase Storage
  is_active   Boolean  @default(true)

  @@unique([city_id])
}
```

---

## API Contract

```yaml
paths:
  /api/admin/cities/{slug}/qr-code:
    post:
      summary: "Générer ou régénérer le QR code d'une ville"
      tags: [qr-code]
      security:
        - bearerAuth: []
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: QR code généré avec succès
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: "#/components/schemas/QrCodeResult"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"

    get:
      summary: "Récupérer le QR code existant d'une ville"
      tags: [qr-code]
      security:
        - bearerAuth: []
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: QR code existant
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: "#/components/schemas/QrCodeResult"
        "404":
          $ref: "#/components/responses/NotFound"

components:
  schemas:
    QrCodeResult:
      type: object
      required: [id, city_slug, url, storage_url]
      properties:
        id:
          type: string
        city_slug:
          type: string
        url:
          type: string
          description: URL encodée dans le QR code
        storage_url:
          type: string
          description: URL publique du PNG dans Supabase Storage
        created_at:
          type: string
          format: date-time
```

---

## Mockup de référence

> Placer les fichiers HTML dans `docs/DAT/diagrams/mockups/006-qr-code/`
> Référencer chaque mockup dans la section UI Behaviour ci-dessous.

## UI Behaviour

### Page Admin : gestion QR code d'une ville

- Aperçu du QR code (image)
- Bouton "Télécharger PNG"
- Bouton "Régénérer" (avec confirmation)
- URL encodée affichée en clair
- Date de dernière génération

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Scan → redirection `/guide/[city-slug]` | e2e |
| AC-01-02 | Pas d'étape intermédiaire | e2e |
| AC-01-03 | Rendu correct iOS et Android | e2e |
| AC-02-01 | QR code PNG généré avec bonne URL | integration |
| AC-02-02 | PNG 1000×1000px minimum, fond blanc | unit |
| AC-02-03 | Lisible imprimé en 10×10cm | manual |

---

## Out of Scope

- QR code par logement (MVP 2)
- QR code avec branding hébergeur (MVP 2)
- QR code avec tracking analytics (MVP 2)

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | Librairie de génération QR : `qrcode`, `sharp` + `qrcode`, ou service externe ? | owner | - | **Resolved** : `qrcode` + `sharp` côté serveur |
| OQ-02 | Faut-il un logo au centre du QR code (style) ? | owner | - | **Resolved** : Non — QR code simple (fond blanc, modules noirs) |
