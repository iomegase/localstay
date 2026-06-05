# Spec — 012 Guide Customization

## Metadata

```yaml
id: 012-guide-customization
title: "Personnalisation du guide par logement"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-06-04
depends_on: [010-dashboard-owner, 011-qr-code-owner, 002-categories, 003-poi-list]
```

---

## Context

Un Owner peut personnaliser l'expérience affichée aux Tourists de son logement. Il peut importer une photo du logement, rédiger un message d'accueil long, renseigner les informations pratiques, mettre en avant certains POI (ses recommandations personnelles), et modifier l'ordre des catégories. Ces personnalisations s'appliquent quand un Tourist arrive via le QR code du logement (`?lodging=[id]`) ou quand le mode séjour est conservé par cookie.

---

## Glossary References

- **Guide** : ensemble des catégories et POI pour une City
- **Lodging** : logement dont l'Owner personnalise le guide
- **Featured POI** : POI mis en avant par l'Owner dans une catégorie
- **Welcome Message** : message personnalisé affiché en haut du guide
- **Cover Photo** : photo du logement affichée sur la page d'accueil séjour
- **Practical Info** : informations pratiques du logement visibles dans la page logement

---

## User Stories

### US-01 — Message d'accueil personnalisé

**As an** Owner
**I want to** écrire un message d'accueil pour mes Tourists
**So that** ils se sentent accueillis et guidés dès l'arrivée

#### Acceptance Criteria

- **AC-01-01**: Given le formulaire de personnalisation, When l'Owner saisit un message d'accueil (max 400 mots), Then il est sauvegardé et affiché sur la page d'accueil séjour pour les Tourists de ce logement
- **AC-01-02**: Given un Tourist arrivant via `?lodging=[id]`, When la page `/` charge en mode séjour, Then la photo du logement, le message d'accueil si renseigné et un CTA vers `/guide/[city-slug]` s'affichent

### US-02 — Recommandations personnelles

**As an** Owner
**I want to** sélectionner mes POI favoris
**So that** mes Tourists découvrent les adresses que je recommande

#### Acceptance Criteria

- **AC-02-01**: Given la liste des POI d'une catégorie, When l'Owner en sélectionne jusqu'à 5 comme favoris, Then ces POI apparaissent dans la page `/nos-recommandations` pour les Tourists de ce logement
- **AC-02-02**: Given un POI favori, When l'Owner l'enregistre, Then il apparaît dans la page recommandations de l'Owner sans note personnelle ni rating Owner
- **AC-02-03**: Given les recommandations, When un Tourist arrive sans `?lodging=[id]`, Then le guide standard s'affiche sans personnalisation

### US-03 — Ordre des catégories

**As an** Owner
**I want to** réorganiser l'ordre des catégories
**So that** les catégories les plus pertinentes pour mes Tourists apparaissent en premier

#### Acceptance Criteria

- **AC-03-01**: Given le dashboard de personnalisation, When l'Owner réordonne les catégories par drag-and-drop, Then cet ordre est sauvegardé et appliqué pour les Tourists de ce logement

### US-04 — Informations pratiques et photo du logement

**As an** Owner
**I want to** renseigner les informations pratiques et importer une photo de mon logement
**So that** mes Tourists trouvent les informations utiles sans friction

#### Acceptance Criteria

- **AC-04-01**: Given le dashboard de personnalisation, When l'Owner renseigne les informations pratiques, Then elles sont sauvegardées et affichées sur `/le-logement`
- **AC-04-02**: Given le dashboard de personnalisation, When l'Owner importe une image valide, Then elle est convertie si nécessaire, stockée dans Supabase Storage et affichée en haut de la page d'accueil séjour

---

## Business Rules

- **BR-01**: La personnalisation est par Lodging — pas par Owner global
- **BR-02**: Sans `?lodging=[id]` dans l'URL, le guide standard s'affiche (pas de personnalisation)
- **BR-03**: Maximum 5 POI favoris par catégorie par Lodging
- **BR-04**: Aucun texte libre `owner_note` ni rating `owner_rating` n'est conservé sur les recommandations Owner. Un Featured POI est uniquement une sélection ordonnée.
- **BR-05**: Le message d'accueil est limité à 400 mots
- **BR-06**: La personnalisation n'ajoute pas de POI inexistants — elle filtre, réordonne et met en avant les POI déjà en base
- **BR-07**: Un Owner ne peut lire ou modifier que la personnalisation de ses propres Lodgings
- **BR-08**: Un POI favori doit appartenir au Guide de la City du Lodging : `poi.city_id = lodging.city_id`, `is_active = true`, `deleted_at = null`, `geocode_status != rejected`. Les POI de villages proches sont autorisés s'ils sont dans la zone du Guide (≤ 30 km du centre-ville selon les règles `003` / `008`).
- **BR-09**: Les POI hors périmètre (> 30 km, `geocode_status = rejected`) ne peuvent pas être mis en avant
- **BR-10**: Si `category_order` contient des slugs inconnus, inactifs ou sans POI visible, ces slugs sont isolés dans `ignored_category_slugs` et ne sont pas sauvegardés. Les catégories valides restantes sont sauvegardées ; aucun statut de Category n'est modifié par cette spec.
- **BR-11**: `featured_pois` accepte au maximum 100 entrées par requête comme limite technique, tout en appliquant la limite métier de 5 favoris par catégorie
- **BR-12**: Si un `lodging` valide est actif, le guide public de la City reste complet : les catégories et listes POI ne sont jamais filtrées exclusivement sur `featured_pois`. La personnalisation publique du Guide se limite au message d'accueil éventuel et à l'ordre des catégories ; les `featured_pois` sont visibles dans `/nos-recommandations`.
- **BR-13**: L'upload image Owner est autorisé pour les photos de logement. Les images sont validées côté serveur, limitées à 5 Mo et stockées dans le bucket `guide-photos`.
- **BR-14**: Les libellés publics utilisent le nom produit MyStay.

---

## Data Model

```prisma
model LodgingCustomization {
  id              String   @id @default(uuid())
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  deleted_at      DateTime?

  lodging_id      String   @unique
  lodging         Lodging  @relation(fields: [lodging_id], references: [id])
  welcome_message String?
  category_order  String[] # slugs des catégories dans l'ordre Owner
  cover_photo_url String?
  lodging_address String?
  wifi_ssid String?
  wifi_password String?
  parking_info String?
  equipment_info String?
  checkout_instructions String?
  trash_info String?
  trash_location String?
  house_rules String?
  emergency_contacts String?
  useful_services String?
}

model LodgingFeaturedPoi {
  id              String   @id @default(uuid())
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  deleted_at      DateTime?

  lodging_id      String
  lodging         Lodging         @relation(fields: [lodging_id], references: [id])
  poi_id          String
  poi             PointOfInterest @relation(fields: [poi_id], references: [id])
  sort_order      Int      @default(0)

  @@unique([lodging_id, poi_id])
  @@index([lodging_id])
  @@index([poi_id])
}
```

---

## API Contract

```yaml
paths:
  /api/dashboard/lodgings/{id}/customization:
    get:
      summary: "Récupérer la personnalisation d'un logement"
      tags: [guide-customization]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: Personnalisation du logement
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LodgingCustomizationResponse"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
    put:
      summary: "Sauvegarder la personnalisation"
      tags: [guide-customization]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                welcome_message:
                  type: string
                  description: "Max 400 mots"
                category_order:
                  type: array
                  items:
                    type: string
                featured_pois:
                  type: array
                  maxItems: 100
                  items:
                    type: object
                    required: [poi_id, sort_order]
                    properties:
                      poi_id: { type: string }
                      sort_order: { type: integer }
                cover_photo_url:
                  type: string
                  nullable: true
                lodging_address:
                  type: string
                  nullable: true
                wifi_ssid:
                  type: string
                  nullable: true
                wifi_password:
                  type: string
                  nullable: true
                parking_info:
                  type: string
                  nullable: true
                equipment_info:
                  type: string
                  nullable: true
                checkout_instructions:
                  type: string
                  nullable: true
                trash_info:
                  type: string
                  nullable: true
                trash_location:
                  type: string
                  nullable: true
                house_rules:
                  type: string
                  nullable: true
                emergency_contacts:
                  type: string
                  nullable: true
                useful_services:
                  type: string
                  nullable: true
      responses:
        "200":
          description: Personnalisation sauvegardée
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LodgingCustomizationResponse"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"

  /api/cities/{slug}:
    get:
      summary: "Guide public — données City avec personnalisation optionnelle"
      tags: [guide-customization]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
        - name: lodging
          in: query
          required: false
          schema:
            type: string
            format: uuid
          description: "lodging_id — active la personnalisation si présent"

  /api/cities/{slug}/categories:
    get:
      summary: "Catégories du Guide avec ordre personnalisé optionnel"
      tags: [guide-customization]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
        - name: lodging
          in: query
          required: false
          schema:
            type: string
            format: uuid

  /api/cities/{slug}/categories/{category-slug}/pois:
    get:
      summary: "Liste POI publique de la City, avec contexte lodging optionnel"
      tags: [guide-customization]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
        - name: category-slug
          in: path
          required: true
          schema:
            type: string
        - name: lodging
          in: query
          required: false
          schema:
            type: string
            format: uuid

components:
  schemas:
    LodgingCustomizationResponse:
      type: object
      required: [lodging_id, welcome_message, category_order, featured_pois, ignored_category_slugs]
      properties:
        lodging_id:
          type: string
        welcome_message:
          type: string
          nullable: true
        category_order:
          type: array
          items:
            type: string
        featured_pois:
          type: array
          items:
            $ref: "#/components/schemas/FeaturedPoi"
        ignored_category_slugs:
          type: array
          description: "Slugs inconnus, inactifs ou sans POI visible retirés de category_order"
          items:
            type: string

    FeaturedPoi:
      type: object
      required: [poi_id, category_id, sort_order]
      properties:
        poi_id:
          type: string
        category_id:
          type: string
        sort_order:
          type: integer

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
            details: { type: object }

  responses:
    BadRequest:
      description: Paramètre invalide, limite dépassée ou POI hors périmètre
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Unauthorized:
      description: Non authentifié
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Forbidden:
      description: Le logement n'appartient pas à cet Owner
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    NotFound:
      description: Logement introuvable
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
```

---

## UI Behaviour

### Page `/dashboard/lodgings/[id]/customize`
- Section "Message d'accueil" : textarea Shadcn, compteur mots
- Section "Photo du logement" : upload image Owner, validation serveur, URL publique sauvegardée
- Section "Infos pratiques" : adresse, Wi-Fi, parking, équipements, checkout, déchets, règles, contacts d'urgence, services utiles
- Section "Mes recommandations" : liste des catégories, chaque catégorie expand pour voir/sélectionner les POI favoris
- Les POI proposés à la sélection sont ceux du Guide de la City du Lodging, y compris la section "Aux alentours" si le POI reste dans le périmètre ≤ 30 km
- Aucun champ note personnelle ni rating par POI sélectionné
- Section "Ordre des catégories" : drag-and-drop (dnd-kit)
- Bouton "Sauvegarder" sticky en bas
- Preview : bouton "Voir le guide comme un Tourist" → ouvre `/guide/[city-slug]?lodging=[id]` dans un nouvel onglet

### Pages publiques
- `/` en mode séjour affiche la photo du logement, le message d'accueil et un CTA vers `/guide/[city-slug]`
- `/le-logement` affiche les informations pratiques du logement
- `/nos-recommandations` affiche les POI recommandés par l'Owner, groupés par catégorie, sans note personnelle ni rating Owner
- `/guide/[city-slug]?lodging=[id]` affiche tous les POI disponibles du Guide de la City, avec message d'accueil et ordre personnalisé éventuels, sans filtrage exclusif sur les recommandations Owner
- `/guide/[city-slug]/[category-slug]?lodging=[id]` affiche tous les POI disponibles de cette catégorie dans le Guide de la City, sans filtrage exclusif sur les recommandations Owner
- Si `lodging` est absent, inconnu, supprimé, inactif ou associé à une autre City, le guide standard s'affiche sans personnalisation

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Message d'accueil sauvegardé | integration |
| AC-01-02 | Accueil séjour affiche photo, message et CTA guide | integration |
| AC-02-01 | POI favoris affichés dans `/nos-recommandations` | integration |
| AC-02-02 | Recommandation affichée sans note/rating Owner | integration |
| AC-02-03 | Sans lodging param → guide standard | unit |
| AC-03-01 | Ordre catégories sauvegardé et appliqué | integration |
| AC-04-01 | Infos pratiques sauvegardées et affichées | integration |
| AC-04-02 | Upload photo logement sauvegardé et affiché | contract + unit |
| BR-07 | Owner isolation sur GET/PUT customization | contract |
| BR-08/09 | POI favori limité au périmètre du Guide | unit |
| BR-10 | Catégories invalides isolées et non sauvegardées | unit |
| BR-12 | Guide public complet conservé en mode lodging ; recommandations visibles sur `/nos-recommandations` | unit |

---

## Out of Scope

- Ajout de POI custom non référencés par Gemini (MVP 3)
- Personnalisation des photos des POI (MVP 3)
- Note personnelle ou rating Owner sur une recommandation POI
- Guide multilingue par logement (post-MVP)

---

## Open Questions

Aucune — spec complète et approuvée.
