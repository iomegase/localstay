# Spec — 066 Acquisition POI : périmètre du village, statut d'ouverture, recherche par nom

## Metadata

```yaml
id: 066-acquisition-village-scope
title: "Réduire le bruit de l'acquisition entre villages voisins et retrouver les établissements fermés temporairement"
status: review
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 018-poi-acquisition-pipeline
bounded_context: poi-acquisition
amends:
  - "018 US-01 (pipeline de recherche), US-04 (création manuelle), BR-16 (coûts)"
implementation_gate: "Ne pas coder avant status: approved et réponse PO aux Open Questions."
```

---

## Context

Constats PO et diagnostic du 2026-10-06 :

1. **Bruit entre villages.** Saint-Gervais, Saint-Nicolas-de-Véroce, Les Contamines,
   Combloux et Megève sont à 3–11 km les uns des autres. La recherche Google Places
   est seulement *orientée* vers un cercle de 30 km (`locationBias`), qui couvre tous
   ces villages. L'adresse ne permet pas de trier : Saint-Nicolas et Le Bettex font
   partie de la commune de Saint-Gervais (« 74170 Saint-Gervais-les-Bains » pour le
   Bistrot du Mont Joly), et Les Contamines ont aussi le code postal 74170.
2. **Établissements absents.** Notre code ne filtre pas le statut d'ouverture (le champ
   `businessStatus` n'est même pas demandé), mais la recherche générique de Google
   écarte les lieux « fermés temporairement ». Test du 2026-10-06 : « Le Galeta
   Saint-Gervais-les-Bains » renvoie bien `CLOSED_TEMPORARILY` ; « Dîner » et
   « Restaurants Saint-Gervais-les-Bains » renvoient 60 résultats chacune, tous
   `OPERATIONAL`, sans Le Galeta. En montagne, l'intersaison rend ce cas fréquent.
3. **Résultats tronqués.** Seuls 20 résultats par requête sont lus ; Google en fournit
   jusqu'à 60 par pagination.
4. **Donnée erronée.** La City `les-contamines-montjoie` a pour centre 43,67° N /
   7,19° E (région de Nice) au lieu d'environ 45,82° N / 6,73° E (voir OQ-03).

---

## Glossary References

- **Run d'acquisition** — `PoiAcquisitionRun` (ville + catégorie), spec 018.
- **Candidat** — `PoiAcquisitionCandidate`, revu par l'admin avant publication.
- **Village de rattachement** — City active dont le centre est le plus proche du lieu.
- **Statut d'ouverture** — `businessStatus` Google Places : `OPERATIONAL`,
  `CLOSED_TEMPORARILY`, `CLOSED_PERMANENTLY`.

---

## User Stories

### US-01 — Ne proposer que les lieux du village

**As a** Admin lançant une acquisition pour Saint-Gervais

**I want to** ne recevoir que les lieux plus proches de Saint-Gervais que d'un autre village actif

**So that** je ne trie plus les restaurants de Saint-Nicolas ou de Combloux

#### Acceptance Criteria

- **AC-01-01**: Given un résultat Google Places avec une position, When le run
  s'exécute, Then sa distance au centre de **chaque** City active est calculée, et le
  résultat n'est conservé que si la City du run est la plus proche.
- **AC-01-02**: Given un résultat plus proche d'une autre City active, When le run
  s'exécute, Then il n'est pas créé comme candidat (OQ-01), aucun appel Gemini,
  Mapbox ni site officiel n'est fait pour lui, et le compteur
  `skipped_other_village` du run est incrémenté.
- **AC-01-03**: Given un résultat sans position Google, When le run s'exécute, Then il
  est conservé et traité comme aujourd'hui (pas de filtre possible).
- **AC-01-04**: Given le détail d'un run, When il s'affiche, Then le résumé indique
  « N lieux ignorés car plus proches d'un autre village ».

### US-02 — Connaître le statut d'ouverture

**As a** Admin

**I want to** savoir si un candidat est fermé temporairement, et ne jamais recevoir de lieu fermé définitivement

**So that** je publie en connaissance de cause, notamment à l'intersaison

#### Acceptance Criteria

- **AC-02-01**: Given une recherche Google Places, When elle est envoyée, Then le
  masque de champs inclut `places.businessStatus` et `places.location`.
- **AC-02-02**: Given un résultat `CLOSED_PERMANENTLY`, When le run s'exécute, Then il
  n'est pas créé comme candidat et le compteur `skipped_closed_permanently` est
  incrémenté.
- **AC-02-03**: Given un résultat `CLOSED_TEMPORARILY`, When le candidat est créé,
  Then `business_status = CLOSED_TEMPORARILY` est enregistré et la revue affiche un
  badge « Fermé temporairement (souvent saisonnier) ». La publication reste possible.

### US-03 — Lire tous les résultats disponibles

**As a** Admin

**I want to** que chaque requête lise jusqu'à 60 résultats

**So that** les adresses moins bien classées par Google ne soient pas perdues

#### Acceptance Criteria

- **AC-03-01**: Given une requête du run, When Google renvoie un `nextPageToken`, Then
  la page suivante est lue, dans la limite de 3 pages (60 résultats) par requête.
- **AC-03-02**: Given plusieurs pages, When elles sont fusionnées, Then la
  déduplication par `google_place_id` existante s'applique.

### US-04 — Ajouter un lieu précis par son nom

**As a** Admin

**I want to** chercher un établissement par son nom dans Admin › Acquisition

**So that** je retrouve un lieu que la recherche générique n'a pas proposé (ex. Le Galeta)

#### Acceptance Criteria

- **AC-04-01**: Given le formulaire « Ajouter un lieu précis » (City, Category, nom),
  When l'admin lance la recherche, Then au plus 5 résultats Google Places sont
  affichés avec nom, adresse, statut d'ouverture et village de rattachement.
- **AC-04-02**: Given un résultat choisi, When l'admin le valide, Then un run de source
  `google_places_name` est créé pour la City et la Category choisies, avec ce seul
  candidat, traité par le pipeline existant (site officiel, description Gemini,
  géocodage Mapbox, doublons) puis soumis à la revue habituelle.
- **AC-04-03**: Given un résultat rattaché à un autre village, When il est affiché,
  Then un avertissement « Plus proche de {village} » apparaît ; l'admin peut quand
  même le choisir (choix explicite).

---

## Business Rules

- **BR-01**: Le rattachement au village utilise la position fournie par Google Places
  **uniquement pour filtrer**. Elle n'est jamais stockée ; les coordonnées du POI
  restent celles de Mapbox (018 BR-03 inchangé).
- **BR-02**: Le village de rattachement est la City active (`is_active`, non
  supprimée) dont le centre est le plus proche (distance haversine). En cas
  d'égalité, la City du run est retenue.
- **BR-03**: Le filtre village et le filtre `CLOSED_PERMANENTLY` s'appliquent **avant**
  tout appel Gemini, Mapbox ou site officiel, pour ne payer que les candidats utiles
  (018 BR-16).
- **BR-04**: Pagination limitée à 3 pages par requête (plafond Google : 60 résultats).
- **BR-05**: La recherche par nom (US-04) n'applique pas le filtre village : le choix
  de l'admin prime, avec avertissement.
- **BR-06**: Gemini n'intervient ni dans la recherche, ni dans le rattachement (ADR-006).

---

## Data Model

Migration additive :

```prisma
model PoiAcquisitionRun {
  // …champs existants
  skipped_other_village      Int @default(0)
  skipped_closed_permanently Int @default(0)
}

model PoiAcquisitionCandidate {
  // …champs existants
  business_status String?   // OPERATIONAL | CLOSED_TEMPORARILY ; null si inconnu
}
```

`PoiAcquisitionRun.source` accepte la nouvelle valeur `google_places_name`.

---

## API Contract

```yaml
/api/admin/poi-acquisition/runs/{id}:
  get:
    200: # ajout aux champs existants
      data:
        skipped_other_village: integer
        skipped_closed_permanently: integer
        candidates[]:
          business_status: string | null

/api/admin/poi-acquisition/name-search:
  post:
    auth: admin
    body: { city_id: uuid, query: string (2..120) }   # Zod
    200:
      data:
        - google_place_id: string
          name: string
          address: string
          business_status: OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY | null
          nearest_city: { slug: string, name: string } | null
          is_other_village: boolean
    400: { error: { code: VALIDATION_ERROR } }
    404: { error: { code: CITY_NOT_FOUND } }
    502: { error: { code: GOOGLE_PLACES_UNAVAILABLE } }

/api/admin/poi-acquisition/runs:
  post:
    body: # ajout optionnel
      google_place_id?: string   # US-04 : run à candidat unique, source google_places_name
```

---

## UI Behaviour

- `/admin/poi-acquisition` : nouveau bloc « Ajouter un lieu précis » (City, Category,
  champ nom, bouton Rechercher) ; liste de résultats avec badge de statut et
  avertissement « Plus proche de … » ; bouton « Ajouter » par résultat.
- `/admin/poi-acquisition/runs/{id}` : ligne de résumé des lieux ignorés ; badge
  ambre « Fermé temporairement (souvent saisonnier) » sur les candidats concernés.
- Composants Shadcn/ui existants de l'admin.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01 | Rattachement au centre de City active le plus proche | unit |
| AC-01-02 | Lieu d'un autre village ignoré, sans appel Gemini/Mapbox, compté | integration |
| AC-01-03 | Lieu sans position conservé | unit |
| AC-01-04 | Résumé des lieux ignorés dans le détail du run | integration |
| AC-02-01 | Masque de champs avec businessStatus et location | unit |
| AC-02-02 | Fermé définitivement ignoré et compté | integration |
| AC-02-03 | Fermé temporairement enregistré + badge | integration |
| AC-03-01 | Pagination jusqu'à 3 pages | unit |
| AC-03-02 | Dédoublonnage multi-pages | unit |
| AC-04-01 | Recherche par nom : 5 résultats max, statut, village | contract |
| AC-04-02 | Ajout d'un résultat → run à candidat unique | contract |
| AC-04-03 | Avertissement « Plus proche de … » | integration |

---

## Out of Scope

- Réaffectation d'un candidat à une autre City pendant la revue.
- Rayon de recherche paramétrable par City.
- Re-vérification périodique du statut d'ouverture des POI déjà publiés.
- Correction des coordonnées des Cities (action de données, voir OQ-03).
- Zones « principale / Aux alentours » de `/decouvrir` (règle globale inchangée).

---

## Open Questions

- **OQ-01** — `pending` — Lieux plus proches d'un autre village : les **ignorer**
  (non créés, seulement comptés, recommandé) **ou** les créer avec un badge
  « Plus proche de … » et décochés par défaut ?
- **OQ-02** — `pending` — Pagination à 60 résultats : jusqu'à 3× plus d'appels Google
  Text Search par run. Le filtre village (BR-03) évite les coûts Gemini et Mapbox
  pour les lieux écartés. On l'active ? (recommandé : oui)
- **OQ-03** — `pending` — Corriger maintenant le centre de Les Contamines-Montjoie
  (45,8214 / 6,7272) directement en base, ou le fais-tu dans Admin › Villes ?
  Sans correction, l'acquisition et le filtre village sont faux pour ce village.
