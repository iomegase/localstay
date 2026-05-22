# Spec — 012 Guide Customization

## Metadata

```yaml
id: 012-guide-customization
title: "Personnalisation du guide par logement"
status: draft
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-05-22
depends_on: [010-dashboard-owner, 002-categories, 003-poi-list]
```

---

## Context

Un Owner peut personnaliser le guide affiché aux Tourists de son logement. Il peut mettre en avant certains POI (ses recommandations personnelles), modifier l'ordre des catégories, et ajouter un message d'accueil. Ces personnalisations s'appliquent uniquement quand un Tourist arrive via le QR code du logement (`?lodging=[id]`).

---

## Glossary References

- **Guide** : ensemble des catégories et POI pour une City
- **Lodging** : logement dont l'Owner personnalise le guide
- **Featured POI** : POI mis en avant par l'Owner dans une catégorie
- **Welcome Message** : message personnalisé affiché en haut du guide

---

## User Stories

### US-01 — Message d'accueil personnalisé

**As an** Owner
**I want to** écrire un message d'accueil pour mes Tourists
**So that** ils se sentent accueillis et guidés dès l'arrivée

#### Acceptance Criteria

- **AC-01-01**: Given le formulaire de personnalisation, When l'Owner saisit un message d'accueil (max 300 caractères), Then il est sauvegardé et affiché en haut du guide pour les Tourists de ce logement
- **AC-01-02**: Given un Tourist arrivant via `?lodging=[id]`, When le guide charge, Then le message d'accueil s'affiche si renseigné

### US-02 — Recommandations personnelles

**As an** Owner
**I want to** mettre en avant mes POI favoris
**So that** mes Tourists découvrent les adresses que je recommande

#### Acceptance Criteria

- **AC-02-01**: Given la liste des POI d'une catégorie, When l'Owner en sélectionne jusqu'à 5 comme favoris, Then ces POI apparaissent en tête de liste pour les Tourists de ce logement
- **AC-02-02**: Given un POI favori, When l'Owner ajoute une note personnelle (max 150 caractères), Then cette note s'affiche sur la card POI pour les Tourists du logement
- **AC-02-03**: Given les recommandations, When un Tourist arrive sans `?lodging=[id]`, Then le guide standard s'affiche sans personnalisation

### US-03 — Ordre des catégories

**As an** Owner
**I want to** réorganiser l'ordre des catégories
**So that** les catégories les plus pertinentes pour mes Tourists apparaissent en premier

#### Acceptance Criteria

- **AC-03-01**: Given le dashboard de personnalisation, When l'Owner réordonne les catégories par drag-and-drop, Then cet ordre est sauvegardé et appliqué pour les Tourists de ce logement

---

## Business Rules

- **BR-01**: La personnalisation est par Lodging — pas par Owner global
- **BR-02**: Sans `?lodging=[id]` dans l'URL, le guide standard s'affiche (pas de personnalisation)
- **BR-03**: Maximum 5 POI favoris par catégorie par Lodging
- **BR-04**: La note personnelle d'un POI est limitée à 150 caractères
- **BR-05**: Le message d'accueil est limité à 300 caractères
- **BR-06**: La personnalisation n'ajoute pas de POI inexistants — elle réordonne et met en avant les POI déjà en base

---

## Data Model

```prisma
model LodgingCustomization {
  id              String   @id @default(uuid())
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  lodging_id      String   @unique
  lodging         Lodging  @relation(fields: [lodging_id], references: [id])
  welcome_message String?  @db.VarChar(300)
  category_order  String[] # slugs des catégories dans l'ordre Owner
}

model LodgingFeaturedPoi {
  id              String   @id @default(uuid())
  created_at      DateTime @default(now())

  lodging_id      String
  lodging         Lodging         @relation(fields: [lodging_id], references: [id])
  poi_id          String
  poi             PointOfInterest @relation(fields: [poi_id], references: [id])
  owner_note      String?  @db.VarChar(150)
  sort_order      Int      @default(0)

  @@unique([lodging_id, poi_id])
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
    put:
      summary: "Sauvegarder la personnalisation"
      tags: [guide-customization]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                welcome_message:
                  type: string
                  maxLength: 300
                category_order:
                  type: array
                  items:
                    type: string
                featured_pois:
                  type: array
                  maxItems: 25
                  items:
                    type: object
                    properties:
                      poi_id: { type: string }
                      owner_note: { type: string, maxLength: 150 }
                      sort_order: { type: integer }

  /api/guide/{city-slug}:
    get:
      summary: "Guide public — avec personnalisation si lodging fourni"
      tags: [guide-customization]
      parameters:
        - name: lodging
          in: query
          required: false
          schema:
            type: string
          description: "lodging_id — active la personnalisation si présent"
```

---

## UI Behaviour

### Page `/dashboard/lodgings/[id]/customize`
- Section "Message d'accueil" : textarea Shadcn, compteur caractères
- Section "Mes recommandations" : liste des catégories, chaque catégorie expand pour voir/sélectionner les POI favoris
- Champ note personnelle par POI sélectionné
- Section "Ordre des catégories" : drag-and-drop (dnd-kit)
- Bouton "Sauvegarder" sticky en bas
- Preview : bouton "Voir le guide comme un Tourist" → ouvre `/guide/[city-slug]?lodging=[id]` dans un nouvel onglet

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Message d'accueil sauvegardé | integration |
| AC-01-02 | Message affiché si lodging param présent | integration |
| AC-02-01 | POI favoris en tête de liste | integration |
| AC-02-02 | Note personnelle affichée sur card | integration |
| AC-02-03 | Sans lodging param → guide standard | unit |
| AC-03-01 | Ordre catégories sauvegardé et appliqué | integration |

---

## Out of Scope

- Ajout de POI custom non référencés par Gemini (MVP 3)
- Personnalisation des photos des POI (MVP 3)
- Guide multilingue par logement (post-MVP)

---

## Open Questions

Aucune — spec complète et prête pour review.
