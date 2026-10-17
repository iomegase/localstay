# Spec — 103 Photos Google Maps affichées en direct (POI sans photo)

## Metadata

```yaml
id: 103-google-places-photos
title: "POI sans photo : photos Google Maps chargées en direct par l'API Places, créditées, jamais stockées"
status: approved
mvp: 1
owner: "Product Owner"
created_at: 2026-10-17
updated_at: 2026-10-17
depends_on:
  - 041-public-local-discovery
  - 063-poi-photo-mirroring
  - 101-poi-open-sources
bounded_context: poi-photos
implementation_gate: "PO 2026-10-17 : Brasserie les Rhodos sans photo (site = Instagram, aucune photo Commons) ; « il faut tout récupérer » ; option A : photos Google Maps en direct avec crédits, jamais stockées, coût par affichage accepté."
```

## Context

Pour certains lieux (Brasserie les Rhodos), les seules photos existantes sont sur Google Maps. Les
conditions de Google Maps Platform interdisent de stocker ou mettre en cache ces photos (ni l'image,
ni son URL, ni son nom de ressource) : seul l'identifiant du lieu (`google_place_id`) peut être
conservé. Les photos sont donc demandées à chaque affichage et créditées à leurs auteurs.

## Glossary refs
POI ; Fiche POI ; Crédit photo.

## User Stories

### US-01 — Voir les photos Google d'un lieu sans photo
- **AC-01-01**: Given une fiche POI (page publique, fiche du guide privé) d'un lieu actif **sans photo
  MyStay** (aucune photo enregistrée) avec un `google_place_id`, When la fiche s'affiche dans le
  navigateur, Then jusqu'à 3 photos Google Maps sont chargées et montrées sous la photo principale.
- **AC-01-02**: Chaque affichage les redemande : rien n'est stocké en base, ni mis en cache
  (`Cache-Control: no-store`), ni copié dans le stockage MyStay (miroir spec 063 exclu).
- **AC-01-03**: Les crédits s'affichent avec les photos : « Photos : Auteur · Auteur — Google Maps »,
  chaque auteur lié à son profil Google.
- **AC-01-04**: Aucune photo renvoyée, API en erreur ou fonction désactivée : rien ne s'affiche (la
  photo de remplacement reste) et la fiche fonctionne normalement.

### US-02 — Maîtrise du coût
- **AC-02-01**: La fonction n'est active que si `GOOGLE_PLACES_PHOTOS_ENABLED=true` (désactivée par
  défaut) : aucune requête Google sinon.
- **AC-02-02**: Les photos ne sont chargées que sur les fiches détaillées, jamais dans les listes, et
  côté navigateur (les robots d'indexation ne les déclenchent pas) ; 3 photos au plus par affichage.
- **AC-02-03**: `GET /api/places/photos?poi=<uuid>` ne sert que les POI actifs, non supprimés, sans
  photo MyStay et avec un `google_place_id` ; sinon 404.

## Business Rules
- **BR-01**: Seul `google_place_id` est conservé (conditions Google Maps Platform) ; les URL Google
  renvoyées sont temporaires et utilisées immédiatement par le navigateur.
- **BR-02**: Attribution obligatoire : auteurs (`authorAttributions`) + « Google Maps ».
- **BR-03**: Les photos MyStay (enregistrées, Commons, site officiel) ont toujours la priorité : un POI
  qui en a n'appelle jamais Google.

## Data Model
Aucun changement (`PointOfInterest.google_place_id` existant).

## API Contract
- `GET /api/places/photos?poi=<uuid>` (public) → 200 `{ data: { photos: Array<{ url, width, height,
  authors: Array<{ name, uri | null }> }> } }`, `Cache-Control: no-store` ; 400 `INVALID_INPUT` (Zod) ;
  404 `NOT_FOUND` (POI inéligible ou fonction désactivée).
- Fiche publique (`DiscoveryPoiDetail`) : `google_photos_ref: string | null` — identifiant du POI quand
  la fonction est active et qu'il n'a aucune photo MyStay. La lecture publique ne lit jamais
  `google_place_id` (spec 041) : c'est la route qui le vérifie (404 sans appel Google sinon).

## UI Behaviour
Bande de 3 vignettes sous la photo principale, ouvrables en grand ; crédits dessous en petit. Pendant
le chargement : rien (pas de place réservée).

## Acceptance Criteria
AC-01-01 à AC-02-03, BR-01 à BR-03.

## Out of Scope
Photos Google dans les listes, les cartes ou la démo ; remplacement de la photo principale ; avis Google.

## Open Questions
Aucune.
