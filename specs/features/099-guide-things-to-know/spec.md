# Spec — 099 Guide logement : section « Choses à savoir »

## Metadata

```yaml
id: 099-guide-things-to-know
title: "Section « Choses à savoir » du guide logement : cartes accordéon saisies par l'Owner (photos, titre, description)"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-17
updated_at: 2026-10-18
depends_on:
  - 054-private-guide-stay-redesign
  - 077-owner-lodgings-guide-ui
  - 070-fallback-image-library
  - 061-private-guide-i18n
bounded_context: guide-customization
implementation_gate: "PO 2026-10-17 : « créer une nouvelle section Choses à savoir » ; « cards pour que owner puisse renseigner une ou plusieurs photos, un titre, une description ; accordéon card : photo + titre, description ; zoom in on click sur photo »."
```

## Context

Le guide logement (spec 054 AC-04-01) présente les équipements, le règlement et le point de tri.
Le propriétaire n'a aucun endroit pour signaler les particularités de son logement (volet
capricieux, chauffage à relancer, local à skis…). La section « Choses à savoir » lui permet de
les décrire avec ses propres photos.

## Glossary refs
Owner ; Guide logement (écran « Guide logement » du guide privé) ; Page Guide (`/dashboard/lodgings/{id}/customize`).

## User Stories

### US-01 — L'Owner renseigne ses « Choses à savoir »
- **AC-01-01**: Given la page Guide, section « Sur place », When l'Owner clique « Ajouter une chose à
  savoir », Then une carte s'ajoute avec les champs Titre (obligatoire, 120 caractères max),
  Description (facultative, 2000 caractères max, Markdown simple) et Photos (facultatives, 5 max,
  téléversement multiple).
- **AC-01-02**: L'Owner réordonne les cartes (glisser-déposer), retire une photo, supprime une carte.
- **AC-01-05** (PO 2026-10-17 : « pouvoir sélectionner le hero de la card ») : la première photo est
  l'**image principale** (vignette de la carte, AC-02-02), signalée « Image principale » ; « ★ » sur
  une autre photo la place en tête (les autres gardent leur ordre).
- **AC-01-03**: Une carte sans titre bloque l'enregistrement avec « Le titre est requis. » sous le
  champ (mêmes règles côté client et API, spec 083).
- **AC-01-04**: L'enregistrement de la page Guide crée, met à jour et supprime (suppression douce) les
  cartes ; l'ordre envoyé fait foi.

### US-02 — Le voyageur consulte la section
- **AC-02-01**: Given le guide logement d'un logement avec au moins une carte, Then la section
  « Choses à savoir » s'affiche entre « Point de tri » et « Équipements » (amendement PO du 2026-10-18, voir spec 054 AC-04-02). Sans carte, elle est absente.
- **AC-02-02**: Chaque carte est un accordéon fermé : vignette (première photo, si présente) + titre
  + « + ». Toucher le titre déplie la description (et les autres photos) ; « − » la replie.
- **AC-02-03**: Toucher une photo l'ouvre en plein écran (carrousel des photos de la carte, spec 054
  `MediaLightbox`).
- **AC-02-04**: En anglais, titre et description sont traduits (spec 061).
- **AC-02-05** (PO 2026-10-17 : « adapter la photo à l'écran ») : en plein écran, chaque photo est
  centrée et réduite pour tenir dans l'écran (80 % de la hauteur au plus), sans bande noire, quel que
  soit son format ; s'applique à toutes les photos du guide affichées par `MediaLightbox`.

## Business Rules
- **BR-01**: 5 photos maximum par carte ; titre obligatoire.
- **BR-02**: Les photos des cartes sont des références actives pour le nettoyage du stockage (spec 070) ;
  une photo retirée à l'enregistrement est supprimée du stockage si plus rien ne la référence.
- **BR-03**: Suppression douce uniquement (`deleted_at`).
- **BR-04**: La démo publique (spec 045) n'affiche pas cette section.

## Data Model

```prisma
model LodgingThingToKnow {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  lodging_id String
  lodging    Lodging  @relation(fields: [lodging_id], references: [id])
  title      String
  body       String?
  photos     String[]
  sort_order Int      @default(0)

  @@index([lodging_id, deleted_at])
}
```

## API Contract
- `GET /api/dashboard/lodgings/{id}/customization` : ajoute `things_to_know: Array<{ id, title, body | null, photos: string[], sort_order }>`.
- `PUT /api/dashboard/lodgings/{id}/customization` : accepte `things_to_know[]`
  `{ id?, title (1–120), body? (≤ 2000), photos (URL, ≤ 5), sort_order }` (Zod) ; 400 `INVALID_BODY`
  avec `details.issues[].path` (`things_to_know.0.title`) ; 400 `INVALID_CHILD_ITEM_ID` pour un id inconnu.
- Photos téléversées par `POST /api/dashboard/lodgings/{id}/cover-photo` (existant).

## UI Behaviour
- Owner : carte « Choses à savoir » sous les équipements (section « Sur place ») ; chaque ligne :
  poignée, Titre, Description, Photos (n / 5), Supprimer.
- Voyageur : pastille « Choses à savoir » ; liste de cartes accordéon (style `STAY_CARD`) ; vignette
  76 px cliquable (zoom) ; titre + « + » / « − » ; contenu déplié : description, puis miniatures des
  autres photos (cliquables).

## Acceptance Criteria
AC-01-01 à AC-02-05 (dont AC-01-05), BR-01 à BR-04.

## Out of Scope
Vidéo dans une carte ; bibliothèque partagée de « Choses à savoir » ; affichage sur la page publique
`/le-logement` ; contenu dans la démo publique.

## Open Questions
Aucune.
